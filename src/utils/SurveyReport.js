import { Editor } from "@tinymce/tinymce-react";
import { useEffect, useState, useCallback } from "react";
import { fetchAdditionalDetails, getAllSystemVariables, getSpecificClient, getSurveyReportDataByJournalId, getVisitDetails, uploadSurveyReport } from "../api";
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
  const [additionalFieldData, setAdditionalFieldData] = useState([]);
  const [places, setPlaces] = useState([]);
  const [isLastVisit, setIsLastVisit] = useState(false);
  const currentDate = new Date();

  const formatSurveyName = (name) => {
    if (!name) return "";
    return name
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getAdditionalFields = async () => {
    try {
      const response = await fetchAdditionalDetails(id);
      setAdditionalFieldData(response?.data?.data || []);
    } catch (err) {
      console.error("fetchAdditionalDetails error", err);
    }
  };

  useEffect(() => {
    getAdditionalFields();
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
  }, [id]);

  const matchesReportNumber = (item, reportNumber) => {
    if (!reportNumber) return true;
    const ref = item?.referenceNo?.toString() || "";
    const journalTypeId = item?.journalTypeId?.toString() || "";

    if (ref && ref === reportNumber) return true;
    if (journalTypeId && journalTypeId === reportNumber) return true;

    if (ref && reportNumber.includes(ref)) return true;

    const digits = (reportNumber.match(/\d+/g) || []).join("");
    if (digits && ref && digits === ref) return true;

    return false;
  };

  const generateHtmlContent = useCallback(
    (reportDetailsInput, additionalFieldDataInput = []) => {
      if (!reportDetailsInput || !systemVariables) return "";

      const formatValue = (val) => (val || val === 0 ? val : "-");
      const companyName = systemVariables?.data?.find((i) => i.name === "company_name")?.information || "-";
      const companyLogo = systemVariables?.data?.find((i) => i.name === "company_logo")?.information || "-";
      const stamp = systemVariables?.data?.find((i) => i.name === "company_stamp")?.information || "-";
      const issuer = reportDetailsInput?.map((i) => i?.issuer?.name);
      const portOfSurvey = reportDetailsInput?.map((i) => i?.place?.toLowerCase());

      const uniquePorts = [...new Set(portOfSurvey)].join(",").toUpperCase();
      const uniqueSurveyors = [...new Set(issuer)].join(",").toUpperCase();

      const classificationRows = (() => {
        if (!reportDetailsInput?.length)
          return `
    <tr>
      <td colspan="3" style="text-align:center;padding:6px;">No Records</td>
    </tr>
  `;

        const validCerts = reportDetailsInput.filter((cert) => cert?.activity?.surveyTypes?.classificationSurvey === true && cert?.activity?.surveyTypes?.report && cert?.activity?.surveyTypes?.report?.name);

        if (!validCerts.length) {
          return `

          
      <tr>
        <td colspan="3" style="text-align:center;padding:6px;">No Records</td>
      </tr>
    `;
        }

        const latestMap = {};
        validCerts.forEach((cert) => {
          const reportName = cert?.activity?.surveyTypes?.report?.name;
          if (!reportName) return;
          if (!latestMap[reportName] || new Date(cert?.issuanceDate || 0) > new Date(latestMap[reportName]?.issuanceDate || 0)) {
            latestMap[reportName] = cert;
          }
        });

        const rows = Object.values(latestMap)
          .filter((cert) => cert?.activity?.surveyTypes?.report?.name)
          .map((cert) => {
            const formattedName = formatSurveyName(cert?.activity?.surveyTypes?.name);
            const status = cert?.activity?.status || "";
            return `
        <tr>
          <td style="text-align:left;padding:6px;">${formattedName}</td>
          <td style="text-align:center;padding:6px;">${status}</td>
<td style="text-align:center; padding:6px;">
  ${isLastVisit === true || isLastVisit === "true" ? moment(lastVisit).format("DD/MM/YYYY") : "-"}
</td>

        </tr>
      `;
          });

        return rows.length
          ? rows.join("")
          : `
      <tr>
        <td colspan="3" style="text-align:center;padding:6px;">No Records</td>
      </tr>
    `;
      })();

      const latestReportsMap = {};
      reportDetailsInput?.forEach((cert) => {
        const reportName = cert?.activity?.surveyTypes?.report?.name;
        if (!reportName) return;
        if (!latestReportsMap[reportName] || new Date(cert?.issuanceDate || 0) > new Date(latestReportsMap[reportName]?.issuanceDate || 0)) {
          latestReportsMap[reportName] = cert;
        }
      });

      const latestReports = Object.values(latestReportsMap);

      const surveyRows =
        latestReports && latestReports.length > 0
          ? latestReports
              .map((cert) => {
                const type = cert?.typeOfCertificate === "short_term" ? "ST" : cert?.typeOfCertificate === "full_term" ? "FT" : cert?.typeOfCertificate === "intrim" ? "IT" : cert?.typeOfCertificate === "extended" ? "ET" : cert?.typeOfCertificate || "[Type]";

                return `
            <tr>
              <td>${cert?.activity?.surveyTypes?.report?.name || "-"}</td>
              <td style="text-align:center;">${type}</td>
              <td style="text-align:center;">${cert?.endorsementDate ? moment(cert.endorsementDate).format("DD/MM/YYYY") : "-"}</td>
              <td>${cert?.activity?.surveyTypes?.name || "-"}</td>
              <td style="text-align:center;">${cert?.issuanceDate ? moment(cert.issuanceDate).format("DD/MM/YYYY") : "-"}</td>
              <td style="text-align:center;">${cert?.validityDate ? moment(cert.validityDate).format("DD/MM/YYYY") : "-"}</td>
            </tr>
          `;
              })
              .join("")
          : `
       <tr>
        <td colspan="6" style="text-align:center;padding:6px;">No Records</td>
      </tr>
    `;

      const renderAdditionalFields = () => {
        if (!Array.isArray(additionalFieldDataInput) || !additionalFieldDataInput.length) return "";

        const sectionOrder = ["coc", "statutory", "memoranda", "additional", "compliance", "pcsfsi", "psc/fsi"];

        const titleForKey = (k) => {
          if (!k) return "Other";
          const key = k.toLowerCase();

          switch (key) {
            case "coc":
              return "Condition of Class";
            case "statutory":
              return "Statutory";
            case "memoranda":
              return "Memoranda";
            case "additional":
              return "Additional Information";
            case "compliance":
              return "Compliance to New Regulations";
            case "pcsfsi":
            case "psc/fsi":
              return "PSC / FSI Deficiency";
            default:
              return k.toUpperCase();
          }
        };

        // Sort sections based on defined order
        const sortedSections = [...additionalFieldDataInput].sort((a, b) => {
          const idxA = sectionOrder.indexOf(a.sectionKey?.toLowerCase());
          const idxB = sectionOrder.indexOf(b.sectionKey?.toLowerCase());
          if (idxA === -1 && idxB === -1) return 0;
          if (idxA === -1) return 1;
          if (idxB === -1) return -1;
          return idxA - idxB;
        });

        const sectionsHtml = sortedSections
          .map((section) => {
            const rows = Array.isArray(section.data) ? section.data : section.data || [];
            const matchedRows = rows.filter((r) => matchesReportNumber(r, reportNumber));

            if (!matchedRows.length) return "";

            const rowsHtml = matchedRows
              .map((r) => {
                const due = r?.dueDate ? moment(r.dueDate).format("DD/MM/YYYY") : "-";
                const status = r?.action || "-";
                return `
            <tr>
              <td style="padding:8px;border:1px solid #ccc;text-align:left;">${formatValue(r?.code)}</td>
              <td style="padding:8px;border:1px solid #ccc;text-align:left;">${formatValue(r?.description)}</td>
              <td style="padding:8px;border:1px solid #ccc;text-align:center;">${status}</td>
              <td style="padding:8px;border:1px solid #ccc;text-align:center;">${due}</td>
            </tr>
          `;
              })
              .join("");

            return `
        <h3 style="margin-top:18px;margin-bottom:8px;font-size:16px;color:#003366;">
          ${titleForKey(section.sectionKey)}
        </h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:12px;font-size:13px;">
          <thead>
            <tr>
              <th style="padding:8px;border:1px solid #ccc;background:#f3f3f3;text-align:left;width:10%;">Code</th>
              <th style="padding:8px;border:1px solid #ccc;background:#f3f3f3;text-align:left;width:60%">Description</th>
              <th style="padding:8px;border:1px solid #ccc;background:#f3f3f3;text-align:center;width:15%">Status</th>
              <th style="padding:8px;border:1px solid #ccc;background:#f3f3f3;text-align:center;width:25%">Due Date</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      `;
          })
          .join("");

        return sectionsHtml;
      };

      const mainDetailsHtml = `
        <table style="border-collapse:collapse;width:100%;margin-bottom:12px;font-size:14px;">
          <tr>
            <td style="padding:8px;border:1px solid #ccc;width:30%;">Ship's Name</td>
            <td style="padding:8px;border:1px solid #ccc;">${formatValue(clientData?.shipName)}</td>
            <td style="padding:8px;border:1px solid #ccc;width:15%;">Report No</td>
            <td style="padding:8px;border:1px solid #ccc;">${reportDetailsInput[0]?.activity?.journal?.journalTypeId || "—"}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #ccc;">Date of Build</td>
            <td style="padding:8px;border:1px solid #ccc;">${clientData?.dateOfBuild ? moment(clientData.dateOfBuild).format("DD/MM/YYYY") : "—"}</td>
            <td style="padding:8px;border:1px solid #ccc;">Ship Type</td>
            <td style="padding:8px;border:1px solid #ccc;">${formatValue(clientData?.typeOfShip)}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #ccc;">IMO Number</td>
            <td style="padding:8px;border:1px solid #ccc;">${formatValue(clientData?.imoNumber)}</td>
            <td style="padding:8px;border:1px solid #ccc;">Flag</td>
            <td style="padding:8px;border:1px solid #ccc;">${formatValue(clientData?.flag)}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #ccc;">First Visit</td>
            <td style="padding:8px;border:1px solid #ccc;">${firstVisit ? moment(firstVisit).format("DD/MM/YYYY") : "—"}</td>
            <td style="padding:8px;border:1px solid #ccc;">Last Visit</td>
            <td style="padding:8px;border:1px solid #ccc;">${isLastVisit === true || isLastVisit === "true" ? moment(lastVisit).format("DD/MM/YYYY") : "-"}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #ccc;">No. of Visits</td>
            <td style="padding:8px;border:1px solid #ccc;">${numOfVisit || "—"}</td>
            <td style="padding:8px;border:1px solid #ccc;">Port of Survey</td>
            <td style="padding:8px;border:1px solid #ccc;">${places || "—"}</td>
          </tr>
        </table>
      `;

      return `
        <div class="page" style="font-family: 'Times New Roman', serif; background:#fff; padding:30px;">
          <div class="certificate-header" style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px double #003366;padding-bottom:12px;margin-bottom:18px;">
            <div class="header-left">${companyLogo ? `<img src="${companyLogo}" alt="Logo" style="max-width:140px;height:auto;" />` : ""}</div>
            <div class="header-right" style="text-align:right;">
              <h2 style="margin:0;color:#003366;font-size:22px;text-transform:uppercase">${companyName}</h2>
              <p style="margin:6px 0 0 0;font-size:16px;font-weight:700">SURVEY REPORT</p>
            </div>
          </div>

          ${mainDetailsHtml}
 <h4>Recommendation</h4>
        <p style="font-size:16px;">The following surveys have been carried out on the above ship in accordance with the relevant Rules and Statutory regulations and the items
examined as detailed hereon were found to comply with the said rules and regulations unless otherwise stated in this report. It is recommended
to the Commitee of ${companyName} that the ship remains as classed with new dates of survey as shown, subject to any Conditions
of Class recommended now or previously, being dealt with as recommended.</p>

          <h4 style="color:#003366;margin-top:14px;border-bottom:1px solid #999;padding-bottom:6px;">Statutory Surveys</h4>
          <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
            <thead>
              <tr>
                <th style="padding:8px;border:1px solid #ccc;background:#f3f3f3;">Survey Name</th>
                <th style="padding:8px;border:1px solid #ccc;background:#f3f3f3;">Cert. Term</th>
                <th style="padding:8px;border:1px solid #ccc;background:#f3f3f3;">Endorsed</th>
                <th style="padding:8px;border:1px solid #ccc;background:#f3f3f3;">Survey Type</th>
                <th style="padding:8px;border:1px solid #ccc;background:#f3f3f3;">Issued / Extended</th>
                <th style="padding:8px;border:1px solid #ccc;background:#f3f3f3;">Expiry Date</th>
              </tr>
            </thead>
            <tbody>
              ${surveyRows}
            </tbody>
          </table>

          <h4 style="color:#003366;margin-top:10px;border-bottom:1px solid #999;padding-bottom:6px;">Classification Surveys</h4>
          <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
            <thead>
              <tr>
                <th style="padding:8px;border:1px solid #ccc;background:#f3f3f3;">Survey Name</th>
                <th style="padding:8px;border:1px solid #ccc;background:#f3f3f3;">Status</th>
                <th style="padding:8px;border:1px solid #ccc;background:#f3f3f3;">Date</th>
              </tr>
            </thead>
            <tbody>
              ${classificationRows}
            </tbody>
          </table>

          ${renderAdditionalFields()}

          <div style="margin-top:12px;">
            <div class="stamp">${stamp ? `<img src="${stamp}" width="100" height="100" alt="Stamp" />` : ""}</div>
            <h4 style="color:#003366;margin-top:18px;border-bottom:1px solid #999;padding-bottom:6px;">Surveyors and Authorization</h4>
            <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
              <tr>
                <td style="padding:8px;border:1px solid #ccc;">Surveyors</td>
                <td style="padding:8px;border:1px solid #ccc;">${uniqueSurveyors || "-"}</td>
                <td style="padding:8px;border:1px solid #ccc;">Reviewed On</td>
                <td style="padding:8px;border:1px solid #ccc;">${moment(new Date()).format("DD/MM/YYYY")}</td>
              </tr>
              <tr>
                <td style="padding:8px;border:1px solid #ccc;">Port</td>
                <td style="padding:8px;border:1px solid #ccc;">${places || "-"}</td>
                <td style="padding:8px;border:1px solid #ccc;">Date</td>
                <td style="padding:8px;border:1px solid #ccc;">${moment(new Date()).format("DD/MM/YYYY")}</td>
              </tr>
            </table>
          </div>

          <p style="font-size:12px;margin-top:12px;">
            <strong>Note:</strong> Cert. Term - FT = Full Term, ST = Short Term, ET = Extended, IT = Interim, PROV = Provisional
          </p>


          <div class="certificate-footer" style="margin-top:18px;">© ${companyName} | Generated on ${moment(currentDate).format("DD-MM-YYYY")}</div>
        </div>
      `;
    },
    [systemVariables, clientData, firstVisit, lastVisit, numOfVisit, currentDate, reportNumber]
  );

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
              setLastVisit(visits[0]?.date);
              setFirstVisit(visits[visits.length - 1]?.date);
              setNumOfVisit(visits.length);
              setIsLastVisit(visits[0].journal?.isLocked);
              const places = visits.map((visit) => visit?.location?.replace(/\s*\(.*?\)\s*/g, "").trim()).filter(Boolean);
              setPlaces(places);
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
  }, [id, reportNumber]);

  useEffect(() => {
    // when data and additionalFieldData are available, set editor content
    if (clientData && reportDetails && systemVariables && !loading) {
      const html = generateHtmlContent(reportDetails, additionalFieldData);
      setEditorContent(html);
    }
  }, [clientData, reportDetails, systemVariables, loading, generateHtmlContent, additionalFieldData]);

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

      const contentHeight = Math.max(contentBody.scrollHeight, contentBody.offsetHeight, contentBody.clientHeight, contentDocument.documentElement.scrollHeight, contentDocument.documentElement.offsetHeight);

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

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

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
      const pages = [];

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
      formData.append("reportNumber", reportDetails[0]?.activity?.journal?.journalTypeId);
      formData.append("surveyType", reportDetails[0]?.activity?.surveyTypes?.name);
      formData.append("generatedDoc", file);

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

  const getClassRangeIcon = (currentDateParam, rangeFrom, rangeTo) => {
    const today = moment(currentDateParam, "YYYY-MM-DD");
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
            .certificate-header .header-right { text-align: right; }
            .certificate-header .company-name { color: #003366; font-size: 22px; margin: 0; text-transform: uppercase; }
            .certificate-header .report-title { font-weight: 700; font-size: 16px; color: #000; margin: 2px 0 0 0; text-transform: uppercase; }
            h2 { color: #003366; font-family: 'Times New Roman', serif; text-align: center; }
            h4 { text-align: left; border-bottom: 1px solid #999; font-size:20px; color: #003366; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size:14px; }
            th, td { border: 1px solid #999; padding: 6px 8px; }
            th { background-color: #f3f3f3; color: #003366; }
            .stamp{ margin-top:10px; }
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
