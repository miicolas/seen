// Returns a fully transparent variant of a #rrggbb hex, else "transparent".
export function transparentize(color: string): string {
  if (color.startsWith("#") && color.length === 7) {
    return `${color}00`;
  }
  return "transparent";
}
