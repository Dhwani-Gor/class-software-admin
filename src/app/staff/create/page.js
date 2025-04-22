"use client";
import React from "react";
import Typography from "@mui/material/Typography";
//relative path imports
import Layout from "@/Layout";
import { IconButton, Stack } from "@mui/material";
import CommonCard from "@/components/CommonCard";
import AddInspectorForm from "@/components/AddInspectorForm";
import { useRouter } from "next/navigation";
import { ArrowBack } from "@mui/icons-material";

const AddStaff = () => {
  const router = useRouter();

  return (
    <Layout>
      <CommonCard sx={{ mt: 0, pl: 2 }}>
        <Stack direction={'row'} alignItems={'center'} gap={2}>
          <IconButton size="small" onClick={() => router.push('/staff')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" fontWeight={"700"}>
            Staff / Inspectors
          </Typography>
        </Stack>
      </CommonCard>
      <Stack>
        <AddInspectorForm mode="create" />
        {/* <AddClientInspectorCommonForm mode="create" role="inspector" /> */}
      </Stack>
    </Layout>
  );
};

export default AddStaff;