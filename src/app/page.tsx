"use client";

import { useEffect, useRef, useState } from "react";
import { toast, Toaster } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  CloudUpload,
  FileText,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
// Mapped from "The Architectural Light" spec
const DS = {
  surface: "#f7f9fb",
  surfaceContainerLow: "#f2f4f6",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerHigh: "#e6e8ea",
  surfaceContainerHighest: "#e0e3e5",
  primary: "#004f89",
  primaryContainer: "#0067b1",
  onSurface: "#191c1e",
  onSurfaceVariant: "#414751",
  outline: "#717782",
  outlineVariant: "#c1c7d3",
  ambientShadow: "0px 2px 15px 0px rgba(25,28,30,0.04)",
  ctaGradient: "linear-gradient(135deg, #004f89 0%, #0067b1 100%)",
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrelloCard { id: string; name: string; idList: string }
interface TrelloList { id: string; name: string }
interface BoardData { cards: TrelloCard[]; lists: TrelloList[] }

// ─── Constants ────────────────────────────────────────────────────────────────

const CHECKLIST_ITEMS = [
  { id: "guideline", label: "Đã kiểm tra đúng Guideline & chính tả" },
  { id: "fileSize",  label: "File đã được nén đúng dung lượng chuẩn" },
  { id: "review",    label: "Đã review chất lượng với team outsource" },
] as const;

type ChecklistKey = (typeof CHECKLIST_ITEMS)[number]["id"];
type ChecklistState = Record<ChecklistKey, boolean>;

const DEFAULT_CHECKLIST: ChecklistState = { guideline: false, fileSize: false, review: false };
const MAX_FILE_MB = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(1) + " MB";
const allChecked = (c: ChecklistState) => Object.values(c).every(Boolean);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AutomationControlPage() {
  const [boardData, setBoardData]       = useState<BoardData | null>(null);
  const [isFetchingBoard, setFetching]  = useState(true);
  const [boardError, setBoardError]     = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState("");
  const [targetList, setTargetList]     = useState("");
  const [checklist, setChecklist]       = useState<ChecklistState>(DEFAULT_CHECKLIST);
  const [file, setFile]                 = useState<File | null>(null);
  const [isSubmitting, setSubmitting]   = useState(false);
  const [isDragging, setDragging]       = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch board data ──────────────────────────────────────────────────────────

  async function fetchBoardData() {
    setFetching(true);
    setBoardError(null);
    try {
      const res  = await fetch("/api/trello/board-data");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tải dữ liệu Trello");
      setBoardData(data);
    } catch (err) {
      setBoardError(err instanceof Error ? err.message : "Lỗi kết nối Trello");
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => { fetchBoardData(); }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  function handleChecklistChange(key: ChecklistKey, value: boolean) {
    setChecklist(prev => ({ ...prev, [key]: value }));
  }

  function handleFileChange(incoming: File | null) {
    if (!incoming) return;
    if (incoming.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`File vượt quá ${MAX_FILE_MB}MB.`);
      return;
    }
    setFile(incoming);
  }

  function handleFileDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    handleFileChange(e.dataTransfer.files[0] ?? null);
  }

  function clearFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function resetForm() {
    setSelectedCard(""); setTargetList("");
    setChecklist(DEFAULT_CHECKLIST); clearFile();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCard)        { toast.error("Vui lòng chọn một Trello Card.");            return; }
    if (!file)                { toast.error("Vui lòng đính kèm file trước khi gửi.");     return; }
    if (!allChecked(checklist)) { toast.error("Vui lòng tick đủ 3 mục Quality Check."); return; }

    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
    if (!webhookUrl) { toast.error("Webhook URL chưa được cấu hình."); return; }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("cardName",     selectedCard);
    formData.append("targetList",   targetList);
    formData.append("checklistData", JSON.stringify(checklist));
    formData.append("file",         file);

    try {
      const res = await fetch(webhookUrl, { method: "POST", body: formData });
      if (!res.ok) throw new Error((await res.text().catch(() => "")) || `HTTP ${res.status}`);
      resetForm();
      toast.success("🎉 Đã bắn lên Trello thành công!");
    } catch (err) {
      toast.error(`❌ Có lỗi xảy ra: ${err instanceof Error ? err.message : "Lỗi không xác định"}`);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: DS.surface, fontFamily: "var(--font-inter), sans-serif" }}>
      <Toaster position="top-right" richColors />

      {/* ── Perspective Header ── */}
      <header
        className="sticky top-0 z-10 backdrop-blur-md"
        style={{ background: `${DS.surface}cc` /* 80% opacity */ }}
      >
        <div className="mx-auto flex h-16 max-w-5xl items-center px-8">
          {/* Perspective Header: Title + Accent Line + Breadcrumb */}
          <div className="flex items-center gap-4">
            <h1
              className="text-xl font-semibold tracking-[-0.02em]"
              style={{ color: DS.onSurface, fontFamily: "var(--font-manrope), sans-serif" }}
            >
              Automation Control
            </h1>
            {/* The 2×24px vertical accent line from spec */}
            <div className="h-6 w-px" style={{ background: DS.surfaceContainerHighest }} />
            <span
              className="text-xs font-medium uppercase tracking-widest"
              style={{ color: DS.outline }}
            >
              Trello Design Workflow
            </span>
          </div>

          {/* Connection status — far right */}
          <div className="ml-auto text-xs">
            {isFetchingBoard && (
              <span className="flex items-center gap-1.5" style={{ color: DS.outline }}>
                <Loader2 className="h-3 w-3 animate-spin" />
                Đang tải Trello...
              </span>
            )}
            {boardError && !isFetchingBoard && (
              <button
                onClick={fetchBoardData}
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors hover:opacity-80"
                style={{ background: "#fde8e8", color: "#c0392b" }}
              >
                <AlertCircle className="h-3 w-3" />
                Lỗi kết nối
                <RefreshCw className="h-3 w-3" />
              </button>
            )}
            {boardData && !isFetchingBoard && (
              <span className="flex items-center gap-1.5" style={{ color: DS.primaryContainer }}>
                <CheckCircle2 className="h-3 w-3" />
                {boardData.cards.length} cards · {boardData.lists.length} lists
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── Error Banner ── */}
      {boardError && (
        <div style={{ background: "#fff5f5", borderBottom: `1px solid #fdd` }}>
          <div className="mx-auto flex max-w-5xl items-start gap-3 px-8 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <div className="flex-1 text-sm text-red-700">
              <p className="font-medium">{boardError}</p>
              <p className="mt-0.5 text-xs text-red-500">
                Kiểm tra <code className="rounded bg-red-100 px-1">TRELLO_API_KEY</code>,{" "}
                <code className="rounded bg-red-100 px-1">TRELLO_TOKEN</code>,{" "}
                <code className="rounded bg-red-100 px-1">TRELLO_BOARD_ID</code> trong{" "}
                <code className="rounded bg-red-100 px-1">.env.local</code>
              </p>
            </div>
            <button
              onClick={fetchBoardData}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
              style={{ background: DS.surfaceContainerLowest }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Thử lại
            </button>
          </div>
        </div>
      )}

      {/* ── Main — Workspace Layer ── */}
      <main className="mx-auto max-w-5xl px-8 py-12">
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid gap-6 lg:grid-cols-5">

            {/* ── Left column ── */}
            <div className="flex flex-col gap-6 lg:col-span-3">

              {/* Card Select */}
              <EtherCard title="Chọn Trello Card">
                <TrelloSelect
                  value={selectedCard}
                  onValueChange={(v: string | null) => setSelectedCard(v ?? "")}
                  disabled={isFetchingBoard}
                  placeholder="Chọn card..."
                  loading={isFetchingBoard}
                  emptyLabel={boardError ? "Không thể tải cards" : "Không có card nào"}
                  items={(boardData?.cards ?? []).map(c => ({ id: c.id, label: c.name }))}
                />
              </EtherCard>

              {/* List Select */}
              <EtherCard title="Chuyển sang Cột (List)">
                <TrelloSelect
                  value={targetList}
                  onValueChange={(v: string | null) => setTargetList(v ?? "")}
                  disabled={isFetchingBoard}
                  placeholder="Chọn cột đích..."
                  loading={isFetchingBoard}
                  emptyLabel={boardError ? "Không thể tải lists" : "Không có list nào"}
                  items={(boardData?.lists ?? []).map(l => ({ id: l.id, label: l.name }))}
                />
              </EtherCard>

              {/* Quality Checklist */}
              <EtherCard
                title="Quality Check"
                badge="Bắt buộc"
              >
                {/* No dividers — vertical spacing only (The Rule of No Dividers) */}
                <ul className="flex flex-col gap-0">
                  {CHECKLIST_ITEMS.map(({ id, label }, i) => (
                    <li
                      key={id}
                      className="flex items-center gap-3.5 py-3"
                      style={{
                        borderTop: i > 0 ? `1px solid ${DS.outlineVariant}26` : "none",
                        /* "Ghost Border" — 15% opacity — only as last resort for visual grouping */
                      }}
                    >
                      <Checkbox
                        id={id}
                        checked={checklist[id]}
                        onCheckedChange={v => handleChecklistChange(id, v === true)}
                        className="h-5 w-5 rounded-md"
                        style={
                          checklist[id]
                            ? { background: DS.primaryContainer, borderColor: DS.primaryContainer }
                            : { borderColor: DS.outlineVariant }
                        }
                      />
                      <Label
                        htmlFor={id}
                        className="cursor-pointer select-none text-sm leading-snug"
                        style={{ color: DS.onSurface }}
                      >
                        {label}
                      </Label>
                    </li>
                  ))}
                </ul>
              </EtherCard>
            </div>

            {/* ── Right column ── */}
            <div className="flex flex-col gap-6 lg:col-span-2">

              {/* File Upload */}
              <EtherCard title="Đính kèm File">
                {file ? (
                  <FilePreview file={file} onClear={clearFile} />
                ) : (
                  <DropZone
                    isDragging={isDragging}
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                  />
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="hidden"
                  onChange={e => handleFileChange(e.target.files?.[0] ?? null)}
                />
              </EtherCard>

              {/* CTA — Primary Button with 135° gradient */}
              <Button
                type="submit"
                disabled={isSubmitting || isFetchingBoard}
                className="h-12 w-full rounded-3xl text-base font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: DS.ctaGradient, boxShadow: DS.ambientShadow }}
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang gửi...</>
                ) : (
                  "Cập nhật lên Trello →"
                )}
              </Button>

              {/* Progress indicator — all 3 checks done */}
              {allChecked(checklist) && file && selectedCard && (
                <p
                  className="text-center text-xs font-medium"
                  style={{ color: DS.primaryContainer }}
                >
                  ✓ Sẵn sàng gửi
                </p>
              )}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

// ─── Design-System Sub-components ─────────────────────────────────────────────

/** EtherCard — surface_container_lowest (#fff) on surface floor, ambient shadow, NO border */
function EtherCard({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-3xl p-8"
      style={{
        background: DS.surfaceContainerLowest,
        boxShadow: DS.ambientShadow,
      }}
    >
      <div className="mb-6 flex items-center justify-between">
        <h2
          className="text-sm font-semibold tracking-[-0.01em]"
          style={{ color: DS.onSurface, fontFamily: "var(--font-manrope), sans-serif" }}
        >
          {title}
        </h2>
        {badge && (
          <span
            className="rounded-full px-3 py-0.5 text-xs font-medium"
            style={{ background: "#d2e4ff", color: DS.primary }}
          >
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

/** TrelloSelect — ghost border, 200ms focus transition */
function TrelloSelect({
  value,
  onValueChange,
  disabled,
  placeholder,
  loading,
  emptyLabel,
  items,
}: {
  value: string;
  onValueChange: (v: string | null) => void;
  disabled?: boolean;
  placeholder: string;
  loading?: boolean;
  emptyLabel?: string;
  items: { id: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        className="h-11 w-full rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2"
        style={{
          background: DS.surfaceContainerLowest,
          border: `1px solid ${DS.outlineVariant}26`, /* 15% opacity ghost border */
          color: value ? DS.onSurface : DS.outline,
          boxShadow: "none",
        }}
      >
        {loading ? (
          <span className="flex items-center gap-2" style={{ color: DS.outline }}>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Đang tải...
          </span>
        ) : (
          <SelectValue placeholder={placeholder} />
        )}
      </SelectTrigger>
      <SelectContent
        className="rounded-2xl border-0 p-1"
        style={{
          background: DS.surfaceContainerLowest,
          boxShadow: "0px 8px 32px 0px rgba(25,28,30,0.10)",
        }}
      >
        {items.length === 0 ? (
          <div className="px-3 py-4 text-center text-sm" style={{ color: DS.outline }}>
            {emptyLabel}
          </div>
        ) : (
          items.map(item => (
            <SelectItem
              key={item.id}
              value={item.label}
              className="rounded-xl text-sm"
              style={{ color: DS.onSurface }}
            >
              {item.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

/** DropZone — tonal background shift instead of dashed border when dragging */
function DropZone({
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
}: {
  isDragging: boolean;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload file"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      onKeyDown={e => e.key === "Enter" && onClick()}
      className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl px-6 py-10 text-center transition-all duration-200"
      style={{
        background: isDragging ? "#d2e4ff40" : DS.surfaceContainerLow,
        border: `2px dashed ${isDragging ? DS.primaryContainer : DS.outlineVariant}`,
      }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-2xl transition-colors duration-200"
        style={{ background: isDragging ? "#d2e4ff" : DS.surfaceContainerHighest }}
      >
        <CloudUpload
          className="h-6 w-6"
          style={{ color: isDragging ? DS.primaryContainer : DS.outline }}
        />
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: DS.onSurface }}>
          Kéo thả file vào đây
        </p>
        <p className="mt-1 text-xs" style={{ color: DS.outline }}>
          hoặc{" "}
          <span
            className="font-medium underline underline-offset-2 cursor-pointer"
            style={{ color: DS.primaryContainer }}
          >
            click để chọn file
          </span>
          {" "}· JPG, PNG, PDF (max {MAX_FILE_MB}MB)
        </p>
      </div>
    </div>
  );
}

/** FilePreview — tonal container, no border */
function FilePreview({ file, onClear }: { file: File; onClear: () => void }) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
      style={{ background: DS.surfaceContainerLow }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: "#d2e4ff" }}
      >
        <FileText className="h-5 w-5" style={{ color: DS.primaryContainer }} />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm font-medium"
          title={file.name}
          style={{ color: DS.onSurface }}
        >
          {file.name}
        </p>
        <p className="text-xs" style={{ color: DS.outline }}>
          {fmtMB(file.size)}
        </p>
      </div>
      <button
        type="button"
        onClick={onClear}
        aria-label="Xóa file"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors hover:opacity-80"
        style={{ background: DS.surfaceContainerHigh, color: DS.outline }}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
