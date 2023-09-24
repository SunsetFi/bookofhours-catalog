import React from "react";

import { ThemeProvider, createTheme } from "@mui/material/styles";

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
          // TODO: Only for text buttons?
          fontSize: "0.6em",
          fontWeight: "bold",
        },
      },
    },
  },
});

const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

export default AppThemeProvider;
