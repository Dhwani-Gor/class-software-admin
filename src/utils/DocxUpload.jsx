import React, { useState, useEffect, useRef } from "react";
import {
    Box,
    FormControl,
    Typography,
    IconButton,
    Stack,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Controller, useController } from "react-hook-form";
import CommonButton from "@/components/CommonButton";

const DocxUpload = ({ control, onPreview }) => {
    const inputRef = useRef(null);
    const [fileName, setFileName] = useState("");

    // Existing file URL from API (edit mode)
    const { field: existingField } = useController({
        name: "checkListDocument",
        control,
    });

    const existingDocument = existingField.value;

    // Extract filename from existing URL
    useEffect(() => {
        if (existingDocument && typeof existingDocument === "string") {
            const name = existingDocument.split("/").pop();
            setFileName(name);
        }
    }, [existingDocument]);

    return (
        <>
            <Typography fontWeight={500} mb={1}>
                Upload Checklist
            </Typography>

            <Controller
                name="checklistFile"
                control={control}
                render={({ field }) => (
                    <FormControl fullWidth>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                border: "1px dashed",
                                borderColor: "grey.600",
                                borderRadius: "8px",
                                p: 2,
                                cursor: "pointer",
                            }}
                            onClick={(e) => {
                                // do NOT open upload when clicking buttons/icons
                                if (e.target.closest("button")) return;
                                inputRef.current?.click();
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const file = e.dataTransfer.files?.[0];
                                if (file) {
                                    field.onChange(file);
                                    setFileName(file.name);
                                }
                            }}
                        >
                            {/* Left Section */}
                            <Stack direction="row" spacing={2} alignItems="center">
                                <CloudUploadIcon />
                                <Typography variant="body2">
                                    {field.value instanceof File
                                        ? field.value.name
                                        : existingDocument
                                            ? fileName
                                            : "Drag file here or click to upload"}
                                </Typography>
                            </Stack>

                            {/* Right Section */}
                            <Stack direction="row" spacing={1} alignItems="center">
                                {(field.value || existingDocument) && (
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();

                                            const url =
                                                field.value instanceof File
                                                    ? URL.createObjectURL(field.value)
                                                    : existingDocument;

                                            onPreview?.(url);
                                        }}
                                    >
                                        <VisibilityIcon />
                                    </IconButton>

                                )}

                                <CommonButton
                                    text="Upload"
                                    variant="contained"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        inputRef.current?.click();
                                    }}
                                    sx={{ borderRadius: "20px", px: 2 }}
                                />
                            </Stack>

                            {/* Hidden Input */}
                            <input
                                ref={inputRef}
                                type="file"
                                hidden
                                accept=".doc,.docx,.pdf"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        field.onChange(file);
                                        setFileName(file.name);
                                    }
                                    e.target.value = "";
                                }}
                            />
                        </Box>
                    </FormControl>
                )}
            />
        </>
    );
};

export default DocxUpload;
