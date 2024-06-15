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

export function arrayShallowEquals<T>(a: readonly T[], b: readonly T[]) {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((x, i) => x === b[i]);
}

const pathSplit = /[\/\!]/;
export function tokenPathContainsChild(parent: string, child: string) {
  const parentParts = parent.split(pathSplit);
  const childParts = child.split(pathSplit);

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
