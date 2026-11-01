import { apiRoute, ok } from "@/server/http/route";
import { getInterests } from "@/server/modules/reference/service";

// Same for every visitor, changes rarely: let the CDN/browser cache it for an hour and serve
// stale for a day while it refreshes. Saves a DB round-trip on every onboarding page view.
const CACHE = { "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" };

export const GET = apiRoute({ auth: "public" }, async () => {
  return ok(await getInterests(), { headers: CACHE });
});
