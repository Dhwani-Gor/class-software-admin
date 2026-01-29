"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Stack, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip, Chip, TextField, Select, MenuItem, CircularProgress, Checkbox, ListItemText, ListItemIcon } from "@mui/material";
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
import { deleteCheckList, deleteSurveyReport, deleteSurveyStatusReport, getAllChecklist, getAllIssuedDocuments, getAllReports, getAllSystemVariables, getJournalsList, getSingleChecklist, issuedDocumentSearch, markAsRevoked } from "@/api";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Menu } from "@mui/material";
import SendEmailDialog from "@/components/Dialogs/DownloadAllEmailDialog";
import EmailIcon from "@mui/icons-material/Email";
import { DownloadOutlined } from "@mui/icons-material";
import BlockIcon from "@mui/icons-material/Block";
import ChecklistPreviewModal from "@/components/Dialogs/CheckListPreviewDialog";

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
  const [selectedFilter, setSelectedFilter] = useState("Certificates");
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
  const [openEmailDialog, setOpenEmailDialog] = useState(false);
  const [zipType, setZipType] = useState("");
  const [selectedCertificates, setSelectedCertificates] = useState([]);
  const [selectedArchives, setSelectedArchives] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedReports, setSelectedReports] = useState([]);
  const [createdUserEmail, setCreatedUserEmail] = useState("");
  const [checkList, setCheckList] = useState([]);
  console.log(checkList, "checkList");
  const [selectedCheckList, setSelectedCheckList] = useState(null);
  console.log(selectedCheckList, "selectedCheckList");
  const [checkListPreview, setCheckListPreview] = useState(false);
  const [checkListPreviewFile, setChecklistPreviewFile] = useState();
  const [systemVariables, setSystemVariables] = useState();
  const [title, setTitle] = useState("");

  const prefix = systemVariables?.find((item) => item.name === "report_no_prefix")?.information ?? "-";
  const isSearchMode = debouncedSearch.trim().length > 0;

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      } else {
        return { key, direction: "asc" };
      }
    });
  };

  const handleSelectAllCertificates = (rows) => {
    if (selectedCertificates.length === rows.length) {
      setSelectedCertificates([]);
    } else {
      setSelectedCertificates(rows.map((r) => r.id));
    }
  };

  const handleSelectCertificate = (id, email) => {
    if (!selectedCertificates.includes(id)) {
      setCreatedUserEmail(email);
    }

    setSelectedCertificates((prev) => (prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]));
  };

  const handleSelectAllArchives = (rows) => {
    if (selectedArchives.length === rows.length) {
      setSelectedArchives([]);
    } else {
      setSelectedArchives(rows.map((r) => r.id));
    }
  };

  const handleSelectArchive = (id, email) => {
    if (!selectedArchives.includes(id)) {
      setCreatedUserEmail(email);
    }
    setSelectedArchives((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSelectAllReports = (rows) => {
    if (selectedReports.length === rows.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(rows.map((r) => r.id));
    }
  };

  const handleSelectReport = (id, email) => {
    if (!selectedReports.includes(id)) {
      setCreatedUserEmail(email);
    }
    setSelectedReports((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
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

  const getValue = (obj, key) => {
    try {
      return key.split(".").reduce((acc, part) => acc && acc[part], obj) || "";
    } catch {
      return "";
    }
  };

  const getSystemVariables = async () => {
    try {
      const response = await getAllSystemVariables();
      if (response?.data?.status === "success") {
        setSystemVariables(response?.data?.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getSystemVariables();
  }, []);
  const getCheckList = async () => {
    setLoading(true);
    try {
      const res = showAll ? await getAllChecklist("", "", debouncedSearch) : await getAllChecklist(page, limit, debouncedSearch);
      if (res?.data?.status === "success" && Array.isArray(res?.data?.data)) {
        setCheckList(res?.data?.data);
        setTotalRows(res?.data?.results || res?.data?.data?.length);
        setTotalCount(res?.data?.results || res?.data?.data?.length);
      } else {
        setCheckList([]);
        setTotalRows(0);
        setTotalCount(0);
      }
    } catch (e) {
      setCheckList([]);
      setTotalRows(0);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedFilter === "Checklist") {
      getCheckList();
    }
  }, [selectedFilter, page, limit, debouncedSearch, showAll]);

  useEffect(() => {
    setZipType(selectedFilter === "Certificates" ? "certificates" : selectedFilter === "Archive Documents" ? "archive-documents" : "reports");
  }, [selectedFilter]);

  const hasArchivePermission = data?.specialPermission?.some((perm) => perm.toLowerCase() === "archivedocuments");

  const tabs = ["Certificates", "Archive Documents", "Reports", "Checklist"];

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
  const markAsArchive = selectedFilter === "Archive Documents";
  const issuedDocument = selectedFilter === "Certificates" || selectedFilter === "Archive Documents" ? true : false;

  const fetchCertificatesData = async () => {
    setLoading(true);
    try {
      let data;
      if (isSearchMode) {
        const res = showAll ? await issuedDocumentSearch(debouncedSearch, undefined, undefined, markAsArchive) : await issuedDocumentSearch(debouncedSearch, page, limit, markAsArchive);
        data = res?.data;
        setCertificatesList(data?.data);
        setTotalCount(data?.results);
        setTotalRows(data?.results);
      } else {
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
        const res = showAll ? await getAllIssuedDocuments(filterKeys, filterValues, searchQuery, undefined, undefined, startDate, endDate, markAsArchive, issuedDocument) : await getAllIssuedDocuments(filterKeys, filterValues, searchQuery, page, limit, startDate, endDate, markAsArchive, issuedDocument);
        const data = res?.data;
        if (data?.status === "success" && Array.isArray(data?.data)) {
          setCertificatesList(data.data);
          setTotalRows(data.results);
          setTotalCount(data.results);
        } else {
          setCertificatesList([]);
          setTotalRows(0);
        }
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
        setTitle("Document");
        const res = await deleteSurveyStatusReport(selectedDocument.id);
        toast.success("Document deleted successfully");
        fetchReportsData();
      } else if (selectedDocument.type === "report") {
        setTitle("Report");
        await deleteSurveyReport(selectedDocument.id);
        toast.success("Report deleted successfully");
        fetchReportsData();
      } else if (selectedDocument.type === "checklist") {
        setTitle("Checklist");
        await deleteCheckList(selectedDocument.id);
        toast.success("Checklist deleted successfully");
        getCheckList();
      }
    } catch (e) {
      console.error("Error deleting:", e.response?.data || e.message);
    }
  };

  const handleCancelDelete = () => {
    setSelectedDocument(null);
    setSelectedCheckList(null);
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
    if (selectedFilter === "Reports") {
      fetchReportsData();
    }

    if (selectedFilter === "Certificates" || selectedFilter === "Archive Documents") {
      fetchCertificatesData();
    }
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

  useEffect(() => {
    if (selectedFilter === "Checklist") {
      setTotalRows(0);
      setTotalCount(0);
    }
  }, [selectedFilter]);

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
    const folderName = `${prefix} Certificates`;
    const folder = zip.folder(folderName);
    setLoading(true);
    try {
      await Promise.all(
        certificatesList.map(async (cert) => {
          if (!cert.generatedDoc) return;
          const res = await fetch(cert.generatedDoc);
          const blob = await res.blob();
          const fileName = `${cert.generatedDoc.split("/").pop()}`;
          folder.file(fileName, blob);
        }),
      );
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${folderName}.zip`);
      toast.success("All files downloaded successfully as a zip!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to download all files.");
    } finally {
      setLoading(false);
    }
  };

  const resolveFileUrl = (doc) => {
    if (!doc) return null;

    if (doc.startsWith("http")) return doc;

    return `${process.env.NEXT_PUBLIC_FILE_BASE_URL}/${doc}`;
  };

  const handleBulkDownloadSelected = async (selectedIds) => {
    if (selectedIds.length === 0) return;

    const zip = new JSZip();
    const folderName = `${prefix} Certificates`;
    const folder = zip.folder(folderName);
    setLoading(true);

    try {
      const selectedCerts = certificatesList.filter((cert) => selectedIds.includes(cert.id));

      await Promise.all(
        selectedCerts.map(async (cert) => {
          if (!cert.generatedDoc) return;
          const fileUrl = resolveFileUrl(cert.generatedDoc);
          if (!fileUrl) return;

          const res = await fetch(fileUrl);
          const blob = await res.blob();
          const fileName = `${cert.generatedDoc.split("/").pop()}`;
          folder.file(fileName, blob);
        }),
      );

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${folderName}_Selected.zip`);
      toast.success(`${selectedCerts.length} selected files downloaded successfully as a zip!`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to download selected files.");
    } finally {
      setLoading(false);
    }
  };

  const sortedCertificates = sortData(certificatesList);
  const sortedReports = sortData(reportsList);

  const handleBulkDownloadReports = async () => {
    if (!reportsList.length) return;
    const zip = new JSZip();
    const folder = zip.folder(`${prefix} Reports`);
    setLoading(true);
    try {
      await Promise.all(
        reportsList.map(async (report) => {
          if (!report.generatedDoc) return;
          const res = await fetch(report.generatedDoc);
          const blob = await res.blob();

          const file = report.generatedDoc.split("/").pop();
          const regex = new RegExp(`${prefix}[A-Z0-9]+`, "gi");
          const matches = file.match(regex);
          const reportNo = matches ? matches[matches.length - 1] : null;
          const shipName = report.client?.shipName || report.ship?.name || "";

          // Determine proper filename format (same as individual download)
          const fileName = (() => {
            if (/status[_ ]?report/i.test(file)) {
              return `${prefix} Survey Status - ${shipName}.pdf`;
            }
            if (/survey[_ ]?report/i.test(file)) {
              return `Survey Report${reportNo ? ` - ${reportNo}` : ""} - ${shipName}.pdf`;
            }
            if (/narrative[_ ]?report/i.test(file)) {
              return `Narrative Report${reportNo ? ` - ${reportNo}` : ""} - ${shipName}.pdf`;
            }
            return file.replace(/_/g, " ").replace(/\.[^/.]+$/, "") + ".pdf";
          })();

          folder.file(fileName, blob);
        }),
      );
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${prefix} Reports.zip`);
      toast.success("All reports downloaded successfully as a zip!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to download all reports.");
    } finally {
      setLoading(false);
    }
  };

  const resolveSelectedRows = () => {
    let masterList = [];

    if (selectedFilter === "Certificates") masterList = certificatesList;
    if (selectedFilter === "Archive Documents") masterList = certificatesList;
    if (selectedFilter === "Reports") masterList = reportsList;
    if (selectedFilter === "Checklist") masterList = checkList;

    const selectedIds = selectedFilter === "Certificates" ? selectedCertificates : selectedFilter === "Archive Documents" ? selectedArchives : selectedFilter === "Reports" ? selectedReports : [];

    return selectedIds.map((id) => {
      const fullRow = masterList.find((item) => item.id === id);
      return {
        ...fullRow,
        shipName: fullRow?.shipName || fullRow?.vesselName || "",
      };
    });
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
              <Chip
                key={tab}
                label={tab}
                color={selectedFilter === tab ? "primary" : "default"}
                onClick={() => {
                  setSelectedFilter(tab);

                  setPage(1);
                }}
              />
            ))}
          </Stack>
          {hasArchivePermission && (
            <Box>
              <IconButton aria-label="more" aria-controls="options-menu" aria-haspopup="true" onClick={(e) => setAnchorEl(e.currentTarget)}>
                <MoreVertIcon />
              </IconButton>

              <Menu
                id="options-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{
                  sx: { width: 200 },
                }}
              >
                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);

                    if (selectedFilter === "Reports") {
                      handleBulkDownloadReports();
                    } else {
                      const selectedIds = selectedFilter === "Certificates" ? selectedCertificates : selectedArchives;

                      if (selectedIds.length > 0) {
                        handleBulkDownloadSelected(selectedIds);
                      } else {
                        handleBulkDownload();
                      }
                    }
                  }}
                >
                  <ListItemIcon>
                    <DownloadOutlined fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Download" />
                  {selectedFilter === "Certificates" && selectedCertificates.length > 0 ? `(${selectedCertificates.length})` : selectedFilter === "Archive Documents" && selectedArchives.length > 0 ? `(${selectedArchives.length})` : ""}
                </MenuItem>

                {(selectedCertificates.length > 0 || selectedArchives.length > 0) && (
                  <MenuItem
                    onClick={async () => {
                      setAnchorEl(null);
                      try {
                        setLoading(true);
                        const idsToRevoke = selectedFilter === "Certificates" ? selectedCertificates : selectedArchives;

                        const res = await markAsRevoked({ reportDetailIds: idsToRevoke });
                        if (res.data.status === "success") {
                          toast.success(res.data.message);
                          if (selectedFilter === "Certificates") setSelectedCertificates([]);
                          else setSelectedArchives([]);
                          fetchCertificatesData();
                        } else {
                          toast.error(res.data.message || "Failed to revoke documents.");
                        }
                      } catch (err) {
                        console.error(err);
                        toast.error("Error revoking documents.");
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    <ListItemIcon>
                      <BlockIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Revoke" />
                    {`(${selectedFilter === "Certificates" ? selectedCertificates.length : selectedArchives.length})`}
                  </MenuItem>
                )}
                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    setOpenEmailDialog(true);
                  }}
                >
                  <ListItemIcon>
                    <EmailIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Send Email" />
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Box>
        <CommonInput
          placeholder="Search"
          fullWidth
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          sx={{ mb: 2 }}
        />
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
                    <TableHead sx={{ padding: 0 }}>
                      <TableRow sx={{ backgroundColor: "#f5f5f5", padding: 0 }}>
                        <TableCell sx={{ width: 50 }}>
                          <Checkbox checked={selectedReports.length === sortedReports.length && sortedReports.length > 0} onChange={() => handleSelectAllReports(sortedReports)} sx={{ padding: 0 }} />
                        </TableCell>
                        {[{ label: "No.", key: null, width: "10%" }, { label: "Ship Name", key: "client.shipName", width: "22%" }, { label: "Document", key: "generatedDoc", width: "35%" }, { label: "Created Date", key: "createdAt", width: "15%" }, { label: "Actions" }].map((col) => (
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
                          <TableCell padding="checkbox">
                            <Checkbox checked={selectedReports.includes(row.id)} onChange={() => handleSelectReport(row.id, row?.createdByUser?.email)} />
                          </TableCell>
                          <TableCell>{(page - 1) * limit + idx + 1}</TableCell>
                          <TableCell>{row.client?.shipName || "N/A"}</TableCell>
                          <TableCell>
                            {(() => {
                              if (!row.generatedDoc) return "N/A";

                              const fileName = row.generatedDoc.split("/").pop();
                              const regex = new RegExp(`${prefix}[A-Z0-9]+`, "gi");
                              const file = row.generatedDoc.split("/").pop();

                              const matches = file.match(regex);

                              const reportNo = matches ? matches[matches.length - 1] : null;

                              if (/status[_ ]?report/i.test(fileName)) {
                                return "Survey Status Report";
                              } else if (/survey[_ ]?report/i.test(fileName)) {
                                return `Survey Report${reportNo ? ` - ${reportNo}` : ""}`;
                              } else if (/narrative[_ ]?report/i.test(fileName)) {
                                return `Narrative Report${reportNo ? ` - ${reportNo}` : ""}`;
                              } else {
                                return fileName.replace(/_/g, " ").replace(/\.[^/.]+$/, "");
                              }
                            })()}
                          </TableCell>

                          <TableCell>{formatDate(row.createdAt)}</TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Tooltip title="View Document">
                                <IconButton color="info" onClick={() => handleViewDocument(row.generatedDoc)} disabled={!row.generatedDoc}>
                                  <VisibilityIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Download Document">
                                <IconButton
                                  color="success"
                                  onClick={() => {
                                    if (!row.generatedDoc) return;

                                    const file = row.generatedDoc.split("/").pop();
                                    const regex = new RegExp(`${prefix}[A-Z0-9]+`, "gi");
                                    const matches = file.match(regex);
                                    const reportNo = matches ? matches[matches.length - 1] : null;
                                    const shipName = row.client?.shipName || row.ship?.name || "Unknown Ship";

                                    // Determine proper filename format
                                    const fileName = (() => {
                                      if (/status[_ ]?report/i.test(file)) {
                                        return `${prefix} Survey Status - ${shipName}.pdf`;
                                      }
                                      if (/survey[_ ]?report/i.test(file)) {
                                        return `Survey Report${reportNo ? ` - ${reportNo}` : ""} - ${shipName}.pdf`;
                                      }
                                      return file.replace(/_/g, " ").replace(/\.[^/.]+$/, "") + ".pdf";
                                    })();

                                    fetch(row.generatedDoc)
                                      .then((res) => res.blob())
                                      .then((blob) => saveAs(blob, fileName))
                                      .catch((err) => {
                                        console.error(err);
                                        window.open(row.generatedDoc, "_blank");
                                      });
                                  }}
                                  disabled={!row.generatedDoc}
                                >
                                  <GetAppIcon />
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

              {selectedFilter === "Checklist" && (
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                        <TableCell sx={{ fontWeight: 600 }}>No.</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Ship Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Survey Type</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Report Number</TableCell>

                        <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {checkList.map((item, idx) => (
                        <TableRow key={item.id}>
                          {/* Ship Name */}
                          <TableCell>{(page - 1) * limit + idx + 1}</TableCell>

                          <TableCell>{item?.clients?.shipName || "N/A"}</TableCell>

                          {/* Report Number */}
                          <TableCell>{item?.surveyTypes?.name || "N/A"}</TableCell>

                          <TableCell>{item?.journalData?.journalTypeId || "N/A"}</TableCell>

                          <TableCell>
                            <Tooltip title="Preview Checklist">
                              <IconButton
                                color="info"
                                onClick={() => {
                                  setSelectedCheckList(item);

                                  setCheckListPreview(true);
                                }}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Delete Checklist">
                              <IconButton
                                color="error"
                                onClick={() => {
                                  setSelectedDocument({ id: item.id, type: "checklist" });
                                  setOpenDialog(true);
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              {selectedFilter === "Certificates" && (
                <TableContainer component={Paper}>
                  <Table sx={{ marginTop: 2 }}>
                    <TableHead sx={{ padding: 0 }}>
                      <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                        <TableCell
                          sx={{
                            fontWeight: 600,
                            width: "100px",
                            whiteSpace: "nowrap",
                            cursor: "pointer",
                            userSelect: "none",
                          }}
                          onClick={() => handleSelectAllCertificates(sortedCertificates)}
                        >
                          <Checkbox checked={selectedCertificates.length === sortedCertificates?.length && sortedCertificates.length > 0} onChange={() => handleSelectAllCertificates(sortedCertificates)} sx={{ padding: 0 }} />
                        </TableCell>

                        {[
                          { label: "No.", key: null, width: "100px" },
                          { label: "Report No.", key: "activity.journal.journalTypeId", width: "15%" },
                          { label: "Ship Name", key: "activity.journal.client.shipName", width: "15%" },
                          { label: "Certificate Type", key: "typeOfCertificate", width: "5%" },
                          { label: "Survey Type", key: "activity.surveyTypes.name", width: "20%" },
                          { label: "Survey Date", key: "surveyDate", width: "15%" },
                          { label: "Status", key: "reportStatus", width: "15%" },
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
                      {sortedCertificates &&
                        sortedCertificates.map((row, idx) => {
                          const today = new Date();

                          const getStatus = (row) => {
                            const validity = row?.validityDate ? new Date(row.validityDate) : null;

                            if (validity) {
                              if (validity > today) return "Valid";
                              if (validity < today) return "Expired";
                            }
                          };
                          return (
                            <TableRow key={row.id}>
                              <TableCell padding="checkbox">
                                <Checkbox checked={selectedCertificates.includes(row.id)} onChange={() => handleSelectCertificate(row.id, row.createdByUser?.email)} />
                              </TableCell>

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
                              <TableCell align="center">
                                {{
                                  full_term: "FT",
                                  short_term: "ST",
                                  interim: "Interim",
                                }[row.typeOfCertificate] || "N/A"}
                              </TableCell>
                              <TableCell>{row.activity?.surveyTypes?.name || "N/A"}</TableCell>
                              <TableCell>{formatDate(row.surveyDate)}</TableCell>
                              <TableCell>{["re-classed", "class"].includes(row.reportStatus) ? "Valid" : row.reportStatus === "revoked" ? "Revoked" : row.reportStatus || getStatus(row)}</TableCell>
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
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {selectedFilter === "Archive Documents" && (
                <TableContainer component={Paper}>
                  <Table sx={{ marginTop: 2 }}>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                        <TableCell
                          sx={{
                            fontWeight: 600,
                            width: "100px",
                            whiteSpace: "nowrap",
                            cursor: "pointer",
                            userSelect: "none",
                          }}
                          onClick={() => handleSelectAllArchives(sortedCertificates)}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              textDecoration: "underline",
                              color: selectedArchives.length === sortedCertificates.length && sortedCertificates.length > 0 ? "primary.main" : "text.primary",
                            }}
                          >
                            <Checkbox checked={selectedArchives.length === sortedCertificates.length && sortedCertificates.length > 0} onChange={() => handleSelectAllArchives(sortedCertificates)} sx={{ padding: 0 }} />
                          </Typography>
                        </TableCell>

                        {[
                          { label: "No.", key: null, width: "100px" },
                          { label: "Report No.", key: "activity.journal.journalTypeId", width: "15%" },
                          { label: "Ship Name", key: "activity.journal.client.shipName", width: "15%" },
                          { label: "Certificate Type", key: "typeOfCertificate", width: "15%" },
                          { label: "Survey Type", key: "activity.surveyTypes.name", width: "20%" },
                          { label: "Survey Date", key: "surveyDate", width: "15%" },
                          { label: "Status", key: "reportStatus", width: "15%" },
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
                      {sortedCertificates.map((row, idx) => {
                        const today = new Date();
                        const getStatus = (row) => {
                          const validity = row?.validityDate ? new Date(row.validityDate) : null;

                          if (validity) {
                            if (validity > today) return "valid";
                            if (validity < today) return "expired";
                          }
                        };
                        return (
                          <TableRow key={row.id}>
                            <TableCell padding="checkbox">
                              <Checkbox checked={selectedArchives.includes(row.id)} onChange={() => handleSelectArchive(row.id, row?.createdByUser?.email)} />
                            </TableCell>

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
                            <TableCell>
                              {{
                                full_term: "FT",
                                short_term: "ST",
                                interim: "Interim",
                              }[row.typeOfCertificate] || "N/A"}
                            </TableCell>
                            <TableCell>{row.activity?.surveyTypes?.name || "N/A"}</TableCell>
                            <TableCell>{formatDate(row.surveyDate)}</TableCell>
                            <TableCell>{["re-classed", "class"].includes(row.reportStatus) ? "Valid" : row.reportStatus === "revoked" ? "Revoked" : row.reportStatus || getStatus(row)}</TableCell>
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
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}>
          <Typography sx={{ fontWeight: "bold" }}>Total Count: {count}</Typography>
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
            />
            {!showAll && <Pagination count={Math.ceil(totalRows / limit)} page={page} onChange={handlePageChange} color="primary" variant="outlined" shape="rounded" sx={{ marginTop: "10px" }} />}{" "}
          </Stack>
        </Stack>
      </CommonCard>
      <DocumentPreview open={openPreviewModal} fileUrl={previewFile} onClose={() => setOpenPreviewModal(false)} />
      <CommonConfirmationDialog open={openDialog} onCancel={handleCancelDelete} onConfirm={handleConfirmDelete} title={`Are you sure you want to delete this ${title}?`} description="This action cannot be undone." />
      <ShowAmdRemarksDialog open={openAmdRemarks} onClose={() => setOpenAmdRemarks(false)} reportDetailId={selectedReportId} hasArchivePermission={hasArchivePermission} selectedFilter={selectedFilter} />
      <SendEmailDialog open={openEmailDialog} onClose={() => setOpenEmailDialog(false)} selectedItems={resolveSelectedRows()} zipType={zipType} allItems={selectedFilter === "Certificates" ? certificatesList : selectedFilter === "Archive Documents" ? certificatesList : selectedFilter === "Reports" ? reportsList : []} createdUserEmail={createdUserEmail} prefix={prefix} />
      <ChecklistPreviewModal
        open={checkListPreview}
        onClose={() => {
          setCheckListPreview(false);
          if (checkListPreviewFile) {
            URL.revokeObjectURL(previewFile);
            setChecklistPreviewFile("");
          }
        }}
        previewUrl={checkListPreviewFile}
        checklistData={selectedCheckList}
      />
    </Layout>
  );
};

export default Certificates;
