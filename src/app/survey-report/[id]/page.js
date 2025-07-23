"use client";
import React, { use } from "react";
import Layout from "@/Layout";
import SurveyReport from "@/utils/SurveyReport";

const GenerateSurveyStatusReport = ({ params }) => {
    const { id } = use(params);

    return (
        <Layout>
            <SurveyReport id={id} />
        </Layout>
    );
};

export default GenerateSurveyStatusReport;
