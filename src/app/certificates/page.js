"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import CircularProgress from "@mui/material/CircularProgress";
import Pagination from '@mui/material/Pagination';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from "@mui/material/Snackbar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DataGrid } from "@mui/x-data-grid";


import VisibilityIcon from "@mui/icons-material/Visibility";
import GetAppIcon from "@mui/icons-material/GetApp";
import Layout from "@/Layout";
import CommonCard from "@/components/CommonCard";
import CommonInput from "@/components/CommonInput";
import { getAllIssuedDocuments } from "@/api"; // Updated API function names
import { Chip } from "@mui/material";

const Certificates = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [snackBar, setSnackBar] = useState({ open: false, message: "" });
  const [certificatesList, setCertificatesList] = useState([]);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [limit, setLimit] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");

  const handleFilterChange = (newFilter) => {
    setSelectedFilter(newFilter);
    setPage(1);
  };

  const snackbarClose = () => {
    setSnackBar({ open: false, message: "" });
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  const fetchCertificatesData = async (page, limit, searchQuery) => {
    setLoading(true);
    try {
      // You'll need to update this API call based on your actual API structure
      const res = await getAllIssuedDocuments(page, limit, searchQuery, selectedFilter);
      const data = res?.data;
  
      if (data?.status === "success" && Array.isArray(data?.data)) {
        setCertificatesList(data.data);
        setTotalRows(data.results || data.data.length);
      } else {
        setCertificatesList([]);
        setTotalRows(0);
      }
    } catch (e) {
      console.log("Error fetching certificates:", e);
      setCertificatesList([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (page > 0 && limit > 0) {
      fetchCertificatesData(page, limit, debouncedSearch.trim() ? debouncedSearch : null);
    }
  }, [page, limit, debouncedSearch, selectedFilter]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    router.push(`/certificates?page=${value}&limit=${limit}`);
  };

  const handleViewDocument = (documentUrl) => {
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    }
  };

  const handleDownloadDocument = (documentUrl, certificateId) => {
    if (documentUrl) {
      const link = document.createElement('a');
      link.href = documentUrl;
      link.download = `certificate_${certificateId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  const columns = [
    {
      field: "id",
      headerName: "S.No",
      width: 80,
      renderCell: (params) => {
        const rowIndex = certificatesList.findIndex(row => row.id === params.id);
        return <Typography>{rowIndex + 1 + (page - 1) * limit}</Typography>;
      },
    },
    { 
      field: "typeOfCertificate", 
      headerName: "Certificate Type", 
      flex: 1,
      renderCell: (params) => (
        <Typography sx={{ textTransform: 'capitalize' }}>
          {params.value?.replace('_', ' ') || 'N/A'}
        </Typography>
      )
    },
    { 
      field: "activity", 
      headerName: "Survey Type", 
      flex: 1,
      renderCell: (params) => (
        <Typography>
          {params.row.activity?.typeOfSurvey || 'N/A'}
        </Typography>
      )
    },
    { 
      field: "place", 
      headerName: "Place", 
      flex: 1 
    },
    { 
      field: "issuanceDate", 
      headerName: "Issuance Date", 
      flex: 1,
      renderCell: (params) => (
        <Typography>{formatDate(params.value)}</Typography>
      )
    },
    { 
      field: "validityDate", 
      headerName: "Validity Date", 
      flex: 1,
      renderCell: (params) => (
        <Typography>{formatDate(params.value)}</Typography>
      )
    },
    { 
      field: "surveyDate", 
      headerName: "Survey Date", 
      flex: 1,
      renderCell: (params) => (
        <Typography>{formatDate(params.value)}</Typography>
      )
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="View Document">
            <IconButton
              color="info"
              onClick={() => handleViewDocument(params.row.generatedDoc)}
              disabled={!params.row.generatedDoc}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download Document">
            <IconButton
              color="success"
              onClick={() => handleDownloadDocument(params.row.generatedDoc, params.row.id)}
              disabled={!params.row.generatedDoc}
            >
              <GetAppIcon />
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
            Issued Certificates
          </Typography>
        </Stack>
      </CommonCard>

      <CommonCard>
        {/* <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Chip
            label="All"
            color={selectedFilter === "all" ? "primary" : "default"}
            onClick={() => handleFilterChange("all")}
            clickable
            sx={{
              fontWeight: selectedFilter === "all" ? 600 : 400,
              px: 2
            }}
          />
          <Chip
            label="Full Term"
            color={selectedFilter === "full_term" ? "primary" : "default"}
            onClick={() => handleFilterChange("full_term")}
            clickable
            sx={{
              fontWeight: selectedFilter === "full_term" ? 600 : 400,
              px: 2
            }}
          />
          <Chip
            label="Interim"
            color={selectedFilter === "interim" ? "primary" : "default"}
            onClick={() => handleFilterChange("interim")}
            clickable
            sx={{
              fontWeight: selectedFilter === "interim" ? 600 : 400,
              px: 2
            }}
          />
        </Stack> */}
        
        <CommonInput
          placeholder="Search Certificate By Place or Type"
          fullWidth
          value={search}
          onChange={handleSearchChange}
          sx={{ marginBottom: 2 }}
        />
        
        <Box sx={{ width: "100%", mt: 4 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="300px">
              <CircularProgress />
            </Box>
          ) : certificatesList.length > 0 ? (
            <DataGrid
              rows={certificatesList}
              columns={columns}
              loading={loading}
              pagination={false}
              disableColumnFilter
              disableColumnMenu
              disableColumnSelector
              disableDensitySelector
              disableRowSelectionOnClick
              hideFooter
              getRowHeight={() => 70}
              sx={{
                backgroundColor: "#fff",
                border: "none",
                '& .MuiDataGrid-cell': {
                  display: 'flex',
                  alignItems: 'center',
                },
              }}
            />
          ) : (
            <Typography
              variant="h6"
              align="center"
              sx={{ color: "gray", padding: 3 }}
            >
              No Certificates Found
            </Typography>
          )}
        </Box>
        
        {totalRows > limit && (
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

export default Certificates;