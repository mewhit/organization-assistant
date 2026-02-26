import { Effect, Option } from "effect";

import { UserStorage } from "./user.storage";
import { type User, type CreatableUser, type UpdatableUser } from "./user.entity";

export class UserNotFound {
  readonly _tag = "UserNotFound";
}

export class UserAlreadyExists {
  readonly _tag = "UserAlreadyExists";
}

export class UserPersistenceError {
  readonly _tag = "UserPersistenceError";
}

export type UserServiceError = UserNotFound | UserAlreadyExists | UserPersistenceError;

export class UserService {
  static create(payload: CreatableUser): Effect.Effect<User, UserServiceError> {
    return UserStorage.insert(payload).pipe(
      Effect.mapError(() => new UserPersistenceError()),
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new UserPersistenceError()),
          onSome: (user) => Effect.succeed(user),
        }),
      ),
    );
  }

  static findOne(id: string): Effect.Effect<User, UserServiceError> {
    return UserStorage.findOne(id).pipe(
      Effect.mapError(() => new UserPersistenceError()),
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new UserNotFound()),
          onSome: (user) => Effect.succeed(user),
        }),
      ),
    );
  }

  static find(id: string) {
    return this.findOne(id);
  }

  static update(id: string, payload: UpdatableUser): Effect.Effect<User, UserServiceError> {
    return UserStorage.update(id, payload).pipe(
      Effect.mapError(() => new UserPersistenceError()),
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new UserNotFound()),
          onSome: (user) => Effect.succeed(user),
        }),
      ),
    );
  }

  static remove(id: string): Effect.Effect<User, UserServiceError> {
    return UserStorage.del(id).pipe(
      Effect.mapError(() => new UserPersistenceError()),
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new UserNotFound()),
          onSome: (user) => Effect.succeed(user),
        }),
      ),
    );
  }
}
