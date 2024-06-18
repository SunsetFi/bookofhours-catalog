import React from "react";

export function useDebounceCommitValue<T>(
  delay: number,
  onCommit: (value: T) => void
): [value: T | undefined, setValue: (value: T) => void] {
  const [value, setValue] = React.useState<T | undefined>(undefined);

  const timeoutRef = React.useRef<NodeJS.Timeout>();
  const timeoutValue = React.useRef<T | undefined>(undefined);

  React.useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutValue.current = value;
    timeoutRef.current = setTimeout(() => {
      const value = timeoutValue.current;
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

  React.useEffect(() => {
    return () => {
      // Unmounting with a pending value, commit it.
      if (timeoutValue.current) {
        onCommit(timeoutValue.current);
      }
    };
  }, []);

  return [value, setValue];
}
