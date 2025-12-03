"use client";
import React from "react";
import Typography from "@mui/material/Typography";
//relative path imports
import Layout from "@/Layout";
import { IconButton, Stack } from "@mui/material";
import CommonCard from "@/components/CommonCard";
import { useRouter } from "next/navigation";
import { ArrowBack } from "@mui/icons-material";
import MachineryHullManager from "@/components/AddMachineList/page";

const CreateMachineList = () => {
  const router = useRouter();

  return (
    <Layout>
      <CommonCard sx={{ mt: 0, pl: 2 }}>
        <Stack direction={"row"} alignItems={"center"} gap={2}>
        <IconButton size="small" onClick={() => router.push("/machine-list")}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" fontWeight={"700"}>
            Machine List
          </Typography>
        </Stack>
      </CommonCard>
      <Stack>
        <MachineryHullManager mode="create" />
      </Stack>
    </Layout>
  );
};

export default CreateMachineList;
