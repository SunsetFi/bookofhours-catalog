import React from "react";

import { ThemeProvider, createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
  },
  typography: {
    fontFamily: "'Edu SA Beginner', cursive",
    h1: {
      fontFamily: "'Tangerine', cursive",
    },
    h2: {
      fontFamily: "'Tangerine', cursive",
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
