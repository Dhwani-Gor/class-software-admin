import React from "react";
import { Card } from "@mui/material";

const CommonCard = ({ children }) => {
  return (
    <Card sx={{ px: 4, py: 2, mt: 4, borderRadius: "10px" }}>{children}</Card>
  );
};

export default CommonCard;
