import { Effect, Option } from "effect";
import { type DbError, UnknownDbError } from "@libs/dbHandler";
import { OrganizationUserStorage } from "../organization-user/organization-user.storage";
import { type CreatableOrganizationUser, type OrganizationUser } from "../organization-user/organization-user.entity";
import { UserStorage } from "../user/user.storage";
import { OrganizationStorage } from "../organization/organization.storage";

export class UserNotFound {
  readonly _tag = "UserNotFound";
}

export class OrganizationNotFound {
  readonly _tag = "OrganizationNotFound";
}

export class OrganizationUserOrchestratorError {
  readonly _tag = "OrganizationUserOrchestratorError";
}

export type OrganizationUserOrchestratorServiceError =
  | UserNotFound
  | OrganizationNotFound
  | OrganizationUserOrchestratorError
  | DbError;

export class OrganizationUserOrchestratorService {
  static create(
    payload: CreatableOrganizationUser,
  ): Effect.Effect<OrganizationUser, OrganizationUserOrchestratorServiceError> {
    return Effect.gen(function* () {
      yield* UserStorage.findOne(payload.userId).pipe(Effect.filterOrFail(Option.isSome, () => new UserNotFound()));

      yield* OrganizationStorage.findOne(payload.organizationId).pipe(
        Effect.filterOrFail(Option.isSome, () => new OrganizationNotFound()),
      );

      const result = yield* OrganizationUserStorage.insert(payload);

      return yield* Option.match(result, {
        onNone: () => Effect.fail(new OrganizationUserOrchestratorError()),
        onSome: Effect.succeed,
      });
    });
  }
}
