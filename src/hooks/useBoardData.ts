"use client";

import { useCallback, useEffect, useState } from "react";
import type { BoardData } from "@/lib/types";

export function useBoardData() {
  const [boardData,       setBoardData]    = useState<BoardData | null>(null);
  const [isFetchingBoard, setFetchingBoard] = useState(true);
  const [boardError,      setBoardError]   = useState<string | null>(null);

  const fetchBoardData = useCallback(async () => {
    setFetchingBoard(true);
    setBoardError(null);
    try {
      const res  = await fetch("/api/trello/board-data");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Không thể tải dữ liệu Trello");
      setBoardData(data);
    } catch (err) {
      setBoardError(err instanceof Error ? err.message : "Lỗi kết nối Trello");
    } finally {
      setFetchingBoard(false);
    }
  }, []);

  useEffect(() => { fetchBoardData(); }, [fetchBoardData]);

  return { boardData, isFetchingBoard, boardError, fetchBoardData };
}
