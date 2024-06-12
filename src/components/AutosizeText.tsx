import React from "react";

import Box from "@mui/material/Box";
import Typography, { TypographyProps } from "@mui/material/Typography";
import { useComponentBounds } from "@/hooks/use-component-bounds";

export type AutosizeTypographyProps = Omit<TypographyProps, "component">;

// No library seems to do this in a sensible way.  The best I could find was one that decrements the font size by 1 point in a loop between rerenders
// which is horrible for performance.

// My hackish solution is to check how much bigger we are then scale us down.  It works... if you dont mind the text being centered.

const AutosizeTypography = ({ sx, ...props }: TypographyProps) => {
  const [outer, setOuter] = React.useState<HTMLSpanElement | null>(null);
  const [inner, setInner] = React.useState<HTMLSpanElement | null>(null);

  const { width: outerWidth, height: outerHeight } = useComponentBounds(outer);
  const { width: innerWidth, height: innerHeight } = useComponentBounds(inner);

  const scale = React.useMemo(() => {
    if (
      outerWidth == null ||
      outerHeight == null ||
      innerWidth == null ||
      innerHeight == null
    ) {
      return 1;
    }

    const widthScale = outerWidth / innerWidth;
    const heightScale = outerHeight / innerHeight;

    return Math.min(1, widthScale, heightScale);
  }, [outerWidth, outerHeight, innerWidth, innerHeight]);

  return (
    <Box component="span" sx={{ width: "100%", height: "100%", ...sx }}>
      <Box
        ref={setOuter}
        component="span"
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          ...sx,
        }}
      >
        <Typography
          ref={setInner}
          {...props}
          sx={{ visibility: "hidden", position: "absolute" }}
        />
        <Typography
          {...props}
          sx={{
            transform: `scale(${scale})`,
          }}
        />
      </Box>
    </Box>
  );
};

export default AutosizeTypography;
