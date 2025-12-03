"use client";
import React from "react";
import Typography from "@mui/material/Typography";
//relative path imports
import Layout from "@/Layout";
import { IconButton, Stack } from "@mui/material";
import CommonCard from "@/components/CommonCard";
import SystemVariableForm from "@/components/SystemVariableForm";
import { ArrowBack } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import MachineryHullManager from "@/components/AddMachineList/page";

const UpdateMachineList = ({ params }) => {
  const router = useRouter();
  const shipId = params?.update;

  return (
    <Layout>
      <CommonCard sx={{ mt: 0, pl: 2 }}>
        <Stack direction={"row"} alignItems={"center"} gap={2}>
          <IconButton size="small" onClick={() => router.push("/machine-list")}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" fontWeight={"700"}>
            Machinery / Hull List
          </Typography>
        </Stack>
      </CommonCard>
      <Stack>
        <MachineryHullManager mode="update" shipId={shipId} />
      </Stack>
    </Layout>
  );
};

export default UpdateMachineList;
