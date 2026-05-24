import { Injectable } from '@nestjs/common';

import type {
  ChargeFinancePaymentInput,
  FinancePaymentResult,
  IFinancePaymentClient,
} from '@shared/application/interfaces/finance-payment-client.interface';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@shared/domain/exceptions/domain.exception';

import { ConfigService } from '../config/config.service';

interface FinanceApiResponse<T> {
  success: boolean;
  code: number;
  mess?: string;
  data: T | null;
  errors?: string[];
}

@Injectable()
export class FinancePaymentClientService implements IFinancePaymentClient {
  constructor(private readonly configService: ConfigService) {}

  public async charge(
    input: ChargeFinancePaymentInput,
  ): Promise<FinancePaymentResult> {
    const response = await fetch(this.buildChargeUrl(), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-internal-secret': this.getFinanceInternalGatewaySecret(),
        'idempotency-key': input.idempotencyKey,
        ...(input.traceId ? { 'x-request-id': input.traceId } : {}),
      },
      body: JSON.stringify({
        payerUserId: input.payerUserId,
        serviceType: input.serviceType,
        serviceId: input.serviceId,
        channelId: input.channelId,
        channelOwnerId: input.channelOwnerId,
        coinAmount: input.coinAmount,
        metadata: input.metadata,
      }),
    });

    const payload = await this.readPayload<FinancePaymentResult>(response);

    if (!response.ok || !payload.success || !payload.data) {
      this.throwFinanceError(response.status, payload);
    }

    return payload.data;
  }

  private buildChargeUrl(): string {
    const baseUrl = this.configService
      .get<string>('FINANCE_SERVICE_URL', 'http://localhost:4004')
      .replace(/\/+$/, '');

    return `${baseUrl}/api/internal/payments/charge`;
  }

  private getFinanceInternalGatewaySecret(): string {
    const financeSecret = this.configService.getOrThrow<string>(
      'FINANCE_INTERNAL_GATEWAY_SECRET',
    );

    if (financeSecret.length === 0) {
      throw new Error(
        'Config key "FINANCE_INTERNAL_GATEWAY_SECRET" must not be empty',
      );
    }

    return financeSecret;
  }

  private async readPayload<T>(
    response: Response,
  ): Promise<FinanceApiResponse<T>> {
    const fallback: FinanceApiResponse<T> = {
      success: false,
      code: response.status,
      mess: 'Finance payment request failed',
      data: null,
      errors: ['Finance payment request failed'],
    };

    try {
      return (await response.json()) as FinanceApiResponse<T>;
    } catch {
      return fallback;
    }
  }

  private throwFinanceError(
    status: number,
    payload: FinanceApiResponse<FinancePaymentResult>,
  ): never {
    const message = payload.mess ?? 'Finance payment request failed';
    const errors = payload.errors ?? [message];

    if (status === 400) {
      throw new BadRequestException(message, errors);
    }

    if (status === 401) {
      throw new UnauthorizedException(message, errors);
    }

    if (status === 404) {
      throw new NotFoundException(message, errors);
    }

    if (status === 409) {
      throw new ConflictException(message, errors);
    }

    throw new InternalServerErrorException(message, errors);
  }
}
