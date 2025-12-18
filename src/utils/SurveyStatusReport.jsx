import { Editor } from "@tinymce/tinymce-react";
import { useEffect, useState, useCallback } from "react";
import { fetchAdditionalDetails, getAllListClassificationSurveys, getAllSystemVariables, getMachineById, getSpecificClient, getSurveyReportData, uploadSurveyReport } from "../api";
import { toast } from "react-toastify";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import html2canvas from "html2canvas";
import moment from "moment";
import CommonButton from "@/components/CommonButton";
import { Box } from "@mui/material";
import Loader from "@/components/Loader";
import { addYears, subMonths, format } from "date-fns";
import { useRouter } from "next/navigation";

const TextEditor = ({ id }) => {
  const router = useRouter();
  const [reportDetails, setReportDetails] = useState([]);
  const [clientData, setClientData] = useState();
  const [loading, setLoading] = useState(true);
  const [editorContent, setEditorContent] = useState("");
  const [classificationData, setClassificationData] = useState([]);
  const [additionalFieldData, setAdditionalFieldData] = useState([]);
  const [statutoryData, setStatutoryData] = useState([]);
  const [auditsData, setAuditsData] = useState([]);
  const [machineList, setMachineList] = useState([]);
  const [systemVariables, setSystemVariables] = useState();
  const companyName = systemVariables?.data?.find((item) => item.name === "company_name")?.information || "-";
  const companyLogo = systemVariables?.data?.find((item) => item.name === "company_logo")?.information || "-";
  const prefix = systemVariables?.data?.find((item) => item.name === "report_no_prefix")?.information || "-";

  useEffect(() => {
    getSystemVariables();
    fetchMachineList();
  }, []);

  const fetchMachineList = async () => {
    const response = await getMachineById(id);
    setMachineList(response?.data?.data);
  };

  const getAllClassification = async () => {
    const response = await getAllListClassificationSurveys({ clientId: id });
    setClassificationData(response?.data?.data);
  };

  const getAdditionalFields = async () => {
    const response = await fetchAdditionalDetails(id);
    setAdditionalFieldData(response?.data?.data);
  };

  useEffect(() => {
    getAllClassification();
    getAdditionalFields();
  }, []);

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

  const getCurrentShipStatus = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const historyList = clientData?.classHistory;
    if (!Array.isArray(historyList) || historyList.length === 0) {
      return "";
    }

    const reversedHistory = [...historyList].reverse();

    for (const history of reversedHistory) {
      const shipStatus = history.shipStatus?.toLowerCase().trim();
      const fromDate = history.from_date ? new Date(history.from_date) : null;
      const toDate = history.to_date ? new Date(history.to_date) : null;

      if (!fromDate) continue;

      fromDate.setHours(0, 0, 0, 0);
      if (toDate) {
        toDate.setHours(0, 0, 0, 0);
      }

      const isWithinRange = !toDate
        ? today >= fromDate
        : today >= fromDate && today <= toDate;

      if (!isWithinRange) continue;

      switch (shipStatus) {
        case "class":
        case "in class":
        case "re-classed":
          return "In Operation, Class Valid";

        case "withdrawn":
          return "Withdrawn";

        case "suspended":
          return "Suspended";

        default:
          continue;
      }
    }

    return "Class";
  };

  const currentStatus = getCurrentShipStatus();

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
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        box-sizing: border-box;
        white-space: normal !important;
      }

      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        width: 100% !important;
        height: auto !important;
        font-size: 13px !important;
        line-height: 1.6 !important;
        color: #333 !important;
      }

      h1 { font-size: 28px !important; font-weight: bold !important; color: black !important; }
      h2 { font-size: 22px !important; font-weight: 600 !important; letter-spacing: 0.5px !important; }
      h4 { 
        font-size: 15px !important; 
        font-weight: 600 !important; 
        letter-spacing: 0.3px !important; 
        page-break-inside: avoid !important; 
        break-inside: avoid !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      h4 + table,
      h4 + div,
      h4 + p {
        page-break-before: avoid !important;
        break-before: avoid !important;
      }
      p, div, span { font-size: 13px !important; line-height: 1.6 !important; }
      p.subtitle { font-size: 13px !important; line-height: 1.6 !important; }

      table {
        border-collapse: collapse !important;
        page-break-inside: auto !important;
        font-size: 12px !important;
      }

      table th, table td {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        vertical-align: top !important;
        padding: 6px 8px !important;
        font-size: 12px !important;
      }

      table th { font-size: 12px !important; font-weight: 600 !important; letter-spacing: 0.5px !important; }
      table thead { display: table-header-group !important; }
      table tbody { display: table-row-group !important; }

      .owner-info { font-size: 13px !important; line-height: 1.8 !important; }
      .owner-info div { font-size: 13px !important; }
      .legend-item { font-size: 13px !important; font-weight: 500 !important; }
      .section-title { font-size: 16px !important; font-weight: 600 !important; }
      .toc-section td { font-size: 15px !important; font-weight: 600 !important; }
      strong { font-weight: 600 !important; }

      .no-break { page-break-inside: avoid !important; break-inside: avoid !important; }
      .no-break-block, .no-break-block *, .hull-row { page-break-inside: avoid !important; break-inside: avoid !important; border:none; }

      .report-title {
        background: linear-gradient(to right, #1c1720ff, #e6e9edff);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        color: white;
        padding: 20px;
        font-size: 40px !important;
        width: 90% !important;
        text-align: center !important;
        margin: 50px auto !important;
        border-radius: 8px !important;
      }

      .company-logo { margin-top: -60px !important; }

      .ship-name {
        font-size: 50px !important;
        font-weight: bold !important;
        margin-top: 20px;
        margin-bottom: 20px;
        color: #6659BF;
        border-bottom: 4px solid #6659BF !important;
        display: inline-block;
      }

      .company-name {
        font-size: 50px !important;
        font-weight: bold !important;
        color: black !important;
        letter-spacing: 0.5px !important;
        text-transform: uppercase !important;
        padding-bottom: 12px !important;
      }

      span.expired {
        color: white !important;
        background-color: #FF0000 !important;
        width: 18px !important;
        height: 18px !important;
        justify-content: center !important;
        align-items: center !important;
        font-size: 11px !important;
        display: flex !important;
        border-radius: 3px !important;
        box-shadow: 0 2px 4px rgba(220,53,69,0.3) !important;
      }

      span.expiring1m::before {
        display: block !important;
        transform: rotate(-45deg) !important;
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) rotate(-45deg) !important;
      }

      span.expiring1m {
        display: inline-block !important;
        width: 8px;
        height: 14px;
        margin-left: 8px !important;
        background-color: #ffc107 !important;
        color: white !important;
        font-size: 11px !important;
        font-weight: bold !important;
        transform: rotate(45deg) !important;
        align-items: center !important;
        display: flex !important;
        justify-content: center !important;
      }

      span.expiring1m * { transform: rotate(-45deg) !important; display: inline-block !important; }
      span.expiring3m {
        color: white !important;
        border-radius: 50% !important;
        background-color: #28a745 !important;
        width: 18px !important;
        height: 18px !important;
        display: inline-flex !important;
        justify-content: center !important;
        align-items: center !important;
        font-size: 11px !important;
        box-shadow: 0 2px 4px rgba(40,167,69,0.3) !important;
      }
      
      .page-break-new { margin-top: 640px; }
    `;
      contentDocument.head.appendChild(style);

      const diamondIcons = contentDocument.querySelectorAll("span.expiring1m");
      diamondIcons.forEach((icon) => {
        const text = icon.textContent;
        icon.innerHTML = `<span>${text}</span>`;
      });

      const tableRows = contentDocument.querySelectorAll("table tr");
      tableRows.forEach((row) => {
        row.classList.add("no-break");
        row.style.pageBreakInside = "avoid";
        row.style.breakInside = "avoid";
      });

      // Prevent page break for h4 headings
      const headings = contentDocument.querySelectorAll("h4");
      headings.forEach((heading) => {
        heading.classList.add("no-break");
        heading.style.pageBreakInside = "avoid";
        heading.style.breakInside = "avoid";
      });

      contentBody.style.overflow = "visible";
      contentBody.style.height = "auto";
      contentBody.style.maxHeight = "none";

      await document.fonts.ready;
      await new Promise((resolve) => setTimeout(resolve, 300));

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const dpiRatio = 1.3333;
      const canvasWidth = pageWidth * dpiRatio;
      const canvasHeight = contentBody.scrollHeight;

      const canvas = await html2canvas(contentBody, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        backgroundColor: "#ffffff",
        width: canvasWidth,
        height: canvasHeight,
        windowWidth: canvasWidth,
        windowHeight: canvasHeight,
      });

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const pdfDoc = await PDFDocument.create();

      const margin = 20;
      const headerHeight = 60;
      const footerHeight = 25;
      const usableWidth = pageWidth - 2 * margin;
      const usableHeight = pageHeight - 2 * margin - headerHeight - footerHeight;
      const scaleFactor = usableWidth / imgWidth;
      const baseSliceHeight = Math.floor(usableHeight / scaleFactor);

      // const getTableRowPositions = () => {
      //   const rows = contentDocument.querySelectorAll("table tr");
      //   const positions = [];
      //   rows.forEach((row) => {
      //     const rect = row.getBoundingClientRect();
      //     const bodyRect = contentBody.getBoundingClientRect();
      //     const relativeTop = rect.top - bodyRect.top + contentBody.scrollTop;
      //     const relativeBottom = relativeTop + rect.height;
      //     positions.push({
      //       top: Math.floor(relativeTop * 2),
      //       bottom: Math.floor(relativeBottom * 2),
      //       height: Math.floor(rect.height * 2),
      //     });
      //   });
      //   return positions;
      // };
      const getTableRowPositions = () => {
        const rows = contentDocument.querySelectorAll("table tr");
        const headings = contentDocument.querySelectorAll("h4");
        const positions = [];

        // Add table rows
        rows.forEach((row) => {
          const rect = row.getBoundingClientRect();
          const bodyRect = contentBody.getBoundingClientRect();
          const relativeTop = rect.top - bodyRect.top + contentBody.scrollTop;
          const relativeBottom = relativeTop + rect.height;
          positions.push({
            top: Math.floor(relativeTop * 2),
            bottom: Math.floor(relativeBottom * 2),
            height: Math.floor(rect.height * 2),
            type: 'table-row'
          });
        });

        // Add h4 headings with following element
        headings.forEach((heading) => {
          const rect = heading.getBoundingClientRect();
          const bodyRect = contentBody.getBoundingClientRect();
          const relativeTop = rect.top - bodyRect.top + contentBody.scrollTop;

          // Include next element (table/div) with heading
          const nextElement = heading.nextElementSibling;
          let combinedHeight = rect.height;
          if (nextElement) {
            const nextRect = nextElement.getBoundingClientRect();
            combinedHeight = (nextRect.bottom - rect.top);
          }

          const relativeBottom = relativeTop + combinedHeight;
          positions.push({
            top: Math.floor(relativeTop * 2),
            bottom: Math.floor(relativeBottom * 2),
            height: Math.floor(combinedHeight * 2),
            type: 'heading-block'
          });
        });

        return positions.sort((a, b) => a.top - b.top);
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
      let pageIndex = 0;

      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

      // Main page generation loop
      while (currentY < imgHeight) {
        const maxSliceHeight = Math.min(baseSliceHeight, imgHeight - currentY);
        const sliceHeight = getOptimalSliceHeight(currentY, maxSliceHeight);

        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = imgWidth;
        sliceCanvas.height = sliceHeight;

        const ctx = sliceCanvas.getContext("2d");
        ctx.drawImage(canvas, 0, currentY, imgWidth, sliceHeight, 0, 0, imgWidth, sliceHeight);

        const pngUrl = sliceCanvas.toDataURL("image/png");
        const pngImage = await pdfDoc.embedPng(pngUrl);
        const scaledHeight = sliceHeight * scaleFactor;

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        if (pageIndex > 0) {
          const headerStartY = pageHeight - 8;
          const headerRectHeight = 55;
          page.drawRectangle({
            x: margin,
            y: headerStartY - headerRectHeight,
            width: usableWidth,
            height: headerRectHeight,
            color: rgb(0.6, 0.6, 0.6)
          });

          page.drawText("Survey Status Report", {
            x: pageWidth / 2 - 70,
            y: headerStartY - 20,
            size: 13,
            color: rgb(1, 1, 1),
            font: fontBold,
          });

          const leftColumnX = margin + 8;
          const colonX = margin + 45;
          const valueX = margin + 55;
          const nameY = headerStartY - 35;
          const statusY = headerStartY - 47;

          page.drawText("Name", { x: leftColumnX, y: nameY, size: 9, color: rgb(1, 1, 1), font: fontRegular });
          page.drawText(":", { x: colonX, y: nameY, size: 9, color: rgb(1, 1, 1), font: fontRegular });
          page.drawText(`${clientData?.shipName || "N/A"}`, { x: valueX, y: nameY, size: 9, color: rgb(0.9, 0.9, 0.9), font: fontBold });

          page.drawText("Status", { x: leftColumnX, y: statusY, size: 9, color: rgb(1, 1, 1), font: fontRegular });
          page.drawText(":", { x: colonX, y: statusY, size: 9, color: rgb(1, 1, 1), font: fontRegular });
          page.drawText(currentStatus, { x: valueX, y: statusY, size: 9, color: rgb(0.9, 0.9, 0.9), font: fontBold });

          const rightLabelX = pageWidth - margin - 120;
          const rightColonX = pageWidth - margin - 65;
          const rightValueX = pageWidth - margin - 55;

          page.drawText("IMO Number", { x: rightLabelX, y: statusY, size: 9, color: rgb(1, 1, 1), font: fontRegular });
          page.drawText(":", { x: rightColonX, y: statusY, size: 9, color: rgb(1, 1, 1), font: fontRegular });
          page.drawText(`${clientData?.imoNumber || "N/A"}`, { x: rightValueX, y: statusY, size: 9, color: rgb(0.9, 0.9, 0.9), font: fontBold });
        }

        const contentStartY = pageHeight - headerHeight - margin - 5;
        page.drawImage(pngImage, { x: margin, y: contentStartY - scaledHeight, width: usableWidth, height: scaledHeight });

        if (pageIndex > 0) {
          page.drawRectangle({ x: margin, y: 0, width: usableWidth, height: footerHeight + 8, color: rgb(0.6, 0.6, 0.6) });
          const footerStartY = footerHeight - 5;
          const generatedText = ` Generated on: ${moment().format("DD MMM YYYY")}`;
          const totalPages = Math.ceil(imgHeight / baseSliceHeight);
          const pageText = `Page ${pageIndex + 1} of ${totalPages}`;

          page.drawText(generatedText, { x: margin + 7, y: footerStartY, size: 8, color: rgb(0.2, 0.2, 0.2), font: fontRegular });
          const pageTextWidth = pageText.length * 4.5;
          page.drawText(pageText, { x: pageWidth - margin - pageTextWidth, y: footerStartY, size: 8, color: rgb(0.2, 0.2, 0.2), font: fontRegular });
        }

        currentY += sliceHeight;
        pageIndex++;
      }

      if (pageIndex > 1) {
        const lastPage = pdfDoc.getPage(pageIndex - 1);

        const disclaimerTitle = "Disclaimer :-";
        const disclaimerText =
          `Information provided in ship survey status by ${prefix} Class is solely provided for the convenience of Owners or Managers as a guide to their ship's survey status and in no way substitute for advice from ${prefix} Class. Neither ${prefix} Class, nor any of its employees, assures any responsibility for the accuracy or legal liability for any loss or damage that may be sustained as a result of using their services.`;

        const textX = 50;
        const footerGap = 60;
        let textY = footerHeight + footerGap;

        // Title
        lastPage.drawText(disclaimerTitle, {
          x: textX,
          y: textY + 14,
          size: 10,
          color: rgb(0.15, 0.15, 0.15),
          font: fontBold,
        });

        // Word wrapping for disclaimer paragraph
        const maxWidth = 480;
        const words = disclaimerText.split(" ");
        let line = "";
        let lineHeight = 10;

        for (const word of words) {
          const testLine = line + word + " ";
          const lineWidth = fontRegular.widthOfTextAtSize(testLine, 9);

          if (lineWidth > maxWidth) {
            lastPage.drawText(line.trim(), {
              x: textX + 10,
              y: textY,
              size: 9,
              color: rgb(0.5, 0.5, 0.5),
              font: italic,
              fontWeight: 100,
            });
            line = word + " ";
            textY -= lineHeight;
          } else {
            line = testLine;
          }
        }

        if (line.trim().length > 0) {
          lastPage.drawText(line.trim(), {
            x: textX + 10,
            y: textY,
            size: 9,
            color: rgb(0.5, 0.5, 0.5),
            font: italic,
            fontWeight: 100,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });

      const fileName = `${prefix} Survey Status-${clientData?.shipName}.pdf`;
      const file = new File([blob], fileName, { type: "application/pdf" });

      const formData = new FormData();
      formData.append("clientId", id);
      formData.append("generatedDoc", file);
      formData.append("type", "survey-status");

      const res = await uploadSurveyReport(formData);
      if (res) {
        toast.success("Survey Status Report Downloaded Successfully");
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
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

  const getClassName = (dueDate, today) => {
    if (!dueDate) return "";

    const due = moment(dueDate);
    if (!due.isValid()) {
      console.warn("Invalid date provided to getClassName:", dueDate);
      return "status-icon expiring3m";
    }

    const daysDiff = due.diff(moment(today, "YYYY-MM-DD"), "days");
    if (daysDiff < 0) {
      return "status-icon expired";
    }
    if (daysDiff <= 30) {
      return "status-icon expiring1m";
    }
    if (daysDiff <= 90) {
      return "status-icon expiring3m";
    }

    return "";
  };

  const getClassRangeIcon = (currentDate, rangeFrom, rangeTo) => {
    const today = moment(currentDate, "YYYY-MM-DD");

    if (!rangeFrom || !rangeTo) {
      return "";
    }

    const from = moment(rangeFrom, "YYYY-MM-DD");
    const to = moment(rangeTo, "YYYY-MM-DD");

    if (!from.isValid() || !to.isValid()) {
      return "";
    }

    if (today.isAfter(to, "day")) {
      return "status-icon expired";
    }

    const daysToRangeTo = to.diff(today, "days");
    if (daysToRangeTo >= 0 && daysToRangeTo < 30) {
      return "status-icon expiring1m";
    }

    if (today.isBetween(from, to, "day", "[]") && daysToRangeTo >= 30) {
      return "status-icon expiring3m";
    }

    return "";
  };

  const calculateDates = (issuanceDate) => {
    if (!issuanceDate) return { dueDate: "", rangeFrom: "", rangeTo: "" };

    const issuanceDateObj = new Date(issuanceDate);
    const dueDateObj = addYears(issuanceDateObj, 5);
    const rangeFromObj = subMonths(dueDateObj, 3);
    const rangeToPlus3 = addYears(subMonths(issuanceDateObj, -3), 5);

    return {
      dueDate: format(dueDateObj, "yyyy-MM-dd"),
      rangeFrom: format(rangeFromObj, "yyyy-MM-dd"),
      rangeTo: format(rangeToPlus3, "yyyy-MM-dd"),
    };
  };

  const populateSurveyRows = (surveyDataList) => {
    if (!surveyDataList || surveyDataList.length === 0)
      return { statutory: [], audits: [] };

    const result = { statutory: [], audits: [] };

    // 1) Filter generated & non-revoked & valid report
    const validSurveys = surveyDataList.filter((s) =>
      s.activity?.surveyTypes?.report &&
      s.reportStatus !== "revoked"
    );

    const surveyMap = new Map();

    // Helper: Extract latest endorsement/issuance date inside survey.data
    const extractLatestInnerIssuanceDate = (survey) => {
      if (!survey?.data) return null;

      const keys = Object.keys(survey.data).filter(
        (k) =>
          k.toLowerCase().startsWith("issuance_date_") ||
          k.toLowerCase().startsWith("endorsement_date_")
      );

      if (!keys.length) return null;

      const dateValues = keys
        .map((k) => survey.data[k])
        .map((v) => {
          if (typeof v !== "string") return null;

          // convert DD/MM/YYYY → YYYY-MM-DD
          if (v.includes("/") && !v.includes("-")) {
            const [d, m, y] = v.split("/");
            return `${y}-${m}-${d}`;
          }
          return v;
        })
        .filter((v) => v && !isNaN(new Date(v).getTime()));

      if (!dateValues.length) return null;

      dateValues.sort((a, b) => new Date(b) - new Date(a));

      return dateValues[0];
    };

    validSurveys.forEach((survey) => {
      const certificateName = survey.activity.surveyTypes.report.name;
      const isStatutory = survey.activity.surveyTypes.statutorySurvey === true;
      const isAudit = survey.activity.surveyTypes.audit === true;

      const groupKey = `${certificateName}_${isStatutory ? "statutory" : "audit"}`;

      // Get fallback surveyDate from the certificate
      const certSurveyDate = survey.surveyDate
        ? new Date(survey.surveyDate)
        : null;

      // Get latest endorsement/issuance date
      const latestInnerDateString = extractLatestInnerIssuanceDate(survey);
      const latestInnerDate = latestInnerDateString
        ? new Date(latestInnerDateString)
        : null;

      const finalSurveyDate = latestInnerDate || certSurveyDate;

      const latestDue = survey.dueDate || "";
      const latestRangeFrom = survey.rangeFrom || "";
      const latestRangeTo = survey.rangeTo || "";

      const newRow = {
        surveyName: certificateName,
        surveyDate: finalSurveyDate ? format(finalSurveyDate, "yyyy-MM-dd") : "",
        dueDate: latestDue ? format(new Date(latestDue), "yyyy-MM-dd") : "",
        rangeFrom: latestRangeFrom
          ? format(new Date(latestRangeFrom), "yyyy-MM-dd")
          : "",
        rangeTo: latestRangeTo
          ? format(new Date(latestRangeTo), "yyyy-MM-dd")
          : "",
        postponedDate: survey.postponedDate || "",
        typeOfCertificate: survey.typeOfCertificate || "",
      };

      if (!surveyMap.has(groupKey)) {
        surveyMap.set(groupKey, {
          row: newRow,
          isStatutory,
          isAudit,
          compareDate: finalSurveyDate,
        });
        return;
      }

      // Check if new one is more recent
      const existing = surveyMap.get(groupKey);
      const existingDate = existing.compareDate;

      if (finalSurveyDate && (!existingDate || finalSurveyDate > existingDate)) {
        surveyMap.set(groupKey, {
          row: newRow,
          isStatutory,
          isAudit,
          compareDate: finalSurveyDate,
        });
      }
    });

    // Convert map → final output
    surveyMap.forEach(({ row, isStatutory, isAudit }) => {
      if (isStatutory) result.statutory.push(row);
      else if (isAudit) result.audits.push(row);
    });

    return result;
  };


  useEffect(() => {
    const surveyData = populateSurveyRows(reportDetails);
    setStatutoryData(surveyData.statutory);
    setAuditsData(surveyData.audits);
  }, [reportDetails]);

  const updateStatusIcons = (editor) => {
    const editorDoc = editor.getDoc();
    const currentToday = moment();

    const parseDate = (dateStr) => {
      if (!dateStr) return null;

      const cleanDateStr = dateStr.trim();

      const formats = ["DD/MM/YYYY", "MM/DD/YYYY", "DD-MM-YYYY", "DD/MM/YY"];
      let parsedDate = null;

      for (const format of formats) {
        parsedDate = moment(cleanDateStr, format, true);
        if (parsedDate.isValid()) {
          return "status-icon expiring3m";
        }
      }

      return parsedDate && parsedDate.isValid() ? parsedDate : null;
    };

    const getStatusClass = (dateStr) => {
      const date = parseDate(dateStr);
      if (!date) return "status-icon expiring3m";

      const daysDiff = moment.isMoment(date) ? date.diff(currentToday, "days") : 0;

      if (daysDiff < 0) {
        return "status-icon expired";
      }
      if (daysDiff <= 30) {
        return "status-icon expiring1m";
      }
      if (daysDiff <= 90) {
        return "status-icon expiring3m";
      }
      return "status-icon expiring3m";
    };

    const getDynamicStatusText = (dateStr) => {
      const date = parseDate(dateStr);
      if (!date) return "";

      const daysDiff = moment.isMoment(date) ? date.diff(currentToday, "days") : 0;

      if (daysDiff < 0) {
        return "";
      }
      if (daysDiff <= 30) {
        return "";
      }
      if (daysDiff <= 90) {
        return "";
      }
      return "";
    };

    const certificateTables = editorDoc.querySelectorAll("table");
    certificateTables.forEach((table) => {
      const rows = table.querySelectorAll("tbody tr");
      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 4) {
          const iconCell = cells[1];
          const expiryCell = cells[3];
          const statusCell = cells[cells.length - 1];

          const iconSpan = iconCell.querySelector("span.status-icon");
          if (iconSpan && iconSpan.textContent === "C") {
            const expiryText = expiryCell.textContent.trim();
            const newClass = getStatusClass(expiryText);
            const newStatus = getDynamicStatusText(expiryText);

            iconSpan.className = newClass;

            if (statusCell) {
              statusCell.textContent = newStatus;
            }
          }
        }
      });
    });

    certificateTables.forEach((table) => {
      const rows = table.querySelectorAll("tr");
      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 7) {
          const lastCell = cells[1];
          const dueDateCell = cells[4];
          const statusCell = cells[6];

          const iconSpan = lastCell.querySelector("span.status-icon");
          if (iconSpan && iconSpan.textContent === "S") {
            const dueDateText = dueDateCell.textContent.trim();
            const newClass = getStatusClass(dueDateText);
            const newStatus = getDynamicStatusText(dueDateText);

            iconSpan.className = newClass;

            if (statusCell) {
              statusCell.textContent = newStatus;
            }
          }
        }
      });
    });
  };

  const getSectionTitle = (key) => {
    switch (key) {
      case "coc":
        return "Condition of Class";
      case "statutory":
        return "Statutory Condition";
      case "memoranda":
        return "Memoranda";
      case "additional":
        return "Additional Information";
      case "compliance":
        return "Compliance to New Regulations";
      case "pcsFsi":
        return "PSC/FSI Deficiency";
      default:
        return key.toUpperCase();
    }
  };
  function mergeClassificationSurveys(classificationData, reportDetailsList) {
    const combined = [];

    if (classificationData?.length) {
      classificationData.forEach((row) => {
        combined.push({
          name: row.surveyName,
          type: "classification",
          surveyDate: row.surveyDate,
          dueDate: row.dueDate,
          rangeFrom: row.rangeFrom,
          rangeTo: row.rangeTo,
          postponed: row.postponed,
          source: "classificationData",
        });
      });
    }

    if (reportDetailsList?.length) {
      reportDetailsList.forEach((r) => {
        const surveyType = r?.activity?.surveyTypes;
        const isClassification = surveyType?.classificationSurvey === true;

        if (isClassification) {
          combined.push({
            name: surveyType.name,
            type: "classification",
            surveyDate: r.surveyDate,
            dueDate: r.dueDate,
            rangeFrom: r.rangeFrom,
            rangeTo: r.rangeTo,
            postponed: r.postponed,
            source: "reportDetails",
          });
        }
      });
    }

    const latestByName = combined.reduce((acc, curr) => {
      const existing = acc[curr.name];
      if (!existing) {
        acc[curr.name] = curr;
      } else {
        const existingDate = new Date(existing.surveyDate);
        const currentDate = new Date(curr.surveyDate);

        if (currentDate > existingDate) {
          acc[curr.name] = curr;
        }
      }
      return acc;
    }, {});

    return Object.values(latestByName).sort((a, b) => new Date(b.surveyDate) - new Date(a.surveyDate));
  }

  const finalClassificationData = mergeClassificationSurveys(classificationData, reportDetails);

  const classificationRows =
    finalClassificationData.length > 0
      ? finalClassificationData
        .map((row) => {
          const rangeFrom = row.rangeFrom ? moment(row.rangeFrom).format("DD/MM/YYYY") : "";
          const rangeTo = row.rangeTo ? moment(row.rangeTo).format("DD/MM/YYYY") : "";
          const dueDate = row.dueDate ? moment(row.dueDate).format("DD/MM/YYYY") : "-";
          const surveyDate = row.surveyDate ? moment(row.surveyDate).format("DD/MM/YYYY") : "-";
          const postponed = row.postponed ? moment(row.postponed).format("DD/MM/YYYY") : "-";
          return `
<tr>
<td>${row.name}</td>
<td>${surveyDate}</td>
<td>${dueDate}</td>
<td>${rangeFrom} - ${rangeTo}</td>
<td>${postponed}</td>
</tr>
`;
        })
        .join("")
      : `<tr><td colspan="5">No classification surveys available</td></tr>`;

  const classificationSurveyTableHtml = `
<p class="section-title" style="font-size: 16px; font-weight: bold;">Classification Surveys</p>
<table class="">
<tr>
<th>Survey Name</th>
<th>Survey Date</th>
<th>Due Date</th>
<th>Range (From - To)</th>
<th>Postponed</th>
</tr>
${classificationRows}
</table>
`;


  const sectionOrder = ["coc", "statutory", "memoranda", "additional", "compliance", "pcsFsi"];

  const additionalFieldsHtml = sectionOrder
    ?.map((key) => {
      const title = getSectionTitle(key);
      const section = additionalFieldData?.find((s) => s.sectionKey === key) || {};

      if (!section?.data || section?.data?.length === 0) {
        return `
        <h4 class="no-break" style="
          margin-top: 20px;
          color: white;
          padding: 8px;
          border-radius: 4px;
          background: linear-gradient(to right, #211d24ff, #dadee2ff);
        ">
          ${title}
        </h4>
        <p style="margin: 10px 0; font-style: italic; color: #555;">
          No ${title} recommended
        </p>
      `;
      }

      const filteredData = section?.data?.filter((item) => item.action !== "Deleted");

      if (filteredData?.length === 0) {
        return `
        <h4 class="no-break" style="
          margin-top: 20px;
          color: white;
          padding: 8px;
          border-radius: 4px;
          background: linear-gradient(to right,  #1c1720ff, #e6e9edff);
        ">
          ${title}
        </h4>
        <p style="margin: 10px 0; font-style: italic; color: #555;">
          No ${title} recommended
        </p>
      `;
      }

      const rows = filteredData
        .map(
          (item) => `
          <tr>
            <td>${item.type || "-"}</td>
            <td>${item.code || "-"}</td>
            <td>${item.journalTypeId || "-"}</td>
            <td>${item.dueDate !== null && moment(item.dueDate).format("DD/MM/YYYY") || "-"}</td>
          </tr>
          ${item.description
              ? `<tr>
                  <td colspan="4" style="
                    padding: 6px 8px;
                    font-size: 0.9rem;
                    color: #333;
                    border-bottom: 2px solid blue;
                  ">
                    ${item.description}
                  </td>
                </tr>`
              : ""
            }
        `
        )
        .join("");

      return `
      <h4 style="
        margin-top: 20px;
        color: white;
        padding: 8px;
        border-radius: 4px;
        background: linear-gradient(to right,  #1c1720ff, #e6e9edff);
      " class="no-break">
        ${title}
      </h4>
      <table style="width:100%; border-collapse: collapse; margin-bottom: 10px;">
        <thead>
          <tr style="background-color:#f2f2f2;">
            <th>Type</th>
            <th>Code</th>
            <th>Reference No.</th>
            <th>Due Date</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
    })
    .join("");


  const rows = Object.values(machineList?.machineData || {})
    .flatMap(section => {
      const sectionName = section?.sectionName || '';
      const items = section?.items || [];

      // Add section name as first row, then all items
      return [
        { isSectionHeader: true, sectionName },
        ...items
      ];
    });

  const machineListHtml = `
<table style="width:100%; border-collapse:collapse; font-size:14px;">
  <thead>
    <tr style="background-color:#f2f2f2; text-align:left;">
      <th style="padding:6px;">Code</th>
      <th style="padding:6px;">Status</th>
      <th style="padding:6px;">Postponed Date</th>
      <th style="padding:6px;">Cycle</th>
      <th style="padding:6px;">Assignment Date</th>
      <th style="padding:6px;">Next Due Date</th>
      <th style="padding:6px;">Description</th>
    </tr>
  </thead>
  <tbody>
    ${rows
      .map((item) => {
        if (item.isSectionHeader) {
          return `
            <tr>
              <td colspan="7" style="padding:8px; background-color:#e8f4f8; font-weight:bold; font-size:15px;">
                ${item.sectionName}
              </td>
            </tr>`;
        }

        return `
          <tr>
            <td style="padding:6px;">${item.generatedCode || "-"}</td>
<td style="padding:6px;">
  ${item.status !== undefined
            ? item?.status === "credited"
              ? "Credited"
              : item?.status === "waived off"
                ? "Waived Off"
                : item?.status === "postponed"
                  ? "Postponed"
                  : "-"
            : "-"
          }
</td>
            <td style="padding:6px;">${item.postponedDate ? moment(item.postponedDate).format("DD/MM/YYYY") : "-"}</td>
            <td style="padding:6px;">5</td>
            <td style="padding:6px;">${item.assignmentDate ? moment(item.assignmentDate).format("DD/MM/YYYY") : "-"}</td>
            <td style="padding:6px;">${item.dueDate ? moment(item.dueDate).format("DD/MM/YYYY") : "-"}</td>
            <td style="padding:6px;">${item.content || "-"}</td>
          </tr>`;
      })
      .join("")}
  </tbody>
</table>
`;

  // Final HTML
  const finalHtml = `
    <div>
      <div class="legend">
        <span class="legend-item"><span class="status-icon expired">C</span>Expired</span>
        <span class="legend-item"><span class="status-icon expiring1m">C</span>Expires in less than 1 month</span>
        <span class="legend-item"><span class="status-icon expiring3m">C</span>Expires in less than 3 months</span>
      </div>
    </div>

    ${additionalFieldsHtml}
    ${machineListHtml}
  `;

  const calculateDueDate = (cert) => {
    if (cert?.activity?.surveyTypes?.report?.name === "full_term") {
      return moment(cert.surveyDate).add(5, "years");
    }
    if (cert?.activity?.surveyTypes?.report?.name === "short_term") {
      return moment(cert.surveyDate).add(3, "months");
    }
    if (cert?.activity?.surveyTypes?.report?.name === "interim") {
      return moment(cert.surveyDate).add(6, "months");
    }
    return null;
  };


  const generateHtmlContent = useCallback(() => {

    const validReportDetails = reportDetails?.filter(
      (cert) => cert?.reportStatus !== "revoked"
    );
    const certificateOfClassRow = validReportDetails
      ?.filter((cert) => cert?.activity?.surveyTypes?.report?.name?.toLowerCase() === "certificate of class")
      ?.sort((a, b) => new Date(b.issuanceDate || b.validityDate) - new Date(a.issuanceDate || a.validityDate))?.[0];
    const otherCertificatesRaw = validReportDetails?.filter(
      (cert) =>
        cert?.activity?.surveyTypes?.report?.name &&
        cert?.activity?.surveyTypes?.report?.name?.toLowerCase() !== "certificate of class"
    );

    const uniqueCertificatesMap = new Map();

    otherCertificatesRaw?.forEach((cert) => {
      const name = cert.activity.surveyTypes.report.name?.toLowerCase();
      const existing = uniqueCertificatesMap.get(name);

      const existingDue = existing ? calculateDueDate(existing) : null;
      const currentSurvey = moment(cert.surveyDate);

      if (!existing) {
        uniqueCertificatesMap.set(name, cert);
      } else {
        if (existingDue && currentSurvey.isAfter(existingDue)) {
          uniqueCertificatesMap.set(name, cert);
        }
        else if (currentSurvey.isBefore(existing.surveyDate)) {
          uniqueCertificatesMap.set(name, cert);
        }
      }

    });


    const otherCertificates = Array.from(uniqueCertificatesMap.values());

    const formatCertificateRow = (cert) => {
      if (!cert?.activity?.surveyTypes?.report?.name) return "";

      const fullCert = cert;
      const reportName = fullCert.activity.surveyTypes.report.name;
      const typeLabel = fullCert.activity.surveyTypes.name || "";

      const surveyDate = fullCert.surveyDate;
      const surveyDateFormatted = surveyDate
        ? moment(surveyDate).format("DD/MM/YYYY")
        : "";

      const expiry = fullCert.validityDate;
      const expiryFormatted = expiry ? moment(expiry).format("YYYY-MM-DD") : null;

      const type =
        fullCert.typeOfCertificate === "short_term" ? "ST" :
          fullCert.typeOfCertificate === "full_term" ? "FT" :
            fullCert.typeOfCertificate === "intrim" ? "IT" :
              fullCert.typeOfCertificate === "extended" ? "ET" :
                fullCert.typeOfCertificate || "-";

      const currentDate = new Date().toISOString().split("T")[0];
      const status = "";


      return `
<tr>
  <td>${reportName}</td>
  <td>${getClassName(expiryFormatted, currentDate) ? `<span style="align-content: center; text-align: center;" class="${getClassName(expiryFormatted, currentDate)}">c</span>` : ""}</td>
  <td>${surveyDateFormatted}</td>
  <td>${expiry ? moment(expiry).format("DD/MM/YYYY") : ""}</td>
  <td></td>
  <td>${type}</td>
  <td>${status}</td>
</tr>`;
    };

    const certificateRows = [
      certificateOfClassRow ? formatCertificateRow(certificateOfClassRow) : "",
      ...otherCertificates.map(formatCertificateRow),
    ]
      .filter((row) => row && row.trim() !== "")
      .join("");

    const certificatesTableHtml = `
<h4 class="no-break" style="margin-top: -10px; color:white; background: linear-gradient(to right, #1c1720ff, #e6e9edff);">
  Certificates
</h4>
<table>
  <thead>
    <tr>
      <th>Certificate Name</th>
      <th></th>
      <th>Issued</th>
      <th>Expiry</th>
      <th>Extended</th>
      <th>Type</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    ${certificateRows || `<tr><td colspan="7">No valid certificates available</td></tr>`}
  </tbody>
</table>
<div class="legend">
  <span class="legend-item"><span class="status-icon expired">C</span>Expired</span>
  <span class="legend-item"><span class="status-icon expiring1m">C</span>Expires in less than 1 month</span>
  <span class="legend-item"><span class="status-icon expiring3m">C</span>Expires in less than 3 months</span>
</div>
`;

    const filterLatestBySurveyType = (data) => {
      if (!Array.isArray(data)) return [];

      const map = {};

      data.forEach((row) => {
        const type = (
          row.surveyTypeName ||
          row.surveyName ||
          row.activity?.surveyTypes?.name ||
          ""
        ).trim().toLowerCase();
        const date = row.assignmentDate ? new Date(row.assignmentDate) : null;

        if (!type) return;

        if (!map[type]) {
          map[type] = row;
        } else {
          const existingDate = map[type].assignmentDate ? new Date(map[type].assignmentDate) : null;
          if (date && (!existingDate || date > existingDate)) {
            map[type] = row;
          }
        }
      });

      return Object.values(map);
    };

    const buildSurveyTable = (data, title) => {
      const message = title?.toLowerCase().includes("audits")
        ? "No audits data found"
        : "No statutory data found";
      const excluded = [
        "certificate of class",
        "register of lifting appliances and cargo handling gear",
        "confirmation of compliance - seemp - part ii",
        "confirmation of compliance - seemp - part iii",
        "engine international air pollution prevention statement of compliance"
      ];

      const getLatestEndorsementDate = (row) => {
        const dateKeys = Object.keys(row).filter(
          (k) =>
            k.toLowerCase().startsWith("issuance_date_") ||
            k.toLowerCase().startsWith("endorsement_date_")
        );

        const dates = dateKeys
          .map((key) => row[key])
          .filter((d) => d)
          .sort((a, b) => new Date(b) - new Date(a));

        return dates.length ? dates[0] : row.surveyDate;
      };


      const getSurveyDisplayName = (row) => {
        const certName = row.surveyName || "-";
        const typeNameRaw = (row.surveyTypeName || "").trim();
        const lower = typeNameRaw.toLowerCase();

        const mappings = [
          ["intermediate", "Intermediate Survey"],
          ["annual", "Annual Survey"],
          ["periodical", "Periodical Survey"],
          ["renewal", "Renewal Survey"],
          ["general examination", "General Examination Survey"],
          ["change of flag", "Change of Flag Survey"],
          ["initial", "Initial Survey"],
          ["additional", "Additional Survey"],
        ];

        let typeLabel = "";
        for (const [key, label] of mappings) {
          if (lower.includes(key)) { typeLabel = label; break; }
        }

        if (!typeLabel && typeNameRaw) {
          const toTitle = (s) =>
            s.replace(/\s+/g, " ")
              .trim()
              .toLowerCase()
              .replace(/\b\w/g, (c) => c.toUpperCase());

          const cleaned = typeNameRaw
            .replace(/^iopp\s*/i, "")
            .replace(/\s*survey\s*$/i, "")
            .trim();

          typeLabel = cleaned ? `${toTitle(cleaned)}` : "";
        }

        return certName;
      };

      const rows = data
        .filter(
          (row) =>
            !excluded.includes((row.surveyName || "").trim().toLowerCase())
        )
        .map((row) => {
          const surveyDate = getLatestEndorsementDate(row);
          const currentDate = new Date().toISOString().split("T")[0];
          const dueDate = row.dueDate;
          const rangeFrom = row.rangeFrom;
          const rangeTo = row.rangeTo;


          return `
      <tr>
        <td>${getSurveyDisplayName(row)}</td>
        <td>${getClassRangeIcon(currentDate, rangeFrom, rangeTo)
              ? `<span class="${getClassRangeIcon(currentDate, rangeFrom, rangeTo)}">S</span>`
              : ""
            }</td>
        <td>${surveyDate ? moment(surveyDate).format("DD/MM/YYYY") : ""}</td>
        <td>${dueDate
              ? moment(dueDate).format("DD/MM/YYYY")
              : ""
            }</td>
        <td>${rangeFrom && rangeTo
              ? `${rangeFrom ? moment(rangeFrom).format("DD/MM/YYYY") : ""} - ${rangeTo ? moment(rangeTo).format("DD/MM/YYYY") : ""}`
              : ""
            }</td>
        <td>${row.postponedDate || ""}</td>
      </tr>`;
        })
        .join("");

      return `
  <div class="section-title" style="margin-top: 20px; font-size: 16px; font-weight: bold;">${title}</div>
  <table>
    <tr>
      <th>Survey Name</th>
      <th></th>
      <th>Survey Date</th>
      <th>Due Date</th>
      <th>Range (from, to)</th>
      <th>Postponed</th>
      
    </tr>
    ${rows.length === 0 ? `<tr><td colspan="6">${message}</td></tr>` : ""}
    ${rows}
  </table>
  `;
    };

    const statutoryFiltered = filterLatestBySurveyType(statutoryData);
    const auditsFiltered = filterLatestBySurveyType(auditsData);

    const statutorySurveyTableHtml = buildSurveyTable(statutoryFiltered, "Statutory Surveys");
    const auditSurveyTableHtml = buildSurveyTable(auditsFiltered, "Audits / Inspections");

    const htmlString = `
<div class="page">
${certificatesTableHtml}

<h2 style="margin-top: 40px; color:black">Surveys/ Audits/ Inspections Status</h2>
<p class="subtitle">
The Conditions of Class / Statutory Status below shows the information available at the time the report is printed.
This may not indicate certificates issued, surveys carried out or conditions of class / recommendations issued but not yet reported to ${prefix} Head Office.
</p>

`;

    return `
<div style="text-align: center; background-color: white; color: black; padding: 60px;">
<div style="text-align: center;background-color: white; color: black;">
  <div style="
    display: flex;
    justify-content: center;
    align-items:center;
    gap: 30px;
  " class="company-logo">
    <img 
      src=${companyLogo}  
      alt="companyLogo" 
      height="235" 
      width="240" 
      style="margin-bottom: 0px; object-fit: contain;"
    />
    <h1 
      style="
        font-size: 50px;
        color: black; 
        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        margin: 0;"
        class="company-name"
          >
      ${companyName}
    </h1>
  </div>
 <div class="report-title">
  Ship Survey Status Report
</div>

  <div class="ship-title ship-name" style="color: #6659BF">
  ${clientData?.shipName || "-"}
</div>

</div>



<div style="
  text-align: left;
  display: inline-block;
  font-size: 16px;
  padding: 18px 28px;
  color: black;
 border: 2px solid #6659BF;
  border-radius: 10px;
  width: 450px;
  margin-top: 30px;
  line-height: 1.8;
">
  <p><strong style="font-size:18px;">Reg. Owner:</strong><span style="font-size:18px; fontWeight: 700; margin-left: 70px; color:black">${clientData?.ownerDetails?.companyName || "-"}</span></p>
  <p><strong style="font-size:18px;">Class Id:</strong><span style="font-size:18px; fontWeight: 700; margin-left: 105px; color:black">${clientData?.classId || "-"}</span></p>
  <p><strong style="font-size:18px;">IMO Number:</strong><span style="font-size:18px; fontWeight: 700; margin-left: 60px; color:black">${clientData?.imoNumber || "-"}</span></p>
  <p><strong style="font-size:18px;">Vessel Type:</strong><span style="font-size:18px; fontWeight: 700; margin-left: 74px; color:black">${clientData?.typeOfShip || "-"}</span></p>
  <p><strong style="font-size:18px;">Gross Tonnage:</strong><span style="font-size:18px; fontWeight: 700; margin-left: 48px; color:black">${clientData?.grossTonnage || "-"}</span></p>
  <p><strong style="font-size:18px;">Date of build:</strong><span style="font-size:18px; fontWeight: 700; margin-left: 63px; color:black">${clientData?.dateOfBuild ? moment(clientData?.dateOfBuild).format("DD/MM/YYYY") : "-"}</span></p>
</div>

</div>

<div style="text-align: center; margin-top:30px;align-items: center;" class="page">
<h2 style="color:black">Table of Contents</h2>
<div class="toc-container index-page">
<table style="width: 100%;">
<tr class="toc-section">
<td><strong>1. Ship Particulars</strong></td>
</tr>
<tr class="toc-section">
<td><strong>2. Owner/Manager Information</strong></td>
</tr>
<tr class="toc-section">
<td><strong>3. Surveys / Audits / Inspections Status </strong></td>
</tr>
<tr class="toc-section">
<td><strong>4. Additional Notes</strong></td>
</tr>

</table>
</div>
</div>

<div class="page page-break-new">
<h2 style="color:black;">Ship Particulars</h2>
<table class="classification-section-table" style="width: 100%; border-collapse: collapse;">
<thead>
<tr>
<th colspan="4" style="text-align: left;padding: 8px;">
<h4 class="no-break" style="color:white;padding: 8px;margin-top:-10px;background: linear-gradient(to right, #1c1720ff, #e6e9edff); width:100%; margin-bottom: 5px;">Identification</h4>
</th>
</tr>
</thead>
<tbody>
<tr>
<td><em><strong>Ship Type:</strong></em></td>
<td>${clientData?.typeOfShip || "-"}</td>
<td><em><strong>Flag:</strong></em></td>
<td>${clientData?.flag || "-"}</td>
</tr>
<tr>
<td><em><strong>IMO Number:</strong></em></td>
<td>${clientData?.imoNumber || "-"}</td>
<td><em><strong>Port of Registry:</strong></em></td>
<td>${clientData?.portOfRegistry || "-"}</td>
</tr>
<tr>
<td><em><strong>Call Sign:</strong></em></td>
<td>${clientData?.callSign || "-"}</td>
<td><em><strong>Official Number:</strong></em></td>
<td>${clientData?.officialNo || "-"}</td>
</tr>
</tbody>
</table>

<table class="classification-section-table" style="width: 100%; border-collapse: collapse;">
  <thead>
    <tr>
      <th style="text-align: left; padding: 8px;" colspan="2">
        <h4 class="no-break" style="color:white; background: linear-gradient(to right,  #1c1720ff, #e6e9edff);">Classification</h4>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><em><strong>Classification Status:</strong></em></td>
      <td>${currentStatus === "In Operation, Class Valid" ? "Active" : currentStatus || ""}</td>
    </tr>
    <tr>
      <td><em><strong>Hull Notation:</strong></em></td>
      <td>${clientData?.hullNotation || "-"}</td>
    </tr>
    <tr>
      <td><em><strong>Machinery Notation:</strong></em></td>
      <td>${clientData?.machineryNotation || "-"}</td>
    </tr>
    <tr>
      <td><em><strong>Descriptive Notations:</strong></em></td>
      <td>${clientData?.descriptiveNotation || "-"}</td>
    </tr>
    <tr>
      <td colspan="2">
        <em><strong>Class History:</strong></em>
        <table style="width:100%; border-collapse: collapse; margin-top:5px; border:1px solid #ddd;">
  <thead>
    <tr style="background-color:#f0f0f0;">
      <th style="padding:6px; border:1px solid #ddd;">Ship Status</th>
      <th style="padding:6px; border:1px solid #ddd;">Reason</th>
      <th style="padding:6px; border:1px solid #ddd;">From Date</th>
      <th style="padding:6px; border:1px solid #ddd;">To Date</th>
      <th style="padding:6px; border:1px solid #ddd;">Remarks</th>
    </tr>
  </thead>
  <tbody>
    ${(() => {
        const defaultRows = [{ shipStatus: "Class" }, { shipStatus: "Withdrawn" }, { shipStatus: "Re-classed" }, { shipStatus: "Suspended" }];

        // Merge response data with defaults
        const data = defaultRows.map((def) => {
          const found = clientData?.classHistory?.find((item) => item.shipStatus?.toLowerCase() === def.shipStatus.toLowerCase());
          return { ...def, ...found };
        });

        // Generate table rows
        return (
          data
            ?.map(
              (history) => `
            <tr>
              <td style="padding:6px; border:1px solid #ddd;">${history.shipStatus || "-"}</td>
              <td style="padding:6px; border:1px solid #ddd;">${history.reason || "-"}</td>
              <td style="padding:6px; border:1px solid #ddd;">
                ${history.from_date ? moment(history.from_date).format("DD/MM/YYYY") : "-"}
              </td>
              <td style="padding:6px; border:1px solid #ddd;">
                ${history.to_date ? moment(history.to_date).format("DD/MM/YYYY") : "-"}
              </td>
              <td style="padding:6px; border:1px solid #ddd;">${history.remarks || "-"}</td>
            </tr>
          `
            )
            .join("") || `<tr><td colspan="5" style="padding:6px; border:1px solid #ddd;">-</td></tr>`
        );
      })()}
  </tbody>
</table>

      </td>
    </tr>
  </tbody>
</table>




<table class="hull-section-table" style="width: 100%; border-collapse: collapse; border:none;">
<thead>
<tr>
<th colspan="2" style="text-align: left; padding: 8px; border:none;"><h4 class="no-break" style="color:white;background-color:linear-gradient(to right,  #1c1720ff, #e6e9edff)">Hull</h4></th>
</tr>
</thead>
<tbody>
<tr>
<td><em><strong>Gross Tonnage:</strong></em> ${clientData?.grossTonnage || "-"}</td>
<td><em><strong>Ship Builder:</strong></em> ${clientData?.shipBuilder || "-"}</td>
</tr>
<tr>
<td><em><strong>Net Tonnage:</strong></em> ${clientData?.netTonnage || "-"}</td>
<td><em><strong>Country of build:</strong></em> ${clientData?.countryOfBuild || "-"}</td>
</tr>
<tr>
<td><em><strong>Deadweight:</strong></em> ${clientData?.deadweight || "-"}</td>
<td><em><strong>Date of build:</strong></em> ${clientData?.dateOfBuild ? moment(clientData?.dateOfBuild).format("DD/MM/YYYY") : "-"}</td>
</tr>
<tr>
<td><em><strong>Keel Laid Date:</strong></em> ${clientData?.keelLaidDate ? moment(clientData?.keelLaidDate).format("DD/MM/YYYY") : "-"}</td>
<td><em><strong>Date of building contract:</strong></em> ${clientData?.dateOfBuildingContract ? moment(clientData?.dateOfBuildingContract).format("DD/MM/YYYY") : "-"}</td>
</tr>
<tr>
<td><em><strong>Length of ship:</strong></em> ${clientData?.lengthOfShip || "-"}</td>
<td><em><strong>Area of operation:</strong></em> ${clientData?.areaOfOperation || "-"}</td>
</tr>
<tr>
<td><em><strong>Date of delivery:</strong></em> ${clientData?.dateOfDelivery ? moment(clientData?.dateOfDelivery).format("DD/MM/YYYY") : "-"}</td>
<td><em><strong>Date of modification:</strong></em> ${clientData?.dateOfModification ? moment(clientData?.dateOfModification).format("DD/MM/YYYY") : "-"}</td>
</tr>
<tr>
<td colspan="2"><em><strong>Carrying capacity:</strong></em> ${clientData?.carryingCapacity || "-"}</td>
</tr>
</tbody>
</table>

<table class="hull-section-table" style="width: 100%; border-collapse: collapse; border:none;">
  <thead>
    <tr>
      <th colspan="2" style="text-align: left; padding: 8px; border:none;" >
        <h4 class="no-break" style="color:white; background: linear-gradient(to right,  #1c1720ff, #e6e9edff);">Machinery Details</h4>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="width:50%;"><em><strong>Main Engine Model:</strong></em> ${clientData?.machineList.main_engine_model || "-"}</td>
      <td><em><strong>Propeller:</strong></em> ${clientData?.machineList.propeller || "-"}</td>

      </tr>
    <tr>
      <td><em><strong>No of Engines:</strong></em> ${clientData?.machineList.no_of_engines || "-"}</td>
      <td><em><strong>Engine Built:</strong></em> ${clientData?.machineList.engine_built ? moment(clientData?.machineList.engine_built).format("DD/MM/YYYY") : "-"}</td>
    </tr>
    
    <tr>
      <td><em><strong>Total Power:</strong></em> ${clientData?.machineList.total_power || "-"}</td>
      <td colspan="2" style="width:50%;"><em><strong>Electrical Installation:</strong></em> ${clientData?.machineList.electrical_installation || "-"}</td>
    </tr>
    <tr>
      <td><em><strong>Engine Builder:</strong></em> ${clientData?.machineList.engine_builder || "-"}</td>
      <td><em><strong>Boiler:</strong></em> ${clientData?.machineList.boilers || "-"}</td>
    </tr>
    <tr>
<td>
  <em><strong>Speed:</strong></em>
  ${clientData?.machineList?.speed_knots || clientData?.machineList?.rpm ? ` ${clientData?.machineList?.speed_knots || "-"} Knots  &nbsp;  <b>RPM</b>:  ${clientData?.machineList?.rpm || "-"}` : "-"}
</td>
    </tr>
  </tbody>
</table>


</div>

<div class="owner-section page">
<h2 style="margin-top: -75px;">Owner / Manager Information</h2>

<h4 class="no-break" style="color:white;background-color:linear-gradient(to right,  #1c1720ff, #e6e9edff)">Registered Owner</h4>
<div class="owner-info">
<div><em><strong>Company Name:</strong></em> ${clientData?.ownerDetails?.companyName || "-"}</div>
<div><em><strong>IMO Number:</strong></em> ${clientData?.ownerDetails?.imoNumber || "-"}</div>
<div><em><strong>Address:</strong></em> ${clientData?.ownerDetails?.companyAddress || "-"}</div>
</div>

<h4 class="no-break" style="color:white;background-color:linear-gradient(to right,  #1c1720ff, #e6e9edff)">Manager</h4>
<div class="owner-info">
<div><em><strong>Company Name:</strong></em> ${clientData?.managerDetails?.companyName || "-"}</div>
<div><em><strong>IMO Number:</strong></em> ${clientData?.managerDetails?.imoNumber || "-"}</div>
<div><em><strong>Address:</strong></em> ${clientData?.managerDetails?.companyAddress || "-"}</div>
</div>
</div>

${htmlString}

<div class="">
<h4 class="no-break" style="color:white;background-color:linear-gradient(to right,  #1c1720ff, #e6e9edff);margin-top:10">Surveys / Audits / Inspections</h4>

${classificationSurveyTableHtml}

${statutorySurveyTableHtml}

${auditSurveyTableHtml}

<table class="survey-summary-table" style="width: 100%; border-collapse: collapse; margin-top: 16px; page-break-inside: avoid;">
<tbody>
<tr>
<td colspan="2">
<div class="legend" style="margin-top: 10px;">
<span class="legend-item">
<span class="status-icon expired">S</span> Overdue
</span>
<span class="legend-item">
<span class="status-icon expiring1m">S</span> Overdue in less than 1 month
</span>
<span class="legend-item">
<span class="status-icon expiring3m">S</span> Within the range
</span>
</div>
<div style="font-size: 16px; margin-top: 16px;">
<strong>Note:</strong> Format of date is DD/MM/YYYY
</div>
</td>
</tr>
</tbody>
</table>
<h2 style="margin-top: 10px; color:black">Additional Notes</h2>

${additionalFieldsHtml}
</div>
<h2 style="margin-top: 10px; color:black">Machine List</h2>
${machineListHtml}
</div>
`;
  }, [clientData, reportDetails, classificationData, statutoryData]);

  useEffect(() => {
    if (clientData && reportDetails) {
      const newContent = generateHtmlContent();
      setEditorContent(newContent);
    }
  }, [clientData, reportDetails, classificationData, statutoryData, generateHtmlContent]);

  const handleEditorChange = (content) => {
    setEditorContent(content);
  };

  const getShipData = async (clientId) => {
    try {
      setLoading(true);
      const result = await getSpecificClient(clientId);
      if (result?.status === 200) {
        const data = result.data.data;
        setClientData(data);
      } else {
        toast.error("Something went wrong! Please try again after some time");
      }
    } catch (error) {
      console.error("Error fetching report details:", error);
      toast.error(error.message || "Error fetching client data");
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityReportDetails = async (clientId) => {
    try {
      setLoading(true);
      const result = await getSurveyReportData(clientId);

      if (result?.status === 200) {
        const data = result.data.data;
        setReportDetails(data);
      } else {
        toast.error("Something went wrong! Please try again after some time");
      }
    } catch (error) {
      console.error("Error fetching report details:", error);
      toast.error(error.message || "Error fetching client data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      getShipData(id);
      fetchActivityReportDetails(id);
    }
  }, [id]);

  if (loading) {
    return (
      <Box>
        <Loader />
      </Box>
    );
  }

  return (
    <>
      <Editor
        apiKey="p9j94lg0okz82u9rr4v3zhap0pimbq1hob48rzesv3c5dylj"
        value={editorContent}
        onEditorChange={handleEditorChange}
        init={{
          disabled: false,
          height: 800,
          menubar: true,
          visual: false,
          plugins: ["advlist", "autolink", "lists", "link", "image", "charmap", "print", "preview", "searchreplace", "wordcount", "code", "fullscreen"],
          toolbar: "undo redo | formatselect | bold italic | alignleft aligncenter alignright | outdent indent | link image | code fullscreen",
          readonly: false,

          setup: (editor) => {
            editor.on("input", () => {
              setTimeout(() => {
                updateStatusIcons(editor);
              }, 100);
            });

            editor.on("SetContent", () => {
              setTimeout(() => {
                updateStatusIcons(editor);
              }, 100);
            });

            editor.on("init", () => {
              setTimeout(() => {
                updateStatusIcons(editor);
              }, 500);
            });

            let timeoutId;
            editor.on("keyup", () => {
              clearTimeout(timeoutId);
              timeoutId = setTimeout(() => {
                updateStatusIcons(editor);
              }, 500);
            });

            editor.on("paste", () => {
              setTimeout(() => {
                updateStatusIcons(editor);
              }, 200);
            });
          },
          content_css: false,
          content_style: `
body {
font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
margin: 0;
line-height: 1.6;
font-size: 13px;
color: #333;
}

.page {
width: 8.5in;
margin: 0 auto;
padding: 40px;
background-color: white;
position: relative;
margin-bottom: 20px;
box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

h2 {
color: white;
text-align: center;
font-size: 22px;
margin: 0 0 30px 0;
font-weight: 600;
letter-spacing: 0.5px;
text-transform: uppercase;
border-bottom: 3px solid #4a90e2;
padding-bottom: 12px;
}

h4 {
color: white;
background: linear-gradient(to right, #1c1720ff, #e6e9edff);
font-size: 15px;
margin: 25px 0 15px 0;
padding: 6px 8px;
font-weight: 600;
border-radius: 4px;
letter-spacing: 0.3px;
}

.report-title {
background: linear-gradient(to right, #1c1720ff, #e6e9edff);
box-shadow: 0 4px 8px rgba(0,0,0,0.15);
color: white;
padding: 20px;
font-size: 50px;
width: 60%;
text-align: center;
margin: 50px auto;
border-radius: 8px;
}

.section {
margin-bottom: 30px;
padding: 15px;
background: #fafafa;
border-radius: 6px;
}

.identification-row {
display: flex;
margin-bottom: 5px;
font-size: 13px;
padding: 8px 0;
border-bottom: 1px solid #e0e0e0;
}

.identification-row .left {
width: 250px;
font-weight: 500;
}

.identification-row .right {
flex: 1;
color: #555;
}

.classification-row {
margin-bottom: 10px;
font-size: 13px;
padding: 6px 0;
}

.hull-section {
margin-top: 25px;
}


.hull-row {
display: flex;
margin-bottom: 10px;
font-size: 13px;
padding: 8px 0;
}

.hull-row .left {
width: 400px;
flex-shrink: 0;
font-weight: 500;
}

.hull-row .right {
flex: 1;
padding-left: 20px;
color: #555;
}

.owner-section {
margin-top: 40px;
margin-bottom: 30px;
}

.owner-section h2 {
color: #1a1a1a;
font-size: 20px;
margin-bottom: 25px;
}

.owner-section h4 {
margin: 20px 0 10px 0;
}

.owner-info {
font-size: 13px;
line-height: 1.8;
padding: 15px;
background: #fafafa;
border-radius: 6px;
margin-bottom: 20px;
}

.owner-info div {
margin-bottom: 8px;
padding: 4px 0;
}

strong {
font-weight: 600;
color: #2c3e50;
}

em {
font-style: italic;
}

p.subtitle {
font-size: 13px;
text-align: center;
margin: 10px 0 25px 0;
color: #666;
line-height: 1.6;
font-style: italic;
}

table {
width: 100%;
margin-top: 15px;
font-size: 13px;
border-collapse: separate;
border-spacing: 0;
border: 1px solid #ddd;
border-radius: 6px;
overflow: hidden;
}

table th, table td {
padding: 10px 12px;
text-align: left;
vertical-align: top;
border-bottom: 1px solid #e0e0e0;
}

table th {
color: #2f5597;
font-weight: 600;
border-bottom: 2px solid linear-gradient(to right, #1c1720ff, #e6e9edff);
text-transform: uppercase;
font-size: 12px;
letter-spacing: 0.5px;
}

table tbody tr:hover {
background-color: #f5f5f5;
}

table tbody tr:last-child td {
border-bottom: none;
}

table tr{
page-break-inside: avoid !important;
break-inside: avoid !important;
}

.status-icon {
font-size: 13px;
margin-right: 1px;
font-weight: bold;
}

.expired {
color:white;
background-color: #dc3545;
width: 18px;
height: 18px;
display: flex;
justify-content: center;
align-items: center;
font-size: 11px;
border-radius: 3px;
box-shadow: 0 2px 4px rgba(220,53,69,0.3);
}

span.expiring1m{
color:white;
clip-path: polygon(50% 2%, 98% 50%, 50% 98%, 2% 50%);
background-color: #ffc107;
width: 18px;
height: 24px;
display: flex;
justify-content: center;
align-items: center;
font-size: 11px;
filter: drop-shadow(0 2px 4px rgba(255,193,7,0.3));
}

span.expiring3m{
color:white;
border-radius: 50%;
background-color: #28a745;
width: 18px;
height: 18px;
display: flex;
justify-content: center;
align-items: center;
font-size: 11px;
box-shadow: 0 2px 4px rgba(40,167,69,0.3);
}

.main-heading {
color: #0066cc;
font-weight: bold;
font-size: 14px;
text-decoration: underline;
margin-bottom: 20px;
}

.section-title {
font-weight: 600;
font-size: 16px;
margin: 25px 0 10px 0;
color: #1a1a1a;
border-left: 4px solid linear-gradient(to right,  #1c1720ff, #e6e9edff);
padding-left: 12px;
}

.legend-item {
margin: 2px 0;
color: #333;
font-size: 13px;
}

.classification-section-table {
width: 100%;
border-collapse: collapse;
margin-bottom: 20px;
border: none;
page-break-inside: avoid;
}

.classification-section-table td,
.classification-section-table th {
padding: 10px 12px;
border: none;
vertical-align: top;
break-inside: avoid;
}

.classification-section-table tr {
border-bottom: 1px solid #e0e0e0;
}

.classification-section-table tr:last-child {
border-bottom: none;
}

.legend {
display: flex;
justify-content: start;
align-items: center;
gap: 25px;
flex-wrap: wrap;
margin-top: 20px;
padding: 15px;
background: #f8f9fa;
border-radius: 6px;
border-left: 4px solid linear-gradient(to right,  #1c1720ff, #e6e9edff);
}

.legend-item {
display: inline-flex;
align-items: center;
gap: 8px;
font-size: 13px;
font-weight: 500;
}

.toc-container {
max-width: 700px;
margin: 40px auto;
background: white;
border-radius: 8px;
box-shadow: 0 2px 10px rgba(0,0,0,0.08);
overflow: hidden;
}

.toc-container table {
border: none;
}

.toc-section td {
padding: 18px 25px;
font-size: 15px;
color: white;
background-color: linear-gradient(to right, #1c1720ff, #e6e9edff);
border-bottom: 2px solid white;
font-weight: 600;
letter-spacing: 0.3px;
}

.toc-section:last-child td {
border-bottom: none;
}

.page-break-new {
page-break-before: always !important;
break-before: always !important;
}
.ship-name {
    font-size: 50px;
    font-weight: bold;
    margin-top: 20px;
    margin-bottom: 20px;
    border-bottom: 4px solid #6659BF;
    display: inline-block;
}

`,
        }}
        setup={(editor) => {
          updateStatusIcons(editor);
        }}
      />
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
        <CommonButton onClick={() => router.push(`/clients/${id}`)} text="Back" />
        <CommonButton onClick={downloadEditorContentAsPdf} text="Download PDF" />
      </Box>
    </>
  );
};

export default TextEditor;
