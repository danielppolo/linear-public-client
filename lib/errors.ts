export class ValidationError extends Error {
  constructor(message: string, public readonly details?: unknown) {
    super(message)
    this.name = "ValidationError"
  }
}

export class NotFoundError extends Error {
  constructor(message: string = "Resource not found") {
    super(message)
    this.name = "NotFoundError"
  }
}

export class LinearApiError extends Error {
  constructor(message: string, public readonly statusCode?: number, public readonly details?: unknown) {
    super(message)
    this.name = "LinearApiError"
  }
}

export class WebhookAuthError extends Error {
  constructor(message: string = "Webhook authentication failed") {
    super(message)
    this.name = "WebhookAuthError"
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = "Unauthorized") {
    super(message)
    this.name = "UnauthorizedError"
  }
}

export class OpenAIError extends Error {
  constructor(message: string, public readonly details?: unknown) {
    super(message)
    this.name = "OpenAIError"
  }
}

export function formatErrorResponse(error: unknown): { message: string; details?: unknown } {
  if (error instanceof ValidationError) {
    return {
      message: error.message,
      details: error.details,
    }
  }

  if (error instanceof NotFoundError) {
    return {
      message: error.message,
    }
  }

  if (error instanceof LinearApiError) {
    return {
      message: error.message,
      details: error.details,
    }
  }

  if (error instanceof WebhookAuthError) {
    return {
      message: error.message,
    }
  }

  if (error instanceof UnauthorizedError) {
    return {
      message: error.message,
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    }
  }

  return {
    message: "An unexpected error occurred",
  }
}

