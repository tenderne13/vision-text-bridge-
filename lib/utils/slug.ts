export function slugifyPathSegment(value: string) {
  const normalized = value.trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-");

  return normalized.length > 0 ? normalized : "untitled";
}
