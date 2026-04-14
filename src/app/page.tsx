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
  Rocket,
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrelloCard {
  id: string;
  name: string;
  idList: string;
}

interface TrelloList {
  id: string;
  name: string;
}

interface BoardData {
  cards: TrelloCard[];
  lists: TrelloList[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CHECKLIST_ITEMS = [
  { id: "guideline", label: "Đã kiểm tra đúng Guideline & chính tả" },
  { id: "fileSize", label: "File đã được nén đúng dung lượng chuẩn" },
  { id: "review", label: "Đã review chất lượng với team outsource" },
] as const;

type ChecklistKey = (typeof CHECKLIST_ITEMS)[number]["id"];
type ChecklistState = Record<ChecklistKey, boolean>;

const DEFAULT_CHECKLIST: ChecklistState = {
  guideline: false,
  fileSize: false,
  review: false,
};

const MAX_FILE_MB = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function allChecked(checklist: ChecklistState): boolean {
  return Object.values(checklist).every(Boolean);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AutomationControlPage() {
  // ── Board data state ─────────────────────────────────────────────────────────
  const [boardData, setBoardData] = useState<BoardData | null>(null);
  const [isFetchingBoard, setIsFetchingBoard] = useState(true);
  const [boardError, setBoardError] = useState<string | null>(null);

  // ── Form state ───────────────────────────────────────────────────────────────
  const [selectedCard, setSelectedCard] = useState<string>("");
  const [targetList, setTargetList] = useState<string>("");
  const [checklist, setChecklist] = useState<ChecklistState>(DEFAULT_CHECKLIST);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch board data on mount ─────────────────────────────────────────────────

  async function fetchBoardData() {
    setIsFetchingBoard(true);
    setBoardError(null);
    try {
      const res = await fetch("/api/trello/board-data");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tải dữ liệu Trello");
      setBoardData(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi kết nối Trello";
      setBoardError(msg);
    } finally {
      setIsFetchingBoard(false);
    }
  }

  useEffect(() => {
    fetchBoardData();
  }, []);

  // ── Form handlers ─────────────────────────────────────────────────────────────

  function handleChecklistChange(key: ChecklistKey, value: boolean) {
    setChecklist((prev) => ({ ...prev, [key]: value }));
  }

  function handleFileChange(incoming: File | null) {
    if (!incoming) return;
    if (incoming.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`File vượt quá ${MAX_FILE_MB}MB. Vui lòng chọn file nhỏ hơn.`);
      return;
    }
    setFile(incoming);
  }

  function handleFileDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files[0] ?? null);
  }

  function clearFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function resetForm() {
    setSelectedCard("");
    setTargetList("");
    setChecklist(DEFAULT_CHECKLIST);
    clearFile();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedCard) {
      toast.error("Vui lòng chọn một Trello Card.");
      return;
    }
    if (!file) {
      toast.error("Vui lòng đính kèm file trước khi gửi.");
      return;
    }
    if (!allChecked(checklist)) {
      toast.error("Vui lòng tick đủ 3 mục Quality Check trước khi gửi.");
      return;
    }

    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      toast.error("Webhook URL chưa được cấu hình.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("cardName", selectedCard);
    formData.append("targetList", targetList);
    formData.append("checklistData", JSON.stringify(checklist));
    formData.append("file", file);

    try {
      const response = await fetch(webhookUrl, { method: "POST", body: formData });

      if (!response.ok) {
        const msg = await response.text().catch(() => "Unknown error");
        throw new Error(msg || `HTTP ${response.status}`);
      }

      resetForm();
      toast.success("🎉 Đã bắn lên Trello thành công!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lỗi không xác định";
      toast.error(`❌ Có lỗi xảy ra: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Derived data ──────────────────────────────────────────────────────────────

  // Filter cards to only show those in the currently selected target list (if any)
  const availableCards = boardData?.cards ?? [];
  const availableLists = boardData?.lists ?? [];

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f7f9fb] font-sans">
      <Toaster position="top-right" richColors />

      {/* ── Top Nav ── */}
      <header className="sticky top-0 z-10 border-b border-[#c1c7d3]/20 bg-[#f7f9fb]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-[#004f89] to-[#0067b1]">
              <Rocket className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-center gap-2 text-sm text-[#414751]">
              <span className="font-semibold text-[#191c1e]">Automation Control</span>
              <span className="h-6 w-px bg-[#c1c7d3]" />
              <span>Trello Design Workflow</span>
            </div>
          </div>

          {/* Board data status indicator */}
          <div className="ml-auto flex items-center gap-2 text-xs">
            {isFetchingBoard && (
              <span className="flex items-center gap-1.5 text-[#717782]">
                <Loader2 className="h-3 w-3 animate-spin" />
                Đang tải Trello...
              </span>
            )}
            {boardError && (
              <button
                onClick={fetchBoardData}
                className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-red-600 hover:bg-red-100"
              >
                <AlertCircle className="h-3 w-3" />
                Lỗi kết nối
                <RefreshCw className="h-3 w-3" />
              </button>
            )}
            {boardData && !isFetchingBoard && (
              <span className="flex items-center gap-1.5 text-[#004f89]">
                <CheckCircle2 className="h-3 w-3" />
                {boardData.cards.length} cards · {boardData.lists.length} lists
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── Error Banner ── */}
      {boardError && (
        <div className="bg-red-50 border-b border-red-100 px-6 py-3">
          <div className="mx-auto max-w-5xl flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <div className="flex-1 text-sm text-red-700">
              <p className="font-medium">Không thể kết nối Trello</p>
              <p className="mt-0.5 text-red-600/80">{boardError}</p>
              <p className="mt-1 text-xs text-red-500">
                Kiểm tra <code className="rounded bg-red-100 px-1">TRELLO_API_KEY</code>,{" "}
                <code className="rounded bg-red-100 px-1">TRELLO_TOKEN</code>,{" "}
                <code className="rounded bg-red-100 px-1">TRELLO_BOARD_ID</code> trong{" "}
                <code className="rounded bg-red-100 px-1">.env.local</code>
              </p>
            </div>
            <button
              onClick={fetchBoardData}
              className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-red-600 shadow-sm hover:bg-red-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Thử lại
            </button>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid gap-6 lg:grid-cols-5">

            {/* ── Left Column ── */}
            <div className="flex flex-col gap-6 lg:col-span-3">

              {/* Card Select */}
              <FormCard
                icon={<CheckCircle2 className="h-5 w-5 text-[#0067b1]" />}
                title="Chọn Trello Card"
              >
                <Select
                  value={selectedCard}
                  onValueChange={(v) => setSelectedCard(v ?? "")}
                  disabled={isFetchingBoard}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl border-[#c1c7d3]/40 bg-white shadow-none focus:ring-2 focus:ring-[#0067b1]">
                    {isFetchingBoard ? (
                      <span className="flex items-center gap-2 text-[#717782]">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Đang tải cards...
                      </span>
                    ) : (
                      <SelectValue placeholder="Chọn card..." />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {availableCards.length === 0 ? (
                      <div className="px-3 py-4 text-center text-sm text-[#717782]">
                        {boardError ? "Không thể tải cards" : "Không có card nào"}
                      </div>
                    ) : (
                      availableCards.map((card) => (
                        <SelectItem key={card.id} value={card.name}>
                          {card.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </FormCard>

              {/* List Select */}
              <FormCard
                icon={<CheckCircle2 className="h-5 w-5 text-[#0067b1]" />}
                title="Chuyển sang Cột (List)"
              >
                <Select
                  value={targetList}
                  onValueChange={(v) => setTargetList(v ?? "")}
                  disabled={isFetchingBoard}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl border-[#c1c7d3]/40 bg-white shadow-none focus:ring-2 focus:ring-[#0067b1]">
                    {isFetchingBoard ? (
                      <span className="flex items-center gap-2 text-[#717782]">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Đang tải lists...
                      </span>
                    ) : (
                      <SelectValue placeholder="Chọn cột đích..." />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {availableLists.length === 0 ? (
                      <div className="px-3 py-4 text-center text-sm text-[#717782]">
                        {boardError ? "Không thể tải lists" : "Không có list nào"}
                      </div>
                    ) : (
                      availableLists.map((list) => (
                        <SelectItem key={list.id} value={list.name}>
                          {list.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </FormCard>

              {/* Checklist */}
              <FormCard
                icon={<CheckCircle2 className="h-5 w-5 text-[#0067b1]" />}
                title="Quality Check"
                badge="Bắt buộc"
              >
                <ul className="flex flex-col gap-4">
                  {CHECKLIST_ITEMS.map(({ id, label }) => (
                    <li key={id} className="flex items-center gap-3">
                      <Checkbox
                        id={id}
                        checked={checklist[id]}
                        onCheckedChange={(v) =>
                          handleChecklistChange(id, v === true)
                        }
                        className="h-5 w-5 rounded-md border-[#c1c7d3] data-[state=checked]:border-[#0067b1] data-[state=checked]:bg-[#0067b1]"
                      />
                      <Label
                        htmlFor={id}
                        className="cursor-pointer select-none text-sm text-[#191c1e]"
                      >
                        {label}
                      </Label>
                    </li>
                  ))}
                </ul>
              </FormCard>
            </div>

            {/* ── Right Column ── */}
            <div className="flex flex-col gap-6 lg:col-span-2">

              {/* File Upload */}
              <FormCard
                icon={<CloudUpload className="h-5 w-5 text-[#0067b1]" />}
                title="Đính kèm File"
              >
                {file ? (
                  <FilePreview file={file} onClear={clearFile} />
                ) : (
                  <DropZone
                    isDragging={isDragging}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                  />
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="hidden"
                  onChange={(e) =>
                    handleFileChange(e.target.files?.[0] ?? null)
                  }
                />
              </FormCard>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isSubmitting || isFetchingBoard}
                className="h-12 w-full rounded-xl bg-linear-to-r from-[#004f89] to-[#0067b1] text-base font-semibold text-white shadow-md transition-all hover:opacity-90 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4" />
                    Cập nhật lên Trello
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormCard({
  icon,
  title,
  badge,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-[0px_2px_15px_0px_rgba(25,28,30,0.04)]">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h2 className="font-semibold text-[#191c1e]">{title}</h2>
        {badge && (
          <span className="ml-auto rounded-full bg-[#d2e4ff] px-2.5 py-0.5 text-xs font-medium text-[#004f89]">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

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
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
        isDragging
          ? "border-[#0067b1] bg-[#d2e4ff]/30"
          : "border-[#c1c7d3] bg-[#f7f9fb] hover:border-[#0067b1] hover:bg-[#d2e4ff]/10"
      }`}
    >
      <CloudUpload
        className={`h-10 w-10 ${isDragging ? "text-[#0067b1]" : "text-[#717782]"}`}
      />
      <div>
        <p className="text-sm font-medium text-[#191c1e]">
          Kéo thả file vào đây hoặc{" "}
          <span className="text-[#0067b1] underline underline-offset-2">
            Click để duyệt
          </span>
        </p>
        <p className="mt-1 text-xs text-[#717782]">
          Hỗ trợ JPG, PNG, PDF (Max 20MB)
        </p>
      </div>
    </div>
  );
}

function FilePreview({
  file,
  onClear,
}: {
  file: File;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#c1c7d3]/40 bg-[#f2f4f6] px-4 py-3">
      <FileText className="h-8 w-8 shrink-0 text-[#0067b1]" />
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm font-medium text-[#191c1e]"
          title={file.name}
        >
          {file.name}
        </p>
        <p className="text-xs text-[#717782]">{formatFileSize(file.size)}</p>
      </div>
      <button
        type="button"
        onClick={onClear}
        aria-label="Xóa file"
        className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#717782] transition-colors hover:bg-[#e0e3e5] hover:text-[#191c1e]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
