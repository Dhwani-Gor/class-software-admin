"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Box,
    Typography,
    Stack,
    Snackbar,
    Pagination,
    CircularProgress,
    IconButton,
    Tooltip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import Layout from "@/Layout";
import CommonCard from "@/components/CommonCard";
import CommonInput from "@/components/CommonInput";
import { getAllVisas } from "@/api";
import VisibilityIcon from '@mui/icons-material/Visibility';

const VizaApplications = () => {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const searchParams = useSearchParams();
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [snackBar, setSnackBar] = useState({ open: false, message: "" });
    const [data, setData] = useState([])
    const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
    const [limit, setLimit] = useState(10);
    const [totalRows, setTotalRows] = useState(0);
    const [loading, setLoading] = useState(false);

    const snackbarClose = () => {
        setSnackBar({ open: false, message: "" });
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);

        return () => clearTimeout(handler);
    }, [search]);

    const fetchAllVisaApplications = async (page, limit, searchQuery) => {
        setLoading(true);
        await getAllVisas(page, limit, searchQuery).then((res) => {

            setData(res?.data?.data?.visaApplications);
            setTotalRows(res?.data?.data?.totalVisaApplication);
        }).catch((e) => {
            console.log(e)
        }).finally(() => {
            setLoading(false);
        });
    };

    useEffect(() => {
        if (page > 0 && limit > 0) {
            fetchAllVisaApplications(page, limit, debouncedSearch.trim() ? debouncedSearch : null);
        }
    }, [page, limit, debouncedSearch]);

    const handleSearchChange = (event) => {
        setSearch(event.target.value);
    };

    const handlePageChange = (event, value) => {
        setPage(value);
        router.push(`/vizaApplications?page=${value}&limit=${limit}`);
    };

    const columns = [
        {
            field: "id",
            headerName: "ID",
            flex: 2,
            renderCell: (params) => {
                return (
                    <Typography>{params?.api?.getRowIndexRelativeToVisibleRows(params?.id) + 1}</Typography>
                )
            },
        },
        {
            field: "firstName",
            headerName: "First Name",
            flex: 3,
            renderCell: (params) => params?.row.details?.firstName || "",
        },
        {
            field: "lastName",
            headerName: "Last Name",
            flex: 3,
            renderCell: (params) => params?.row.details?.lastName || "",
        },
        {
            field: "gender",
            headerName: "Gender",
            flex: 3,
            renderCell: (params) => params?.row.details?.gender || "",
        },
        {
            field: "dob",
            headerName: "Date of Birth",
            flex: 3,
            renderCell: (params) => params?.row.details?.dob || "",
        },
        {
            field: "placeOfBirth",
            headerName: "Place of Birth",
            flex: 3,
            renderCell: (params) => params?.row.details?.placeOfBirth || "",
        },
        {
            field: "passportNumber",
            headerName: "Passport Number",
            flex: 3,
            renderCell: (params) => params?.row.details?.passportNumber || "",
        },
        {
            field: "passportFrom",
            headerName: "Passport Issued From",
            flex: 3,
            renderCell: (params) => params?.row.details?.passportFrom || "",
        },
        {
            field: "passportIssuedOn",
            headerName: "Passport Issued On",
            flex: 3,
            renderCell: (params) => params?.row.details?.passportIssuedOn || "",
        },
        {
            field: "passportValidUntil",
            headerName: "Passport Valid Until",
            flex: 3,
            renderCell: (params) => params?.row.details?.passportValidUntil || "",
        },
        { field: "expectedVisaDate", headerName: "Expected Visa Date", flex: 3 },
        // { field: "createdAt", headerName: "Created At", flex: 3 },
        // { field: "updatedAt", headerName: "Updated At", flex: 3 },
        {
            field: "photo",
            headerName: "Photo",
            flex: 3,
            renderCell: (params) => (
                <img src={params.value} alt="User Photo" style={{ width: 50, height: 50, borderRadius: '50%' }} />
            ),
        },
        {
            field: "passport",
            headerName: "Passport Image",
            flex: 3,
            renderCell: (params) => (
                <img src={params.value} alt="Passport" style={{ width: 50, height: 50 }} />
            ),
        },
        {
            field: "Actions",
            headerName: "Actions",
            flex: 3,
            renderCell: (params) => (
                <Tooltip title="View">
                    <IconButton 
                        color="primary"
                        onClick={() => router.push(`/vizaApplications/${params?.id}`)}
                    >
                        <VisibilityIcon/>
                    </IconButton>
                </Tooltip>
            ),
        },

    ];

    return (
        <Layout>
            <CommonCard>
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Typography variant="h4" fontWeight={700}>
                        Visa Applications
                    </Typography>
                </Stack>
            </CommonCard>

            <CommonCard>
                <CommonInput
                    placeholder="Search visa application by first name and last name"
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
                    ) :
                        Array.isArray(data) && data.length > 0 ? (
                            <DataGrid
                                rows={data}
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

export default VizaApplications;