import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextareaAutosize,
} from "@mui/material";
import CommonButton from "../CommonButton";

import { Box, Typography, Paper, Chip } from "@mui/material";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from "@mui/lab";
import { AccessTime, Person, Edit } from "@mui/icons-material";

const AuditTrail = ({ changeHistory }) => {
  // Format date to readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get section title based on change type
  const getSectionTitle = (changeType) => {
    switch (changeType) {
      case "client":
        return "Ship Details";
      case "owner":
        return "Owner Details";
      case "manager":
        return "Manager Details";
      case "invoicing":
        return "Invoicing Details";
      default:
        return "Other Details";
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Timeline position="right" sx={{ p: 0 }}>
        {changeHistory.map((change) => (
          <TimelineItem key={change.id}>
            <TimelineOppositeContent sx={{ flex: 0, p: 0 }} />

            <TimelineSeparator>
              <TimelineDot color="primary" />
              <TimelineConnector />
            </TimelineSeparator>

            <TimelineContent sx={{ py: 1, px: 2, width: "100%" }}>
              <Typography
                variant="body2"
                color="text.secondary"
                display="flex"
                alignItems="center"
              >
                <AccessTime fontSize="small" sx={{ mr: 0.5 }} />
                {formatDate(change.createdAt)}
              </Typography>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Person
                    fontSize="small"
                    sx={{ mr: 1, color: "text.secondary" }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {change.user.name}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Edit
                    fontSize="small"
                    sx={{ mr: 1, color: "primary.main" }}
                  />
                  <Typography variant="subtitle2">
                    {getSectionTitle(change.changeType)} Updated
                  </Typography>
                </Box>

                {Object.keys(change.oldData).map((key) => (
                  <Box key={key} sx={{ mb: 1.5 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: "block",
                        mb: 0.5,
                        textTransform: "capitalize",
                      }}
                    >
                      {key}:
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Chip
                        label={change.oldData[key]}
                        size="small"
                        sx={{
                          bgcolor: "#FFEBEE",
                          color: "#D32F2F",
                          textDecoration: "line-through",
                          border: "1px solid #FFCDD2",
                        }}
                      />
                      <Chip
                        label={change.newData[key]}
                        size="small"
                        sx={{
                          bgcolor: "#E8F5E9",
                          color: "#2E7D32",
                          border: "1px solid #C8E6C9",
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Paper>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </Box>
  );
};

const EditHistoryDialog = ({
  open,
  changeHistory = [],
  onCancel,
  onConfirm,
}) => {
  const [value, setValue] = useState("");

  // Update local state when dialog opens with new remarks
  useEffect(() => {
    if (open && typeof open === "object") {
      setValue(open.remarks || "");
    }
  }, [open]);

  return (
    <Dialog open={Boolean(open)} onClose={onCancel}>
      <DialogTitle fontWeight={"600"}>Edit History</DialogTitle>
      <DialogContent sx={{ minWidth: "35vw" }}>
        {changeHistory.length ? (
          <AuditTrail changeHistory={changeHistory} />
        ) : (
          <Typography>No History Found</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <CommonButton text="Close" variant="outlined" onClick={onCancel} />
      </DialogActions>
    </Dialog>
  );
};

export default EditHistoryDialog;
