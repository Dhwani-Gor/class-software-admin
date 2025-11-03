import CommonButton from "../CommonButton";
import { Typography } from "@mui/material";
import { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    RadioGroup,
    FormControlLabel,
    Radio,
} from "@mui/material";

const AdditionalFieldDialog = ({ open, oldJournal, newJournal, onClose, onConfirm }) => {
    const [isHistory, setIsHistory] = useState(false);

    const isRefChanged = newJournal && newJournal !== oldJournal;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 600, fontSize: "18px" }}>
                Confirm Update
            </DialogTitle>
            <DialogContent>
                <Typography sx={{ mb: 2, fontSize: "15px" }}>
                    This entry was part of Journal <b>{oldJournal}</b>.
                    {isRefChanged ? (
                        <>
                            {" "}
                            Are you sure this is a follow-up in <b>{newJournal}</b>, or are you
                            correcting a mistake?
                        </>
                    ) : (
                        " Are you correcting a mistake?"
                    )}
                </Typography>

                <RadioGroup
                    value={isHistory ? "followup" : "edit"}
                    onChange={(e) => setIsHistory(e.target.value === "followup")}
                >
                    <FormControlLabel
                        value="edit"
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
                <CommonButton variant="outlined" onClick={onClose} text="Cancel" />
                <CommonButton
                    variant="contained"
                    onClick={() => onConfirm(isHistory)}
                    text="Proceed"
                />
            </DialogActions>
        </Dialog>
    );
};
export default AdditionalFieldDialog;