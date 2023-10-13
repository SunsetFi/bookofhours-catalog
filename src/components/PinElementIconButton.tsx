import * as React from "react";

import IconButton from "@mui/material/IconButton";
import PushPin from "@mui/icons-material/PushPin";

import { False$ } from "@/observables";
import { useDIDependency } from "@/container";

import { Pinboard } from "@/services/pins/Pinboard";

import { useObservation } from "@/hooks/use-observation";

export interface PinElementIconButtonProps {
  title?: string;
  elementId: string;
}
const PinElementIconButton = ({
  title,
  elementId,
}: PinElementIconButtonProps) => {
  const pinboard = useDIDependency(Pinboard);

  const isElementPinned = useObservation(
    () => (elementId ? pinboard.isElementPinned$(elementId) : False$),
    [elementId, pinboard]
  );

  const onClick = React.useCallback(() => {
    if (isElementPinned) {
      pinboard.removeElementId(elementId);
    } else {
      pinboard.pin({ elementId });
    }
  }, [isElementPinned, elementId, pinboard]);

  return (
    <IconButton
      role="button"
      aria-pressed={isElementPinned ? "true" : "false"}
      title={title ?? "Pin Item"}
      onClick={onClick}
    >
      <PushPin
        sx={{ transform: isElementPinned ? "rotate(-90deg)" : "rotate(0deg)" }}
      />
    </IconButton>
  );
};

export default PinElementIconButton;
