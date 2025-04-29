"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { getAllJournals } from "@/api";
import { IconButton, Tooltip } from "@mui/material";
import moment from "moment";

const Reports = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [journals, setJournals] = useState([]); // Dummy empty data
  const [columns] = useState([
    { field: "id", headerName: "ID", width: 90 },
    {
      field: "client",
      headerName: "Ship / Work",
      flex: 1,
      renderCell: (params) => {
        return params.value?.shipName;
      },
    },
    { field: "journalTypeId", headerName: "Report Number", flex: 1 },
    { field: "createdAt", headerName: "Report Date", flex: 1, renderCell: (params) => {
      return moment(params.createdAt).format('DD/MM/YYYY hh:mm A')
    } },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Edit Country">
            <IconButton
              color="primary"
              onClick={() => router.push(`/journal/${params?.id}`)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Country">
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

  const fetchAllJournals = async () => {
    try {
      setLoading(true);
      const result = await getAllJournals();
      if (result?.status === 200) {
        setJournals(result.data.data)
      } else {
        toast.error("Something went wrong ! Please try again after some time")
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error(error)
    }
  };

  useEffect(() => {
    fetchAllJournals();
  }, []);

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
      </CommonCard>
    </Layout>
  );
};

export default Reports;
