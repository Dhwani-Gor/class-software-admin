"use client";
import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Box,
    Stack,
    Tooltip,
    IconButton,
    Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import GetAppIcon from "@mui/icons-material/GetApp";
import { fetchAmdReamrks } from "@/api";

const ShowAmdRemarksDialog = ({ open, onClose, reportDetailId }) => {
    const [amendments, setAmendments] = useState([]);
    console.log(amendments, "amendments");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && reportDetailId) {
            loadAmendments();
        }
    }, [open, reportDetailId]);

    const loadAmendments = async () => {
        setLoading(true);
        try {
            const res = await fetchAmdReamrks(reportDetailId);
            if (res?.status === 200 && Array.isArray(res.data)) {
                setAmendments(res.data);
            } else if (res?.data?.data) {
                setAmendments(res.data.data);
            } else {
                setAmendments([]);
            }
        } catch (error) {
            console.error("Error fetching amendment remarks:", error);
            setAmendments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleView = (doc) => {
        if (doc) window.open(doc, "_blank");
    };

    const handleDownload = (doc) => {
        if (doc) {
            const link = document.createElement("a");
            link.href = doc;
            link.download = doc.split("/").pop();
            link.click();
        }
    };

    const getCertificateType = (reportDetail) => {
        const report = reportDetail?.activity?.surveyTypes?.report;
        if (!report) return "-";

        const types = [];
        if (report.fullTermFilePath) types.push("Full Term");
        if (report.shortTermFilePath) types.push("Short Term");
        if (report.interimFilePath) types.push("Interim");

        return types.length ? types.join(", ") : "-";
    };



    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
            PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
        >
            <DialogTitle sx={{ fontWeight: 600, fontSize: 18 }}>
                Amendment Reports
            </DialogTitle>

            <DialogContent dividers sx={{ minHeight: 300 }}>
                {loading ? (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            height: 250,
                        }}
                    >
                        <CircularProgress />
                    </Box>
                ) : amendments.length === 0 ? (
                    <Typography align="center" sx={{ mt: 4 }}>
                        No amendment reports found.
                    </Typography>
                ) : (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Report Number</TableCell>
                                    <TableCell>Ship Name</TableCell>
                                    <TableCell>Amended Document</TableCell>
                                    <TableCell>Type of Certificate</TableCell>
                                    <TableCell>Remarks</TableCell>
                                    <TableCell>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {amendments.map((amd) => {
                                    const activity = amd.reportDetail?.activity;
                                    const journal = activity?.journal;
                                    const client = journal?.client;
                                    const report = activity?.surveyTypes?.report;

                                    // Correctly get Report Number, Ship Name
                                    const reportNumber = journal?.journalTypeId || "-";
                                    const shipName = client?.shipName || "-";

                                    // Determine Type of Certificate
                                    const certificateTypes = [];
                                    if (report?.fullTermFilePath) certificateTypes.push("Full Term");
                                    if (report?.shortTermFilePath) certificateTypes.push("Short Term");
                                    if (report?.interimFilePath) certificateTypes.push("Interim");
                                    const certificateType = certificateTypes.join(", ") || "-";

                                    return (
                                        <TableRow key={amd.id}>
                                            <TableCell>{reportNumber}</TableCell>
                                            <TableCell>{shipName}</TableCell>
                                            <TableCell>
                                                {amd.amendedDoc ? (
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {amd.amendedDoc.split("/").pop()}
                                                    </Typography>
                                                ) : "-"}
                                            </TableCell>
                                            <TableCell>Short Term</TableCell>
                                            <TableCell>
                                                {amd.amdRemarks || "-"}
                                            </TableCell>
                                            <TableCell>
                                                {amd.amendedDoc ? (
                                                    <Stack direction="row" spacing={1}>
                                                        <Tooltip title="View Document">
                                                            <IconButton color="info" onClick={() => handleView(amd.amendedDoc)}>
                                                                <VisibilityIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Download Document">
                                                            <IconButton color="success" onClick={() => handleDownload(amd.amendedDoc)}>
                                                                <GetAppIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>
                                                ) : "-"}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>

                        </Table>
                    </TableContainer>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} variant="contained" color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};
export default ShowAmdRemarksDialog;
