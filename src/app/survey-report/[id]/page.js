"use client";
import React from "react";
import Layout from "@/Layout";
import TextEditor from "@/utils/TextEditor";
import { use } from "react";
import SurveyReport from "@/utils/SurveyReport";

const GenerateSurveyStatusReport = ({ params }) => {
    const { id } = params
    return (
        <Layout>
            <SurveyReport id={id}/>
        </Layout>
    )
}
export default GenerateSurveyStatusReport