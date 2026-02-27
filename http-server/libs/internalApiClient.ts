import { Effect } from "effect";
import { ApiClient, ApiClientHttpError } from "@libs/apiClient";

const port = process.env.PORT ?? "3000";
const baseUrl = process.env.INTERNAL_API_BASE_URL ?? `http://127.0.0.1:${port}`;

const apiClient = new ApiClient({ baseUrl });

export class InternalApiClientError {
  readonly _tag = "InternalApiClientError";

  constructor(readonly cause: unknown) {}
}

export type InternalApiError = ApiClientHttpError | InternalApiClientError;

function toEffect<A>(operation: () => Promise<A>): Effect.Effect<A, InternalApiError> {
  return Effect.tryPromise({
    try: operation,
    catch: (error) => (error instanceof ApiClientHttpError ? error : new InternalApiClientError(error)),
  });
}

export const internalApiClient = {
  user: {
    findOne: (id: string) => toEffect(() => apiClient.user.findOne(id)),
  },
  organization: {
    findOne: (id: string) => toEffect(() => apiClient.organization.findOne(id)),
  },
  organizationUser: {
    create: (input: Parameters<typeof apiClient.organizationUser.create>[0]) => toEffect(() => apiClient.organizationUser.create(input)),
  },
  organizationContext: {
    create: (input: Parameters<typeof apiClient.organizationContext.create>[0]) =>
      toEffect(() => apiClient.organizationContext.create(input)),
  },
};
