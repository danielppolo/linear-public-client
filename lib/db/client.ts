import Cloudflare from "cloudflare"

export type D1Client = {
  query: <T = unknown>(
    sql: string,
    params?: unknown[]
  ) => Promise<{ results: T[]; meta?: { changes?: number; last_row_id?: number } }>
  execute: (sql: string, params?: unknown[]) => Promise<{ meta?: { changes?: number; last_row_id?: number } }>
}

// Helper to safely escape and substitute parameters in SQL
// Note: This is a basic implementation. For production, consider using a proper SQL builder
// or verifying that D1's API supports parameterized queries natively
function buildParameterizedSql(sql: string, params?: unknown[]): string {
  if (!params || params.length === 0) {
    return sql
  }

  // Simple parameter substitution - escape single quotes and wrap strings
  let paramIndex = 0
  return sql.replace(/\?/g, () => {
    if (paramIndex >= params.length) {
      throw new Error("Not enough parameters provided for SQL query")
    }

    const param = params[paramIndex++]

    if (param === null || param === undefined) {
      return "NULL"
    }

    if (typeof param === "string") {
      // Escape single quotes and wrap in quotes
      const escaped = param.replace(/'/g, "''")
      return `'${escaped}'`
    }

    if (typeof param === "number" || typeof param === "boolean") {
      return String(param)
    }

    // For objects/arrays, stringify and escape
    const escaped = JSON.stringify(param).replace(/'/g, "''")
    return `'${escaped}'`
  })
}

export function createD1Client(cf: Cloudflare, databaseId: string, accountId: string): D1Client {
  return {
    async query<T = unknown>(sql: string, params?: unknown[]) {
      const finalSql = buildParameterizedSql(sql, params)

      const result = await cf.d1.database.query(databaseId, {
        account_id: accountId,
        sql: finalSql,
      })

      // The Cloudflare SDK returns QueryResultsSinglePage with a result array
      const results = (result.result as T[]) || []

      return {
        results,
        meta: undefined, // QueryResultsSinglePage doesn't expose meta directly
      }
    },

    async execute(sql: string, params?: unknown[]) {
      const finalSql = buildParameterizedSql(sql, params)

      await cf.d1.database.query(databaseId, {
        account_id: accountId,
        sql: finalSql,
      })

      return {
        meta: undefined, // QueryResultsSinglePage doesn't expose meta directly
      }
    },
  }
}

