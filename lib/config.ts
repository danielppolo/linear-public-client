export type ProjectConfig = {
  apiKey?: string
  projectId?: string
  teamId?: string
}

export function resolveProjectConfig(envKeyPrefix: string): ProjectConfig {
  const getValue = (suffix: string) => {
    const raw = process.env[`${envKeyPrefix}_${suffix}`]?.trim()
    return raw && raw.length ? raw : undefined
  }

  return {
    apiKey: getValue("API_KEY"),
    projectId: getValue("PROJECT_ID"),
    teamId: getValue("TEAM_ID"),
  }
}
