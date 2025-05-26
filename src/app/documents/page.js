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
import { deleteDocument, getAllDocuments } from "@/api";
import { toast } from "react-toastify";
import PreviewIcon from '@mui/icons-material/Visibility';
import DialogContent from "@mui/material/DialogContent";

const Documents = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(""); // Debounced search state
  const [snackBar, setSnackBar] = useState({ open: false, message: "" });
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [limit, setLimit] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("all"); // 'all', 'reports', or 'certificates'
  const [previewFile, setPreviewFile] = useState(null);
  const [openPreviewModal, setOpenPreviewModal] = useState(false);
  const snackbarClose = () => {
    setSnackBar({ open: false, message: "" });
  };

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
        console.log('Documents data:', result.data.data);
        const docs = result.data.data;
        setDocuments(docs);
        applyFilters(docs, selectedFilter);
        setTotalRows(docs.length);
      } else {
        toast.error("Something went wrong! Please try again after some time");
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error(error);
    }
  };

  useEffect(() => {
    fetchAllDocuments();
  }, []);

  // Apply filters based on selected chip and search text
  const applyFilters = (docs, filter) => {
    let filtered = [...docs];
    
    // Filter by search text
    if (debouncedSearch) {
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    // Filter by document type (Reports = odd index, Certificates = even index)
    if (filter === "reports") {
      console.log(filtered , "filtered ==>")
      filtered = filtered.filter((document, index) => document.type === "report"); // Odd indexed
    } else if (filter === "certificates") {
      filtered = filtered.filter((document, index) => document.type === "certificate"); // Even indexed
    }

    setFilteredDocuments(filtered);
    setTotalRows(filtered.length);
  };

  // Update filters when search changes
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

  const handleDeleteClick = (documentId) => {
    setSelectedDocument(documentId);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    setOpenDialog(false);
    if (!selectedDocument) return;
    try {
      const res = await deleteDocument({ id: selectedDocument });
      if (res?.data?.message) {
        setSnackBar({ open: true, message: res.data.message });
      }
      fetchAllDocuments();
    } catch (e) {
      console.error("Error deleting Document:", e.response?.data || e.message);
      setSnackBar({ open: true, message: "Failed to delete Document." });
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
      field: "id",
      headerName: "Id",
      flex: 1,
    },
    { field: "name", headerName: "Document Name", flex: 1.5 },
    { field: "type", headerName: "Document Type", flex: 1 },
    {
      field: "filePath",
      headerName: "File Preview",
      width: 100,
      renderCell: (params) => (
        params.row.filePath ? (
          <Tooltip title="Preview Document">
            <IconButton
              color="info"
              onClick={() => {
                setPreviewFile(params.row.filePath);
                setOpenPreviewModal(true);
              }}
            >
              <PreviewIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <Typography variant="body2" color="textSecondary">
            No File
          </Typography>
        )
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
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
              onClick={() => handleDeleteClick(params?.id)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  // Calculate pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

  return (
    <Layout>
      <CommonCard sx={{ mt: 0 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h4" fontWeight={700}>
            Documents
          </Typography>
          <CommonButton
            sx={{ textTransform: "capitalize" }}
            text="Add Document"
            variant="contained"
            onClick={() => {
              router.push("/documents/create");
            }}
          />
        </Stack>
      </CommonCard>

      <CommonCard>
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Chip 
            label="All" 
            color={selectedFilter === "all" ? "primary" : "default"}
            onClick={() => handleFilterChange("all")}
            clickable
            sx={{ 
              fontWeight: selectedFilter === "all" ? 600 : 400,
              px: 2
            }}
          />
          <Chip 
            label="Reports" 
            color={selectedFilter === "reports" ? "primary" : "default"}
            onClick={() => handleFilterChange("reports")}
            clickable
            sx={{ 
              fontWeight: selectedFilter === "reports" ? 600 : 400,
              px: 2
            }}
          />
          <Chip 
            label="Certificates" 
            color={selectedFilter === "certificates" ? "primary" : "default"}
            onClick={() => handleFilterChange("certificates")}
            clickable
            sx={{ 
              fontWeight: selectedFilter === "certificates" ? 600 : 400,
              px: 2
            }}
          />
        </Stack>
        
        <CommonInput
          placeholder="Search Documents"
          fullWidth
          value={search}
          onChange={handleSearchChange}
          sx={{ marginBottom: 2 }}
        />
        <Box sx={{ width: "100%", mt: 4 }}>
          {loading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="300px"
            >
              <CircularProgress />
            </Box>
          ) : filteredDocuments.length > 0 ? (
            <DataGrid
              rows={paginatedDocuments}
              columns={columns}
              loading={loading}
              pagination={false}
              disableColumnFilter
              disableColumnMenu
              disableColumnSelector
              disableDensitySelector
              disableRowSelectionOnClick
              hideFooter
              sx={{
                backgroundColor: "#fff",
                border: "none",
              }}
            />
          ) : (
            <Typography
              variant="h6"
              align="center"
              sx={{ color: "gray", padding: 3 }}
            >
              No Data Found
            </Typography>
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
            sx={{ marginTop: "10px" }}
          />
        </Box>
      </CommonCard>

      <Dialog open={openDialog} onClose={handleCancelDelete}>
        <DialogTitle>Are you sure you want to delete this Document?</DialogTitle>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            sx={{
              backgroundColor: "#ed2b1c",
              color: "white",
              fontWeight: "500",
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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
       <Dialog
              open={openPreviewModal}
              onClose={() => setOpenPreviewModal(false)}
              maxWidth="md"
              fullWidth
            >
              <DialogTitle>Document Preview</DialogTitle>
              <DialogContent>
                {previewFile ? (
                  <iframe
                    src={`https://docs.google.com/gview?url=${encodeURIComponent(previewFile)}&embedded=true`}
                    style={{ width: "100%", height: "80vh", border: "none" }}
                  />
                ) : (
                  <img
                    src={previewFile}
                    alt="Document Preview"
                    style={{ maxWidth: "100%", maxHeight: "80vh" }}
                  />
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenPreviewModal(false)} color="primary">
                  Close
                </Button>
              </DialogActions>
            </Dialog>
    </Layout>
  );
};

export default Documents;