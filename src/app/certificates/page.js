"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import CircularProgress from "@mui/material/CircularProgress";
import Pagination from "@mui/material/Pagination";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Snackbar from "@mui/material/Snackbar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DataGrid } from "@mui/x-data-grid";
import VisibilityIcon from "@mui/icons-material/Visibility";
import GetAppIcon from "@mui/icons-material/GetApp";
import Layout from "@/Layout";
import CommonCard from "@/components/CommonCard";
import CommonInput from "@/components/CommonInput";
import { deleteSurveyReport, deleteSurveyStatusReport, getAllIssuedDocuments, getAllReports, getJournalsList } from "@/api";
import { Chip, MenuItem, Select, TextField } from "@mui/material";
import CommonButton from "@/components/CommonButton";
import { useAuth } from "@/hooks/useAuth";
import DeleteIcon from "@mui/icons-material/Delete";
import PreviewIcon from "@mui/icons-material/Visibility";
import CommonConfirmationDialog from "@/components/Dialogs/CommonConfirmationDialog";
import { toast } from "react-toastify";
import ShowAmdRemarksDialog from "@/components/Dialogs/ShowAmdRemarksDialog";
import DocumentPreview from "@/components/Dialogs/DocumentPreview";

const Certificates = () => {
  const { data } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [snackBar, setSnackBar] = useState({ open: false, message: "" });
  const [certificatesList, setCertificatesList] = useState([]);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [limit, setLimit] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [journals, setJournals] = useState([]);
  const [selectedReportNumber, setSelectedReportNumber] = useState("");
  const [placeFilter, setPlaceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("certificates");
  const [count, setTotalCount] = useState(0);
  const [reportsList, setReportsList] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState({});
  const [previewFile, setPreviewFile] = useState(null);
  const [openPreviewModal, setOpenPreviewModal] = useState(false);
  const [openAmdRemarks, setOpenAmdRemarks] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      const res = await getAllReports(page, limit);
      const data = res?.data;
      if (data?.status === "success" && Array.isArray(data?.data)) {
        setReportsList(data.data);
        setTotalRows(data.total || data.results || data.data.length);
        setTotalCount(data?.results);
      } else {
        setReportsList([]);
        setTotalRows(0);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      setReportsList([]);
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

  const handleOpenAmdRemarks = (reportId) => {
    setSelectedReportId(reportId);
    setOpenAmdRemarks(true);
  };

  useEffect(() => {
    if (selectedFilter === "Reports") {
      fetchReportsData();
    } else {
      fetchCertificatesData();
    }
  }, [selectedFilter, selectedReportNumber, placeFilter, statusFilter, debouncedSearch, page, limit, startDate, endDate]);

  const reportColumns = [
    {
      field: "id",
      headerName: "No.",
      width: 200,
      renderCell: (params) => <Typography fontSize="14px">{(page - 1) * limit + params.api.getAllRowIds().indexOf(params.id) + 1}</Typography>,
    },
    {
      field: "reportName",
      headerName: "Ship Name",
      flex: 1,
      renderCell: (params) => <Typography fontSize="14px">{params.row.client.shipName || "N/A"}</Typography>,
    },
    {
      field: "document",
      headerName: "Document",
      flex: 1,
      renderCell: (params) => {
        const fileName = params.row.generatedDoc?.split("/").pop();
        return fileName ? (
          <Tooltip title={fileName}>
            <Typography
              fontSize="14px"
              sx={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                cursor: "pointer",
                color: "primary.main",
                textDecoration: "underline",
              }}
              onClick={() => window.open(params.row.generatedDoc, "_blank")}
            >
              {fileName}
            </Typography>
          </Tooltip>
        ) : (
          <Typography fontSize="14px">N/A</Typography>
        );
      },
    },
    {
      field: "createdAt",
      headerName: "Created Date",
      flex: 1,
      renderCell: (params) => <Typography fontSize="14px">{formatDate(params.value)}</Typography>,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Preview Report">
            <IconButton
              color="info"
              onClick={() => {
                setPreviewFile(params.row.generatedDoc);
                setOpenPreviewModal(true);
              }}
            >
              <PreviewIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Report">
            <IconButton
              color="error"
              onClick={() => {
                setSelectedDocument({ id: params?.id, type: "report" });
                setOpenDialog(true);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const handleFilterChange = (newFilter) => {
    setSelectedFilter(newFilter);
  };

  const tabs = ["certificates"];
  tabs.push("Archive Documents");
  tabs.push("Reports");

  const snackbarClose = () => {
    setSnackBar({ open: false, message: "" });
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

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
      console.log(selectedFilter, "selectedFilter");
      const markAsArchive = selectedFilter === "Archive Documents" ? true : false;
      console.log(markAsArchive, "markAsArchive");
      const res = await getAllIssuedDocuments(filterKeys, filterValues, searchQuery, page, limit, startDate, endDate, markAsArchive);

      const data = res?.data;

      if (data?.status === "success" && Array.isArray(data?.data)) {
        setCertificatesList(data.data);
        setTotalRows(data.total || data.results || data.data.length);
        setTotalCount(data?.results);
      } else {
        setCertificatesList([]);
        setTotalRows(0);
      }
    } catch (e) {
      console.error("Error fetching certificates:", e);
      setCertificatesList([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    router.push(`/certificates?page=${value}&limit=${limit}`);
  };

  const handleViewDocument = (documentUrl) => {
    if (!documentUrl) return;
    const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(documentUrl)}&embedded=true`;
    setPreviewFile(viewerUrl);
    setOpenPreviewModal(true);
  };

  const handleDownloadDocument = async (documentUrl, certificateId) => {
    if (!documentUrl) {
      console.error("Document URL is missing");
      return;
    }
    try {
      const response = await fetch(documentUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${documentUrl?.split("/").pop()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(documentUrl, "_blank");
    }
  };

  const hasArchivePermission = data?.specialPermission?.some((perm) => perm.toLowerCase() === "archivedocuments".toLowerCase());

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const columns = [
    {
      field: "id",
      headerName: "No.",
      width: 80,
      renderCell: (params) => {
        return <Typography fontSize="14px">{(page - 1) * limit + params.api.getAllRowIds().indexOf(params.id) + 1}</Typography>;
      },
    },
    {
      field: "journalTypeId",
      headerName: "Report No",
      flex: 1,
      renderCell: (params) => {
        const hasAmendments = params.row.amendmentVersion > 0;
        const reportNo = params.row.activity?.journal?.journalTypeId || "N/A";

        return hasAmendments ? (
          <Typography
            sx={{
              color: "primary.main",
              textDecoration: "underline",
              cursor: "pointer",
              fontWeight: 500,
            }}
            onClick={() => handleOpenAmdRemarks(params.row.id)}
          >
            {reportNo}
          </Typography>
        ) : (
          <Typography fontSize="14px">{reportNo}</Typography>
        );
      },
    },

    {
      field: "shipName",
      headerName: "Ship Name",
      flex: 1,
      renderCell: (params) => <Typography fontSize="14px">{params.row.activity?.journal?.client?.shipName || "N/A"}</Typography>,
    },
    {
      field: "typeOfCertificate",
      headerName: "Certificate Type",
      flex: 1,
      renderCell: (params) => (
        <Typography fontSize="14px" sx={{ textTransform: "capitalize" }}>
          {params.value?.replace("_", " ") || "N/A"}
        </Typography>
      ),
    },
    {
      field: "surveyType",
      headerName: "Survey Type",
      flex: 1,
      renderCell: (params) => (
        <Typography
          fontSize="14px"
          sx={{
            whiteSpace: "normal",
            wordBreak: "break-word",
            width: "120px",
          }}
        >
          {params.row.activity?.surveyTypes?.name || "N/A"}
        </Typography>
      ),
    },
    {
      field: "surveyDate",
      headerName: "Survey Date",
      flex: 1,
      renderCell: (params) => <Typography fontSize="14px">{formatDate(params.value)}</Typography>,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="View Document">
            <IconButton color="info" onClick={() => handleViewDocument(params.row.generatedDoc)} disabled={!params.row.generatedDoc}>
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          {((hasArchivePermission && (selectedFilter === "Archive Documents" || selectedFilter === "Archive Documents" || selectedFilter === "certificates")) || (!hasArchivePermission && selectedFilter === "certificates")) && (
            <Tooltip title="Download Document">
              <IconButton color="success" onClick={() => handleDownloadDocument(params.row.generatedDoc, params.row.id)} disabled={!params.row.generatedDoc}>
                <GetAppIcon />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  const fetchJournals = async () => {
    try {
      const response = await getJournalsList();
      const data = response?.data;
      if (data?.status === "success" && Array.isArray(data?.data)) {
        setJournals(data.data);
      }
    } catch (error) {
      console.log("Error fetching journals:", error);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, []);

  const handleClearFilter = () => {
    setSelectedReportNumber("");
    setPlaceFilter("");
    setStatusFilter("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(previewFile)}&embedded=true`;

  return (
    <Layout>
      <CommonCard sx={{ mt: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h4" fontWeight={700}>
            Issued Certificates
          </Typography>
        </Stack>
      </CommonCard>

      <CommonCard>
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          {tabs.map((type) => (
            <Chip key={type} label={type.charAt(0).toUpperCase() + type.slice(1)} color={selectedFilter === type ? "primary" : "default"} onClick={() => handleFilterChange(type)} clickable sx={{ fontWeight: selectedFilter === type ? 600 : 400, px: 2 }} />
          ))}
        </Stack>
        {selectedFilter !== "Reports" && <CommonInput placeholder="Search Certificate By Place or Type" fullWidth value={search} onChange={handleSearchChange} sx={{ marginBottom: 2 }} />}
        {selectedFilter !== "Reports" && (
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, mt: 2 }}>
            <Select
              value={selectedReportNumber}
              onChange={(e) => {
                setSelectedReportNumber(e.target.value);
                setPage(1);
              }}
              displayEmpty
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">All Reports</MenuItem>
              {journals.map((report, index) => (
                <MenuItem key={index} value={report.journalTypeId}>
                  {report.journalTypeId}
                </MenuItem>
              ))}
            </Select>

            {/* <TextField
            label="Place"
            size="small"
            value={placeFilter}
            onChange={(e) => { setPlaceFilter(e.target.value); setPage(1); }}
          />

          <TextField
            label="Activity Status"
            size="small"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          /> */}

            <TextField
              label="Survey Date From"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />

            <TextField
              label="Survey Date To"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />

            {(selectedReportNumber || placeFilter || statusFilter || startDate || endDate) && (
              <CommonButton
                variant="contained"
                size="small"
                sx={{
                  textTransform: "uppercase",
                  padding: "12px 10px",
                  fontSize: "14px",
                }}
                text="Clear Filters"
                onClick={() => {
                  handleClearFilter();
                }}
              />
            )}
          </Stack>
        )}

        <Box sx={{ width: "100%", mt: 4 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="300px">
              <CircularProgress />
            </Box>
          ) : selectedFilter === "Reports" ? (
            reportsList.length > 0 ? (
              <DataGrid
                rows={reportsList}
                columns={reportColumns}
                pagination={false}
                disableColumnFilter
                disableColumnMenu
                disableColumnSelector
                disableDensitySelector
                disableRowSelectionOnClick
                hideFooter
                getRowHeight={() => 70}
                sx={{
                  backgroundColor: "#fff",
                  border: "none",
                  "& .MuiDataGrid-cell": {
                    display: "flex",
                    alignItems: "center",
                  },
                }}
              />
            ) : (
              <Typography variant="h6" align="center" sx={{ color: "gray", padding: 3 }}>
                No Reports Found
              </Typography>
            )
          ) : certificatesList.length > 0 ? (
            <DataGrid
              rows={certificatesList}
              columns={columns}
              pagination={false}
              disableColumnFilter
              disableColumnMenu
              disableColumnSelector
              disableDensitySelector
              disableRowSelectionOnClick
              hideFooter
              getRowHeight={() => 70}
              sx={{
                backgroundColor: "#fff",
                border: "none",
                "& .MuiDataGrid-cell": {
                  display: "flex",
                  alignItems: "center",
                },
              }}
            />
          ) : (
            <Typography variant="h6" align="center" sx={{ color: "gray", padding: 3 }}>
              No Certificates Found
            </Typography>
          )}
        </Box>

        {totalRows > limit && (
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
            <Typography variant="body1" fontWeight={600} fontSize="16px" mt={2} color="text.primary">
              Total Count: {count}
            </Typography>
            <Pagination count={Math.ceil(totalRows / limit)} page={page} onChange={handlePageChange} color="primary" variant="outlined" shape="rounded" sx={{ marginTop: "10px" }} />
          </Box>
        )}
      </CommonCard>

      <Snackbar
        open={snackBar.open}
        autoHideDuration={2000}
        message={snackBar.message}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        onClose={snackbarClose}
        className="snackBarColor"
        key="snackbar"
      />
      <DocumentPreview open={openPreviewModal} fileUrl={previewFile} onClose={() => setOpenPreviewModal(false)} />
      <CommonConfirmationDialog open={openDialog} onClose={handleCancelDelete} onConfirm={handleConfirmDelete} title="Are you sure you want to delete this survey status report?" description="This action cannot be undone." />
      <ShowAmdRemarksDialog open={openAmdRemarks} onClose={() => setOpenAmdRemarks(false)} reportDetailId={selectedReportId} selectedFilter={selectedFilter} />
    </Layout>
  );
};

export default Certificates;
