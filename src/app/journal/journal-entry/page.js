"use client";
import React from "react";
import Typography from "@mui/material/Typography";
import Layout from "@/Layout";
import JournalEntryForm from "@/components/Reports/JournalEntry";
import CommonCard from "@/components/CommonCard";

const JournalEntry = () => {

  return (
    <Layout>
      <CommonCard sx={{ mt: 0 }}>
        <Typography variant="h4" fontWeight={700}>
          Journal Entry
        </Typography>
      </CommonCard>
      <JournalEntryForm  />
    </Layout>
  );
};

export default JournalEntry;
