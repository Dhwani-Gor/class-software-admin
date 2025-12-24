import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  CircularProgress,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import CommonButton from '../CommonButton';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/* -------------------- HELPERS -------------------- */

const parseChecklistData = (data) => {
  try {
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch {
    return {};
  }
};

const sanitizeHTML = (html) => {
  const container = document.createElement("div");
  container.innerHTML = html;

  // Fix broken tables
  container.querySelectorAll("table").forEach(table => {
    table.querySelectorAll("tr").forEach(tr => {
      const tds = tr.querySelectorAll("td");
      if (tds.length === 0) {
        tr.remove();
      }
    });
  });

  // Remove nested <p> inside <p>
  container.querySelectorAll("p p").forEach(p => {
    p.outerHTML = p.innerHTML;
  });

  return container.innerHTML;
};

/* -------------------- COMPONENT -------------------- */

const ChecklistPreviewModal = ({ open, onClose, previewUrl: initialPreviewUrl, checklistData }) => {
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef(null);
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    if (open && checklistData) {
      buildPreview();
    }
  }, [open, checklistData]);

  const buildPreview = async () => {
    setLoading(true);
    const parsed = parseChecklistData(checklistData?.checkListData);
    const rawHTML = sanitizeHTML(parsed?.checkList || '');
    setHtmlContent(rawHTML);
    setLoading(false);
  };

  /* -------------------- NEW APPROACH: Direct Canvas to PDF -------------------- */

  const handleDownloadPDF = async () => {
    if (!contentRef.current) {
      alert('Content not ready');
      return;
    }

    try {
      setDownloading(true);

      // Wait for any pending renders
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get the actual content dimensions
      const element = contentRef.current;

      // Capture with high quality settings
      const canvas = await html2canvas(element, {
        scale: 3, // High quality - 3x resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      // A4 dimensions
      const pdfWidth = 210; // mm
      const pdfHeight = 297; // mm
      const margin = 15; // mm margins

      // Available space for content
      const contentWidth = pdfWidth - (2 * margin);
      const contentHeight = pdfHeight - (2 * margin);

      // Calculate image dimensions to fit page width
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: false // Don't compress to maintain quality
      });

      const imgData = canvas.toDataURL('image/png', 1.0); // Use PNG for better quality

      let heightLeft = imgHeight;
      let position = 0;
      let pageCount = 0;

      // Add pages as needed
      while (heightLeft > 0) {
        if (pageCount > 0) {
          pdf.addPage();
        }

        const yPosition = margin - (position * contentHeight);

        pdf.addImage(
          imgData,
          'PNG',
          margin,
          yPosition,
          imgWidth,
          imgHeight,
          undefined,
          'FAST' // Use FAST compression for better quality
        );

        heightLeft -= contentHeight;
        position++;
        pageCount++;
      }

      pdf.save('Survey_Checklist.pdf');

    } catch (e) {
      console.error('PDF generation error:', e);
      alert('PDF generation failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  /* -------------------- UI -------------------- */

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Survey Checklist Preview</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ height: '70vh', p: 0, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box
            ref={contentRef}
            sx={{
              p: 4,
              backgroundColor: '#ffffff',
              minHeight: '100%',
              fontFamily: 'Arial, sans-serif',
              fontSize: '14px',
              lineHeight: 1.6,
              '& table': {
                width: '100%',
                borderCollapse: 'collapse',
                margin: '10px 0'
              },
              '& td, & th': {
                border: '1px solid #ccc',
                padding: '6px',
                verticalAlign: 'top'
              },
              '& img': {
                maxWidth: '100%',
                height: 'auto'
              },
              '& p': {
                margin: '0 0 8px 0'
              }
            }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <CommonButton onClick={onClose} variant="outlined" text="Cancel" />
        <CommonButton
          onClick={handleDownloadPDF}
          variant="contained"
          startIcon={<DownloadIcon />}
          disabled={downloading || loading}
          text={downloading ? 'Downloading…' : 'Download PDF'}
        />
      </DialogActions>
    </Dialog>
  );
};

export default ChecklistPreviewModal;