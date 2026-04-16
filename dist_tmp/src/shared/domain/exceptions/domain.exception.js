"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalServerErrorException = exports.ForbiddenException = exports.ConflictException = exports.UnauthorizedException = exports.BadRequestException = exports.NotFoundException = exports.DomainException = void 0;
class DomainException extends Error {
    code;
    errors;
    constructor(message, code, errors) {
        super(message);
        this.code = code;
        this.errors = errors;
        this.name = this.constructor.name;
    }
}
exports.DomainException = DomainException;
class NotFoundException extends DomainException {
    constructor(message = 'Resource not found', errors) {
        super(message, 'NOT_FOUND', errors);
    }
}
exports.NotFoundException = NotFoundException;
class BadRequestException extends DomainException {
    constructor(message = 'Bad request', errors = []) {
        super(message, 'BAD_REQUEST', errors);
    }
}
exports.BadRequestException = BadRequestException;
class UnauthorizedException extends DomainException {
    constructor(message = 'Unauthorized', errors = []) {
        super(message, 'UNAUTHORIZED', errors);
    }
}
exports.UnauthorizedException = UnauthorizedException;
class ConflictException extends DomainException {
    constructor(message = 'Conflict', errors = []) {
        super(message, 'CONFLICT', errors);
    }
}
exports.ConflictException = ConflictException;
class ForbiddenException extends DomainException {
    constructor(message = 'Forbidden', errors = []) {
        super(message, 'FORBIDDEN', errors);
    }
}
exports.ForbiddenException = ForbiddenException;
class InternalServerErrorException extends DomainException {
    constructor(message = 'Internal server error', errors) {
        super(message, 'INTERNAL_SERVER_ERROR', errors);
    }
}
exports.InternalServerErrorException = InternalServerErrorException;
//# sourceMappingURL=domain.exception.js.map