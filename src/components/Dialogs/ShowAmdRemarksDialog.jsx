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
            let data = [];

            if (res?.status === 200 && Array.isArray(res.data)) {
                data = res.data;
            } else if (res?.data?.data) {
                data = res.data.data;
            }

            // Remove duplicate entries (based on amendedDoc name)
            const unique = data.filter(
                (v, i, a) => a.findIndex(t => t.amendedDoc === v.amendedDoc) === i
            );

            setAmendments(unique);
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

    // Extract header info from first amendment
    const first = amendments[0];
    const reportNumber =
        first?.reportDetail?.activity?.journal?.journalTypeId || "-";
    const shipName = first?.reportDetail?.activity?.journal?.client?.shipName || "-";
    // Determine correct certificate type based on amendedDoc filename
    let certificateType = "-";
    const firstDoc = first?.amendedDoc || "";
    if (firstDoc.toLowerCase().includes("full_term")) {
        certificateType = "Full Term";
    } else if (firstDoc.toLowerCase().includes("short_term")) {
        certificateType = "Short Term";
    } else if (firstDoc.toLowerCase().includes("interim")) {
        certificateType = "Interim";
    }



    // helper: extract report number (MCB...) and optional AMD index
    const extractReportNumber = (fileNameRaw) => {
        if (!fileNameRaw) return "-";
        const fileName = fileNameRaw.split("/").pop().replace(/\.pdf$/i, ""); // no .pdf

        // find AMD(n) if present
        const amdMatch = fileName.match(/AMD\((\d+)\)/i);

        let reportNo = null;

        if (amdMatch) {
            // search for last MCB... that appears before the AMD(...) occurrence
            const amdIndex = fileName.search(/AMD\(\d+\)/i);
            const beforeAmd = fileName.slice(0, amdIndex);
            const mcbs = beforeAmd.match(/MCB[0-9A-Z-]*/ig);
            if (mcbs && mcbs.length) {
                reportNo = mcbs[mcbs.length - 1]; // last MCB before AMD
            }
        }

        // fallback: find last MCB anywhere in the filename
        if (!reportNo) {
            const allMcbs = fileName.match(/MCB[0-9A-Z-]*/ig);
            if (allMcbs && allMcbs.length) {
                reportNo = allMcbs[allMcbs.length - 1];
            }
        }

        if (!reportNo) return "-";
        return amdMatch ? `${reportNo}-(${amdMatch[1]})` : reportNo;
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
                    <>
                        {/* Top Summary */}
                        <Box
                            sx={{
                                mb: 2,
                                p: 2,
                                borderRadius: 2,
                                gap: 3,
                                display: "flex",
                                backgroundColor: "#f5f5f5",
                            }}
                        >
                            <Typography variant="subtitle1">
                                <strong>Ship Name:</strong> {shipName}
                            </Typography>
                            <Typography variant="subtitle1">
                                <strong>Report Number:</strong> {reportNumber}
                            </Typography>
                            <Typography variant="subtitle1">
                                <strong>Type of Certificate:</strong> {certificateType}
                            </Typography>
                        </Box>

                        {/* Amendments Table */}
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Amended Document</TableCell>
                                        <TableCell>Remarks</TableCell>
                                        <TableCell>Action</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {amendments.map((amd) => {
                                        const rawFileName = amd.amendedDoc?.split("/").pop() || "";
                                        const cleanedName = rawFileName.replace(/\.pdf$/i, ""); // show without .pdf
                                        const displayReportNo = extractReportNumber(rawFileName);

                                        return (
                                            <TableRow key={amd.id}>
                                                <TableCell>{displayReportNo}</TableCell>

                                                <TableCell>{amd.amdRemarks || "-"}</TableCell>

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
                                                    ) : (
                                                        "-"
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>

                            </Table>
                        </TableContainer>


                    </>
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
