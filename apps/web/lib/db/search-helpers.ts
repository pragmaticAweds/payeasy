export function parseRadius(radius: string): number {
  const match = radius.match(/^(\d+(?:\.\d+)?)\s*(km|m)?$/i);
  if (!match) {
    throw new Error(`Invalid radius format: ${radius}. Expected format: "5km" or "5000m"`);
  }

  let meters = parseFloat(match[1]);
  if (match[2]?.toLowerCase() === "km") {
    meters *= 1000;
  }

  return meters;
}

export function buildPostGISLocationCondition(
  lat: number,
  lng: number,
  radiusMeters: number,
  paramIndex: number
): { sql: string; params: number[] } {
  return {
    sql: `ST_DWithin(
      ST_MakePoint(longitude, latitude)::geography,
      ST_MakePoint($${paramIndex}, $${paramIndex + 1})::geography,
      $${paramIndex + 2}
    )`,
    params: [lng, lat, radiusMeters],
  };
}

export function buildFullTextSearchCondition(
  searchTerm: string,
  paramIndex: number
): { sql: string; params: string[] } {
  // Convert search term to tsquery format
  const tsQuery = searchTerm
    .split(/\s+/)
    .map((word) => `${word}:*`)
    .join(" & ");

  return {
    sql: `to_tsvector('english', title || ' ' || description) @@ to_tsquery('english', $${paramIndex})`,
    params: [tsQuery],
  };
}
