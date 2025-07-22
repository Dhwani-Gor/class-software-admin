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
  const [clientData, setClientData] = useState();
  const [loading, setLoading] = useState(true);
  const [editorContent, setEditorContent] = useState('');
  const [systemVariables, setSystemVariables] = useState();
  const [firstVisit, setFirstVisit] = useState();
  const [lastVisit, setLastVisit] = useState();
  const [numOfVisit, setNumOfVisit] = useState();
  const [journalId, setJournalId] = useState('');
  const [reportLoading, setReportLoading] = useState(true);

  const companyName = systemVariables?.data?.find(item => item.name === "company_name")?.information || '[companyName]';
  const companyLogo = systemVariables?.data?.find(item => item.name === "company_logo")?.information || '[logoUrl]';
  const stamp = systemVariables?.data?.find(item => item.name === "company_stamp")?.information || '[stamp]';
  const issuer = reportDetails?.map((item) => item?.issuer?.name)
  const reportId = reportDetails?.map((item) => item?.activity?.surveyTypes?.report?.id)
  const portOfSurvey = reportDetails?.map((item) => item?.place.toLowerCase())
  const uniquePorts = [...new Set(portOfSurvey)].join(',').toUpperCase();
  const uniqueSurveyors = [...new Set(issuer)].join(',').toUpperCase();

  const getVisitInfo = async (journalId) => {
    try {
      const response = await getVisitDetails('journalId', journalId);
      const visits = response?.data?.data;
      if (visits?.length) {
        setFirstVisit(visits[0]?.updatedAt);
        setLastVisit(visits[visits.length - 1]?.updatedAt);
        setNumOfVisit(visits.length);
      }
    } catch (error) {
      console.error("Failed to get visit info:", error);
    }
  };

  useEffect(() => {
    console.log("reportDetails",reportDetails);
    if (reportDetails && Array.isArray(reportDetails)) {
      const journalIds = reportDetails.map(item => item?.activity?.journal?.id).filter(Boolean);
      console.log("journalIds",journalIds);
      const uniqueJournalIds = [...new Set(journalIds)];
      console.log("uniqueJournalIds",uniqueJournalIds);
  
      if (uniqueJournalIds[0]) {
        setJournalId(uniqueJournalIds[0]);
        getVisitInfo(uniqueJournalIds[0]).finally(() => setLoading(false));
      } else {
        setFirstVisit(null);
        setLastVisit(null);
        setNumOfVisit(null);
        setLoading(false);
      }
    }
  }, [reportDetails]);

  useEffect(() => {
    getSystemVariables()
  }, [])


  const getSystemVariables = async () => {
    try {
      const response = await getAllSystemVariables();
      if (response?.status === 200) {
        setSystemVariables(response?.data);
      }
    } catch (error) {
      console.log(error);
    }
  }
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

      await new Promise(resolve => setTimeout(resolve, 100));

      const lastElement = contentBody.querySelector('.page:last-child');
      const totalHeight = lastElement ? lastElement.offsetTop + lastElement.offsetHeight : contentBody.scrollHeight;

      const canvas = await html2canvas(contentBody, {
        scale: 2,
        height: totalHeight,
        width: contentBody.scrollWidth,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: contentBody.scrollWidth,
        windowHeight: totalHeight
      });

      const imgData = canvas.toDataURL("image/png");
      const pdfDoc = await PDFDocument.create();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const aspectRatio = imgHeight / imgWidth;

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 40;
      const maxWidth = pageWidth - 2 * margin;
      const maxHeight = pageHeight - 2 * margin;

      let scaledWidth = maxWidth;
      let scaledHeight = scaledWidth * aspectRatio;

      if (scaledHeight > maxHeight) {
        const pagesNeeded = Math.ceil(scaledHeight / maxHeight);
        const heightPerPage = imgHeight / pagesNeeded;

        for (let i = 0; i < pagesNeeded; i++) {
          const page = pdfDoc.addPage([pageWidth, pageHeight]);

          const croppedCanvas = document.createElement('canvas');
          const croppedCtx = croppedCanvas.getContext('2d');

          croppedCanvas.width = imgWidth;
          croppedCanvas.height = heightPerPage;

          croppedCtx.drawImage(
            canvas,
            0, i * heightPerPage,
            imgWidth, heightPerPage,
            0, 0,
            imgWidth, heightPerPage
          );

          const croppedImgData = croppedCanvas.toDataURL("image/png");
          const pngImage = await pdfDoc.embedPng(croppedImgData);

          const croppedScaledHeight = (heightPerPage / imgWidth) * scaledWidth;

          page.drawImage(pngImage, {
            x: margin,
            y: pageHeight - margin - croppedScaledHeight,
            width: scaledWidth,
            height: croppedScaledHeight,
          });
        }
      } else {
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        const pngImage = await pdfDoc.embedPng(imgData);

        page.drawImage(pngImage, {
          x: margin,
          y: pageHeight - margin - scaledHeight,
          width: scaledWidth,
          height: scaledHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });

      const file = new File([blob], "survey-status-report.pdf", { type: "application/pdf" });
      const formData = new FormData();
      formData.append("clientId", id);
      formData.append("generatedDoc", file);

      const res = await uploadSurveyReport(formData);
      if (res) {
        toast.success("Survey Status Report Downloaded and Uploaded Successfully");
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "survey-status-report.pdf";
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
    if (!clientData || !reportDetails) return '';

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

        // const status = cert?.activity?.status;

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



    const htmlString = `
      ${certificatesTableHtml}
      
     
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
    ${loading ? <div>loading</div> : (

 `<table class="three-columns-table" style="width: 100%; border: 1px dotted gray;">
    <tr style="border: 1px dotted gray;">
      <td class="label" style="border: 1px dotted gray;"><strong>Ship’s Name:</strong></td>
      <td style="border: 1px dotted gray;">${clientData?.shipName || '-'}</td>
            <td class="label" style="border: 1px dotted gray;"><strong></strong></td>

      <td class="label" style="border: 1px dotted gray;"><strong></strong></td>
      <td class="label" style="border: 1px dotted gray;"><strong>Report No:</strong></td>
      <td style="border: 1px dotted gray;">${journalId}</td>
      <td style="border: 1px dotted gray;">${Number(journalId)}</td>

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
      <td style="border: 1px dotted gray;">${moment(firstVisit).format('DD/MM/YYYY') || '-'}</td>
      <td style="border: 1px dotted gray;"><strong>Port of Survey:</strong></td>
      <td style="border: 1px dotted gray;">${uniquePorts || '-'}</td>
    </tr>
    <tr style="border: 1px dotted gray;">
      <td style="border: 1px dotted gray;"><strong>Port of Registry:</strong></td>
      <td style="border: 1px dotted gray;">${clientData?.portOfRegistry || '-'}</td>
      <td style="border: 1px dotted gray;"><strong>Last Visit:</strong></td>
      <td style="border: 1px dotted gray;">${moment(lastVisit).format('DD/MM/YYYY') || '-'}</td>
      <td style="border: 1px dotted gray;"><strong>No of Visits:</strong></td>
      <td style="border: 1px dotted gray;">${numOfVisit || '-'}</td>
    </tr>
    <tr style="border: 1px dotted gray;">
      <td class="label" style="border: 1px dotted gray;"><strong>Gross Tons:</strong></td>
      <td style="border: 1px dotted gray;">${clientData?.grossTonnage || '[grossTonnage]'}</td>
      <td style="border: 1px dotted gray;"></td>
      <td style="border: 1px dotted gray;"></td>
      <td style="border: 1px dotted gray;"></td>
      <td style="border: 1px dotted gray;"></td>
    </tr>
  </table>`)}

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
        ${htmlString}
        <div><img src="${stamp}" width="100" height="100" alt="Stamp" /></div>
        <table style="width: 100%; border: 1px dotted gray;">
  <tr style="border: 1px dotted gray;">
    <td style="border: 1px dotted gray;"><strong>Surveyors</strong></td>
    <td style="border: 1px dotted gray; word-wrap: break-word; width: 10%; ">${uniqueSurveyors || '[surveyors]'}</td>
    <td style="border: 1px dotted gray;"><strong>This Report is Reviewed and Authorized by:</strong></td>
  </tr>
  <tr style="border: 1px dotted gray;">
    <td style="border: 1px dotted gray;"><strong>Port</strong></td>
    <td style="border: 1px dotted gray; word-wrap: break-word; width: 50%">${uniquePorts || '[port]'}</td>
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
  }, [clientData, reportDetails]);

  useEffect(() => {
    if (clientData && reportDetails) {
      const newContent = generateHtmlContent();
      setEditorContent(newContent);
    }
  }, [clientData, reportDetails, generateHtmlContent]);

  const handleEditorChange = (content) => {
    setEditorContent(content);
    console.log('Editor content changed:', content);
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
    return <Box><Loader /></Box>;
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
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
            'print', 'preview', 'searchreplace', 'wordcount', 'code', 'fullscreen'
          ],
          toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter alignright | outdent indent | link image | code fullscreen',
          readonly: false,

          setup: (editor) => {
            // editor.on('input', () => {
            //     setTimeout(() => {
            //     }, 100);
            // });

            // editor.on('SetContent', () => {
            //     setTimeout(() => {
            //         updateStatusIcons(editor);
            //     }, 100);
            // });

            // editor.on('init', () => {
            //     setTimeout(() => {
            //         updateStatusIcons(editor);
            //     }, 500);
            // });

            // let timeoutId;
            // editor.on('keyup', () => {
            //     clearTimeout(timeoutId);
            //     timeoutId = setTimeout(() => {
            //         updateStatusIcons(editor);
            //     }, 500);
            // });

            // editor.on('paste', () => {
            //     setTimeout(() => {
            //         updateStatusIcons(editor);
            //     }, 200);
            // });
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
      // setup={(editor) => {
      //     updateStatusIcons(editor);
      // }}
      />
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
        <CommonButton onClick={() => router.push('/clients')} text="Back" />
        <CommonButton onClick={downloadEditorContentAsPdf} text="Download PDF" />
      </Box>
    </>
  );
};

export default SurveyReport;
