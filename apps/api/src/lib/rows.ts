function camelToSnake(key: string) {
  return key.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
}

export function toApiRow(row: unknown): any {
  if (row instanceof Date) return row.toISOString();
  if (Array.isArray(row)) return row.map(toApiRow);
  if (!row || typeof row !== "object") return row;

  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [camelToSnake(key), toApiRow(value)]),
  );
}

export function toApiRows(rows: unknown[]): any[] {
  return rows.map(toApiRow);
}
