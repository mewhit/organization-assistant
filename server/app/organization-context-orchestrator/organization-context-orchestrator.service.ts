import { Effect } from "effect";
import { type DbError, UnknownDbError } from "@libs/dbHandler";
import { ApiClientHttpError } from "@libs/apiClient";
import { internalApiClient } from "@libs/internalApiClient";
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
      yield* internalApiClient.organization.findOne(payload.organizationId).pipe(
        Effect.mapError((error) => {
          if (error instanceof ApiClientHttpError && error.status === 404) {
            return new OrganizationNotFound();
          }

          return new UnknownDbError(error);
        }),
      );

      return yield* internalApiClient.organizationContext
        .create(payload)
        .pipe(Effect.mapError(() => new OrganizationContextOrchestratorError()));
    });
  }
}
