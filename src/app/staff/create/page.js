"use client";
import React from "react";
import Typography from "@mui/material/Typography";
//relative path imports
import Layout from "@/Layout";
import { Stack } from "@mui/material";
import CommonCard from "@/components/CommonCard";
import AddInspectorForm from "@/components/AddInspectorForm";

const AddCountry = () => {
  return (
    <Layout>
      <CommonCard>
      <Typography variant="h6" fontWeight={"700"}>
        Staff / Inspectors
      </Typography>
      </CommonCard>
      <Stack>
        <AddInspectorForm mode="create"/>
      </Stack>
    </Layout>
  );
};

export default AddCountry;