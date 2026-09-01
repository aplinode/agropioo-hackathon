import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/detect/chats/route";

const mockQuery = vi.fn();
const mockQueryOne = vi.fn();
const mockRequireSessionApi = vi.fn();

vi.mock("@/lib/db", () => ({
  query: (...args: unknown[]) => mockQuery(...args),
  queryOne: (...args: unknown[]) => mockQueryOne(...args),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireSessionApi: (...args: unknown[]) => mockRequireSessionApi(...args),
}));

function createRequest(body: unknown): Request {
  return new Request("http://localhost/api/detect/chats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/detect/chats", () => {
  beforeEach(() => {
    mockRequireSessionApi.mockReset();
    mockQueryOne.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockRequireSessionApi.mockResolvedValue(null);
    const res = await POST(createRequest({}));
    expect(res.status).toBe(401);
  });

  it("creates a new chat when none exists for the scan", async () => {
    mockRequireSessionApi.mockResolvedValue({ accountId: "acct-1" });
    mockQueryOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "chat-new" });

    const res = await POST(createRequest({ scanId: "scan-1" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.chatId).toBe("chat-new");
    expect(mockQueryOne).toHaveBeenNthCalledWith(1, "SELECT id FROM detect_chats WHERE account_id = $1 AND scan_id = $2 ORDER BY updated_at DESC LIMIT 1", ["acct-1", "scan-1"]);
    expect(mockQueryOne).toHaveBeenNthCalledWith(2, "INSERT INTO detect_chats (account_id, scan_id, title) VALUES ($1, $2, $3) RETURNING id", ["acct-1", "scan-1", "New detection chat"]);
  });

  it("reuses an existing chat when one already exists for the scan", async () => {
    mockRequireSessionApi.mockResolvedValue({ accountId: "acct-1" });
    mockQueryOne.mockResolvedValueOnce({ id: "chat-existing" });

    const res = await POST(createRequest({ scanId: "scan-1" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.chatId).toBe("chat-existing");
    expect(mockQueryOne).toHaveBeenCalledTimes(1);
  });

  it("creates a new chat when scanId is null", async () => {
    mockRequireSessionApi.mockResolvedValue({ accountId: "acct-1" });
    mockQueryOne.mockResolvedValueOnce({ id: "chat-null" });

    const res = await POST(createRequest({}));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.chatId).toBe("chat-null");
    expect(mockQueryOne).toHaveBeenCalledTimes(1);
  });
});
