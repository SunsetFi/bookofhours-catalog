import * as React from "react";
import { mergeMap } from "rxjs";

import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Badge from "@mui/material/Badge";

import { useObservation } from "@/hooks/use-observation";

import { ElementStackModel } from "@/services/sh-game";

import AspectsList from "./AspectsList";
import GameTypography from "./GameTypography";

export interface ElementStackDetailsProps {
  elementStack: ElementStackModel;
}

const ElementStackDetails = React.forwardRef<
  HTMLDivElement,
  ElementStackDetailsProps
>(({ elementStack }, ref) => {
  const label = useObservation(elementStack.label$);
  const quantity = useObservation(elementStack.quantity$) ?? 1;
  const aspects = useObservation(elementStack.aspects$) ?? {};
  const iconUrl = useObservation(elementStack.iconUrl$);
  const description = useObservation(
    () =>
      elementStack.element$.pipe(mergeMap((element) => element.description$)),
    [elementStack]
  );

  if (!label) {
    return null;
  }

  return (
    <Card
      ref={ref}
      sx={{
        display: "flex",
        flexDirection: "column",
        maxWidth: 375,
        p: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirecton: "row",
          gap: 1,
          alignItems: "center",
          mb: 2,
        }}
      >
        <Badge
          badgeContent={quantity > 1 ? quantity : 0}
          color="primary"
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <img
            aria-hidden="true"
            loading="lazy"
            src={iconUrl}
            alt={label}
            title={label}
            style={{ display: "block", width: "50px" }}
          />
        </Badge>
        <GameTypography variant="body1">{label}</GameTypography>
      </Box>
      {description && (
        <GameTypography variant="body2" sx={{ mb: 2 }}>
          {description}
        </GameTypography>
      )}
      <AspectsList aspects={aspects} />
    </Card>
  );
});

export default ElementStackDetails;
