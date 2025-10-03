"use client";
import React, { useEffect, useState } from "react";
import { Box, Grid, TextField, Select, MenuItem, Button, IconButton, InputLabel, FormControl, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const sectionOptions = ["coc", "statutory", "memoranda", "additional", "compliance"];
const actionsList = ["Recommended", "Deleted", "Amended", "Extended"];

// Types available per section
const sectionsConfig = {
  coc: ["Hull", "Machinery"],
  statutory: ["Hull", "Machinery"],
  memoranda: ["Hull", "Machinery"],
  additional: ["Hull", "Machinery"],
  compliance: ["Hull", "Machinery"],
};

const AdditionalFieldsForm = ({ data = [], onDataChange }) => {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const rowsWithId = data.map((row, idx) => ({
      id: row.id || Date.now() + idx,
      ...row,
    }));
    setRows(rowsWithId);
  }, [data]);

  const addRow = () => {
    const newRow = {
      id: Date.now(),
      section: "",
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

    if (field === "section") {
      updated[index].type = "";
      updated[index].code = "";
    }

    if (field === "type" && value && updated[index].section) {
      updated[index].code = `${value[0]}${String(index + 1).padStart(4, "0")}`;
    }

    setRows(updated);
    onDataChange(updated);
  };

  const deleteRow = (index) => {
    const updated = [...rows];
    updated.splice(index, 1);
    setRows(updated);
    onDataChange(updated);
  };

  return (
    <Box sx={{ mt: 2, mb: 2, border: "1px solid #eee", p: 2, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: "primary.main" }}>
        Additional Fields (Single Section)
      </Typography>

      {rows.map((row, index) => (
        <Grid container spacing={2} key={row.id} alignItems="center" sx={{ mb: 1 }}>
          {/* Section Dropdown */}
          <Grid item xs={2}>
            <FormControl fullWidth>
              <InputLabel>Section</InputLabel>
              <Select value={row.section} label="Section" onChange={(e) => updateRow(index, "section", e.target.value)}>
                {sectionOptions.map((sec) => (
                  <MenuItem key={sec} value={sec}>
                    {sec.charAt(0).toUpperCase() + sec.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Type */}
          <Grid item xs={2}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select value={row.type} label="Type" onChange={(e) => updateRow(index, "type", e.target.value)} disabled={!row.section}>
                {sectionsConfig[row.section]?.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Auto-generated Code */}
          <Grid item xs={2}>
            <TextField value={row.code} label="Code" fullWidth disabled />
          </Grid>

          {/* Reference */}
          <Grid item xs={2}>
            <FormControl fullWidth>
              <InputLabel>Reference</InputLabel>
              <Select value={row.referenceNo} label="Reference" onChange={(e) => updateRow(index, "referenceNo", e.target.value)}>
                <MenuItem value="">None</MenuItem>
                <MenuItem value="R001">R001</MenuItem>
                <MenuItem value="R002">R002</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Description */}
          <Grid item xs={3}>
            <TextField value={row.description} label="Description" fullWidth multiline onChange={(e) => updateRow(index, "description", e.target.value)} />
          </Grid>

          {/* Remarks */}
          <Grid item xs={3}>
            <TextField value={row.remarks} label="Remarks" fullWidth multiline onChange={(e) => updateRow(index, "remarks", e.target.value)} />
          </Grid>

          {/* Action */}
          <Grid item xs={2}>
            <FormControl fullWidth>
              <InputLabel>Action</InputLabel>
              <Select value={row.action} label="Action" onChange={(e) => updateRow(index, "action", e.target.value)}>
                <MenuItem value="">None</MenuItem>
                {actionsList.map((a) => (
                  <MenuItem key={a} value={a}>
                    {a}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Due Date */}
          <Grid item xs={2}>
            <TextField type="date" value={row.dueDate} label="Due Date" fullWidth InputLabelProps={{ shrink: true }} onChange={(e) => updateRow(index, "dueDate", e.target.value)} />
          </Grid>

          {/* Delete */}
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
