export enum ErrorCode {
  // Base errors
  UNKNOWN = "UNKNOWN",
}

/**
 * Base error class for the Gamemaster.
 * All other error classes should extend this.
 */
export class GamemasterError extends Error {
  constructor(
    public readonly code: ErrorCode = ErrorCode.UNKNOWN,
    message: string,
  ) {
    super(message);
    this.name = this.constructor.name;

    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Creates a JSON representation of the error.
   */
  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
    };
  }

  public static unknown(message?: string): GamemasterError {
    return new GamemasterError(ErrorCode.UNKNOWN, message || "");
  }

}
