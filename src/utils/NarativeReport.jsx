"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { Box } from "@mui/material";
import moment from "moment";
import html2canvas from "html2canvas";
import { PDFDocument, rgb } from "pdf-lib";
import { toast } from "react-toastify";
import CommonButton from "@/components/CommonButton";
import Loader from "@/components/Loader";
import {
  getSpecificClient,
  getAllSystemVariables,
  getSurveyReportDataByJournalId,
  getVisitDetails,
  uploadSurveyReport,
  fetchAdditionalDetails,
  fetchJournalList,
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
  const [additionalDetails, setAdditionalDetails] = useState([]);
  const [journalList, setJournalList] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);


  const currentDate = new Date();
  const stamp = systemVariables?.data?.find((i) => i.name === "company_stamp")?.information || "-";

  useEffect(() => {
    if (!id) return;
    const loadAllData = async () => {
      try {
        setLoading(true);
        const [clientResult, reportResult, sysVarsResult, additionalResult, journalList] = await Promise.all([
          getSpecificClient(id),
          getSurveyReportDataByJournalId(id, reportNumber),
          getAllSystemVariables(),
          fetchAdditionalDetails(id),
          fetchJournalList(id)
        ]);
        if (additionalResult?.status === 200) setAdditionalDetails(additionalResult.data.data);
        if (clientResult?.status === 200) setClientData(clientResult.data.data);
        if (reportResult?.status === 200) setReportDetails(reportResult.data.data || []);
        if (sysVarsResult?.status === 200) setSystemVariables(sysVarsResult.data);
        if (journalList?.status === 200) setJournalList(journalList.data.data);

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

  const companyName =
    systemVariables?.data?.find((i) => i.name === "company_name")?.information || "";

  const generateHtml = useCallback(() => {
    if (!clientData || !reportDetails || !systemVariables) return "";

    const companyLogo =
      systemVariables?.data?.find((i) => i.name === "company_logo")?.information || "";

    const shipName = clientData?.shipName || "-";
    const imo = clientData?.imoNumber || "-";
    const reportNo = reportDetails[0]?.activity?.journal?.journalTypeId || journalList.filter((i) => i.id === reportNumber)[0]?.journalTypeId;
    const issuer = reportDetails?.map((i) => i?.issuer?.name);
    const uniqueSurveyors = [...new Set(issuer)].join(",").toUpperCase();

    const activityHtml =
      reportDetails && reportDetails.length
        ? reportDetails
          .filter((item) => {
            const remarks =
              item?.activity?.remarks ||
              item?.activity?.surveyRemarks ||
              item?.remarks;
            return remarks && remarks.trim() !== "";
          })
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
            <div style="margin-bottom:20px;page-break-inside:avoid;">
              <div style="font-weight:700;color:#1a5490;font-size:15px;margin-bottom:8px;border-bottom:2px solid #e0e0e0;padding-bottom:4px;">
                ${idx + 1}. ${name}
              </div>
              <div style="margin-left:20px;line-height:1.8;text-align:justify;color:#333;">
                ${remarks}
              </div>
            </div>
          `;
          })
          .join("")
        : `<p style="color:#666;text-align:center;padding:40px 0;">No narrative activities available.</p>`;

    const renderAdditionalFields = () => {
      if (!Array.isArray(additionalDetails)) return "";

      const sectionOrder = ["coc", "statutory", "memoranda", "additional", "compliance", "pcsfsi"];

      const titleForKey = (k) => {
        if (!k) return "Other";
        const key = k.toLowerCase();
        switch (key) {
          case "coc": return "Condition of Class";
          case "statutory": return "Statutory";
          case "memoranda": return "Memoranda";
          case "additional": return "Additional Information";
          case "compliance": return "Compliance to New Regulations";
          case "pcsfsi": return "PSC / FSI Deficiency";
          default: return k.toUpperCase();
        }
      };

      const sectionMap = additionalDetails.reduce((acc, section) => {
        acc[section.sectionKey?.toLowerCase()] = section;
        return acc;
      }, {});

      const sectionsHtml = sectionOrder
        .map((sectionKey) => {
          const section = sectionMap[sectionKey] || { sectionKey, data: [] };
          const allEntries = [];

          section.data?.forEach((entry) => {
            const combined = [entry, ...(entry.history || [])].map((e) => ({
              ...e,
              parentCode: entry.code,
              createdAt: e.createdAt || entry.createdAt || null,
              journalTypeId: e.journalTypeId || entry.journalTypeId || null,
            }));
            allEntries.push(...combined);
          });

          const relatedEntries = allEntries.filter((r) => {
            const validRemarks = r?.remarks && String(r.remarks).trim() !== "";

            return (
              validRemarks &&
              (
                r.journalTypeId === reportNumber ||
                r.referenceNo === reportNumber ||
                (reportDetails?.[0]?.activity?.journal?.journalTypeId &&
                  r.journalTypeId === reportDetails[0].activity.journal.journalTypeId)
              )
            );
          });

          if (relatedEntries.length === 0) return "";

          const rowsHtml = relatedEntries
            .map(
              (r) => `
        <div style="margin-bottom:8px;font-size:13px;">
          <div style="display:flex;justify-content:space-between;background:#f9f9f9;padding:6px 10px;border-bottom:1px solid #ddd;">
            <div><strong>Code:</strong> ${r?.code || "-"}</div>
            <div><strong>Ref No:</strong> ${r?.journalTypeId || "-"}</div>
            <div><strong>Action:</strong> ${r?.action || "-"}</div>
          </div>
          <div style="padding:8px 10px;white-space:normal;word-wrap:break-word;word-break:break-word;">
            <strong>Remarks:</strong> ${r?.remarks}</strong>
          </div>
        </div>`
            )
            .join("");

          return `
        <div style="font-weight:700;color:#1a5490;font-size:16px;margin:16px 0 8px;">
          ${titleForKey(sectionKey)}
        </div>
        ${rowsHtml}
      `;
        })
        .join("");

      return sectionsHtml;
    };



    const signaturesHtml = `
      <div style="display:flex;justify-content:space-between;margin-top:80px;padding-top:30px;border-top:2px solid #1a5490;page-break-inside:avoid;">
        <div style="width:45%;">
                    <div class="stamp">${stamp ? `<img src="${stamp}" width="180" height="auto" alt="Stamp" />` : ""}</div>

          <div style="font-weight:800;font-size:15px;color:#1a5490;margin-bottom:12px;text-decoration:underline;"><strong>Signatures</strong></div>

          <div style="margin-bottom:8px;color:#333;"><strong>Surveyors:</strong> ${uniqueSurveyors || "-"}</div>
          <div style="margin-top:24px;line-height:1.8;">
            <div style="margin-bottom:6px;"><strong>Port:</strong> ${places?.join(", ") || "-"}</div>
            <div><strong>Date:</strong> ${isLastVisit === true || isLastVisit === "true" ? moment(lastVisit).format("DD/MM/YYYY") : "-"}</div>
          </div>
        </div>

        <div style="width:45%;text-align:right;">
          <div style="font-weight:700;font-size:15px;color:#1a5490;margin-bottom:12px;text-decoration:underline;">
            This Report is Reviewed and Authorized by:
          </div>
          <div style="margin-top:24px;line-height:1.8;">
            <div><strong>Reviewed On:</strong> ${moment(currentDate).format("DD/MM/YYYY")}</div>
          </div>
        </div>
      </div>
    `;

    return `
      <div class="page" style="font-family:'Times New Roman',serif;background:#fff;padding:50px;max-width:1200px;margin:0 auto;">
        
        <!-- Header Section -->
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #1a5490;padding-bottom:20px;margin-bottom:30px;">
          <div style="flex:1;">
            ${companyLogo ? `<img src="${companyLogo}" alt="Company Logo" style="max-width:180px;height:auto;" />` : ""}
          </div>
          <div style="flex:2;text-align:center;">
            <p style="font-weight:700;color:#1a5490;font-size:24px;text-transform:uppercase;letter-spacing:1px;">
              ${companyName}
            </p>
            <p style="font-weight:600;margin-top:8px;font-size:18px;color:#333;padding:8px 0;margin-top:12px;">
              NARRATIVE REPORT
            </p>
          </div>
          <div style="flex:1;"></div>
        </div>

        <!-- Information Table -->
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:35px;background:#f8f9fa;">
          <tr style="color:#000;">
            <td style="padding:12px;font-weight:700;border:1px solid #ddd;">Ship's Name:</td>
            <td style="padding:12px;border:1px solid #ddd;background:#fff;color:#333;">${shipName}</td>
            <td style="padding:12px;font-weight:700;border:1px solid #ddd;">Report No:</td>
            <td style="padding:12px;border:1px solid #ddd;background:#fff;color:#333;">${reportNo ? reportNo : reportNumber}</td>
          </tr>
          <tr>
            <td style="padding:12px;font-weight:700;border:1px solid #ddd;background:#e9ecef;">IMO Number:</td>
            <td style="padding:12px;border:1px solid #ddd;background:#fff;">${imo}</td>
          </tr>
        </table>

        <!-- Activities Section -->
        <div style="margin-bottom:40px;">
          <div style="font-weight:700;font-size:18px;color:#000;margin-bottom:20px;border-bottom:3px solid #1a5490;padding-bottom:8px;text-transform:uppercase;">
            Activities
          </div>
          ${activityHtml}
        </div>

        <!-- Signatures Section -->
        <div style="font-weight:700;font-size:18px;color:#000;margin-bottom:20px;border-bottom:3px solid #1a5490;padding-bottom:8px;text-transform:uppercase;">
            Additional Notes
          </div>
          ${renderAdditionalFields()}
        ${signaturesHtml}

        <!-- Footer -->
      
      </div>
    `;
  }, [clientData, reportDetails, systemVariables, firstVisit, lastVisit, numOfVisit, places, currentDate, reportNumber]);


  useEffect(() => {
    if (!loading && clientData && reportDetails && systemVariables && !isInitialized) {
      const html = generateHtml();
      setEditorContent(html);
      setIsInitialized(true);
    }
  }, [loading, clientData, reportDetails, systemVariables, generateHtml, isInitialized]);

  // const downloadEditorContentAsPdf = async () => {
  //   let element;

  //   try {
  //     element = document.createElement("div");
  //     element.style.position = "fixed";
  //     element.style.top = "-10000px";
  //     element.style.left = "-10000px";
  //     element.style.width = "1200px";
  //     element.innerHTML = editorContent;

  //     document.body.appendChild(element);

  //     const canvas = await html2canvas(element, {
  //       scale: 2,
  //       useCORS: true,
  //       backgroundColor: "#ffffff",
  //     });

  //     const imgData = canvas.toDataURL("image/png");
  //     const pdf = await PDFDocument.create();
  //     const page = pdf.addPage([canvas.width, canvas.height]);
  //     const image = await pdf.embedPng(imgData);

  //     page.drawImage(image, {
  //       x: 0,
  //       y: 0,
  //       width: canvas.width,
  //       height: canvas.height,
  //     });

  //     const pdfBytes = await pdf.save();
  //     const blob = new Blob([pdfBytes], { type: "application/pdf" });

  //     const file = new File(
  //       [blob],
  //       `Narrative_Report_${clientData?.shipName || "Report"}_${moment().format("DDMMYYYY")}.pdf`,
  //       { type: "application/pdf" }
  //     );

  //     const formData = new FormData();
  //     formData.append("clientId", id);
  //     formData.append(
  //       "reportNumber",
  //       reportDetails[0]?.activity?.journal?.journalTypeId
  //     );
  //     formData.append("type", "narrative-report");
  //     formData.append("generatedDoc", file);

  //     await uploadSurveyReport(formData);
  //     toast.success("Narrative Report uploaded successfully");

  //     const url = URL.createObjectURL(blob);
  //     const link = document.createElement("a");
  //     link.href = url;
  //     link.download = file.name;
  //     link.click();
  //     URL.revokeObjectURL(url);

  //   } catch (err) {
  //     toast.error("Failed to generate Narrative Report");
  //     console.error(err);
  //   } finally {
  //     if (element) {
  //       document.body.removeChild(element); // ✅ prevents UI duplication
  //     }
  //   }
  // };
  const footerText = `© ${companyName} | Generated on ${moment().format("DD-MM-YYYY")} `;


  const downloadEditorContentAsPdf = async () => {
    const iframe = document.querySelector("iframe.tox-edit-area__iframe");
    const contentDocument = iframe?.contentDocument;
    const contentBody = contentDocument?.body;

    if (!contentBody) {
      console.error("Could not find editor content");
      return;
    }

    const tempDiv = document.createElement("div");
    tempDiv.style.position = "fixed";
    tempDiv.style.top = "-10000px";
    tempDiv.style.left = "0";
    tempDiv.style.width = "1200px";
    tempDiv.innerHTML = `
  <div class="pdf-root">
    ${contentBody.innerHTML}
  </div>
`;
    try {
      const style = document.createElement("style");
      style.innerHTML = `
  .pdf-root, 
  .pdf-root * {
    font-family: 'Times New Roman', serif !important;
    font-size: 20px !important;
    line-height: 1.4 !important;
    word-spacing: 0.05em !important;
    box-sizing: border-box;
    white-space: normal !important;
  }

  .pdf-root table {
    border-collapse: collapse !important;
    width: 100% !important;
  }

  .pdf-root tr,
  .pdf-root td,
  .pdf-root th {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    padding: 4px !important;
    vertical-align: top !important;
  }

  .pdf-root .page {
    margin: 0 !important;
    padding: 20px !important;
    background: white !important;
  }
    p{
    font-size:28px !important;
    }
`;

      tempDiv.appendChild(style);
      document.body.appendChild(tempDiv);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const pdfDoc = await PDFDocument.create();
      const margin = 30;
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const usableWidth = pageWidth - 2 * margin;
      const usableHeight = pageHeight - 2 * margin;
      const scaleFactor = usableWidth / imgWidth;
      const baseSliceHeight = Math.floor((usableHeight - 10) / scaleFactor);

      let currentY = 0;
      const pages = [];

      while (currentY < imgHeight) {
        const sliceHeight = Math.min(baseSliceHeight, imgHeight - currentY);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = imgWidth;
        sliceCanvas.height = sliceHeight;
        const ctx = sliceCanvas.getContext("2d");
        ctx.drawImage(canvas, 0, currentY, imgWidth, sliceHeight, 0, 0, imgWidth, sliceHeight);
        const pngUrl = sliceCanvas.toDataURL("image/png");
        pages.push({ pngUrl, sliceHeight });
        currentY += sliceHeight;
      }

      for (let i = 0; i < pages.length; i++) {
        const { pngUrl, sliceHeight } = pages[i];
        const pngImage = await pdfDoc.embedPng(pngUrl);
        const scaledHeight = sliceHeight * scaleFactor;
        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        page.drawImage(pngImage, {
          x: margin,
          y: pageHeight - margin - scaledHeight,
          width: usableWidth,
          height: scaledHeight,
        });
        page.drawText(`Page ${i + 1} of ${pages.length}`, {
          x: pageWidth - margin - 50,
          y: margin / 2,
          size: 9,
        });
        const footerFontSize = 9;
        const footerWidth = footerText.length * (footerFontSize * 0.5);

        page.drawText(footerText, {
          color: rgb(0.6, 0.6, 0.6),
          x: (pageWidth - footerWidth) / 2,
          y: 20,
          size: footerFontSize,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const file = new File([blob], "narrative-report.pdf", { type: "application/pdf" });

      const formData = new FormData();
      formData.append("clientId", id);
      formData.append("reportNumber", reportDetails[0]?.activity?.journal?.journalTypeId);
      formData.append("type", "narrative-report");
      formData.append("generatedDoc", file);

      const res = await uploadSurveyReport(formData);
      if (res) toast.success("Narrative Report Downloaded Successfully");

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Narrative Report-${reportDetails[0]?.activity?.journal?.journalTypeId}-${clientData?.shipName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate Narrative Report");
    } finally {
      if (tempDiv && tempDiv.parentNode) {
        document.body.removeChild(tempDiv);
      }
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
          height: 900,
          menubar: true,
          plugins: [
            "advlist", "autolink", "lists", "link", "image", "charmap",
            "print", "preview", "code", "fullscreen", "table", "textcolor"
          ],
          toolbar: "undo redo | formatselect | bold italic underline forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | table | code fullscreen",
          content_style: `
            body {
              font-family: 'Times New Roman', serif;
              font-size: 14px;
              background-color: #f5f5f5;
              padding: 40px;
              color: #1a1a1a;
              line-height: 1.6;
            }
            .page {
              background: #fff;
              margin: auto;
              box-shadow: 0 4px 20px rgba(0,0,0,0.15);
              border-radius: 8px;
            }
          `,
        }}
      />

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
        <CommonButton onClick={() => router.push(`/clients/${id}`)} text="Back" />
        <CommonButton onClick={downloadEditorContentAsPdf} text="Download PDF" />
      </Box>
    </>
  );
};

export default NarrativeReport;