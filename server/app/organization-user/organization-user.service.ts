import { Effect, Option } from "effect";
import { type DbError, UnknownDbError, NotFoundError } from "@libs/dbHandler";

import { OrganizationUserStorage } from "./organization-user.storage";
import {
  type OrganizationUser,
  type CreatableOrganizationUser,
  type UpdatableOrganizationUser,
} from "./organization-user.entity";

export class OrganizationUserNotFound {
  readonly _tag = "OrganizationUserNotFound";
}

export class OrganizationUserAlreadyExists {
  readonly _tag = "OrganizationUserAlreadyExists";
}

export type OrganizationUserServiceError = OrganizationUserNotFound | OrganizationUserAlreadyExists | DbError;

export class OrganizationUserService {
  static create(payload: CreatableOrganizationUser): Effect.Effect<OrganizationUser, OrganizationUserServiceError> {
    return OrganizationUserStorage.insert(payload).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new UnknownDbError("OrganizationUser not found")),
          onSome: (organizationUser) => Effect.succeed(organizationUser),
        }),
      ),
    );
  }

  static findOne(id: string): Effect.Effect<OrganizationUser, OrganizationUserServiceError> {
    return OrganizationUserStorage.findOne(id).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new OrganizationUserNotFound()),
          onSome: (organizationUser) => Effect.succeed(organizationUser),
        }),
      ),
    );
  }

  static find(id: string) {
    return this.findOne(id);
  }

  static update(
    id: string,
    payload: UpdatableOrganizationUser,
  ): Effect.Effect<OrganizationUser, OrganizationUserServiceError> {
    return OrganizationUserStorage.update(id, payload).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new OrganizationUserNotFound()),
          onSome: (organizationUser) => Effect.succeed(organizationUser),
        }),
      ),
    );
  }

  static remove(id: string): Effect.Effect<OrganizationUser, OrganizationUserServiceError> {
    return OrganizationUserStorage.del(id).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new OrganizationUserNotFound()),
          onSome: (organizationUser) => Effect.succeed(organizationUser),
        }),
      ),
    );
  }
}
