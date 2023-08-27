import * as React from "react";

import { SxProps } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export interface RegionIndicatorProps {
  sx?: SxProps;
  children: React.ReactNode;
}

const RegionIndicator = ({ sx, children }: RegionIndicatorProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        ...sx,
      }}
    >
      <Box
        sx={{
          borderLeft: 1,
          borderTop: 1,
          borderColor: "white",
          width: "100%",
          height: "10px",
        }}
      />
      <Typography sx={{ px: 4 }} variant="body1">
        {children}
      </Typography>
      <Box
        sx={{
          borderRight: 1,
          borderTop: 1,
          borderColor: "white",
          width: "100%",
          height: "10px",
        }}
      />
    </Box>
  );
};

export default RegionIndicator;
