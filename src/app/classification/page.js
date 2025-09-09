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
import {
  deleteClassificationSurvey,
  getAllClassificationSurveys,
  getAllClients,
} from "@/api";
import { toast } from "react-toastify";
import { FormControl, MenuItem, Select } from "@mui/material";
import moment from "moment";
import ClassificationForm from "@/components/AddClassificationForm";

const Classifications = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [snackBar, setSnackBar] = useState({ open: false, message: "" });
  const [clientsList, setClientsList] = useState([]);
  console.log(clientsList, "clientsList");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [limit, setLimit] = useState(50);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedClient, setSelectedClientId] = useState(null);
  const [selectedShip, setSelectedShip] = useState({ id: "", shipName: "" });
  const [classificationRows, setClassificationRows] = useState([]);
  const [deleteRow, setDeleteRow] = useState(null);
  const [editRowId, setEditRowId] = useState(null);

  const params = useSearchParams();

  const variableId = params.get("id");

  useEffect(() => {
    setSelectedShip({ id: variableId });
  }, [variableId]);

  // const snackbarClose = () => {
  //   setSnackBar({ open: false, message: "" });
  // };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const result = await getAllClients();
      if (result?.status === 200) {
        setClientsList(result.data.data);
      } else {
        toast.error(result?.message);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error(error?.message || "Failed to fetch clients");
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleConfirmDelete = async () => {
    try {
      setOpenDialog(false);
      await deleteClassificationSurvey(deleteRow);
      getAllClassification();
      toast.success("Classification deleted successfully");
    } catch (e) {
      console.error("Error deleting Client:", e.response?.data || e.message);
      toast.error("Failed to delete Classification.");
    }
  };

  const handleCancelDelete = () => {
    setSelectedClientId(null);
    setOpenDialog(false);
  };

  const getAllClassification = async () => {
    try {
      setLoading(true);
      if (!selectedShip.id) return;

      const result = await getAllClassificationSurveys({
        clientId: selectedShip.id,
        page,
        limit,
      });

      if (result?.status === 200) {
        const data = result.data.data;
        setClassificationRows(data);
        setTotalRows(result.data.results);
      } else {
        toast.error("Something went wrong! Please try again later");
      }
    } catch (error) {
      console.error("Error fetching classification data:", error);
      toast.error(error.message || "Error fetching classification data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRow = async (id) => {
    try {
      setOpenDialog(true);
      setDeleteRow(id);
      const updated = [...classificationRows];
      updated.splice(id, 1);
      setClassificationRows(updated.length ? updated : [createEmptyRow()]);
    } catch (error) {
      console.error("Error deleting row:", error);
      toast.error(error.message || "Failed to delete row");
    }
  };

  useEffect(() => {
    if (selectedShip.id) {
      getAllClassification();
    }
  }, [selectedShip.id, page]);

  const handleClientChange = (event) => {
    const selectedId = event.target.value;
    const selectedClient = clientsList.find(
      (client) => client.id === selectedId
    );
    setSelectedShip({
      id: selectedId,
      shipName: selectedClient ? selectedClient.shipName : "",
    });
  };
  const handlePageChange = (event, value) => {
    setPage(value);
    router.push(
      `/classification?page=${value}&limit=${limit}&id=${selectedShip.id}`
    );
  };

  const columns = [
    {
      field: "index",
      headerName: "No.",
      flex: 1,
      sortable: false,
      renderCell: (params) => {
        return (
          (page - 1) * limit + params.api.getAllRowIds().indexOf(params.id) + 1
        );
      },
    },
    {
      field: "surveyName",
      headerName: "Survey Name",
      flex: 1.5,
      renderCell: (params) => params.value?.surveyName?.toUpperCase(),
    },
    {
      field: "surveyDate",
      headerName: "Survey Date",
      flex: 1,
      renderCell: (params) =>
        params.value ? moment(params.value).format("DD/MM/YYYY") : "-",
    },
    {
      field: "issuanceDate",
      headerName: "Assignment Date",
      flex: 1,
      renderCell: (params) =>
        params.value ? moment(params.value).format("DD/MM/YYYY") : "-",
    },
    {
      field: "dueDate",
      headerName: "Due' Date",
      flex: 1,
      renderCell: (params) =>
        params.value ? moment(params.value).format("DD/MM/YYYY") : "-",
    },
    {
      field: "rangeFrom",
      headerName: "Range From",
      flex: 1,
      renderCell: (params) =>
        params.value ? moment(params.value).format("DD/MM/YYYY") : "-",
    },
    {
      field: "rangeTo",
      headerName: "Range To",
      flex: 1,
      renderCell: (params) =>
        params.value ? moment(params.value).format("DD/MM/YYYY") : "-",
    },
    {
      field: "postponed",
      headerName: "Postponed Date",
      flex: 1,
      renderCell: (params) =>
        params.value ? moment(params.value).format("DD/MM/YYYY") : "-",
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Edit Classification">
            <IconButton
              color="primary"
              onClick={() => setEditRowId(params?.id)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Classification">
            <IconButton
              color="error"
              onClick={() => handleDeleteRow(params?.id)}
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
            Classification
          </Typography>
          <CommonButton
            sx={{ textTransform: "capitalize" }}
            text="Add Classification"
            variant="contained"
            onClick={() => {
              router.push("/classification/create");
            }}
          />
        </Stack>
      </CommonCard>

      <CommonCard>
        <Box>
          <FormControl fullWidth sx={{ maxWidth: 300 }}>
            <Typography variant="h6" mb={1}>
              Select Client
            </Typography>

            <Select
              value={selectedShip.id || ""}
              onChange={handleClientChange}
              displayEmpty
            >
              <MenuItem value="" disabled>
                Select Client
              </MenuItem>
              {clientsList.map((client) => (
                <MenuItem key={client.id} value={client.id}>
                  {client.shipName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <ClassificationForm
          selectedShip={selectedShip}
          mode={editRowId ? "update" : "create"}
          variableId={editRowId} // 👈 pass row id here
          onSuccess={() => {
            setEditRowId(null);
            getAllClassification();
          }}
        />

        <Box sx={{ width: "100%", mt: 4 }}>
          {loading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              sx={{ height: 600, overflowY: "auto", mt: 2 }}
            >
              <CircularProgress />
            </Box>
          ) : selectedShip.id && clientsList.length > 0 ? (
            <Box
              sx={{ height: 300, overflowY: "auto", mt: 2 }}
              onScroll={(e) => {
                const { scrollTop, scrollHeight, clientHeight } =
                  e.currentTarget;
                if (scrollHeight - scrollTop - clientHeight < 100) {
                  fetchClassification();
                }
              }}
            >
              <DataGrid
                rows={classificationRows}
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
            </Box>
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
          {/* <Pagination
            count={Math.ceil(totalRows / limit)}
            page={page}
            onChange={handlePageChange}
            color="primary"
            variant="outlined"
            shape="rounded"
            sx={{ marginTop: "10px" }}
          /> */}
        </Box>
      </CommonCard>

      <Dialog open={openDialog} onClose={handleCancelDelete}>
        <DialogTitle>
          Are you sure you want to delete this Classification?
        </DialogTitle>
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

      {/* <Snackbar
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
      /> */}
    </Layout>
  );
};

export default Classifications;
