import { FastifyInstance } from "fastify";
import { Effect } from "effect";
import { mapErrorToHttp } from "@libs/dbHandler";
import { defineRoute } from "@libs/defineRoute";
import { CommandOrchestratorDtoSchema, CommandOrchestratorResultDtoSchema } from "./command-orchestrator.dto";
import { CommandOrchestratorService } from "./command-orchestrator.service";

export default async function commandOrchestratorRoutes(app: FastifyInstance) {
  defineRoute(app, {
    method: "POST",
    url: "/",
    input: CommandOrchestratorDtoSchema,
    output: CommandOrchestratorResultDtoSchema,
    handler: (input) => CommandOrchestratorService.executeCommand(input).pipe(Effect.mapError(mapErrorToHttp)),
  });
}
