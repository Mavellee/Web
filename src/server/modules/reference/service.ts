import "server-only";
import * as repo from "./repository";

/**
 * Reference data (interests, colleges) is public and changes rarely, so the service is a thin
 * pass-through. It still exists so the layering is identical for every feature: the route never
 * talks to the repository directly. When this gets rules (e.g. hide colleges per region) they
 * land here, and the route does not change.
 */
export function getInterests() {
  return repo.listInterests();
}

export function getColleges() {
  return repo.listActiveColleges();
}
