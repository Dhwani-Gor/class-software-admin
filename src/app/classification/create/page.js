"use client";
import React from "react";
import CommonCard from "@/components/CommonCard";
import Layout from "@/Layout";
import ClassificationForm from "@/components/AddClassificationForm";
import { Stack } from "@mui/material";
import Typography from "@mui/material/Typography";

const Classification = () => {  
  return (
    <Layout>
      <CommonCard sx={{ mt: 0 }}>
        <Typography variant="h4" fontWeight={700}>
          Classification
        </Typography>
      </CommonCard>
      <Stack>
        
      <ClassificationForm />
      </Stack>
    </Layout>
  );
};

export default Classification;