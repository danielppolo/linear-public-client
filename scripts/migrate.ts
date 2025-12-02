import { readFileSync } from "fs"
import { join } from "path"
import { getD1Client } from "@/lib/db/get-client"

async function migrate() {
  try {
    console.log("Running database migrations...")

    const db = getD1Client()

    // Read migration file
    const migrationPath = join(process.cwd(), "lib/db/migrations/001_initial.sql")
    const migrationSql = readFileSync(migrationPath, "utf-8")

    // Split migration into individual statements
    const statements = migrationSql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    for (const statement of statements) {
      const sql = statement + ";"
      console.log(`Executing: ${sql.substring(0, 100)}...`)
      await db.execute(sql)
    }

    console.log("Migrations completed successfully!")
  } catch (error) {
    console.error("Migration failed:", error)
    process.exit(1)
  }
}

migrate()

