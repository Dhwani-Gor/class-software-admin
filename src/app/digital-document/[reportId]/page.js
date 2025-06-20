"use client";
import React, { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import CommonCard from "@/components/CommonCard";
import { Container, IconButton, Box, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert } from "@mui/material";
import { CheckCircle, Download, PictureAsPdf, Close, Error, Warning } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { getActivity, getAllActivityReportDetails, getSelectedReportDetails, getSpecificClient } from "@/api";
import { toast } from "react-toastify";

const DigitalDocument = ({ params }) => {
  const [reportDetails, setReportDetails] = useState(null);
  const [additionalDetails, setAdditionalDetails] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadError, setDownloadError] = useState(null);

  // Function to determine certificate status based on validity date
  const getCertificateStatus = (validityDate) => {
    if (!validityDate) {
      return {
        status: 'INVALID',
        color: '#f44336',
        icon: Error,
        message: 'No validity date found'
      };
    }

    const currentDate = new Date();
    const validity = new Date(validityDate);
    
    // Reset time to compare only dates
    currentDate.setHours(0, 0, 0, 0);
    validity.setHours(0, 0, 0, 0);

    if (validity >= currentDate) {
      return {
        status: 'VERIFICATION SUCCESS',
        color: '#4caf50',
        icon: CheckCircle,
        message: 'Certificate is valid'
      };
    } else {
      return {
        status: 'EXPIRED',
        color: 'red',
        icon: Warning,
        message: 'Certificate has expired'
      };
    }
  };

  const fetchClientDetails = async (activityId) => {
    if (!activityId) {
      console.warn('No activity ID provided for client details fetch');
      return;
    }

    try {
      const result = await getActivity(activityId);
      if (result?.status === 200 && result?.data?.data?.journal?.clientId) {
        const clientId = result.data.data.journal.clientId;
        const response = await getSpecificClient(clientId);
        
        if (response?.status === 200 && response?.data?.data) {
          setAdditionalDetails(response.data.data);
        } else {
          console.warn('Failed to fetch client details - invalid response');
        }
      } else {
        console.warn('Failed to fetch activity details - invalid response');
      }
    } catch (error) {
      console.error('Error fetching client details:', error);
      // Don't show toast for this as it's not critical - client name will just show as N/A
    }
  };

  const fetchReportDetails = async () => {
    if (!params?.reportId) {
      setError('No report ID provided');
      setLoading(false);
      toast.error('Invalid report ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await getAllActivityReportDetails('id', params.reportId);
      
      if (result?.status === 200 && result?.data?.data && result.data.data.length > 0) {
        const reportData = result.data.data[0];
        setReportDetails(reportData);

        // Fetch client details if activity ID exists
        if (reportData?.activityId) {
          await fetchClientDetails(reportData.activityId);
        }
      } else {
        throw new Error('Report not found or invalid response');
      }
    } catch (error) {
      console.error('Error fetching report details:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load certificate';
      setError(errorMessage);
      toast.error(`${errorMessage}. Please try again later.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportDetails();
  }, [params?.reportId]);

  const handleDownload = async () => {
    if (!reportDetails?.generatedDoc) {
      setDownloadError('No document available for download');
      toast.error('No document available for download');
      return;
    }

    try {
      setDownloadError(null);
      
      // Validate URL
      const url = new URL(reportDetails.generatedDoc);
      
      const a = document.createElement('a');
      a.href = reportDetails.generatedDoc;
      a.download = reportDetails.generatedDoc.split('/').pop() || 'certificate.pdf';
      a.target = '_blank'; // Fallback for some browsers
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Download error:', error);
      const errorMessage = 'Failed to download document. Please try again.';
      setDownloadError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handlePreview = () => {
    if (!reportDetails?.generatedDoc) {
      toast.error('No document available for preview');
      return;
    }
    
    try {
      // Validate URL before opening preview
      new URL(reportDetails.generatedDoc);
      setPreviewOpen(true);
    } catch (error) {
      console.error('Invalid document URL:', error);
      toast.error('Invalid document URL');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Container>
        <CommonCard sx={{ mt: 0, pl: 2 }}>
          <Stack direction={'row'} alignItems={'center'} gap={2}>
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
          <Stack direction={'row'} alignItems={'center'} gap={2}>
            <Typography variant="h6" fontWeight={"700"}>
              Document Validator  
            </Typography>
          </Stack>
        </CommonCard>
        <Box mt={4}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body1">
              {error || 'Certificate not found'}
            </Typography>
          </Alert>
          <Box display="flex" justifyContent="center">
            <Button 
              variant="contained" 
              onClick={fetchReportDetails}
              disabled={loading}
            >
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
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2, backgroundColor: '#f8f9fa' }}>
          
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
              backgroundColor: 'white',
              borderRadius: 1
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
              <StatusIcon sx={{ color: certificateStatus.color, fontSize: 20 }} />
              <Typography 
                variant="body1" 
                color={certificateStatus.color} 
                fontWeight="600"
              >
                {certificateStatus.status}
              </Typography>
            </Stack>
            {certificateStatus.message && (
              <Typography 
                fontWeight={600}
                display="block" 
                textAlign="center"
                mt={0.5}
              >
                {certificateStatus.message}
              </Typography>
            )}
          </Box>

          {/* Logo/Seal */}
          <Box display="flex" justifyContent="center" mb={3}>
            <Box
              component="img"
              src="/assets/logo.jpeg"
              alt="Marine Assure Logo"
              sx={{
                width: 'auto',
                height: '250px',
                objectFit: 'contain',
                borderRadius: '20px',
                p: 1
              }}
              onError={(e) => {
                console.error('Logo failed to load');
                e.target.style.display = 'none';
              }}
            />
          </Box>

          {/* Verification Source */}
          <Box 
            sx={{ 
              p: 2, 
              mb: 3,
              textAlign: 'center',
              backgroundColor: 'white',
              borderRadius: 1
            }}
          >
            <Typography variant="body2" mb={1}>
              The following details are confirmed by:
            </Typography>
            <Typography variant="body2" color="primary" fontWeight="bold">
              INNOVOIL
            </Typography>
          </Box>

          {/* Certificate Details */}
          <Box sx={{ backgroundColor: 'white', p: 2, borderRadius: 1 }}>
            <Stack spacing={2}>
              {additionalDetails?.shipName && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Vessel/Company Name
                  </Typography>
                  <Typography variant="body2" fontWeight="500" textAlign="right">
                    {additionalDetails.shipName}
                  </Typography>
                </Stack>
              )}
              
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Valid Till
                </Typography>
                <Typography 
                  variant="body2" 
                  fontWeight="500"
                  color={certificateStatus.status === 'EXPIRED' ? 'error.main' : 'text.primary'}
                >
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
                      {reportDetails.generatedDoc.split('/').pop() || 'certificate.pdf'}
                    </Typography>
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={handleDownload}
                      disabled={!reportDetails.generatedDoc}
                    >
                      <Download />
                    </IconButton>
                  </Stack>
                  
                  {/* Certificate Thumbnail */}
                  <Box 
                    sx={{ 
                      mt: 2, 
                      p: 2, 
                      border: '1px solid #e0e0e0', 
                      borderRadius: 1, 
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#f5f5f5' }
                    }}
                    onClick={handlePreview}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box
                        sx={{
                          width: 60,
                          height: 80,
                          backgroundColor: '#f5f5f5',
                          border: '1px solid #ddd',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column'
                        }}
                      >
                        <PictureAsPdf sx={{ fontSize: 24, color: '#d32f2f' }} />
                        <Typography variant="caption" color="text.secondary">
                          PDF
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight="500">
                          Certificate Preview
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Click to view full document
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </>
              )}
            </Stack>
          </Box>

          {/* Footer */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Previewing: {reportDetails.generatedDoc?.split('/').pop() || 'Document'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              INNOVOIL
            </Typography>
          </Box>

        </Paper>

        {/* Preview Dialog */}
        <Dialog 
          open={previewOpen} 
          onClose={() => setPreviewOpen(false)}
          maxWidth="md"
          fullWidth
          fullScreen
        >
          <DialogTitle>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Certificate Preview</Typography>
              <IconButton onClick={() => setPreviewOpen(false)}>
                <Close />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent>
            {reportDetails?.generatedDoc ? (
              <Box sx={{ height: '100%', width: '100%' }}>
                <iframe
                  src={`${reportDetails.generatedDoc}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&scrollbar=0`}
                  width="100%"
                  height="100%"
                  style={{ border: 'none', borderRadius: 4 }}
                  title="Certificate Preview"
                  onError={() => {
                    toast.error('Failed to load document preview');
                  }}
                />
              </Box>
            ) : (
              <Box 
                sx={{ 
                  height: 400, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1
                }}
              >
                <Typography color="text.secondary">
                  No document available for preview
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            <Button 
              variant="contained" 
              startIcon={<Download />}
              onClick={handleDownload}
              disabled={!reportDetails?.generatedDoc}
            >
              Download
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default DigitalDocument;