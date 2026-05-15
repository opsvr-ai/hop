"use client";

import { useState, useRef, useCallback, type KeyboardEvent, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Square, Paperclip, X, FileText, ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Attachment, classifyFile, isDocumentFile } from "@/hooks/useChatStream";
import { extractPdfText, extractDocxText, extractExcelText } from "@/lib/file-parsers";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

interface ChatInputProps {
  onSend: (content: string, attachments?: Attachment[]) => void;
  onStop?: () => void;
  isLoading?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

let attachCounter = 0;
function nextAttachId(): string {
  attachCounter += 1;
  return `att-${Date.now()}-${attachCounter}`;
}

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

async function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/** Parse a document file into text */
async function parseDocument(file: File): Promise<string> {
  const buf = await readFileAsArrayBuffer(file);
  const ext = file.name.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "pdf":
      return extractPdfText(buf);
    case "docx":
    case "doc":
      return extractDocxText(buf);
    case "xlsx":
    case "xls":
    case "xlsm":
    case "csv":
    case "ods":
      return extractExcelText(buf);
    case "pptx":
    case "ppt":
    case "odp":
      // pptx is a zip of XML — use the generic docx approach won't work.
      // For now, return a note that PPT parsing requires further support.
      try {
        return extractDocxText(buf); // some presentations may work partially
      } catch {
        return `[${file.name}] — 演示文稿暂不支持完整解析，可转换为 PDF 后上传。`;
      }
    default:
      // Fallback: try mammoth for doc-like, otherwise return raw text attempt
      try {
        return extractDocxText(buf);
      } catch {
        // Last resort: try reading as plain text
        const decoder = new TextDecoder();
        return decoder.decode(buf);
      }
  }
}

export function ChatInput({
  onSend,
  onStop,
  isLoading = false,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if ((!trimmed && attachments.length === 0) || isLoading) return;
    onSend(trimmed, attachments.length > 0 ? attachments : undefined);
    setValue("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, isLoading, onSend, attachments]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  /* ---------- file handling ---------- */
  const [parsing, setParsing] = useState(false);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const newAttachments: Attachment[] = [];

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) continue;

      const type = classifyFile(file.name);
      if (!type) continue;

      try {
        let data: string;

        if (type === "image") {
          data = await readFileAsDataURL(file);
        } else if (isDocumentFile(file.name)) {
          setParsing(true);
          data = await parseDocument(file);
          setParsing(false);
        } else {
          data = await readFileAsText(file);
        }

        newAttachments.push({
          id: nextAttachId(),
          name: file.name,
          type,
          size: file.size,
          data,
        });
      } catch {
        // skip unreadable files
      }
    }

    setParsing(false);
    setAttachments((prev) => [...prev, ...newAttachments]);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        processFiles(e.target.files);
        e.target.value = "";
      }
    },
    [processFiles]
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  /* ---------- drag & drop ---------- */
  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  /* ---------- render ---------- */
  const canSend = (value.trim().length > 0 || attachments.length > 0) && !isLoading;

  return (
    <div
      className={cn("relative")}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {dragOver && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl
                        bg-primary/5 border-2 border-dashed border-primary/40 backdrop-blur-sm">
          <span className="text-sm font-medium text-primary">释放以添加文件</span>
        </div>
      )}

      {/* Attachment preview chips */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2 px-1">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="inline-flex items-center gap-1.5 rounded-lg bg-muted/60 border border-border/50
                         px-2.5 py-1 text-xs group"
            >
              {att.type === "image" ? (
                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              ) : (
                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <span className="max-w-32 truncate text-foreground/80">{att.name}</span>
              <span className="text-[0.6rem] text-muted-foreground/50 shrink-0">
                {parsing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  formatSize(att.size)
                )}
              </span>
              <button
                onClick={() => removeAttachment(att.id)}
                className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full
                           text-muted-foreground/40 hover:text-foreground hover:bg-muted
                           opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main input bar */}
      <div className="glass-panel-strong rounded-2xl p-2 glow-ring">
        <div className="flex items-end gap-2">
          {/* Attach button */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            className="h-9 w-9 rounded-full shrink-0 text-muted-foreground/60
                       hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            accept=".txt,.md,.py,.js,.ts,.tsx,.jsx,.json,.csv,.yaml,.yml,.toml,.ini,.env,.log,.sh,.sql,.html,.css,.xml,.svg,.png,.jpg,.jpeg,.gif,.webp,.pdf,.docx,.doc,.xlsx,.xls,.xlsm,.pptx,.ppt,.odt,.ods,.odp,.rtf"
          />

          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              handleInput();
            }}
            onKeyDown={handleKeyDown}
            placeholder={attachments.length > 0 ? "添加消息或直接发送文件…" : "输入消息… Enter 发送，Shift+Enter 换行"}
            rows={1}
            className="flex-1 resize-none border-0 bg-transparent px-1 py-2
                       text-sm placeholder:text-muted-foreground/50
                       focus-visible:ring-0 focus-visible:ring-offset-0
                       min-h-[2.25rem] max-h-40"
          />

          {isLoading ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={onStop}
              className="h-9 w-9 rounded-full shrink-0 text-muted-foreground hover:text-foreground"
            >
              <Square className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              onClick={handleSend}
              disabled={!canSend}
              className="h-9 w-9 rounded-full shrink-0 bg-primary text-primary-foreground
                         hover:bg-primary/90 active:scale-95
                         disabled:opacity-30 disabled:cursor-not-allowed
                         transition-all"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
