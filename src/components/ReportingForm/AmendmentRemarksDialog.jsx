import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";

const AmendmentRemarksDialog = ({ open, onClose, onSubmit, isLoading }) => {
    const [selectedReason, setSelectedReason] = useState("");
    const [customReason, setCustomReason] = useState("");

    const amendmentReasons = [
        { value: "inadvertent_error", label: "Inadvertent error" },
        { value: "error_by_client", label: "Error pointed out by client" },
        { value: "error_by_authorities", label: "Error pointed out by authorities" },
        { value: "others", label: "Others" },
    ];

    const handleReasonChange = (event) => {
        setSelectedReason(event.target.value);
        if (event.target.value !== "others") {
            setCustomReason("");
        }
    };

    const handleSubmit = () => {
        if (!selectedReason) {
            return;
        }

        if (selectedReason === "others" && !customReason.trim()) {
            return;
        }

        let amendmentRemark = "";

        if (selectedReason === "others") {
            amendmentRemark = customReason.trim();
        } else {
            const selectedOption = amendmentReasons.find(r => r.value === selectedReason);
            amendmentRemark = selectedOption?.label || "";
        }

        onSubmit(amendmentRemark);

        // Reset form
        setSelectedReason("");
        setCustomReason("");
    };

    const handleClose = () => {
        setSelectedReason("");
        setCustomReason("");
        onClose();
    };

    const isSubmitDisabled =
        !selectedReason ||
        (selectedReason === "others" && !customReason.trim()) ||
        isLoading;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>Amendment Reason</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Please select the reason for unarchiving this document:
                    </Typography>

                    <FormControl component="fieldset" fullWidth>
                        <RadioGroup
                            value={selectedReason}
                            onChange={handleReasonChange}
                        >
                            {amendmentReasons.map((reason) => (
                                <FormControlLabel
                                    key={reason.value}
                                    value={reason.value}
                                    control={<Radio />}
                                    label={reason.label}
                                />
                            ))}
                        </RadioGroup>
                    </FormControl>

                    {selectedReason === "others" && (
                        <Box sx={{ mt: 2 }}>
                            <TextField
                                fullWidth
                                label="Enter reason"
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                variant="outlined"
                                sx={{ mt: 2 }}
                            />
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={isLoading}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
                    {isLoading ? <CircularProgress size={20} color="inherit" /> : "Submit"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AmendmentRemarksDialog;
