import React from "react";

export function useMutationObserver(
  element: Element | null | undefined,
  onMutation: () => void,
) {
  const onMutationRef = React.useRef(onMutation);
  React.useEffect(() => {
    onMutationRef.current = onMutation;
  }, [onMutation]);

  React.useEffect(() => {
    if (element == null) {
      return;
    }

    const observer = new MutationObserver(() => {
      onMutationRef.current();
    });

    observer.observe(element, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [element]);
}
