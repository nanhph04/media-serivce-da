import { applyDecorators } from '@nestjs/common';
import type { Type } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiSuccessEnvelopeDto } from '../dto/api-success-envelope.dto';

type PrimitiveModel =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor;

type ResponseModel = Type<unknown> | PrimitiveModel;

interface ApiSuccessResponseOptions {
  isArray?: boolean;
  description?: string;
}

export function ApiSuccessResponse(
  model: ResponseModel,
  options: ApiSuccessResponseOptions = {},
): MethodDecorator & ClassDecorator {
  const decorators = [
    ApiExtraModels(...getExtraModels(model)),
    ApiOkResponse({
      description: options.description,
      schema: buildEnvelopeSchema(model, options.isArray ?? false, 200),
    }),
  ];

  return applyDecorators(...decorators);
}

export function ApiCreatedSuccessResponse(
  model: ResponseModel,
  options: ApiSuccessResponseOptions = {},
): MethodDecorator & ClassDecorator {
  const decorators = [
    ApiExtraModels(...getExtraModels(model)),
    ApiCreatedResponse({
      description: options.description,
      schema: buildEnvelopeSchema(model, options.isArray ?? false, 201),
    }),
  ];

  return applyDecorators(...decorators);
}

function getExtraModels(model: ResponseModel): Array<Type<unknown>> {
  if (isPrimitiveModel(model)) {
    return [ApiSuccessEnvelopeDto];
  }

  return [ApiSuccessEnvelopeDto, model];
}

function buildEnvelopeSchema(
  model: ResponseModel,
  isArray: boolean,
  statusCode: number,
): Record<string, unknown> {
  return {
    allOf: [
      { $ref: getSchemaPath(ApiSuccessEnvelopeDto) },
      {
        properties: {
          statusCode: {
            type: 'number',
            example: statusCode,
          },
          data: buildDataSchema(model, isArray),
        },
      },
    ],
  };
}

function buildDataSchema(
  model: ResponseModel,
  isArray: boolean,
): Record<string, unknown> {
  const itemSchema = isPrimitiveModel(model)
    ? { type: getPrimitiveType(model) }
    : { $ref: getSchemaPath(model) };

  if (isArray) {
    return {
      type: 'array',
      items: itemSchema,
    };
  }

  return itemSchema;
}

function isPrimitiveModel(model: ResponseModel): model is PrimitiveModel {
  return model === String || model === Number || model === Boolean;
}

function getPrimitiveType(
  model: PrimitiveModel,
): 'string' | 'number' | 'boolean' {
  if (model === String) {
    return 'string';
  }

  if (model === Number) {
    return 'number';
  }

  return 'boolean';
}
