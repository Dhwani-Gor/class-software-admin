"use client";
import React from "react";
import { Box, Typography } from "@mui/material";
import CommonCard from "@/components/CommonCard";
import Layout from "@/Layout";

const Reports = () => {
  return (
    <Layout>
      <CommonCard sx={{ mt: 0 }}>
        <Typography variant="h4" fontWeight={700}>
          Reports
        </Typography>
      </CommonCard>
    </Layout>
  );
};

export default Reports;
