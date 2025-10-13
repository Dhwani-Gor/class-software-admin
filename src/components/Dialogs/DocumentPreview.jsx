"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, Box, CircularProgress } from "@mui/material";

const DocumentPreview = ({ open, fileUrl, onClose }) => {
    const [loading, setLoading] = useState(true);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogContent>
                <div style={{ position: "relative", width: "100%", height: "80vh" }}>
                    {!loading ? (
                        <Box
                            style={{
                                position: "absolute",
                                top: "10px",
                                right: "10px",
                                zIndex: 1,
                                backgroundColor: "#4CAF50",
                                color: "white",
                                padding: "10px 16px",
                                border: "none",
                                borderRadius: "4px",
                                textDecoration: "none",
                                fontSize: "14px",
                                cursor: "pointer",
                            }}
                            onClick={onClose}
                        >
                            X
                        </Box>
                    ) : (
                        <Box
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                            height="100%"
                            position="absolute"
                            top={0}
                            left={0}
                            width="100%"
                            zIndex={0}
                            sx={{ backgroundColor: "rgba(255,255,255,0.8)" }}
                        >
                            <CircularProgress />
                        </Box>
                    )}
                    <iframe
                        src={fileUrl}
                        style={{ width: "100%", height: "100%", border: "none" }}
                        title="Document Preview"
                        onLoad={() => setLoading(false)}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DocumentPreview;
