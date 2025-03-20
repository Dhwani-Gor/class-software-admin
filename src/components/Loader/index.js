import React from "react";
import { CircularProgress, useTheme } from "@mui/material";
import { Box } from "@mui/system";

const Loader = () => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CircularProgress
        sx={{ color: theme.palette.mode === "dark" ? "#ffffff" : "#000000" }}
      />
    </Box>
  );
};

export default Loader;
