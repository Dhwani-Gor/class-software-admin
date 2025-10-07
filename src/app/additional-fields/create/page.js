"use client";

import React, { useState, useEffect } from "react";
import { Box, Typography, Select, MenuItem, Button, IconButton, TextField, FormControl } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { addAdditionalFields, getAllClients } from "@/api";
import CommonButton from "@/components/CommonButton";
import { TextareaAutosize } from "@mui/material";
const sections = [
  { key: "coc", label: "Condition of Class", options: ["Hull", "Machinery"] },
  { key: "statutory", label: "Statutory Condition", options: ["Hull", "Machinery"] },
  { key: "memoranda", label: "Memoranda", options: ["Hull", "Machinery"] },
  { key: "additional", label: "Additional Information", options: ["Hull", "Machinery"] },
  { key: "compliance", label: "Compliance to New Regulations", options: ["Hull", "Machinery"] },
];

const actions = ["Recommended", "Deleted", "Amended", "Extended"];

const demoData = {
  clientId: 1,
  sections: [
    {
      sectionKey: "coc",
      data: [
        {
          id: 1,
          type: "Hull",
          code: "H0001",
          referenceNo: "R001",
          description: "Main hull",
          remarks: "No damage",
          action: "Recommended",
          dueDate: "2025-12-01",
        },
      ],
    },
    {
      sectionKey: "statutory",
      data: [
        {
          id: 1759311653689,
          type: "Machinery",
          code: "MS0001",
          referenceNo: "R002",
          description: "rerer",
          remarks: "rewwew",
          action: "Recommended",
          dueDate: "2025-10-28",
        },
      ],
    },
    {
      sectionKey: "memoranda",
      data: [
        {
          id: 1759311672610,
          type: "Machinery",
          code: "MM0001",
          referenceNo: "R002",
          description: "545",
          remarks: "5455",
          action: "Deleted",
          dueDate: "",
        },
      ],
    },
    {
      sectionKey: "additional",
      data: [
        {
          id: 1759311698386,
          type: "Machinery",
          code: "MA0001",
          referenceNo: "R002",
          description: "tr",
          remarks: "tt",
          action: "Recommended",
          dueDate: "2025-10-07",
        },
      ],
    },
    {
      sectionKey: "compliance",
      data: [
        {
          id: 1759311685073,
          type: "Machinery",
          code: "Z0001",
          referenceNo: "R001",
          description: "gt",
          remarks: "ttt",
          action: "Recommended",
          dueDate: "2025-10-28",
        },
      ],
    },
  ],
};

const codePrefixes = {
  coc: { Hull: "H", Machinery: "M" },
  statutory: { Hull: "HS", Machinery: "MS" },
  memoranda: { Hull: "HM", Machinery: "MM" },
  additional: { Hull: "HA", Machinery: "MA" },
  compliance: { Hull: "Z", Machinery: "Z" },
};

const AdditionalFieldsList = () => {
  const [selectedClient, setSelectedClient] = useState();
  const [clientsList, setClientsList] = useState([]);
  const [errorMsg, setErrorMsg] = useState({
    client: "",
    section: "",
  });
  const [sectionsData, setSectionsData] = useState({
    coc: [],
    statutory: [],
    memoranda: [],
    additional: [],
    compliance: [],
  });

  const [payload, setPayload] = useState(null);
  const [selectedSectionKey, setSelectedSectionKey] = useState("coc");

  const [editingRows, setEditingRows] = useState({
    coc: null,
    statutory: null,
    memoranda: null,
    additional: null,
    compliance: null,
  });

  const fetchAllJournals = async () => {
    try {
      const response = await fetchAllJournals(selectedClient);
      console.log("Fetched successfully:", response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchAllJournals();
  }, [selectedClient]);

  const generateCode = (sectionKey, type, existingRows, isEditing = false, currentCode = "") => {
    if (!type) return "";
    const prefix = codePrefixes[sectionKey][type];
    if (isEditing && currentCode.startsWith(prefix)) return currentCode;

    const filtered = existingRows.filter((r) => r.code && r.code.startsWith(prefix));
    const numbers = filtered.map((r) => parseInt(r.code.replace(prefix, "")) || 0);
    const nextNumber = Math.max(0, ...numbers) + 1;
    return `${prefix}${String(nextNumber).padStart(4, "0")}`;
  };

  useEffect(() => {
    const initialData = {};
    demoData.sections.forEach((sec) => {
      initialData[sec.sectionKey] = sec.data;
    });
    setSectionsData(initialData);
    setPayload(demoData);
  }, []);

  const deleteRow = (sectionKey, rowId) => {
    setSectionsData((prev) => ({
      ...prev,
      [sectionKey]: prev[sectionKey].filter((row) => row.id !== rowId),
    }));
  };

  const handleSave = async (sectionKey) => {
    if (!selectedClient) {
      setErrorMsg((prev) => ({ ...prev, client: "Please select a ship" }));
      return;
    }

    if (!sectionKey) {
      setErrorMsg((prev) => ({ ...prev, section: "Please select a section" }));
      return;
    }

    const editingRow = editingRows[sectionKey];

    if (!editingRow || Object.values(editingRow).every((v) => !v)) {
      setErrorMsg((prev) => ({ ...prev, section: "Please fill in all required fields before saving" }));
      return;
    }

    const finalPayload = {
      sectionKey: sectionKey,
      clientId: selectedClient,
      data: editingRow,
    };

    try {
      const res = await addAdditionalFields(finalPayload);
      console.log(res);
      setErrorMsg({ client: "", section: "" });
      // ✅ optionally show inline success message
      setSuccessMsg(`Data saved successfully for ${sectionKey}`);
    } catch (error) {
      console.error(error);
      setErrorMsg((prev) => ({ ...prev, section: "Failed to save section data" }));
    }
  };

  const handleEditRow = (sectionKey, row) => {
    setEditingRows((prev) => ({
      ...prev,
      [sectionKey]: row,
    }));
  };

  const handleCancelEdit = (sectionKey) => {
    setEditingRows((prev) => ({
      ...prev,
      [sectionKey]: null,
    }));
  };

  const handleTypeChange = (sectionKey, newType) => {
    const currentRow = editingRows[sectionKey];
    const isEditing = !!currentRow?.id;
    const currentCode = currentRow?.code || "";

    setEditingRows((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        type: newType,
        code: generateCode(sectionKey, newType, sectionsData[sectionKey], isEditing, currentCode),
      },
    }));
  };

  const fetchClients = async () => {
    try {
      const result = await getAllClients();
      if (result?.status === 200) {
        setClientsList(result.data.data);
      } else {
        toast.error(result?.message);
      }
    } catch (error) {
      toast.error(error?.message || "Failed to fetch clients");
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddOrUpdate = (sectionKey) => {
    let hasError = false;
    if (!selectedClient) {
      setErrorMsg((prev) => ({ ...prev, client: "Please select a ship" }));
      hasError = true;
    }
    if (!sectionKey) {
      setErrorMsg((prev) => ({ ...prev, section: "Please select a section" }));
      hasError = true;
    }
    if (hasError) return;

    const editingRow = editingRows[sectionKey];
    if (!editingRow) return;

    if (editingRow.id) {
      setSectionsData((prev) => ({
        ...prev,
        [sectionKey]: prev[sectionKey].map((row) => (row.id === editingRow.id ? editingRow : row)),
      }));
    } else {
      setSectionsData((prev) => ({
        ...prev,
        [sectionKey]: [...prev[sectionKey], { ...editingRow, id: Date.now() }],
      }));
    }

    handleCancelEdit(sectionKey);
  };

  const handleClientChange = (event) => {
    const selectedId = event.target.value;
    setSelectedClient(selectedId);
    setErrorMsg((prev) => ({ ...prev, client: "" }));
  };

  return (
    <Box>
      <Box sx={{ p: 3, bgcolor: "white", borderRadius: 2, boxShadow: 1, mt: 2 }}>
        <Box>
          <FormControl fullWidth sx={{ maxWidth: 300 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, fontSize: 16 }}>
              Select Ship
            </Typography>
            <Select value={selectedClient || ""} onChange={handleClientChange} displayEmpty>
              <MenuItem value="">
                <em>Select Ship</em>
              </MenuItem>
              {clientsList.map((client) => (
                <MenuItem key={client.id} value={client.id}>
                  {client.shipName}
                </MenuItem>
              ))}
            </Select>
            {errorMsg.client && (
              <Typography variant="caption" color="error">
                {errorMsg.client}
              </Typography>
            )}
          </FormControl>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mt: 3, fontWeight: 600, fontSize: 16 }}>
            Select Section
          </Typography>
          <Select
            value={selectedSectionKey || ""}
            onChange={(e) => {
              setSelectedSectionKey(e.target.value);
              setErrorMsg((prev) => ({ ...prev, section: "" }));
            }}
            fullWidth
            size="small"
          >
            {sections.map((section) => (
              <MenuItem key={section.key} value={section.key}>
                {section.label}
              </MenuItem>
            ))}
          </Select>
          {errorMsg.section && (
            <Typography variant="caption" color="error">
              {errorMsg.section}
            </Typography>
          )}
        </Box>

        {/* Single Section Form */}
        {(() => {
          const section = sections.find((s) => s.key === selectedSectionKey);
          const editingRow = editingRows[section.key];

          return (
            <Box key={section.key} sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: "primary.main" }}>
                {section.label}
              </Typography>

              {/* Form */}
              <Box sx={{ mb: 3, p: 3, border: "1px solid #e0e0e0", borderRadius: 2, bgcolor: "#f9f9f9" }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
                  <TextField label="Type" value={editingRow?.type || ""} onChange={(e) => handleTypeChange(section.key, e.target.value)} select fullWidth size="small">
                    {section.options.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField label="Code" value={editingRow?.code || ""} disabled fullWidth size="small" />

                  <TextField
                    label="Reference No"
                    value={editingRow?.referenceNo || ""}
                    onChange={(e) =>
                      setEditingRows((prev) => ({
                        ...prev,
                        [section.key]: { ...prev[section.key], referenceNo: e.target.value },
                      }))
                    }
                    select
                    fullWidth
                    size="small"
                  >
                    <MenuItem value="R001">R001</MenuItem>
                    <MenuItem value="R002">R002</MenuItem>
                  </TextField>

                  <TextField
                    label="Action"
                    value={editingRow?.action || ""}
                    onChange={(e) =>
                      setEditingRows((prev) => ({
                        ...prev,
                        [section.key]: { ...prev[section.key], action: e.target.value },
                      }))
                    }
                    select
                    fullWidth
                    size="small"
                  >
                    {actions.map((a) => (
                      <MenuItem key={a} value={a}>
                        {a}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    label="Due Date"
                    type="date"
                    value={editingRow?.dueDate || ""}
                    onChange={(e) =>
                      setEditingRows((prev) => ({
                        ...prev,
                        [section.key]: { ...prev[section.key], dueDate: e.target.value },
                      }))
                    }
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                    Description
                  </Typography>
                  <TextareaAutosize
                    minRows={3}
                    value={editingRow?.description || ""}
                    onChange={(e) =>
                      setEditingRows((prev) => ({
                        ...prev,
                        [section.key]: { ...prev[section.key], description: e.target.value },
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      fontSize: "14px",
                      fontFamily: "inherit",
                      resize: "vertical",
                    }}
                  />
                </Box>

                {/* Remarks */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                    Remarks
                  </Typography>
                  <TextareaAutosize
                    minRows={3}
                    value={editingRow?.remarks || ""}
                    onChange={(e) =>
                      setEditingRows((prev) => ({
                        ...prev,
                        [section.key]: { ...prev[section.key], remarks: e.target.value },
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      fontSize: "14px",
                      fontFamily: "inherit",
                      resize: "vertical",
                    }}
                  />
                </Box>

                <Box sx={{ mt: 2, display: "flex", gap: 1, alignItems: "end", justifyContent: "flex-end" }}>
                  <CommonButton
                    variant="contained"
                    disabled={!selectedClient || !selectedSectionKey}
                    onClick={() => {
                      handleAddOrUpdate(section.key);
                      setTimeout(() => handleSave(section.key), 0);
                    }}
                    text={editingRow?.id ? "Update" : "Save"}
                  />

                  <CommonButton variant="outlined" onClick={() => handleCancelEdit(section.key)} text="Cancel" />
                </Box>
              </Box>
            </Box>
          );
        })()}

        {payload && (
          <Box sx={{ mt: 4, p: 3, bgcolor: "#f5f5f5", borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Saved Data (Editable)
            </Typography>

            {payload.sections.map((section) => (
              <Box key={section.sectionKey} sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: "primary.main" }}>
                  {sections.find((s) => s.key === section.sectionKey)?.label || section.sectionKey}
                </Typography>
                <DataGrid
                  rows={sectionsData[section.sectionKey]}
                  columns={[
                    { field: "type", headerName: "Type", flex: 1 },
                    { field: "code", headerName: "Code", flex: 1 },
                    { field: "referenceNo", headerName: "Reference No", flex: 1 },
                    { field: "description", headerName: "Description", flex: 2 },
                    { field: "remarks", headerName: "Remarks", flex: 2 },
                    { field: "action", headerName: "Action", flex: 1 },
                    { field: "dueDate", headerName: "Due Date", flex: 1 },
                    {
                      field: "actions",
                      headerName: "Actions",
                      flex: 1,
                      renderCell: (params) => (
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 1 }}>
                          <IconButton color="primary" size="small" onClick={() => handleEditRow(section.sectionKey, params.row)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton color="error" size="small" onClick={() => deleteRow(section.sectionKey, params.row.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ),
                    },
                  ]}
                  getRowId={(row) => row.id}
                  autoHeight
                  hideFooter
                  sx={{
                    bgcolor: "white",
                    "& .MuiDataGrid-root": {
                      border: "none",
                    },
                    "& .MuiDataGrid-cell": {
                      borderBottom: "1px solid #f0f0f0",
                    },
                    "& .MuiDataGrid-columnHeaders": {
                      backgroundColor: "#f5f5f5",
                      borderBottom: "2px solid #e0e0e0",
                    },
                  }}
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AdditionalFieldsList;
