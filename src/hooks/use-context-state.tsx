import React from "react";

const ContextState = React.createContext<
  Record<string, React.Dispatch<React.SetStateAction<unknown>>>
>({});

export type UseContextState<T> = [
  value: T,
  Provider: React.ComponentType<{ children: React.ReactNode }>,
  setter: React.Dispatch<React.SetStateAction<T>>
];

export function useContextState<T>(
  key: string,
  initialValue: T
): UseContextState<T> {
  const [value, setter] = React.useState(initialValue);
  const inheritedContext = React.useContext(ContextState);
  const newContext = React.useMemo(
    () => ({
      ...inheritedContext,
      [key]: setter as any,
    }),
    [inheritedContext]
  );

  const Provider = React.useMemo(
    () =>
      ({ children }: { children: React.ReactNode }) =>
        (
          <ContextState.Provider value={newContext}>
            {children}
          </ContextState.Provider>
        ),
    [newContext]
  );

  return [value, Provider, setter];
}

export function useContextStateSetter<T>(
  key: string
): React.Dispatch<React.SetStateAction<T>> {
  const context = React.useContext(ContextState);
  return context[key];
}
