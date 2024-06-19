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

export function arrayShallowEquals<T extends readonly any[]>(a: T, b: T) {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((x, i) => x === b[i]);
}

export function objectShallowEquals<T extends Record<string | symbol, any>>(
  a: T,
  b: T
): boolean {
  const aKeys = Object.keys(a) as (keyof T)[];
  const bKeys = Object.keys(b) as (keyof T)[];

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  return aKeys.every((key) => a[key] === b[key]);
}

const pathSplit = /[\/\!]/;
export function tokenPathContainsChild(parent: string, child: string) {
  const parentParts = parent.split(pathSplit).filter((x) => x !== "");
  const childParts = child.split(pathSplit).filter((x) => x !== "");

  if (childParts.length < parentParts.length) {
    return false;
  }

  for (let i = 0; i < parentParts.length; i++) {
    if (parentParts[i] !== childParts[i]) {
      return false;
    }
  }

  return true;
}
