"use client";

import React, { useState, useEffect } from "react";
import { Box, Typography, Select, MenuItem, TextField, IconButton, FormControl } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { TextareaAutosize } from "@mui/material";
import { addAdditionalFields, updateAdditionalFields, fetchAdditionalDetails, fetchJournalList, getAllClients, deleteAdditionalField } from "@/api";
import CommonButton from "@/components/CommonButton";
import { toast } from "react-toastify";

const sections = [
  { key: "coc", label: "Condition of Class", options: ["Hull", "Machinery"] },
  { key: "statutory", label: "Statutory Condition", options: ["Hull", "Machinery"] },
  { key: "memoranda", label: "Memoranda", options: ["Hull", "Machinery"] },
  { key: "additional", label: "Additional Information", options: ["Hull", "Machinery"] },
  { key: "compliance", label: "Compliance to New Regulations", options: ["Hull", "Machinery"] },
];

const actions = ["Recommended", "Deleted", "Amended", "Extended"];

const codePrefixes = {
  coc: { Hull: "H", Machinery: "M" },
  statutory: { Hull: "HS", Machinery: "MS" },
  memoranda: { Hull: "HM", Machinery: "MM" },
  additional: { Hull: "HA", Machinery: "MA" },
  compliance: { Hull: "Z", Machinery: "Z" },
  hull: { Hull: "H", Machinery: "M" },
};

const AdditionalFieldsList = () => {
  const [selectedClient, setSelectedClient] = useState("");
  const [clientsList, setClientsList] = useState([]);
  const [journalList, setJournalList] = useState([]);
  const [sectionsData, setSectionsData] = useState({});
  const [selectedSectionKey, setSelectedSectionKey] = useState("coc");
  const [editingRows, setEditingRows] = useState({});
  const [errorMsg, setErrorMsg] = useState({ client: "", section: "" });

  // Fetch Clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await getAllClients();
        if (res?.status === 200) setClientsList(res.data.data);
      } catch (err) {
        console.error("Error fetching clients:", err);
      }
    };
    fetchClients();
  }, []);

  // Fetch Journals
  useEffect(() => {
    if (!selectedClient) return;
    const fetchJournals = async () => {
      try {
        const res = await fetchJournalList(selectedClient);
        if (res?.status === 200) setJournalList(res.data.data || []);
      } catch (err) {
        console.error("Error fetching journals:", err);
      }
    };
    fetchJournals();
  }, [selectedClient]);

  // Fetch Additional Details
  useEffect(() => {
    if (!selectedClient) return;
    const fetchAdditionalData = async () => {
      try {
        const res = await fetchAdditionalDetails(selectedClient);
        if (res?.status === 200 && Array.isArray(res.data?.data)) {
          const grouped = {};
          res.data.data.forEach((section) => {
            grouped[section.sectionKey] = section.data || [];
          });
          setSectionsData(grouped);
        } else {
          setSectionsData({});
        }
      } catch (err) {
        console.error("Error fetching additional details:", err);
      }
    };
    fetchAdditionalData();
  }, [selectedClient]);

  // Generate Auto Code
  const generateCode = (sectionKey, type, existingRows, isEditing = false, currentCode = "") => {
    if (!type) return "";
    const prefix = codePrefixes[sectionKey]?.[type] || "";
    if (isEditing && currentCode.startsWith(prefix)) return currentCode;
    const filtered = existingRows.filter((r) => r.code?.startsWith(prefix));
    const numbers = filtered.map((r) => parseInt(r.code.replace(prefix, "")) || 0);
    const nextNumber = Math.max(0, ...numbers) + 1;
    return `${prefix}${String(nextNumber).padStart(4, "0")}`;
  };

  const handleEditRow = (sectionKey, row) => {
    // populate dropdown and form for editing
    setSelectedSectionKey(sectionKey);
    setEditingRows((prev) => ({ ...prev, [sectionKey]: row }));
  };

  const handleCancelEdit = (sectionKey) => {
    setEditingRows((prev) => ({ ...prev, [sectionKey]: null }));
  };

  const handleTypeChange = (sectionKey, newType) => {
    const currentRow = editingRows[sectionKey] || {};
    const isEditing = !!currentRow.id;
    const newCode = generateCode(sectionKey, newType, sectionsData[sectionKey] || [], isEditing, currentRow.code);
    setEditingRows((prev) => ({
      ...prev,
      [sectionKey]: { ...currentRow, type: newType, code: newCode },
    }));
  };

  const handleAddOrUpdate = async (sectionKey) => {
    const row = editingRows[sectionKey];
    if (!row || !selectedClient) return;

    const payload = {
      sectionKey,
      clientId: selectedClient,
      data: { ...row, referenceId: row.referenceNo },
    };

    try {
      if (row.id) {
        const res = await updateAdditionalFields(row.id, payload);
        if (res?.data?.message) toast.success(res.data.message);
      } else {
        const res = await addAdditionalFields(payload);
        if (res?.data?.message) toast.success(res.data.message);
      }

      // Refresh data
      const res = await fetchAdditionalDetails(selectedClient);
      if (res?.status === 200 && Array.isArray(res.data?.data)) {
        const grouped = {};
        res.data.data.forEach((section) => {
          grouped[section.sectionKey] = section.data || [];
        });
        setSectionsData(grouped);
      }

      setEditingRows((prev) => ({ ...prev, [sectionKey]: null }));
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const deleteRow = async (sectionKey, rowId) => {
    setSectionsData((prev) => ({
      ...prev,
      [sectionKey]: prev[sectionKey].filter((row) => row.id !== rowId),
    }));
    let res = await deleteAdditionalField(rowId);
    if (res?.data?.message) toast.success(res?.data?.message);
  };

  const handleClientChange = (e) => {
    setSelectedClient(e.target.value);
    setErrorMsg({ client: "", section: "" });
  };

  const section = sections.find((s) => s.key === selectedSectionKey);
  const editingRow = editingRows[section?.key] || {};

  const commonColumns = (sectionKey, editable = true) => [
    { field: "type", headerName: "Type", flex: 1 },
    { field: "code", headerName: "Code", flex: 1 },
    {
      field: "referenceNo",
      headerName: "Reference No",
      flex: 1,
      valueGetter: (params) => {
        const journal = journalList.find((j) => j.id === params);
        return journal ? journal?.journalTypeId : params?.referenceNo;
      },
    },
    { field: "description", headerName: "Description", flex: 2 },
    { field: "remarks", headerName: "Remarks", flex: 2 },
    { field: "dueDate", headerName: "Due Date", flex: 1 },
    { field: "action", headerName: "Action", flex: 1 },
    editable
      ? {
          field: "actions",
          headerName: "Actions",
          flex: 1,
          renderCell: (params) => (
            <Box sx={{ display: "flex", gap: 1 }}>
              <IconButton color="primary" onClick={() => handleEditRow(sectionKey, params.row)}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton color="error" onClick={() => deleteRow(sectionKey, params.row.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ),
        }
      : {},
  ];

  return (
    <Box sx={{ p: 3, bgcolor: "white", borderRadius: 2, boxShadow: 1, mt: 2 }}>
      {/* Client Dropdown */}
      <FormControl fullWidth sx={{ maxWidth: 300 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, fontSize: 16 }}>
          Select Ship
        </Typography>
        <Select value={selectedClient} onChange={handleClientChange} displayEmpty>
          <MenuItem value="">
            <em>Select Ship</em>
          </MenuItem>
          {clientsList.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.shipName}
            </MenuItem>
          ))}
        </Select>
        {errorMsg.client && (
          <Typography variant="caption" color="error">
            {errorMsg.client}
          </Typography>
        )}
      </FormControl>

      {/* Section Dropdown */}
      <Box sx={{ mt: 3 }} fullWidth maxWidth={300}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, fontSize: 16 }}>
          Select Section
        </Typography>
        <Select value={selectedSectionKey} onChange={(e) => setSelectedSectionKey(e.target.value)} fullWidth size="small">
          {sections.map((s) => (
            <MenuItem key={s.key} value={s.key}>
              {s.label}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {section && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: "primary.main" }}>
            {section.label}
          </Typography>

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

              <TextField label="Reference No" value={editingRow?.referenceNo || ""} onChange={(e) => setEditingRows((prev) => ({ ...prev, [section.key]: { ...prev[section.key], referenceNo: e.target.value } }))} select fullWidth size="small">
                {journalList.length > 0 ? (
                  journalList.map((journal) => (
                    <MenuItem key={journal.id} value={journal.id}>
                      {journal.journalTypeId}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No Journals Found</MenuItem>
                )}
              </TextField>

              <TextField label="Action" value={editingRow?.action || ""} onChange={(e) => setEditingRows((prev) => ({ ...prev, [section.key]: { ...prev[section.key], action: e.target.value } }))} select fullWidth size="small">
                {actions.map((a) => (
                  <MenuItem key={a} value={a}>
                    {a}
                  </MenuItem>
                ))}
              </TextField>

              <TextField label="Due Date" type="date" value={editingRow?.dueDate || ""} onChange={(e) => setEditingRows((prev) => ({ ...prev, [section.key]: { ...prev[section.key], dueDate: e.target.value } }))} fullWidth size="small" InputLabelProps={{ shrink: true }} />
            </Box>

            {/* Description */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                Description
              </Typography>
              <TextareaAutosize minRows={3} value={editingRow?.description || ""} onChange={(e) => setEditingRows((prev) => ({ ...prev, [section.key]: { ...prev[section.key], description: e.target.value } }))} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "14px", fontFamily: "inherit", resize: "vertical" }} />
            </Box>

            {/* Remarks */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                Remarks
              </Typography>
              <TextareaAutosize minRows={3} value={editingRow?.remarks || ""} onChange={(e) => setEditingRows((prev) => ({ ...prev, [section.key]: { ...prev[section.key], remarks: e.target.value } }))} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "14px", fontFamily: "inherit", resize: "vertical" }} />
            </Box>

            {/* Save / Cancel */}
            <Box sx={{ mt: 2, display: "flex", gap: 1, justifyContent: "flex-end" }}>
              <CommonButton variant="contained" disabled={!selectedClient} onClick={() => handleAddOrUpdate(section.key)} text={editingRow?.id ? "Update" : "Save"} />
              <CommonButton variant="outlined" onClick={() => handleCancelEdit(section.key)} text="Cancel" />
            </Box>
          </Box>
        </Box>
      )}

      {/* All Sections Listing */}
      {selectedClient && (
        <Box sx={{ mt: 6 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: "primary.main" }}>
            All Sections
          </Typography>

          {sections.map((s) => {
            const rows = sectionsData[s.key] || [];
            return (
              <Box key={s.key} sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                  {s.label}
                </Typography>
                <DataGrid rows={rows} columns={commonColumns(s.key, journalList)} getRowId={(row) => row.id} autoHeight={false} hideFooter pageSize={10} rowsPerPageOptions={[10]} sx={{ bgcolor: "white", borderRadius: 2, maxHeight: 400, overflowY: "auto" }} />
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default AdditionalFieldsList;
