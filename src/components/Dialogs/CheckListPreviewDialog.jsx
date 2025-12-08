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
import { getAllSystemVariables } from '@/api';
import CommonButton from '../CommonButton';

// Helper function to extract ship details from HTML
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

    // Extract from table cells
    const tables = doc.querySelectorAll('table');
    if (tables.length > 0) {
      const firstTable = tables[0];
      const cells = firstTable.querySelectorAll('td');

      cells.forEach(cell => {
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

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Survey Checklist Report</title>
  <style>
    @page {
      margin: 20mm;
      size: A4;
    }
    
    * {
      box-sizing: border-box;
    }
    
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 40px;
      color: #000;
      background: white;
      line-height: 1.6;
      font-size: 14px;
    }
    
    /* Header Section - Only show if company data exists */
    .document-header {
      border-bottom: 3px solid #1976d2;
      padding-bottom: 20px;
      margin-bottom: 30px;
      ${!companyName && !companyLogo ? 'display: none;' : ''}
    }
    
    .header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0;
    }
    
    .company-logo {
      max-height: 80px;
      max-width: 140px;
      object-fit: contain;
      flex-shrink: 0;
    }
    
    .company-info {
      text-align: right;
      flex: 1;
    }
    
    .company-name {
      font-size: 24px;
      font-weight: 700;
      color: #1976d2;
      margin: 0;
    }
    
    /* Content Section */
    .content-section {
      margin-top: 0;
    }
    
    img {
      max-width: 100%;
      height: auto;
    }
    
    p { 
      margin: 10px 0;
      font-size: 14px;
    }
    
    h1 {
      font-size: 18px;
      margin: 15px 0;
      font-weight: 600;
    }
    
    h2, h3, h4 {
      margin: 12px 0;
      font-weight: 600;
    }
    
    strong { 
      font-weight: 600;
      color: #212529;
    }
    
    em {
      font-style: italic;
    }
    
    /* Table Styles */
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 20px 0;
      background: white;
    }
    
    table, th, td { 
      border: 1px solid #dee2e6;
    }
    
    th { 
      background: #f8f9fa;
      padding: 12px 10px;
      font-weight: 600;
      text-align: left;
      color: #212529;
      font-size: 13px;
    }
    
    td { 
      padding: 10px;
      font-size: 13px;
      color: #495057;
      vertical-align: top;
    }
    
    tbody tr:nth-child(even) {
      background-color: #fafafa;
    }
    
    /* Lists */
    ol, ul {
      margin: 15px 0;
      padding-left: 25px;
    }
    
    li {
      margin: 8px 0;
      line-height: 1.6;
    }
    
    sup {
      vertical-align: super;
      font-size: smaller;
    }
    
    /* Print Styles */
    @media print {
      body {
        padding: 20px;
      }
      
      .document-header {
        page-break-after: avoid;
      }
      
      table {
        page-break-inside: avoid;
      }
      
      tr {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  ${companyName || companyLogo ? `
  <!-- Document Header -->
  <div class="document-header">
    <div class="header-top">
      ${companyLogo ? `<img src="${companyLogo}" alt="Company Logo" class="company-logo" />` : ''}
      ${companyName ? `
      <div class="company-info">
        <h1 class="company-name">${companyName}</h1>
      </div>
      ` : ''}
    </div>
  </div>
  ` : ''}
  
  <!-- Main Content -->
  <div class="content-section">
    ${originalHTML}
  </div>

</body>
</html>`;
};


const cleanHTMLContent = (htmlString) => {
  try {
    // Remove [Logo] and [Class name] placeholders
    let cleaned = htmlString.replace(/\[Logo\]/gi, '');
    cleaned = cleaned.replace(/\[Class name\]/gi, '');
    return cleaned;
  } catch (error) {
    console.error('Error cleaning HTML:', error);
    return htmlString;
  }
};

// Preview Modal Component
export const ChecklistPreviewModal = ({ open, onClose, previewUrl: initialPreviewUrl, checklistData }) => {
  const [downloading, setDownloading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(initialPreviewUrl);
  console.log(previewUrl, "preview url")

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

        setCompanyName(fetchedName);
        setCompanyLogo(fetchedLogo);

        // Regenerate HTML with company data
        if (checklistData) {
          const html = generateChecklistHTML(checklistData, fetchedName, fetchedLogo);
          const blob = new Blob([html], { type: 'text/html' });

          // Revoke old URL if exists
          if (previewUrl && previewUrl !== initialPreviewUrl) {
            URL.revokeObjectURL(previewUrl);
          }

          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
        }
      } else {
        console.warn("API call returned status:", response?.status);
      }
    } catch (error) {
      console.error("Error fetching system variables:", error);
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

      // Generate fresh HTML with current company data for download
      const html = generateChecklistHTML(checklistData, companyName, companyLogo);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the temporary URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download the report. Please try again.');
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
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #e0e0e0',
        pr: 1,
        py: 2
      }}>
        <Typography variant="h6" component="div">
          Survey Checklist Report Preview
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Download Report">
            <IconButton
              onClick={handleDownload}
              disabled={downloading || loading}
              color="primary"
              size="medium"
            >
              {downloading ? (
                <CircularProgress size={24} />
              ) : (
                <DownloadIcon />
              )}
            </IconButton>
          </Tooltip>
          <IconButton
            onClick={onClose}
            size="medium"
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <CircularProgress />
            <Typography color="text.secondary">Loading report...</Typography>
          </Box>
        ) : previewUrl ? (
          <Box
            component="iframe"
            src={previewUrl}
            sx={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            title="Checklist Preview"
          />
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary'
            }}
          >
            <Typography>No preview available</Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid #e0e0e0', padding: 2, gap: 1 }}>
        <CommonButton
          onClick={onClose}
          variant="outlined"
          sx={{ textTransform: 'none' }}
          text="Cancel"
        />
        <CommonButton
          onClick={handleDownload}
          variant="contained"
          startIcon={downloading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
          disabled={downloading || loading}
          sx={{ textTransform: 'none' }}
          text={downloading ? 'Downloading...' : 'Download Report'}
        />

      </DialogActions>
    </Dialog>
  );
};

export default ChecklistPreviewModal;