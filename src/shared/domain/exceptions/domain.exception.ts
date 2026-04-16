export class DomainException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly errors?: string[],
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundException extends DomainException {
  constructor(message = 'Resource not found', errors?: string[]) {
    super(message, 'NOT_FOUND', errors);
  }
}

export class BadRequestException extends DomainException {
  constructor(message = 'Bad request', errors: string[] = []) {
    super(message, 'BAD_REQUEST', errors);
  }
}

export class UnauthorizedException extends DomainException {
  constructor(message = 'Unauthorized', errors: string[] = []) {
    super(message, 'UNAUTHORIZED', errors);
  }
}

export class ConflictException extends DomainException {
  constructor(message = 'Conflict', errors: string[] = []) {
    super(message, 'CONFLICT', errors);
  }
}

export class ForbiddenException extends DomainException {
  constructor(message = 'Forbidden', errors: string[] = []) {
    super(message, 'FORBIDDEN', errors);
  }
}

export class InternalServerErrorException extends DomainException {
  constructor(message = 'Internal server error', errors?: string[]) {
    super(message, 'INTERNAL_SERVER_ERROR', errors);
  }
}
