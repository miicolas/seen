import { useEffect, useState } from "react";

// Returns `value` delayed by `delayMs`, collapsing rapid changes into the last
// one. Pass `delayMs: 0` to pass the value through immediately (e.g. when clearing).
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
