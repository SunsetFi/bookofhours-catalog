import * as React from "react";

import { SxProps } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { formatLabel, formatSeconds } from "@/utils";

import { useObservation } from "@/observables";

import { ElementStackModel } from "@/services/sh-model";

export interface ElementStackCardProps {
  sx?: SxProps;
  element: ElementStackModel;
}

const ElementStackCard = ({ element }: ElementStackCardProps) => {
  const label = useObservation(element.label$) ?? "";
  const quantity = useObservation(element.quantity$) ?? 0;
  const lifetimeRemaining = useObservation(element.lifetimeRemaining$) ?? 0;
  return (
    <Box sx={{ width: "250px", height: "250px", position: "relative" }}>
      <img style={{ width: "100%" }} alt={label} src={element.iconUrl} />
      {quantity > 1 && (
        <Box
          sx={{
            position: "absolute",
            height: "30px",
            borderRadius: "15px",
            top: 5,
            left: 5,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            px: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography sx={{ textAlign: "center" }} variant="body2">
            {quantity}
          </Typography>
        </Box>
      )}
      {lifetimeRemaining > 0 && (
        <Box
          sx={{
            position: "absolute",
            height: "30px",
            borderRadius: "15px",
            top: 5,
            right: 5,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            px: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography sx={{ textAlign: "center" }} variant="body2">
            {formatSeconds(lifetimeRemaining)}
          </Typography>
        </Box>
      )}
      <Box
        sx={{
          position: "absolute",
          minHeight: "30px",
          maxHeight: "calc(100% - 30px)",
          borderRadius: "15px",
          bottom: 5,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          width: "160px",
          px: 1,
          left: "50%",
          transform: `translate(-50%, 0)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography sx={{ textAlign: "center" }} variant="body1">
          {formatLabel(label)}
        </Typography>
      </Box>
    </Box>
  );
};

export default ElementStackCard;
