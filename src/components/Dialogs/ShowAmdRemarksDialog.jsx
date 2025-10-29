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
import { useAuth } from "@/hooks/useAuth";
import DocumentPreview from "./DocumentPreview";

const ShowAmdRemarksDialog = ({ open, onClose, reportDetailId, selectedFilter, hasArchivePermission }) => {
    const { data } = useAuth();
    const [amendments, setAmendments] = useState([]);
    const [loading, setLoading] = useState(false);
    console.log(selectedFilter, "selected filter")

    // State for preview
    const [openPreviewModal, setOpenPreviewModal] = useState(false);
    const [previewFile, setPreviewFile] = useState("");

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

    const handleView = (documentUrl) => {
        if (!documentUrl) return;
        const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(documentUrl)}&embedded=true`;
        setPreviewFile(viewerUrl);
        setOpenPreviewModal(true);
    };

    const handleDownload = async (doc) => {
        if (!doc) return;
        try {
            const response = await fetch(doc, { mode: "cors" });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = doc.split("/").pop();
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download failed:", err);
        }
    };


    const first = amendments[0];
    const shipName = first?.reportDetail?.activity?.journal?.client?.shipName || "-";
    const surveyType = first?.reportDetail?.activity?.surveyTypes?.name || "-";

    let certificateType = "-";
    const firstDoc = first?.amendedDoc || "";
    if (firstDoc.toLowerCase().includes("full_term")) {
        certificateType = "Full Term";
    } else if (firstDoc.toLowerCase().includes("short_term")) {
        certificateType = "Short Term";
    } else if (firstDoc.toLowerCase().includes("interim")) {
        certificateType = "Interim";
    }

    const extractReportNumber = (fileNameRaw) => {
        if (!fileNameRaw) return "-";
        const fileName = fileNameRaw.split("/").pop().replace(/\.pdf$/i, "");

        const amdMatch = fileName.match(/AMD\((\d+)\)/i);
        let reportNo = null;

        if (amdMatch) {
            const amdIndex = fileName.search(/AMD\(\d+\)/i);
            const beforeAmd = fileName.slice(0, amdIndex);
            const mcbs = beforeAmd.match(/MCB[0-9A-Z-]*/ig);
            if (mcbs && mcbs.length) {
                reportNo = `${mcbs[mcbs.length - 1]}-AMD`;
            }
        }

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
        <>
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
                                    <strong>Type of Certificate:</strong> {certificateType}
                                </Typography>
                                <Typography variant="subtitle1">
                                    <strong>Survey Type</strong> {surveyType}
                                </Typography>
                            </Box>

                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Amended Document</TableCell>
                                            {data.specialPermission?.includes("ShowAmedmentRemark") && <TableCell>Remarks</TableCell>}
                                            <TableCell>Action</TableCell>
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {amendments.map((amd) => {
                                            const rawFileName = amd.amendedDoc?.split("/").pop() || "";
                                            const displayReportNo = extractReportNumber(rawFileName);

                                            return (
                                                <TableRow key={amd.id}>
                                                    <TableCell>{displayReportNo}</TableCell>

                                                    {data.specialPermission?.includes("ShowAmedmentRemark") && <TableCell>{amd.amdRemarks || "-"}</TableCell>}

                                                    <TableCell>
                                                        {amd.amendedDoc ? (
                                                            <Stack direction="row" spacing={1}>
                                                                <Tooltip title="View Document">
                                                                    <IconButton color="info" onClick={() => handleView(amd.amendedDoc)}>
                                                                        <VisibilityIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                {selectedFilter === "Archive Documents" &&
                                                                    data.specialPermission.includes("Archive Document") && (
                                                                        <Tooltip title="Delete Document">
                                                                            <IconButton color="error" onClick={() => handleDelete(amd.id)}>
                                                                                <DeleteIcon />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    )}

                                                                {((hasArchivePermission && selectedFilter === "Archive Documents") ||
                                                                    (!hasArchivePermission && selectedFilter === "Certificates") ||
                                                                    (selectedFilter !== "Archive Documents" && selectedFilter === "Certificates")) && (

                                                                        <Tooltip title="Download Document">
                                                                            <IconButton
                                                                                color="success"
                                                                                onClick={() => handleDownload(amd.amendedDoc)}
                                                                                disabled={!amd.amendedDoc}
                                                                            >
                                                                                <GetAppIcon />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    )}

                                                            </Stack>
                                                        ) : "-"}
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

            <DocumentPreview
                open={openPreviewModal}
                fileUrl={previewFile}
                onClose={() => setOpenPreviewModal(false)}
            />
        </>
    );
};

export default ShowAmdRemarksDialog;
