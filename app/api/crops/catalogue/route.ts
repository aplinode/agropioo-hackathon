import { jsonResponse, errorResponse } from "@/lib/http";
import { requireSessionApi } from "@/lib/auth/guards";
import { cropCatalogueQuerySchema } from "@/lib/validation/crops";
import { listCrops } from "@/lib/crops/catalogue";

export async function GET(request: Request) {
  const session = await requireSessionApi();
  if (!session) return errorResponse("unauthorized", "Unauthorized", 401);

  const url = new URL(request.url);
  const parsed = cropCatalogueQuerySchema.safeParse({
    season: url.searchParams.get("season") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    locale: url.searchParams.get("locale") ?? undefined,
  });
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ({ path: i.path, message: i.message }));
    return new Response(
      JSON.stringify({ error: { code: "validation_error", message: "Invalid query", issues } }),
      { status: 422, headers: { "Content-Type": "application/json" } },
    );
  }

  const crops = await listCrops(parsed.data);
  return jsonResponse({ crops });
}
