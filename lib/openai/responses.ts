import type {
  CreationResponseInput,
  IssueStructureInput,
  ResolutionResponseInput,
  StructuredIssueSuggestion,
  UserResponse,
} from "./types"
import { isAIEnabled, requireOpenAIApiKey, getOpenAIModel } from "./client"
import { generateIssueStructurePrompt } from "./prompts"

export async function generateIssueStructure(
  input: IssueStructureInput
): Promise<StructuredIssueSuggestion | null> {
  if (!isAIEnabled()) {
    return null
  }

  try {
    const apiKey = requireOpenAIApiKey()
    const model = getOpenAIModel()

    const prompt = generateIssueStructurePrompt(input)

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a technical product manager. Always respond with valid JSON only, no additional text or markdown formatting.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
    }

    const data = (await response.json()) as {
      choices: Array<{
        message: {
          content: string
        }
      }>
    }

    const content = data.choices[0]?.message?.content
    if (!content) {
      throw new Error("No content in OpenAI response")
    }

    const parsed = JSON.parse(content) as StructuredIssueSuggestion

    // Validate structure
    if (!parsed.title || !parsed.description) {
      throw new Error("Invalid structure from OpenAI: missing title or description")
    }

    return {
      title: parsed.title,
      description: parsed.description,
      labels: Array.isArray(parsed.labels) ? parsed.labels : [],
      priority: typeof parsed.priority === "number" ? parsed.priority : 2,
    }
  } catch (error) {
    console.error("Failed to generate issue structure with OpenAI:", error)
    return null
  }
}

export async function generateCreationResponse(
  input: CreationResponseInput
): Promise<string | null> {
  if (!isAIEnabled()) {
    return null
  }

  try {
    const apiKey = requireOpenAIApiKey()
    const model = getOpenAIModel()

    const { user_name, type, interpreted_request_summary, linear_issue_identifier } = input

    const prompt = `Generate a friendly, concise confirmation message for a customer who just reported a ${type}.

Customer name: ${user_name || "Customer"}
Issue identifier: ${linear_issue_identifier}
Summary: ${interpreted_request_summary}

Write a brief, professional message (2-3 sentences) that:
1. Thanks them for reporting the ${type}
2. Confirms we've created an internal ticket (mention the identifier)
3. Assures them we'll keep them posted

Keep it warm but professional. Return ONLY the message text, no quotes or additional formatting.`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are a customer support assistant. Write friendly, professional messages.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
    }

    const data = (await response.json()) as {
      choices: Array<{
        message: {
          content: string
        }
      }>
    }

    const content = data.choices[0]?.message?.content?.trim()
    return content || null
  } catch (error) {
    console.error("Failed to generate creation response with OpenAI:", error)
    return null
  }
}

export async function generateResolutionResponse(
  input: ResolutionResponseInput
): Promise<string | null> {
  if (!isAIEnabled()) {
    return null
  }

  try {
    const apiKey = requireOpenAIApiKey()
    const model = getOpenAIModel()

    const { user_name, original_content, latest_comment_text, linear_issue_identifier } = input

    let prompt = `Generate a clear, concise message informing a customer that their issue has been resolved.

Customer name: ${user_name || "Customer"}
Original request: ${original_content}
Issue identifier: ${linear_issue_identifier}`

    if (latest_comment_text) {
      prompt += `\n\nDeveloper's explanation: ${latest_comment_text}`
    }

    prompt += `\n\nWrite a brief message (3-4 sentences) that:
1. Confirms their ${original_content.includes("bug") ? "bug has been fixed" : "feature has been implemented"}
2. Explains where to find it or how to use it (based on the developer's explanation if provided)
3. Thanks them for their patience

Keep it clear, helpful, and professional. Return ONLY the message text, no quotes or additional formatting.`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a customer support assistant. Write clear, helpful messages explaining technical solutions in simple terms.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
    }

    const data = (await response.json()) as {
      choices: Array<{
        message: {
          content: string
        }
      }>
    }

    const content = data.choices[0]?.message?.content?.trim()
    return content || null
  } catch (error) {
    console.error("Failed to generate resolution response with OpenAI:", error)
    return null
  }
}

