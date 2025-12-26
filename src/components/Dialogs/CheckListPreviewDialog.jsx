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

      const element = contentRef.current;

      await waitForImages(element);
      await new Promise(res => setTimeout(res, 300));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      // ✅ USE JPEG (stable)
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;

      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);

      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        pdf.addPage();
        position = margin - (imgHeight - heightLeft);
        pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;
      }

      pdf.save('Survey_Checklist.pdf');

    } catch (err) {
      console.error('PDF generation error:', err);
      alert('PDF generation failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };


  /* -------------------- UI -------------------- */

  const waitForImages = async (container) => {
    const images = Array.from(container.querySelectorAll('img'));
    await Promise.all(
      images.map(
        img =>
          img.complete
            ? Promise.resolve()
            : new Promise(resolve => {
              img.onload = resolve;
              img.onerror = resolve; // ignore broken images
            })
      )
    );
  };

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