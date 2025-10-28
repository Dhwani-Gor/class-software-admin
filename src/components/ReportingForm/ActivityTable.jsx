import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import TextareaAutosize from "@mui/material/TextareaAutosize";
import DescriptionIcon from "@mui/icons-material/Description";
import AttachmentIcon from "@mui/icons-material/Attachment";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import CommonCard from "@/components/CommonCard";
import { updateActivityDetails, deleteAttachment } from "@/api";
import { toast } from "react-toastify";

const statusOptions = [
    { value: "Completed", label: "Completed" },
    { value: "Partheld", label: "Part held" },
];

const DocumentUploadDialog = ({
    open,
    onClose,
    onUpload,
    selectedDocuments,
    onRemoveDocument,
    onPreviewDocument,
}) => {
    const [documents, setDocuments] = useState([]);

    const handleFileChange = (event) => {
        if (event.target.files) {
            const newFiles = Array.from(event.target.files);
            const validFiles = newFiles.filter((file) =>
                ["image/jpeg", "image/png", "image/gif", "application/pdf", "video/mp4", "video/mpeg"].includes(file.type)
            );

            if (validFiles.length !== newFiles.length) {
                toast.warning("Some files were skipped due to invalid file type");
            }
            setDocuments((prev) => [...prev, ...validFiles]);
        }
    };

    const handleUpload = () => {
        if (documents.length === 0) {
            toast.warning("Please select at least one file to upload");
            return;
        }

        onUpload(documents);
        setDocuments([]);
        onClose();
    };

    const handleRemoveNewDocument = (index) => {
        setDocuments((prev) => prev.filter((_, i) => i !== index));
    };

    const renderFileIcon = (file) => {
        let fileType;

        if (file?.type) {
            fileType = file.type.split("/")[0];
        } else if (file?.fileType) {
            fileType = file.fileType.split("/")[0];
        } else {
            fileType = "unknown";
        }

        switch (fileType) {
            case "image":
                return "🖼️";
            case "application":
                return "📄";
            case "video":
                return "🎥";
            default:
                return "📁";
        }
    };

    const getFileName = (file) => {
        if (file?.name) {
            return file.name;
        } else if (file?.fileName) {
            return file.fileName;
        }
        return "Unknown file";
    };

    const handleSafeRemoveDocument = (docId) => {
        if (!docId) {
            toast.error("Cannot remove document: Invalid document ID");
            return;
        }

        if (typeof onRemoveDocument === "function") {
            onRemoveDocument(docId);
        } else {
            toast.error("Remove function not available");
        }
    };

    const handleSafePreviewDocument = (doc) => {
        if (!doc) {
            toast.error("Cannot preview document: Invalid document");
            return;
        }

        if (typeof onPreviewDocument === "function") {
            onPreviewDocument(doc);
        } else {
            toast.error("Preview function not available");
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogContent sx={{ minWidth: "50vw" }}>
                <Box>
                    <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/gif,application/pdf,video/mp4,video/mpeg"
                        onChange={handleFileChange}
                        style={{ margin: "16px 0" }}
                    />

                    {documents.length > 0 && (
                        <Box mt={2}>
                            <Typography variant="subtitle1">New Documents:</Typography>
                            {documents.map((file, index) => (
                                <Box key={index} display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                    <Typography>
                                        {renderFileIcon(file)} {getFileName(file)}
                                    </Typography>
                                    <IconButton size="small" onClick={() => handleRemoveNewDocument(index)} color="error">
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            ))}
                        </Box>
                    )}

                    {selectedDocuments && selectedDocuments.length > 0 && (
                        <Box mt={2}>
                            <Typography variant="subtitle1">Existing Documents:</Typography>
                            {selectedDocuments.map((doc) => (
                                <Box key={doc.id} display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                    <Typography>
                                        {renderFileIcon(doc)} {getFileName(doc)}
                                    </Typography>
                                    <Box>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleSafePreviewDocument(doc)}
                                            color="primary"
                                            title="Preview Document"
                                        >
                                            <VisibilityIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleSafeRemoveDocument(doc.id)}
                                            color="error"
                                            title="Delete Document"
                                            disabled={!doc.id}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleUpload} disabled={documents.length === 0}>
                    Upload
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const DocumentPreviewModal = ({ open, onClose, document, loading }) => {
    let fileUrl;
    let fileType;

    const getPreviewContent = () => {
        if (!document) return null;
        fileUrl = document.filePath;
        fileType = document.fileType;
        if (fileType?.startsWith("image/")) {
            return (
                <img
                    src={fileUrl}
                    alt="Document preview"
                    style={{
                        maxWidth: "100%",
                        maxHeight: "70vh",
                        objectFit: "contain",
                    }}
                />
            );
        } else if (fileType === "application/pdf") {
            return (
                <iframe
                    src={`https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`}
                    style={{ width: "100%", height: "70vh", border: "none" }}
                    title="PDF Preview"
                />
            );
        } else if (fileType?.startsWith("video/")) {
            return (
                <video controls style={{ maxWidth: "100%", maxHeight: "70vh" }}>
                    <source src={fileUrl} type={fileType} />
                    Your browser does not support the video tag.
                </video>
            );
        } else {
            return (
                <Box textAlign="center" p={4}>
                    <Typography variant="h6" gutterBottom>
                        Preview not available for this file type
                    </Typography>
                    <Button variant="contained" href={fileUrl} target="_blank" rel="noopener noreferrer">
                        Download File
                    </Button>
                </Box>
            );
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                style: { minHeight: "80vh" },
            }}
        >
            <DialogTitle>Document Preview</DialogTitle>

            <DialogContent>
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                        <CircularProgress />
                    </Box>
                ) : (
                    getPreviewContent()
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const ActivityTable = ({
    tableData,
    setTableData,
    setShowForm,
    setFullScreenRemarksVisible,
    handleReportClick,
    getSurveyTitle,
    journalId,
    getAllActivity,
}) => {
    const { control } = useForm();
    const [documentUploadDialogOpen, setDocumentUploadDialogOpen] = useState(false);
    const [currentRowForDocuments, setCurrentRowForDocuments] = useState(null);
    const [openPreviewModal, setOpenPreviewModal] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [previewDocument, setPreviewDocument] = useState(null);

    const handleStatusChange = async (id, value) => {
        setShowForm(false);
        setTableData((prevData) =>
            prevData.map((item) => (item.id === id ? { ...item, status: value } : item))
        );
        try {
            const response = await updateActivityDetails(id, { status: value });
            if (response?.data?.status === "success") {
                toast.success("Status updated successfully.");
            } else {
                toast.error("Something went wrong! Please try again after some time");
            }
        } catch (error) {
            toast.error("Something went wrong! Please try again after some time");
        }
    };

    const handleRemarksChange = async (id, value) => {
        const row = tableData.find((item) => item.id === id);
        if (row && row.maxLength && value?.length > row.maxLength) {
            return;
        }

        setTableData((prevData) =>
            prevData.map((item) => (item.id === id ? { ...item, remarks: value } : item))
        );
        try {
            const response = await updateActivityDetails(id, { remarks: value });
            if (response?.data?.status === "success") {
                toast.success("Remarks updated successfully.");
            } else {
                toast.error("Something went wrong! Please try again after some time");
            }
        } catch (error) {
            toast.error("Something went wrong! Please try again after some time", error);
        }
    };

    const handleDocumentUpload = async (rowId, documents) => {
        if (!rowId || !documents?.length) return;

        setTableData((prev) =>
            prev.map((item) =>
                item.id === rowId
                    ? {
                        ...item,
                        attachments: item.attachments
                            ? [...item.attachments, ...documents.map((f) => ({ name: f.name, _tmp: true }))]
                            : documents.map((f) => ({ name: f.name, _tmp: true })),
                    }
                    : item
            )
        );

        const formData = new FormData();
        documents.forEach((doc) => formData.append("attachments", doc));

        try {
            const response = await updateActivityDetails(rowId, formData);

            if (response?.data?.status === "success") {
                const serverAttachments = response?.data?.data?.attachments;
                if (Array.isArray(serverAttachments)) {
                    setTableData((prev) =>
                        prev.map((item) => (item.id === rowId ? { ...item, attachments: serverAttachments } : item))
                    );
                }
                await getAllActivity(journalId);
                toast.success("Documents uploaded successfully.");
            } else {
                await getAllActivity(journalId);
                toast.error(response?.data?.message || "Something went wrong! Please try again after some time");
            }
        } catch (err) {
            console.error("Upload error:", err);
            await getAllActivity(journalId);
            toast.error("Upload failed. Please check your internet or file format.");
        }
    };

    const handleRemoveDocument = async (activityId, documentId) => {
        if (!activityId) {
            toast.error("Invalid activity ID");
            return;
        }

        if (!documentId) {
            toast.error("Invalid document ID");
            return;
        }

        const confirmDelete = window.confirm("Are you sure you want to delete this document?");
        if (!confirmDelete) {
            return;
        }

        try {
            const response = await deleteAttachment(activityId, documentId);
            setDocumentUploadDialogOpen(false);
            getAllActivity(journalId);
            if (response?.data?.status === "success") {
                setTableData((prevData) =>
                    prevData.map((item) =>
                        item.id === activityId
                            ? {
                                ...item,
                                attachments: item.attachments ? item.attachments.filter((doc) => doc.id !== documentId) : [],
                            }
                            : item
                    )
                );

                toast.success("Document removed successfully.");
            }
        } catch (error) {
            console.error("Error removing document:", error);
            toast.error("Failed to remove document. Please try again.");
        }
    };

    const handlePreviewDocument = (document) => {
        setPreviewDocument(document);
        setLoadingPreview(true);
        setOpenPreviewModal(true);

        setTimeout(() => {
            setLoadingPreview(false);
        }, 1000);
    };

    const openDocumentUpload = (row) => {
        setCurrentRowForDocuments(row);
        setDocumentUploadDialogOpen(true);
    };

    return (
        <>
            <CommonCard sx={{ mt: 2 }}>
                <TableContainer>
                    <Table sx={{ minWidth: 650 }} aria-label="report details table">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>Activity Name</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>Remarks</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>Attachments</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>Activity Details</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tableData.map((row, index) => {
                                const isArchived = row?.reportDetail?.markAsArchive === true;
                                return (
                                    <TableRow
                                        key={row.id}
                                        sx={{
                                            "&:last-child td, &:last-child th": { border: 0 },
                                            opacity: isArchived ? 0.5 : 1,
                                            pointerEvents: isArchived ? "none" : "auto",
                                        }}
                                    >
                                        <TableCell component="th" scope="row">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell>{getSurveyTitle(row?.surveyTypes?.name || row?.name)}</TableCell>
                                        <TableCell>
                                            <FormControl fullWidth size="small">
                                                <Select
                                                    value={row.status}
                                                    onChange={(e) => handleStatusChange(row.id, e.target.value)}
                                                    displayEmpty
                                                >
                                                    <MenuItem value="" disabled>
                                                        Select Status
                                                    </MenuItem>
                                                    {statusOptions.map((option) => (
                                                        <MenuItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </TableCell>
                                        <TableCell>
                                            <Controller
                                                name={`remarks-${row.id}`}
                                                control={control}
                                                defaultValue={row.remarks}
                                                render={({ field }) => (
                                                    <>
                                                        <TextareaAutosize
                                                            {...field}
                                                            value={row.remarks}
                                                            minRows={2}
                                                            placeholder="Enter Remarks"
                                                            style={{
                                                                width: "100%",
                                                                padding: "8px",
                                                                fontFamily: "inherit",
                                                                fontSize: "inherit",
                                                                border: "1px solid #ccc",
                                                                borderRadius: "4px",
                                                            }}
                                                            onFocus={(event) => {
                                                                event.target.blur();
                                                                setFullScreenRemarksVisible(row);
                                                            }}
                                                            maxLength={row.maxLength || undefined}
                                                            onChange={(e) => {
                                                                field.onChange(e);
                                                                handleRemarksChange(row.id, e.target.value);
                                                            }}
                                                        />
                                                    </>
                                                )}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton
                                                color="primary"
                                                onClick={() => openDocumentUpload(row)}
                                                size="small"
                                                aria-label="upload attachments"
                                            >
                                                <AttachmentIcon />
                                                {row.attachments && row.attachments?.length > 0 && (
                                                    <Typography variant="caption" color="primary" sx={{ marginLeft: 1 }}>
                                                        {row.attachments?.length}
                                                    </Typography>
                                                )}
                                            </IconButton>
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleReportClick(row)}
                                                size="small"
                                                aria-label="view report"
                                            >
                                                <DescriptionIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CommonCard>

            <DocumentUploadDialog
                open={documentUploadDialogOpen}
                onClose={() => setDocumentUploadDialogOpen(false)}
                onUpload={(documents) => {
                    if (currentRowForDocuments) {
                        handleDocumentUpload(currentRowForDocuments.id, documents);
                        getAllActivity(journalId);
                    }
                }}
                selectedDocuments={currentRowForDocuments?.attachments || []}
                onRemoveDocument={(documentId) => {
                    if (currentRowForDocuments) {
                        handleRemoveDocument(currentRowForDocuments.id, documentId);
                    }
                }}
                onPreviewDocument={(document) => {
                    handlePreviewDocument(document);
                }}
            />
            <DocumentPreviewModal
                open={openPreviewModal}
                onClose={() => setOpenPreviewModal(false)}
                document={previewDocument}
                loading={loadingPreview}
            />
        </>
    );
};

export default ActivityTable;