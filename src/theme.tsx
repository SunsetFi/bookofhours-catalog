import React from "react";

import { ThemeProvider, createTheme } from "@mui/material";

const headerFontFamily = "'Tangerine', cursive";
const theme = createTheme({
  palette: {
    mode: "dark",
  },
  typography: {
    fontFamily: "'Tinos', serif",
    h1: {
      fontFamily: headerFontFamily,
    },
    h2: {
      fontFamily: headerFontFamily,
    },
    h3: {
      fontFamily: headerFontFamily,
    },
    body1: {
      fontSize: "1.2rem",
    },
    body2: {
      fontSize: "1.2rem",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: "0.9em",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: "0.9em",
        },
      },
    },
    MuiBackdrop: {
      variants: [
        {
          props: { invisible: false },
          style: {
            backdropFilter: "blur(1px)",
          },
        },
      ],
    },
  },
});

const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

export default AppThemeProvider;
