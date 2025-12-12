import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Tooltip,
  CircularProgress,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import CommonButton from '../CommonButton';
import html2pdf from 'html2pdf.js';
import { getAllSystemVariables } from '@/api';

const extractShipDetailsFromHTML = (htmlString) => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    const details = {
      shipName: '',
      irNo: '',
      imoNo: '',
      portOfSurvey: ''
    };

    const tables = doc.querySelectorAll('table');
    if (tables.length > 0) {
      const firstTable = tables[0];
      const cells = firstTable.querySelectorAll('td');

      cells.forEach((cell) => {
        const text = cell.textContent || '';

        if (text.includes('Name of Ship:')) {
          const match = text.match(/Name of Ship:\s*[.…]+([^.…]+)[.…]+/);
          if (match) details.shipName = match[1].trim();
        }

        if (text.includes('I. R. No.') || text.includes('I.R. No.')) {
          const match = text.match(/I\.?\s*R\.?\s*No\.?:\s*[.…]+([^.…]+)[.…]+/);
          if (match) details.irNo = match[1].trim();
        }

        if (text.includes('IMO No.')) {
          const match = text.match(/IMO No\.:\s*[.…]+([^.…]+)[.…]+/);
          if (match) details.imoNo = match[1].trim();
        }

        if (text.includes('Port of Survey:')) {
          const match = text.match(/Port of Survey:\s*[.…]+([^.…]+)[.…]+/);
          if (match) details.portOfSurvey = match[1].trim();
        }
      });
    }

    return details;
  } catch (error) {
    console.error('Error extracting ship details:', error);
    return {
      shipName: '',
      irNo: '',
      imoNo: '',
      portOfSurvey: ''
    };
  }
};

export const generateChecklistHTML = (item, companyName, companyLogo) => {
  const originalHTML = item?.checkListData?.checkList || '';
  const surveyType = item?.typeOfSurveyName || "Survey";
  const reportTitle = "Survey Checklist Report";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${reportTitle}</title>
  <style>
    @page {
      size: A4;
      margin: 10mm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
    }
    
    body {
      font-size: 14px;
      line-height: 1.6;
      color: #000;
      background: #ffffff;
      width: 210mm;
      margin: 0 auto;
    }

     /* Prevent page breaks within elements */
    table {
      page-break-inside: auto;
    }
    
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    
    thead {
      display: table-header-group;
    }
    
    tfoot {
      display: table-footer-group;
    }

    img, h1, h2, h3, h4, h5, h6 {
      page-break-inside: avoid;
      page-break-after: avoid;
    }

    p, li, div {
      page-break-inside: avoid;
    }

    .document-header {
      padding: 20px;
      margin-bottom: 20px;
      border-bottom: 3px solid #1976d2;
      ${!companyName && !companyLogo ? 'display: none;' : ''}
    }

    .header-layout {
      display: table;
      width: 100%;
    }

    .header-left, .header-center, .header-right {
      display: table-cell;
      vertical-align: middle;
    }

    .header-left, .header-right {
      width: 20%;
    }

    .header-center {
      width: 60%;
      text-align: center;
    }

    .company-logo {
      max-height: 70px;
      max-width: 120px;
    }

    .survey-title {
      font-size: 22px;
      font-weight: 700;
      color: #1976d2;
      margin-bottom: 5px;
    }

    .report-title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .content-wrapper {
      padding: 0 20px 20px 20px;
    }

    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 15px 0; 
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    th, td { 
      border: 1px solid #ddd; 
      padding: 8px; 
      text-align: left;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    th { 
      font-weight: 600; 
    }
    
    tbody tr:nth-child(even) { 
    }

    /* Prevent awkward splits inside common blocks */
    table, tr, td, th, img, p, div {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Prevent awkward splits inside common blocks */
    table, tr, td, th, img, p, div, ul, ol, li, h1, h2, h3, h4, h5, h6 {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    p, li {
      line-height: 1.6;
      page-break-after: avoid;
      page-break-before: avoid;
      break-after: avoid-page;
      break-before: avoid-page;
    }
  </style>
</head>
<body>
  ${companyName || companyLogo ? `
  <div class="document-header">
    <div class="header-layout">
      <div class="header-left">
        ${companyLogo ? `<img src="${companyLogo}" class="company-logo" />` : ''}
      </div>
      <div class="header-center">
        <div class="survey-title">${surveyType}</div>
        <div class="report-title">${reportTitle}</div>
      </div>
      <div class="header-right"></div>
    </div>
  </div>
  ` : ''}
  
  <div class="content-wrapper">
    ${originalHTML}
  </div>
</body>
</html>
`;
};

export const ChecklistPreviewModal = ({
  open,
  onClose,
  previewUrl: initialPreviewUrl,
  checklistData
}) => {
  const [downloading, setDownloading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(initialPreviewUrl);

  useEffect(() => {
    if (open && checklistData) {
      getSystemVariables();
    }
  }, [open, checklistData]);

  const getSystemVariables = async () => {
    try {
      setLoading(true);
      const response = await getAllSystemVariables();

      if (response?.status === 200) {
        const data = response?.data?.data;
        const nameVar = data.find((item) => item.name === "company_name");
        const logoVar = data.find((item) => item.name === "company_logo");

        const fetchedName = nameVar?.information || '';
        const fetchedLogo = logoVar?.information || '';

        const logoAsDataUri = await convertImageToBase64(fetchedLogo);

        setCompanyName(fetchedName);
        setCompanyLogo(logoAsDataUri || fetchedLogo);

        if (checklistData) {
          const html = generateChecklistHTML(checklistData, fetchedName, logoAsDataUri || fetchedLogo);
          const blob = new Blob([html], { type: 'text/html' });

          if (previewUrl && previewUrl !== initialPreviewUrl) {
            URL.revokeObjectURL(previewUrl);
          }

          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    setDownloading(true);

    try {
      const shipName = checklistData?.client?.shipName || 'Unknown';
      const reportNo = checklistData?.journal?.journalTypeId || 'Report';
      const date = new Date().toISOString().split('T')[0];
      const filename = `Survey_Checklist_${shipName}_${reportNo}_${date}.html`;

      const html = generateChecklistHTML(checklistData, companyName, companyLogo);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading:', error);
    } finally {
      setDownloading(false);
    }
  };

  const convertImageToBase64 = (url) => {
    return new Promise((resolve) => {
      if (!url) {
        resolve(null);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'Anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        } catch (error) {
          console.error('Error converting image:', error);
          resolve(null);
        }
      };

      img.onerror = () => {
        console.error('Error loading image:', url);
        resolve(null);
      };

      img.src = url;
    });
  };

  const handleDownloadPDF = async () => {
    let element = null;

    try {
      setDownloading(true);

      const originalHTML = checklistData?.checkListData?.checkList || '';

      if (!originalHTML || originalHTML.trim().length === 0) {
        alert('No content available to generate PDF');
        setDownloading(false);
        return;
      }

      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '210mm'; // A4 width
      iframe.style.height = '297mm'; // A4 height
      iframe.style.background = '#ffffff';
      document.body.appendChild(iframe);

      // Generate the full HTML
      const fullHTML = generateChecklistHTML(checklistData, companyName, companyLogo);

      // Write HTML to iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(fullHTML);
      iframeDoc.close();
      iframeDoc.documentElement.style.background = '#ffffff';
      iframeDoc.body.style.background = '#ffffff';

      // Wait for iframe to load completely
      await new Promise((resolve) => {
        iframe.onload = resolve;
        setTimeout(resolve, 1000); // Fallback timeout
      });

      // Wait for images to load
      const images = iframeDoc.getElementsByTagName('img');
      if (images.length > 0) {
        await Promise.all(
          Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
              img.onload = resolve;
              img.onerror = resolve;
              setTimeout(resolve, 2000);
            });
          })
        );
      }

      // Additional wait for layout
      await new Promise(resolve => setTimeout(resolve, 500));

      const shipName = checklistData?.client?.shipName || 'Unknown';
      const reportNo = checklistData?.journal?.journalTypeId || 'Report';
      const date = new Date().toISOString().split('T')[0];
      const fileName = `Survey_Checklist_${shipName}_${reportNo}_${date}.pdf`;

      // Get the body from iframe for PDF generation
      const content = iframeDoc.body;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: fileName,
        image: {
          type: 'jpeg',
          quality: 1
        },
        html2canvas: {
          scale: 3,
          useCORS: true,
          logging: false,
          allowTaint: false,
          backgroundColor: '#ffffff',
          scrollY: 0,
          scrollX: 0,
          letterRendering: true,
          removeContainer: false,
          imageTimeout: 0,
          windowWidth: 794,
          windowHeight: iframeDoc.documentElement.scrollHeight
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
          compress: false
        },
        pagebreak: {
          mode: ['css', 'legacy'],
          before: '.page-break-before',
          after: '.page-break-after',
          avoid: ['tr', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
        }
      };

      // Generate PDF from iframe content
      await html2pdf().set(opt).from(content).save();

      // Cleanup
      document.body.removeChild(iframe);

    } catch (err) {
      console.error("PDF Error:", err);
      alert('Error generating PDF: ' + err.message);

      if (element && element.parentNode) {
        document.body.removeChild(element);
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { height: '90vh', maxHeight: '90vh' } }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e0e0e0'
        }}
      >
        <Typography variant="h6">Survey Checklist Report Preview</Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Download HTML">
            <IconButton onClick={handleDownload} disabled={downloading || loading}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>

          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', height: '100%', alignItems: 'center' }}>
            <CircularProgress />
          </Box>
        ) : previewUrl ? (
          <Box
            component="iframe"
            src={previewUrl}
            sx={{ width: '100%', height: '100%', border: 'none' }}
          />
        ) : (
          <Typography>No Preview Available</Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid #e0e0e0' }}>
        <CommonButton onClick={onClose} variant="outlined" text="Cancel" />
        <CommonButton
          onClick={handleDownloadPDF}
          variant="contained"
          startIcon={<DownloadIcon />}
          disabled={downloading || loading}
          text={downloading ? 'Downloading...' : 'Download PDF'}
        />
      </DialogActions>
    </Dialog>
  );
};

export default ChecklistPreviewModal;