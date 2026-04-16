export declare class DomainException extends Error {
    readonly code: string;
    readonly errors?: string[] | undefined;
    constructor(message: string, code: string, errors?: string[] | undefined);
}
export declare class NotFoundException extends DomainException {
    constructor(message?: string, errors?: string[]);
}
export declare class BadRequestException extends DomainException {
    constructor(message?: string, errors?: string[]);
}
export declare class UnauthorizedException extends DomainException {
    constructor(message?: string, errors?: string[]);
}
export declare class ConflictException extends DomainException {
    constructor(message?: string, errors?: string[]);
}
export declare class ForbiddenException extends DomainException {
    constructor(message?: string, errors?: string[]);
}
export declare class InternalServerErrorException extends DomainException {
    constructor(message?: string, errors?: string[]);
}
