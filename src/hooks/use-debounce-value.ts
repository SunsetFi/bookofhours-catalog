import React from "react";

const defaultDelay = 400;

export function useDebounceCommitValue<T>(
  onCommit: (value: T) => void
): [value: T | undefined, setValue: (value: T) => void];
export function useDebounceCommitValue<T>(
  delay: number,
  onCommit: (value: T) => void
): [value: T | undefined, setValue: (value: T) => void];
export function useDebounceCommitValue<T>(
  arg1: number | ((value: T) => void),
  arg2?: (value: T) => void
): [value: T | undefined, setValue: (value: T) => void] {
  const delay = typeof arg1 === "number" ? arg1 : defaultDelay;
  const onCommit = typeof arg1 === "function" ? arg1 : arg2!;

  const [value, setValue] = React.useState<T | undefined>(undefined);

  const timeoutRef = React.useRef<number>();
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
