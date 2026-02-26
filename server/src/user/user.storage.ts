import { Effect } from "effect";

import { db } from "@db/client";
import { usersTable } from "../db/schemas/user.schema";

export class UserAlreadyExists {
  readonly _tag = "UserAlreadyExists";
}

export class UserStorageUnavailable {
  readonly _tag = "UserStorageUnavailable";
}

type InsertedUser = {
  id: number;
  email: string;
  name: string;
};

const isUniqueViolation = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  return "code" in error && (error as { code?: string }).code === "23505";
};

export class UserStorage {
  static insert = (email: string, name: string): Effect.Effect<InsertedUser, UserAlreadyExists | UserStorageUnavailable> =>
    Effect.gen(function* () {
      if (!db) {
        return yield* Effect.fail(new UserStorageUnavailable());
      }

      const insertedRows = yield* Effect.tryPromise({
        try: () =>
          db.insert(usersTable).values({ email, name }).returning({
            id: usersTable.id,
            email: usersTable.email,
            name: usersTable.name,
          }),
        catch: (error) => (isUniqueViolation(error) ? new UserAlreadyExists() : new UserStorageUnavailable()),
      });

      const insertedUser = insertedRows.at(0);

      if (!insertedUser) {
        return yield* Effect.fail(new UserStorageUnavailable());
      }

      return insertedUser;
    });
}
