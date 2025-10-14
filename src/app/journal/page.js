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
import { deleteJournal, getJournalsList } from "@/api";
import { Button, Dialog, DialogActions, IconButton, Pagination, Tooltip, Chip, DialogTitle } from "@mui/material";
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
  const [activeTab, setActiveTab] = useState("journal"); // chip tab state
  console.log(activeTab, "activeTab");

  const columns = React.useMemo(
    () => [
      { field: "serialNumber", headerName: "No.", flex: 0.5, sortable: false, renderCell: (params) => params.value },
      { field: "client", headerName: "Ship / Work", flex: 1, renderCell: (params) => params.value?.shipName },
      { field: "journalTypeId", headerName: "Report Number", flex: 1 },
      { field: "createdAt", headerName: "Report Date", flex: 1, renderCell: (params) => moment(params.row.createdAt).format("DD/MM/YYYY hh:mm A") },
      {
        field: "actions",
        headerName: "Actions",
        width: 100,
        renderCell: (params) => (
          <Stack direction="row" spacing={1}>
            <Tooltip title="Edit Journal">
              <IconButton color="primary" onClick={() => router.push(`/journal/${params?.id}`)}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            {activeTab !== "archive" && (
              <Tooltip title="Delete Journal">
                <IconButton color="error" onClick={() => handleDeleteClick(params?.id)}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        ),
      },
    ],
    [activeTab, router]
  );

  const handleSearchChange = (event) => setSearch(event.target.value);
  const handleDeleteClick = (journalId) => {
    setSelectedJournalId(journalId);
    setOpenDialog(true);
  };
  const handlePageChange = (event, value) => {
    setPage(value);
    router.push(`/journal?page=${value}&limit=${limit}`);
  };

  const fetchAllJournals = async (search, page, limit, tabType = "journal") => {
    try {
      setLoading(true);

      const params = {
        search,
        page,
        limit,
        filterKey: "journalArchive",
        filterValue: tabType === "archive" ? "true" : "false", // Pass true/false based on tab
      };

      const result = await getJournalsList(params);

      if (result?.status === 200) {
        const journalsWithSerialNumbers = (result.data.data || []).map((journal, index) => ({
          ...journal,
          serialNumber: (page - 1) * limit + index + 1,
        }));
        setJournals(journalsWithSerialNumbers);
        setTotalRows(result.data.total || result.data.results || 0);
      } else {
        toast.error("Something went wrong! Please try again later");
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error(error?.message || error?.response?.data?.message || "An error occurred");
    }
  };

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch journals on tab / search / pagination change
  useEffect(() => {
    fetchAllJournals(debouncedSearch, page, limit, activeTab);
  }, [debouncedSearch, page, limit, activeTab]);

  const handleCancelDelete = () => {
    setSelectedJournalId(null);
    setOpenDialog(false);
  };

  const handleConfirmDelete = async () => {
    setOpenDialog(false);
    if (!selectedJournalId) return;
    try {
      await deleteJournal(selectedJournalId);
      toast.success("Journal deleted successfully");
      fetchAllJournals(search, page, limit, activeTab);
    } catch (e) {
      toast.error("Failed to delete Journal.");
    }
  };

  return (
    <Layout>
      <CommonCard sx={{ mt: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h4" fontWeight={700}>
            Journal
          </Typography>
          <CommonButton sx={{ textTransform: "capitalize" }} text="Add Journal" variant="contained" onClick={() => router.push("/journal/journal-entry")} />
        </Stack>
      </CommonCard>

      <CommonCard>
        {/* Chip Tabs */}
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          {["journal", "archive"].map((tab) => (
            <Chip
              key={tab}
              label={tab === "journal" ? "Journal" : "Archived Journal"}
              color={activeTab === tab ? "primary" : "default"}
              onClick={() => {
                setActiveTab(tab);
                setPage(1);
                setSearch("");
              }}
              clickable
              sx={{ fontWeight: activeTab === tab ? 600 : 400, px: 2 }}
            />
          ))}
        </Stack>

        <CommonInput placeholder={`Search ${activeTab === "archive" ? "Archived Journal" : "Journal"}`} fullWidth value={search} onChange={handleSearchChange} sx={{ marginBottom: 2 }} />

        <Box sx={{ width: "100%", mt: 4 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="300px">
              <CircularProgress />
            </Box>
          ) : journals.length > 0 ? (
            <DataGrid rows={journals} columns={columns} pagination={false} disableColumnFilter disableColumnMenu disableColumnSelector disableDensitySelector disableRowSelectionOnClick hideFooter sx={{ backgroundColor: "#fff", border: "none" }} />
          ) : (
            <Typography variant="h6" align="center" sx={{ color: "gray", padding: 3 }}>
              No Data Found
            </Typography>
          )}
        </Box>

        {journals.length > 0 && totalRows > 0 && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Pagination count={Math.ceil(totalRows / limit)} page={page} onChange={handlePageChange} color="primary" variant="outlined" shape="rounded" sx={{ marginTop: "10px" }} />
          </Box>
        )}
      </CommonCard>

      {/* Delete confirmation dialog */}
      <Dialog open={openDialog} onClose={handleCancelDelete}>
        <DialogTitle>Are you sure you want to delete this Journal?</DialogTitle>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} sx={{ backgroundColor: "#ed2b1c", color: "white", fontWeight: 500 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Reports;
