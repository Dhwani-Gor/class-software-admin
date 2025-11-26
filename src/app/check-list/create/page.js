"use client";

import React, { useState, useEffect } from "react";
import { Box, Typography, Select, MenuItem, TextField, FormControl, Grid, Autocomplete, Button, Divider } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import mammoth from "mammoth";
import { toast } from "react-toastify";
import { addCheckList, getAllClients, getSurveyTypes } from "@/api";

const CheckListCreate = () => {
  const [selectedClient, setSelectedClient] = useState("");
  const [clientsList, setClientsList] = useState([]);
  const [surveyTypes, setSurveyTypes] = useState([]);
  const [documentTitle, setDocumentTitle] = useState("");
  const [headerFields, setHeaderFields] = useState({
    shipName: "",
    irNumber: "",
    imoNumber: "",
    portOfSurvey: "",
  });
  const [notes, setNotes] = useState([]);
  const [rows, setRows] = useState([]);

  const { control, handleSubmit } = useForm();

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

  const surveyOptions = surveyTypes.map((survey) => ({ label: survey?.name, value: Number(survey?.id) })) || [];

  const handleClientChange = (e) => setSelectedClient(e.target.value);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      console.log("File selected:", file.name);

      const arrayBuffer = await file.arrayBuffer();
      console.log("ArrayBuffer created, size:", arrayBuffer.byteLength);

      const result = await mammoth.convertToHtml({ arrayBuffer });
      console.log("Mammoth conversion complete");
      console.log("HTML length:", result.value.length);
      console.log("First 500 chars of HTML:", result.value.substring(0, 500));

      const parser = new DOMParser();
      const doc = parser.parseFromString(result.value, "text/html");
      const allText = doc.body.textContent;

      console.log("Text length:", allText.length);
      console.log("First 500 chars of text:", allText.substring(0, 500));

      // Extract document title
      const titleMatch = allText.match(/^(.*?)Name of Ship/i);
      if (titleMatch) {
        const title = titleMatch[1].trim();
        console.log("Document title:", title);
        setDocumentTitle(title);
      }

      // Extract header fields - simplified
      const shipNameMatch = allText.match(/Name of Ship[:\s]*([^\n\r]*?)(?=I\.?\s*R\.?\s*No|$)/i);
      const irMatch = allText.match(/I\.?\s*R\.?\s*No\.?[:\s]*([^\n\r]*?)(?=IMO|$)/i);
      const imoMatch = allText.match(/IMO\s*No\.?[:\s]*([^\n\r]*?)(?=Port of Survey|$)/i);
      const portMatch = allText.match(/Port of Survey[:\s]*([^\n\r]*?)(?=NOTES|$)/i);

      const extractedHeader = {
        shipName: shipNameMatch?.[1]?.replace(/[\.…]+/g, "").trim() || "",
        irNumber: irMatch?.[1]?.replace(/[\.…]+/g, "").trim() || "",
        imoNumber: imoMatch?.[1]?.replace(/[\.…]+/g, "").trim() || "",
        portOfSurvey: portMatch?.[1]?.replace(/[\.…]+/g, "").trim() || "",
      };

      console.log("Extracted header:", extractedHeader);
      setHeaderFields(extractedHeader);

      // Extract NOTES
      const notesMatch = allText.match(/NOTES[:\s]*([\s\S]*?)(?=Sr\s*\.?\s*No|Item|1\s*\.?\s*General)/i);
      if (notesMatch) {
        const notesText = notesMatch[1];
        const notesList = notesText
          .split(/\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 10 && /^\d+/.test(line))
          .map((line) => line.replace(/^\d+\s*/, ""));

        console.log("Extracted notes:", notesList);
        setNotes(notesList);
      }

      // Extract all rows - SIMPLIFIED APPROACH
      const extractedRows = [];

      // Try to parse HTML table first
      const tables = doc.querySelectorAll("table");
      console.log("Number of tables found:", tables.length);

      if (tables.length > 0) {
        tables.forEach((table, tableIdx) => {
          console.log(`Processing table ${tableIdx + 1}`);
          const rows = table.querySelectorAll("tr");
          console.log(`  Found ${rows.length} rows in table`);

          rows.forEach((row, rowIdx) => {
            const cells = Array.from(row.querySelectorAll("td, th"));
            if (cells.length < 2) return;

            const cell1 = cells[0]?.textContent.trim() || "";
            const cell2 = cells[1]?.textContent.trim() || "";
            const cell3 = cells[2]?.textContent.trim() || "";

            console.log(`  Row ${rowIdx}: [${cell1}] [${cell2}] [${cell3}]`);

            // Skip header rows
            if (/Sr.*No|Item|Y\/N\/NO/i.test(cell1 + cell2)) {
              console.log("    -> Skipped (header)");
              return;
            }

            // Combine cell1 and cell2 for analysis
            const fullText = `${cell1} ${cell2}`.trim();

            if (fullText.length < 3) {
              console.log("    -> Skipped (too short)");
              return;
            }

            // Determine if section, subsection, or item
            const hasDropdown = cell3.includes(".") || cell3.includes("…");
            const isNumericOnly = /^\d+\.?\s*$/.test(cell1);

            // Section header: "1. General" or "1 General"
            if (/^\d+\.?\s+[A-Z]/.test(fullText) && !hasDropdown && cell2.length < 50) {
              const match = fullText.match(/^(\d+\.?\s+)(.*)$/);
              if (match) {
                console.log("    -> Section header");
                extractedRows.push({
                  number: match[1].trim(),
                  text: match[2].trim(),
                  type: "section",
                  inputType: null,
                  choice: "",
                  level: 1,
                });
                return;
              }
            }

            // Subsection header: "1.1 General"
            if (/^\d+\.\d+\.?\s+/.test(fullText) && !hasDropdown && cell2.length < 50) {
              const match = fullText.match(/^(\d+\.\d+\.?\s+)(.*)$/);
              if (match) {
                console.log("    -> Subsection header");
                extractedRows.push({
                  number: match[1].trim(),
                  text: match[2].trim(),
                  type: "subsection",
                  inputType: null,
                  choice: "",
                  level: 2,
                });
                return;
              }
            }

            // Item with dropdown
            if (hasDropdown || cells.length >= 3) {
              console.log("    -> Item with dropdown");
              extractedRows.push({
                number: cell1,
                text: cell2,
                type: "item",
                inputType: "dropdown",
                choice: "",
                level: 2,
              });
            }
          });
        });
      }

      console.log("Total extracted rows:", extractedRows.length);
      console.log("Extracted rows:", extractedRows);

      setRows(extractedRows);

      if (extractedRows.length === 0) {
        toast.error("No checklist items found. Please check the document format.");
        console.log("Full document text for debugging:", allText);
      } else {
        toast.success(`Successfully loaded ${extractedRows.length} items`);
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      console.error("Error stack:", error.stack);
      toast.error(`Error: ${error.message}`);
    }
  };

  const updateRowChoice = (index, value) => {
    const updated = [...rows];
    updated[index].choice = value;
    setRows(updated);
  };

  const onSubmit = async () => {
    const typeId = control._formValues?.typeOfSurvey;
    const payload = {
      clientId: selectedClient,
      typeOfSurvey: typeId ? [String(typeId)] : [],
      reportHeader: headerFields,
      checklist: rows
        .filter((r) => r.type === "item")
        .map((r) => ({
          item: `${r.number} ${r.text}`.trim(),
          selected: r.choice,
        })),
    };
    const response = await addCheckList(payload);
    if (response?.data?.status === "success") toast.success("Checklist added successfully");
  };

  return (
    <Box sx={{ p: 3, bgcolor: "white", borderRadius: 2, boxShadow: 1, mt: 2 }}>
      {/* Client Select */}
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

      {/* Survey Type */}
      <Box sx={{ mt: 2, maxWidth: 400 }}>
        <Controller name="typeOfSurvey" control={control} defaultValue={null} render={({ field }) => <Autocomplete options={surveyOptions.sort((a, b) => a.label.localeCompare(b.label))} value={surveyOptions.find((o) => o.value === field.value) || null} onChange={(event, newValue) => field.onChange(newValue ? newValue.value : null)} getOptionLabel={(option) => option.label || ""} renderInput={(params) => <TextField {...params} label="Type of Activity" variant="standard" />} />} />
      </Box>

      {/* File Upload */}
      <Box mt={3}>
        <Typography fontWeight={600}>Upload Report (Word .docx)</Typography>
        <Button variant="outlined" component="label" sx={{ mt: 1 }}>
          Upload Word File
          <input type="file" accept=".docx" hidden onChange={handleFileUpload} />
        </Button>
      </Box>

      {/* Document Preview */}
      {rows.length > 0 && (
        <Box mt={4} sx={{ border: "2px solid #000", borderRadius: 1, p: 3, background: "#fff" }}>
          {/* Document Title */}
          {documentTitle && (
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, textAlign: "center", textTransform: "uppercase" }}>
              {documentTitle}
            </Typography>
          )}

          {/* Header Fields - Horizontal Layout */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Typography sx={{ fontWeight: 600, minWidth: "140px" }}>Name of Ship:</Typography>
                  <TextField fullWidth variant="standard" value={headerFields.shipName} onChange={(e) => setHeaderFields({ ...headerFields, shipName: e.target.value })} placeholder="…………………….……" />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Typography sx={{ fontWeight: 600, minWidth: "140px" }}>Port of Survey:</Typography>
                  <TextField fullWidth variant="standard" value={headerFields.portOfSurvey} onChange={(e) => setHeaderFields({ ...headerFields, portOfSurvey: e.target.value })} placeholder="……..……………" />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Typography sx={{ fontWeight: 600, minWidth: "140px" }}>I. R. No.:</Typography>
                  <TextField fullWidth variant="standard" value={headerFields.irNumber} onChange={(e) => setHeaderFields({ ...headerFields, irNumber: e.target.value })} placeholder="…………………………" />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Typography sx={{ fontWeight: 600, minWidth: "140px" }}>IMO No.:</Typography>
                  <TextField fullWidth variant="standard" value={headerFields.imoNumber} onChange={(e) => setHeaderFields({ ...headerFields, imoNumber: e.target.value })} placeholder="……………………………" />
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* NOTES Section */}
          {notes.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                NOTES:
              </Typography>
              {notes.map((note, idx) => (
                <Typography key={idx} variant="body2" sx={{ mb: 0.5, pl: 2 }}>
                  {idx + 1}. {note}
                </Typography>
              ))}
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Table Header */}
          <Grid container spacing={2} sx={{ mb: 2, fontWeight: 700 }}>
            <Grid item xs={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Sr. No.
              </Typography>
            </Grid>
            <Grid item xs={8}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Item
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Y/N/NO/NA/P
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2 }} />

          {/* Checklist Rows */}
          {rows.map((r, index) => (
            <Box key={index} sx={{ mb: 1.5 }}>
              {r.type === "section" ? (
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: "1.1rem", mb: 1, mt: 2 }}>
                  {r.number} {r.text}
                </Typography>
              ) : r.type === "subsection" ? (
                <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: "1rem", mb: 1, mt: 1.5, pl: 2 }}>
                  {r.number} {r.text}
                </Typography>
              ) : (
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={1}>
                    <Typography variant="body2">{r.number}</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">{r.text}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Select value={r.choice} fullWidth size="small" onChange={(e) => updateRowChoice(index, e.target.value)} displayEmpty>
                      <MenuItem value=""></MenuItem>
                      <MenuItem value="Y">Y</MenuItem>
                      <MenuItem value="N">N</MenuItem>
                      <MenuItem value="NO">NO</MenuItem>
                      <MenuItem value="NA">NA</MenuItem>
                      <MenuItem value="P">P</MenuItem>
                    </Select>
                  </Grid>
                </Grid>
              )}
            </Box>
          ))}

          <Divider sx={{ my: 3 }} />

          {/* Remarks Section */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Remarks:
            </Typography>
            <TextField fullWidth multiline rows={4} variant="outlined" placeholder="Enter remarks here..." />
          </Box>

          {/* Signature Section */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2">__________________________________</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Surveyor(s) to Indian Register of Shipping
            </Typography>
            <Box sx={{ display: "flex", gap: 3, mt: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography sx={{ fontWeight: 600, mr: 1 }}>Date:</Typography>
                <TextField type="date" variant="standard" InputLabelProps={{ shrink: true }} />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography sx={{ fontWeight: 600, mr: 1 }}>Place:</Typography>
                <TextField variant="standard" placeholder="……………………………………" />
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* Submit Button */}
      {rows.length > 0 && (
        <Button variant="contained" color="primary" sx={{ mt: 3 }} onClick={handleSubmit(onSubmit)}>
          Submit Checklist
        </Button>
      )}
    </Box>
  );
};

export default CheckListCreate;
