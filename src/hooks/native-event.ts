import React from "react";

export function useNativeEvent<
  T extends GlobalEventHandlers,
  K extends keyof GlobalEventHandlersEventMap
>(
  element: T,
  type: K,
  listener: (
    this: GlobalEventHandlers,
    ev: GlobalEventHandlersEventMap[K]
  ) => any,
  options?: boolean | AddEventListenerOptions
) {
  React.useEffect(() => {
    if (!element) {
      return;
    }

    // De-reference the target so we remove from the right element.
    element.addEventListener(type, listener, options);
    return () => {
      element.removeEventListener(type, listener, options);
    };
  }, [type, listener, element, options]);
}
