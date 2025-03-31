"use client";
import React from "react";
import Layout from "@/Layout";
import JournalEntryForm from "@/components/Reports/JournalEntry";
import { useSearchParams } from "next/navigation"; // For App Router
import { Typography } from "@mui/material";
import CommonCard from "@/components/CommonCard";

const JournalEntry = () => {
  const searchParams = useSearchParams();
  const ship = searchParams.get("ship");
  const client = searchParams.get("client");

  return (
    <Layout>
      <CommonCard sx={{ mt: 0 }}>
        <Typography variant="h4" fontWeight={700}>
          Journal Entry
        </Typography>
      </CommonCard>
      <JournalEntryForm ship={ship} client={client} />
    </Layout>
  );
};

export default JournalEntry;
