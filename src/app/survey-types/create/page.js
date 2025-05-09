"use client";
import React from "react";
import Typography from "@mui/material/Typography";
import Layout from "@/Layout";
import Stack from "@mui/material/Stack";
import CommonCard from "@/components/CommonCard";
import AddClientForm from "@/components/AddClientForm";
import { IconButton } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import SurveyTypeForm from "@/components/AddSurveyType";

const AddClient = () => {
  const router = useRouter();

  return (
    <Layout>
      <CommonCard sx={{ mt: 0, pl: 2 }}>
        <Stack direction={'row'} alignItems={'center'} gap={2}>
          <IconButton size="small" onClick={() => router.push('/survey-types')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" fontWeight={"700"}>
            Survey Types
          </Typography>
        </Stack>
      </CommonCard>
      <Stack>
        <SurveyTypeForm mode="create" />
      </Stack>
    </Layout>
  );
};

export default AddClient;
