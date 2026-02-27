import { FastifyInstance } from "fastify";
import { Effect, Schema } from "effect";
import { mapErrorToHttp } from "@libs/dbHandler";

import { OrganizationUserService } from "./organization-user.service";
import {
  CreateOrganizationUserDtoSchema,
  UpdateOrganizationUserDtoSchema,
  OrganizationUserDtoSchema,
} from "./organization-user.dto";
import { defineRoute } from "@libs/defineRoute";

const IdParamsSchema = Schema.Struct({
  id: Schema.UUID,
});

export default async function organizationUserRoutes(app: FastifyInstance) {
  defineRoute(app, {
    method: "POST",
    url: "/",
    input: CreateOrganizationUserDtoSchema,
    output: OrganizationUserDtoSchema,
    handler: (input) => OrganizationUserService.create(input).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "GET",
    url: "/:id",
    params: IdParamsSchema,
    output: OrganizationUserDtoSchema,
    handler: (_, params) => OrganizationUserService.findOne(params.id).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "PATCH",
    url: "/:id",
    input: UpdateOrganizationUserDtoSchema,
    params: IdParamsSchema,
    output: OrganizationUserDtoSchema,
    handler: (input, params) => OrganizationUserService.update(params.id, input).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "PUT",
    url: "/:id",
    input: UpdateOrganizationUserDtoSchema,
    params: IdParamsSchema,
    output: OrganizationUserDtoSchema,
    handler: (input, params) => OrganizationUserService.update(params.id, input).pipe(Effect.mapError(mapErrorToHttp)),
  });

  defineRoute(app, {
    method: "DELETE",
    url: "/:id",
    params: IdParamsSchema,
    output: OrganizationUserDtoSchema,
    handler: (_, params) => OrganizationUserService.remove(params.id).pipe(Effect.mapError(mapErrorToHttp)),
  });
}
