import { Injectable } from '@nestjs/common';

import { IInternalServiceConfig } from '@shared/application/interfaces/internal-service-config.interface';

import { ConfigService } from './config.service';

@Injectable()
export class InternalServiceConfigService implements IInternalServiceConfig {
  private static readonly TARGET_SERVICE_PREFIX = 'MEDIA';

  constructor(private readonly configService: ConfigService) {}

  public getAllowedInternalServices(): string[] {
    const rawAllowlist = this.configService.get<string>(
      'MEDIA_INTERNAL_SERVICE_ALLOWLIST',
      'finance-service',
    );

    return rawAllowlist
      .split(',')
      .map((serviceName) => serviceName.trim())
      .filter((serviceName) => serviceName.length > 0);
  }

  public getInternalServiceSecret(serviceName: string): string | null {
    const callerPrefix = this.toEnvPrefix(serviceName.trim().toLowerCase());
    const secret = this.configService.get<string>(
      `${callerPrefix}_${InternalServiceConfigService.TARGET_SERVICE_PREFIX}_INTERNAL_SECRET`,
      '',
    );

    if (secret.length > 0) {
      return secret;
    }

    return this.getLegacyAliasSecret(callerPrefix);
  }

  private getLegacyAliasSecret(callerPrefix: string): string | null {
    if (callerPrefix === 'FINANCE_SERVICE') {
      const secret = this.configService.get<string>(
        'FINANCE_MEDIA_INTERNAL_SECRET',
        '',
      );

      return secret.length > 0 ? secret : null;
    }

    return null;
  }

  private toEnvPrefix(serviceName: string): string {
    return serviceName.replace(/[^a-z0-9]/gi, '_').toUpperCase();
  }
}
