import { Effect } from "effect";
import { type DbError, UnknownDbError } from "@libs/dbHandler";
import { ApiClientHttpError } from "@libs/apiClient";
import { internalApiClient } from "@libs/internalApiClient";
import { type CreatableOrganizationUser, type OrganizationUser } from "../organization-user/organization-user.entity";

export class UserNotFound {
  readonly _tag = "UserNotFound";
}

export class OrganizationNotFound {
  readonly _tag = "OrganizationNotFound";
}

export class OrganizationUserOrchestratorError {
  readonly _tag = "OrganizationUserOrchestratorError";
}

export type OrganizationUserOrchestratorServiceError = UserNotFound | OrganizationNotFound | OrganizationUserOrchestratorError | DbError;

export class OrganizationUserOrchestratorService {
  static create(payload: CreatableOrganizationUser): Effect.Effect<OrganizationUser, OrganizationUserOrchestratorServiceError> {
    return Effect.gen(function* () {
      yield* internalApiClient.user.findOne(payload.userId).pipe(
        Effect.mapError((error) => {
          if (error instanceof ApiClientHttpError && error.status === 404) {
            return new UserNotFound();
          }

          return new UnknownDbError(error);
        }),
      );

      yield* internalApiClient.organization.findOne(payload.organizationId).pipe(
        Effect.mapError((error) => {
          if (error instanceof ApiClientHttpError && error.status === 404) {
            return new OrganizationNotFound();
          }

          return new UnknownDbError(error);
        }),
      );

      return yield* internalApiClient.organizationUser.create(payload).pipe(Effect.mapError(() => new OrganizationUserOrchestratorError()));
    });
  }
}
