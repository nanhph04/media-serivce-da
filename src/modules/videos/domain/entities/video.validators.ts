import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import { BadRequestException } from '@shared/domain/exceptions/domain.exception';

export function validateVideoMetadata(input: {
  title: string;
  price: number;
  requiredTierLevel: number | null;
}): void {
  validateVideoTitle(input.title);

  if (input.price < 0) {
    throw new BadRequestException(ERROR_MESSAGES.VIDEO_PRICE_NEGATIVE);
  }
  if (input.price > 0 && input.price % 10 !== 0) {
    throw new BadRequestException(ERROR_MESSAGES.VIDEO_PRICE_DIVISIBLE_BY_10);
  }
  if (
    input.requiredTierLevel !== null &&
    (input.requiredTierLevel < 1 || input.requiredTierLevel > 3)
  ) {
    throw new BadRequestException(
      'Required tier level must be between 1 and 3',
    );
  }
}

export function validateVideoTitle(title: string): void {
  if (!title || title.length > 200) {
    throw new BadRequestException(
      ERROR_MESSAGES.VIDEO_TITLE_REQUIRED_MAX_LENGTH,
    );
  }
}

export function normalizeVideoResolutions(resolutions: string[]): string[] {
  const normalizedResolutions = resolutions
    .map((resolution) => resolution.trim())
    .filter((resolution) => resolution.length > 0);

  if (normalizedResolutions.length === 0) {
    throw new BadRequestException(ERROR_MESSAGES.VIDEO_RESOLUTION_REQUIRED);
  }

  return normalizedResolutions;
}

export function normalizeVideoProcessingWarnings(warnings: string[]): string[] {
  return [
    ...new Set(
      warnings
        .map((warning) => warning.trim())
        .filter((warning) => warning.length > 0),
    ),
  ];
}
