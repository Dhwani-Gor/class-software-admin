import { Editor } from "@tinymce/tinymce-react";
import { useEffect, useState, useCallback } from "react";
import { getAllListClassificationSurveys, getAllSystemVariables, getSpecificClient, getSurveyReportDataByJournalId, getVisitDetails, uploadSurveyReport } from "../api";
import { toast } from "react-toastify";
import { PDFDocument } from "pdf-lib";
import html2canvas from "html2canvas";
import moment from "moment";
import CommonButton from "@/components/CommonButton";
import { Box } from "@mui/material";
import Loader from "@/components/Loader";
import { useRouter } from "next/navigation";

const SurveyReport = ({ id, reportNumber }) => {
  const router = useRouter();
  const [reportDetails, setReportDetails] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editorContent, setEditorContent] = useState("");
  const [systemVariables, setSystemVariables] = useState(null);
  const [firstVisit, setFirstVisit] = useState(null);
  const [lastVisit, setLastVisit] = useState(null);
  const [numOfVisit, setNumOfVisit] = useState(null);
  const [journalId, setJournalId] = useState("");
  const [classificationData, setClassificationData] = useState([]);
  const currentDate = new Date();

  const formatSurveyName = (name) => {
    if (!name) return "";
    return name
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getAllClassification = async () => {
    const response = await getAllListClassificationSurveys({ clientId: id });
    setClassificationData(response?.data?.data);
  };

  useEffect(() => {
    getAllClassification();
    const getSystemVariables = async () => {
      try {
        const response = await getAllSystemVariables();
        if (response?.status === 200) {
          setSystemVariables(response?.data);
        }
      } catch (error) {
        console.log(error);
      }
    };

    getSystemVariables();
  }, []);

  const downloadEditorContentAsPdf = async () => {
    const iframe = document.querySelector("iframe.tox-edit-area__iframe");
    const contentDocument = iframe?.contentDocument;
    const contentBody = contentDocument?.body;

    if (!contentBody) {
      console.error("Could not find editor content");
      return;
    }

    const originalOverflow = contentBody.style.overflow;
    const originalHeight = contentBody.style.height;
    const originalMaxHeight = contentBody.style.maxHeight;

    try {
      const style = contentDocument.createElement("style");
      style.innerHTML = `
      * {
        font-family: 'Times New Roman', serif !important;
        font-size: 11px !important;
        line-height: 20px !important;
        word-spacing: 0.05em !important;
        box-sizing: border-box;
        white-space: normal !important;
      }

      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        width: 100% !important;
        height: auto !important;
        overflow: visible !important;
      }
      
      body > * {
        margin: 0 !important;
      }

      table {
        border-collapse: collapse !important;
        page-break-inside: auto !important;
        width: 100% !important;
      }

      table tr, table td, table th {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        vertical-align: top !important;
        padding: 4px !important;
      }

      table thead {
        display: table-header-group !important;
      }

      table tbody {
        display: table-row-group !important;
      }

      .no-break {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
      .page {
        margin: 0 !important;
        padding: 40px !important;
      }
    `;
      contentDocument.head.appendChild(style);

      const tableRows = contentDocument.querySelectorAll("table tr");
      tableRows.forEach((row) => {
        row.classList.add("no-break");
        row.style.pageBreakInside = "avoid";
        row.style.breakInside = "avoid";
      });

      contentBody.style.overflow = "visible";
      contentBody.style.height = "auto";
      contentBody.style.maxHeight = "none";

      // Scroll iframe to top
      if (iframe.contentWindow) {
        iframe.contentWindow.scrollTo(0, 0);
      }
      contentDocument.documentElement.scrollTop = 0;
      contentBody.scrollTop = 0;

      // Force layout recalculation
      contentBody.offsetHeight;
      contentDocument.documentElement.style.overflow = "visible";
      contentDocument.documentElement.style.height = "auto";

      await document.fonts.ready;
      await new Promise((resolve) => setTimeout(resolve, 800));

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const dpiRatio = 1.3333;
      const canvasWidth = pageWidth * dpiRatio;

      // Get the actual content height
      const contentHeight = Math.max(contentBody.scrollHeight, contentBody.offsetHeight, contentBody.clientHeight, contentDocument.documentElement.scrollHeight, contentDocument.documentElement.offsetHeight);

      console.log("Content dimensions:", {
        scrollHeight: contentBody.scrollHeight,
        offsetHeight: contentBody.offsetHeight,
        clientHeight: contentBody.clientHeight,
        docScrollHeight: contentDocument.documentElement.scrollHeight,
        finalHeight: contentHeight,
      });

      const canvas = await html2canvas(contentBody, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        backgroundColor: "#ffffff",
        logging: true,
        windowWidth: canvasWidth,
      });

      console.log("Canvas captured:", {
        width: canvas.width,
        height: canvas.height,
        scale: 2,
        contentHeight: contentHeight,
      });

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      console.log("Canvas captured:", { imgWidth, imgHeight, scale: 2 });

      const pdfDoc = await PDFDocument.create();
      const margin = 30;
      const usableWidth = pageWidth - 2 * margin;
      const usableHeight = pageHeight - 2 * margin;
      const scaleFactor = usableWidth / imgWidth;

      const baseSliceHeight = Math.floor((usableHeight - 10) / scaleFactor);

      const getTableRowPositions = () => {
        const rows = contentDocument.querySelectorAll("table tr");
        const positions = [];

        rows.forEach((row) => {
          const rect = row.getBoundingClientRect();
          const bodyRect = contentBody.getBoundingClientRect();
          const relativeTop = rect.top - bodyRect.top + contentBody.scrollTop;
          const relativeBottom = relativeTop + rect.height;

          positions.push({
            top: Math.floor(relativeTop * 2),
            bottom: Math.floor(relativeBottom * 2),
            height: Math.floor(rect.height * 2),
          });
        });

        return positions;
      };

      const rowPositions = getTableRowPositions();

      const getOptimalSliceHeight = (startY, maxSliceHeight) => {
        let optimalHeight = maxSliceHeight;
        const sliceEndY = startY + maxSliceHeight;

        for (const row of rowPositions) {
          if (row.top < sliceEndY && row.bottom > sliceEndY) {
            if (row.top > startY + 100) {
              optimalHeight = row.top - startY;
            } else if (row.bottom < startY + maxSliceHeight + row.height) {
              optimalHeight = row.bottom - startY;
            }
            break;
          }
        }

        return Math.max(optimalHeight, 100);
      };

      let currentY = 0;
      const pages = []; // Store all pages first

      // First pass: create all page slices
      while (currentY < imgHeight) {
        const maxSliceHeight = Math.min(baseSliceHeight, imgHeight - currentY);
        const sliceHeight = getOptimalSliceHeight(currentY, maxSliceHeight);

        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = imgWidth;
        sliceCanvas.height = sliceHeight;

        const ctx = sliceCanvas.getContext("2d");
        ctx.drawImage(canvas, 0, currentY, imgWidth, sliceHeight, 0, 0, imgWidth, sliceHeight);

        const pngUrl = sliceCanvas.toDataURL("image/png");
        pages.push({ pngUrl, sliceHeight });

        currentY += sliceHeight;
      }

      // Second pass: create PDF pages with correct total page count
      const totalPages = pages.length;

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

        // Footer with correct page numbers
        const footerY = margin / 2;
        const pageText = `Page ${i + 1} of ${totalPages}`;

        page.drawText(pageText, {
          x: pageWidth - margin - pageText.length * 5.5,
          y: footerY,
          size: 9,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });

      const file = new File([blob], "survey-report.pdf", { type: "application/pdf" });
      const formData = new FormData();
      formData.append("clientId", id);
      formData.append("generatedDoc", file);
      formData.append("reportNumber", reportDetails[0]?.activity?.journal?.journalTypeId);

      const res = await uploadSurveyReport(formData);
      if (res) {
        toast.success("Survey Report Downloaded Successfully");
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `MCBG Survey Report - ${clientData?.imoNumber}-${clientData?.shipName}-${reportDetails[0]?.activity?.journal?.journalTypeId}-${moment(currentDate).format("DD-MM-YYYY")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      contentBody.style.overflow = originalOverflow;
      contentBody.style.height = originalHeight;
      contentBody.style.maxHeight = originalMaxHeight;
    }
  };

  const getClassRangeIcon = (currentDate, rangeFrom, rangeTo) => {
    const today = moment(currentDate, "YYYY-MM-DD");
    if (!rangeFrom || !rangeTo) return "";

    const from = moment(rangeFrom, "YYYY-MM-DD");
    const to = moment(rangeTo, "YYYY-MM-DD");
    if (!from.isValid() || !to.isValid()) return "";

    if (today.isAfter(to, "day")) return "status-icon expired";

    const daysToRangeTo = to.diff(today, "days");
    if (daysToRangeTo >= 0 && daysToRangeTo < 30) return "status-icon expiring1m";
    if (today.isBetween(from, to, "day", "[]") && daysToRangeTo >= 30) return "status-icon expiring3m";
    return "";
  };

  const generateHtmlContent = useCallback(() => {
    if (!clientData || !reportDetails || !systemVariables) return "";

    const companyName = systemVariables?.data?.find((i) => i.name === "company_name")?.information || "-";
    const companyLogo = systemVariables?.data?.find((i) => i.name === "company_logo")?.information || "-";
    const stamp = systemVariables?.data?.find((i) => i.name === "company_stamp")?.information || "-";
    const issuer = reportDetails?.map((i) => i?.issuer?.name);
    const portOfSurvey = reportDetails?.map((i) => i?.place?.toLowerCase());
    const uniquePorts = [...new Set(portOfSurvey)].join(",").toUpperCase();
    const uniqueSurveyors = [...new Set(issuer)].join(",").toUpperCase();

    const classificationRows =
      classificationData?.map((row) => {
        const surveyName = formatSurveyName(row.surveyName);
        const issuanceDate = row.issuanceDate;
        const surveyDate = row.surveyDate;
        const dueDate = row.dueDate;
        const rangeTo = row.rangeTo ? moment(row.rangeTo).format("YYYY-MM-DD") : null;
        const rangeFrom = row.rangeFrom ? moment(row.rangeFrom).format("YYYY-MM-DD") : null;
        const postponedDate = row.postponed;
        const currentDate = new Date().toISOString().split("T")[0];

        return `
        <tr>
          <td>${surveyName}</td>
          <td>${getClassRangeIcon(currentDate, rangeFrom, rangeTo) ? `<span class="${getClassRangeIcon(currentDate, rangeFrom, rangeTo)}">S</span>` : ""}</td>
          <td>${surveyDate ? moment(surveyDate).format("DD/MM/YYYY") : ""}</td>
          <td>${issuanceDate ? moment(issuanceDate).format("DD/MM/YYYY") : ""}</td>
          <td>${dueDate ? moment(dueDate).format("DD/MM/YYYY") : ""}</td>
          <td>${moment(rangeFrom).isValid() && moment(rangeTo).isValid() ? `${moment(rangeFrom).format("DD/MM/YYYY")} - ${moment(rangeTo).format("DD/MM/YYYY")}` : "-"}</td>
          <td>${postponedDate ? moment(postponedDate).format("DD/MM/YYYY") : ""}</td>
        </tr>`;
      }) || [];

    const surveyRows = reportDetails
      ?.map((cert) => {
        const type = cert?.typeOfCertificate === "short_term" ? "ST" : cert?.typeOfCertificate === "full_term" ? "FT" : cert?.typeOfCertificate === "intrim" ? "IT" : cert?.typeOfCertificate === "extended" ? "ET" : cert?.typeOfCertificate || "[Type]";

        return `
          <tr>
            <td>${cert?.activity?.surveyTypes?.report?.name}</td>
            <td style="text-align: center;">${type}</td>
            <td style="text-align: center;">${cert?.endorsementDate ? moment(cert.endorsementDate).format("DD/MM/YYYY") : "-"}</td>
            <td>${cert?.activity?.surveyTypes?.name}</td>
            <td style="text-align: center;">${cert?.issuanceDate ? moment(cert.issuanceDate).format("DD/MM/YYYY") : ""}</td>
            <td style="text-align: center;">${cert?.validityDate ? moment(cert.validityDate).format("DD/MM/YYYY") : ""}</td>
          </tr>`;
      })
      .join("");

    return `
      <div class="page">
      <div class="certificate-header" >
  <div class="header-left">
    ${companyLogo ? `<img src="${companyLogo}" alt="Logo" />` : ""}
  </div>

  <div class="header-right">
    <h2 class="company-name" style="font-size: 22px !important; margin-bottom:5px;">${companyName}</h2>
    <p class="report-title" style="font-size: 24px !important;">SURVEY REPORT</p>
  </div>
</div>


        <table>
          <tr><th>Ship's Name</th><td>${clientData?.shipName || "-"}</td><th>Report No</th><td>${reportDetails[0]?.activity?.journal?.journalTypeId}</td></tr>
          <tr><th>Date of Build</th><td>${clientData?.dateOfBuild ? moment(clientData.dateOfBuild).format("DD/MM/YYYY") : "-"}</td><th>Ship Type</th><td>${clientData?.typeOfShip || "-"}</td></tr>
          <tr><th>IMO Number</th><td>${clientData?.imoNumber || "-"}</td><th>Flag</th><td>${clientData?.flag || "-"}</td></tr>
          <tr><th>First Visit</th><td>${firstVisit ? moment(firstVisit).format("DD/MM/YYYY") : "-"}</td><th>Last Visit</th><td>${lastVisit ? moment(lastVisit).format("DD/MM/YYYY") : "-"}</td></tr>
          <tr><th>No. of Visits</th><td>${numOfVisit || "-"}</td><th>Port of Survey</th><td>${uniquePorts || "-"}</td></tr>
        </table>

        <h4>Recommendation</h4>
        <p>The following surveys have been carried out on the above ship in accordance with relevant rules and statutory regulations. Items examined were found satisfactory unless otherwise noted.</p>
        <p>It is recommended that <strong>${companyName}</strong> confirms the vessel remains classed with new dates of survey as shown, subject to any existing conditions.</p>

        <h4>Surveys</h4>
        <table>
          <thead>
            <tr>
              <th>Survey Name</th>
              <th>Cert. Term</th>
              <th>Endorsed</th>
              <th>Survey Type</th>
              <th>Issued / Extended</th>
              <th>Expiry Date</th>
            </tr>
          </thead>
          <tbody>${surveyRows}</tbody>
        </table>

        <h4>Classification Surveys</h4>
        <table>
          <thead>
            <tr>
              <th>Survey Name</th>
              <th>Status</th>
              <th>Survey Date</th>
              <th>Assigned Date</th>
              <th>Due Date</th>
              <th>Range</th>
              <th>Postponed</th>
            </tr>
          </thead>
          <tbody>${classificationRows.join("")}</tbody>
        </table>

        <div class="stamp"><img src="${stamp}" width="100" height="100" alt="Stamp" /></div>

        <h4>Surveyors and Authorization</h4>
        <table>
          <tr><th>Surveyors</th><td>${uniqueSurveyors || "-"}</td><th>Reviewed On</th><td>${moment(new Date()).format("DD/MM/YYYY")}</td></tr>
          <tr><th>Port</th><td>${uniquePorts || "-"}</td><th>Date</th><td>${moment(new Date()).format("DD/MM/YYYY")}</td></tr>
        </table>

        <p style="font-size:12px; margin-top:20px;">
          <strong>Note:</strong> Cert. Term - FT = Full Term, ST = Short Term, ET = Extended, IT = Interim, PROV = Provisional
        </p>

        <div class="certificate-footer">© ${companyName} | Generated on ${moment(currentDate).format("DD-MM-YYYY")}</div>
      </div>
    `;
  }, [clientData, reportDetails, systemVariables, classificationData, firstVisit, lastVisit, numOfVisit]);

  useEffect(() => {
    if (!id) return;
    const loadAllData = async () => {
      try {
        setLoading(true);
        const [clientResult, reportResult] = await Promise.all([getSpecificClient(id), getSurveyReportDataByJournalId(id, reportNumber)]);
        if (clientResult?.status === 200) setClientData(clientResult.data.data);
        if (reportResult?.status === 200) {
          const reportData = reportResult.data.data;
          setReportDetails(reportData);

          const journalIds = reportData.map((i) => i?.activity?.journal?.id).filter(Boolean);
          const uniqueJournalId = [...new Set(journalIds)][0];
          if (uniqueJournalId) {
            setJournalId(uniqueJournalId);
            const visitResponse = await getVisitDetails("journalId", uniqueJournalId);
            const visits = visitResponse?.data?.data;
            if (visits?.length) {
              setFirstVisit(visits[0]?.date);
              setLastVisit(visits[visits.length - 1]?.date);
              setNumOfVisit(visits.length);
            }
          }
        }
      } catch (error) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, [id]);

  useEffect(() => {
    if (clientData && reportDetails && systemVariables && !loading) {
      setEditorContent(generateHtmlContent());
    }
  }, [clientData, reportDetails, systemVariables, loading, generateHtmlContent]);

  const handleEditorChange = (content) => {
    setEditorContent(content);
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
        onEditorChange={handleEditorChange}
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
              .certificate-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 3px double #003366;
    padding-bottom: 12px;
    margin-bottom: 25px;
  }

  .certificate-header .header-left img {
    width: 150px;
    height: auto;
  }

  .certificate-header .header-right {
    text-align: right;
  }

  .certificate-header .company-name {
    color: #003366;
    font-size: 22px;
    margin: 0;
    text-transform: uppercase;
  }

  .certificate-header .report-title {
    font-weight: 700;
    font-size: 16px;
    color: #000;
    margin: 2px 0 0 0;
    text-transform: uppercase;
  }
            h2 {
              color: #003366;
              font-family: 'Times New Roman', serif;
              text-align: center;
            }
            h4 { text-align: left; border-bottom: 1px solid #999; font-size:20px; color: #003366;
}
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              font-size:14px;
            }
            th, td {
              border: 1px solid #999;
              padding: 6px 8px;
            }
            th {
              background-color: #f3f3f3;
              color: #003366;
            }
            .stamp{
            margin-top:10px;
            }
            tr:nth-child(even) { background-color: #fafafa; }
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

export default SurveyReport;
