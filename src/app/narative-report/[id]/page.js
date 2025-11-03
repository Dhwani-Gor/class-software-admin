"use client";
import React, { use } from "react";
import { useSearchParams } from "next/navigation";
import Layout from "@/Layout";
import NarrativeReport from "@/utils/NarativeReport";

const GenerateNarrativeReport = ({ params }) => {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const journalId = searchParams.get("journalId");

  return (
    <Layout>
      <NarrativeReport id={id} reportNumber={journalId} />
    </Layout>
  );
};

export default GenerateNarrativeReport;
