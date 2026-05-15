"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";

export interface Attachment {
  id: string;
  name: string;
  type: "image" | "text";
  size: number;
  /** Base64 data URL for images, text content for text/docs */
  data: string;
  /** Raw ArrayBuffer for binary document parsing (pdf, docx, xlsx) */
  binaryData?: ArrayBuffer;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: Attachment[];
  toolCalls?: ToolCall[];
  isStreaming?: boolean;
  createdAt: Date;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: string;
  result?: string;
  status: "pending" | "running" | "done" | "error";
  /** Display label from hermes.tool.progress — shown in the UI */
  label?: string;
  /** Emoji from hermes.tool.progress */
  emoji?: string;
  /** Timestamp when the tool started (for duration display) */
  startedAt?: number;
}

/** Extensions we can read as plain text and attach as code blocks */
const TEXT_EXTENSIONS = new Set([
  "txt", "md", "markdown", "py", "js", "ts", "tsx", "jsx", "json",
  "yaml", "yml", "toml", "ini", "cfg", "env", "log", "sh", "bash", "zsh",
  "ps1", "sql", "html", "htm", "css", "scss", "less", "xml", "svg",
  "graphql", "gql", "proto", "rs", "go", "java", "kt", "swift", "c", "cpp",
  "h", "hpp", "cs", "rb", "php", "pl", "r", "m", "mm", "lua", "vim",
  "Makefile", "Dockerfile", "dockerignore", "gitignore", "editorconfig",
]);

/** Extensions we can render as images */
const IMAGE_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "bmp", "ico", "tiff", "tif",
]);

/** Extensions for binary documents — parsed client-side, embedded as text */
const DOCUMENT_EXTENSIONS = new Set([
  "pdf", "docx", "doc", "xlsx", "xls", "xlsm", "csv",
  "pptx", "ppt", "odt", "ods", "odp", "rtf",
]);

/** All file extensions we can parse client-side */
const PARSABLE_EXTENSIONS = new Set([
  ...TEXT_EXTENSIONS,
  ...IMAGE_EXTENSIONS,
  ...DOCUMENT_EXTENSIONS,
]);

export function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.slice(lastDot + 1).toLowerCase();
}

export function classifyFile(filename: string): "image" | "text" | null {
  const ext = getExtension(filename);
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (TEXT_EXTENSIONS.has(ext) || DOCUMENT_EXTENSIONS.has(ext)) return "text";
  return null;
}

export const SUPPORTED_FILE_EXTENSIONS = PARSABLE_EXTENSIONS;

/** Returns true for binary document types that need async parsing */
export function isDocumentFile(filename: string): boolean {
  return DOCUMENT_EXTENSIONS.has(getExtension(filename));
}

let msgCounter = 0;
function nextId(prefix = "msg"): string {
  msgCounter += 1;
  return `${prefix}-${Date.now()}-${msgCounter}`;
}

interface UseChatStreamOptions {
  apiPath?: string;
  model?: string;
  onError?: (err: Error) => void;
}

export function useChatStream(opts: UseChatStreamOptions = {}) {
  const { apiPath = "/api/hermes/chat/completions", model = "deepseek-v4-flash" } = opts;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  // keep the ref in sync so the async callback always reads latest state
  messagesRef.current = messages;

  const sendMessage = useCallback(
    async (content: string, attachments?: Attachment[]) => {
      if (!content.trim() && (!attachments || attachments.length === 0)) return;
      setIsLoading(true);

      // Build the display text: for text files, embed content in message
      let displayContent = content.trim();
      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          if (att.type === "text") {
            const ext = getExtension(att.name) || "text";
            displayContent += `\n\n\`\`\`${ext}\n${att.data}\n\`\`\``;
          }
        }
      }

      const userMsg: ChatMessage = {
        id: nextId("user"),
        role: "user",
        content: displayContent,
        attachments: attachments,
        createdAt: new Date(),
      };

      const assistantMsg: ChatMessage = {
        id: nextId("asst"),
        role: "assistant",
        content: "",
        isStreaming: true,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);

      const controller = new AbortController();
      abortRef.current = controller;

      // Build API messages from the ref snapshot
      const priorMessages = messagesRef.current;
      const apiMessages = [...priorMessages, userMsg].map((m) => {
        // Build multimodal content array if message has image attachments
        if (m.attachments && m.attachments.some((a) => a.type === "image")) {
          const parts: Array<Record<string, unknown>> = [];
          // text part
          if (m.content) {
            parts.push({ type: "text", text: m.content });
          }
          // image parts
          for (const att of m.attachments) {
            if (att.type === "image") {
              parts.push({
                type: "image_url",
                image_url: { url: att.data },
              });
            }
          }
          return { role: m.role, content: parts };
        }
        return { role: m.role, content: m.content };
      });

      try {
        const response = await fetch(apiPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages: apiMessages,
            stream: true,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const err = await response.text();
          throw new Error(`API error (${response.status}): ${err}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("Response body is not readable");

        const decoder = new TextDecoder();
        let buffer = "";
        let content = "";
        let currentEventType = "";
        const toolCalls: ToolCall[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();

            // Blank line resets the SSE event type
            if (!trimmed) {
              currentEventType = "";
              continue;
            }

            // Track SSE named events
            if (trimmed.startsWith("event:")) {
              currentEventType = trimmed.slice(6).trim();
              continue;
            }

            if (!trimmed.startsWith("data:")) continue;

            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") continue;

            // ── hermes.tool.progress event ──
            if (currentEventType === "hermes.tool.progress") {
              try {
                const progress = JSON.parse(data);
                const toolCallId: string = progress.toolCallId || progress.id || "";
                const name: string = progress.tool || "";
                const status: ToolCall["status"] =
                  progress.status === "completed" ? "done" : "running";
                const label: string = progress.label || name;
                const emoji: string = progress.emoji || "⚡";
                const args: string = progress.arguments || "";
                const result: string | undefined = progress.result || undefined;

                const existing = toolCalls.find((tc) => tc.id === toolCallId);
                if (existing) {
                  existing.status = status;
                  if (result) existing.result = result;
                } else if (toolCallId) {
                  toolCalls.push({
                    id: toolCallId,
                    name,
                    arguments: args,
                    status,
                    label,
                    emoji,
                    result,
                    startedAt: status === "running" ? Date.now() : undefined,
                  });
                }

                // Push toolCalls into the assistant message in real-time
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === "assistant") {
                    updated[updated.length - 1] = {
                      ...last,
                      content: content,
                      toolCalls: [...toolCalls],
                    };
                  }
                  return updated;
                });
              } catch {
                // skip unparseable progress events
              }
              currentEventType = "";
              continue;
            }

            // ── Regular content delta ──
            try {
              const chunk = JSON.parse(data);
              const delta = chunk.choices?.[0]?.delta;

              if (delta?.content) {
                content += delta.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === "assistant") {
                    updated[updated.length - 1] = {
                      ...last,
                      content: content,
                      toolCalls: toolCalls.length > 0 ? [...toolCalls] : undefined,
                    };
                  }
                  return updated;
                });
              }
            } catch {
              // skip unparseable chunks
            }
          }
        }

        // finalize
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            updated[updated.length - 1] = {
              ...last,
              content: content,
              isStreaming: false,
              toolCalls: toolCalls.length > 0 ? [...toolCalls] : undefined,
            };
          }
          return updated;
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;

        const message =
          err instanceof Error ? err.message : "Unknown error";
        toast.error("对话失败", { description: message });

        // mark the assistant message as error
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            updated[updated.length - 1] = {
              ...last,
              content:
                last.content || `请求失败: ${message}`,
              isStreaming: false,
            };
          }
          return updated;
        });
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [model, apiPath],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const loadMessages = useCallback((msgs: ChatMessage[]) => {
    setMessages(msgs);
    if (msgs.length > 0) {
      const maxNum = msgs.reduce((max, m) => {
        const match = m.id.match(/-(\d+)$/);
        return match ? Math.max(max, parseInt(match[1], 10)) : max;
      }, 0);
      msgCounter = maxNum;
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    msgCounter = 0;
  }, []);

  return { messages, isLoading, sendMessage, stop, loadMessages, clearMessages };
}
