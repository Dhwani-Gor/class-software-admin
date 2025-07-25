import { Editor } from '@tinymce/tinymce-react';
import { useEffect, useState, useCallback } from "react";
import { getAllSystemVariables, getSpecificClient, getSurveyReportData, getVisitDetails, uploadSurveyReport } from "../api";
import { toast } from "react-toastify";
import { PDFDocument } from "pdf-lib";
import html2canvas from "html2canvas";
import moment from 'moment';
import CommonButton from '@/components/CommonButton';
import { Box } from '@mui/material';
import Loader from '@/components/Loader';
import { useRouter } from 'next/navigation';

const SurveyReport = ({ id }) => {
  const router = useRouter()
  const [reportDetails, setReportDetails] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editorContent, setEditorContent] = useState('');
  const [systemVariables, setSystemVariables] = useState(null);
  const [firstVisit, setFirstVisit] = useState(null);
  const [lastVisit, setLastVisit] = useState(null);
  const [numOfVisit, setNumOfVisit] = useState(null);
  const [journalId, setJournalId] = useState('');
const currentDate = new Date();
console.log(reportDetails,"reportDetails")
  useEffect(() => {
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
      contentBody.style.overflow = 'visible';
      contentBody.style.height = 'auto';
      contentBody.style.maxHeight = 'none';

      await document.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(contentBody, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: contentBody.scrollWidth,
        windowHeight: contentBody.scrollHeight,
      });

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const pdfDoc = await PDFDocument.create();

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 40;
      const usableWidth = pageWidth - 2 * margin;
      const usableHeight = pageHeight - 2 * margin;

      const scaleFactor = usableWidth / imgWidth;
      const buffer = 50;
      const pageHeightInCanvas = (usableHeight - buffer) / scaleFactor;

      const totalPages = Math.ceil(imgHeight / pageHeightInCanvas);

      for (let i = 0; i < totalPages; i++) {
        const startY = i * pageHeightInCanvas;
        const sliceHeight = Math.min(pageHeightInCanvas, imgHeight - startY + buffer); // add buffer

        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = imgWidth;
        sliceCanvas.height = sliceHeight;

        const ctx = sliceCanvas.getContext("2d");
        ctx.drawImage(
          canvas,
          0, startY,
          imgWidth, sliceHeight,
          0, 0,
          imgWidth, sliceHeight
        );

        const sliceDataUrl = sliceCanvas.toDataURL("image/png");
        const pngImage = await pdfDoc.embedPng(sliceDataUrl);
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

        const textWidth = pageText.length * 5.5;
        page.drawText(pageText, {
          x: pageWidth - margin - textWidth,
          y: footerY,
          size: 10,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });

      const file = new File([blob], "survey-report.pdf", { type: "application/pdf" });
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
      link.download = `MCB Survey Report - ${clientData?.imoNumber}-${clientData?.shipName}-${moment(currentDate).format("DD-MM-YYYY")}.pdf`;
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

  const generateHtmlContent = useCallback(() => {
    if (!clientData || !reportDetails || !systemVariables) return '';

    const companyName = systemVariables?.data?.find(item => item.name === "company_name")?.information || '-';
    const companyLogo = systemVariables?.data?.find(item => item.name === "company_logo")?.information || '-';
    const stamp = systemVariables?.data?.find(item => item.name === "company_stamp")?.information || '-';
    const issuer = reportDetails?.map((item) => item?.issuer?.name);
    const portOfSurvey = reportDetails?.map((item) => item?.place?.toLowerCase());
    const uniquePorts = [...new Set(portOfSurvey)].join(',').toUpperCase();
    const uniqueSurveyors = [...new Set(issuer)].join(',').toUpperCase();


    const surveyRows = reportDetails
      ?.map((cert) => {
        const type = cert?.typeOfCertificate === "short_term"
          ? "ST"
          : cert?.typeOfCertificate === "full_term"
            ? "FT"
            : cert?.typeOfCertificate === "intrim"
              ? "IT"
              : cert?.typeOfCertificate === "extended"
                ? "ET"
                : cert?.typeOfCertificate || "[Type]";

        return `
            <tr>
              <td>${cert?.activity?.surveyTypes?.report?.name}</td>
              <td style="text-align: center;">${type}</td>
              <td style="text-align: center;">${cert?.endorsementDate ? moment(cert.endorsementDate).format('DD/MM/YYYY') : '-'}</td>
              <td>${cert?.activity?.surveyTypes?.name}</td>
              <td style="text-align: center;">${cert?.issuanceDate ? moment(cert.issuanceDate).format('DD/MM/YYYY') : ''}</td>
              <td style="text-align: center;">${cert?.validityDate ? moment(cert.validityDate).format('DD/MM/YYYY') : ''}</td>
            </tr>
          `;
      })
      .join("");

    const certificatesTableHtml = `
      <h4>Surveys</h4>
      <table>
        <thead>
          <tr>
            <th>Survey Name</th>
            <th>Cert.Term</th>
            <th>Endorsed</th>
            <th>Survey Type</th>
            <th>Issued or Extended</th>
            <th>Expiry Date</th>
          </tr>
        </thead>
        <tbody>
          ${surveyRows}
        </tbody>
      </table>
    `;

    return `
        <div class="page">
        
        <div style="background-color: white; color: black;display: flex; justify-content: space-around;">
        <img src=${companyLogo} alt="companyLogo" height="100" width="100" />
        <div style="display: flex; flex-direction: column;">
          <p>${companyName}</p>
          <p style="margin-top: -10px">Survey Report</p>
        </div>
     <div style="justifyContent: start; display: flex; backgroundColor: white; color: black; padding: 60px">
</div>

    </div>

 <table class="three-columns-table" style="width: 100%; border: 1px dotted gray;">
    <tr style="border: 1px dotted gray;">
      <td class="label" style="border: 1px dotted gray;"><strong>Ship's Name:</strong></td>
      <td style="border: 1px dotted gray;">${clientData?.shipName || '-'}</td>
            <td class="label" style="border: 1px dotted gray;"><strong></strong></td>

      <td class="label" style="border: 1px dotted gray;"><strong></strong></td>
      <td class="label" style="border: 1px dotted gray;"><strong>Report No:</strong></td>
      <td style="border: 1px dotted gray;">${journalId}</td>

    </tr>
    <tr style="border: 1px dotted gray;">
      <td class="label" style="border: 1px dotted gray;"><strong>Date of Build:</strong></td>
      <td style="border: 1px dotted gray;">${clientData && moment(clientData?.dateOfBuild).format('DD/MM/YYYY') || '-'}</td>
      <td class="label" style="border: 1px dotted gray;"><strong>Ship Type:</strong></td>
      <td style="border: 1px dotted gray;">${clientData?.typeOfShip || '-'}</td>
      <td class="label" style="border: 1px dotted gray;"><strong>Flag:</strong></td>
      <td style="border: 1px dotted gray;">${clientData?.flag || '-'}</td>
    </tr>
    <tr style="border: 1px dotted gray;">
      <td style="border: 1px dotted gray;"><strong>IMO Number:</strong></td>
      <td style="border: 1px dotted gray;">${clientData?.imoNumber || '-'}</td>
      <td style="border: 1px dotted gray;"><strong>First Visit:</strong></td>
      <td style="border: 1px dotted gray;">${firstVisit ? moment(firstVisit).format('DD/MM/YYYY') : '-'}</td>
      <td style="border: 1px dotted gray;"><strong>Port of Survey:</strong></td>
      <td style="border: 1px dotted gray;">${uniquePorts || '-'}</td>
    </tr>
    <tr style="border: 1px dotted gray;">
      <td style="border: 1px dotted gray;"><strong>Port of Registry:</strong></td>
      <td style="border: 1px dotted gray;">${clientData?.portOfRegistry || '-'}</td>
      <td style="border: 1px dotted gray;"><strong>Last Visit:</strong></td>
      <td style="border: 1px dotted gray;">${lastVisit ? moment(lastVisit).format('DD/MM/YYYY') : '-'}</td>
      <td style="border: 1px dotted gray;"><strong>No of Visits:</strong></td>
      <td style="border: 1px dotted gray;">${numOfVisit || '-'}</td>
    </tr>
    <tr style="border: 1px dotted gray;">
      <td class="label" style="border: 1px dotted gray;"><strong>Gross Tons:</strong></td>
      <td style="border: 1px dotted gray;">${clientData?.grossTonnage || '-'}</td>
      <td style="border: 1px dotted gray;"></td>
      <td style="border: 1px dotted gray;"></td>
      <td style="border: 1px dotted gray;"></td>
      <td style="border: 1px dotted gray;"></td>
    </tr>
  </table>

  <h4 style="margin-top: 40px; font-weight: bold;">Recommendation</h4>
  <p style="margin-bottom: -40px;">
    The following surveys have been carried out on the above ship in accordance with the relevant Rules and
    Statutory regulations and the items examined as detailed hereon were found to comply with the said rules and
    regulations unless otherwise stated in this report. It is recommended to <strong>${companyName}</strong> that the ship
    remains as classed with new dates of survey as shown, subject to any Conditions of Class recommended now
    or previously, being dealt with as recommended.
  </p>
  </div>
    <div class="page">
        ${certificatesTableHtml}
        <div><img src="${stamp}" width="100" height="100" alt="Stamp" /></div>
        <table style="width: 100%; border: 1px dotted gray;">
  <tr style="border: 1px dotted gray;">
    <td style="border: 1px dotted gray;"><strong>Surveyors</strong></td>
    <td style="border: 1px dotted gray; word-wrap: break-word; width: 10%; ">${uniqueSurveyors || '-'}</td>
    <td style="border: 1px dotted gray;"><strong>This Report is Reviewed and Authorized by:</strong></td>
  </tr>
  <tr style="border: 1px dotted gray;">
    <td style="border: 1px dotted gray;"><strong>Port</strong></td>
    <td style="border: 1px dotted gray; word-wrap: break-word; width: 50%">${uniquePorts || '-'}</td>
    <td style="border: 1px dotted gray;"><strong>Reviewed On:</strong>  ${new Date().toLocaleDateString()}</td>
  </tr>
  <tr style="border: 1px dotted gray;">
    <td style="border: 1px dotted gray;"><strong>Date</strong></td>
    <td style="border: 1px dotted gray;">${new Date().toLocaleDateString()}</td>
  </tr>
</table>
        <div style="margin-top: 22px; font-size: 16px;"><strong>Note: </strong>Cert. Term - FT = Full Term, ST = Short Term, ET= Extended Term, INT = Interim, PROV = Provisional
</div>
    </div>
`;
  }, [clientData, reportDetails, systemVariables, journalId, firstVisit, lastVisit, numOfVisit]);

  // Single useEffect to load all data when id changes
  useEffect(() => {
    if (!id) return;

    const loadAllData = async () => {
      try {
        setLoading(true);
        setEditorContent(''); // Reset content

        // Load client data and report details in parallel
        const [clientResult, reportResult] = await Promise.all([
          getSpecificClient(id),
          getSurveyReportData(id)
        ]);

        if (clientResult?.status === 200) {
          setClientData(clientResult.data.data);
        } else {
          toast.error("Failed to load client data");
          return;
        }

        if (reportResult?.status === 200) {
          const reportData = reportResult.data.data;
          setReportDetails(reportData);

          // Extract unique journal ID
          const journalIds = reportData
            .map(item => item?.activity?.journal?.id)
            .filter(Boolean);
          const uniqueJournalId = [...new Set(journalIds)][0];

          if (uniqueJournalId) {
            setJournalId(uniqueJournalId);

            // Load visit details
            const visitResponse = await getVisitDetails('journalId', uniqueJournalId);
            const visits = visitResponse?.data?.data;

            if (visits?.length) {
              setFirstVisit(visits[0]?.date);
              setLastVisit(visits[visits.length - 1]?.date);
              setNumOfVisit(visits.length);
            }
          }
        } else {
          toast.error("Failed to load report data");
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error(error.message || "Error loading data");
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [id]);

  // Update editor content when data is ready
  useEffect(() => {
    const isDataReady = clientData && reportDetails && systemVariables && !loading;

    if (isDataReady) {
      const newContent = generateHtmlContent();
      setEditorContent(newContent);
    }
  }, [clientData, reportDetails, systemVariables, loading, generateHtmlContent]);

  const handleEditorChange = (content) => {
    setEditorContent(content);
    console.log('Editor content changed:', content);
  };

  // Show loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
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
          height: 600,
          menubar: true,
          visual: false,
          content_css: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
            'print', 'preview', 'searchreplace', 'wordcount', 'code', 'fullscreen'
          ],
          toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter alignright | outdent indent | link image | code fullscreen',
          readonly: false,
          setup: (editor) => {
            editor.on('input', () => {
              setTimeout(() => {
              }, 100);
            });
          },
          content_style: `
            body { 
              font-family: Arial, sans-serif; 
              margin: 0;
              padding: 20px;
              line-height: 1.4;
              font-size: 14px;
            }
            
            .page {
              width: 8.5in;
              margin: 0 auto;
              padding: 20px;
              background-color: white;
              position: relative;
            }

            h2 {
              color: #4884eb;
              text-align: center;
              font-size: 18px;
              margin: 0 0 30px 0;
              font-weight: bold;
            }

            h4 {
              color: #4884eb;
              font-size: 14px;
              margin: 20px 0 5px 0;
              padding-bottom: 2px;
              border-bottom: 1px solid #4884eb;
              font-weight: bold;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              margin-bottom: 20px;
            }
            td {
              vertical-align: top;
              padding: 5px;
            }
            td.label {
              font-weight: bold;
              width: 30%;
            }
            td.value {
              width: 30%;
            }
            .recommendation-title {
              font-weight: bold;
            }
            
            strong {
              font-weight: bold;
            }

            em {
              font-style: italic;
            }
          `
        }}
      />
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
        <CommonButton onClick={() => router.push('/clients')} text="Back" />
        <CommonButton onClick={downloadEditorContentAsPdf} text="Download PDF" />
      </Box>
    </>
  );
};

export default SurveyReport;