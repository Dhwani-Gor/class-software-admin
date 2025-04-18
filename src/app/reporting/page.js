"use client";
import React from "react";
import Typography from '@mui/material/Typography';
import CommonCard from "@/components/CommonCard";
import Layout from "@/Layout";
import ReportingForm from "@/components/ReportingForm";

const Reports = () => {
  return (
    <Layout>
      <CommonCard sx={{ mt: 0 }}>
        <Typography variant="h4" fontWeight={700}>
          Reporting
        </Typography>
      </CommonCard>
      <ReportingForm />
    </Layout>
  );
};

export default Reports;
