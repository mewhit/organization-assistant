import { Effect, Option } from "effect";

import { OrganizationUserStorage } from "./organization-user.storage";
import { type OrganizationUser, type CreatableOrganizationUser, type UpdatableOrganizationUser } from "./organization-user.entity";

export class OrganizationUserNotFound {
  readonly _tag = "OrganizationUserNotFound";
}

export class OrganizationUserAlreadyExists {
  readonly _tag = "OrganizationUserAlreadyExists";
}

export class OrganizationUserPersistenceError {
  readonly _tag = "OrganizationUserPersistenceError";
}

export type OrganizationUserServiceError = OrganizationUserNotFound | OrganizationUserAlreadyExists | OrganizationUserPersistenceError;

export class OrganizationUserService {
  static create(payload: CreatableOrganizationUser): Effect.Effect<OrganizationUser, OrganizationUserServiceError> {
    return OrganizationUserStorage.insert(payload).pipe(
      Effect.mapError(() => new OrganizationUserPersistenceError()),
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new OrganizationUserPersistenceError()),
          onSome: (organizationUser) => Effect.succeed(organizationUser),
        }),
      ),
    );
  }

  static findOne(id: string): Effect.Effect<OrganizationUser, OrganizationUserServiceError> {
    return OrganizationUserStorage.findOne(id).pipe(
      Effect.mapError(() => new OrganizationUserPersistenceError()),
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

  static update(id: string, payload: UpdatableOrganizationUser): Effect.Effect<OrganizationUser, OrganizationUserServiceError> {
    return OrganizationUserStorage.update(id, payload).pipe(
      Effect.mapError(() => new OrganizationUserPersistenceError()),
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
      Effect.mapError(() => new OrganizationUserPersistenceError()),
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new OrganizationUserNotFound()),
          onSome: (organizationUser) => Effect.succeed(organizationUser),
        }),
      ),
    );
  }
}
