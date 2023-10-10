import * as React from "react";
import { Instance as PopperInstance } from "@popperjs/core";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Popper from "@mui/material/Popper";
import { useTheme, type SxProps } from "@mui/material/styles";

import { useObservation } from "@/hooks/use-observation";
import { useMutationObserver } from "@/hooks/use-mutation-observer";

import { ElementStackModel } from "@/services/sh-game";

import AutosizeTypography from "../AutosizeText";
import ElementStackDetails from "../ElementStackDetails";

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

  const [popupAnchor, setPopupAnchor] = React.useState<HTMLElement | null>(
    null
  );
  const popperRef = React.useRef<PopperInstance | null>(null);
  const [popperContent, setPopperContent] = React.useState<HTMLElement | null>(
    null
  );

  useMutationObserver(popperContent, () => popperRef.current?.update());

  if (!iconUrl) {
    return null;
  }

  return (
    <Box sx={{ position: "relative", ...sx }}>
      <Popper
        popperRef={popperRef}
        open={popupAnchor != null}
        anchorEl={popupAnchor!}
        sx={{
          pointerEvents: "none",
        }}
      >
        <ElementStackDetails
          ref={setPopperContent}
          elementStack={elementStack}
        />
      </Popper>
      <Box
        onMouseOver={(e) => setPopupAnchor(e.currentTarget)}
        onMouseOut={() => setPopupAnchor(null)}
        sx={{
          borderRadius: 2,
          display: "flex",
          flexDirection: "column",
          width: widthPx,
          height: `${width * aspectRatio}px`,
          overflow: "hidden",
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
