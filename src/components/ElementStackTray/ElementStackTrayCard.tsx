import * as React from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme, type SxProps } from "@mui/material/styles";

import { ElementStackModel } from "@/services/sh-game";
import { useObservation } from "@/observables";
import AutosizeTypography from "../AutosizeText";

export interface ElementStackTrayCardProps {
  sx?: SxProps;
  elementStack: ElementStackModel;
  width?: number;
}

// Card is 256x406
// text area is 150 height
const aspectRatio = 1.59;

const textBackgroundColor = "#444";
const ElementStackTrayCard = ({
  elementStack,
  width = 125,
  sx,
}: ElementStackTrayCardProps) => {
  const theme = useTheme();
  const widthPx = `${width}px`;
  const iconUrl = useObservation(elementStack.iconUrl$);
  const label = useObservation(elementStack.label$) ?? "";
  const quantity = useObservation(elementStack.quantity$) ?? 0;

  if (!iconUrl) {
    return null;
  }

  return (
    <Box sx={{ position: "relative", ...sx }}>
      <Box
        sx={{
          borderRadius: 2,
          display: "flex",
          flexDirection: "column",
          width: widthPx,
          height: `${width * aspectRatio}px`,
        }}
      >
        <img
          loading="lazy"
          src={iconUrl}
          title={label}
          style={{ width: widthPx }}
        />
        <Box
          sx={{
            width: "100%",
            height: "100%",
            minHeight: 0,
            p: 1,
            backgroundColor: textBackgroundColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AutosizeTypography
            variant="body1"
            color={theme.palette.getContrastText(textBackgroundColor)}
            textAlign="center"
          >
            {label}
          </AutosizeTypography>
        </Box>
      </Box>
      {quantity > 1 && (
        <Typography
          component="div"
          variant="body1"
          sx={{
            minWidth: "32px",
            height: "32px",
            border: "2px solid #888",
            borderRadius: "16px",
            backgroundColor: "#ABB",
            color: theme.palette.getContrastText("#ABB"),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "absolute",
            bottom: -10,
            right: -10,
            zIndex: 1,
          }}
        >
          {quantity}
        </Typography>
      )}
    </Box>
  );
};

export default ElementStackTrayCard;
