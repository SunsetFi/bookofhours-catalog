import * as React from "react";

import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Badge from "@mui/material/Badge";

import { useObservation } from "@/observables";

import { ElementStackModel } from "@/services/sh-game";

import AspectsList from "./AspectsList";

export interface ElementStackDetails {
  elementStack: ElementStackModel;
}

const ElementStackDetails = ({ elementStack }: ElementStackDetails) => {
  const label = useObservation(elementStack.label$) ?? "";
  const quantity = useObservation(elementStack.quantity$) ?? 1;
  const aspects = useObservation(elementStack.aspects$) ?? {};
  return (
    <Card
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
            src={elementStack.iconUrl}
            alt={label}
            title={label}
            style={{ width: "50px", height: "50px" }}
          />
        </Badge>
        <Typography variant="body1">{label}</Typography>
      </Box>
      <AspectsList aspects={aspects} />
    </Card>
  );
};

export default ElementStackDetails;
