"use client";
import React, { useState } from "react";
import Layout from "@/Layout";
import GenerateReport from "@/components/Reports/GenerateReport";
import JournalEntry from "@/components/Reports/JournalEntry";

const AddReport = () => {
  return (
    <Layout>
      <GenerateReport />
    </Layout>
  );
};

export default AddReport;
