"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Typography, Tooltip, IconButton, Stack, Pagination, CircularProgress, Dialog, DialogTitle, DialogActions, Button, Alert, Modal } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Layout from "@/Layout";
import CommonCard from "@/components/CommonCard";
import CommonButton from "@/components/CommonButton";
import CommonInput from "@/components/CommonInput";
import { deleteSystemVariable, getAllSystemVariables } from "@/api";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

const SystemVariables = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [systemVariablesList, setSystemVariablesList] = useState([]);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [limit, setLimit] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedVariableId, setSelectedVariableId] = useState(null);
  const [selectedVariableName, setSelectedVariableName] = useState("");
  const [previewModal, setPreviewModal] = useState({ open: false, url: "", name: "" });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  const fetchSystemVariablesData = async (page, limit, searchQuery) => {
    setLoading(true);
    try {
      const res = await getAllSystemVariables(page, limit, searchQuery);
      if (res?.data?.data?.length > 0) {
        const sortedData = res.data.data.sort((a, b) => a?.id - b?.id);
        setSystemVariablesList(sortedData);
        setTotalRows(res.data.total || sortedData.length);
      } else {
        setSystemVariablesList([]);
        setTotalRows(0);
      }
    } catch (e) {
      console.error("Error fetching system configuration:", e);
      toast.error("Failed to fetch system configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (page > 0 && limit > 0) {
      fetchSystemVariablesData(page, limit, debouncedSearch.trim() ? debouncedSearch : null);
    }
  }, [page, limit, debouncedSearch]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
  };

  const handleDeleteClick = (variableId, variableName) => {
    setSelectedVariableId(variableId);
    setSelectedVariableName(variableName);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    setOpenDialog(false);
    if (!selectedVariableId) return;

    try {
      const res = await deleteSystemVariable({ id: selectedVariableId });
      if (res?.data?.message) {
        toast.success(res.data.message);
      } else {
        toast.success("System Variable deleted successfully");
      }

      // Refresh the data
      fetchSystemVariablesData(page, limit, debouncedSearch);
    } catch (e) {
      console.error("Error deleting System Variable:", e.response?.data || e.message);
      toast.error(e.response?.data?.message || "Failed to delete System Variable.");
    } finally {
      setSelectedVariableId(null);
      setSelectedVariableName("");
    }
  };

  const handleCancelDelete = () => {
    setSelectedVariableId(null);
    setSelectedVariableName("");
    setOpenDialog(false);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    router.push(`/system-variables?page=${value}&limit=${limit}`);
  };

  const isValidImageUrl = (url) => {
    if (!url || typeof url !== "string") return false;
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i;
    return imageExtensions.test(url) || url.includes("data:image/");
  };

  const handlePreviewClick = (information, name) => {
    if (isValidImageUrl(information)) {
      setPreviewModal({ open: true, url: information, name: name || "Image Preview" });
    }
  };

  const closePreview = () => {
    setPreviewModal({ open: false, url: "", name: "" });
  };

  const renderInformationCell = (params) => {
    const { information, name } = params.row;
    const isImage = isValidImageUrl(information);

    return (
      <Stack direction="row" alignItems="center" spacing={1}>
        <Tooltip title={information || "No information"} arrow>
          <Typography
            variant="body2"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: isImage ? "150px" : "200px",
              cursor: isImage ? "pointer" : "default",
              color: isImage ? "primary.main" : "inherit",
              textDecoration: isImage ? "underline" : "none",
            }}
            onClick={() => isImage && handlePreviewClick(information, name)}
          >
            {information || "No information"}
          </Typography>
        </Tooltip>
        {isImage && (
          <IconButton size="small" color="primary" onClick={() => handlePreviewClick(information, name)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>
    );
  };

  const columns = [
    {
      field: "id",
      headerName: "No.",
      flex: 0.5,
      minWidth: 60,
      renderCell: (params) => {
        return <Typography fontSize="14px">{(page - 1) * limit + params.api.getAllRowIds().indexOf(params.id) + 1}</Typography>;
      },
    },
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "type",
      headerName: "Type",
      flex: 0.8,
      minWidth: 100,
    },
    {
      field: "information",
      headerName: "Information",
      flex: 2,
      minWidth: 200,
      renderCell: renderInformationCell,
      sortable: false,
    },
    {
      field: "subject",
      headerName: "Subject",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "message",
      headerName: "Message",
      flex: 2,
      minWidth: 200,
      sortable: false,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Edit System Variable">
            <IconButton color="primary" size="small" onClick={() => router.push(`/system-variables/${params.row.id}`)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete System Variable">
            <IconButton color="error" size="small" onClick={() => handleDeleteClick(params.row.id, params.row.name)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Layout>
      <CommonCard sx={{ mt: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h4" fontWeight={700}>
            System Configuration
          </Typography>
          <CommonButton
            sx={{ textTransform: "capitalize" }}
            text="Add System Configuration"
            variant="contained"
            onClick={() => {
              router.push("/system-variables/create");
            }}
          />
        </Stack>
      </CommonCard>

      <CommonCard>
        <CommonInput placeholder="Search System Configutarion by name, type, or information" fullWidth value={search} onChange={handleSearchChange} sx={{ marginBottom: 2 }} />

        <Box sx={{ width: "100%", mt: 4 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="300px">
              <CircularProgress />
            </Box>
          ) : systemVariablesList.length > 0 ? (
            <DataGrid
              rows={systemVariablesList}
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
                "& .MuiDataGrid-row": {
                  minHeight: "52px !important",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                  },
                },
                "& .MuiDataGrid-cell": {
                  padding: "8px 16px",
                  display: "flex",
                  alignItems: "center",
                },
              }}
            />
          ) : (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No Data Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {search ? "No system configuration match your search criteria." : "Start by creating your first system variable."}
              </Typography>
            </Box>
          )}
        </Box>

        {totalRows > 0 && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Pagination count={Math.ceil(totalRows / limit)} page={page} onChange={handlePageChange} color="primary" variant="outlined" shape="rounded" sx={{ marginTop: "10px" }} />
          </Box>
        )}
      </CommonCard>

      {/* Image Preview Modal */}
      <Modal
        open={previewModal.open}
        onClose={closePreview}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            position: "relative",
            maxWidth: "90vw",
            maxHeight: "90vh",
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 2,
            outline: "none",
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, textAlign: "center" }}>
            {previewModal.name}
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              maxHeight: "70vh",
              overflow: "hidden",
            }}
          >
            <img
              src={previewModal.url}
              alt={previewModal.name}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                borderRadius: "4px",
              }}
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "block";
              }}
            />
            <Typography variant="body1" color="text.secondary" sx={{ display: "none", textAlign: "center" }}>
              Failed to load image
            </Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <Button onClick={closePreview} variant="outlined">
              Close
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDialog} onClose={handleCancelDelete} maxWidth="sm" fullWidth>
        <DialogTitle>Delete System Variable</DialogTitle>
        <Box sx={{ px: 3, pb: 2 }}>
          <Typography variant="body1">Are you sure you want to delete the system variable "{selectedVariableName}"?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </Box>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCancelDelete} color="primary" variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            sx={{
              backgroundColor: "#ed2b1c",
              color: "white",
              fontWeight: "500",
              "&:hover": {
                backgroundColor: "#d32f2f",
              },
            }}
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default SystemVariables;
