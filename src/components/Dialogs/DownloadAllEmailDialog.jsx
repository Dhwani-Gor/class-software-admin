import React, { useEffect, useState } from "react";
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
    TextareaAutosize,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import JSZip from "jszip";
import { sendEmail } from "@/api";
import { toast } from "react-toastify"
import CommonButton from "../CommonButton";
import { useAuth } from "@/hooks/useAuth";

const SendEmailDialog = ({ open, onClose, selectedItems, allItems, zipType, createdUserEmail }) => {
    const shipName = [
        ...new Set(
            selectedItems?.map(
                (item) => item?.activity?.journal?.client?.shipName
            )
        )
    ].join(", ");

    const messageText = `Dear User,
 
    The updated certificates for vessel ${shipName} are now available for download.

    Please find the zip file attached/provided.
    
    For access to the certificate from the software, please use the following link:
    https://gambiaclass.org/login
    
    Kind regards,
    Marine Assure Team`;
    ;

    const [recipients, setRecipients] = useState([]);
    const [currentEmail, setCurrentEmail] = useState("");
    const [subject, setSubject] = useState("")
    const [message, setMessage] = useState(messageText);
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const { data } = useAuth();

    React.useEffect(() => {
        if (open && data?.email) {
            const defaultRecipients = [data.email, createdUserEmail];
            setRecipients(defaultRecipients);
            setMessage(messageText);
        }
    }, [open]);

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleAddRecipient = () => {
        const email = currentEmail.trim();
        if (!email) return;

        if (!validateEmail(email)) return setError("Please enter a valid email address");
        if (recipients.includes(email)) return setError("This email is already added");
        setRecipients(data.email);
        setRecipients([...recipients, email]);
        setCurrentEmail("");
        setError("");
    };

    const handleSendEmail = async () => {
        if (recipients.length === 0)
            return setError("Please add at least one recipient");
        if (!message.trim())
            return setError("Please enter a message");

        setSending(true);
        setError("");

        try {
            const zip = new JSZip();
            const folderName = zipType === "reports" ? "MCBG Reports" : "MCBG Certificates";
            const folder = zip.folder(folderName);

            const selectedIds = selectedItems.map((s) => String(s.id));
            const itemsToZip =
                selectedIds.length > 0
                    ? allItems?.filter((item) => selectedIds.includes(String(item.id)))
                    : allItems;

            await Promise.all(
                itemsToZip?.map(async (item) => {
                    if (!item.generatedDoc) return;
                    const res = await fetch(item.generatedDoc);
                    const blob = await res.blob();
                    const fileName = item.generatedDoc.split("/").pop();
                    folder.file(fileName, blob);
                })
            );

            const zipBlob = await zip.generateAsync({ type: "blob" });

            const formData = new FormData();
            formData.append("recipientEmails", recipients);
            formData.append("subject", subject);
            formData.append("message", message);
            formData.append("zipType", zipType);
            formData.append("zipFile", zipBlob, `${folderName}.zip`);

            const response = await sendEmail(formData);

            if (response?.data?.status === "success") {
                toast.success(response?.data?.message);
                onClose();
            } else {
                toast.error(response?.response?.data?.message);
                onClose();
            }
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

        >
            {/* Header */}
            <Box
                sx={{
                    px: 3,
                    py: 2,
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

                        <Stack direction="row" spacing={1} mb={1}>
                            <Typography>To</Typography>

                            {recipients
                                .filter((email) => email && email.trim() !== "")
                                .map((email, i) => (
                                    <Chip
                                        key={i}
                                        label={email}
                                        onDelete={() =>
                                            setRecipients((prev) => prev.filter((e) => e !== email))
                                        }
                                        sx={{
                                            bgcolor: "#1976d2",
                                            color: "#fff",
                                        }}
                                    />
                                ))}

                            <TextField
                                fullWidth
                                variant="standard"
                                size="small"
                                placeholder="Enter email"
                                value={currentEmail}
                                onChange={(e) => setCurrentEmail(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddRecipient()}
                                sx={{
                                    "& .MuiInput-underline:before": { borderBottom: "none" },
                                    "& .MuiInput-underline:after": { borderBottom: "none" },
                                    "& .MuiInput-underline:hover:before": { borderBottom: "none" },
                                    "& .MuiInput-underline:hover:after": { borderBottom: "none" },
                                }}
                            />

                        </Stack>
                    </Box>

                    {/* Subject */}
                    <Stack direction="row" spacing={1} mb={1}>
                        <Typography>Subject</Typography>
                        <TextField
                            fullWidth
                            variant="standard"
                            size="small"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            sx={{
                                "& .MuiInput-underline:before": { borderBottom: "none" },
                                "& .MuiInput-underline:after": { borderBottom: "none" },
                                "& .MuiInput-underline:hover:before": { borderBottom: "none" },
                                "& .MuiInput-underline:hover:after": { borderBottom: "none" },
                            }}
                        />
                    </Stack>

                    {/* Message */}
                    <Box>
                        {/* <Typography sx={{ color: "#ccc", mb: 1 }}>Message</Typography> */}
                        <TextareaAutosize
                            name="message"
                            minRows={8}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "12px",
                                border: "none",
                                maxHeight: "270px",
                                outline: "none",
                                backgroundColor: "transparent",
                                fontSize: "14px",
                                fontFamily: "inherit",
                                resize: "vertical"
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
                    <Box sx={{ mt: 2, p: 2 }}>
                        <Typography
                            sx={{
                                textDecoration: "underline",
                                mb: 1,
                            }}
                        >
                            {zipType === "reports" ? "MCBG Reports.zip" : "MCBG Certificates.zip"}
                        </Typography>
                    </Box>
                </Stack>
            </Box>

            {/* Footer */}
            <Box
                sx={{
                    px: 3,
                    py: 2,
                    display: "flex",
                    justifyContent: "end",
                    alignItems: "center",
                }}
            >
                <Stack direction="row" spacing={2}>


                    <CommonButton
                        variant="outlined"
                        onClick={handleClose}
                        text="Discard"
                    />
                    <CommonButton
                        variant="contained"
                        onClick={handleSendEmail}
                        disabled={sending}
                        startIcon={sending && <CircularProgress size={18} />}
                        text={sending ? "Sending..." : "Send"}
                    />

                </Stack>
            </Box>
        </Dialog>
    );
};

export default SendEmailDialog;
