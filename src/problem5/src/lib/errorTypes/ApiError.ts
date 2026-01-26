import status from "http-status";

class ApiError extends Error {
  httpCode: number;

  errorCode: number;

  errorMessage: string;

  shouldLog: boolean;

  isOperational: boolean;

  constructor(
    errorCode = 9999,
    message = "Something went wrong! Please try again.",
    httpCode = Number(status.BAD_REQUEST),
    shouldLog = true,
    isOperational = false,
    stack = "",
  ) {
    super(message);
    this.httpCode = httpCode;
    this.isOperational = isOperational;
    this.shouldLog = shouldLog;
    this.errorMessage = message;
    this.errorCode = errorCode;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
