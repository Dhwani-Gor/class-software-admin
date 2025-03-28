"use client";
import React from "react";
import Typography from "@mui/material/Typography";
//relative path imports
import Layout from "@/Layout";
import { Stack } from "@mui/material";
import CommonCard from "@/components/CommonCard";
import AddClientForm from "@/components/AddClientForm";

const UpdateClient = ({ params }) => {

  return (
    <Layout>
      <CommonCard>
      <Typography variant="h6" fontWeight={"700"}>
        Clients
      </Typography>
      </CommonCard>
      <Stack>
        <AddClientForm mode="update" clientId={params?.update}/>
      </Stack>
    </Layout>
  );
};

export default UpdateClient;
