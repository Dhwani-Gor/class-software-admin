"use client";
import React, { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import CommonCard from "@/components/CommonCard";
import { Container, IconButton, Box, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert } from "@mui/material";
import { CheckCircle, Download, PictureAsPdf, Close, Error as ErrorIcon, Warning, OpenInNew } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { getActivity, getAllActivityReportDetails, getAllSystemVariables, getSelectedReportDetails, getSpecificClient } from "@/api";
import { toast } from "react-toastify";

const DigitalDocument = ({ params }) => {
  const [reportDetails, setReportDetails] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadError, setDownloadError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");
  console.log(companyLogo, "companyLogo");

  // Detect mobile and iOS
  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;

      setIsMobile(isMobileDevice);
      setIsIOS(isIOSDevice);
    };

    checkDevice();
  }, []);

  // Function to determine certificate status based on validity date
  const getCertificateStatus = (validityDate) => {
    if (!validityDate) {
      return {
        status: "",
        color: "#f44336",
        icon: ErrorIcon,
        message: "No validity date found",
      };
    }

    const currentDate = new Date();
    const validity = new Date(validityDate);

    // Reset time to compare only dates
    currentDate.setHours(0, 0, 0, 0);
    validity.setHours(0, 0, 0, 0);

    if (validity >= currentDate) {
      return {
        status: "VERIFICATION SUCCESS",
        color: "#4caf50",
        icon: CheckCircle,
        message: "Certificate is valid",
      };
    } else {
      return {
        status: "EXPIRED",
        color: "#ff9800",
        icon: Warning,
        message: "Certificate has expired",
      };
    }
  };

  const fetchReportDetails = async () => {
    if (!params?.reportId) {
      setError("No report ID provided");
      setLoading(false);
      toast.error("Invalid report ID");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await getAllActivityReportDetails("id", params?.reportId);
      console.log("==>", result?.data?.data[0]);
      if (result?.status === 200 && result?.data?.data && result.data.data.length > 0) {
        const reportData = result.data.data[0];
        setReportDetails(reportData);
      } else {
        throw new Error("Report not found or invalid response");
      }
    } catch (error) {
      console.error("Error fetching report details:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to load certificate";
      setError(errorMessage);
      toast.error(`${errorMessage}. Please try again later.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportDetails();
    getSystemVariables();
  }, [params?.reportId]);

  const getSystemVariables = async () => {
    try {
      const response = await getAllSystemVariables();

      if (response?.status === 200) {
        const data = response?.data?.data;

        const nameVar = data.find((item) => item.name === "company_name");
        const logoVar = data.find((item) => item.name === "company_logo");

        if (nameVar) {
          setCompanyName(nameVar.information);
        }
        if (logoVar) {
          setCompanyLogo(logoVar.information);
        }
      } else {
        console.warn("API call returned status:", response?.status);
      }
    } catch (error) {
      console.error("Error fetching system variables:", error);
    }
  };

  const handleDownload = async () => {
    if (!reportDetails?.generatedDoc) {
      setDownloadError("No document available for download");
      toast.error("No document available for download");
      return;
    }

    try {
      setDownloadError(null);

      // Validate URL - mobile-safe approach
      let isValidUrl = false;
      try {
        const testUrl = reportDetails.generatedDoc;
        if (typeof testUrl === "string" && (testUrl.startsWith("http://") || testUrl.startsWith("https://"))) {
          isValidUrl = true;
        }
      } catch (e) {
        isValidUrl = false;
      }

      if (!isValidUrl) {
        const errorMessage = "Invalid document URL";
        setDownloadError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      if (isMobile) {
        window.open(reportDetails.generatedDoc, "_blank");
      } else {
        const a = document.createElement("a");
        a.href = reportDetails.generatedDoc;
        a.download = reportDetails.generatedDoc.split("/").pop() || "certificate.pdf";
        a.target = "_blank";

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Download error:", error);
      const errorMessage = "Failed to download document. Please try again.";
      setDownloadError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handlePreview = () => {
    if (!reportDetails?.generatedDoc) {
      toast.error("No document available for preview");
      return;
    }

    try {
      // Validate URL - mobile-safe approach
      const testUrl = reportDetails.generatedDoc;
      if (typeof testUrl === "string" && (testUrl.startsWith("http://") || testUrl.startsWith("https://"))) {
        // For iOS, directly open in new tab instead of modal
        if (isIOS) {
          window.open(reportDetails.generatedDoc, "_blank");
        } else {
          setPreviewOpen(true);
        }
      } else {
        toast.error("Invalid document URL");
      }
    } catch (error) {
      console.error("Invalid document URL:", error);
      toast.error("Invalid document URL");
    }
  };

  const handleOpenInNewTab = () => {
    if (reportDetails?.generatedDoc) {
      window.open(reportDetails.generatedDoc, "_blank");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid Date";
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Container>
        <CommonCard sx={{ mt: 0, pl: 2 }}>
          <Stack direction={"row"} alignItems={"center"} gap={2}>
            <Typography variant="h6" fontWeight={"700"}>
              Document Validator
            </Typography>
          </Stack>
        </CommonCard>
        <Box display="flex" justifyContent="center" mt={4}>
          <Typography>Loading certificate details...</Typography>
        </Box>
      </Container>
    );
  }

  // Show error state
  if (error || !reportDetails) {
    return (
      <Container>
        <CommonCard sx={{ mt: 0, pl: 2 }}>
          <Stack direction={"row"} alignItems={"center"} gap={2}>
            <Typography variant="h6" fontWeight={"700"}>
              Document Validator
            </Typography>
          </Stack>
        </CommonCard>
        <Box mt={4}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body1">{error || "Certificate not found"}</Typography>
          </Alert>
          <Box display="flex" justifyContent="center">
            <Button variant="contained" onClick={fetchReportDetails} disabled={loading}>
              Retry
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }

  const certificateStatus = getCertificateStatus(reportDetails.validityDate);
  const StatusIcon = certificateStatus.icon;

  return (
    <Container maxWidth="sm">
      {/* Document Content */}
      <Box>
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2, backgroundColor: "#f8f9fa" }}>
          {/* Header */}
          <Stack direction="row" alignItems="center" spacing={2} mb={3}>
            <Typography variant="h6" fontWeight="bold">
              Document Validator
            </Typography>
          </Stack>

          {/* Verification Status - Dynamic based on validity date */}
          <Box
            sx={{
              p: 2,
              mb: 3,
              backgroundColor: "white",
              borderRadius: 1,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
              <StatusIcon sx={{ color: certificateStatus.color, fontSize: 20 }} />
              <Typography variant="body1" color={certificateStatus.color} fontWeight="600">
                {certificateStatus.status}
              </Typography>
            </Stack>
            {certificateStatus.message && (
              <Typography fontWeight={600} display="block" textAlign="center" mt={0.5}>
                {certificateStatus.message}
              </Typography>
            )}
          </Box>

          {/* Logo/Seal */}
          <Box display="flex" justifyContent="center" mb={3}>
            <Box
              component="img"
              src={companyLogo}
              alt="Marine Assure Logo"
              sx={{
                width: "auto",
                height: "250px",
                objectFit: "contain",
                borderRadius: "20px",
                p: 1,
              }}
              onError={(e) => {
                console.error("Logo failed to load");
                e.target.style.display = "none";
              }}
            />
          </Box>

          {/* Verification Source */}
          <Box
            sx={{
              p: 2,
              mb: 3,
              textAlign: "center",
              backgroundColor: "white",
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" mb={1}>
              The following details are confirmed by:
            </Typography>
            <Typography variant="body2" color="primary" fontWeight="bold">
              {companyName}
            </Typography>
          </Box>

          {/* Certificate Details */}
          <Box sx={{ backgroundColor: "white", p: 2, borderRadius: 1 }}>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Vessel/Company Name
                </Typography>
                <Typography variant="body2" fontWeight="500" textAlign="right">
                  {reportDetails?.activity?.journal?.client?.shipName}
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Valid Till
                </Typography>
                <Typography variant="body2" fontWeight="500" color={certificateStatus.status === "EXPIRED" ? "error.main" : "text.primary"}>
                  {formatDate(reportDetails.validityDate)}
                </Typography>
              </Stack>

              {/* Show download error if any */}
              {downloadError && (
                <Alert severity="error" size="small">
                  {downloadError}
                </Alert>
              )}

              {reportDetails.generatedDoc && (
                <>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                      {reportDetails.generatedDoc.split("/").pop() || "certificate.pdf"}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      {/* Open in new tab button for mobile */}
                      {isMobile && (
                        <IconButton size="small" color="secondary" onClick={handleOpenInNewTab} title="Open in new tab">
                          <OpenInNew />
                        </IconButton>
                      )}
                      <IconButton size="small" color="primary" onClick={handleDownload} disabled={!reportDetails.generatedDoc} title={isMobile ? "Open PDF" : "Download PDF"}>
                        <Download />
                      </IconButton>
                    </Stack>
                  </Stack>

                  {/* Certificate Thumbnail */}
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      border: "1px solid #e0e0e0",
                      borderRadius: 1,
                      cursor: "pointer",
                      "&:hover": { backgroundColor: "#f5f5f5" },
                    }}
                    onClick={handlePreview}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box
                        sx={{
                          width: 60,
                          height: 80,
                          backgroundColor: "#f5f5f5",
                          border: "1px solid #ddd",
                          borderRadius: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "column",
                        }}
                      >
                        <PictureAsPdf sx={{ fontSize: 24, color: "#d32f2f" }} />
                        <Typography variant="caption" color="text.secondary">
                          PDF
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight="500">
                          Certificate Preview
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {isIOS ? "Tap to open in Safari" : "Click to view full document"}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </>
              )}
            </Stack>
          </Box>

          {/* Footer */}
          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Previewing: {reportDetails.generatedDoc?.split("/").pop() || "Document"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {companyName}
            </Typography>
          </Box>
        </Paper>

        {/* Preview Dialog - Only show for non-iOS devices */}
        {!isIOS && (
          <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
            <DialogTitle>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Certificate Preview</Typography>
                <Stack direction="row" spacing={1}>
                  <IconButton onClick={handleOpenInNewTab} title="Open in new tab" size="small">
                    <OpenInNew />
                  </IconButton>
                  <IconButton onClick={() => setPreviewOpen(false)}>
                    <Close />
                  </IconButton>
                </Stack>
              </Stack>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
              {reportDetails?.generatedDoc ? (
                <Box sx={{ height: isMobile ? "100vh" : "80vh", width: "100%" }}>
                  {/* For Android and desktop, use enhanced iframe */}
                  <iframe
                    src={`${reportDetails.generatedDoc}${reportDetails.generatedDoc.includes("?") ? "&" : "#"}toolbar=1&navpanes=1&scrollbar=1&page=1&zoom=page-fit&view=FitH`}
                    width="100%"
                    height="100%"
                    style={{
                      border: "none",
                      borderRadius: 4,
                      backgroundColor: "#f5f5f5",
                    }}
                    title="Certificate Preview"
                    allow="fullscreen"
                    loading="lazy"
                    onError={(e) => {
                      console.error("iframe failed to load:", e);
                      toast.error("Failed to load document preview. Try opening in new tab.");
                    }}
                    onLoad={(e) => {
                      // Try to focus the iframe to enable keyboard navigation
                      try {
                        e.target.focus();
                      } catch (err) {
                        console.log("Could not focus iframe");
                      }
                    }}
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    height: 400,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#f5f5f5",
                    borderRadius: 1,
                  }}
                >
                  <Typography color="text.secondary">No document available for preview</Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPreviewOpen(false)}>Close</Button>
              <Button variant="outlined" startIcon={<OpenInNew />} onClick={handleOpenInNewTab}>
                Open in New Tab
              </Button>
              <Button variant="contained" startIcon={<Download />} onClick={handleDownload} disabled={!reportDetails?.generatedDoc}>
                {isMobile ? "Open PDF" : "Download"}
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </Box>
    </Container>
  );
};

export default DigitalDocument;
