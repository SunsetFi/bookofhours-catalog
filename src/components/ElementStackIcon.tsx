import * as React from "react";

import { useObservation } from "@/observables";
import { ElementStackModel } from "@/services/sh-model";

export interface ElementStackIconProps {
  elementStack: ElementStackModel;
}

const ElementStackIcon = ({ elementStack }: ElementStackIconProps) => {
  const iconUrl = elementStack.iconUrl;
  const label = useObservation(elementStack.label$) ?? "";

  return (
    <img
      src={iconUrl}
      alt={label}
      title={label}
      style={{ width: "40px", height: "40px" }}
    />
  );
};

export default ElementStackIcon;
