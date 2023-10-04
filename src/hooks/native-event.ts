import * as React from "react";

export function useNativeEvent<
  T extends GlobalEventHandlers,
  K extends keyof GlobalEventHandlersEventMap
>(
  ref: React.RefObject<T | null>,
  type: K,
  listener: (
    this: GlobalEventHandlers,
    ev: GlobalEventHandlersEventMap[K]
  ) => any,
  options?: boolean | AddEventListenerOptions
) {
  React.useEffect(() => {
    if (!ref.current) {
      return;
    }

    // De-reference the target so we remove from the right element.
    const listenTarget = ref.current;

    listenTarget.addEventListener(type, listener, options);
    return () => {
      listenTarget.removeEventListener(type, listener, options);
    };
  }, [type, listener, ref, options]);
}
