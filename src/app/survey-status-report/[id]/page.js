"use client";
import React from "react";
import Layout from "@/Layout";
import TextEditor from "@/utils/SurveyStatusReport";
import { use } from "react";

const GenerateSurveyReport = ({ params }) => {
  const { id } = params;
  return (
    <Layout>
      <TextEditor id={id} />
    </Layout>
  );
};
export default GenerateSurveyReport;
