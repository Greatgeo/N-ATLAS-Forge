export class NAtlasError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly retryable: boolean;

  constructor(message: string, code: string = 'NATLAS_ERROR', statusCode: number = 500, retryable: boolean = false) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.retryable = retryable;
  }
}

export class NAtlasConfigurationError extends NAtlasError {
  constructor(message: string) {
    super(message, 'NATLAS_CONFIGURATION_ERROR', 400, false);
  }
}

export class NAtlasAuthenticationError extends NAtlasError {
  constructor(message: string = 'Authentication to N-ATLaS endpoint failed or token is missing/invalid.') {
    super(message, 'NATLAS_AUTH_ERROR', 401, false);
  }
}

export class NAtlasConnectionError extends NAtlasError {
  constructor(message: string = 'Could not establish connection to N-ATLaS runtime/service.') {
    super(message, 'NATLAS_CONNECTION_ERROR', 503, true);
  }
}

export class NAtlasTimeoutError extends NAtlasError {
  constructor(message: string = 'Inference request to N-ATLaS timed out.') {
    super(message, 'NATLAS_TIMEOUT_ERROR', 504, true);
  }
}

export class NAtlasRequestError extends NAtlasError {
  constructor(message: string) {
    super(message, 'NATLAS_REQUEST_ERROR', 400, false);
  }
}

export class NAtlasModelError extends NAtlasError {
  constructor(message: string) {
    super(message, 'NATLAS_MODEL_ERROR', 502, false);
  }
}

export class NAtlasRateLimitError extends NAtlasError {
  constructor(message: string = 'N-ATLaS rate limit exceeded. Please back off before retrying.') {
    super(message, 'NATLAS_RATE_LIMIT_ERROR', 429, true);
  }
}
