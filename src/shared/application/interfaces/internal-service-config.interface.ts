export abstract class IInternalServiceConfig {
  abstract getAllowedInternalServices(): string[];

  abstract getInternalServiceSecret(serviceName: string): string | null;
}
