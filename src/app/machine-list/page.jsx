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
    Grid,
    Grid2,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import Layout from "@/Layout";
import CommonCard from "@/components/CommonCard";
import CommonButton from "@/components/CommonButton";
import CommonInput from "@/components/CommonInput";

import { toast } from "react-toastify";
import {
    deleteMachineList,
    fetchMachineList,
    getAllClients,
    getMachineById,
    updateMachineList,
} from "@/api";
import moment from "moment";

const MachineList = () => {
    const router = useRouter();
    const [machineList, setMachineList] = useState([]);
    const [clientsList, setClientsList] = useState([]);
    const [selectedShipId, setSelectedShipId] = useState(null);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    const [editForm, setEditForm] = useState({
        generatedCode: "",
        label: "",
        position: "",
        dueDate: "",
        assignmentDate: "",
        postponedDate: "",
        status: "",
        positionCode: "",
        machineSection: ""
    });

    const [openDialog, setOpenDialog] = useState(false);
    const [selectedMachineId, setSelectedMachineId] = useState(null);

    // -------------------------------------------------------
    // Fetch Clients
    // -------------------------------------------------------
    const handleEditClick = (item, sectionKey) => {
        setEditForm({
            generatedCode: item.generatedCode,
            label: item.label || item.content || "",
            position: item.position,
            dueDate: moment(item.dueDate).format("YYYY-MM-DD"),
            assignmentDate: moment(item.assignmentDate).format("YYYY-MM-DD"),
            postponedDate: item.postponedDate
                ? moment(item.postponedDate).format("YYYY-MM-DD")
                : "",
            positionCode: item.positionCode || "",
            status: item.status || "",
            machineSection: sectionKey
        });

        setOpenEditDialog(true);
    };

    const handleUpdateMachine = async () => {
        if (!selectedShipId) {
            toast.error("Select ship first!");
            return;
        }

        const payload = {
            generatedCode: editForm.generatedCode,
            machineSection: editForm.machineSection,
            updateData: {
                label: editForm.label,
                dueDate: editForm.dueDate,
                assignmentDate: editForm.assignmentDate,
                postponedDate: editForm.postponedDate,
                status: editForm.status,
                positionCode: editForm.positionCode
            }
        };

        try {
            const res = await updateMachineList(selectedShipId, payload);

            if (res?.data?.status === "success") {
                toast.success("Machinery updated successfully");
                setOpenEditDialog(false);
                fetchMachineList()

                setSelectedShipId(selectedShipId);
            } else {
                toast.error(res?.data?.message);
            }
        } catch (err) {
            toast.error("Update failed");
        }
    };

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

    const handleClientChange = (e) => {
        const shipId = e.target.value;
        setSelectedShipId(shipId);
    };

    const fetchMachineList = async () => {
        try {
            setLoading(true);
            const result = await getMachineById(selectedShipId);
            console.log(result, "result")
            if (result?.data?.status === "success") {
                setMachineList(result.data.data);
            }
            else {
                setMachineList([])
            }
            setLoading(false);
        } catch (error) {
            setLoading(false);
            toast.error("Failed to fetch machine list");
        }
    };

    useEffect(() => {
        if (!selectedShipId) return;


        fetchMachineList();
    }, [selectedShipId, search]);

    const handleDeleteClick = (shipId) => {
        if (!shipId) {
            toast.error("Please select a ship first.");
            return;
        }
        setSelectedMachineId(shipId);
        setOpenDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedMachineId) return;

        try {
            const res = await deleteMachineList(selectedMachineId);

            if (res?.data?.message) toast.success(res.data.message);
            setSelectedShipId("")
            // After delete: clear list
            setMachineList([]);

        } catch (error) {
            toast.error("Failed to delete machinery");
        } finally {
            setOpenDialog(false);
            setSelectedMachineId(null);
        }
    };

    const handleCancelDelete = () => {
        setSelectedMachineId(null);
        setOpenDialog(false);
    };

    useEffect(() => {
        if (!machineList) return;

        const newFormData = {};

        Object.entries(machineList).forEach(([index, item]) => {

            // Identify which section and row this belongs to
            const rowKey = findRowKeyFromGeneratedCode(item.generatedCode);

            newFormData[rowKey] = {
                xMark: "X",
                assignmentDate: item.assignmentDate,
                dueDate: item.dueDate,
                position: item.positionCode === "-" ? [] : [item.positionCode],
                label: item.label,
            };
        });

    }, []);



    return (
        <Layout>
            <CommonCard sx={{ mt: 0 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography variant="h4" fontWeight={700}>
                            Machinery / Hull List
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 2 }}>
                        <CommonButton
                            text="Edit Machinery"
                            disabled={!selectedShipId}
                            variant="contained"
                            sx={{ textTransform: "capitalize" }}
                            onClick={() => router.push(`/machine-list/${selectedShipId}`)}
                        />
                        <CommonButton
                            text="Add Machinery"
                            variant="contained"
                            sx={{ textTransform: "capitalize" }}
                            onClick={() => router.push("/machine-list/create")}
                        />

                    </Box>
                </Stack>
            </CommonCard>

            {/* --------------------------------------------------- */}
            {/* Filters */}
            {/* --------------------------------------------------- */}
            <CommonCard sx={{ mt: 2 }}>

                {/* Ship Dropdown */}
                <Box sx={{
                    display: "flex", alignItems: "center", justifyContent: "space-between"
                }}>
                    < FormControl fullWidth sx={{ maxWidth: 300, mb: 3, mt: 3 }}>
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
                    <CommonButton
                        sx={{ mt: 4 }}
                        text="Delete"
                        variant="contained"
                        disabled={!selectedShipId || machineList.length === 0}
                        onClick={() => handleDeleteClick(selectedShipId)}
                    />
                </Box>

                {
                    loading ? (
                        <Box display="flex" justifyContent="center" p={4}>
                            <CircularProgress />
                        </Box>
                    ) : !selectedShipId ? (
                        <Typography align="center" sx={{ color: "gray", p: 3 }}>
                            Please select a ship to view machinery list.
                        </Typography>
                    ) : !machineList ||
                        Object.keys(machineList).length === 0 ? (
                        <Typography align="center" sx={{ color: "gray", p: 3 }}>
                            No Data Found
                        </Typography>
                    ) : (
                        machineList?.machineData &&
                        typeof machineList.machineData === "object"
                    ) ? (
                        <>
                            <Box mb={2} sx={{
                                mb: 3,
                                p: 2,
                                border: "1px solid #ddd",
                                borderRadius: 2,
                                backgroundColor: "#fafafa",
                            }}>
                                <Typography variant="h6" fontWeight="bold">Machine Summary</Typography>

                                <Grid2 container spacing={2} mt={1}>
                                    <Grid2 size={6}>
                                        <Typography><strong>Ship Name:</strong> {machineList.shipName || "-"}</Typography>
                                    </Grid2>

                                    <Grid2 size={6}>
                                        <Typography><strong>Engine Type:</strong> {machineList.engineType?.replace("_", " ") || "-"}</Typography>
                                    </Grid2>

                                    <Grid2 size={6}>
                                        <Typography><strong>No. of Cylinders:</strong> {machineList.numberOfCylinders || "-"}</Typography>
                                    </Grid2>

                                    <Grid2 size={6}>
                                        <Typography><strong>Global Position:</strong> {(machineList.globalPosition || []).join(", ") || "-"}</Typography>
                                    </Grid2>

                                    <Grid2 size={6}>
                                        <Typography>
                                            <strong>Engine Units Counted From:</strong> {machineList.engineUnitsCountedFrom?.replace("_", " ") || "-"}
                                        </Typography>
                                    </Grid2>
                                </Grid2>
                            </Box>


                            {/* 🔻 ACCORDION SECTIONS */}
                            {Object.entries(machineList.machineData).map(([sectionKey, section], index) => (
                                <Accordion key={index} defaultExpanded sx={{ mb: 2 }}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography variant="h6" fontWeight="bold">
                                            {section.sectionName || `Section ${index + 1}`}
                                        </Typography>
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
                                                    <TableCell>Action</TableCell>
                                                </TableRow>
                                            </TableHead>

                                            <TableBody>
                                                {(section.items || []).length > 0 ? (
                                                    section.items.map((item, idx) => (
                                                        <TableRow key={idx}>
                                                            <TableCell>{item.generatedCode || "-"}</TableCell>
                                                            <TableCell>{item.content || item.label || "-"}</TableCell>
                                                            <TableCell>{item.positionCode || "-"}</TableCell>
                                                            <TableCell>{item.occurrence || "-"}</TableCell>
                                                            <TableCell>{moment(item.assignmentDate).format("DD/MM/YYYY")}</TableCell>
                                                            <TableCell>{moment(item.dueDate).format("DD/MM/YYYY")}</TableCell>
                                                            <TableCell>
                                                                {item.postponedDate
                                                                    ? moment(item.postponedDate).format("DD/MM/YYYY")
                                                                    : "-"}
                                                            </TableCell>

                                                            <TableCell>
                                                                <IconButton
                                                                    color="primary"
                                                                    onClick={() => handleEditClick(item, sectionKey)}
                                                                >
                                                                    <EditIcon />
                                                                </IconButton>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={8} align="center">
                                                            No items in this section.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </>
                    ) : (
                        <Typography align="center" sx={{ p: 2, color: "gray" }}>
                            No machine data found.
                        </Typography>
                    )
                }


            </CommonCard >

            <Dialog open={openDialog} onClose={handleCancelDelete}>
                <DialogTitle>
                    Are you sure you want to delete this Machinery / Hull?
                </DialogTitle>

                <Box display="flex" justifyContent="flex-end" p={2}>
                    <CommonButton onClick={handleCancelDelete} text="Cancel" variant="outlined">
                        Cancel
                    </CommonButton>

                    <CommonButton
                        onClick={handleConfirmDelete}
                        sx={{ color: "#fff", fontWeight: 500, ml: 1 }} text="Yes"
                    >
                        Delete
                    </CommonButton>
                </Box>
            </Dialog>
            <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} >
                <DialogTitle sx={{ mb: -2 }}>Edit Machinery</DialogTitle>

                <Box p={3} sx={{ width: "400px" }}>
                    <Typography>Label</Typography>
                    <CommonInput
                        sx={{ mt: 2, mb: 2 }}
                        disabled
                        value={editForm.label}
                        onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                    />

                    <Typography sx={{ mt: 1 }}>Due Date</Typography>
                    <CommonInput
                        sx={{ mt: 2, mb: 2 }}
                        type="date"
                        value={editForm.dueDate}
                        onChange={(e) =>
                            setEditForm({ ...editForm, dueDate: e.target.value })
                        }
                    />

                    <Typography sx={{ mt: 2 }}>Assignment Date</Typography>
                    <CommonInput
                        type="date"
                        sx={{ mt: 2, mb: 2 }}
                        value={editForm.assignmentDate}
                        onChange={(e) =>
                            setEditForm({ ...editForm, assignmentDate: e.target.value })
                        }
                    />

                    <Typography sx={{ mt: 2 }}>Postponed Date</Typography>
                    <CommonInput
                        type="date"
                        sx={{ mt: 2, mb: 2 }}
                        value={editForm.postponedDate}
                        onChange={(e) =>
                            setEditForm({ ...editForm, postponedDate: e.target.value })
                        }
                    />

                    {/* <FormControl fullWidth sx={{ mt: 2 }}>
                        <Typography>X Mark</Typography>
                        <Select
                            value={editForm.status}
                            onChange={(e) =>
                                setEditForm({ ...editForm, status: e.target.value })
                            }
                        >
                            <MenuItem value="Y">Y</MenuItem>
                            <MenuItem value="N">N</MenuItem>
                            <MenuItem value="NA">NA</MenuItem>
                        </Select>
                    </FormControl> */}
                    <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
                        <Typography>Status</Typography>
                        <Select
                            value={editForm.status}
                            onChange={(e) =>
                                setEditForm({ ...editForm, status: e.target.value })
                            }
                        >
                            <MenuItem value="credited">Credited</MenuItem>
                            <MenuItem value="waived off">Waived Off</MenuItem>
                            <MenuItem value="postponed">Postponed</MenuItem>
                        </Select>
                    </FormControl>


                    <Box display="flex" justifyContent="flex-end" mt={3}>
                        <CommonButton
                            variant="outlined"
                            text="Cancel"
                            onClick={() => setOpenEditDialog(false)}
                        />

                        <CommonButton
                            sx={{ ml: 2 }}
                            variant="contained"
                            text="Update"
                            onClick={handleUpdateMachine}
                        />
                    </Box>
                </Box>
            </Dialog>

        </Layout >
    );
};

export default MachineList;
