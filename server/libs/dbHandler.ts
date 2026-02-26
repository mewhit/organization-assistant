import { Effect } from "effect";

export class UnknownDbError {
  readonly _tag = "UnknownDbError";
  constructor(readonly cause: unknown) {}
}

export type DbError = UnknownDbError;

export function mapDbError(error: unknown): DbError {
  console.error("Database error:", error);
  return new UnknownDbError(error);
}

export function dbHandler<A>(operation: () => Promise<A>): Effect.Effect<A, DbError> {
  return Effect.tryPromise({
    try: operation,
    catch: mapDbError,
  });
}
