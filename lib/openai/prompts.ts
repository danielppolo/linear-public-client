import type { IssueStructureInput } from "./types"

export function generateIssueStructurePrompt(input: IssueStructureInput): string {
  const { content, type, metadata } = input

  let prompt = `You are a technical product manager helping to convert customer ${type} reports into well-structured Linear issues.

Customer Request:
${content}
`

  if (metadata) {
    if (metadata.env) {
      prompt += `\nEnvironment: ${metadata.env}`
    }
    if (metadata.app_version) {
      prompt += `\nApp Version: ${metadata.app_version}`
    }
  }

  prompt += `\n\nPlease analyze this ${type} report and provide a structured Linear issue in JSON format with the following fields:
- title: A concise, descriptive title (max 100 characters)
- description: A detailed description with context, steps to reproduce (for bugs), or implementation details (for features)
- labels: An array of relevant label names (e.g., ["bug", "frontend", "ui"] or ["feature", "backend", "api"])
- priority: A priority number where 0 = No priority, 1 = Urgent, 2 = High, 3 = Medium, 4 = Low

Return ONLY valid JSON in this exact format:
{
  "title": "...",
  "description": "...",
  "labels": ["..."],
  "priority": 2
}`

  return prompt
}

