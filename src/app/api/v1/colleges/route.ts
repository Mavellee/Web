import { apiRoute, ok } from "@/server/http/route";
import { getColleges } from "@/server/modules/reference/service";

const CACHE = { "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" };

export const GET = apiRoute({ auth: "public" }, async () => {
  return ok(await getColleges(), { headers: CACHE });
});
