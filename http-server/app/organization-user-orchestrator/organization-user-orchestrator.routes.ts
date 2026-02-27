import { FastifyInstance } from "fastify";
import { Effect } from "effect";
import { mapErrorToHttp } from "@libs/dbHandler";
import { defineRoute } from "@libs/defineRoute";
import { CreateOrganizationUserDtoSchema, OrganizationUserDtoSchema } from "./organization-user-orchestrator.dto";
import { OrganizationUserOrchestratorService } from "./organization-user-orchestrator.service";

export default async function organizationUserOrchestratorRoutes(app: FastifyInstance) {
  defineRoute(app, {
    method: "POST",
    url: "/",
    input: CreateOrganizationUserDtoSchema,
    output: OrganizationUserDtoSchema,
    handler: (input) => OrganizationUserOrchestratorService.create(input).pipe(Effect.mapError(mapErrorToHttp)),
  });
}
