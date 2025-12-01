import React, { useState, useEffect, useRef } from "react";
import { Box, FormControl, Typography, IconButton } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Controller, useController } from "react-hook-form";
import CommonButton from "@/components/CommonButton";

const DocxUpload = ({ control }) => {
    const [fileName, setFileName] = useState("");
    const inputRef = useRef();
    const { field } = useController({ name: "checkListDocument", control });
    const document = field.value;
    console.log(document, 0)
    return (
        <Controller
            name="checklistFile"
            control={control}
            render={({ field }) => {
                // ⭐ Detect existing uploaded file from API
                useEffect(() => {
                    if (field.value && typeof field.value === "string") {
                        const parts = field.value.split("/");
                        setFileName(parts[parts.length - 1]); // extract filename
                    }
                }, [field.value]);

                return (
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
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <CloudUploadIcon />
                                <Typography variant="body2">
                                    {document
                                        ? document instanceof File
                                            ? document.name
                                            : `Existing: ${document.split("/").pop()}`
                                        : "Drag files or browse to upload"}
                                </Typography>
                            </Box>

                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                {fileName && (
                                    <IconButton
                                        color="primary"
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const url =
                                                typeof field.value === "string"
                                                    ? field.value
                                                    : URL.createObjectURL(field.value);
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
                );
            }}
        />
    );
};

export default DocxUpload;
