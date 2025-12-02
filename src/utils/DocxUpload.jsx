import React, { useState, useEffect, useRef } from "react";
import { Box, FormControl, Typography, IconButton } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Controller, useController } from "react-hook-form";
import CommonButton from "@/components/CommonButton";

const DocxUpload = ({ control }) => {
    const inputRef = useRef();

    // This retrieves existing file URL from API
    const { field: existingField } = useController({
        name: "checkListDocument",
        control,
    });

    const existingDocument = existingField.value;

    const [fileName, setFileName] = useState("");

    // Extract file name from existing file URL
    useEffect(() => {
        if (existingDocument && typeof existingDocument === "string") {
            const last = existingDocument.split("/").pop();
            setFileName(last);
        }
    }, [existingDocument]);

    return (
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
                            border: "1px solid",
                            borderColor: "grey.600",
                            borderRadius: "8px",
                            p: 2,
                            cursor: "pointer",
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            const file = e.dataTransfer.files[0];
                            if (file) {
                                setFileName(file.name);
                                field.onChange(file);
                            }
                        }}
                        onClick={() => inputRef.current.click()}
                    >
                        {/* Left Section */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <CloudUploadIcon />
                            <Typography variant="body2">
                                {field.value instanceof File
                                    ? field.value.name
                                    : existingDocument
                                        ? `Existing: ${fileName}`
                                        : "Drag file or browse to upload"}
                            </Typography>
                        </Box>

                        {/* Right Section */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {(field.value || existingDocument) && (
                                <IconButton
                                    color="primary"
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();

                                        const url =
                                            field.value instanceof File
                                                ? URL.createObjectURL(field.value)
                                                : existingDocument;

                                        window.open(url, "_blank");
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
                                    inputRef.current.click();
                                }}
                                sx={{ borderRadius: "20px", px: 2, py: 1 }}
                            />
                        </Box>

                        <input
                            ref={inputRef}
                            type="file"
                            hidden
                            accept=".doc,.docx,.pdf"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    setFileName(file.name);
                                    field.onChange(file);
                                }
                                e.target.value = "";
                            }}
                        />
                    </Box>
                </FormControl>
            )}
        />
    );
};

export default DocxUpload;
