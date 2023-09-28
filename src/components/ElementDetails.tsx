import * as React from "react";

import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { useObservation } from "@/observables";

import { ElementModel } from "@/services/sh-compendium";

import AspectsList from "./AspectsList";

export interface ElementDetailsProps {
  element: ElementModel;
}

const ElementDetails = React.forwardRef<HTMLDivElement, ElementDetailsProps>(
  ({ element }, ref) => {
    const label = useObservation(element.label$) ?? "";
    const aspects = useObservation(element.aspects$) ?? {};
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
          <img
            src={element.iconUrl}
            alt={label}
            title={label}
            style={{ width: "50px" }}
          />
          <Typography variant="body1">{label}</Typography>
        </Box>
        <AspectsList aspects={aspects} />
      </Card>
    );
  }
);

export default ElementDetails;
