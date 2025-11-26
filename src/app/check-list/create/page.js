"use client";

import React, { useState, useEffect } from "react";
import { Box, Typography, Select, MenuItem, TextField, FormControl, Grid, Autocomplete, Button, Table, TableBody, TableCell, TableHead, TableRow, Grid2 } from "@mui/material";

import { getAllClients, getSurveyTypes } from "@/api";
import { Controller, useForm } from "react-hook-form";

import mammoth from "mammoth"; // <-- using MAMMOTH now

const CheckListCreate = () => {
  const [selectedClient, setSelectedClient] = useState("");
  const [clientsList, setClientsList] = useState([]);
  const [surveyTypes, setSurveyTypes] = useState([]);
  const [rows, setRows] = useState([]);

  const surveyOptions =
    surveyTypes.map((survey) => ({
      label: survey?.name,
      value: Number(survey?.id),
    })) || [];

  const { control, handleSubmit } = useForm();

  const [errorMsg, setErrorMsg] = useState({ client: "", section: "" });

  // Fetch data
  useEffect(() => {
    const fetchClients = async () => {
      const res = await getAllClients();
      if (res?.status === 200) setClientsList(res.data.data);
    };

    const fetchSurveyTypes = async () => {
      const res = await getSurveyTypes();
      setSurveyTypes(res.data.data);
    };

    fetchClients();
    fetchSurveyTypes();
  }, []);

  const handleClientChange = (e) => {
    setSelectedClient(e.target.value);
    setErrorMsg({ client: "", section: "" });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();

    // Convert DOCX → raw HTML
    const result = await mammoth.convertToHtml({ arrayBuffer });

    const html = result.value;

    // Extract table rows (<tr> contents)
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const extractedRows = [];

    doc.querySelectorAll("table tr").forEach((row) => {
      const cols = [...row.querySelectorAll("td,th")].map((c) => c.textContent.trim());

      if (cols.length > 0) {
        extractedRows.push({
          text: cols.join(" | "),
          choice: "",
        });
      }
    });

    setRows(extractedRows);
  };

  // ------------------------------------------------------------
  // 📌 UPDATE DROPDOWN FOR EACH DOCX ROW
  // ------------------------------------------------------------
  const updateRowChoice = (index, value) => {
    const updated = [...rows];
    updated[index].choice = value;
    setRows(updated);
  };

  const onSubmit = () => {
    const payload = {
      clientId: selectedClient,
      typeOfSurvey: control._formValues.typeOfSurvey,
      checklist: rows.map((r) => ({
        item: r.text,
        selected: r.choice,
      })),
    };

    console.log("FINAL PAYLOAD:", payload);
    alert("Payload logged (check console)");
  };

  return (
    <Box sx={{ p: 3, bgcolor: "white", borderRadius: 2, boxShadow: 1, mt: 2 }}>
      <FormControl fullWidth sx={{ maxWidth: 300 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
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
      </FormControl>

      <Grid2 xs={12} sx={{ mt: 2 }}>
        <Controller
          name="typeOfSurvey"
          control={control}
          defaultValue={null}
          render={({ field }) => (
            <Autocomplete
              options={surveyOptions?.sort((a, b) => a.label?.localeCompare(b.label))}
              value={surveyOptions.find((option) => option.value === field.value) || null}
              onChange={(event, newValue) => {
                field.onChange(newValue ? newValue.value : null);
              }}
              getOptionLabel={(option) => option.label || ""}
              renderInput={(params) => <TextField {...params} label="Type of Activity" variant="standard" />}
            />
          )}
        />
      </Grid2>

      {/* WORD FILE UPLOAD */}
      <Box mt={3}>
        <Typography fontWeight={600}>Upload Report (Word .docx)</Typography>
        <Button variant="outlined" component="label" sx={{ mt: 1 }}>
          Upload Word File
          <input type="file" accept=".docx" hidden onChange={handleFileUpload} />
        </Button>
      </Box>

      {/* RENDER DOCX TABLE ROWS */}
      {rows.length > 0 && (
        <Table sx={{ mt: 3 }}>
          <TableHead>
            <TableRow>
              <TableCell>Report Row</TableCell>
              <TableCell>Select (Y/N/NO/NA/P)</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((r, index) => (
              <TableRow key={index}>
                <TableCell>{r.text}</TableCell>
                <TableCell>
                  <Select value={r.choice} onChange={(e) => updateRowChoice(index, e.target.value)} size="small">
                    <MenuItem value="">Select</MenuItem>
                    <MenuItem value="Y">Y</MenuItem>
                    <MenuItem value="N">N</MenuItem>
                    <MenuItem value="NO">NO</MenuItem>
                    <MenuItem value="NA">NA</MenuItem>
                    <MenuItem value="P">P</MenuItem>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* SUBMIT */}
      <Button variant="contained" color="primary" sx={{ mt: 3 }} onClick={handleSubmit(onSubmit)}>
        Submit Checklist
      </Button>
    </Box>
  );
};

export default CheckListCreate;
