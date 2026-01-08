"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    CircularProgress,
    Box,
    Stack,
    Typography,
    IconButton,
    FormControl,
    Select,
    MenuItem,
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
    getAllClients,
    getMachineById,
    updateMachineList,
} from "@/api";

import moment from "moment";

const MachineList = () => {
    const router = useRouter();

    const [machineList, setMachineList] = useState(null);
    const [clientsList, setClientsList] = useState([]);
    const [selectedShipId, setSelectedShipId] = useState("");
    const [loading, setLoading] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);

    const [editForm, setEditForm] = useState({
        generatedCode: "",
        label: "",
        dueDate: "",
        assignmentDate: "",
        postponedDate: "",
        positionCode: "",
        status: "",
        machineSection: "",
        fromFrameNo: "",      // ✅ ADD
        toFrameNo: "",
    });

    /* ---------------- FETCH CLIENTS ---------------- */
    useEffect(() => {
        getAllClients()
            .then((res) => {
                if (res?.data?.status === "success") {
                    setClientsList(res.data.data);
                }
            })
            .catch(() => toast.error("Failed to load ships"));
    }, []);

    /* ---------------- FETCH MACHINE LIST ---------------- */
    useEffect(() => {
        if (!selectedShipId) return;

        setLoading(true);
        getMachineById(selectedShipId)
            .then((res) => {
                if (res?.data?.status === "success") {
                    setMachineList(res.data.data);
                } else {
                    setMachineList(null);
                }
            })
            .catch(() => toast.error("Failed to fetch machine list"))
            .finally(() => setLoading(false));
    }, [selectedShipId]);

    /* ---------------- EDIT ---------------- */
    const handleEditClick = (item, sectionId) => {
        setEditForm({
            generatedCode: item.generatedCode,
            label: item.label || item.content || "",
            dueDate: item.dueDate ? moment(item.dueDate).format("YYYY-MM-DD") : "",
            assignmentDate: item.assignmentDate
                ? moment(item.assignmentDate).format("YYYY-MM-DD")
                : "",
            postponedDate: item.postponedDate
                ? moment(item.postponedDate).format("YYYY-MM-DD")
                : "",
            positionCode: item.positionCode || "",
            status: item.status || "",
            machineSection: String(sectionId),
            fromFrameNo: item.fromFrameNo || "",
            toFrameNo: item.toFrameNo || "",
        });
        setOpenEditDialog(true);
    };



    const handleUpdateMachine = async () => {
        const payload = {
            generatedCode: editForm.generatedCode,
            machineSection: editForm.machineSection,
            updateData: {
                dueDate: editForm.dueDate,
                label: editForm.label,
                assignmentDate: editForm.assignmentDate,
                postponedDate: editForm.postponedDate,
                status: editForm.status,
                positionCode: editForm.positionCode,
                fromFrameNo: editForm.fromFrameNo || null,
                toFrameNo: editForm.toFrameNo || null,
            },
        };

        try {
            const res = await updateMachineList(selectedShipId, payload);
            if (res?.data?.status === "success") {
                toast.success("Updated successfully");
                setOpenEditDialog(false);
                const refreshed = await getMachineById(selectedShipId);
                setMachineList(refreshed.data.data);
            }
        } catch {
            toast.error("Update failed");
        }
    };

    /* ---------------- DELETE ---------------- */
    const handleConfirmDelete = async () => {
        try {
            await deleteMachineList(selectedShipId);
            toast.success("Deleted successfully");
            setMachineList(null);
            setSelectedShipId("");
        } catch {
            toast.error("Delete failed");
        } finally {
            setOpenDeleteDialog(false);
        }
    };


    /* ---------------- GROUPING & ORDER ---------------- */
    const machinerySections = Object.entries(machineList?.machineData || {})
        .filter(([_, section]) => section.sectionType === "machinery");



    const hullSections = Object.entries(machineList?.machineData || {})
        .filter(([_, section]) => section.sectionType === "hull");

    const isHullEdit = hullSections.some(
        ([key]) => key === editForm.machineSection
    );

    return (
        <Layout>
            <CommonCard>

                <Stack direction="row" justifyContent="space-between">

                    <Typography variant="h4" fontWeight={700}>
                        Machinery / Hull List
                    </Typography>

                    <Stack direction="row" spacing={2}>
                        <CommonButton
                            text="Edit Machinery"
                            disabled={!selectedShipId}
                            onClick={() =>
                                router.push(`/machine-list/${selectedShipId}`)
                            }
                        />
                        <CommonButton
                            text="Add Machinery"
                            onClick={() => router.push("/machine-list/create")}
                        />
                    </Stack>
                </Stack>
            </CommonCard>

            <CommonCard sx={{ mt: 2 }}>
                <Box display="flex" gap={2} justifyContent="space-between">

                    <FormControl fullWidth sx={{ maxWidth: 300 }}>
                        <Typography fontWeight={700} fontSize={17}>Select Ship</Typography>
                        <Select
                            value={selectedShipId}
                            onChange={(e) => setSelectedShipId(e.target.value)}
                        >
                            <MenuItem value="" />
                            {clientsList?.map((c) => (
                                <MenuItem key={c.id} value={c.id}>
                                    {c.shipName}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <CommonButton
                        sx={{ mt: 3 }}
                        text="Delete"
                        variant="contained"
                        disabled={!selectedShipId || !machineList}
                        onClick={() => setOpenDeleteDialog(true)}
                    />
                </Box>

                {loading ? (
                    <Box display="flex" justifyContent="center" p={4}>
                        <CircularProgress />
                    </Box>
                ) : !machineList ? (
                    <Typography align="center" color="gray" sx={{ mt: 3 }}>
                        No Data Found
                    </Typography>
                ) : (
                    <>
                        {machineList && (
                            <CommonCard sx={{ mt: 2 }}>
                                <Typography variant="h6" fontWeight={700} mb={2}>
                                    Ship & Engine Details
                                </Typography>

                                <Grid2 container spacing={3}>
                                    <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                                        <Typography fontWeight={600}>Ship Name</Typography>
                                        <Typography color="text.secondary">
                                            {machineList.shipName || "-"}
                                        </Typography>
                                    </Grid2>

                                    <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                                        <Typography fontWeight={600}>Engine Type</Typography>
                                        <Typography color="text.secondary">
                                            {machineList.engineType || "-"}
                                        </Typography>
                                    </Grid2>

                                    <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                                        <Typography fontWeight={600}>No. of Cylinders</Typography>
                                        <Typography color="text.secondary">
                                            {machineList.numberOfCylinders || "-"}
                                        </Typography>
                                    </Grid2>

                                    <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                                        <Typography fontWeight={600}>Engine Units Counted From</Typography>
                                        <Typography color="text.secondary">
                                            {machineList.engineUnitsCountedFrom || "-"}
                                        </Typography>
                                    </Grid2>

                                </Grid2>
                            </CommonCard>
                        )}

                        {/* ================= MACHINERY FIRST ================= */}
                        {machinerySections.length > 0 && (
                            <>
                                <Typography variant="h5" fontWeight={700} mt={3} mb={2}>
                                    Machinery
                                </Typography>

                                {machinerySections.map(([sectionKey, section], i) => (
                                    section.items.length > 0 &&
                                    <Accordion key={`mach-${i}`} defaultExpanded>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Typography fontWeight={600}>
                                                {section.sectionName}
                                            </Typography>
                                        </AccordionSummary>

                                        <AccordionDetails>
                                            <Table>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Code</TableCell>
                                                        <TableCell>Label</TableCell>
                                                        <TableCell>Assignment Date</TableCell>
                                                        <TableCell>Due Date</TableCell>
                                                        <TableCell>Postponed Date</TableCell>
                                                        <TableCell>Position</TableCell>
                                                        <TableCell>Occurance</TableCell>
                                                        <TableCell>Status</TableCell>
                                                        <TableCell>Action</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {section.items.map((item, idx) => (
                                                        <>
                                                            <TableRow key={idx}>
                                                                <TableCell>{item.generatedCode}</TableCell>
                                                                <TableCell>{item.content || item.label}</TableCell>
                                                                <TableCell>
                                                                    {item.assignmentDate ? moment(item.assignmentDate).format("DD/MM/YYYY") : "-"}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {item.dueDate ? moment(item.dueDate).format("DD/MM/YYYY") : "-"}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {item.postponedDate
                                                                        ? moment(item.postponedDate).format("DD/MM/YYYY")
                                                                        : "-"}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {item.positionCode}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {item.occurrence}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {item.status}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <IconButton
                                                                        onClick={() =>
                                                                            handleEditClick(item, sectionKey)
                                                                        }
                                                                    >
                                                                        <EditIcon />
                                                                    </IconButton>
                                                                </TableCell>
                                                            </TableRow>
                                                        </>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </AccordionDetails>
                                    </Accordion>
                                ))}
                            </>
                        )}

                        {/* ================= HULL NEXT ================= */}
                        {hullSections.length > 0 && (
                            <>
                                <Typography variant="h5" fontWeight={700} mt={4} mb={2}>
                                    Hull
                                </Typography>

                                {hullSections.map(([sectionKey, section], i) => (
                                    section.items.length > 0 &&
                                    <Accordion key={`hull-${i}`} defaultExpanded>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Typography fontWeight={600}>
                                                {section.sectionName}
                                            </Typography>
                                        </AccordionSummary>

                                        <AccordionDetails>
                                            <Table>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Code</TableCell>
                                                        <TableCell>Label</TableCell>
                                                        <TableCell>Assignment Date</TableCell>
                                                        <TableCell>From Frame No</TableCell>
                                                        <TableCell>Upto Frame No</TableCell>
                                                        <TableCell>Position</TableCell>
                                                        <TableCell>Occurrence</TableCell>
                                                        <TableCell>Status</TableCell>
                                                        <TableCell>Action</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {section.items.map((item, idx) => (
                                                        <TableRow key={idx}>
                                                            <TableCell>{item.generatedCode}</TableCell>
                                                            <TableCell>{item.content || item.label}</TableCell>
                                                            <TableCell>
                                                                {item.assignmentDate ? moment(item.assignmentDate).format("DD/MM/YYYY") : "-"}
                                                            </TableCell>
                                                            <TableCell>{item.fromFrameNo || "-"}</TableCell>
                                                            <TableCell>{item.toFrameNo || "-"}</TableCell>
                                                            <TableCell>{item.positionCode}</TableCell>
                                                            <TableCell>{item.occurrence}</TableCell>
                                                            <TableCell>
                                                                {item.status}
                                                            </TableCell>
                                                            <TableCell>
                                                                <IconButton
                                                                    onClick={() =>
                                                                        handleEditClick(item, sectionKey)
                                                                    }
                                                                >
                                                                    <EditIcon />
                                                                </IconButton>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </AccordionDetails>
                                    </Accordion>
                                ))}
                            </>
                        )}
                    </>
                )}
            </CommonCard>

            {/* ================= DELETE CONFIRM ================= */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>
                    Are you sure you want to delete this Machinery / Hull?
                </DialogTitle>
                <Box display="flex" justifyContent="flex-end" p={2}>
                    <CommonButton
                        variant="outlined"
                        text="Cancel"
                        onClick={() => setOpenDeleteDialog(false)}
                    />
                    <CommonButton
                        sx={{ ml: 2 }}
                        text="Yes"
                        onClick={handleConfirmDelete}
                    />
                </Box>
            </Dialog>

            {/* ================= EDIT DIALOG ================= */}
            <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
                <DialogTitle>Edit Machinery</DialogTitle>
                <Box p={3} width={400}>
                    <Typography>Label</Typography>
                    <CommonInput disabled value={editForm.label} />
                    {!isHullEdit && (
                        <><Typography mt={2}>Due Date</Typography><CommonInput
                            type="date"
                            value={editForm.dueDate}
                            onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} /></>)}

                    <>
                        <Typography mt={2}>Assignment Date</Typography>
                        <CommonInput
                            type="date"
                            value={editForm.assignmentDate}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    assignmentDate: e.target.value,
                                })
                            }
                        />
                        {!isHullEdit && (

                            <><Typography mt={2}>Postponed Date</Typography><CommonInput
                                type="date"
                                value={editForm.postponedDate}
                                onChange={(e) => setEditForm({
                                    ...editForm,
                                    postponedDate: e.target.value,
                                })} /></>
                        )}
                    </>


                    {/* ===== From / Upto Frame (ONLY HULL) ===== */}
                    {isHullEdit && (
                        <>
                            <Typography mt={2}>From Frame No</Typography>
                            <CommonInput
                                value={editForm.fromFrameNo}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        fromFrameNo: e.target.value,
                                    })
                                }
                            />

                            <Typography mt={2}>Upto Frame No</Typography>
                            <CommonInput
                                value={editForm.toFrameNo}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        toFrameNo: e.target.value,
                                    })
                                }
                            />
                        </>
                    )}
                    <FormControl fullWidth sx={{ mt: 2 }}>
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
                            text="Update"
                            onClick={handleUpdateMachine}
                        />
                    </Box>
                </Box>
            </Dialog>
        </Layout>
    );
};

export default MachineList;
