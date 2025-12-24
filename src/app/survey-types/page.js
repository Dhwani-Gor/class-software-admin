"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Stack, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip, CircularProgress, Pagination } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import Layout from "@/Layout";
import CommonCard from "@/components/CommonCard";
import CommonButton from "@/components/CommonButton";
import CommonInput from "@/components/CommonInput";
import { deleteSurveyType, getSurveyTypes } from "@/api";
import { toast } from "react-toastify";

const SurveyTypes = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [surveyTypes, setSurveyTypes] = useState([]);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [limit] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  /* -------------------- SEARCH DEBOUNCE -------------------- */
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  /* -------------------- FETCH DATA -------------------- */
  const fetchSurveyTypes = async () => {
    setLoading(true);
    try {
      const res = showAll ? await getSurveyTypes(debouncedSearch) : await getSurveyTypes(debouncedSearch, page, limit);

      if (res?.status === 200) {
        const formatted = res.data.data.map((item) => {
          let type = "-";
          if (item.statutorySurvey) type = "Statutory";
          else if (item.classificationSurvey) type = "Classification";
          else if (item.audit) type = "Audit";
          return { ...item, type };
        });

        setSurveyTypes(formatted);
        setTotalRows(res.data.results || formatted.length);
      }
    } catch {
      toast.error("Failed to fetch survey types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveyTypes();
  }, [debouncedSearch, page, showAll]);

  /* -------------------- SORT -------------------- */
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedData = [...surveyTypes].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key] || "";
    const bVal = b[sortConfig.key] || "";
    return sortConfig.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });

  /* -------------------- DELETE -------------------- */
  const handleDelete = async (id) => {
    try {
      await deleteSurveyType({ id });
      toast.success("Survey type deleted successfully");
      fetchSurveyTypes();
    } catch {
      toast.error("Failed to delete survey type");
    }
  };

  return (
    <Layout>
      <CommonCard>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" fontWeight={700}>
            Survey Types
          </Typography>
          <CommonButton text="Add Survey Type" variant="contained" onClick={() => router.push("/survey-types/create")} />
        </Stack>
      </CommonCard>

      <CommonCard>
        <CommonInput placeholder="Search Survey Types" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ mb: 2 }} />

        {loading ? (
          <Box display="flex" justifyContent="center" height={300}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ marginTop: 3 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  {[{ label: "No." }, { label: "Survey Type", key: "name" }, { label: "Abbreviation", key: "abbreviation" }, { label: "Type", key: "type" }, { label: "Actions" }].map((col) => (
                    <TableCell key={col.label} sx={{ fontWeight: 600, cursor: col.key ? "pointer" : "default" }} onClick={() => col.key && handleSort(col.key)}>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Typography>{col.label}</Typography>
                        {sortConfig.key === col.key && (sortConfig.direction === "asc" ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
                      </Stack>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {sortedData.map((row, idx) => (
                  <TableRow key={row.id}>
                    <TableCell>{(page - 1) * limit + idx + 1}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.abbreviation}</TableCell>
                    <TableCell>{row.type}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Edit">
                          <IconButton color="primary" onClick={() => router.push(`/survey-types/${row.id}`)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton color="error" onClick={() => handleDelete(row.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* -------- FOOTER -------- */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}>
          <Typography fontWeight="bold">Total Count: {totalRows}</Typography>

          <Stack direction="row" spacing={2} alignItems="center">
            <CommonButton
              text={showAll ? "Show Paginated" : "Show All"}
              variant="outlined"
              size="small"
              sx={{ textTransform: "uppercase", padding: "6px 6px", fontSize: "14px" }}
              onClick={() => {
                setShowAll((prev) => !prev);
                setPage(1);
              }}
            />

            {!showAll && <Pagination count={Math.ceil(totalRows / limit)} page={page} onChange={(e, val) => setPage(val)} color="primary" variant="outlined" shape="rounded" sx={{ marginTop: "10px" }} />}
          </Stack>
        </Stack>
      </CommonCard>
    </Layout>
  );
};

export default SurveyTypes;
