"use client";

import { useState } from "react";
import { toast, Toaster } from "sonner";
import { RotateCcw } from "lucide-react";

import { useBoardData }  from "@/hooks/useBoardData";
import { useFileUpload } from "@/hooks/useFileUpload";
import { DEFAULT_CAS, DEFAULT_LIVE } from "@/lib/constants";
import { DS } from "@/lib/design-tokens";
import { getCardType, isFormValid } from "@/lib/trello-utils";
import type { TrelloCard, CardType, CasState, LiveState } from "@/lib/types";

import { AppHeader }           from "@/components/layout/AppHeader";
import { EtherCard }           from "@/components/ui/EtherCard";
import { DSIconButton }        from "@/components/ui/DSIconButton";
import { TrelloBoardSelector } from "@/components/trello/TrelloBoardSelector";
import { DynamicChecklist }    from "@/components/checklist/DynamicChecklist";
import { UploadSection }       from "@/components/upload/UploadSection";
import { PreUploadDialog }     from "@/components/upload/PreUploadDialog";
import { LightboxDialog }      from "@/components/upload/LightboxDialog";
import { SubmitCTA }           from "@/components/SubmitCTA";

export default function AutomationControlPage() {
  const board  = useBoardData();
  const upload = useFileUpload();

  const [selectedCard, setSelectedCard] = useState<TrelloCard | null>(null);
  const [casState,     setCasState]     = useState<CasState>(DEFAULT_CAS);
  const [liveState,    setLiveState]    = useState<LiveState>(DEFAULT_LIVE);
  const [isSubmitting, setSubmitting]   = useState(false);

  const cardType: CardType = selectedCard ? getCardType(selectedCard) : null;
  const formValid = isFormValid(selectedCard, cardType, upload.fileItems, casState, liveState);

  function handleCardSelect(card: TrelloCard | null) {
    setSelectedCard(card);
    setCasState(DEFAULT_CAS);
    setLiveState(DEFAULT_LIVE);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formValid || !selectedCard) return;

    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
    if (!webhookUrl) { toast.error("Webhook URL chưa được cấu hình."); return; }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("cardId",        selectedCard.id);
    formData.append("cardName",      selectedCard.name);
    formData.append("cardType",      cardType ?? "");
    formData.append("checklistData", JSON.stringify(cardType === "CAS" ? casState : liveState));
    upload.fileItems.forEach((item, i) => formData.append(`file_${i}`, item.file));

    try {
      const res = await fetch(webhookUrl, { method: "POST", body: formData });
      if (!res.ok) throw new Error((await res.text().catch(() => "")) || `HTTP ${res.status}`);
      handleCardSelect(null);
      upload.resetAll();
      toast.success("🎉 Đã gửi sang QA thành công!");
    } catch (err) {
      toast.error(`❌ ${err instanceof Error ? err.message : "Lỗi không xác định"}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: DS.surface, fontFamily: "var(--font-inter), sans-serif" }}>
      <Toaster position="top-right" richColors />

      <AppHeader
        isFetching={board.isFetchingBoard}
        boardError={board.boardError}
        cardCount={board.boardData?.cards.length}
        onRetry={board.fetchBoardData}
      />

      <main className="mx-auto max-w-5xl px-8 py-12">
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-6">

            {/* Row 1: Trello Board — full width */}
            <EtherCard
              title="Trello Board"
              badge={board.boardData ? `${board.boardData.cards.length} cards` : undefined}
              headerEnd={
                <DSIconButton
                  onClick={board.fetchBoardData}
                  disabled={board.isFetchingBoard}
                  title="Tải lại"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${board.isFetchingBoard ? "animate-spin" : ""}`} />
                </DSIconButton>
              }
            >
              <TrelloBoardSelector
                cards={board.boardData?.cards ?? []}
                selected={selectedCard}
                onSelect={handleCardSelect}
                loading={board.isFetchingBoard}
              />
            </EtherCard>

            {/* Row 2: Checklist (3 cols) + Upload/Submit (2 cols) */}
            <div className="grid gap-6 lg:grid-cols-5">
              <div className="flex flex-col gap-6 lg:col-span-3">
                <DynamicChecklist
                  card={selectedCard}
                  cardType={cardType}
                  casState={casState}   onCasChange={setCasState}
                  liveState={liveState} onLiveChange={setLiveState}
                />
              </div>

              <div className="flex flex-col gap-6 lg:col-span-2">
                <UploadSection upload={upload} />
                <SubmitCTA
                  formValid={formValid}
                  isSubmitting={isSubmitting}
                  selectedCard={selectedCard}
                  fileCount={upload.fileItems.length}
                  cardType={cardType}
                  casState={casState}
                  liveState={liveState}
                />
              </div>
            </div>
          </div>
        </form>
      </main>

      <PreUploadDialog
        pendingItems={upload.pendingItems}
        confirmedCount={upload.fileItems.length}
        open={upload.previewOpen}
        onRemove={upload.removePending}
        onAddMore={upload.openPendingPicker}
        onCancel={upload.cancelPending}
        onConfirm={upload.confirmPending}
      />

      <LightboxDialog
        item={upload.lightboxIdx !== null ? upload.fileItems[upload.lightboxIdx] : null}
        open={upload.lightboxIdx !== null}
        onClose={upload.closeLightbox}
        onDelete={upload.removeFromLightbox}
      />
    </div>
  );
}
