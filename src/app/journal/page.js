"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Layout from "@/Layout";
import CommonCard from "@/components/CommonCard";
import CommonButton from "@/components/CommonButton";
import { DataGrid } from "@mui/x-data-grid";
import CommonInput from "@/components/CommonInput";

const Reports = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [countryLists, setCountryLists] = useState([]); // Dummy empty data
  const [columns] = useState([
    { field: "id", headerName: "ID", width: 90 },
    { field: "clientName", headerName: "Client Name", flex: 1 },
    { field: "shipName", headerName: "Ship Name", flex: 1 },
    { field: "staffName", headerName: "Staff/INspector Name", flex: 1 },
    { field: "createdAt", headerName: "Report Date", flex: 1 },

  ]); 

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
