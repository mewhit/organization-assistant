import type {
  CommandDto,
  CreateMcpPluginDto,
  CreateOrganizationContextDto,
  CreateOrganizationContextOrchestratorDto,
  CreateOrganizationDto,
  CreateOrganizationLlmDto,
  CreateOrganizationMcpPluginDto,
  CreateOrganizationUserDto,
  CreateOrganizationUserOrchestratorDto,
  CreateUserDto,
  McpPluginDto,
  OrganizationContextDto,
  OrganizationContextOrchestratorDto,
  OrganizationDto,
  OrganizationLlmDto,
  OrganizationMcpPluginDto,
  OrganizationUserDto,
  OrganizationUserOrchestratorDto,
  UpdateMcpPluginDto,
  UpdateOrganizationContextDto,
  UpdateOrganizationDto,
  UpdateOrganizationLlmDto,
  UpdateOrganizationMcpPluginDto,
  UpdateOrganizationUserDto,
  UpdateUserDto,
  UserDto,
} from "@libs/dto";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type ApiClientOptions = {
  baseUrl: string;
  fetchFn?: typeof fetch;
  headers?: HeadersInit;
};

export class ApiClientHttpError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `Request failed with status ${status}`);
    this.name = "ApiClientHttpError";
    this.status = status;
    this.body = body;
  }
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;
  private readonly headers?: HeadersInit;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.fetchFn = options.fetchFn ?? fetch;
    this.headers = options.headers;
  }

  private async request<TResponse, TBody = undefined>(method: HttpMethod, path: string, body?: TBody): Promise<TResponse> {
    const response = await this.fetchFn(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        ...this.headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await response.text();
    const parsedBody = text.length > 0 ? safeJsonParse(text) : undefined;

    if (!response.ok) {
      const message =
        parsedBody && typeof parsedBody === "object" && "message" in parsedBody
          ? String((parsedBody as { message?: unknown }).message ?? "")
          : `Request failed with status ${response.status}`;

      throw new ApiClientHttpError(response.status, parsedBody, message);
    }

    return parsedBody as TResponse;
  }

  readonly user = {
    create: (input: CreateUserDto) => this.request<UserDto, CreateUserDto>("POST", "/user", input),
    findOne: (id: string) => this.request<UserDto>("GET", `/user/${id}`),
    patch: (id: string, input: UpdateUserDto) => this.request<UserDto, UpdateUserDto>("PATCH", `/user/${id}`, input),
    put: (id: string, input: UpdateUserDto) => this.request<UserDto, UpdateUserDto>("PUT", `/user/${id}`, input),
    remove: (id: string) => this.request<UserDto>("DELETE", `/user/${id}`),
  };

  readonly organization = {
    create: (input: CreateOrganizationDto) => this.request<OrganizationDto, CreateOrganizationDto>("POST", "/organization", input),
    findOne: (id: string) => this.request<OrganizationDto>("GET", `/organization/${id}`),
    patch: (id: string, input: UpdateOrganizationDto) =>
      this.request<OrganizationDto, UpdateOrganizationDto>("PATCH", `/organization/${id}`, input),
    put: (id: string, input: UpdateOrganizationDto) =>
      this.request<OrganizationDto, UpdateOrganizationDto>("PUT", `/organization/${id}`, input),
    remove: (id: string) => this.request<OrganizationDto>("DELETE", `/organization/${id}`),
  };

  readonly organizationUser = {
    create: (input: CreateOrganizationUserDto) =>
      this.request<OrganizationUserDto, CreateOrganizationUserDto>("POST", "/organization-user", input),
    findOne: (id: string) => this.request<OrganizationUserDto>("GET", `/organization-user/${id}`),
    patch: (id: string, input: UpdateOrganizationUserDto) =>
      this.request<OrganizationUserDto, UpdateOrganizationUserDto>("PATCH", `/organization-user/${id}`, input),
    put: (id: string, input: UpdateOrganizationUserDto) =>
      this.request<OrganizationUserDto, UpdateOrganizationUserDto>("PUT", `/organization-user/${id}`, input),
    remove: (id: string) => this.request<OrganizationUserDto>("DELETE", `/organization-user/${id}`),
  };

  readonly organizationContext = {
    create: (input: CreateOrganizationContextDto) =>
      this.request<OrganizationContextDto, CreateOrganizationContextDto>("POST", "/organization-context", input),
    findOne: (id: string) => this.request<OrganizationContextDto>("GET", `/organization-context/${id}`),
    patch: (id: string, input: UpdateOrganizationContextDto) =>
      this.request<OrganizationContextDto, UpdateOrganizationContextDto>("PATCH", `/organization-context/${id}`, input),
    put: (id: string, input: UpdateOrganizationContextDto) =>
      this.request<OrganizationContextDto, UpdateOrganizationContextDto>("PUT", `/organization-context/${id}`, input),
    remove: (id: string) => this.request<OrganizationContextDto>("DELETE", `/organization-context/${id}`),
  };

  readonly organizationContextOrchestrator = {
    create: (input: CreateOrganizationContextOrchestratorDto) =>
      this.request<OrganizationContextOrchestratorDto, CreateOrganizationContextOrchestratorDto>(
        "POST",
        "/organization-context-orchestrator",
        input,
      ),
  };

  readonly organizationLlm = {
    create: (input: CreateOrganizationLlmDto) =>
      this.request<OrganizationLlmDto, CreateOrganizationLlmDto>("POST", "/organization-llm", input),
    findOne: (id: string) => this.request<OrganizationLlmDto>("GET", `/organization-llm/${id}`),
    patch: (id: string, input: UpdateOrganizationLlmDto) =>
      this.request<OrganizationLlmDto, UpdateOrganizationLlmDto>("PATCH", `/organization-llm/${id}`, input),
    put: (id: string, input: UpdateOrganizationLlmDto) =>
      this.request<OrganizationLlmDto, UpdateOrganizationLlmDto>("PUT", `/organization-llm/${id}`, input),
    remove: (id: string) => this.request<OrganizationLlmDto>("DELETE", `/organization-llm/${id}`),
  };

  readonly mcpPlugin = {
    create: (input: CreateMcpPluginDto) => this.request<McpPluginDto, CreateMcpPluginDto>("POST", "/mcp-plugin", input),
    findOne: (id: string) => this.request<McpPluginDto>("GET", `/mcp-plugin/${id}`),
    patch: (id: string, input: UpdateMcpPluginDto) => this.request<McpPluginDto, UpdateMcpPluginDto>("PATCH", `/mcp-plugin/${id}`, input),
    put: (id: string, input: UpdateMcpPluginDto) => this.request<McpPluginDto, UpdateMcpPluginDto>("PUT", `/mcp-plugin/${id}`, input),
    remove: (id: string) => this.request<McpPluginDto>("DELETE", `/mcp-plugin/${id}`),
  };

  readonly organizationMcpPlugin = {
    create: (input: CreateOrganizationMcpPluginDto) =>
      this.request<OrganizationMcpPluginDto, CreateOrganizationMcpPluginDto>("POST", "/organization-mcp-plugin", input),
    findOne: (id: string) => this.request<OrganizationMcpPluginDto>("GET", `/organization-mcp-plugin/${id}`),
    patch: (id: string, input: UpdateOrganizationMcpPluginDto) =>
      this.request<OrganizationMcpPluginDto, UpdateOrganizationMcpPluginDto>("PATCH", `/organization-mcp-plugin/${id}`, input),
    put: (id: string, input: UpdateOrganizationMcpPluginDto) =>
      this.request<OrganizationMcpPluginDto, UpdateOrganizationMcpPluginDto>("PUT", `/organization-mcp-plugin/${id}`, input),
    remove: (id: string) => this.request<OrganizationMcpPluginDto>("DELETE", `/organization-mcp-plugin/${id}`),
  };

  readonly organizationUserOrchestrator = {
    create: (input: CreateOrganizationUserOrchestratorDto) =>
      this.request<OrganizationUserOrchestratorDto, CreateOrganizationUserOrchestratorDto>(
        "POST",
        "/organization-user-orchestrator",
        input,
      ),
  };

  readonly command = {
    execute: (input: CommandDto) => this.request<Record<string, never>, CommandDto>("POST", "/command", input),
  };
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}
