import { NextResponse } from "next/server";

const TRELLO_BASE = "https://api.trello.com/1";

function getTrelloCredentials() {
  const key = process.env.TRELLO_API_KEY;
  const token = process.env.TRELLO_TOKEN;
  const boardId = process.env.TRELLO_BOARD_ID;

  if (!key || !token || !boardId) {
    return null;
  }
  return { key, token, boardId };
}

function trelloUrl(path: string, params: Record<string, string>) {
  const url = new URL(`${TRELLO_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return url.toString();
}

export async function GET() {
  const creds = getTrelloCredentials();

  if (!creds) {
    return NextResponse.json(
      { error: "Thiếu cấu hình Trello. Thêm TRELLO_API_KEY, TRELLO_TOKEN, TRELLO_BOARD_ID vào .env.local" },
      { status: 500 }
    );
  }

  const { key, token, boardId } = creds;
  const auth = { key, token };

  // Chỉ lấy cards từ list cụ thể này
  const SOURCE_LIST_ID = process.env.TRELLO_SOURCE_LIST_ID ?? "699c21ebb5cb04c6b7cd11fc";

  const [listsRes, cardsRes] = await Promise.all([
    fetch(trelloUrl(`/boards/${boardId}/lists`, { ...auth, fields: "id,name" })),
    fetch(trelloUrl(`/lists/${SOURCE_LIST_ID}/cards`, { ...auth, fields: "id,name,idList,labels", filter: "open" })),
  ]);

  if (!listsRes.ok || !cardsRes.ok) {
    const errText = !listsRes.ok
      ? await listsRes.text()
      : await cardsRes.text();
    return NextResponse.json(
      { error: `Trello API lỗi: ${errText}` },
      { status: 502 }
    );
  }

  const [lists, cards] = await Promise.all([
    listsRes.json() as Promise<{ id: string; name: string }[]>,
    cardsRes.json() as Promise<{ id: string; name: string; idList: string; labels: { id: string; name: string; color: string }[] }[]>,
  ]);

  return NextResponse.json({ lists, cards });
}
