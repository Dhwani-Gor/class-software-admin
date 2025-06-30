"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Layout from "@/Layout";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CommonCard from "@/components/CommonCard";
import CommonButton from "@/components/CommonButton";
import { DataGrid } from "@mui/x-data-grid";
import CommonInput from "@/components/CommonInput";
import { deleteJournal, getAllJournals } from "@/api";
import { Button, Dialog, DialogActions, DialogTitle, IconButton, Pagination, Tooltip } from "@mui/material";
import moment from "moment";
import { toast } from "react-toastify";

const Reports = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [journals, setJournals] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedJournalId, setSelectedJournalId] = useState(null);

  const [columns] = useState([
    {
      field: "serialNumber",
      headerName: "No.",
      flex: 0.5,
      sortable: false,
      renderCell: (params) => {
        return params.value;
      }
    },
    {
      field: "client",
      headerName: "Ship / Work",
      flex: 1,
      renderCell: (params) => {
        return params.value?.shipName;
      },
    },
    { field: "journalTypeId", headerName: "Report Number", flex: 1 },
    {
      field: "createdAt",
      headerName: "Report Date",
      flex: 1,
      renderCell: (params) => {
        return moment(params.row.createdAt).format('DD/MM/YYYY hh:mm A');
      }
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Edit Journal">
            <IconButton
              color="primary"
              onClick={() => router.push(`/journal/${params?.id}`)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Journal">
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
  ]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
  };

  const handleDeleteClick = (journalId) => {
    setSelectedJournalId(journalId);
    setOpenDialog(true);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    router.push(`/journal?page=${value}&limit=${limit}`);
  };

  const fetchAllJournals = async (search, page, limit) => {
    try {
      setLoading(true);
      const result = await getAllJournals({
        search,
        page,
        limit,
      });

      if (result?.status === 200) {
        const journalsWithSerialNumbers = (result.data.data || []).map((journal, index) => ({
          ...journal,
          serialNumber: (page - 1)  * limit + index + 1
        }));

        setJournals(journalsWithSerialNumbers); 
        setTotalRows(result.data.total || result.data.results || 0);
      } else {
        toast.error("Something went wrong! Please try again after some time");
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error(error?.message || error?.response?.data?.message || "An error occurred");
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchAllJournals(debouncedSearch, page, limit);
  }, [debouncedSearch, page, limit]);

  const handleCancelDelete = () => {
    setSelectedClientId(null);
    setOpenDialog(false);
  };

  const handleConfirmDelete = async () => {
    setOpenDialog(false);
    if (!selectedJournalId) return;
    try {
      const res = await deleteJournal(selectedJournalId);
      if (res) {
        toast.success("Journal deleted successfully");
      }
      fetchAllJournals(search, page, limit);
    } catch (e) {
      console.error("Error deleting Client:", e.response?.data || e.message);
      toast.error("Failed to delete Client.");
    }
  };
  return (
    <Layout>
      <CommonCard sx={{ mt: 0 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h4" fontWeight={700}>
            Journal
          </Typography>
          <CommonButton
            sx={{ textTransform: "capitalize" }}
            text="Add Journal"
            variant="contained"
            onClick={() => router.push("/journal/journal-entry")}
          />
        </Stack>
      </CommonCard>

      <CommonCard>
        <CommonInput
          placeholder="Search Journal"
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
          ) : journals.length > 0 ? (
            <DataGrid
              rows={journals}
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

        {/* Only show pagination if there are journals and totalRows > 0 */}
        {journals.length > 0 && totalRows > 0 && (
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
        )}
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

export default Reports;