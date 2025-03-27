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
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Layout from "@/Layout";
import CommonCard from "@/components/CommonCard";
import CommonButton from "@/components/CommonButton";
import CommonInput from "@/components/CommonInput";
import { deleteUser, deleteVisa, getUsersDetails, getVisaDetails } from "@/api";
import { useDispatch } from "react-redux";
import { clearCountry } from "@/redux/slice/countrysSlice";

const Countries = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(""); // Debounced search state
  const [snackBar, setSnackBar] = useState({ open: false, message: "" });
  const [countryLists, setInspectorLists] = useState([]);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [limit, setLimit] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedVisaId, setSelectedVisaId] = useState(null);

  const snackbarClose = () => {
    setSnackBar({ open: false, message: "" });
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  const fetchUserListData = async (page, limit, searchQuery) => {
    setLoading(true);
    await getUsersDetails(page, limit, searchQuery)
      .then((res) => {
        if (res?.data?.data?.length > 0) {
          const flattenedData = res?.data?.data?.map((item) => ({
            id: item?.id || "-",
            companyName: item?.companyName || "-",
            email: item?.email || "-",
            inspectorDesignation: item?.inspectorDesignation || "-",
            name: item?.name || "-",
          }));
          const sortedData = flattenedData?.sort((a, b) => a?.id - b?.id);
          
          setInspectorLists(sortedData);
          setTotalRows(res?.data?.data?.totalVisas);
        } else {
          setInspectorLists([]);
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
      fetchUserListData(
        page,
        limit,
        debouncedSearch.trim() ? debouncedSearch : null
      );
    }
  }, [page, limit, debouncedSearch]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
  };

  const handleDeleteClick = (visaId) => {
    setSelectedVisaId(visaId);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    setOpenDialog(false);
    if (!selectedVisaId) return;
    try {
      const res = await deleteUser({ id: selectedVisaId });
      if (res?.data?.message) {
        setSnackBar({ open: true, message: res.data.message });
      }
      fetchUserListData(page, limit, debouncedSearch);
    } catch (e) {
      console.error("Error deleting Inspectors:", e.response?.data || e.message);
      setSnackBar({ open: true, message: "Failed to delete Inspectors." });
    }
  };

  const handleCancelDelete = () => {
    setSelectedVisaId(null);
    setOpenDialog(false);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    router.push(`/countries?page=${value}&limit=${limit}`);
  };

  const columns = [
    {
      field: "id",
      headerName: "ID",
      flex: 1,
      renderCell: (params) => {
        return (
          <Typography>
            {params?.api?.getRowIndexRelativeToVisibleRows(params.id) + 1}
          </Typography>
        );
      },
    },
    { field: "name", headerName: "Inspectors Name", flex: 1.5 },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
    },
    { field: "companyName", headerName: "Company Name", flex: 1 },
    { field: "inspectorDesignation", headerName: "Inspector Designation", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Edit Inspector">
            <IconButton
              color="primary"
              onClick={() => router.push(`/staff/${params?.id}`)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Inspector">
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
      <CommonCard>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h4" fontWeight={700}>
            Staff / Inspectors
          </Typography>
          <CommonButton
            sx={{ textTransform: "capitalize" }}
            text="Add new Staff / Inspector"
            variant="contained"
            onClick={() => {
              dispatch(clearCountry());
              router.push("/staff/create");
            }}
            endIcon={<AddIcon />}
          />
        </Stack>
      </CommonCard>

      <CommonCard>
        <CommonInput
          placeholder="Search Staff / Inspector by name"
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
          ) : countryLists.length > 0 ? (
            <DataGrid
              rows={countryLists}
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
        <DialogTitle>Are you sure you want to delete this Inspectors?</DialogTitle>
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

export default Countries;
