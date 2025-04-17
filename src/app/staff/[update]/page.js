"use client";
import React from "react";
import Typography from "@mui/material/Typography";
//relative path imports
import Layout from "@/Layout";
import { Stack } from "@mui/material";
import CommonCard from "@/components/CommonCard";
import AddInspectorForm from "@/components/AddInspectorForm";
import AddClientInspectorCommonForm from "@/components/AddClientInspectorCommonForm";

const UpdateCountry = ({ params }) => {

  return (
    <Layout>
      <CommonCard sx={{ mt: 0 }}>
      <Typography variant="h6" fontWeight={"700"}>
        Staff / Inspectors
      </Typography>
      </CommonCard>
      <Stack>
        {/* <AddInspectorForm mode="update" userId={params?.update}/> */}
        <AddInspectorForm mode="update" userId={params?.update}  role="inspector" />
      </Stack>
    </Layout>
  );
};

export default UpdateCountry;
