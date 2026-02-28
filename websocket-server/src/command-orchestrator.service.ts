import OpenAI from "openai";
import { createOpenAiDebugSession } from "./openai-debug-logger";

type OpenAITool = {
  type: "function";
  function: {
    name: string;
    parameters: Record<string, unknown>;
    description?: string;
  };
};

type OpenAIFunctionCallOutputItem = {
  type: "function_call";
  call_id: string;
  name: string;
  arguments: string;
};

type OpenAIResponseWithOutput = OpenAI.Responses.Response & {
  output?: Array<{ type?: string } & Record<string, unknown>>;
};

type OrganizationLlm = {
  id: string;
  organizationId: string;
  apiKey: string;
};

type OrganizationMcpPlugin = {
  id: string;
  mcpPluginId: string;
  config?: unknown;
};

type McpPlugin = {
  id: string;
  name: string;
  tools?: unknown;
};

type ExecutedFunctionCall = {
  callId: string;
  name: string;
  arguments: Record<string, unknown>;
  result: unknown;
};

export type CommandIterationEvent = {
  round: number;
  functionCalls: ExecutedFunctionCall[];
  responseId: string;
};

type ExecuteCommandInput = {
  organizationLlmId: string;
  command: string;
};

type ExecuteCommandOptions = {
  onIteration?: (event: CommandIterationEvent) => void;
  previousResponseId?: string;
};

type FunctionCallOutputInputItem = {
  type: "function_call_output";
  call_id: string;
  output: string;
};

type OpenAiRoundInput = string | FunctionCallOutputInputItem[];

type ApiErrorShape = {
  statusCode?: number;
  message?: string;
};

class HttpRequestError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "HttpRequestError";
    this.statusCode = statusCode;
  }
}

function normalizeFunctionParameters(parameters: Record<string, unknown>): Record<string, unknown> {
  const schema = parameters && typeof parameters === "object" ? { ...parameters } : {};
  const properties =
    schema.properties && typeof schema.properties === "object" && !Array.isArray(schema.properties)
      ? (schema.properties as Record<string, unknown>)
      : {};

  const required = Array.isArray(schema.required) ? schema.required : [];

  return {
    ...schema,
    type: "object",
    properties,
    required,
    additionalProperties: schema.additionalProperties ?? false,
  };
}

function mapToFunctionTools(tools: OpenAITool[]): OpenAI.Responses.FunctionTool[] {
  return tools.map((tool) => ({
    type: "function",
    name: tool.function.name,
    parameters: normalizeFunctionParameters(tool.function.parameters ?? {}),
    description: tool.function.description ?? null,
    strict: false,
  }));
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseFunctionArguments(rawArguments: string): Record<string, unknown> {
  if (!rawArguments || rawArguments.trim().length === 0) {
    return {};
  }

  const parsed: unknown = JSON.parse(rawArguments);

  if (!isObjectRecord(parsed)) {
    throw new Error("Function arguments must be a JSON object");
  }

  return parsed;
}

function extractFunctionCalls(response: OpenAI.Responses.Response): OpenAIFunctionCallOutputItem[] {
  const typedResponse = response as OpenAIResponseWithOutput;

  if (!Array.isArray(typedResponse.output)) {
    return [];
  }

  return typedResponse.output
    .filter((item): item is OpenAIFunctionCallOutputItem => {
      if (!isObjectRecord(item)) {
        return false;
      }

      return (
        item.type === "function_call" &&
        typeof item.call_id === "string" &&
        typeof item.name === "string" &&
        typeof item.arguments === "string"
      );
    })
    .map((item) => ({
      type: "function_call",
      call_id: item.call_id,
      name: item.name,
      arguments: item.arguments,
    }));
}

function canExecuteViaGoogleSearchConsolePlugin(mcpPluginName: string): boolean {
  return mcpPluginName.trim().toLowerCase() === "google search console";
}

function resolveApiBaseUrl(): string {
  return process.env.HTTP_SERVER_URL ?? "http://localhost:3000";
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return (await response.json()) as T;
  }

  let message = `HTTP ${response.status}`;

  try {
    const errorPayload = (await response.json()) as ApiErrorShape;
    if (typeof errorPayload.message === "string" && errorPayload.message.length > 0) {
      message = errorPayload.message;
    }
  } catch {
    // keep default message
  }

  throw new HttpRequestError(response.status, message);
}

async function getOrganizationLlm(baseUrl: string, organizationLlmId: string): Promise<OrganizationLlm> {
  const response = await fetch(`${baseUrl}/organization-llm/${organizationLlmId}`);
  return parseJsonResponse<OrganizationLlm>(response);
}

async function getActiveOrganizationMcpPlugin(baseUrl: string, organizationId: string): Promise<OrganizationMcpPlugin> {
  const response = await fetch(`${baseUrl}/organization-mcp-plugin/by-organization/${organizationId}/active`);
  return parseJsonResponse<OrganizationMcpPlugin>(response);
}

async function getMcpPlugin(baseUrl: string, mcpPluginId: string): Promise<McpPlugin> {
  const response = await fetch(`${baseUrl}/mcp-plugin/${mcpPluginId}`);
  return parseJsonResponse<McpPlugin>(response);
}

async function executeMcpTool(
  baseUrl: string,
  mcpPluginName: string,
  toolName: string,
  input: Record<string, unknown>,
  credentials: unknown,
): Promise<unknown> {
  if (!canExecuteViaGoogleSearchConsolePlugin(mcpPluginName)) {
    throw new Error(`Unsupported MCP plugin executor for plugin '${mcpPluginName}'`);
  }

  const response = await fetch(`${baseUrl}/mcp-google-search-console-plugin/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tool: toolName,
      input,
      credentials,
    }),
  });

  const payload = await parseJsonResponse<{ tool: string; result: unknown }>(response);
  return payload.result;
}

export class CommandOrchestratorService {
  static async executeCommand(input: ExecuteCommandInput, options?: ExecuteCommandOptions): Promise<unknown> {
    const baseUrl = resolveApiBaseUrl();
    const organizationLlm = await getOrganizationLlm(baseUrl, input.organizationLlmId);
    const organizationMcpPlugin = await getActiveOrganizationMcpPlugin(baseUrl, organizationLlm.organizationId);
    const mcpPlugin = await getMcpPlugin(baseUrl, organizationMcpPlugin.mcpPluginId);

    const toolsJson = Array.isArray(mcpPlugin.tools) ? (mcpPlugin.tools as OpenAITool[]) : [];
    const functionTools = mapToFunctionTools(toolsJson);
    const openai = new OpenAI({ apiKey: organizationLlm.apiKey });
    const debugSession = createOpenAiDebugSession("websocket-command-orchestrator");

    const availableTools = new Set(functionTools.map((tool) => tool.name));

    const executedCalls: ExecutedFunctionCall[] = [];
    let firstResponse: OpenAI.Responses.Response | null = null;
    let currentResponse: OpenAI.Responses.Response;
    let round = 0;

    const emitIteration = (responseId: string, functionCalls: ExecutedFunctionCall[]) => {
      round += 1;
      options?.onIteration?.({
        round,
        functionCalls,
        responseId,
      });
    };

    const executeRounds = async (
      roundInput: OpenAiRoundInput,
      previousResponseId?: string,
    ): Promise<OpenAI.Responses.Response> => {
      const requestInput =
        typeof roundInput === "string"
          ? `${roundInput}\n\ntoday: ${Date.now()}`
          : [
              {
                role: "system" as const,
                content: `today: ${Date.now()}`,
              },
              ...roundInput,
            ];

      const requestPayload: OpenAI.Responses.ResponseCreateParamsNonStreaming = {
        model: "gpt-5.2",
        input: requestInput,
        previous_response_id: previousResponseId,
        tools: functionTools,
        temperature: 0,
      };

      const response = await openai.responses.create(requestPayload);

      await debugSession.write({
        phase: previousResponseId ? "follow-up-response" : "initial-response",
        request: requestPayload,
        response,
        metadata: {
          organizationLlmId: organizationLlm.id,
          mcpPluginId: mcpPlugin.id,
          previousResponseId: previousResponseId ?? null,
          debugSessionId: debugSession.sessionId,
        },
      });

      if (!firstResponse) {
        firstResponse = response;
      }

      const functionCalls = extractFunctionCalls(response);

      if (functionCalls.length === 0) {
        return response;
      }

      const roundExecutedCalls: ExecutedFunctionCall[] = [];

      for (const functionCall of functionCalls) {
        if (!availableTools.has(functionCall.name)) {
          throw new Error(`Requested tool '${functionCall.name}' is not available`);
        }

        let parsedArguments: Record<string, unknown> = {};
        let result: unknown;

        try {
          parsedArguments = parseFunctionArguments(functionCall.arguments);
          result = await executeMcpTool(
            baseUrl,
            mcpPlugin.name,
            functionCall.name,
            parsedArguments,
            organizationMcpPlugin.config,
          );

          await debugSession.write({
            phase: "tool-response",
            request: {
              tool: functionCall.name,
              input: parsedArguments,
              credentials: organizationMcpPlugin.config,
            },
            response: result,
            metadata: {
              organizationLlmId: organizationLlm.id,
              mcpPluginId: mcpPlugin.id,
              responseId: response.id,
              callId: functionCall.call_id,
              debugSessionId: debugSession.sessionId,
            },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const statusCode =
            error instanceof HttpRequestError
              ? error.statusCode
              : isObjectRecord(error) && typeof error.statusCode === "number"
                ? error.statusCode
                : null;

          result = {
            error: true,
            message,
            ...(statusCode ? { statusCode } : {}),
          };

          await debugSession.write({
            phase: "tool-response",
            request: {
              tool: functionCall.name,
              input: parsedArguments,
              credentials: organizationMcpPlugin.config,
            },
            response: result,
            metadata: {
              organizationLlmId: organizationLlm.id,
              mcpPluginId: mcpPlugin.id,
              responseId: response.id,
              callId: functionCall.call_id,
              debugSessionId: debugSession.sessionId,
              hasError: true,
              ...(statusCode ? { statusCode } : {}),
            },
          });
        }

        roundExecutedCalls.push({
          callId: functionCall.call_id,
          name: functionCall.name,
          arguments: parsedArguments,
          result,
        });
      }

      executedCalls.push(...roundExecutedCalls);
      emitIteration(response.id, roundExecutedCalls);

      const followUpInput = roundExecutedCalls.map((call) => ({
        type: "function_call_output" as const,
        call_id: call.callId,
        output: JSON.stringify(call.result),
      }));

      return executeRounds(followUpInput, response.id);
    };

    currentResponse = await executeRounds(input.command, options?.previousResponseId);

    if (executedCalls.length === 0) {
      return {
        organizationLlm,
        organizationMcpPlugin,
        mcpPlugin,
        response: firstResponse,
      };
    }

    return {
      organizationLlm,
      organizationMcpPlugin,
      mcpPlugin,
      response: {
        firstResponse,
        functionCalls: executedCalls,
        finalResponse: currentResponse,
      },
    };
  }
}
