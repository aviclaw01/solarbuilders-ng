/**
 * Brand name -> slug, as literal data with no imports.
 *
 * Client components need this to link a brand name in a bill of materials to
 * its page. Importing it from lib/brands.ts would drag the whole ~61KB
 * catalogue into the browser bundle for one lookup, so it lives here alone.
 *
 * lib/brands.ts asserts at module load that this matches the real catalogue,
 * so a renamed or added brand fails the build rather than silently producing a
 * dead link.
 */
export const BRAND_SLUG_BY_NAME: Record<string, string> = {
  "felicity solar": "felicity",
  "deye": "deye",
  "growatt": "growatt",
  "luxpower": "luxpower",
  "victron energy": "victron",
  "solis": "solis",
  "must": "must",
  "sako": "sako",
  "luminous": "luminous",
  "pylontech": "pylontech",
  "dyness": "dyness",
  "itel energy": "itel-energy",
  "blue carbon": "blue-carbon",
  "jinko solar": "jinko",
  "ja solar": "ja-solar",
  "longi": "longi",
  "canadian solar": "canadian-solar",
  "trina solar": "trina",
  "auxano solar": "auxano",
};
