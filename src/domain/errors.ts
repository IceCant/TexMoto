export class DomainError extends Error {
  constructor(
    message: string,
    readonly code: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "INVALID_INPUT" | "INVALID_STATE",
  ) {
    super(message);
    this.name = "DomainError";
  }
}

