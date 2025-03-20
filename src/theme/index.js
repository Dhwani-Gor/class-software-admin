"use client";
import React from "react";
import { useSelector } from "react-redux";
import { ThemeProvider as MUIThemeProvider, CssBaseline } from "@mui/material";
import { themeCreator } from "./config";

const ThemeProvider = ({ children }) => {
  const mode = useSelector((state) => state.theme.mode);
  const theme = themeCreator(mode);

  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
};

export default ThemeProvider;
