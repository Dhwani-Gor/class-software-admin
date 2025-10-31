import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    RadioGroup,
    FormControlLabel,
    Radio,
    Button,
} from "@mui/material";

const JournalConfirmationDialog = ({
    open,
    oldJournal,
    newJournal,
    journalChoice,
    onChoiceChange,
    onCancel,
    onClick,
    setIsHistory
}) => {


    return (
        <Dialog open={open} onClose={onCancel} sx={{
            "& .MuiDialog-paper": {
                width: 500,
                maxWidth: "90%",
                p: 2,
                borderRadius: 2,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
            },
        }} maxWidth="md">
            <DialogTitle>Confirm Journal Update</DialogTitle>

            <DialogContent>
                <Typography>
                    This entry was part of Journal{" "}
                    <strong>{oldJournal || "N/A"}</strong>. <br />
                    Are you sure this is a follow-up in{" "}
                    <strong>{newJournal || "N/A"}</strong>, or are you correcting a mistake?
                </Typography>

                <RadioGroup
                    value={journalChoice}
                    onChange={(e) => {
                        onChoiceChange(e.target.value);
                        console.log('Selected choice:', e.target.value);
                        if (e.target.value === "correct") {
                            setIsHistory(false)
                        }
                        else if (e.target.value === "followup") {
                            setIsHistory(true)
                        }
                    }}
                    sx={{ mt: 2 }}
                >
                    <FormControlLabel
                        value="correct"
                        control={<Radio />}
                        label="Edit existing entry (Correct mistake)"
                    />
                    <FormControlLabel
                        value="followup"
                        control={<Radio />}
                        label="Record follow-up / update in next journal"
                    />
                </RadioGroup>
            </DialogContent>

            <DialogActions>
                <Button onClick={onCancel}>Cancel</Button>
                <Button variant="contained" onClick={onClick}>
                    Confirm
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default JournalConfirmationDialog;
