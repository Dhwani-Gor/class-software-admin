import { Editor } from "@tinymce/tinymce-react";
import { useEffect, useState, useCallback } from "react";
import { getAllClassificationSurveys, getAllListClassificationSurveys, getAllSystemVariables, getSpecificClient, getSurveyReportData, uploadSurveyReport } from "../api";
import { toast } from "react-toastify";
// import { PDFDocument } from "pdf-lib";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

import html2canvas from "html2canvas";
import moment from "moment";
import CommonButton from "@/components/CommonButton";
import { Box } from "@mui/material";
import Loader from "@/components/Loader";
import { addYears, subMonths, format } from "date-fns";
import { useRouter } from "next/navigation";
const currentDate = new Date();

const TextEditor = ({ id }) => {
  const router = useRouter();
  const [reportDetails, setReportDetails] = useState(null);
  const [clientData, setClientData] = useState();
  const [loading, setLoading] = useState(true);
  const [editorContent, setEditorContent] = useState("");
  const [classificationData, setClassificationData] = useState([]);
  const [statutoryData, setStatutoryData] = useState([]);
  const [systemVariables, setSystemVariables] = useState();
  const today = moment();
  const companyName = systemVariables?.data?.find((item) => item.name === "company_name")?.information || "-";
  const companyLogo = systemVariables?.data?.find((item) => item.name === "company_logo")?.information || "-";

  useEffect(() => {
    getSystemVariables();
  }, []);

  const getAllClassification = async () => {
    const response = await getAllListClassificationSurveys({ clientId: id });
    setClassificationData(response?.data?.data);
  };
  useEffect(() => {
    getAllClassification();
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

  // ---------------------------------------- final version (using) ----------------------------------------
  // const downloadEditorContentAsPdf = async () => {
  //   const iframe = document.querySelector("iframe.tox-edit-area__iframe");
  //   const contentDocument = iframe?.contentDocument;
  //   const contentBody = contentDocument?.body;

  //   if (!contentBody) {
  //     console.error("Could not find editor content");
  //     return;
  //   }

  //   const originalOverflow = contentBody.style.overflow;
  //   const originalHeight = contentBody.style.height;
  //   const originalMaxHeight = contentBody.style.maxHeight;

  //   try {
  //     const style = contentDocument.createElement("style");
  //     style.innerHTML = `
  //           * {
  //               font-family: Arial, sans-serif !important;
  //               font-size: 11px !important;
  //               line-height: 20px !important;
  //               word-spacing: 0.05em !important;
  //               box-sizing: border-box;
  //               white-space: normal !important;
  //           }

  //           html, body {
  //               margin: 0 !important;
  //               padding: 0 !important;
  //               background: white !important;
  //               width: 100% !important;
  //               height: auto !important;
  //           }

  //           table {
  //               border-collapse: collapse !important;
  //               page-break-inside: auto !important;
  //           }

  //           table tr, table td, table th {
  //               page-break-inside: avoid !important;
  //               break-inside: avoid !important;
  //               vertical-align: top !important;
  //               padding: 4px !important;
  //           }

  //           table thead {
  //               display: table-header-group !important;
  //           }

  //           table tbody {
  //               display: table-row-group !important;
  //           }

  //           .no-break {
  //               page-break-inside: avoid !important;
  //               break-inside: avoid !important;
  //           }
  //               .no-break-block,
  //               .no-break-block *,
  //               .hull-row {
  //               page-break-inside: avoid !important;
  //               break-inside: avoid !important;
  //               border:none;
  //       }
  //       `;
  //     contentDocument.head.appendChild(style);
  //     const tableRows = contentDocument.querySelectorAll("table tr");
  //     tableRows.forEach((row) => {
  //       row.classList.add("no-break");
  //       row.style.pageBreakInside = "avoid";
  //       row.style.breakInside = "avoid";
  //     });

  //     contentBody.style.overflow = "visible";
  //     contentBody.style.height = "auto";
  //     contentBody.style.maxHeight = "none";

  //     await document.fonts.ready;
  //     await new Promise((resolve) => setTimeout(resolve, 300));

  //     const pageWidth = 595.28;
  //     const pageHeight = 841.89;
  //     const dpiRatio = 1.3333;
  //     const canvasWidth = pageWidth * dpiRatio;
  //     const canvasHeight = contentBody.scrollHeight;

  //     const canvas = await html2canvas(contentBody, {
  //       scale: 2,
  //       useCORS: true,
  //       allowTaint: true,
  //       scrollX: 0,
  //       scrollY: 0,
  //       backgroundColor: "#ffffff",
  //       width: canvasWidth,
  //       height: canvasHeight,
  //       windowWidth: canvasWidth,
  //       windowHeight: canvasHeight,
  //     });

  //     const imgWidth = canvas.width;
  //     const imgHeight = canvas.height;

  //     const pdfDoc = await PDFDocument.create();

  //     // ================= PAGE LAYOUT CONFIGURATION =================
  //     const margin = 20;                    // Page margins (left, right, top, bottom spacing)
  //     const headerHeight = 60;              // Fixed header height - ADJUST THIS to make header bigger/smaller
  //     const footerHeight = 25;              // Fixed footer height - ADJUST THIS to make footer bigger/smaller
  //     const usableWidth = pageWidth - 2 * margin;
  //     const usableHeight = pageHeight - 2 * margin - headerHeight - footerHeight;
  //     const scaleFactor = usableWidth / imgWidth;

  //     const baseSliceHeight = Math.floor(usableHeight / scaleFactor);

  //     const getTableRowPositions = () => {
  //       const rows = contentDocument.querySelectorAll("table tr");
  //       const positions = [];

  //       rows.forEach((row) => {
  //         const rect = row.getBoundingClientRect();
  //         const bodyRect = contentBody.getBoundingClientRect();
  //         const relativeTop = rect.top - bodyRect.top + contentBody.scrollTop;
  //         const relativeBottom = relativeTop + rect.height;

  //         positions.push({
  //           top: Math.floor(relativeTop * 2),
  //           bottom: Math.floor(relativeBottom * 2),
  //           height: Math.floor(rect.height * 2),
  //         });
  //       });

  //       return positions;
  //     };

  //     const rowPositions = getTableRowPositions();

  //     const getOptimalSliceHeight = (startY, maxSliceHeight) => {
  //       let optimalHeight = maxSliceHeight;
  //       const sliceEndY = startY + maxSliceHeight;

  //       for (const row of rowPositions) {
  //         if (row.top < sliceEndY && row.bottom > sliceEndY) {
  //           if (row.top > startY + 100) {
  //             optimalHeight = row.top - startY;
  //           } else if (row.bottom < startY + maxSliceHeight + row.height) {
  //             optimalHeight = row.bottom - startY;
  //           }
  //           break;
  //         }
  //       }

  //       return Math.max(optimalHeight, 100);
  //     };

  //     let currentY = 0;
  //     let pageIndex = 0;

  //     while (currentY < imgHeight) {
  //       const maxSliceHeight = Math.min(baseSliceHeight, imgHeight - currentY);
  //       const sliceHeight = getOptimalSliceHeight(currentY, maxSliceHeight);

  //       const sliceCanvas = document.createElement("canvas");
  //       sliceCanvas.width = imgWidth;
  //       sliceCanvas.height = sliceHeight;

  //       const ctx = sliceCanvas.getContext("2d");
  //       ctx.drawImage(canvas, 0, currentY, imgWidth, sliceHeight, 0, 0, imgWidth, sliceHeight);

  //       const pngUrl = sliceCanvas.toDataURL("image/png");
  //       const pngImage = await pdfDoc.embedPng(pngUrl);
  //       const scaledHeight = sliceHeight * scaleFactor;

  //       const page = pdfDoc.addPage([pageWidth, pageHeight]);

  //       // ================= HEADER SECTION =================
  //       // Header positioning from top of page
  //       const headerStartY = pageHeight - 8;         // Distance from top of page - DECREASE to move header up, INCREASE to move down

  //       // Font setup
  //       const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  //       const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  //       // Header border/background rectangle
  //       const headerRectHeight = 55;                 // Header rectangle height - ADJUST to make header box bigger/smaller
  //       page.drawRectangle({
  //         x: margin,
  //         y: headerStartY - headerRectHeight,
  //         width: usableWidth,
  //         height: headerRectHeight,
  //         borderColor: rgb(0.7, 0.7, 0.7),
  //         filColor: rgb(1, 0, 0),    // light gray background
  //         borderWidth: 1,
  //       });

  //       // Company Logo section (currently commented out)
  //       if (companyLogo && companyLogo !== "-") {
  //         try {
  //           // Logo positioning and sizing
  //           const logoSize = 30;                     // Logo width and height - ADJUST logo size
  //           const logoX = margin + 8;                // Logo X position from left
  //           const logoY = headerStartY - 45;         // Logo Y position from top

  //           // Uncomment below lines to enable logo
  //           // const logoImage = await pdfDoc.embedPng(companyLogo);
  //           // page.drawImage(logoImage, {
  //           //   x: logoX,
  //           //   y: logoY,
  //           //   width: logoSize,
  //           //   height: logoSize,
  //           // });
  //         } catch (error) {
  //           console.log("Logo embedding failed:", error);
  //         }
  //       }

  //       // Main Title "Survey Status Report"
  //       const titleFontSize = 12;                    // Title font size - ADJUST to make title bigger/smaller
  //       const titleY = headerStartY - 18;            // Title Y position - ADJUST to move title up/down
  //       page.drawText("Survey Status Report", {
  //         x: pageWidth / 2 - 70,                     // Title X position (centered) - ADJUST for horizontal positioning
  //         y: titleY,
  //         size: titleFontSize,
  //         color: rgb(0, 0, 1),                       // Blue color for title
  //         font,
  //       });

  //       // LEFT COLUMN - Name and Status
  //       const leftColumnX = margin + 8;              // Left column X position - ADJUST to move left content left/right
  //       const labelFontSize = 9;                     // Font size for labels - ADJUST to make labels bigger/smaller
  //       const valueFontSize = 9;                     // Font size for values - ADJUST to make values bigger/smaller
  //       const colonX = margin + 45;                  // Colon X position - ADJUST to align colons
  //       const valueX = margin + 55;                  // Value X position - ADJUST to align values

  //       // Name row
  //       const nameY = headerStartY - 35;             // Name row Y position - ADJUST to move name row up/down
  //       page.drawText("Name", {
  //         x: leftColumnX,
  //         y: nameY,
  //         size: labelFontSize,
  //         font: regularFont,
  //       });
  //       page.drawText(":", {
  //         x: colonX,
  //         y: nameY,
  //         size: labelFontSize,
  //         font: regularFont,
  //       });
  //       page.drawText(`${clientData?.shipName || "N/A"}`, {
  //         x: valueX,
  //         y: nameY,
  //         size: valueFontSize,
  //         font,
  //       });

  //       // Status row
  //       const statusY = headerStartY - 47;           // Status row Y position - ADJUST to move status row up/down
  //       page.drawText("Status", {
  //         x: leftColumnX,
  //         y: statusY,
  //         size: labelFontSize,
  //         font: regularFont,
  //       });
  //       page.drawText(":", {
  //         x: colonX,
  //         y: statusY,
  //         size: labelFontSize,
  //         font: regularFont,
  //       });
  //       page.drawText("In Operation, Class Valid", {
  //         x: valueX,
  //         y: statusY,
  //         size: valueFontSize,
  //         font: regularFont,
  //       });

  //       // RIGHT COLUMN - IR Number and IMO Number
  //       const rightLabelX = pageWidth - margin - 120; // Right column label X position - ADJUST to move right labels left/right
  //       const rightColonX = pageWidth - margin - 65;   // Right column colon X position - ADJUST to align right colons
  //       const rightValueX = pageWidth - margin - 55;   // Right column value X position - ADJUST to align right values

  //       // IR Number row
  //       page.drawText("IR Number", {
  //         x: rightLabelX,
  //         y: nameY,                                   // Same Y as name row
  //         size: labelFontSize,
  //         font: regularFont,
  //       });
  //       page.drawText(":", {
  //         x: rightColonX,
  //         y: nameY,
  //         size: labelFontSize,
  //         font: regularFont,
  //       });
  //       page.drawText(`${clientData?.irNumber || "N/A"}`, {
  //         x: rightValueX,
  //         y: nameY,
  //         size: valueFontSize,
  //         font,
  //       });

  //       // IMO Number row
  //       page.drawText("IMO Number", {
  //         x: rightLabelX,
  //         y: statusY,                                 // Same Y as status row
  //         size: labelFontSize,
  //         font: regularFont,
  //       });
  //       page.drawText(":", {
  //         x: rightColonX,
  //         y: statusY,
  //         size: labelFontSize,
  //         font: regularFont,
  //       });
  //       page.drawText(`${clientData?.imoNumber || "N/A"}`, {
  //         x: rightValueX,
  //         y: statusY,
  //         size: valueFontSize,
  //         font,
  //       });

  //       // ================= MAIN CONTENT SECTION =================
  //       // Content positioning between header and footer
  //       const contentStartY = pageHeight - headerHeight - margin - 5; // Content start Y position - ADJUST to add/reduce space between header and content

  //       page.drawImage(pngImage, {
  //         x: margin,                                  // Content X position (left margin)
  //         y: contentStartY - scaledHeight,           // Content Y position
  //         width: usableWidth,                        // Content width (page width minus margins)
  //         height: scaledHeight,                      // Content height (scaled to fit)
  //       });

  //       // ================= FOOTER SECTION =================
  //       // Footer positioning from bottom of page
  //       const footerStartY = footerHeight - 5;       // Footer Y position from bottom - INCREASE to move footer up, DECREASE to move down
  //       const footerFontSize = 8;                    // Footer font size - ADJUST to make footer text bigger/smaller

  //       // Footer content
  //       const generatedText = `Generated on: ${moment().format("DD MMM YYYY")}`;
  //       const totalPages = Math.ceil(imgHeight / baseSliceHeight);
  //       const pageText = `Page ${pageIndex + 1} of ${totalPages}`;

  //       // Footer separator line
  //       const footerLineY = footerStartY + 12;       // Footer line Y position - ADJUST to move separator line up/down
  //       page.drawLine({
  //         start: { x: margin, y: footerLineY },
  //         end: { x: pageWidth - margin, y: footerLineY },
  //         thickness: 0.5,                            // Footer line thickness - ADJUST to make line thicker/thinner
  //       });

  //       // Footer text positioning
  //       page.drawText(generatedText, {
  //         x: margin,                                 // Generated date X position (left aligned)
  //         y: footerStartY,
  //         size: footerFontSize,
  //       });

  //       const pageTextWidth = pageText.length * 4.5; // Approximate page text width for right alignment
  //       page.drawText(pageText, {
  //         x: pageWidth - margin - pageTextWidth,     // Page number X position (right aligned) - ADJUST multiplier to fine-tune alignment
  //         y: footerStartY,
  //         size: footerFontSize,
  //       });

  //       currentY += sliceHeight;
  //       pageIndex++;
  //     }

  //     const pdfBytes = await pdfDoc.save();
  //     const blob = new Blob([pdfBytes], { type: "application/pdf" });

  //     const file = new File([blob], "survey-status-report.pdf", {
  //       type: "application/pdf",
  //     });
  //     const formData = new FormData();
  //     formData.append("clientId", id);
  //     formData.append("generatedDoc", file);

  //     const res = await uploadSurveyReport(formData);
  //     if (res) {
  //       toast.success("Survey Status Report Downloaded Successfully");
  //     }

  //     const url = URL.createObjectURL(blob);
  //     const link = document.createElement("a");
  //     link.href = url;
  //     link.download = `MCB Survey Status Report - ${clientData?.imoNumber}-${clientData?.shipName}-${moment(currentDate).format("DD-MM-YYYY")}.pdf`;
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  //     URL.revokeObjectURL(url);
  //   } finally {
  //     contentBody.style.overflow = originalOverflow;
  //     contentBody.style.height = originalHeight;
  //     contentBody.style.maxHeight = originalMaxHeight;
  //   }
  // };

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
          font-family: Arial, sans-serif !important;
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
      }
      table {
          border-collapse: collapse !important;
          page-break-inside: auto !important;
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
      .no-break-block, 
      .no-break-block *, 
      .hull-row {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          border:none;
      }
      /* New page break classes */
      .page-break-after {
          page-break-after: always !important;
          break-after: page !important;
      }
      .index-page {
          page-break-after: always !important;
          break-after: page !important;
      }
    `;
      contentDocument.head.appendChild(style);

      // Apply page break class to index-page elements
      const indexPages = contentDocument.querySelectorAll(".index-page");
      indexPages.forEach((element) => {
        element.classList.add("page-break-after");
      });

      const tableRows = contentDocument.querySelectorAll("table tr");
      tableRows.forEach((row) => {
        row.classList.add("no-break");
        row.style.pageBreakInside = "avoid";
        row.style.breakInside = "avoid";
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

      // ========== PAGE CONFIG ==========
      const margin = 20;
      const headerHeight = 60;
      const footerHeight = 25;
      const usableWidth = pageWidth - 2 * margin;
      const usableHeight = pageHeight - 2 * margin - headerHeight - footerHeight;
      const scaleFactor = usableWidth / imgWidth;
      const baseSliceHeight = Math.floor(usableHeight / scaleFactor);

      // Get positions of elements that should end pages (force next content to new page)
      const getPageBreakAfterElements = () => {
        const elements = contentDocument.querySelectorAll(".index-page, .page-break-after");
        const positions = [];
        elements.forEach((element) => {
          const rect = element.getBoundingClientRect();
          const bodyRect = contentBody.getBoundingClientRect();
          const relativeTop = rect.top - bodyRect.top + contentBody.scrollTop;
          const relativeBottom = relativeTop + rect.height;
          positions.push({
            top: Math.floor(relativeTop * 2),
            bottom: Math.floor(relativeBottom * 2),
            element: element,
          });
        });
        return positions.sort((a, b) => a.top - b.top);
      };

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
      const pageBreakAfterElements = getPageBreakAfterElements();

      const shouldForcePageBreakAfter = (startY, endY) => {
        return pageBreakAfterElements.some((pb) => pb.bottom >= startY && pb.bottom < endY);
      };

      const getOptimalSliceHeight = (startY, maxSliceHeight) => {
        let optimalHeight = maxSliceHeight;
        const sliceEndY = startY + maxSliceHeight;

        // Check if we should end the page after certain elements (like index-page)
        for (const pageBreakAfter of pageBreakAfterElements) {
          if (pageBreakAfter.bottom > startY && pageBreakAfter.bottom < sliceEndY) {
            return pageBreakAfter.bottom - startY;
          }
        }

        // Then check for table row breaks
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

      // Embed fonts once
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

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
          // <-- skip on first page
          // ========== HEADER ==========
          const headerStartY = pageHeight - 8;
          const headerRectHeight = 55;
          page.drawRectangle({
            x: margin,
            y: headerStartY - headerRectHeight,
            width: usableWidth,
            height: headerRectHeight,
            color: rgb(0.12, 0.35, 0.6), // dark blue
          });

          // Title
          page.drawText("Survey Status Report", {
            x: pageWidth / 2 - 70,
            y: headerStartY - 20,
            size: 13,
            color: rgb(1, 1, 1), // white
            font: fontBold,
          });

          // Left column
          const leftColumnX = margin + 8;
          const colonX = margin + 45;
          const valueX = margin + 55;
          const nameY = headerStartY - 35;
          const statusY = headerStartY - 47;

          page.drawText("Name", {
            x: leftColumnX,
            y: nameY,
            size: 9,
            color: rgb(1, 1, 1),
            font: fontRegular,
          });
          page.drawText(":", {
            x: colonX,
            y: nameY,
            size: 9,
            color: rgb(1, 1, 1),
            font: fontRegular,
          });
          page.drawText(`${clientData?.shipName || "N/A"}`, {
            x: valueX,
            y: nameY,
            size: 9,
            color: rgb(0.9, 0.9, 0.9),
            font: fontBold,
          });

          page.drawText("Status", {
            x: leftColumnX,
            y: statusY,
            size: 9,
            color: rgb(1, 1, 1),
            font: fontRegular,
          });
          page.drawText(":", {
            x: colonX,
            y: statusY,
            size: 9,
            color: rgb(1, 1, 1),
            font: fontRegular,
          });
          page.drawText("In Operation, Class Valid", {
            x: valueX,
            y: statusY,
            size: 9,
            color: rgb(0.9, 0.9, 0.9),
            font: fontRegular,
          });

          // Right column
          const rightLabelX = pageWidth - margin - 120;
          const rightColonX = pageWidth - margin - 65;
          const rightValueX = pageWidth - margin - 55;

          page.drawText("IMO Number", {
            x: rightLabelX,
            y: statusY,
            size: 9,
            color: rgb(1, 1, 1),
            font: fontRegular,
          });
          page.drawText(":", {
            x: rightColonX,
            y: statusY,
            size: 9,
            color: rgb(1, 1, 1),
            font: fontRegular,
          });
          page.drawText(`${clientData?.imoNumber || "N/A"}`, {
            x: rightValueX,
            y: statusY,
            size: 9,
            color: rgb(0.9, 0.9, 0.9),
            font: fontBold,
          });
        }
        // ========== CONTENT ==========
        const contentStartY = pageHeight - headerHeight - margin - 5;
        page.drawImage(pngImage, {
          x: margin,
          y: contentStartY - scaledHeight,
          width: usableWidth,
          height: scaledHeight,
        });

        // ========== FOOTER ==========
        if (pageIndex > 0) {
          // <-- skip on first page
          page.drawRectangle({
            x: margin,
            y: 0,
            width: usableWidth,
            height: footerHeight + 8,
            color: rgb(0.9, 0.9, 0.9), // light gray background
          });

          const footerStartY = footerHeight - 5;
          const generatedText = ` Generated on: ${moment().format("DD MMM YYYY")}`;
          const totalPages = Math.ceil(imgHeight / baseSliceHeight);
          const pageText = `Page ${pageIndex + 1} of ${totalPages}`;

          page.drawText(generatedText, {
            x: margin + 7,
            y: footerStartY,
            size: 8,
            color: rgb(0.2, 0.2, 0.2),
            font: fontRegular,
          });

          const pageTextWidth = pageText.length * 4.5;
          page.drawText(pageText, {
            x: pageWidth - margin - pageTextWidth,
            y: footerStartY,
            size: 8,
            color: rgb(0.2, 0.2, 0.2),
            font: fontRegular,
          });
        }
        currentY += sliceHeight;
        pageIndex++;
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });

      const file = new File([blob], "survey-status-report.pdf", {
        type: "application/pdf",
      });
      const formData = new FormData();
      formData.append("clientId", id);
      formData.append("generatedDoc", file);

      const res = await uploadSurveyReport(formData);
      if (res) {
        toast.success("Survey Status Report Downloaded Successfully");
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `MCB Survey Status Report - ${clientData?.imoNumber}-${clientData?.shipName}-${moment(currentDate).format("DD-MM-YYYY")}.pdf`;
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

    const daysDiff = due.diff(today, "days");
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

  // const getStatusText = (dueDate) => {
  //     if (!dueDate) return 'No date set';

  //     const due = moment(dueDate);

  //     if (!due.isValid()) {
  //         console.warn('Invalid date provided to getStatusText:', dueDate);
  //         return 'Invalid date';
  //     }

  //     const daysDiff = due.diff(today, 'days');

  //     console.log('Status calculation:', {
  //         inputDate: dueDate,
  //         momentDate: due.format('YYYY-MM-DD'),
  //         today: today.format('YYYY-MM-DD'),
  //         daysDiff: daysDiff
  //     });

  //     if (daysDiff < 0) {
  //         return `Overdue by ${Math.abs(daysDiff)} days`;
  //     }
  //     if (daysDiff <= 30) {
  //         return 'Limit date in less than 1m.';
  //     }
  //     if (daysDiff <= 90) {
  //         return 'Within range';
  //     }
  //     return 'Active';
  // };

  // Function to handle dynamic updates in TinyMCE
  // const calculateDates = (issuanceDate) => {
  //     if (!issuanceDate) return { dueDate: "", rangeDate: "" };

  //     const issuanceDateObj = new Date(issuanceDate);
  //     const dueDateObj = addYears(issuanceDateObj, 5);
  //     const rangeDateObj = reportDetails?.typeOfCertificate === "full_term" ? subMonths(dueDateObj, 6) : subMonths(dueDateObj, 3);

  //     return {
  //         dueDate: format(dueDateObj, "yyyy-MM-dd"),
  //         rangeDate: format(rangeDateObj, "yyyy-MM-dd"),
  //     };
  // };

  const calculateDates = (issuanceDate) => {
    if (!issuanceDate) return { dueDate: "", rangeFrom: "", rangeTo: "" };

    const issuanceDateObj = new Date(issuanceDate);
    const dueDateObj = addYears(issuanceDateObj, 5);
    const rangeFromObj = subMonths(dueDateObj, 3);
    const rangeToObj = addYears(issuanceDateObj, 5);
    const rangeToPlus = addYears(issuanceDateObj, 5);
    const rangeToFinal = addYears(issuanceDateObj, 5);
    const rangeToPlus3 = addYears(subMonths(issuanceDateObj, -3), 5);

    return {
      dueDate: format(dueDateObj, "yyyy-MM-dd"),
      rangeFrom: format(rangeFromObj, "yyyy-MM-dd"),
      rangeTo: format(rangeToPlus3, "yyyy-MM-dd"),
    };
  };

  const populateStatutoryRows = (surveyDataList) => {
    if (!surveyDataList || surveyDataList.length === 0) return;

    const surveyMap = {};

    surveyDataList.forEach((survey) => {
      const surveyName = survey.activity?.surveyTypes?.report?.name || "";

      if (!surveyName) return;

      if (!surveyMap[surveyName]) {
        surveyMap[surveyName] = survey;
      } else {
        const existing = surveyMap[surveyName];
        const existingDate = new Date(existing.updatedAt);
        const currentDate = new Date(survey.updatedAt);

        if (currentDate > existingDate) {
          surveyMap[surveyName] = survey;
        }
      }
    });

    const uniqueSurveys = Object.values(surveyMap);

    return uniqueSurveys?.map((survey) => {
      const surveyName = survey.activity?.surveyTypes?.report?.name || "";
      const surveyDate = survey.surveyDate ? format(new Date(survey.surveyDate), "yyyy-MM-dd") : "";
      const issuanceDate = survey.issuanceDate ? format(new Date(survey.issuanceDate), "yyyy-MM-dd") : "";

      let dueDate = "";
      let rangeFrom = "";
      let rangeTo = "";

      if (issuanceDate) {
        const { dueDate: d, rangeFrom: r, rangeTo: t } = calculateDates(issuanceDate);
        dueDate = d;
        rangeFrom = r;
        rangeTo = t;
      }

      return {
        surveyName,
        surveyDate,
        issuanceDate,
        dueDate,
        rangeFrom,
        rangeTo,
        postponedDate: "",
      };
    });
  };

  useEffect(() => {
    const statutory = populateStatutoryRows(reportDetails);
    setStatutoryData(statutory);
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

      const daysDiff = date.diff(currentToday, "days");

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

    // Function to get status text
    const getDynamicStatusText = (dateStr) => {
      const date = parseDate(dateStr);
      if (!date) return "";

      const daysDiff = date.diff(currentToday, "days");

      if (daysDiff < 0) {
        // return `Overdue by ${Math.abs(daysDiff)} days`;
        return "";
      }
      if (daysDiff <= 30) {
        // return 'Limit date in less than 1m.';
        return "";
      }
      if (daysDiff <= 90) {
        // return 'Within range';
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
            iconSpan.className = newClass;

            if (statusCell) {
              statusCell.textContent = newStatus;
            }
          }
        }
      });
    });
  };

  const formatSurveyName = (name) => {
    if (!name) return "";
    return name
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const generateHtmlContent = useCallback(() => {
    const classificationRows = (
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
                    <td>${dueDate ? moment(dueDate).format("DD/MM/YYYY") : ""}
                    <td>
                        ${moment(rangeFrom, moment.ISO_8601, true).isValid() && moment(rangeTo, moment.ISO_8601, true).isValid() ? `${moment(rangeFrom).format("DD/MM/YYYY")} - ${moment(rangeTo).format("DD/MM/YYYY")}` : "-"}
                    </td>

                    <td>${postponedDate ? moment(postponedDate).format("DD/MM/YYYY") : ""}</td>
                </tr>
            `;
      }) || []
    ).join("");

    const statutoryRows = statutoryData
      ?.filter((row) => row.surveyName.toLowerCase() !== "certificate of class")
      .map((row) => {
        const surveyName = row.surveyName;
        const surveyDate = row.surveyDate;
        const issuanceDate = row.issuanceDate;
        let rangeTo = row.rangeTo;
        let rangeFrom = row.rangeFrom;
        const postponedDate = "";
        const currentDate = new Date().toISOString().split("T")[0];

        return `
                <tr>
                <td>${surveyName}</td>
                <td>${getClassRangeIcon(currentDate, rangeFrom, rangeTo) ? `<span class="${getClassRangeIcon(currentDate, rangeFrom, rangeTo)}">C</span>` : ""}</td>              <td>${surveyDate ? moment(surveyDate).format("DD/MM/YYYY") : ""}</td>
                <td></td>
                <td>${reportDetails.typeOfCertificate == "full_term" ? `${moment(rangeFrom).format("DD/MM/YYYY")} - ${moment(rangeTo).format("DD/MM/YYYY")}` : ""}</td>
                <td>${postponedDate}</td>
                </tr>
            `;
      })
      .join("");

    const certificateOfClassRow = reportDetails?.find((cert) => cert?.activity?.surveyTypes?.report?.name?.toLowerCase() === "certificate of class");

    const otherCertificates = reportDetails?.filter((cert) => cert?.activity?.surveyTypes?.report?.name?.toLowerCase() !== "certificate of class");

    const formatCertificateRow = (cert) => {
      const name = cert?.activity?.surveyTypes?.report?.name || "-";
      const issued = cert.issuanceDate ? moment(cert.issuanceDate).format("DD/MM/YYYY") : "";
      const expiry = cert.validityDate;
      const extendedDate = cert.extendedDate;
      const expiryFormatted = expiry ? moment(expiry).format("YYYY-MM-DD") : null;

      const type = cert?.typeOfCertificate === "short_term" ? "ST" : cert?.typeOfCertificate === "full_term" ? "FT" : cert?.typeOfCertificate === "intrim" ? "IT" : cert?.typeOfCertificate === "extended" ? "ET" : cert?.typeOfCertificate || "-";

      const status = "";
      const currentDate = new Date().toISOString().split("T")[0];

      return `
                    <tr>
                        <td>${name}</td>
                        <td>${getClassName(expiryFormatted, currentDate) ? `<span class="${getClassName(expiryFormatted, currentDate)}">C</span>` : ""}</td>
                        <td>${issued}</td>
                        <td>${expiry ? moment(expiry).format("DD/MM/YYYY") : ""}</td>
                        <td></td>
                        <td>${type}</td>
                        <td>${status}</td>
                    </tr>
                `;
    };

    const certificateRows = [certificateOfClassRow ? formatCertificateRow(certificateOfClassRow) : null, ...(otherCertificates?.map(formatCertificateRow) || [])].filter(Boolean).join("");

    const certificatesTableHtml = `
        <h2>Certificates</h2>
        <table>
            <thead>
            <tr>
                <th>Certificate Name</th>
                <th></th>
                <th>Issued</th>
                <th>Expiry</th>
                <th>Extended</th>
                <th>Type</th>
            </tr>
            </thead>
            <tbody>
            ${certificateRows}
            </tbody>
        </table>
        <div class="legend">
        <span class="legend-item"><span class="status-icon expired">C</span>Expired</span>
        <span class="legend-item"><span class="status-icon expiring1m">C</span>Expires in less than 1 month</span>
        <span class="legend-item"><span class="status-icon expiring3m">C</span>Expires in less than 3 months</span>
        </div>
        `;

    const classificationSurveyTableHtml = `
                <div class="section-title">Classification Surveys</div>
                <table class="">
                    <tr>
                        <th>Survey Name</th>
                        <th></th>
                        <th>Survey Date</th>
                        <th>Assigned Date</th>
                        <th>Due Date</th>
                        <th>Range (from, to)</th>
                        <th>Postponed</th>
                    </tr>
                    ${classificationRows}
                </table>
            `;

    const statutorySurveyTableHtml = `
                <div class="section-title" style="margin-top: 20px;">Statutory Surveys</div>
                <table>
                    <tr>
                        <th>Survey Name</th>
                        <th></th>
                        <th>Survey Date</th>
                        <th>Range (from, to)</th>
                        <th>Postponed</th>
                    </tr>
                    ${statutoryRows}
                </table>
            `;

    const htmlString = `
        <div class="page">
        ${certificatesTableHtml}
        
        <h2 style="margin-top: 40px;">Conditions of Class / Statutory Status</h2>
        <p class="subtitle">
            The Conditions of Class / Statutory Status below shows the information available at the time the report is printed. 
            This may not indicate certificates issued, surveys carried out or conditions of class / recommendations issued but not yet reported to MCB Head Office.
        </p>

        <h2>Classification</h2>
        <p><i>Status: Active</i></p>
        </div>
        `;

    return `
        <div class="page cover-page">
<img src="${companyLogo}" alt="Company Logo" class="company-logo" />
<h1 style="font-size: 28px; margin: 20px 0; color: black; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">${companyName}</h1>
<div class="ship-name">${clientData?.shipName || "-"}</div>

<div class="ship-details">
<p><strong>Reg. Owner:</strong> ${clientData?.ownerDetails?.companyName || "-"}</p>
<p><strong>IMO Number:</strong> ${clientData?.imoNumber || "-"}</p>
<p><strong>Vessel Type:</strong> ${clientData?.typeOfShip || "-"}</p>
<p><strong>Gross Tonnage:</strong> ${clientData?.grossTonnage || "-"}</p>
<p><strong>Date of build:</strong> ${clientData?.dateOfBuild ? moment(clientData?.dateOfBuild).format("DD/MM/YYYY") : "-"}</p>
</div>
       <div style="" class="index-page">
       <h2 style="color:black;">Table of Contents</h2>
        <div>
         <table style="width: 99%;">
        <tr style="color:black">
            <td class=""><strong>1. Ship Particulars</strong></td>
        </tr>
        
        <tr style="color:black;">
            <td><strong>2. Owner/Manager Information</strong></td>
        </tr>
        <tr style="color:black">
            <td><strong>3. Conditions of Class / Statutory status</strong></td>
        </tr>
    </table>
    </div>

</div>
</div>
        </div>

         <div class="page">
                <h2>Ship Particulars</h2>
                <table class="classification-section-table" style="width: 100%;">
                <tr>
                  <h4 style="color:black">Identification</h4>
                </tr>
              <tbody>
                <tr class="">
                    <td class="left" style="font-size:14px;"><em><strong>Ship Type:</strong></em> ${clientData?.typeOfShip || "-"}</td>
                    <td class="right" style="font-size:14px;"><em><strong>Flag:</strong></em> ${clientData?.flag || "-"}</td>
                </tr>
                <tr class="">
                    <td class="left" style="font-size:14px;"><em><strong>IMO Number:</strong></em> ${clientData?.imoNumber || "-"}</td>
                    <td class="right" style="font-size:14px;"><em><strong>Port of Registry:</strong></em> ${clientData?.portOfRegistry || "-"}</td>
                </tr>
                <tr class="">
                    <td class="left" style="font-size:14px;"><em><strong>Call Sign:</strong></em> ${clientData?.callSign || "-"}</td>
                    <td class="right" style="font-size:14px;"><em><strong>Official Number:</strong></em> ${clientData?.officialNumber || "-"}</td>
                </tr>
            </tbody>
            </table>
            
            
            <table class="classification-section-table" style="width: 100%;">
    <tr>
      <h4 style="color:black">Classification</h4>
    </tr>
  <tbody>
    <tr>
      <td class="right" style="font-size:14px;"><em><strong>Class Symbols:</strong></em></td>
      <td class="right" style="font-size:14px;">-</td>
    </tr>
    <tr>
      <td class="right" style="font-size:14px;"><em><strong>Hull Notation:</strong></em></td>
      <td class="right" style="font-size:14px;">${clientData?.hullNotation || "-"}</td>
    </tr>
    <tr>
      <td class="right" style="font-size:14px;"><em><strong>Machinery Notation:</strong></em></td>
      <td class="right" style="font-size:14px;">${clientData?.machineryNotation || "-"}</td>
    </tr>
    <tr>
      <td class="right" style="font-size:14px;"><em><strong>Descriptive Notations:</strong></em></td>
      <td class="right" style="font-size:14px;">${clientData?.descriptiveNotation || "-"}</td>
    </tr>
  </tbody>
</table>

            
            <table class="hull-section-table" style="width: 100%; border-collapse: collapse; border:none;">
    <tr>
      <h4 style="color:black">Hull</h4>
    </tr>
  <tbody>
    <tr>
      <td style="font-size:14px;"><em><strong>Gross Tonnage:</strong></em> ${clientData?.grossTonnage || "-"}</td>
      <td style="font-size:14px;"><strong>Ship Builder:</strong> ${clientData?.shipBuilder || "-"}</td>
    </tr>
    <tr>
      <td style="font-size:14px;"><em><strong>Net Tonnage:</strong></em> ${clientData?.netTonnage || "-"}</td>
      <td style="font-size:14px;"><strong>Country of build:</strong> ${clientData?.countryOfBuild || "-"}</td>
    </tr>
    <tr>
      <td style="font-size:14px;"><em><strong>Deadweight:</strong></em> ${clientData?.deadweight || "-"}</td>
      <td style="font-size:14px;"><strong>Date of build:</strong> ${clientData?.dateOfBuild ? moment(clientData?.dateOfBuild).format("DD/MM/YYYY") : "-"}</td>
    </tr>
    <tr>
      <td style="font-size:14px;"><strong>Keel Laid Date:</strong> ${clientData?.keelLaidDate ? moment(clientData?.keelLaidDate).format("DD/MM/YYYY") : "-"}</td>
      <td style="font-size:14px;"><strong>Date of building contract:</strong> ${clientData?.dateOfBuildingContract ? moment(clientData?.dateOfBuildingContract).format("DD/MM/YYYY") : "-"}</td>
    </tr>
    <tr>
      <td style="font-size:14px;"><em><strong>Length of ship:</strong></em> ${clientData?.lengthOfShip || "-"}</td>
      <td style="font-size:14px;"><strong>Area of operation:</strong> ${clientData?.areaOfOperation || "-"}</td>
    </tr>
    <tr>
      <td style="font-size:14px;"><em><strong>Date of delivery:</strong></em> ${clientData?.dateOfDelivery ? moment(clientData?.dateOfDelivery).format("DD/MM/YYYY") : "-"}</td>
      <td style="font-size:14px;"><em><strong>Date of modification:</strong></em> ${clientData?.dateOfModification ? moment(clientData?.dateOfModification).format("DD/MM/YYYY") : "-"}</td>
    </tr>
    <tr>
      <td style="font-size:14px;" colspan="2"><em><strong>Carrying capacity:</strong></em> ${clientData?.carryingCapacity || "-"}</td>
    </tr>
  </tbody>
</table>

            </div>
            
            <div class="page">
                <h2>Owner / Manager Information</h2>
                
                <h4>Registered Owner</h4>
                <div class="owner-info">
                    <div><em><strong>Company Name:</strong></em> ${clientData?.ownerDetails?.companyName || "-"}</div>
                    <div><em><strong>IMO Number:</strong></em> ${clientData?.ownerDetails?.imoNumber || "-"}</div>
                    <div><em><strong>Address:</strong></em> ${clientData?.ownerDetails?.companyAddress || "-"}</div>
                </div>
                
                <h4 style="color:black">Manager</h4>
                <div class="owner-info">
                    <div><em><strong>Company Name:</strong></em> ${clientData?.managerDetails?.companyName || "-"}</div>
                    <div><em><strong>IMO Number:</strong></em> ${clientData?.managerDetails?.imoNumber || "-"}</div>
                    <div><em><strong>Address:</strong></em> ${clientData?.managerDetails?.companyAddress || "-"}</div>
                </div>
            </div>
            
            ${htmlString}
        
            <div class="page">
                <h4 style="color:black">Surveys / Audits / Inspections</h4>
                
                ${classificationSurveyTableHtml}
                
                ${statutorySurveyTableHtml}

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
line-height: 1.5;
font-size: 14px;
background: #f8f9fa;
}
.cover-page {
text-align: center !important;
display: flex !important;
flex-direction: column !important;
justify-content: center !important;
align-items: center !important;
min-height: 200px !important;
background:white;
color: #667eea;
padding: 60px !important;
}
.index-page {
width: 8.5in;
background-color: white;
position: relative;
height: 100%;
}
.page {
width: 8.5in;
min-height: 11in;
margin: 20px auto;
padding: 40px;
background-color: white;
position: relative;
box-shadow: 0 4px 20px rgba(0,0,0,0.1);
border-radius: 8px;
}

.cover-page {
text-align: center;
display: flex;
flex-direction: column;
justify-content: center;
align-items: center;
color: #667eea;
}

.company-logo {
width: 140px;
height: 140px;
margin-bottom: 30px;
}

.ship-name {
font-size: 32px;
font-weight: bold;
margin: 30px 0;
color: black;
}

.ship-details {
background: rgba(255,255,255,0.1);
padding: 30px;
border-radius: 15px;
backdrop-filter: blur(10px);
color: black;
}

.ship-details p {
font-size: 16px;
margin: 10px 0;
color: black;
}

.toc-page {
background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.toc-title {
text-align: center;
font-size: 28px;
color: #2c3e50;
margin-bottom: 50px;
font-weight: bold;
}

.toc-table {
background: white;
border-radius: 10px;
box-shadow: 0 10px 30px rgba(0,0,0,0.1);
overflow: hidden;
}

.toc-table td {
padding: 15px 25px;
border-bottom: 1px solid #ecf0f1;
font-size: 14px;
color: #2c3e50;
}

.content-page {
background: white;
}

h2 {
color: #2980b9;
font-size: 24px;
margin: 0 0 30px 0;
padding-bottom: 10px;
border-bottom: 3px solid #3498db;
font-weight: bold;
}

h4 {
color: #34495e;
font-size: 16px;
margin: 25px 0 15px 0;
padding-bottom: 8px;
border-bottom: 2px solid #bdc3c7;
font-weight: 600;
}

.section {
margin-bottom: 40px;
padding: 25px;
background: #f8f9fa;
border-radius: 10px;
border-left: 5px solid #3498db;
}

.identification-row, .hull-row {
display: flex;
margin-bottom: 12px;
padding: 12px;
background: white;
border-radius: 6px;
box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.identification-row .left, .hull-row .left {
width: 300px;
font-weight: 600;
color: #2c3e50;
}

.identification-row .right, .hull-row .right {
flex: 1;
color: #34495e;
font-size: 14px;
}

.owner-info div {
margin-bottom: 10px;
padding: 12px;
font-size: 14px;
background: white;
border-radius: 6px;
border-left: 4px solid #3498db;
box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

strong {
font-weight: 600;

}

em {
font-style: italic;
}

p.subtitle {
font-size: 13px;
text-align: center;
margin: 10px 0 25px 0;
color: #7f8c8d;
font-style: italic;
}

table {
width: 100%;
margin: 20px 0;
background: white;
border-radius: 8px;
overflow: hidden;

box-shadow: 0 4px 15px rgba(0,0,0,0.1);
border-collapse: collapse;
}

table th {
background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
color: white;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.5px;
font-size: 12px;
padding: 15px 12px;
}

table td {
padding: 12px;
border-bottom: 1px solid #ecf0f1;
color: #2c3e50;
font-size: 11px;
}

table tr:nth-child(even) {
background: #f8f9fa;
}

table tr:hover {
background: #e3f2fd;
}

.status-icon {
font-size: 12px;
font-weight: bold;
border-radius: 50%;
width: 20px;
height: 20px;
display: inline-flex;
justify-content: center;
align-items: center;
color: white;
}

.expired {
background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
box-shadow: 0 2px 8px rgba(231, 76, 60, 0.4);
}

.expiring1m {
background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
box-shadow: 0 2px 8px rgba(243, 156, 18, 0.4);
clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
}

.expiring3m {
background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
box-shadow: 0 2px 8px rgba(39, 174, 96, 0.4);
}

.section-title {
font-weight: 600;
font-size: 16px;
margin: 25px 0 10px 0;
color: #2c3e50;
padding-bottom: 5px;
border-bottom: 2px solid #3498db;
}

.legend {
display: flex;
justify-content: center;
align-items: center;
gap: 30px;
margin: 25px 0;
padding: 20px;
background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
border-radius: 10px;
border: 1px solid #dee2e6;
}

.legend-item {
display: inline-flex;
align-items: center;
gap: 8px;
font-size: 13px;
font-weight: 500;
color: #495057;
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
