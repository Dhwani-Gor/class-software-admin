"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Stack, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip, Chip, TextField, Select, MenuItem, CircularProgress } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import GetAppIcon from "@mui/icons-material/GetApp";
import CommonCard from "@/components/CommonCard";
import CommonButton from "@/components/CommonButton";
import CommonInput from "@/components/CommonInput";
import CommonConfirmationDialog from "@/components/Dialogs/CommonConfirmationDialog";
import ShowAmdRemarksDialog from "@/components/Dialogs/ShowAmdRemarksDialog";
import DocumentPreview from "@/components/Dialogs/DocumentPreview";
import { toast } from "react-toastify";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Layout from "@/Layout";
import { useAuth } from "@/hooks/useAuth";
import Pagination from "@mui/material/Pagination";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

import { deleteSurveyReport, deleteSurveyStatusReport, getAllIssuedDocuments, getAllReports, getJournalsList } from "@/api";

const Certificates = () => {
  const { data } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [certificatesList, setCertificatesList] = useState([]);
  const [reportsList, setReportsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [limit, setLimit] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  const [count, setTotalCount] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("certificates");
  console.log(selectedFilter, "selectedfilter");
  const [selectedReportNumber, setSelectedReportNumber] = useState("");
  const [placeFilter, setPlaceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [journals, setJournals] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [openPreviewModal, setOpenPreviewModal] = useState(false);
  const [openAmdRemarks, setOpenAmdRemarks] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        // toggle direction
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      } else {
        return { key, direction: "asc" };
      }
    });
  };

  const sortData = (data) => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = getValue(a, sortConfig.key);
      const bValue = getValue(b, sortConfig.key);

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  // helper to safely extract nested values
  const getValue = (obj, key) => {
    try {
      return key.split(".").reduce((acc, part) => acc && acc[part], obj) || "";
    } catch {
      return "";
    }
  };

  const hasArchivePermission = data?.specialPermission?.some((perm) => perm.toLowerCase() === "archivedocuments");

  const tabs = ["certificates", "Archive Documents", "Reports"];

  const formatDate = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "2-digit",
        })
      : "N/A";

  const fetchJournals = async () => {
    try {
      const res = await getJournalsList();
      const data = res?.data;
      if (data?.status === "success" && Array.isArray(data?.data)) {
        setJournals(data.data);
      }
    } catch (error) {
      console.error("Error fetching journals:", error);
    }
  };

  const fetchCertificatesData = async () => {
    setLoading(true);
    try {
      const filterKeys = [];
      const filterValues = [];
      if (selectedReportNumber) {
        filterKeys.push("activity.journal.journalTypeId");
        filterValues.push(selectedReportNumber);
      }
      if (placeFilter) {
        filterKeys.push("place");
        filterValues.push(placeFilter);
      }
      if (statusFilter) {
        filterKeys.push("activity.status");
        filterValues.push(statusFilter);
      }
      const searchQuery = debouncedSearch.trim();
      const markAsArchive = selectedFilter === "Archive Documents";
      const res = showAll ? await getAllIssuedDocuments(filterKeys, filterValues, searchQuery, undefined, undefined, startDate, endDate, markAsArchive) : await getAllIssuedDocuments(filterKeys, filterValues, searchQuery, page, limit, startDate, endDate, markAsArchive);
      const data = res?.data;
      if (data?.status === "success" && Array.isArray(data?.data)) {
        setCertificatesList(data.data);
        console.log(data.data, "data");
        setTotalRows(data.results);
        setTotalCount(data.results);
      } else {
        setCertificatesList([]);
        setTotalRows(0);
      }
    } catch (error) {
      console.error(error);
      setCertificatesList([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setOpenDialog(false);
    if (!selectedDocument) return;
    try {
      if (selectedDocument.type === "document") {
        const res = await deleteSurveyStatusReport(selectedDocument.id);
        toast.success("Document deleted successfully");
        fetchReportsData();
      } else if (selectedDocument.type === "report") {
        await deleteSurveyReport(selectedDocument.id);
        toast.success("Report deleted successfully");
        fetchReportsData();
      }
    } catch (e) {
      console.error("Error deleting:", e.response?.data || e.message);
      toast.error("Failed to delete.");
    }
  };

  const handleCancelDelete = () => {
    setSelectedDocument(null);
    setOpenDialog(false);
  };

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      const res = showAll ? await getAllReports("", "", search) : await getAllReports(page, limit, search);
      const data = res?.data;
      if (data?.status === "success" && Array.isArray(data?.data)) {
        setReportsList(data?.data);
        setTotalRows(data?.results || data.data.length);
        setTotalCount(data?.results || data.data.length);
      } else {
        setReportsList([]);
        setTotalRows(0);
      }
    } catch (error) {
      console.error(error);
      setReportsList([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, []);

  useEffect(() => {
    if (selectedFilter === "Reports") fetchReportsData();
    else fetchCertificatesData();
  }, [selectedFilter, page, limit, debouncedSearch, selectedReportNumber, placeFilter, statusFilter, startDate, endDate, showAll]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const handlePageChange = (event, value) => {
    setPage(value);
    router.push(`/certificates?page=${value}&limit=${limit}`);
  };

  const handleViewDocument = (url) => {
    if (!url) return;
    const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
    setPreviewFile(viewerUrl);
    setOpenPreviewModal(true);
  };

  const handleDownloadDocument = async (url) => {
    if (!url) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = url.split("/").pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(error);
      window.open(url, "_blank");
    }
  };

  const handleBulkDownload = async () => {
    if (!certificatesList.length) return;
    const zip = new JSZip();
    const folder = zip.folder(certificatesList[0]?.activity?.journal?.client?.shipName || "Certificates");
    setLoading(true);
    try {
      await Promise.all(
        certificatesList.map(async (cert) => {
          if (!cert.generatedDoc) return;
          const res = await fetch(cert.generatedDoc);
          const blob = await res.blob();
          const fileName = `${cert.generatedDoc.split("/").pop()}`;
          folder.file(fileName, blob);
        })
      );
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${certificatesList[0]?.activity?.journal?.client?.shipName || "Certificates"}.zip`);
      toast.success("All files downloaded successfully as a zip!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to download all files.");
    } finally {
      setLoading(false);
    }
  };

  const sortedCertificates = sortData(certificatesList);
  const sortedReports = sortData(reportsList);

  const handleBulkDownloadReports = async () => {
    if (!reportsList.length) return;
    const zip = new JSZip();
    const folder = zip.folder(reportsList[0]?.client?.shipName || "Reports");
    setLoading(true);
    try {
      await Promise.all(
        reportsList.map(async (report) => {
          if (!report.generatedDoc) return;
          const res = await fetch(report.generatedDoc);
          const blob = await res.blob();
          const fileName = `${report.client?.shipName || "Report"}_${report.generatedDoc.split("/").pop()}`;
          folder.file(fileName, blob);
        })
      );
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${reportsList[0]?.client?.shipName || "Reports"}.zip`);
      toast.success("All reports downloaded successfully as a zip!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to download all reports.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <CommonCard>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" fontWeight={700}>
            Issued Certificates
          </Typography>
        </Stack>
      </CommonCard>

      <CommonCard>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Stack direction="row" spacing={2}>
            {tabs.map((tab) => (
              <Chip key={tab} label={tab} color={selectedFilter === tab ? "primary" : "default"} onClick={() => setSelectedFilter(tab)} />
            ))}
          </Stack>
          {hasArchivePermission && (
            <Stack>
              <CommonButton variant="contained" onClick={selectedFilter === "Reports" ? handleBulkDownloadReports : handleBulkDownload} text="Download All">
                Download All
              </CommonButton>
            </Stack>
          )}
        </Box>
        <CommonInput placeholder="Search" fullWidth value={search} onChange={(e) => setSearch(e.target.value)} sx={{ mb: 2 }} />
        <Box sx={{ width: "100%", overflowX: "auto", height: "70vh" }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="300px">
              <CircularProgress />
            </Box>
          ) : (
            <>
              {selectedFilter === "Reports" && (
                <TableContainer component={Paper}>
                  <Table sx={{ marginTop: 2 }}>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                        {[
                          { label: "No.", key: null, width: "10%" },
                          { label: "Ship Name", key: "client.shipName", width: "15%" },
                          { label: "Document", key: "generatedDoc" },
                          { label: "Created Date", key: "createdAt", width: "15%" },
                          { label: "Actions", key: null },
                        ].map((col) => (
                          <TableCell
                            key={col.label}
                            sx={{
                              cursor: col.key ? "pointer" : "default",
                              fontWeight: 600,
                              width: col.width || "auto",
                              whiteSpace: "nowrap",
                            }}
                            onClick={() => col.key && handleSort(col.key)}
                          >
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Typography variant="body2">{col.label}</Typography>
                              {col.key && sortConfig.key === col.key && (sortConfig.direction === "asc" ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
                            </Stack>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {sortedReports.map((row, idx) => (
                        <TableRow key={row.id}>
                          <TableCell>{(page - 1) * limit + idx + 1}</TableCell>
                          <TableCell>{row.client?.shipName || "N/A"}</TableCell>
                          <TableCell>
                            {row.generatedDoc
                              ? row.generatedDoc
                                  .split("/")
                                  .pop()
                                  .replace(/_/g, " ")
                                  .replace(/\.[^/.]+$/, "")
                              : "N/A"}
                          </TableCell>
                          <TableCell>{formatDate(row.createdAt)}</TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Tooltip title="View Document">
                                <IconButton color="info" onClick={() => handleViewDocument(row.generatedDoc)} disabled={!row.generatedDoc}>
                                  <VisibilityIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Report">
                                <IconButton
                                  color="error"
                                  onClick={() => {
                                    setSelectedDocument({ id: row?.id, type: "report" });
                                    setOpenDialog(true);
                                  }}
                                  disabled={!row.generatedDoc}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {selectedFilter === "certificates" && (
                <TableContainer component={Paper}>
                  <Table sx={{ marginTop: 2 }}>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                        {[
                          { label: "No.", key: null, width: "100px" },
                          { label: "Report No.", key: "activity.journal.journalTypeId", width: "15%" },
                          { label: "Ship Name", key: "activity.journal.client.shipName", width: "15%" },
                          { label: "Certificate Type", key: "typeOfCertificate", width: "15%" },
                          { label: "Survey Type", key: "activity.surveyTypes.name", width: "20%" },
                          { label: "Survey Date", key: "surveyDate", width: "15%" },
                          { label: "Actions", key: null, width: "100px" },
                        ].map((col) => (
                          <TableCell
                            key={col.label}
                            sx={{
                              cursor: col.key ? "pointer" : "default",
                              fontWeight: 600,
                              width: col.width || "auto",
                              whiteSpace: "nowrap",
                            }}
                            onClick={() => col.key && handleSort(col.key)}
                          >
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Typography variant="body2">{col.label}</Typography>
                              {col.key && sortConfig.key === col.key && (sortConfig.direction === "asc" ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
                            </Stack>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {sortedCertificates.map((row, idx) => (
                        <TableRow key={row.id}>
                          <TableCell>{(page - 1) * limit + idx + 1}</TableCell>
                          <TableCell>
                            {row.amendmentVersion > 0 ? (
                              <Typography
                                sx={{
                                  color: "primary.main",
                                  textDecoration: "underline",
                                  cursor: "pointer",
                                  fontWeight: 500,
                                }}
                                onClick={() => {
                                  setSelectedReportId(row.id);
                                  setOpenAmdRemarks(true);
                                }}
                              >
                                {row.activity?.journal?.journalTypeId || "N/A"}
                              </Typography>
                            ) : (
                              row.activity?.journal?.journalTypeId || "N/A"
                            )}
                          </TableCell>
                          <TableCell>{row.activity?.journal?.client?.shipName || "N/A"}</TableCell>
                          <TableCell>{row.typeOfCertificate?.replace("_", " ") || "N/A"}</TableCell>
                          <TableCell>{row.activity?.surveyTypes?.name || "N/A"}</TableCell>
                          <TableCell>{formatDate(row.surveyDate)}</TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Tooltip title="View Document">
                                <IconButton color="info" onClick={() => handleViewDocument(row.generatedDoc)} disabled={!row.generatedDoc}>
                                  <VisibilityIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Download Document">
                                <IconButton color="success" onClick={() => handleDownloadDocument(row.generatedDoc)} disabled={!row.generatedDoc}>
                                  <GetAppIcon />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {selectedFilter === "Archive Documents" && (
                <TableContainer component={Paper}>
                  <Table sx={{ marginTop: 2 }}>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                        {[
                          { label: "No.", key: null, width: "100px" },
                          { label: "Report No.", key: "activity.journal.journalTypeId", width: "15%" },
                          { label: "Ship Name", key: "activity.journal.client.shipName", width: "15%" },
                          { label: "Certificate Type", key: "typeOfCertificate", width: "15%" },
                          { label: "Survey Type", key: "activity.surveyTypes.name", width: "20%" },
                          { label: "Survey Date", key: "surveyDate", width: "15%" },
                          { label: "Actions", key: null, width: "100px" },
                        ].map((col) => (
                          <TableCell
                            key={col.label}
                            sx={{
                              cursor: col.key ? "pointer" : "default",
                              fontWeight: 600,
                              width: col.width || "auto",
                              whiteSpace: "nowrap",
                            }}
                            onClick={() => col.key && handleSort(col.key)}
                          >
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Typography variant="body2">{col.label}</Typography>
                              {col.key && sortConfig.key === col.key && (sortConfig.direction === "asc" ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
                            </Stack>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {sortedCertificates.map((row, idx) => (
                        <TableRow key={row.id}>
                          <TableCell>{(page - 1) * limit + idx + 1}</TableCell>
                          <TableCell>
                            {row.amendmentVersion > 0 ? (
                              <Typography
                                sx={{
                                  color: "primary.main",
                                  textDecoration: "underline",
                                  cursor: "pointer",
                                  fontWeight: 500,
                                }}
                                onClick={() => {
                                  setSelectedReportId(row.id);
                                  setOpenAmdRemarks(true);
                                }}
                              >
                                {row.activity?.journal?.journalTypeId || "N/A"}
                              </Typography>
                            ) : (
                              row.activity?.journal?.journalTypeId || "N/A"
                            )}
                          </TableCell>
                          <TableCell>{row.activity?.journal?.client?.shipName || "N/A"}</TableCell>
                          <TableCell>{row.typeOfCertificate?.replace("_", " ") || "N/A"}</TableCell>
                          <TableCell>{row.activity?.surveyTypes?.name || "N/A"}</TableCell>
                          <TableCell>{formatDate(row.surveyDate)}</TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Tooltip title="View Document">
                                <IconButton color="info" onClick={() => handleViewDocument(row.generatedDoc)} disabled={!row.generatedDoc}>
                                  <VisibilityIcon />
                                </IconButton>
                              </Tooltip>
                              {hasArchivePermission && (
                                <Tooltip title="Download Document">
                                  <IconButton color="success" onClick={() => handleDownloadDocument(row.generatedDoc)} disabled={!row.generatedDoc}>
                                    <GetAppIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}>
          <Typography>Total Count: {count}</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <CommonButton
              text={showAll ? "Show Paginated" : "Show All"}
              variant="outlined"
              size="small"
              sx={{ textTransform: "uppercase", padding: "6px 6px", fontSize: "14px" }}
              onClick={() => {
                setShowAll((prev) => !prev);
                setPage(1);
              }}
            />{" "}
            {!showAll && <Pagination count={Math.ceil(totalRows / limit)} page={page} onChange={handlePageChange} color="primary" variant="outlined" shape="rounded" sx={{ marginTop: "10px" }} />}{" "}
          </Stack>
        </Stack>
      </CommonCard>

      <DocumentPreview open={openPreviewModal} fileUrl={previewFile} onClose={() => setOpenPreviewModal(false)} />
      <CommonConfirmationDialog open={openDialog} onClose={handleCancelDelete} onConfirm={handleConfirmDelete} title="Are you sure you want to delete this survey status report?" description="This action cannot be undone." />
      <ShowAmdRemarksDialog open={openAmdRemarks} onClose={() => setOpenAmdRemarks(false)} reportDetailId={selectedReportId} hasArchivePermission={hasArchivePermission} />
    </Layout>
  );
};

export default Certificates;
