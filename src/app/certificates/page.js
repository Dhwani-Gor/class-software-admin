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
import { getAllIssuedDocuments, getAllJournals } from "@/api";
import { Chip, MenuItem, Select, TextField } from "@mui/material";
import CommonButton from "@/components/CommonButton";


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
  const [journals, setJournals] = useState([]);
  const [selectedReportNumber, setSelectedReportNumber] = useState("");
  const [placeFilter, setPlaceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("certificates");


  // Client-side search functionality

  const filteredCertificates = certificatesList.filter((certificate) => {
    if (!search.trim()) return true;

    const searchTerm = search.toLowerCase();
    const shipName = certificate.activity?.journal?.client?.shipName?.toLowerCase() || '';
    const journalTypeId = certificate.activity?.journal?.journalTypeId?.toLowerCase() || '';
    const certificateType = certificate.typeOfCertificate?.toLowerCase() || '';
    const place = certificate.place?.toLowerCase() || '';

    return shipName.includes(searchTerm) ||
      journalTypeId.includes(searchTerm) ||
      certificateType.includes(searchTerm) ||
      place.includes(searchTerm);
  });

  // Remove unused functions and effects
  const handleFilterChange = (newFilter) => {
    setSelectedFilter(newFilter);
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

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  const fetchCertificatesData = async () => {
    setLoading(true);
    try {
      const filterKeys = [];
      const filterValues = [];

      if (selectedReportNumber) {
        filterKeys.push("activity.journal.journalTypeId");
        filterValues.push(selectedReportNumber);
      }

      if (placeFilter) {
        filterKeys.push("place");
        filterValues.push(placeFilter);
      }

      if (statusFilter) {
        filterKeys.push("activity.status");
        filterValues.push(statusFilter);
      }

      const searchQuery = debouncedSearch.trim();
      const markAsArchive = selectedFilter == "Archive Documents";

      const res = await getAllIssuedDocuments(
        filterKeys,
        filterValues,
        searchQuery,
        page,
        limit,
        startDate,
        endDate,
        markAsArchive
      );

      const data = res?.data;

      if (data?.status === "success" && Array.isArray(data?.data)) {
        setCertificatesList(data.data);
        setTotalRows(data.total || data.results || data.data.length);
      } else {
        setCertificatesList([]);
        setTotalRows(0);
      }
    } catch (e) {
      console.error("Error fetching certificates:", e);
      setCertificatesList([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificatesData();
  }, [selectedFilter,selectedReportNumber, placeFilter, statusFilter, debouncedSearch, page, limit, startDate, endDate]);

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
      headerName: "No.",
      width: 80,
      renderCell: (params) => {
        return <Typography fontSize="14px">{(page - 1) * limit + params.api.getAllRowIds().indexOf(params.id) + 1}</Typography>;
      },
    },
    {
      field: "journalTypeId",
      headerName: "Report No",
      flex: 1,
      renderCell: (params) => (
        <Typography fontSize="14px">
          {params.row.activity?.journal?.journalTypeId || 'N/A'}
        </Typography>
      )
    },
    {
      field: "shipName",
      headerName: "Ship Name",
      flex: 1,
      renderCell: (params) => (
        <Typography fontSize="14px">
          {params.row.activity?.journal?.client?.shipName || 'N/A'}
        </Typography>
      )
    },
    {
      field: "typeOfCertificate",
      headerName: "Certificate Type",
      flex: 1,
      renderCell: (params) => (
        <Typography fontSize="14px" sx={{ textTransform: 'capitalize' }}>
          {params.value?.replace('_', ' ') || 'N/A'}
        </Typography>
      )
    },
    {
      field: "surveyType",
      headerName: "Survey Type",
      flex: 1,
      renderCell: (params) => (
        <Typography fontSize="14px"
          sx={{
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            width: '120px',
          }}
        >
          {params.row.activity?.surveyTypes?.name || 'N/A'}
        </Typography>
      )
    },
    {
      field: "surveyDate",
      headerName: "Survey Date",
      flex: 1,
      renderCell: (params) => (
        <Typography fontSize="14px">{formatDate(params.value)}</Typography>
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

  const fetchJournals = async () => {
    try {
      const response = await getAllJournals();
      const data = response?.data;
      if (data?.status === "success" && Array.isArray(data?.data)) {
        setJournals(data.data);
      }
    } catch (error) {
      console.log("Error fetching journals:", error);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, []);

  const handleClearFilter = () => {
    setSelectedReportNumber("");
    setPlaceFilter("");
    setStatusFilter("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };


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
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          {["certificates", "Archive Documents"].map((type) => (
            <Chip
              key={type}
              label={type.charAt(0).toUpperCase() + type.slice(1)}
              color={selectedFilter === type ? "primary" : "default"}
              onClick={() => handleFilterChange(type)}
              clickable
              sx={{ fontWeight: selectedFilter === type ? 600 : 400, px: 2 }}
            />
          ))}
        </Stack>
        <CommonInput
          placeholder="Search Certificate By Place or Type"
          fullWidth
          value={search}
          onChange={handleSearchChange}
          sx={{ marginBottom: 2 }}
        />

        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, mt: 2 }}>
          <Select
            value={selectedReportNumber}
            onChange={(e) => { setSelectedReportNumber(e.target.value); setPage(1); }}
            displayEmpty
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All Reports</MenuItem>
            {journals.map((report, index) => (
              <MenuItem key={index} value={report.journalTypeId}>
                {report.journalTypeId}
              </MenuItem>
            ))}
          </Select>

          {/* <TextField
            label="Place"
            size="small"
            value={placeFilter}
            onChange={(e) => { setPlaceFilter(e.target.value); setPage(1); }}
          />

          <TextField
            label="Activity Status"
            size="small"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          /> */}

          
          <TextField
            label="Survey Date From"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
          />

          <TextField
            label="Survey Date To"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
          />

          {(selectedReportNumber || placeFilter || statusFilter || startDate || endDate) && (
            <CommonButton
              variant="contained"
              size="small"
              sx={{ textTransform: "uppercase", padding: "12px 10px", fontSize: "14px" }}
              text="Clear Filters"
              onClick={() => {
                handleClearFilter();
              }}
            />
          )}
        </Stack>


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