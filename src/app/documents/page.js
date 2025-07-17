"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CircularProgress from "@mui/material/CircularProgress";
import Pagination from '@mui/material/Pagination';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from "@mui/material/Snackbar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { DataGrid } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Layout from "@/Layout";
import CommonCard from "@/components/CommonCard";
import CommonButton from "@/components/CommonButton";
import CommonInput from "@/components/CommonInput";
import { deleteDocument, getAllDocuments, getAllSurveyStatusReport, deleteSurveyReport } from "@/api";
import { toast } from "react-toastify";
import PreviewIcon from '@mui/icons-material/Visibility';
import DialogContent from "@mui/material/DialogContent";
import moment from "moment";

const Documents = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [snackBar, setSnackBar] = useState({ open: false, message: "" });
  const [documents, setDocuments] = useState([]);
  const [reports, setReports] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [limit, setLimit] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState({ });
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [previewFile, setPreviewFile] = useState(null);
  const [openPreviewModal, setOpenPreviewModal] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchAllDocuments = async () => {
    try {
      setLoading(true);
      const result = await getAllDocuments();
      if (result?.status === 200) {
        const docs = result.data.data;
        setDocuments(docs);
        applyFilters(docs, selectedFilter);
        setTotalRows(docs.length);
      } else {
        toast.error("Something went wrong! Please try again later.");
      }
    } catch (error) {
      toast.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllReports = async () => {
    try {
      setLoading(true);
      const result = await getAllSurveyStatusReport();
      if (result?.data?.status === "success") {
        const docs = result.data.data;
        setReports(docs);
      } else {
        toast.error("Something went wrong! Please try again later.");
      }
    } catch (error) {
      toast.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDocuments();
    fetchAllReports();
  }, []);

  const applyFilters = (docs, filter) => {
    let filtered = [...docs];
    if (debouncedSearch) {
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    if (filter === "reports") {
      filtered = filtered.filter((document, index) => document.type === "report");
    } else if (filter === "certificates") {
      filtered = filtered.filter((document, index) => document.type === "certificate");
    }
    setFilteredDocuments(filtered);
    setTotalRows(filtered.length);
  };

  useEffect(() => {
    applyFilters(documents, selectedFilter);
  }, [debouncedSearch, selectedFilter]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
  };

  const handleFilterChange = (newFilter) => {
    setSelectedFilter(newFilter);
    setPage(1);
  };

  const handleConfirmDelete = async () => {
    setOpenDialog(false);
    if (!selectedDocument) return;
    try {
      if (selectedDocument.type === "document") {
        console.log(selectedDocument.id,"docuemnt id")
        const res = await deleteDocument(selectedDocument.id);
        if (res?.data?.message) {
          setSnackBar({ open: true, message: res.data.message });
          fetchAllDocuments();
        }
      } else if (selectedDocument.type === "report") {
        await deleteSurveyReport(selectedDocument.id);
        toast.success("Report deleted successfully");
        fetchAllReports();
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

  const handlePageChange = (event, value) => {
    setPage(value);
    router.push(`/documents?page=${value}&limit=${limit}`);
  };

  const columns = [
    {
      field: "index",
      headerName: "No.",
      flex: 0.3,
      sortable: false,
      renderCell: (params) => {
        return (page - 1) * limit + params.api.getAllRowIds().indexOf(params.id) + 1;
      }
    },
    { field: "name", headerName: "Document Name", flex: 1.5 },
    { field: "type", headerName: "Document Type", flex: 0.5 },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Edit Document">
            <IconButton
              color="primary"
              onClick={() => router.push(`/documents/${params?.id}`)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Document">
            <IconButton
              color="error"
              onClick={() => {
                setSelectedDocument({ id: params?.id, type: "document" });
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

  const surveyColumns = [
    {
      field: "index",
      headerName: "No.",
      flex: 0.5,
      sortable: false,
      renderCell: (params) => {
        return (page - 1) * limit + params.api.getAllRowIds().indexOf(params.id) + 1;
      }
    },
    
    {
      field: "generatedDoc",
      headerName: "Generated Document",
      flex: 3,
      renderCell: (params) => (<Typography variant="body2" sx={{height:"100%",display:'flex',alignItems:'center',overflow:'hidden',textOverflow:'ellipsis'}}>{params.value}</Typography>)
    },
    {
        field:'createdAt',
        headerName:'Created At',
        flex:1,
        renderCell: (params) => (<Typography variant="body2" sx={{height:"100%",display:'flex',alignItems:'center',overflow:'hidden'}}>{moment(params.value).format("DD-MM-YYYY")}</Typography>)
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
                setLoadingPreview(true);
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

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

  return (
    <Layout>
      <CommonCard sx={{ mt: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h4" fontWeight={700}>Documents</Typography>
          <CommonButton
            sx={{ textTransform: "capitalize" }}
            text="Add Document"
            variant="contained"
            onClick={() => router.push("/documents/create")}
          />
        </Stack>
      </CommonCard>

      <CommonCard>
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          {["all", "reports", "certificates"].map(type => (
            <Chip
              key={type}
              label={type.charAt(0).toUpperCase() + type.slice(1)}
              color={selectedFilter === type ? "primary" : "default"}
              onClick={() => handleFilterChange(type)}
              clickable
              sx={{ fontWeight: selectedFilter === type ? 600 : 400, px: 2 }}
            />
          ))}
        </Stack>

        <CommonInput
          placeholder="Search Documents"
          fullWidth
          value={search}
          onChange={handleSearchChange}
          sx={{ mb: 2 }}
        />

        <Box sx={{ width: "100%", mt: 4 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="300px">
              <CircularProgress />
            </Box>
          ) : selectedFilter === "reports" ? (
            <DataGrid
              rows={reports}
              columns={surveyColumns}
              loading={loading}
              pagination={false}
              disableColumnFilter
              disableColumnMenu
              disableColumnSelector
              disableDensitySelector
              disableRowSelectionOnClick
              hideFooter
              sx={{ backgroundColor: "#fff", border: "none" }}
            />
          ) : (
            <DataGrid
              rows={paginatedDocuments}
              columns={columns}
              pagination={false}
              disableColumnFilter
              disableColumnMenu
              disableColumnSelector
              disableDensitySelector
              disableRowSelectionOnClick
              hideFooter
              sx={{ backgroundColor: "#fff", border: "none" }}
            />
          )}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Pagination
            count={Math.ceil(totalRows / limit)}
            page={page}
            onChange={handlePageChange}
            color="primary"
            variant="outlined"
            shape="rounded"
          />
        </Box>
      </CommonCard>

      <Dialog open={openDialog} onClose={handleCancelDelete}>
        <DialogTitle>
          Are you sure you want to delete this {selectedDocument?.type === "report" ? "Report" : "Document"}?
        </DialogTitle>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            sx={{ backgroundColor: "#ed2b1c", color: "white", fontWeight: "500" }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackBar.open}
        autoHideDuration={2000}
        message={snackBar.message}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        onClose={() => setSnackBar({ open: false, message: "" })}
        key="snackbar"
      />

      <Dialog
        open={openPreviewModal}
        onClose={() => setOpenPreviewModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Document Preview</DialogTitle>
        <DialogContent>
          <div style={{ position: 'relative', width: '100%', height: '80vh' }}>
            {!loadingPreview ? (
              <a
                href={previewFile}
                download
                rel="noopener noreferrer"
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  zIndex:1,
                  border:'none'
                }}
              >
                Download
              </a>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress />
              </Box>
            )}
            <iframe
              src={`https://docs.google.com/gview?url=${encodeURIComponent(previewFile)}&embedded=true`}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="File Preview"
              onLoad={() => setLoadingPreview(false)}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPreviewModal(false)} color="primary">Close</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};
export default Documents;
