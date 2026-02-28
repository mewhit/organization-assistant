import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";

type OpenAiDebugEntry = {
  phase: string;
  request: unknown;
  response: unknown;
  metadata?: Record<string, unknown>;
};

export type OpenAiDebugSession = {
  sessionId: string;
  write: (entry: OpenAiDebugEntry) => Promise<void>;
};

function sanitizeFileSegment(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return JSON.stringify({ nonSerializable: true, preview: String(value) }, null, 2);
  }
}

export function createOpenAiDebugSession(flowName: string): OpenAiDebugSession {
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const flow = sanitizeFileSegment(flowName) || "default";
  const sessionId = `${now.toISOString().replace(/[:.]/g, "-")}-${randomUUID()}`;
  const baseDir = resolve(process.cwd(), "debug", "openai-responses", day, flow, sessionId);
  let sequence = 0;

  const write = async (entry: OpenAiDebugEntry): Promise<void> => {
    sequence += 1;
    const fileName = `${String(sequence).padStart(3, "0")}-${sanitizeFileSegment(entry.phase) || "response"}.json`;

    const payload = {
      sequence,
      timestamp: new Date().toISOString(),
      sessionId,
      flow,
      phase: entry.phase,
      metadata: entry.metadata ?? {},
      request: entry.request,
      response: entry.response,
    };

    try {
      await mkdir(baseDir, { recursive: true });
      await writeFile(join(baseDir, fileName), safeStringify(payload), "utf8");
    } catch (error) {
      console.error("[openai-debug] Failed to write debug file", error);
    }
  };

  return {
    sessionId,
    write,
  };
}
