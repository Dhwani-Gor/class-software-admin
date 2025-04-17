"use client";
import React from "react";
import Typography from "@mui/material/Typography";
import Layout from "@/Layout";
import Stack from "@mui/material/Stack";
import CommonCard from "@/components/CommonCard";
import AddClientForm from "@/components/AddClientForm";

const AddClient = () => {
  return (
    <Layout>
      <CommonCard sx={{ mt: 0 }}>
        <Typography variant="h6" fontWeight={"700"}>
          Clients
        </Typography>
      </CommonCard>
      <Stack>
        <AddClientForm mode="create" />
      </Stack>
    </Layout>
  );
};

export default AddClient;
