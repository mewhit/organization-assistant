import { Effect, Option } from "effect";
import { type DbError, UnknownDbError } from "@libs/dbHandler";
import { OrganizationStorage } from "../organization/organization.storage";
import { OrganizationContextStorage } from "../organization-context/organization-context.storage";
import {
  type CreatableOrganizationContextOrchestrator,
  type OrganizationContextOrchestrator,
} from "./organization-context-orchestrator.entity";

export class OrganizationNotFound {
  readonly _tag = "OrganizationNotFound";
}

export class OrganizationContextOrchestratorError {
  readonly _tag = "OrganizationContextOrchestratorError";
}

export type OrganizationContextOrchestratorServiceError = OrganizationNotFound | OrganizationContextOrchestratorError | DbError;

export class OrganizationContextOrchestratorService {
  static create(
    payload: CreatableOrganizationContextOrchestrator,
  ): Effect.Effect<OrganizationContextOrchestrator, OrganizationContextOrchestratorServiceError> {
    return Effect.gen(function* () {
      yield* OrganizationStorage.findOne(payload.organizationId).pipe(Effect.filterOrFail(Option.isSome, () => new OrganizationNotFound()));

      const result = yield* OrganizationContextStorage.insert(payload);

      return yield* Option.match(result, {
        onNone: () => Effect.fail(new UnknownDbError("OrganizationContext not found")),
        onSome: Effect.succeed,
      });
    });
  }
}
