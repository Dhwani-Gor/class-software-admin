import React, { useState } from "react";
import {
    Dialog,
    Box,
    Typography,
    TextField,
    Button,
    Chip,
    Stack,
    IconButton,
    CircularProgress,
    Alert,
    Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import JSZip from "jszip";
import { sendEmail } from "@/api";

const SendEmailDialog = ({ open, onClose, selectedItems, allItems, zipType }) => {
    const [recipients, setRecipients] = useState([]);
    const [currentEmail, setCurrentEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleAddRecipient = () => {
        const email = currentEmail.trim();
        if (!email) return;

        if (!validateEmail(email)) return setError("Please enter a valid email address");
        if (recipients.includes(email)) return setError("This email is already added");

        setRecipients([...recipients, email]);
        setCurrentEmail("");
        setError("");
    };

    const handleSendEmail = async () => {
        if (recipients.length === 0) return setError("Please add at least one recipient");
        if (!subject.trim()) return setError("Please enter a subject");
        if (!message.trim()) return setError("Please enter a message");

        setSending(true);
        setError("");

        try {
            const zip = new JSZip();
            const folderName = zipType === "reports" ? "MCBG Reports" : "MCBG Certificates";
            const folder = zip.folder(folderName);

            const itemsToZip =
                selectedItems.length > 0
                    ? allItems.filter((item) => selectedItems.includes(item.id))
                    : allItems;

            await Promise.all(
                itemsToZip.map(async (item) => {
                    if (!item.generatedDoc) return;
                    const res = await fetch(item.generatedDoc);
                    const blob = await res.blob();
                    const fileName = item.generatedDoc.split("/").pop();
                    folder.file(fileName, blob);
                })
            );

            const zipBlob = await zip.generateAsync({ type: "blob" });

            const formData = new FormData();
            formData.append("recipientEmails", JSON.stringify(recipients));
            formData.append("subject", subject);
            formData.append("message", message);
            formData.append("zipType", zipType);
            formData.append("zipFile", zipBlob, `${folderName}.zip`);

            const response = await sendEmail(formData);
            if (!response.ok) throw new Error("Failed to send email");

            setSuccess(true);
            setTimeout(() => handleClose(), 2000);
        } catch (err) {
            setError(err.message || "Failed to send email. Please try again.");
        } finally {
            setSending(false);
        }
    };

    const handleClose = () => {
        setRecipients([]);
        setCurrentEmail("");
        setSubject("");
        setMessage("");
        setError("");
        setSuccess(false);
        setSending(false);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    backgroundColor: "#2b2b2b",
                    color: "#fff",
                    borderRadius: "10px",
                },
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    px: 3,
                    py: 2,
                    borderBottom: "1px solid #3a3a3a",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Typography variant="h6" fontWeight={600}>
                    Compose Email
                </Typography>
                <IconButton onClick={handleClose} sx={{ color: "#fff" }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* Content */}
            <Box sx={{ px: 3, py: 2 }}>
                <Stack spacing={3}>

                    {/* Recipients */}
                    <Box>
                        <Typography sx={{ color: "#ccc", mb: 1 }}>To</Typography>

                        <Stack direction="row" spacing={1} mb={1}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Enter email"
                                value={currentEmail}
                                onChange={(e) => setCurrentEmail(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddRecipient()}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        bgcolor: "#1e1e1e",
                                        color: "#fff",
                                        "& fieldset": { borderColor: "#555" },
                                        "&:hover fieldset": { borderColor: "#777" },
                                    },
                                }}
                            />
                            <Button
                                variant="contained"
                                onClick={handleAddRecipient}
                                startIcon={<AddIcon />}
                            >
                                Add
                            </Button>
                        </Stack>

                        <Stack direction="row" spacing={1} flexWrap="wrap">
                            {recipients.map((email, i) => (
                                <Chip
                                    key={i}
                                    label={email}
                                    onDelete={() =>
                                        setRecipients(recipients.filter((e) => e !== email))
                                    }
                                    sx={{
                                        bgcolor: "#414141",
                                        color: "#fff",
                                        border: "1px solid #6f6f6f",
                                    }}
                                />
                            ))}
                        </Stack>
                    </Box>

                    {/* Subject */}
                    <Box>
                        <Typography sx={{ color: "#ccc", mb: 1 }}>Subject</Typography>
                        <TextField
                            fullWidth
                            size="small"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    bgcolor: "#1e1e1e",
                                    color: "#fff",
                                    "& fieldset": { borderColor: "#555" },
                                    "&:hover fieldset": { borderColor: "#777" },
                                },
                            }}
                        />
                    </Box>

                    {/* Message */}
                    <Box>
                        <Typography sx={{ color: "#ccc", mb: 1 }}>Message</Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={8}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    bgcolor: "#1e1e1e",
                                    color: "#fff",
                                    "& fieldset": { borderColor: "#555" },
                                    "&:hover fieldset": { borderColor: "#777" },
                                },
                            }}
                        />
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ bgcolor: "#5c1a1a", color: "#fff" }}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ bgcolor: "#1a5c2a", color: "#fff" }}>
                            Email sent successfully!
                        </Alert>
                    )}

                    {/* Attachments */}
                    <Box sx={{ mt: 2, p: 2, borderTop: "1px solid #444" }}>
                        <Typography
                            sx={{
                                color: "#7dc8ff",
                                textDecoration: "underline",
                                cursor: "pointer",
                                mb: 1,
                            }}
                        >
                            Request for Quotation – P00015.pdf
                        </Typography>

                        <IconButton sx={{ color: "#fff" }}>
                            <DeleteOutlineIcon />
                        </IconButton>
                    </Box>
                </Stack>
            </Box>

            {/* Footer */}
            <Box
                sx={{
                    px: 3,
                    py: 2,
                    borderTop: "1px solid #3a3a3a",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Button
                    variant="contained"
                    onClick={handleSendEmail}
                    disabled={sending}
                    startIcon={sending && <CircularProgress size={18} />}
                >
                    {sending ? "Sending..." : "Send"}
                </Button>

                <Stack direction="row" spacing={2}>
                    <Button
                        variant="outlined"
                        sx={{ borderColor: "#666", color: "#ccc" }}
                        onClick={handleClose}
                    >
                        Discard
                    </Button>

                    <IconButton sx={{ color: "#ccc" }}>
                        <AttachFileIcon />
                    </IconButton>
                </Stack>
            </Box>
        </Dialog>
    );
};

export default SendEmailDialog;
