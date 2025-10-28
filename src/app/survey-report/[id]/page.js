"use client";
import React, { use } from "react";
import { useSearchParams } from "next/navigation";
import Layout from "@/Layout";
import SurveyReport from "@/utils/SurveyReport";

const GenerateSurveyStatusReport = ({ params }) => {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const journalId = searchParams.get("journalId");

  return (
    <Layout>
      <SurveyReport id={id} reportNumber={journalId} />
    </Layout>
  );
};

export default GenerateSurveyStatusReport;
