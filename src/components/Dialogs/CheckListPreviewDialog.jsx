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

const applyPdfScale = (element, scale) => {
  element.style.transformOrigin = 'top left';
  element.style.transform = `scale(${scale})`;
  element.style.width = `${100 / scale}%`;
};

const resetPdfScale = (element) => {
  element.style.transform = '';
  element.style.transformOrigin = '';
  element.style.width = '';
};


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
  console.log(checklistData, "checklistData in previe");
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
    let rawHTML = sanitizeHTML(parsed?.checkList || '');

    rawHTML = rawHTML.replace(
      /<p><strong>(.*?)<\/strong><\/p>/gi,
      `<div class="page-break-before"><strong>$1</strong></div>`
    );

    setHtmlContent(rawHTML);
    setLoading(false);
  };


  const getSafeFilePart = (value, fallback) => {
    if (!value) return fallback;
    return String(value)
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^\w\-]/g, '');
  };

  const reportNo = getSafeFilePart(
    checklistData?.journalData?.journalTypeId
  );

  const surveyName = getSafeFilePart(
    checklistData?.surveyTypes?.name
  );

  const checklistDocName = (
    checklistData?.surveyTypes?.checkListDocumentName || "—"
  ).replace(/\.docx$/i, "");

  const addHeader = (pdf, reportNo) => {
    const pageWidth = pdf.internal.pageSize.getWidth();

    pdf.setFontSize(9);
    pdf.setTextColor(40);

    pdf.text(
      `Report No.: ${reportNo}`,
      pageWidth - 15,
      12,
      { align: "right" }
    );
  };


  const addFooter = (pdf, formName) => {
    const totalPages = Number(pdf.getNumberOfPages());
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.setFontSize(7);
    pdf.setTextColor(90);

    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);

      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, pageHeight - 20, pageWidth, 20, "F");

      const footerY = pageHeight - 8;

      // Left
      pdf.text(`Form No.: ${formName}`, 15, footerY, {
        maxWidth: 60,
      });

      // Center
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        footerY,
        { align: "center" }
      );

      // Right
      pdf.text(`*Delete as applicable`, pageWidth - 15, footerY, {
        align: "right",
        maxWidth: 55,
      });
    }
  };



  const handleDownloadPDF = async () => {
    if (!contentRef.current) {
      alert('Content not ready');
      return;
    }

    try {
      setDownloading(true);

      const element = contentRef.current;
      applyPdfScale(element, 1.25); // 1.2–1.35 works well
      await waitForImages(element);
      await new Promise(res => setTimeout(res, 300));

      const canvas = await html2canvas(element, {
        scale: 1.8,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });
      resetPdfScale(element);

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

      const footerHeight = 15; // reserve space for footer
      const usableHeight = pageHeight - margin * 2 - footerHeight; const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let remainingHeight = imgHeight;
      let pageIndex = 0;

      while (remainingHeight > 0) {
        if (pageIndex > 0) {
          pdf.addPage();
        }
        addHeader(pdf, reportNo);

        if (checklistDocName) {
          addFooter(
            pdf,
            `${checklistDocName}`
          );
        }

        const sourceY = (pageIndex * usableHeight * canvas.height) / imgHeight;
        const sourceHeight = Math.min(
          canvas.height - sourceY,
          (usableHeight * canvas.height) / imgHeight
        );

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;

        const ctx = pageCanvas.getContext('2d');
        ctx.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          sourceHeight,
          0,
          0,
          canvas.width,
          sourceHeight
        );

        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);

        const pageImgHeight = (sourceHeight * imgWidth) / canvas.width;

        pdf.addImage(
          pageImgData,
          'JPEG',
          margin,
          margin,
          imgWidth,
          pageImgHeight
        );
        // ✅ CLEAR FOOTER AREA (CRITICAL FIX)
        const pageHeight = pdf.internal.pageSize.getHeight();
        pdf.setFillColor(255, 255, 255);
        pdf.rect(
          0,
          pageHeight - 20,   // footer zone
          pdf.internal.pageSize.getWidth(),
          20,
          'F'
        );

        remainingHeight -= usableHeight;
        pageIndex++;
      }


      addFooter(pdf, checklistDocName);


      pdf.save(`Survey_Checklist_${reportNo}_${surveyName}.pdf`);

    } catch (err) {
      console.error('PDF generation error:', err);
      alert('PDF generation failed. Please try again.');
    } finally {
      resetPdfScale(contentRef.current); // safety reset

      setDownloading(false);
    }
  };


  const waitForImages = async (container) => {
    const images = Array.from(container.querySelectorAll('img'));
    await Promise.all(
      images.map(
        img =>
          img.complete
            ? Promise.resolve()
            : new Promise(resolve => {
              img.onload = resolve;
              img.onerror = resolve;
            })
      )
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Survey Checklist Preview</Typography>
        <IconButton onClick={onClose} size="small">
          <Typography variant="body2" sx={{ mr: 2 }}>Report No.: {checklistData?.journalData?.journalTypeId}</Typography>
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
                margin: '10px 0',
                pageBreakInside: 'avoid',
                breakInside: 'avoid',
              },

              '& tr': {
                pageBreakInside: 'avoid',
                breakInside: 'avoid',
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
              },

              '& .page-break-before': {
                pageBreakBefore: 'always',
                breakBefore: 'page',
              },
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