"use client";
import React, { useEffect, useState } from "react";
import { Box, Grid, TextField, Select, MenuItem, Button, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const sectionsConfig = {
  coc: ["Hull", "Machinery"],
  statutory: ["Hull", "Machinery"],
  memoranda: ["Hull", "Machinery"],
  additional: ["Hull", "Machinery"],
  compliance: ["Hull", "Machinery"],
};

const actionsList = ["Recommended", "Deleted", "Amended", "Extended"];

const AdditionalFieldsForm = ({ sectionKey, data = [], editRowId = null, onDataChange }) => {
  const [rows, setRows] = useState([]);

  useEffect(() => setRows(data), [data]);

  const addRow = () => {
    const newRow = {
      id: Date.now(), // <- unique id
      type: "",
      code: "",
      referenceNo: "",
      description: "",
      remarks: "",
      action: "",
      dueDate: "",
    };
    const updated = [...rows, newRow];
    setRows(updated);
    onDataChange(updated);
  };

  const updateRow = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;

    // Auto-generate code when type changes
    if (field === "type" && value) updated[index].code = `${value[0]}${String(index + 1).padStart(4, "0")}`;

    setRows(updated);
    onDataChange(updated);
  };

  const deleteRow = (index) => {
    const updated = [...rows];
    updated.splice(index, 1);
    setRows(updated);
    onDataChange(updated);
  };

  useEffect(() => {
    const rowsWithId = data.map((row, idx) => ({
      id: row.id || Date.now() + idx,
      ...row,
    }));
    setRows(rowsWithId);
  }, [data]);

  return (
    <Box sx={{ mt: 2, mb: 2, border: "1px solid #eee", p: 2, borderRadius: 2 }}>
      {rows.map((row, index) => (
        <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 1 }}>
          <Grid item xs={2}>
            <Select value={row.type} onChange={(e) => updateRow(index, "type", e.target.value)} fullWidth displayEmpty>
              <MenuItem value="">Select Type</MenuItem>
              {sectionsConfig[sectionKey]?.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </Grid>

          <Grid item xs={2}>
            <TextField value={row.code} label="Code" fullWidth disabled />
          </Grid>

          <Grid item xs={2}>
            <Select value={row.referenceNo} onChange={(e) => updateRow(index, "referenceNo", e.target.value)} fullWidth displayEmpty>
              <MenuItem value="">Select Reference</MenuItem>
              <MenuItem value="R001">R001</MenuItem>
              <MenuItem value="R002">R002</MenuItem>
            </Select>
          </Grid>

          <Grid item xs={3}>
            <TextField value={row.description} label="Description" fullWidth multiline onChange={(e) => updateRow(index, "description", e.target.value)} />
          </Grid>

          <Grid item xs={2}>
            <TextField value={row.remarks} label="Remarks" fullWidth multiline onChange={(e) => updateRow(index, "remarks", e.target.value)} />
          </Grid>

          <Grid item xs={1}>
            <Select value={row.action} onChange={(e) => updateRow(index, "action", e.target.value)} fullWidth displayEmpty>
              <MenuItem value="">Action</MenuItem>
              {actionsList.map((a) => (
                <MenuItem key={a} value={a}>
                  {a}
                </MenuItem>
              ))}
            </Select>
          </Grid>

          <Grid item xs={2}>
            <TextField type="date" value={row.dueDate} label="Due Date" fullWidth InputLabelProps={{ shrink: true }} onChange={(e) => updateRow(index, "dueDate", e.target.value)} />
          </Grid>

          <Grid item xs={0.5}>
            <IconButton color="error" onClick={() => deleteRow(index)}>
              <DeleteIcon />
            </IconButton>
          </Grid>
        </Grid>
      ))}

      <Button variant="outlined" onClick={addRow}>
        Add Row
      </Button>
    </Box>
  );
};

export default AdditionalFieldsForm;
