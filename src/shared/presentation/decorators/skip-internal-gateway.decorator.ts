import { SetMetadata } from '@nestjs/common';

export const SKIP_INTERNAL_GATEWAY_GUARD = 'skipInternalGatewayGuard';

export const SkipInternalGatewayGuard = (): MethodDecorator & ClassDecorator =>
  SetMetadata(SKIP_INTERNAL_GATEWAY_GUARD, true);
