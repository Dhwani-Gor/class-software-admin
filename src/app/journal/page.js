"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Stack, Typography, CircularProgress } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Layout from "@/Layout";
import CommonCard from "@/components/CommonCard";
import CommonButton from "@/components/CommonButton";
import { DataGrid } from "@mui/x-data-grid";
import CommonInput from "@/components/CommonInput";

const Reports = () => {
  const router = useRouter();
  const [search, setSearch] = useState(""); // State for search input
  const [loading, setLoading] = useState(false);
  const [countryLists, setCountryLists] = useState([]); // Dummy empty data
  const [columns] = useState([
    { field: "id", headerName: "ID", width: 90 },
    { field: "clientName", headerName: "Client Name", flex: 1 },
    { field: "shipName", headerName: "Ship Name", flex: 1 },
    { field: "staffName", headerName: "Staff/INspector Name", flex: 1 },
    { field: "createdAt", headerName: "Report Date", flex: 1 },

  ]); // Example column data

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
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
            // endIcon={<AddIcon />}
          />
        </Stack>
      </CommonCard>

      <CommonCard>
        {/* Search Input */}
        <CommonInput
          placeholder="Search Journal"
          fullWidth
          value={search}
          onChange={handleSearchChange}
          sx={{ marginBottom: 2 }}
        />

        {/* Data Grid */}
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
``;
