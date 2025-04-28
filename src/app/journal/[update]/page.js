"use client";
import React from "react";
import Typography from "@mui/material/Typography";
import Layout from "@/Layout";
import JournalEntryForm from "@/components/Reports/JournalEntry";
import CommonCard from "@/components/CommonCard";
import { IconButton, Stack } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useRouter } from "next/navigation";

const JournalEntry = ({ params }) => {
  const router = useRouter();

  return (
    <Layout>
      <CommonCard sx={{ mt: 0, pl: 2 }}>
        <Stack direction={'row'} alignItems={'center'} gap={2}>
          <IconButton size="small" onClick={() => router.push('/journal')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" fontWeight={"700"}>
            Journal Entry
          </Typography>
        </Stack>
      </CommonCard>
      <JournalEntryForm journalId={params.update} />
    </Layout>
  );
};

export default JournalEntry;
