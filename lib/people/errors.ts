/**
 * Phase 2B persistence error taxonomy.
 *
 * INV-19: transport failures must surface as `unavailable` (5xx) — never as an
 * empty successful read that implies "no such Person".
 */
export type PeoplePersistErrorCode =
  | 'unavailable'
  | 'conflict'
  | 'illegal_flag'
  | 'not_found'
  | 'validation';

const HTTP_STATUS: Record<PeoplePersistErrorCode, number> = {
  unavailable: 503,
  conflict: 409,
  // INV-20: an illegal flag combination must look like the module does not exist.
  illegal_flag: 404,
  not_found: 404,
  validation: 400,
};

export class PeoplePersistError extends Error {
  readonly code: PeoplePersistErrorCode;
  readonly httpStatus: number;
  readonly retryable: boolean;
  readonly details?: Record<string, string | number | boolean | null>;

  constructor(
    code: PeoplePersistErrorCode,
    message: string,
    options: {
      retryable?: boolean;
      details?: Record<string, string | number | boolean | null>;
      cause?: unknown;
    } = {},
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'PeoplePersistError';
    this.code = code;
    this.httpStatus = HTTP_STATUS[code];
    this.retryable = options.retryable ?? (code === 'unavailable' || code === 'conflict');
    this.details = options.details;
  }
}

export function isPeoplePersistError(value: unknown): value is PeoplePersistError {
  return value instanceof PeoplePersistError;
}

export function peoplePersistHttpStatus(value: unknown): number {
  return isPeoplePersistError(value) ? value.httpStatus : 500;
}

export function peopleUnavailable(
  message: string,
  details?: Record<string, string | number | boolean | null>,
): PeoplePersistError {
  return new PeoplePersistError('unavailable', message, { retryable: true, details });
}

export function peopleConflict(
  message: string,
  details?: Record<string, string | number | boolean | null>,
): PeoplePersistError {
  return new PeoplePersistError('conflict', message, { retryable: true, details });
}

export function peopleValidation(
  message: string,
  details?: Record<string, string | number | boolean | null>,
): PeoplePersistError {
  return new PeoplePersistError('validation', message, { retryable: false, details });
}

export function peopleNotFound(message = 'not_found'): PeoplePersistError {
  return new PeoplePersistError('not_found', message, { retryable: false });
}

export function peopleIllegalFlag(message: string): PeoplePersistError {
  return new PeoplePersistError('illegal_flag', message, { retryable: false });
}
