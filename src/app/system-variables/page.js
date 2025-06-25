"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  Tooltip,
  IconButton,
  Stack,
  Snackbar,
  Pagination,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogActions,
  Button,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Layout from "@/Layout";
import CommonCard from "@/components/CommonCard";
import CommonButton from "@/components/CommonButton";
import CommonInput from "@/components/CommonInput";
import { deleteSystemVariable, getAllSystemVariables } from "@/api";
import { useDispatch } from "react-redux";

const SystemVariables = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(""); // Debounced search state
  const [snackBar, setSnackBar] = useState({ open: false, message: "" });
  const [systemVariablesList, setSystemVariablesList] = useState([]);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [limit, setLimit] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedVariableId, setSelectedVariableId] = useState(null);

  const snackbarClose = () => {
    setSnackBar({ open: false, message: "" });
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  const fetchSystemVariablesData = async (page, limit, searchQuery) => {
    setLoading(true);
    await getAllSystemVariables(page, limit, searchQuery)
      .then((res) => {
        if (res?.data?.data?.length > 0) {
          const sortedData = res?.data?.data?.sort((a, b) => a?.id - b?.id);
          setSystemVariablesList(sortedData);
          setTotalRows(res?.data?.total || sortedData.length);
        } else {
          setSystemVariablesList([]);
          setTotalRows(0);
        }
      })
      .catch((e) => {
        console.log(e);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (page > 0 && limit > 0) {
      fetchSystemVariablesData(
        page,
        limit,
        debouncedSearch.trim() ? debouncedSearch : null
      );
    }
  }, [page, limit, debouncedSearch]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
  };

  const handleDeleteClick = (variableId) => {
    setSelectedVariableId(variableId);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    setOpenDialog(false);
    if (!selectedVariableId) return;
    try {
      const res = await deleteSystemVariable({ id: selectedVariableId });
      if (res?.data?.message) {
        setSnackBar({ open: true, message: res.data.message });
      }
      fetchSystemVariablesData(page, limit, debouncedSearch);
    } catch (e) {
      console.error("Error deleting System Variable:", e.response?.data || e.message);
      setSnackBar({ open: true, message: "Failed to delete System Variable." });
    }
  };

  const handleCancelDelete = () => {
    setSelectedVariableId(null);
    setOpenDialog(false);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    router.push(`/system-variables?page=${value}&limit=${limit}`);
  };

  const columns = [
    {
      field: "id",
      headerName: "Id",
      flex: 1,
    },
    { 
      field: "type", 
      headerName: "Type", 
      flex: 1.5 
    },
    {
      field: "information",
      headerName: "Information",
      flex: 2,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Edit System Variable">
            <IconButton
              color="primary"
              onClick={() => router.push(`/system-variables/${params?.id}`)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete System Variable">
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

  return (
    <Layout>
      <CommonCard sx={{ mt: 0 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h4" fontWeight={700}>
            System Variables
          </Typography>
          <CommonButton
            sx={{ textTransform: "capitalize" }}
            text="Add System Variable"
            variant="contained"
            onClick={() => {
              router.push("/system-variables/create");
            }}
          />
        </Stack>
      </CommonCard>

      <CommonCard>
        <CommonInput
          placeholder="Search System Variables by type or information"
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
        <DialogTitle>Are you sure you want to delete this System Variable?</DialogTitle>
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
    </Layout>
  );
};

export default SystemVariables;