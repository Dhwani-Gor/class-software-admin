"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
    CircularProgress,
    Box,
    Stack,
    Typography,
    IconButton,
    Tooltip,
    Pagination,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Dialog,
    DialogTitle,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    FormControl,
    Select,
    MenuItem,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import Layout from "@/Layout";
import CommonCard from "@/components/CommonCard";
import CommonButton from "@/components/CommonButton";
import CommonInput from "@/components/CommonInput";

import { toast } from "react-toastify";
import {
    deleteMachineList,
    getAllClients,
    getMachineById,
} from "@/api";
import moment from "moment";

const MachineList = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [machineList, setMachineList] = useState([]);
    console.log(machineList, "machine list")
    const [clientsList, setClientsList] = useState([]);

    const [selectedShipId, setSelectedShipId] = useState(null);

    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
    const [limit] = useState(10);
    const [totalRows, setTotalRows] = useState(0);

    const [openDialog, setOpenDialog] = useState(false);
    const [selectedMachineId, setSelectedMachineId] = useState(null);

    // -------------------------------------------------------
    // Fetch Clients
    // -------------------------------------------------------
    const fetchClients = async () => {
        try {
            const response = await getAllClients();

            if (response?.data?.status === "success") {
                setClientsList(response.data.data);
            } else {
                toast.error(response?.data?.message);
            }
        } catch (error) {
            toast.error(error?.message || "Failed to load clients");
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    // -------------------------------------------------------
    // Handle Ship Change
    // -------------------------------------------------------
    const handleClientChange = (e) => {
        const shipId = e.target.value;
        setSelectedShipId(shipId);
        setPage(1); // reset pagination when ship changes
    };

    // -------------------------------------------------------
    // Fetch Machine List – Only when ship selected
    // -------------------------------------------------------
    useEffect(() => {
        if (!selectedShipId) return;

        const fetchMachineList = async () => {
            try {
                setLoading(true);
                const result = await getMachineById(selectedShipId);
                console.log(result, "result")
                if (result?.data?.status === "success") {
                    setMachineList(result.data.data);
                }
                else {
                    // setMachineList([])
                }

                setLoading(false);
            } catch (error) {
                setLoading(false);
                toast.error("Failed to fetch machine list");
            }
        };

        fetchMachineList();
    }, [selectedShipId, page, search]);

    // -------------------------------------------------------
    // Delete Logic
    // -------------------------------------------------------
    const handleDeleteClick = (id) => {
        setSelectedMachineId(id);
        setOpenDialog(true);
    };

    const handleConfirmDelete = async () => {
        setOpenDialog(false);
        if (!selectedMachineId) return;
        try {
            const res = await deleteMachineList(selectedMachineId);
            if (res?.data?.message) toast.success(res.data.message);

            // Refresh list
            if (selectedShipId) {
                const updated = await getMachineById(selectedShipId);
                setMachineList(updated.data.data);
            }
        } catch {
            toast.error("Failed to delete Machinery");
        }
    };

    const handleCancelDelete = () => {
        setSelectedMachineId(null);
        setOpenDialog(false);
    };

    // -------------------------------------------------------
    // Pagination
    // -------------------------------------------------------
    const handlePageChange = (e, value) => {
        setPage(value);
        router.push(`/machine-list?page=${value}&limit=${limit}`);
    };

    return (
        <Layout>
            {/* --------------------------------------------------- */}
            {/* Header */}
            {/* --------------------------------------------------- */}
            <CommonCard sx={{ mt: 0 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4" fontWeight={700}>
                        Machinery / Hull List
                    </Typography>

                    <CommonButton
                        text="Add Machinery"
                        variant="contained"
                        sx={{ textTransform: "capitalize" }}
                        onClick={() => router.push("/machine-list/create")}
                    />
                </Stack>
            </CommonCard>

            {/* --------------------------------------------------- */}
            {/* Filters */}
            {/* --------------------------------------------------- */}
            <CommonCard sx={{ mt: 2 }}>

                {/* Ship Dropdown */}
                <FormControl fullWidth sx={{ maxWidth: 300, mb: 3, mt: 3 }}>
                    <Typography sx={{ fontWeight: 700, mb: 1 }}>Select Ship</Typography>

                    <Select
                        value={selectedShipId || ""}
                        onChange={handleClientChange}
                    >
                        <MenuItem value="">&nbsp;</MenuItem>
                        {clientsList.map((client) => (
                            <MenuItem key={client.id} value={client.id}>
                                {client.shipName}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* --------------------------------------------------- */}
                {/* Data Display */}
                {/* --------------------------------------------------- */}


                {loading ? (
                    <Box display="flex" justifyContent="center" p={4}>
                        <CircularProgress />
                    </Box>
                ) : !selectedShipId ? (
                    <Typography align="center" sx={{ color: "gray", p: 3 }}>
                        Please select a ship to view machinery list.
                    </Typography>
                ) : !machineList?.machineData ||
                    Object.keys(machineList.machineData).length === 0 ? (
                    <Typography align="center" sx={{ color: "gray", p: 3 }}>
                        No Data Found
                    </Typography>
                ) : (
                    // Render sections dynamically
                    Object.values(machineList?.machineData).map((section, index) => (
                        <Accordion key={index} defaultExpanded sx={{ mb: 2 }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6" fontWeight="bold">{section.sectionName || `Section ${index + 1}`}</Typography>
                            </AccordionSummary>

                            <AccordionDetails>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Code</TableCell>

                                            <TableCell>Label</TableCell>
                                            <TableCell>Position</TableCell>
                                            <TableCell>Occurrence</TableCell>
                                            <TableCell>Assignment Date</TableCell>
                                            <TableCell>Due Date</TableCell>
                                            <TableCell>Postponed Date</TableCell>
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {(section.items || []).map((item, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>{item.generatedCode || "-"}</TableCell>

                                                <TableCell>{item.content ? item.content : item.label || "-"}</TableCell>
                                                <TableCell>{item.positionCode || "-"}</TableCell>
                                                <TableCell>{item.occurrence || "-"}</TableCell>
                                                <TableCell>{moment(item.assignmentDate).format("DD/MM/YYYY") || "-"}</TableCell>
                                                <TableCell>{moment(item.dueDate).format("DD/MM/YYYY") || "-"}</TableCell>
                                                <TableCell>{moment(item.postponedDate).format("DD/MM/YYYY")}</TableCell>
                                            </TableRow>
                                        ))}

                                        {/* Show a message if there are no items in this section */}
                                        {(!section.items || section.items.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center">
                                                    No items in this section.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </AccordionDetails>
                        </Accordion>
                    ))
                )}


            </CommonCard>

            {/* --------------------------------------------------- */}
            {/* Delete Confirmation */}
            {/* --------------------------------------------------- */}
            <Dialog open={openDialog} onClose={handleCancelDelete}>
                <DialogTitle>
                    Are you sure you want to delete this Machinery / Hull?
                </DialogTitle>

                <Box display="flex" justifyContent="flex-end" p={2}>
                    <CommonButton onClick={handleCancelDelete}>
                        Cancel
                    </CommonButton>

                    <CommonButton
                        onClick={handleConfirmDelete}
                        sx={{ backgroundColor: "#ed2b1c", color: "#fff", fontWeight: 500, ml: 1 }}
                    >
                        Delete
                    </CommonButton>
                </Box>
            </Dialog>
        </Layout>
    );
};

export default MachineList;
