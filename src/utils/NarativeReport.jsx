"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { Box } from "@mui/material";
import moment from "moment";
import html2canvas from "html2canvas";
import { PDFDocument } from "pdf-lib";
import { toast } from "react-toastify";
import CommonButton from "@/components/CommonButton";
import Loader from "@/components/Loader";
import {
    getSpecificClient,
    getAllSystemVariables,
    getSurveyReportDataByJournalId,
    getVisitDetails,
} from "@/api";
import { useRouter } from "next/navigation";

const NarrativeReport = ({ id, reportNumber }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [clientData, setClientData] = useState(null);
    const [reportDetails, setReportDetails] = useState([]);
    const [systemVariables, setSystemVariables] = useState(null);
    const [editorContent, setEditorContent] = useState("");
    const [firstVisit, setFirstVisit] = useState(null);
    const [lastVisit, setLastVisit] = useState(null);
    const [numOfVisit, setNumOfVisit] = useState(null);
    const [places, setPlaces] = useState([]);
    const [isLastVisit, setIsLastVisit] = useState(false);
    const currentDate = new Date();

    // Fetch all required data
    useEffect(() => {
        if (!id) return;
        const loadAllData = async () => {
            try {
                setLoading(true);
                const [clientResult, reportResult, sysVarsResult] = await Promise.all([
                    getSpecificClient(id),
                    getSurveyReportDataByJournalId(id, reportNumber),
                    getAllSystemVariables(),
                ]);

                if (clientResult?.status === 200) setClientData(clientResult.data.data);
                if (reportResult?.status === 200) setReportDetails(reportResult.data.data || []);
                if (sysVarsResult?.status === 200) setSystemVariables(sysVarsResult.data);

                const journalIds = reportResult?.data?.data
                    ?.map((i) => i?.activity?.journal?.id)
                    .filter(Boolean);

                const uniqueJournalId = [...new Set(journalIds)][0];
                if (uniqueJournalId) {
                    const visitResponse = await getVisitDetails("journalId", uniqueJournalId);
                    const visits = visitResponse?.data?.data;
                    if (visits?.length) {
                        setLastVisit(visits[0]?.date);
                        setFirstVisit(visits[visits.length - 1]?.date);
                        setNumOfVisit(visits.length);
                        setIsLastVisit(visits[0].journal?.isLocked);
                        const placesList = visits
                            .map((visit) => visit?.location?.replace(/\s*\(.*?\)\s*/g, "").trim())
                            .filter(Boolean);
                        setPlaces(placesList);
                    }
                }
            } catch (error) {
                toast.error("Failed to load narrative report data");
            } finally {
                setLoading(false);
            }
        };
        loadAllData();
    }, [id, reportNumber]);

    // Generate HTML layout for narrative report
    const generateHtml = useCallback(() => {
        if (!clientData || !reportDetails || !systemVariables) return "";

        const companyName =
            systemVariables?.data?.find((i) => i.name === "company_name")?.information || "";
        const companyLogo =
            systemVariables?.data?.find((i) => i.name === "company_logo")?.information || "";

        const shipName = clientData?.shipName || "-";
        const imo = clientData?.imoNumber || "-";
        const reportNo =
            reportDetails[0]?.activity?.journal?.journalTypeId || reportNumber || "-";

        const activityHtml =
            reportDetails && reportDetails.length
                ? reportDetails
                    .map((item, idx) => {
                        const name =
                            item?.activity?.surveyTypes?.name ||
                            item?.activity?.name ||
                            item?.activity?.typeOfSurvey ||
                            "-";
                        const remarks =
                            item?.activity?.remarks ||
                            item?.activity?.surveyRemarks ||
                            item?.remarks ||
                            "-";
                        return `
                <div style="margin-bottom:16px;">
                  <div style="font-weight:700;margin-bottom:6px;">${idx + 1}. ${name}</div>
                  <div style="margin-left:12px;">${remarks}</div>
                </div>
              `;
                    })
                    .join("")
                : `<p>No narrative activities available.</p>`;

        const signaturesHtml = `
      <div style="display:flex;justify-content:space-between;margin-top:60px;">
        <div style="width:45%;">
          <div style="font-weight:700;margin-bottom:8px;">Signatures</div>
          <div>Surveyors</div>
          <div style="margin-top:16px;">Port: ${places?.join(", ") || "-"}</div>
          <div>Date: ${moment(lastVisit).format("DD/MM/YYYY") || "-"}</div>
        </div>

        <div style="width:45%;text-align:right;">
          <div style="font-weight:700;margin-bottom:8px;">This Report is Reviewed and Authorized by:</div>
          <div>Reviewed On: ${moment(currentDate).format("DD/MM/YYYY")}</div>
        </div>
      </div>
    `;

        return `
      <div class="page" style="font-family:'Times New Roman',serif;background:#fff;padding:28px;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #003366;padding-bottom:10px;margin-bottom:18px;">
          <div style="flex:1;">
            ${companyLogo ? `<img src="${companyLogo}" alt="Logo" style="max-width:150px;height:auto;" />` : ""}
          </div>
          <div style="flex:1;text-align:center;">
            <div style="font-weight:700;color:#003366;font-size:18px;text-transform:uppercase;">${companyName}</div>
            <div style="font-weight:600;margin-top:4px;">Narrative Report</div>
          </div>
          <div style="flex:1;"></div>
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
          <tr>
            <td style="padding:6px;width:25%;font-weight:700;">Ship's Name:</td>
            <td style="padding:6px;">${shipName}</td>
            <td style="padding:6px;width:20%;font-weight:700;">Report No:</td>
            <td style="padding:6px;">${reportNo}</td>
          </tr>
          <tr>
            <td style="padding:6px;font-weight:700;">IMO Number:</td>
            <td style="padding:6px;">${imo}</td>
            <td style="padding:6px;font-weight:700;">No. of Visits:</td>
            <td style="padding:6px;">${numOfVisit || "-"}</td>
          </tr>
          <tr>
            <td style="padding:6px;font-weight:700;">First Visit:</td>
            <td style="padding:6px;">${firstVisit ? moment(firstVisit).format("DD/MM/YYYY") : "-"}</td>
            <td style="padding:6px;font-weight:700;">Last Visit:</td>
            <td style="padding:6px;">${lastVisit ? moment(lastVisit).format("DD/MM/YYYY") : "-"}</td>
          </tr>
        </table>

        <div>${activityHtml}</div>
        ${signaturesHtml}

        <div style="margin-top:24px;text-align:center;font-size:12px;color:#666;">
          © ${companyName} | Generated on ${moment(currentDate).format("DD-MM-YYYY")}
        </div>
      </div>
    `;
    }, [clientData, reportDetails, systemVariables, firstVisit, lastVisit, numOfVisit, places, currentDate, reportNumber]);

    useEffect(() => {
        if (!loading && clientData && reportDetails && systemVariables) {
            const html = generateHtml();
            setEditorContent(html);
        }
    }, [loading, clientData, reportDetails, systemVariables, generateHtml]);

    // Download as PDF
    const downloadEditorContentAsPdf = async () => {
        try {
            const element = document.createElement("div");
            element.innerHTML = editorContent;
            document.body.appendChild(element);
            const canvas = await html2canvas(element);
            const imgData = canvas.toDataURL("image/png");
            const pdf = await PDFDocument.create();
            const page = pdf.addPage([canvas.width, canvas.height]);
            const image = await pdf.embedPng(imgData);
            page.drawImage(image, { x: 0, y: 0, width: canvas.width, height: canvas.height });
            const pdfBytes = await pdf.save();
            const blob = new Blob([pdfBytes], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `Narrative Report - ${clientData?.shipName || "Report"}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(element);
        } catch (err) {
            toast.error("Failed to generate PDF");
        }
    };

    if (loading)
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Loader />
            </Box>
        );

    return (
        <>
            <Editor
                apiKey="p9j94lg0okz82u9rr4v3zhap0pimbq1hob48rzesv3c5dylj"
                value={editorContent}
                onEditorChange={setEditorContent}
                init={{
                    height: 800,
                    menubar: true,
                    plugins: ["advlist", "autolink", "lists", "link", "image", "charmap", "print", "preview", "code", "fullscreen"],
                    toolbar: "undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist | code fullscreen",
                    content_style: `
            body {
              font-family: 'Times New Roman', serif;
              font-size: 13px;
              background-color: #fdfcf7;
              padding: 40px;
              color: #1a1a1a;
            }
            .page {
              border: 6px double #1a1a1a;
              padding: 40px;
              background: #fff;
              margin: auto;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
          `,
                }}
            />

            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
                <CommonButton onClick={() => router.push(`/clients/${id}`)} text="Back" />
                <CommonButton onClick={downloadEditorContentAsPdf} text="Download PDF" />
            </Box>
        </>
    );
};

export default NarrativeReport;
