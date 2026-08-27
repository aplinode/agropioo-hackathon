import { errorResponse, jsonResponse } from '@/lib/http';
import { requireSessionApi } from '@/lib/auth/guards';
import { fetchCurrentWeather } from '@/lib/farms/weather';

export async function GET(request: Request) {
  const session = await requireSessionApi();
  if (!session) return errorResponse('unauthorized', 'Unauthorized', 401);

  try {
    const url = new URL(request.url);
    const lat = Number(url.searchParams.get('lat'));
    const lng = Number(url.searchParams.get('lng'));
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return errorResponse('validation_error', 'lat and lng are required', 422);
    }

    const snapshot = await fetchCurrentWeather(lat, lng);
    return jsonResponse(snapshot);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse('server_error', message, 500);
  }
}
