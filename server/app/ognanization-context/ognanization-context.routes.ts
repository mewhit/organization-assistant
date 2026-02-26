import { FastifyInstance } from "fastify";
import { Effect, Schema } from "effect";

import {
  OgnanizationContextService,
  OgnanizationContextNotFound,
  OgnanizationContextPersistenceError,
  OgnanizationContextServiceError,
} from "./ognanization-context.service";
import {
  CreateOgnanizationContextDtoSchema,
  UpdateOgnanizationContextDtoSchema,
  OgnanizationContextDtoSchema,
} from "./ognanization-context.dto";
import { defineRoute } from "@libs/defineRoute";

const IdParamsSchema = Schema.Struct({
  id: Schema.UUID,
});

function mapOgnanizationContextServiceError(error: OgnanizationContextServiceError): { statusCode: 404 | 500; message: string } {
  if (error instanceof OgnanizationContextNotFound) {
    return { statusCode: 404, message: "OgnanizationContext not found" };
  }

  if (error instanceof OgnanizationContextPersistenceError) {
    return { statusCode: 500, message: "Database error" };
  }

  return { statusCode: 500, message: "Internal server error" };
}

export default async function ognanizationContextRoutes(app: FastifyInstance) {
  defineRoute(app, {
    method: "POST",
    url: "/",
    input: CreateOgnanizationContextDtoSchema,
    output: OgnanizationContextDtoSchema,
    handler: (input) => OgnanizationContextService.create(input).pipe(Effect.mapError(mapOgnanizationContextServiceError)),
  });

  defineRoute(app, {
    method: "GET",
    url: "/:id",
    params: IdParamsSchema,
    output: OgnanizationContextDtoSchema,
    handler: (_, params) => OgnanizationContextService.findOne(params.id).pipe(Effect.mapError(mapOgnanizationContextServiceError)),
  });

  defineRoute(app, {
    method: "PATCH",
    url: "/:id",
    input: UpdateOgnanizationContextDtoSchema,
    params: IdParamsSchema,
    output: OgnanizationContextDtoSchema,
    handler: (input, params) =>
      OgnanizationContextService.update(params.id, input).pipe(Effect.mapError(mapOgnanizationContextServiceError)),
  });

  defineRoute(app, {
    method: "PUT",
    url: "/:id",
    input: UpdateOgnanizationContextDtoSchema,
    params: IdParamsSchema,
    output: OgnanizationContextDtoSchema,
    handler: (input, params) =>
      OgnanizationContextService.update(params.id, input).pipe(Effect.mapError(mapOgnanizationContextServiceError)),
  });

  defineRoute(app, {
    method: "DELETE",
    url: "/:id",
    params: IdParamsSchema,
    output: OgnanizationContextDtoSchema,
    handler: (_, params) => OgnanizationContextService.remove(params.id).pipe(Effect.mapError(mapOgnanizationContextServiceError)),
  });
}
