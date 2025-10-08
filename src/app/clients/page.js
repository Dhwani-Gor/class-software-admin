"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CircularProgress from "@mui/material/CircularProgress";
import Pagination from "@mui/material/Pagination";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Snackbar from "@mui/material/Snackbar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DataGrid } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Layout from "@/Layout";
import CommonCard from "@/components/CommonCard";
import CommonButton from "@/components/CommonButton";
import CommonInput from "@/components/CommonInput";
import { deleteClient, getAllClients } from "@/api";
import { toast } from "react-toastify";
import { useAuth } from "@/hooks/useAuth";

const Clients = () => {
  const router = useRouter();
  const { data } = useAuth();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [clientsList, setClientsList] = useState([]);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [limit, setLimit] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedClient, setSelectedClientId] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  const fetchClients = async (page, limit, search) => {
    try {
      setLoading(true);
      const result = await getAllClients(page, limit, search);
      if (result?.status === 200) {
        setClientsList(result.data.data);
        setTotalRows(result.data.results);
      } else {
        toast.error("Something went wrong ! Please try again after some time");
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error(error);
    }
  };

  useEffect(() => {
    fetchClients(page, limit, debouncedSearch);
  }, [debouncedSearch, page, limit]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
  };

  const handleDeleteClick = (clientId) => {
    setSelectedClientId(clientId);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    setOpenDialog(false);
    if (!selectedClient) return;
    try {
      const res = await deleteClient({ id: selectedClient });
      if (res?.data?.message) {
        toast.success(res.data.message);
      }
      fetchClients();
    } catch (e) {
      console.error("Error deleting Client:", e.response?.data || e.message);
      toast.error("Failed to delete Client.");
    }
  };

  const handleCancelDelete = () => {
    setSelectedClientId(null);
    setOpenDialog(false);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    router.push(`/clients?page=${value}&limit=${limit}`);
  };

  const columns = [
    {
      field: "index",
      headerName: "No.",
      flex: 1,
      sortable: false,
      renderCell: (params) => {
        return (page - 1) * limit + params.api.getAllRowIds().indexOf(params.id) + 1;
      },
    },
    { field: "shipName", headerName: "Ship Name", flex: 1.5 },
    { field: "imoNumber", headerName: "IMO Number", flex: 1 },
    {
      field: "classId",
      headerName: "Class Id",
      flex: 1,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Edit Client">
            <IconButton color="primary" onClick={() => router.push(`/clients/${params?.id}`)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Client">
            <IconButton color="error" onClick={() => handleDeleteClick(params?.id)}>
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
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h4" fontWeight={700}>
            Clients
          </Typography>
          {data?.specialPermission?.includes("DataEntryRights(Clients)") && (
            <CommonButton
              sx={{ textTransform: "capitalize" }}
              text="Add client"
              variant="contained"
              onClick={() => {
                router.push("/clients/create");
              }}
            />
          )}
        </Stack>
      </CommonCard>

      <CommonCard>
        <CommonInput placeholder="Search Clients" fullWidth value={search} onChange={handleSearchChange} sx={{ marginBottom: 2 }} />
        <Box sx={{ width: "100%", mt: 4 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="300px">
              <CircularProgress />
            </Box>
          ) : clientsList.length > 0 ? (
            <DataGrid
              rows={clientsList}
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
            <Typography variant="h6" align="center" sx={{ color: "gray", padding: 3 }}>
              No Data Found
            </Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Pagination count={Math.ceil(totalRows / limit)} page={page} onChange={handlePageChange} color="primary" variant="outlined" shape="rounded" sx={{ marginTop: "10px" }} />
        </Box>
      </CommonCard>

      <Dialog open={openDialog} onClose={handleCancelDelete}>
        <DialogTitle>Are you sure you want to delete this Client?</DialogTitle>
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
    </Layout>
  );
};

export default Clients;
