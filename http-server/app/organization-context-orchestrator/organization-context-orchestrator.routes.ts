import { FastifyInstance } from "fastify";
import { Effect } from "effect";
import { mapErrorToHttp } from "@libs/dbHandler";
import { defineRoute } from "@libs/defineRoute";
import { CreateOrganizationContextDtoSchema, OrganizationContextOrchestratorDtoSchema } from "./organization-context-orchestrator.dto";
import { OrganizationContextOrchestratorService } from "./organization-context-orchestrator.service";

export default async function organizationContextOrchestratorRoutes(app: FastifyInstance) {
  defineRoute(app, {
    method: "POST",
    url: "/",
    input: CreateOrganizationContextDtoSchema,
    output: OrganizationContextOrchestratorDtoSchema,
    handler: (input) => OrganizationContextOrchestratorService.create(input).pipe(Effect.mapError(mapErrorToHttp)),
  });
}
