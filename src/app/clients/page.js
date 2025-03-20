"use client";
import React from "react";
import { Card, Typography, styled } from "@mui/material";
import Layout from "@/Layout";

const CardWrapper = styled(Card)(({ theme, bgcolor }) => ({
  borderRadius: "12px",
  minHeight: "120px",
  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
  },
  background: theme.palette.mode === "light" ? bgcolor.light : bgcolor.dark,
  color: "#ffffff",
}));

const Dashboard = () => {
  return (
    <Layout>
      <Typography variant="h3" gutterBottom>
        Welcome Admin!
      </Typography>
    </Layout>
  );
};

export default Dashboard;
