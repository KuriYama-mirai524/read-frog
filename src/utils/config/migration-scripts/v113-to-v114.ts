/**
 * Migration script from v113 to v114
 * - Adds `tts.stripRuby`, the opt-in that stops text-to-speech from reading
 *   `<rt>` furigana a second time on annotated pages. It is off, so a reader
 *   who never touches the new switch keeps the old behaviour exactly.
 *
 * The CONFIG_SCHEMA_VERSION bump is also what protects sync: an older build
 * refuses a v114 config instead of parsing an object with a field it does not
 * know and silently dropping it on the next save.
 *
 * Idempotent: a config whose `tts.stripRuby` is already a boolean is returned
 * by identity.
 *
 * IMPORTANT: Migration scripts are frozen snapshots - never import constants,
 * helpers, or shared types.
 */
export function migrate(oldConfig: any): any {
  if (
    !oldConfig ||
    typeof oldConfig !== "object" ||
    Array.isArray(oldConfig) ||
    !oldConfig.tts ||
    typeof oldConfig.tts !== "object" ||
    Array.isArray(oldConfig.tts)
  ) {
    return oldConfig
  }

  if (typeof oldConfig.tts.stripRuby === "boolean") {
    return oldConfig
  }

  return {
    ...oldConfig,
    tts: {
      ...oldConfig.tts,
      stripRuby: false,
    },
  }
}
