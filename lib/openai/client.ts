export function isAIEnabled(): boolean {
  const enabled = process.env.ENABLE_AI?.toLowerCase().trim()
  return enabled === "true" || enabled === "1"
}

export function getOpenAIApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY?.trim()
}

export function requireOpenAIApiKey(): string {
  const apiKey = getOpenAIApiKey()
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set in environment variables")
  }
  return apiKey
}

export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini"
}

