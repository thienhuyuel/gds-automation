"use client";

import { useEffect, useRef, useState } from "react";
import { toast, Toaster } from "sonner";
import {
  AlertCircle,
  ChevronDown,
  CloudUpload,
  FileImage,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Trash,
  X,
  ZoomIn,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// ─── Design Tokens ─────────────────────────────────────────────────────────────

const DS = {
  surface:                  "#f7f9fb",
  surfaceContainerLow:      "#f2f4f6",
  surfaceContainerLowest:   "#ffffff",
  surfaceContainerHigh:     "#e6e8ea",
  surfaceContainerHighest:  "#e0e3e5",
  primary:                  "#004f89",
  primaryContainer:         "#0067b1",
  onSurface:                "#191c1e",
  onSurfaceVariant:         "#414751",
  outline:                  "#717782",
  outlineVariant:           "#c1c7d3",
  tertiary:                 "#7b3b00",
  tertiaryContainer:        "#9f4e00",
  ambientShadow:            "0px 2px 15px 0px rgba(25,28,30,0.04)",
  elevatedShadow:           "0px 8px 32px 0px rgba(25,28,30,0.10)",
  ctaGradient:              "linear-gradient(135deg, #004f89 0%, #0067b1 100%)",
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrelloLabel { id: string; name: string; color: string }
interface TrelloCard  { id: string; name: string; idList: string; labels: TrelloLabel[] }
interface TrelloList  { id: string; name: string }
interface BoardData   { cards: TrelloCard[]; lists: TrelloList[] }
interface FileItem    { file: File; previewUrl: string | null }

type CardType = "CAS" | "LIVE" | null;

// CAS Checklist — 1 radio + 4 checkboxes
interface CasState {
  logoStatus:   "yes" | "no" | "";
  format:       boolean;
  quantity:     boolean;
  naming:       boolean;
  requirements: boolean;
}

// LIVE Checklist — 3 radios + 2 checkboxes
interface LiveState {
  pgmInfo:         "yes" | "no" | "";
  sellerInfo:      "yes" | "no" | "";
  useFlag:         "yes" | "no" | "";
  templateApplied: boolean;
  naming:          boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_CAS:  CasState  = { logoStatus: "", format: false, quantity: false, naming: false, requirements: false };
const DEFAULT_LIVE: LiveState = { pgmInfo: "", sellerInfo: "", useFlag: "", templateApplied: false, naming: false };
const MAX_FILES   = 5;
const MAX_FILE_MB = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCardType(card: TrelloCard): CardType {
  const names = card.labels.map(l => l.name.toUpperCase());
  if (names.some(n => n.includes("CAS")))  return "CAS";
  if (names.some(n => n.includes("LIVE"))) return "LIVE";
  return null;
}

function isCasComplete(s: CasState): boolean {
  return !!s.logoStatus && s.format && s.quantity && s.naming && s.requirements;
}

function isLiveComplete(s: LiveState): boolean {
  return !!s.pgmInfo && !!s.sellerInfo && !!s.useFlag && s.templateApplied && s.naming;
}

function casProgress(s: CasState): [number, number] {
  return [[s.logoStatus, s.format, s.quantity, s.naming, s.requirements].filter(Boolean).length, 5];
}

function liveProgress(s: LiveState): [number, number] {
  return [[s.pgmInfo, s.sellerInfo, s.useFlag, s.templateApplied, s.naming].filter(Boolean).length, 5];
}

function isFormValid(
  card: TrelloCard | null,
  cardType: CardType,
  files: FileItem[],
  cas: CasState,
  live: LiveState,
): boolean {
  if (!card || files.length === 0) return false;
  if (cardType === "CAS")  return isCasComplete(cas);
  if (cardType === "LIVE") return isLiveComplete(live);
  return false;
}

const fmtMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(1) + " MB";

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AutomationControlPage() {
  // Board data
  const [boardData,       setBoardData]    = useState<BoardData | null>(null);
  const [isFetchingBoard, setFetchingBoard] = useState(true);
  const [boardError,      setBoardError]   = useState<string | null>(null);

  // Form
  const [selectedCard, setSelectedCard] = useState<TrelloCard | null>(null);
  const [casState,     setCasState]     = useState<CasState>(DEFAULT_CAS);
  const [liveState,    setLiveState]    = useState<LiveState>(DEFAULT_LIVE);
  const [fileItems,    setFileItems]    = useState<FileItem[]>([]);
  const [isDragging,   setDragging]     = useState(false);
  const [isSubmitting, setSubmitting]   = useState(false);

  // Pre-upload preview dialog
  const [pendingItems, setPendingItems] = useState<FileItem[]>([]);
  const [previewOpen,  setPreviewOpen]  = useState(false);

  // Lightbox
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const fileInputRef    = useRef<HTMLInputElement>(null);
  const pendingInputRef = useRef<HTMLInputElement>(null);
  const fileItemsRef    = useRef<FileItem[]>([]);
  useEffect(() => { fileItemsRef.current = fileItems; }, [fileItems]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      fileItemsRef.current.forEach(i => { if (i.previewUrl) URL.revokeObjectURL(i.previewUrl); });
    };
  }, []);

  const cardType: CardType = selectedCard ? getCardType(selectedCard) : null;
  const formValid = isFormValid(selectedCard, cardType, fileItems, casState, liveState);

  // ── Fetch board data ───────────────────────────────────────────────────────

  async function fetchBoardData() {
    setFetchingBoard(true);
    setBoardError(null);
    try {
      const res  = await fetch("/api/trello/board-data");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tải dữ liệu Trello");
      setBoardData(data);
    } catch (err) {
      setBoardError(err instanceof Error ? err.message : "Lỗi kết nối Trello");
    } finally {
      setFetchingBoard(false);
    }
  }

  useEffect(() => { fetchBoardData(); }, []);

  // ── Card selection ─────────────────────────────────────────────────────────

  function handleCardSelect(card: TrelloCard | null) {
    setSelectedCard(card);
    setCasState(DEFAULT_CAS);
    setLiveState(DEFAULT_LIVE);
  }

  // ── File handling ──────────────────────────────────────────────────────────

  function makeFileItems(files: File[], currentCount: number): { items: FileItem[]; rejected: number; overflow: number } {
    const remaining = MAX_FILES - currentCount;
    const valid     = files.filter(f => f.size <= MAX_FILE_MB * 1024 * 1024);
    const rejected  = files.length - valid.length;
    const toAdd     = valid.slice(0, remaining);
    const overflow  = valid.length - toAdd.length;
    const items: FileItem[] = toAdd.map(f => ({
      file: f,
      previewUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
    }));
    return { items, rejected, overflow };
  }

  // Opens the pre-upload preview dialog with freshly selected files
  function addToPending(incoming: File[]) {
    const currentTotal = fileItems.length + pendingItems.length;
    const { items, rejected, overflow } = makeFileItems(incoming, currentTotal);
    if (rejected) toast.error(`${rejected} file vượt quá ${MAX_FILE_MB}MB.`);
    if (overflow) toast.error(`Chỉ thêm được thêm ${MAX_FILES - currentTotal} file nữa (tối đa ${MAX_FILES}).`);
    if (!items.length) return;
    setPendingItems(prev => [...prev, ...items]);
    setPreviewOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // "Thêm file" button inside the preview dialog
  function addMoreToPending(incoming: File[]) {
    const currentTotal = fileItems.length + pendingItems.length;
    const { items, rejected, overflow } = makeFileItems(incoming, currentTotal);
    if (rejected) toast.error(`${rejected} file vượt quá ${MAX_FILE_MB}MB.`);
    if (overflow) toast.error(`Tối đa ${MAX_FILES} file tổng cộng.`);
    if (items.length) setPendingItems(prev => [...prev, ...items]);
    if (pendingInputRef.current) pendingInputRef.current.value = "";
  }

  function removePending(index: number) {
    setPendingItems(prev => {
      const item = prev[index];
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  function cancelPending() {
    pendingItems.forEach(i => { if (i.previewUrl) URL.revokeObjectURL(i.previewUrl); });
    setPendingItems([]);
    setPreviewOpen(false);
  }

  function confirmPending() {
    setFileItems(prev => [...prev, ...pendingItems]);
    setPendingItems([]);
    setPreviewOpen(false);
  }

  // Confirmed-list operations
  function removeFile(index: number) {
    setFileItems(prev => {
      const item = prev[index];
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  function openLightbox(index: number) { setLightboxIdx(index); }
  function closeLightbox()             { setLightboxIdx(null); }
  function removeFromLightbox() {
    if (lightboxIdx === null) return;
    removeFile(lightboxIdx);
    setLightboxIdx(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    addToPending(Array.from(e.dataTransfer.files));
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formValid || !selectedCard) return;

    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
    if (!webhookUrl) { toast.error("Webhook URL chưa được cấu hình."); return; }

    setSubmitting(true);

    const checklistData = cardType === "CAS" ? casState : liveState;
    const formData = new FormData();
    formData.append("cardId",        selectedCard.id);
    formData.append("cardName",      selectedCard.name);
    formData.append("cardType",      cardType ?? "");
    formData.append("checklistData", JSON.stringify(checklistData));
    fileItems.forEach((item, i) => formData.append(`file_${i}`, item.file));

    try {
      const res = await fetch(webhookUrl, { method: "POST", body: formData });
      if (!res.ok) throw new Error((await res.text().catch(() => "")) || `HTTP ${res.status}`);
      // Reset
      setSelectedCard(null);
      setCasState(DEFAULT_CAS);
      setLiveState(DEFAULT_LIVE);
      fileItemsRef.current.forEach(i => { if (i.previewUrl) URL.revokeObjectURL(i.previewUrl); });
      setFileItems([]);
      toast.success("🎉 Đã gửi sang QA thành công!");
    } catch (err) {
      toast.error(`❌ ${err instanceof Error ? err.message : "Lỗi không xác định"}`);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const [casDone, casTotal]   = casProgress(casState);
  const [liveDone, liveTotal] = liveProgress(liveState);
  const checklistProgress     = cardType === "CAS" ? [casDone, casTotal] as const
                               : cardType === "LIVE" ? [liveDone, liveTotal] as const
                               : null;

  return (
    <div className="min-h-screen" style={{ background: DS.surface, fontFamily: "var(--font-inter), sans-serif" }}>
      <Toaster position="top-right" richColors />

      {/* ── Perspective Header ── */}
      <header className="sticky top-0 z-10 backdrop-blur-md" style={{ background: `${DS.surface}cc` }}>
        <div className="mx-auto flex h-16 max-w-5xl items-center px-8">
          <div className="flex items-center gap-4">
            <h1
              className="text-xl font-semibold tracking-[-0.02em]"
              style={{ color: DS.onSurface, fontFamily: "var(--font-manrope), sans-serif" }}
            >
              Automation Control
            </h1>
            <div className="h-6 w-px" style={{ background: DS.surfaceContainerHighest }} />
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: DS.outline }}>
              Trello → QA Workflow
            </span>
          </div>

          <div className="ml-auto text-xs">
            {isFetchingBoard && (
              <span className="flex items-center gap-1.5" style={{ color: DS.outline }}>
                <Loader2 className="h-3 w-3 animate-spin" /> Đang tải Trello...
              </span>
            )}
            {boardError && !isFetchingBoard && (
              <button onClick={fetchBoardData} className="flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition-colors" style={{ background: "#fde8e8", color: "#c0392b" }}>
                <AlertCircle className="h-3 w-3" /> Lỗi kết nối <RotateCcw className="h-3 w-3" />
              </button>
            )}
            {boardData && !isFetchingBoard && (
              <span className="flex items-center gap-1.5" style={{ color: DS.primaryContainer }}>
                {boardData.cards.length} cards
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── Error Banner ── */}
      {boardError && (
        <div style={{ background: "#fff5f5" }}>
          <div className="mx-auto flex max-w-5xl items-start gap-3 px-8 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <div className="flex-1 text-sm text-red-700">
              <p className="font-medium">{boardError}</p>
              <p className="mt-0.5 text-xs text-red-500">
                Kiểm tra <code className="rounded bg-red-100 px-1">TRELLO_API_KEY</code>,{" "}
                <code className="rounded bg-red-100 px-1">TRELLO_TOKEN</code>,{" "}
                <code className="rounded bg-red-100 px-1">TRELLO_BOARD_ID</code> trong <code className="rounded bg-red-100 px-1">.env.local</code>
              </p>
            </div>
            <button onClick={fetchBoardData} className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50" style={{ background: DS.surfaceContainerLowest }}>
              <RotateCcw className="h-3.5 w-3.5" /> Thử lại
            </button>
          </div>
        </div>
      )}

      {/* ── Main ── */}
      <main className="mx-auto max-w-5xl px-8 py-12">
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid gap-6 lg:grid-cols-5">

            {/* ── Left column ── */}
            <div className="flex flex-col gap-6 lg:col-span-3">

              {/* Card Combobox */}
              <EtherCard title="Chọn Trello Card">
                <CardCombobox
                  cards={boardData?.cards ?? []}
                  selected={selectedCard}
                  onSelect={handleCardSelect}
                  onRefresh={fetchBoardData}
                  loading={isFetchingBoard}
                  disabled={isFetchingBoard}
                />
              </EtherCard>

              {/* Dynamic Checklist */}
              {selectedCard && (
                <EtherCard
                  title={cardType ? `Checklist · ${cardType}` : "Checklist"}
                  badge={
                    checklistProgress
                      ? `${checklistProgress[0]}/${checklistProgress[1]}`
                      : undefined
                  }
                  badgeComplete={checklistProgress ? checklistProgress[0] === checklistProgress[1] : false}
                  typeTag={cardType}
                >
                  {cardType === "CAS" && (
                    <CasChecklist state={casState} onChange={setCasState} />
                  )}
                  {cardType === "LIVE" && (
                    <LiveChecklist state={liveState} onChange={setLiveState} />
                  )}
                  {!cardType && (
                    <p className="py-2 text-sm" style={{ color: DS.outline }}>
                      Card này không có nhãn <strong>CAS</strong> hoặc <strong>LIVE</strong>. Vui lòng kiểm tra lại nhãn trong Trello.
                    </p>
                  )}
                </EtherCard>
              )}
            </div>

            {/* ── Right column ── */}
            <div className="flex flex-col gap-6 lg:col-span-2">

              {/* Multi-file upload */}
              <EtherCard title="Đính kèm File" badge={fileItems.length > 0 ? `${fileItems.length}/${MAX_FILES}` : undefined}>
                <MultiFileDropzone
                  fileItems={fileItems}
                  onThumbClick={openLightbox}
                  isDragging={isDragging}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  maxFiles={MAX_FILES}
                />
                {/* Main file picker — feeds pre-upload dialog */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="hidden"
                  onChange={e => { addToPending(Array.from(e.target.files ?? [])); }}
                />
                {/* Pending file picker — used inside the preview dialog */}
                <input
                  ref={pendingInputRef}
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="hidden"
                  onChange={e => { addMoreToPending(Array.from(e.target.files ?? [])); }}
                />
              </EtherCard>

              {/* Submit CTA */}
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={!formValid || isSubmitting}
                  className="h-12 w-full rounded-3xl text-base font-semibold text-white transition-all"
                  style={{
                    background: formValid ? DS.ctaGradient : DS.surfaceContainerHighest,
                    color: formValid ? "#fff" : DS.outline,
                    boxShadow: formValid ? DS.ambientShadow : "none",
                    cursor: formValid ? "pointer" : "not-allowed",
                  }}
                >
                  {isSubmitting
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang gửi...</>
                    : "🚀 Gửi sang QA"
                  }
                </Button>

                {/* Validation hints */}
                {!formValid && (
                  <ul className="flex flex-col gap-1.5 px-1">
                    <ValidationHint done={!!selectedCard}       label="Chọn Trello Card" />
                    <ValidationHint done={fileItems.length > 0} label="Upload ít nhất 1 file" />
                    <ValidationHint
                      done={
                        cardType === "CAS"  ? isCasComplete(casState)   :
                        cardType === "LIVE" ? isLiveComplete(liveState) : false
                      }
                      label="Hoàn thành 100% Checklist"
                    />
                  </ul>
                )}
              </div>
            </div>
          </div>
        </form>
      </main>

      {/* ── Pre-Upload Preview Dialog ── */}
      <PreUploadDialog
        pendingItems={pendingItems}
        confirmedCount={fileItems.length}
        maxFiles={MAX_FILES}
        open={previewOpen}
        onRemove={removePending}
        onAddMore={() => pendingInputRef.current?.click()}
        onCancel={cancelPending}
        onConfirm={confirmPending}
      />

      {/* ── Lightbox Dialog ── */}
      <LightboxDialog
        item={lightboxIdx !== null ? fileItems[lightboxIdx] : null}
        open={lightboxIdx !== null}
        onClose={closeLightbox}
        onDelete={removeFromLightbox}
      />
    </div>
  );
}

// ─── EtherCard ────────────────────────────────────────────────────────────────

function EtherCard({
  title, badge, badgeComplete = false, typeTag, children,
}: {
  title: string;
  badge?: string;
  badgeComplete?: boolean;
  typeTag?: CardType;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-3xl p-8"
      style={{ background: DS.surfaceContainerLowest, boxShadow: DS.ambientShadow }}
    >
      <div className="mb-6 flex items-center gap-3">
        <h2
          className="text-sm font-semibold tracking-[-0.01em]"
          style={{ color: DS.onSurface, fontFamily: "var(--font-manrope), sans-serif" }}
        >
          {title}
        </h2>

        {typeTag && (
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={
              typeTag === "CAS"
                ? { background: "#dbeafe", color: DS.primary }
                : { background: "#fde8cc", color: DS.tertiary }
            }
          >
            {typeTag}
          </span>
        )}

        {badge && (
          <span
            className="ml-auto rounded-full px-3 py-0.5 text-xs font-medium transition-colors"
            style={{
              background: badgeComplete ? "#dcfce7" : DS.surfaceContainerHigh,
              color:      badgeComplete ? "#15803d"  : DS.outline,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

// ─── CardCombobox ─────────────────────────────────────────────────────────────

function CardCombobox({
  cards, selected, onSelect, onRefresh, loading, disabled,
}: {
  cards:     TrelloCard[];
  selected:  TrelloCard | null;
  onSelect:  (card: TrelloCard | null) => void;
  onRefresh: () => void;
  loading:   boolean;
  disabled?: boolean;
}) {
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search input when opened
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);

  const filtered = query
    ? cards.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : cards;

  function handleSelect(card: TrelloCard) {
    onSelect(card);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="flex gap-2" ref={containerRef}>
      {/* Trigger */}
      <div className="relative flex-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(o => !o)}
          onKeyDown={e => { if (e.key === "Escape") setOpen(false); }}
          className="flex h-11 w-full items-center justify-between rounded-xl px-3 text-sm transition-all duration-200"
          style={{
            background: DS.surfaceContainerLowest,
            border: `1px solid ${DS.outlineVariant}26`,
            color: selected ? DS.onSurface : DS.outline,
          }}
        >
          <span className="truncate">
            {loading ? "Đang tải cards..." : selected ? selected.name : "Chọn card..."}
          </span>
          {loading
            ? <Loader2 className="h-4 w-4 animate-spin shrink-0" style={{ color: DS.outline }} />
            : <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: DS.outline }} />
          }
        </button>

        {/* Dropdown */}
        {open && (
          <div
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-2xl"
            style={{ background: DS.surfaceContainerLowest, boxShadow: DS.elevatedShadow }}
          >
            {/* Search input */}
            <div className="p-2">
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: DS.surfaceContainerLow }}
              >
                <Search className="h-3.5 w-3.5 shrink-0" style={{ color: DS.outline }} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === "Escape") setOpen(false); }}
                  placeholder="Tìm tên card..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#717782]"
                  style={{ color: DS.onSurface }}
                />
                {query && (
                  <button type="button" onClick={() => setQuery("")}>
                    <X className="h-3.5 w-3.5" style={{ color: DS.outline }} />
                  </button>
                )}
              </div>
            </div>

            {/* Card list */}
            <div className="max-h-60 overflow-y-auto pb-2">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm" style={{ color: DS.outline }}>
                  Không tìm thấy card nào
                </div>
              ) : (
                filtered.map(card => {
                  const type    = getCardType(card);
                  const isActive = selected?.id === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => handleSelect(card)}
                      className="mx-1.5 flex w-[calc(100%-12px)] items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors"
                      style={{
                        background: isActive ? "#dbeafe" : "transparent",
                        color: DS.onSurface,
                      }}
                      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = DS.surfaceContainerLow; }}
                      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                    >
                      <span className="truncate">{card.name}</span>
                      {type && (
                        <span
                          className="ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
                          style={
                            type === "CAS"
                              ? { background: "#dbeafe", color: DS.primary }
                              : { background: "#fde8cc", color: DS.tertiary }
                          }
                        >
                          {type}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Refresh button */}
      <button
        type="button"
        onClick={() => { setOpen(false); onRefresh(); }}
        disabled={loading}
        title="Tải lại danh sách"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-40"
        style={{ background: DS.surfaceContainerLow, color: DS.outline }}
        onMouseEnter={e => (e.currentTarget.style.background = DS.surfaceContainerHigh)}
        onMouseLeave={e => (e.currentTarget.style.background = DS.surfaceContainerLow)}
      >
        <RotateCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}

// ─── CAS Checklist ────────────────────────────────────────────────────────────

function CasChecklist({ state, onChange }: { state: CasState; onChange: (s: CasState) => void }) {
  return (
    <div className="flex flex-col divide-y" style={{ borderColor: `${DS.outlineVariant}26` }}>
      <RadioYesNo
        label="Tình trạng Logo"
        value={state.logoStatus}
        onChange={v => onChange({ ...state, logoStatus: v })}
      />
      <CheckItem label="Đã xuất đúng định dạng (Type)"               checked={state.format}       onChange={v => onChange({ ...state, format: v })} />
      <CheckItem label="Đã đủ số lượng banner theo yêu cầu"          checked={state.quantity}     onChange={v => onChange({ ...state, quantity: v })} />
      <CheckItem label="Đã đặt tên file đúng chuẩn"                  checked={state.naming}       onChange={v => onChange({ ...state, naming: v })} />
      <CheckItem label="Đã đáp ứng đúng yêu cầu của Request"         checked={state.requirements} onChange={v => onChange({ ...state, requirements: v })} />
    </div>
  );
}

// ─── LIVE Checklist ───────────────────────────────────────────────────────────

function LiveChecklist({ state, onChange }: { state: LiveState; onChange: (s: LiveState) => void }) {
  return (
    <div className="flex flex-col divide-y" style={{ borderColor: `${DS.outlineVariant}26` }}>
      <RadioYesNo label="Thông tin PGM"    value={state.pgmInfo}    onChange={v => onChange({ ...state, pgmInfo: v })} />
      <RadioYesNo label="Thông tin Seller" value={state.sellerInfo} onChange={v => onChange({ ...state, sellerInfo: v })} />
      <RadioYesNo label="Sử dụng Flag"     value={state.useFlag}    onChange={v => onChange({ ...state, useFlag: v })} />
      <CheckItem  label="Đã áp dụng đúng Template và Yêu cầu"      checked={state.templateApplied} onChange={v => onChange({ ...state, templateApplied: v })} />
      <CheckItem  label="Đã đặt tên file đúng chuẩn"               checked={state.naming}          onChange={v => onChange({ ...state, naming: v })} />
    </div>
  );
}

// ─── RadioYesNo ───────────────────────────────────────────────────────────────

function RadioYesNo({
  label, value, onChange,
}: {
  label:    string;
  value:    "yes" | "no" | "";
  onChange: (v: "yes" | "no") => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm" style={{ color: DS.onSurface }}>{label}</span>
      <div className="flex gap-1.5">
        {(["yes", "no"] as const).map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className="rounded-lg px-3 py-1 text-xs font-medium transition-all duration-150"
            style={{
              background: value === opt
                ? (opt === "yes" ? DS.primaryContainer : DS.onSurface)
                : DS.surfaceContainerLow,
              color: value === opt ? "#fff" : DS.outline,
            }}
          >
            {opt === "yes" ? "Có" : "Không"}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── CheckItem ────────────────────────────────────────────────────────────────

function CheckItem({
  label, checked, onChange,
}: {
  label:    string;
  checked:  boolean;
  onChange: (v: boolean) => void;
}) {
  const id = `chk-${label}`;
  return (
    <div className="flex items-center gap-3 py-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={v => onChange(v === true)}
        className="h-5 w-5 rounded-md"
        style={checked
          ? { background: DS.primaryContainer, borderColor: DS.primaryContainer }
          : { borderColor: DS.outlineVariant }}
      />
      <Label htmlFor={id} className="cursor-pointer select-none text-sm leading-snug" style={{ color: DS.onSurface }}>
        {label}
      </Label>
    </div>
  );
}

// ─── MultiFileDropzone ────────────────────────────────────────────────────────

function MultiFileDropzone({
  fileItems, onThumbClick,
  isDragging, onDragOver, onDragLeave, onDrop, onClick, maxFiles,
}: {
  fileItems:    FileItem[];
  onThumbClick: (index: number) => void;
  isDragging:   boolean;
  onDragOver:   (e: React.DragEvent) => void;
  onDragLeave:  () => void;
  onDrop:       (e: React.DragEvent) => void;
  onClick:      () => void;
  maxFiles:     number;
}) {
  const canAdd = fileItems.length < maxFiles;

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone — hidden when full */}
      {canAdd && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload file"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onClick}
          onKeyDown={e => e.key === "Enter" && onClick()}
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl px-6 py-8 text-center transition-all duration-200"
          style={{
            background: isDragging ? "#d2e4ff40" : DS.surfaceContainerLow,
            border: `2px dashed ${isDragging ? DS.primaryContainer : DS.outlineVariant}`,
          }}
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl transition-colors"
            style={{ background: isDragging ? "#d2e4ff" : DS.surfaceContainerHighest }}
          >
            <CloudUpload className="h-5 w-5" style={{ color: isDragging ? DS.primaryContainer : DS.outline }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: DS.onSurface }}>
              Kéo thả hoặc{" "}
              <span className="underline underline-offset-2" style={{ color: DS.primaryContainer }}>
                chọn file
              </span>
            </p>
            <p className="mt-1 text-xs" style={{ color: DS.outline }}>
              JPG, PNG, PDF · tối đa {MAX_FILE_MB}MB · {fileItems.length}/{maxFiles} file
            </p>
          </div>
        </div>
      )}

      {/* Confirmed thumbnails — click to open lightbox */}
      {fileItems.length > 0 && (
        <div className="overflow-auto rounded-2xl" style={{ maxHeight: "480px" }}>
          <div className="grid grid-cols-2 gap-2">
            {fileItems.map((item, i) => (
              <FileThumb key={i} item={item} onClick={() => onThumbClick(i)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FileThumb ────────────────────────────────────────────────────────────────

function FileThumb({ item, onClick }: { item: FileItem; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Xem phóng to"
      className="group relative w-full overflow-hidden rounded-2xl text-left transition-transform duration-150 hover:scale-[1.02] focus-visible:outline-none"
      style={{ background: DS.surfaceContainerLow }}
    >
      {item.previewUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.previewUrl}
            alt={item.file.name}
            className="block h-auto w-full"
          />
          {/* Zoom hint + name overlay on hover */}
          <div className="absolute inset-0 flex flex-col justify-between bg-black/40 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <div className="flex justify-end p-2">
              <ZoomIn className="h-4 w-4 text-white drop-shadow" />
            </div>
            <div className="px-2.5 pb-2.5">
              <p className="break-all text-xs leading-snug text-white">{item.file.name}</p>
              <p className="text-xs text-white/60">{fmtMB(item.file.size)}</p>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-8">
          <FileImage className="h-8 w-8" style={{ color: DS.outline }} />
          <div className="w-full text-center">
            <p className="break-all text-xs font-medium leading-snug" style={{ color: DS.onSurface }}>
              {item.file.name}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: DS.outlineVariant }}>
              {fmtMB(item.file.size)}
            </p>
          </div>
          <span className="flex items-center gap-1 text-xs" style={{ color: DS.outline }}>
            <ZoomIn className="h-3 w-3" /> Xem chi tiết
          </span>
        </div>
      )}
    </button>
  );
}

// ─── ValidationHint ───────────────────────────────────────────────────────────

function ValidationHint({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-xs">
      <span
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
        style={{
          background: done ? "#dcfce7" : DS.surfaceContainerHigh,
          color:      done ? "#15803d"  : DS.outline,
        }}
      >
        {done ? "✓" : "·"}
      </span>
      <span style={{ color: done ? "#15803d" : DS.outline }}>{label}</span>
    </li>
  );
}

// ─── PreUploadDialog ──────────────────────────────────────────────────────────

function PreUploadDialog({
  pendingItems, confirmedCount, maxFiles, open,
  onRemove, onAddMore, onCancel, onConfirm,
}: {
  pendingItems:   FileItem[];
  confirmedCount: number;
  maxFiles:       number;
  open:           boolean;
  onRemove:       (i: number) => void;
  onAddMore:      () => void;
  onCancel:       () => void;
  onConfirm:      () => void;
}) {
  const totalAfter = confirmedCount + pendingItems.length;
  const canAddMore = totalAfter < maxFiles;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onCancel(); }}>
      <DialogContent
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden rounded-3xl p-0"
        style={{ background: DS.surfaceContainerLowest, maxWidth: 520 }}
      >
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle
            className="text-base font-semibold tracking-[-0.01em]"
            style={{ color: DS.onSurface, fontFamily: "var(--font-manrope), sans-serif" }}
          >
            Xác nhận file tải lên
          </DialogTitle>
          <p className="text-xs" style={{ color: DS.outline }}>
            {pendingItems.length} file đang chờ · Tổng sau khi xác nhận:{" "}
            <strong style={{ color: DS.onSurface }}>{totalAfter}/{maxFiles}</strong>
          </p>
        </DialogHeader>

        {/* Pending thumbnails — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 pb-2">
          <div className="grid grid-cols-2 gap-3">
            {pendingItems.map((item, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl"
                style={{ background: DS.surfaceContainerLow }}
              >
                {item.previewUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="block h-auto w-full"
                    />
                    <div className="absolute inset-x-0 bottom-0 flex items-start gap-2 bg-black/55 px-2.5 py-2">
                      <p className="flex-1 break-all text-xs leading-snug text-white">{item.file.name}</p>
                      <span className="shrink-0 text-xs text-white/60">{fmtMB(item.file.size)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 px-4 py-8">
                    <FileImage className="h-7 w-7" style={{ color: DS.outline }} />
                    <p className="break-all text-center text-xs leading-snug" style={{ color: DS.onSurface }}>
                      {item.file.name}
                    </p>
                    <p className="text-xs" style={{ color: DS.outlineVariant }}>{fmtMB(item.file.size)}</p>
                  </div>
                )}
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  aria-label="Xóa file"
                  className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:bg-black/80"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {/* "Add more" card */}
            {canAddMore && (
              <button
                type="button"
                onClick={onAddMore}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl py-10 transition-colors"
                style={{ border: `2px dashed ${DS.outlineVariant}`, color: DS.outline }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = DS.primaryContainer)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = DS.outlineVariant)}
              >
                <Plus className="h-5 w-5" />
                <span className="text-xs font-medium">Thêm file</span>
              </button>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-3 border-t px-6 py-4" style={{ borderColor: `${DS.outlineVariant}40` }}>
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="flex-1 rounded-2xl"
            style={{ color: DS.outline }}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={pendingItems.length === 0}
            className="flex-1 rounded-2xl font-semibold text-white"
            style={{ background: pendingItems.length ? DS.ctaGradient : DS.surfaceContainerHigh }}
          >
            Xác nhận & Tải lên
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── LightboxDialog ───────────────────────────────────────────────────────────

function LightboxDialog({
  item, open, onClose, onDelete,
}: {
  item:     FileItem | null;
  open:     boolean;
  onClose:  () => void;
  onDelete: () => void;
}) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent
        className="flex max-h-[95vh] flex-col gap-0 overflow-hidden rounded-3xl p-0"
        style={{ background: "#000", maxWidth: "min(90vw, 900px)" }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/30"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Full image — scrollable if taller than viewport */}
        <div className="flex-1 overflow-auto">
          {item.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.previewUrl}
              alt={item.file.name}
              className="block h-auto w-full"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-24">
              <FileImage className="h-16 w-16 text-white/40" />
              <p className="text-sm text-white/60">{item.file.name}</p>
            </div>
          )}
        </div>

        {/* Footer: file info + big destructive delete */}
        <div className="flex flex-col items-center gap-4 bg-black/80 px-6 py-5">
          <div className="text-center">
            <p className="break-all text-sm font-medium leading-snug text-white">{item.file.name}</p>
            <p className="mt-0.5 text-xs text-white/50">{fmtMB(item.file.size)}</p>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="lg"
            onClick={onDelete}
            className="w-full max-w-xs rounded-2xl text-base font-bold"
          >
            <Trash className="mr-2 h-5 w-5" />
            🗑️ XÓA KHỎI DANH SÁCH
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
