import assert from "node:assert/strict";
import { before, test } from "node:test";

const API_BASE_URL = "http://localhost:3000";
let serverAvailable = true;

type JsonResponse<T> = {
  status: number;
  data: T;
};

function isDatabaseErrorResponse(response: JsonResponse<unknown>): boolean {
  if (response.status !== 500 || !response.data || typeof response.data !== "object") {
    return false;
  }

  return "message" in response.data && (response.data as { message?: unknown }).message === "Database error";
}

async function postJson<TResponse>(path: string, payload: unknown): Promise<JsonResponse<TResponse>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const raw = await response.text();
  const data = raw ? (JSON.parse(raw) as TResponse) : ({} as TResponse);

  return {
    status: response.status,
    data,
  };
}

async function postUsingOrchestratorIfExists<TResponse>(
  orchestratorPath: string,
  fallbackPath: string,
  payload: unknown,
): Promise<JsonResponse<TResponse>> {
  const orchestratorResponse = await postJson<TResponse>(orchestratorPath, payload);

  if (orchestratorResponse.status === 404) {
    return postJson<TResponse>(fallbackPath, payload);
  }

  return orchestratorResponse;
}

before(async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/openapi.json`, {
      signal: AbortSignal.timeout(2000),
    });

    serverAvailable = response.ok;
  } catch {
    serverAvailable = false;
  }
});

test("e2e: create user, organization, link, and create organization context", async (t) => {
  if (!serverAvailable) {
    t.skip("Server is not reachable on http://localhost:3000");
    return;
  }

  const timestamp = Date.now();

  const userResponse = await postJson<{ id: string; email: string }>("/user/", {
    email: `e2e-user-${timestamp}@example.com`,
    firstName: "E2E",
    lastName: "Tester",
    displayName: "E2E Tester",
  });

  if (isDatabaseErrorResponse(userResponse)) {
    t.skip("Server is reachable but database is not ready for e2e scenario");
    return;
  }

  assert.equal(userResponse.status, 201, JSON.stringify(userResponse.data));
  const user = userResponse.data;
  assert.ok(user.id);

  const organizationResponse = await postJson<{ id: string; name: string }>("/organization/", {
    name: `E2E Org ${timestamp}`,
  });

  assert.equal(organizationResponse.status, 201, JSON.stringify(organizationResponse.data));
  const organization = organizationResponse.data;
  assert.ok(organization.id);

  const organizationUserResponse = await postUsingOrchestratorIfExists<{ userId: string; organizationId: string }>(
    "/organization-user-orchestrator/",
    "/organization-user/",
    {
      userId: user.id,
      organizationId: organization.id,
    },
  );

  assert.equal(organizationUserResponse.status, 201, JSON.stringify(organizationUserResponse.data));
  const organizationUser = organizationUserResponse.data;
  assert.equal(organizationUser.userId, user.id);
  assert.equal(organizationUser.organizationId, organization.id);

  const organizationContextResponse = await postUsingOrchestratorIfExists<{
    context: string;
    organizationId: string;
    updatedBy: string | null;
  }>("/organization-context-orchestrator/", "/organization-context/", {
    context: `Context for user ${user.id}`,
    organizationId: organization.id,
    updatedBy: user.id,
  });

  assert.equal(organizationContextResponse.status, 201, JSON.stringify(organizationContextResponse.data));
  const organizationContext = organizationContextResponse.data;

  assert.equal(organizationContext.organizationId, organization.id);
  assert.equal(organizationContext.updatedBy, user.id);
  assert.match(organizationContext.context, new RegExp(user.id));
});
