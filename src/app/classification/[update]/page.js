"use client";
import React from "react";
import Typography from "@mui/material/Typography";
//relative path imports
import Layout from "@/Layout";
import { IconButton, Stack } from "@mui/material";
import CommonCard from "@/components/CommonCard";
import { ArrowBack } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import ClassificationForm from "@/components/AddClassificationForm";

const UpdateClassification = ({ params }) => {
  const router = useRouter();

  return (
    <Layout>
      <CommonCard sx={{ mt: 0, pl: 2 }}>
        <Stack direction={'row'} alignItems={'center'} gap={2}>
          <IconButton size="small" onClick={() => router.push('/classification')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" fontWeight={"700"}>
            Classification
          </Typography>
        </Stack>
      </CommonCard>
      <Stack>
        <ClassificationForm mode="update" variableId={params?.update} />
      </Stack>
    </Layout>
  );
};

export default UpdateClassification;