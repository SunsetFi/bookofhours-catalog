export function isNotNull<T>(x: T | null | undefined): x is T {
  return x != null;
}

export function formatSeconds(value: number): string {
  if (value > 60) {
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${minutes}:${seconds.toFixed(0).padStart(2, "0")}`;
  }

  return value.toFixed(1);
}

// Some CS cards have no spaces before parens, making wrapping act weird.
export function formatLabel(str: string): string {
  return str.replace(/(.)\(/g, "$1 (");
}
