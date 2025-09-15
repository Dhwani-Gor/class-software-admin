"use client";
import React from "react";
import { Button, CircularProgress, styled, useTheme } from "@mui/material";

const StyledButton = styled(Button)(({ theme }) => ({
  paddingBlock: theme.spacing(1),
  paddingInline: theme.spacing(3),
  borderRadius: "8px",
  fontSize: "1rem",
  fontWeight: "bold",
  transition: "all 0.3s ease",
  position: "relative",
  "&:hover": {
    boxShadow: "0 5px 15px rgba(0, 0, 0, 0.2)",
  },
}));

const CommonButton = ({
  isLoading = false,
  text = "Submit",
  color = "default",
  variant = "contained",
  onClick,
  sx = {},
  endIcon,
  disabled,
  startIcon,
  ...props
}) => {
  const theme = useTheme();

  const colorMap = {
    error: "red",
    primary: "#4a90e2",
    success: "green",
    default: "linear-gradient(to right, #9013fe, #4a90e2)",
  };

  const buttonStyles = {
    color: variant === "contained" ? "#ffffff" : colorMap[color],
    background:
      variant === "contained"
        ? colorMap[color] || colorMap.default
        : "transparent",
    border: variant === "outlined" ? `1px solid ${colorMap[color]}` : "none",
    "&:hover": {
      background:
        variant === "contained"
          ? colorMap[color] || colorMap.default
          : "transparent",
      border: variant === "outlined" ? `1px solid ${colorMap[color]}` : "none",
    },
    ...sx,
  };

  return (
    <StyledButton
      endIcon={endIcon}
      onClick={onClick}
      disableRipple
      disabled={isLoading || disabled}
      variant={variant}
      {...props}
      sx={buttonStyles}
      startIcon={startIcon}
    >
      {isLoading ? (
        <CircularProgress
          size={24}
          sx={{
            color: variant === "contained" ? "#ffffff" : colorMap[color],
          }}
        />
      ) : (
        text
      )}
    </StyledButton>
  );
};

export default CommonButton;
