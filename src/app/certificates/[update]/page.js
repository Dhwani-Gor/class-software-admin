"use client";
import React from "react";
import Typography from "@mui/material/Typography";
//relative path imports
import Layout from "@/Layout";
import AddVisaForm from "@/components/AddCountryForm";
import { Stack } from "@mui/material";
import CommonCard from "@/components/CommonCard";

const UpdateCountry = ({ params }) => {

  return (
    <Layout>
      <CommonCard sx={{ mt: 0 }}>
      <Typography variant="h6" fontWeight={"700"}>
        Certificates / Add Certificate
      </Typography>
      </CommonCard>
      <Stack>
        <AddVisaForm mode="update" visaId={params?.update}/>
      </Stack>
    </Layout>
  );
};

export default UpdateCountry;
