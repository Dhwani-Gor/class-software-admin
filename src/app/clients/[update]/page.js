"use client";
import React from "react";
import Typography from "@mui/material/Typography";
//relative path imports
import Layout from "@/Layout";
import { Stack } from "@mui/material";
import CommonCard from "@/components/CommonCard";
import AddClientForm from "@/components/AddClientForm";
import AddClientInspectorCommonForm from "@/components/AddClientInspectorCommonForm";

const UpdateClient = ({ params }) => {

  return (
    <Layout>
      <CommonCard sx={{ mt: 0 }}>
      <Typography variant="h6" fontWeight={"700"}>
        Clients
      </Typography>
      </CommonCard>
      <Stack>
        {/* <AddClientForm mode="update" clientId={params?.update}/> */}
        <AddClientInspectorCommonForm mode="update" userId={params?.update}  role="client" />
      </Stack>
    </Layout>
  );
};

export default UpdateClient;
