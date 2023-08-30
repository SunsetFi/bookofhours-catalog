import React from "react";

import { ThemeProvider, createTheme } from "@mui/material/styles";

const headerFontFamily = "'Tangerine', cursive";
const theme = createTheme({
  palette: {
    mode: "dark",
  },
  typography: {
    fontFamily: "'Edu SA Beginner', cursive",
    h1: {
      fontFamily: headerFontFamily,
    },
    h2: {
      fontFamily: headerFontFamily,
    },
    h3: {
      fontFamily: headerFontFamily,
    },
    h4: {
      fontFamily: headerFontFamily,
    },
    h5: {
      fontFamily: headerFontFamily,
    },
    h6: {
      fontFamily: headerFontFamily,
    },
    body1: {
      fontSize: "1.5rem",
      fontWeight: "bold",
    },
    body2: {
      fontSize: "1.2rem",
      fontWeight: "bold",
    },
  },
});

const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

export default AppThemeProvider;
