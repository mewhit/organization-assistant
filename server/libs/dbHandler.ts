import { Effect } from "effect";

export class UnknownDbError {
  readonly _tag = "UnknownDbError";
  constructor(readonly cause: unknown) {}
}

export class NotFoundError {
  readonly _tag = "NotFoundError";
  constructor(readonly message: string) {}
}

export class DuplicateEntryError {
  readonly _tag = "DuplicateEntryError";
  constructor(readonly message: string) {}
}

export type DbError = UnknownDbError | NotFoundError | DuplicateEntryError;

export function mapDbError(error: unknown): DbError {
  console.error("Database error:", error);

  if (error && typeof error === "object" && ("errno" in error || "code" in error)) {
    const dbError = error as any;
    if (dbError.errno === 1062 || dbError.code === "ER_DUP_ENTRY") {
      return new DuplicateEntryError(dbError.sqlMessage || "Duplicate entry");
    }
  }

  return new UnknownDbError(error);
}

export function dbHandler<A>(operation: () => Promise<A>): Effect.Effect<A, DbError> {
  return Effect.tryPromise({
    try: operation,
    catch: mapDbError,
  });
}

export function mapErrorToHttp(error: unknown): { statusCode: 400 | 404 | 409 | 500; message: string } {
  if (error && typeof error === "object" && "_tag" in error) {
    const tag = (error as any)._tag;
    if (tag.endsWith("NotFound")) {
      const entity = tag.replace("NotFound", "");
      return { statusCode: 404, message: `${entity} not found` };
    }
    if (tag.endsWith("AlreadyExists")) {
      const entity = tag.replace("AlreadyExists", "");
      return { statusCode: 409, message: `${entity} already exists` };
    }
  }

  if (error instanceof UnknownDbError) {
    return { statusCode: 500, message: "Database error" };
  }

  if (error instanceof NotFoundError) {
    return { statusCode: 404, message: error.message };
  }

  if (error instanceof DuplicateEntryError) {
    return { statusCode: 409, message: error.message };
  }

  return { statusCode: 500, message: "Internal server error" };
}
