"use client";
import React from "react";
import Typography from "@mui/material/Typography";
//relative path imports
import Layout from "@/Layout";
import { IconButton, Stack } from "@mui/material";
import CommonCard from "@/components/CommonCard";
import SystemVariableForm from "@/components/SystemVariableForm";
import { useRouter } from "next/navigation";
import { ArrowBack } from "@mui/icons-material";

const CreateSystemVariable = () => {
  const router = useRouter();

  return (
    <Layout>
      <CommonCard sx={{ mt: 0, pl: 2 }}>
        <Stack direction={'row'} alignItems={'center'} gap={2}>
          <IconButton size="small" onClick={() => router.push('/system-variables')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" fontWeight={"700"}>
            System Variables
          </Typography>
        </Stack>
      </CommonCard>
      <Stack>
        <SystemVariableForm mode="create" />
      </Stack>
    </Layout>
  );
};

export default CreateSystemVariable;