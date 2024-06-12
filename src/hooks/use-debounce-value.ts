import React from "react";

export function useDebounceCommitValue<T>(
  delay: number,
  onCommit: (value: T) => void
): [value: T | undefined, setValue: (value: T) => void] {
  const [value, setValue] = React.useState<T | undefined>(undefined);

  const timeoutRef = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (value !== undefined) {
        onCommit(value);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay, onCommit]);

  return [value, setValue];
}
