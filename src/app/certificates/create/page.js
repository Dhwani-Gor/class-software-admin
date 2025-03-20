"use client";
import React from "react";
import Typography from "@mui/material/Typography";
//relative path imports
import Layout from "@/Layout";
import AddVisaForm from "@/components/AddCountryForm";
import { Stack } from "@mui/material";
import CommonCard from "@/components/CommonCard";

const AddCountry = () => {
  return (
    <Layout>
      <CommonCard>
      <Typography variant="h6" fontWeight={"700"}>
        Countries / Add Country
      </Typography>
      </CommonCard>
      <Stack>
        <AddVisaForm mode="create"/>
      </Stack>
    </Layout>
  );
};

export default AddCountry;