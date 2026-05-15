const HERMES_DEFAULT_URL = "http://localhost:8642/v1";

interface HermesClientOptions {
  apiUrl?: string;
  apiKey?: string;
}

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
}

interface ChatCompletionRequest {
  model?: string;
  messages: ChatMessage[];
  stream?: boolean;
  tools?: unknown[];
}

interface ChatCompletionChunk {
  id: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
      tool_calls?: unknown[];
    };
    finish_reason: string | null;
  }[];
}

export function createHermesClient(opts: HermesClientOptions = {}) {
  const baseUrl = opts.apiUrl || process.env.HERMES_API_URL || HERMES_DEFAULT_URL;
  const apiKey = opts.apiKey || process.env.HERMES_API_KEY || "";

  async function chatCompletions(
    body: ChatCompletionRequest,
  ): Promise<Response> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    return fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: body.model || "hermes",
        messages: body.messages,
        stream: body.stream ?? false,
        tools: body.tools,
      }),
    });
  }

  async function* streamChatCompletions(
    body: ChatCompletionRequest,
  ): AsyncGenerator<ChatCompletionChunk> {
    const response = await chatCompletions({ ...body, stream: true });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Hermes API error (${response.status}): ${err}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Response body is not readable");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;

        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") return;

        try {
          yield JSON.parse(data) as ChatCompletionChunk;
        } catch {
          // skip unparseable chunks
        }
      }
    }
  }

  return { chatCompletions, streamChatCompletions };
}
