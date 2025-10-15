import React from "react";
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Button,
    Box,
    Typography,
    Paper,
    Chip,
} from "@mui/material";
import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
} from "@mui/lab";
import { Person, Sailing } from "@mui/icons-material";
import moment from "moment";

const ArchiveTrail = ({ archiveHistory, shipName, username }) => {
    return (
        <Timeline position="right" sx={{ p: 0 }}>
            {archiveHistory.map((remark, index) => (
                <TimelineItem
                    key={remark.id || index}
                    sx={{
                        "&::before": { content: "none" },
                        py: 0,
                    }}
                >
                    <TimelineSeparator>
                        <TimelineDot color="primary" />
                        {index < archiveHistory.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>

                    <TimelineContent sx={{ py: 1, px: 2 }}>
                        <Paper elevation={1} sx={{ p: 2 }}>
                            {/* Header: Username + Ship */}
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    mb: 1.5,
                                }}
                            >
                                {/* Username */}
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <Person fontSize="small" sx={{ color: "text.secondary" }} />
                                    <Typography variant="body2" color="text.secondary">
                                        {username || "-"}
                                    </Typography>
                                </Box>

                                {/* Ship name + icon */}
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <Sailing fontSize="small" sx={{ color: "text.secondary" }} />
                                    <Typography variant="body2" color="text.secondary">
                                        {shipName || "-"}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Remark text */}
                            <Typography variant="body1" sx={{ fontWeight: 600, mb: 1.5 }}>
                                {remark.remark || "-"}
                            </Typography>

                            {/* Chips: Type & Date */}
                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                                <Chip
                                    label={remark.journalTypeId || "-"}
                                    size="small"
                                    sx={{
                                        bgcolor: "#E3F2FD",
                                        color: "#1976D2",
                                        border: "1px solid #BBDEFB",
                                    }}
                                />
                                <Chip
                                    label={moment(remark.createdAt).format("DD MMM YYYY, HH:mm")}
                                    size="small"
                                    sx={{
                                        bgcolor: "#F3E5F5",
                                        color: "#6A1B9A",
                                        border: "1px solid #E1BEE7",
                                    }}
                                />
                            </Box>
                        </Paper>
                    </TimelineContent>
                </TimelineItem>
            ))}
        </Timeline>

    );
};

const ArchiveHistoryDialog = ({ open, archiveHistory = [], onClose, shipName, username }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    maxHeight: "80vh",
                    width: "1000px",
                },
            }}
        >
            <DialogTitle>Archive Remarks History</DialogTitle>
            <DialogContent dividers sx={{ overflowY: "auto" }}>
                {archiveHistory.length > 0 ? (
                    <Box sx={{ maxWidth: "700px", mx: "auto", p: 1 }}>
                        <ArchiveTrail archiveHistory={archiveHistory} shipName={shipName} username={username} />
                    </Box>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        No remarks history found.
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ArchiveHistoryDialog;
