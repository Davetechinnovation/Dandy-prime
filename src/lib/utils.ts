export function isValidMediaType(type: string): type is "movie" | "tv" {
  return type === "movie" || type === "tv";
}
