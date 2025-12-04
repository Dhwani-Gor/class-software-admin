"use client";

import React, { useState, useEffect } from "react";
import { Box, Typography, Select, MenuItem, TextField, FormControl, Grid, Autocomplete, Button, Divider, TextareaAutosize, Paper, Stack, CircularProgress } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import mammoth from "mammoth";
import { toast } from "react-toastify";
import { addCheckList, fetchJournalList, getAllActivities, getAllChecklist, getAllClients, getAllJournals, getSurveyTypes, updateCheckList } from "@/api";
import CommonButton from "@/components/CommonButton";
import CommonCard from "@/components/CommonCard";

const CheckListCreate = () => {
  const [selectedClient, setSelectedClient] = useState("");
  const [clientsList, setClientsList] = useState([]);
  const [documentTitle, setDocumentTitle] = useState("");
  const [file, setFile] = useState("");
  const [selectedShip, setSelectedShip] = useState(null);
  const [selectedReportNumber, setSelectedReportNumber] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [existingChecklist, setExistingChecklist] = useState(null);

  const [buttonText, setButtonText] = useState("Submit");

  const fetchExistingChecklist = async () => {
    if (!selectedShip?.id || !selectedReportNumber?.id) return;

    try {
      setLoading(true);
      const response = await getAllChecklist();
      if (response?.data?.status === "success" && response.data?.data) {
        const data = response?.data?.data;
        setExistingChecklist(data);
        setDocumentTitle(data[0]?.checkListData?.documentTitle || "");
        setHeaderFields(data[0]?.checkListData?.header || {});
        setNotes(
          Array.isArray(data[0]?.checkListData?.notes)
            ? data[0]?.checkListData?.notes
            : (data[0]?.checkListData?.notes || "")
                .split("\n")
                .map((n) => n.trim())
                ?.filter(Boolean)
        );
        setRows(
          data[0]?.checkListData?.checkList?.map((item) => ({
            number: item.number,
            text: item.item,
            type: "item",
            inputType: "dropdown",
            choice: item.selected,
            level: 2,
          }))
        );
        setRemarks(data?.checkListData?.remarks || "");
        setSurveyor(data?.checkListData?.surveyor || {});
        setButtonText("Update");
      } else {
        setExistingChecklist(null);
        setRows([]);
        setButtonText("Submit");
      }
    } catch (err) {
      console.error("Error fetching existing checklist:", err);
      toast.error("Failed to fetch existing checklist");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchExistingChecklist();
  }, [selectedShip?.id, selectedReportNumber?.id]);

  const [surveyor, setSurveyor] = useState({
    name: "",
    date: "",
    place: "",
  });

  const [headerFields, setHeaderFields] = useState({
    shipName: "",
    irNumber: "",
    imoNumber: "",
    portOfSurvey: "",
  });

  const [notes, setNotes] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit } = useForm();
  const [journals, setJournals] = useState();
  const [surveyType, setSurveyType] = useState(null);

  const fetchAllJournals = async () => {
    try {
      setLoading(true);
      const response = await fetchJournalList(selectedShip.id);
      if (response?.response?.data?.status === "error") {
        toast.error(response?.response?.data?.message);
        return;
      }

      if (response?.data?.status === "success") {
        setJournals(response?.data?.data);
      } else {
        toast.error("Something went wrong! Please try again later.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error(err?.message || "Failed to fetch journals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedShip?.id) {
      fetchAllJournals();
    }
  }, [selectedShip?.id]);

  useEffect(() => {
    const fetchClients = async () => {
      const res = await getAllClients();
      if (res?.status === 200) setClientsList(res.data.data);
    };
    fetchClients();
  }, []);

  const surveyOptions = surveyType?.map((item) => ({
    label: item?.surveyTypes?.name,
    value: Number(item?.surveyTypes?.id),
  }));

  const handleShipChange = (event) => {
    const selectedId = event.target.value;
    const client = clientsList.find((c) => c.id === selectedId);
    setSelectedShip({ id: selectedId, shipName: client?.shipName || "" });
    setSelectedReportNumber(null);
    setFile("");
    setRows([]);
  };

  const handleReportNumberChange = async (event) => {
    const selectedJournalTypeId = event.target.value;
    const journal = journals?.find((j) => j.journalTypeId === selectedJournalTypeId);
    if (!journal) return;

    setSelectedReportNumber({
      id: journal.id,
      journalTypeId: selectedJournalTypeId,
    });

    try {
      const result = await getAllActivities("journalId", journal.id);
      if (result?.data?.status === "success") {
        setSurveyType(result.data.data);
      } else {
        toast.error(result?.data?.message || "Failed to load activities");
      }
    } catch (err) {
      console.error("Error fetching activities:", err);
      toast.error("Failed to load activities");
    }

    setRows([]);
  };

  useEffect(() => {
    if (file) handleFileUpload(file);
  }, [file]);

  const handleFileUpload = async (fileUrl) => {
    try {
      setLoading(true); // <<< Start loader here

      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });

      const parser = new DOMParser();
      const doc = parser.parseFromString(result.value, "text/html");
      const allText = doc.body.textContent;

      const titleMatch = allText.match(/^(.*?)Name of Ship/i);
      if (titleMatch) {
        setDocumentTitle(titleMatch[1].trim());
      }

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

      setHeaderFields(extractedHeader);

      const notesMatch = allText.match(/NOTES[:\s]*([\s\S]*?)(?=Sr\s*\.?\s*No|Item|1\s*\.?\s*General)/i);
      if (notesMatch) {
        const notesText = notesMatch[1];
        const notesList = notesText
          .split(/\n/)
          .map((line) => line.trim())
          ?.filter((line) => line.length > 10 && /^\d+/.test(line))
          .map((line) => line.replace(/^\d+\s*/, ""));
        setNotes(notesList);
      }

      const extractedRows = [];
      const tables = doc.querySelectorAll("table");

      if (tables.length > 0) {
        tables.forEach((table) => {
          const rows = table.querySelectorAll("tr");

          rows.forEach((row) => {
            const cells = Array.from(row.querySelectorAll("td, th"));
            if (cells.length < 2) return;

            const cell1 = cells[0]?.textContent.trim() || "";
            const cell2 = cells[1]?.textContent.trim() || "";
            const cell3 = cells[2]?.textContent.trim() || "";

            if (/Sr.*No|Item|Y\/N\/NO/i.test(cell1 + cell2)) return;

            const fullText = `${cell1} ${cell2}`.trim();
            if (fullText.length < 3) return;

            const hasDropdown = cell3.includes(".") || cell3.includes("…");

            if (/^\d+\.?\s+[A-Z]/.test(fullText) && !hasDropdown && cell2.length < 50) {
              const match = fullText.match(/^(\d+\.?\s+)(.*)$/);
              if (match) {
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

            if (/^\d+\.\d+\.?\s+/.test(fullText) && !hasDropdown && cell2.length < 50) {
              const match = fullText.match(/^(\d+\.\d+\.?\s+)(.*)$/);
              if (match) {
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

            if (hasDropdown || cells.length >= 3) {
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

      setRows(extractedRows);
      setLoading(false);
      if (file === null) {
        return toast.info("No checklist is attached for this activity.");
      }

      if (typeof file === "string") {
        return toast.info("Checklist is already uploaded. Showing preview...");
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      toast.error(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  const updateRowChoice = (index, value) => {
    const updated = [...rows];
    updated[index].choice = value;
    setRows(updated);
  };

  const onSubmit = async () => {
    const surveyId = control._formValues?.typeOfSurvey;

    const checkListData = {
      documentTitle,
      header: headerFields,
      notes,
      checkList: rows
        ?.filter((r) => r.type === "item")
        .map((r) => ({
          number: r.number,
          item: r.text,
          selected: r.choice,
        })),
      remarks,
      surveyor,
    };

    const payload = {
      clientId: selectedShip?.id,
      typeOfSurvey: surveyId ? [String(surveyId)] : [],
      reportNo: selectedReportNumber?.id || null,
      checkListData: {
        ...checkListData,
        notes: notes.join("\n"),
      },
    };

    try {
      let response;
      // if (existingChecklist) {
      //   response = await updateCheckList(existingChecklist.id, payload); // API to update checklist
      // } else {
      response = await addCheckList(payload); // API to create checklist
      // }

      if (response?.data?.status === "success") {
        toast.success(`Checklist ${existingChecklist ? "updated" : "added"} successfully`);
      } else {
        toast.error(response?.data?.message || "Failed to save checklist");
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false); // <<< Stop loader after parsing
    }
  };

  return (
    <CommonCard>
      <Stack spacing={3} sx={{ mb: 4 }}>
        {/* Ship Selection */}
        <Box>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 700, fontSize: 16 }}>
            Select Ship
          </Typography>
          <FormControl fullWidth sx={{ maxWidth: 400 }}>
            <Select value={selectedShip?.id || ""} onChange={handleShipChange} displayEmpty size="small">
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
        </Box>

        {/* Report Number Selection */}
        {selectedShip?.id && (
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 700, fontSize: 16 }}>
              Select Report Number
            </Typography>
            <FormControl fullWidth sx={{ maxWidth: 400 }}>
              <Select value={selectedReportNumber?.journalTypeId || ""} onChange={handleReportNumberChange} displayEmpty size="small">
                {journals?.length > 0 ? (
                  <MenuItem value="" disabled>
                    Select Report
                  </MenuItem>
                ) : null}
                {journals?.map((r) => (
                  <MenuItem key={r.id} value={r.journalTypeId}>
                    {r.journalTypeId}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Survey Type Selection */}
        {selectedShip?.id && selectedReportNumber?.journalTypeId && (
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 700, fontSize: 16 }}>
              Type of Activity
            </Typography>
            <Box sx={{ maxWidth: 400 }}>
              <Controller
                name="typeOfSurvey"
                control={control}
                defaultValue={null}
                render={({ field }) => (
                  <Autocomplete
                    options={surveyOptions?.sort((a, b) => a.label?.localeCompare(b.label))}
                    value={surveyOptions?.find((o) => o.value === field.value) || null}
                    onChange={(event, newValue) => {
                      field.onChange(newValue ? newValue.value : null);

                      if (newValue) {
                        const selectedSurvey = surveyType?.find((s) => Number(s.surveyTypes?.id) === newValue.value);

                        if (selectedSurvey?.surveyTypes?.checkListDocument) {
                          setRows([]); // <<< Add this
                          setDocumentTitle("");
                          setHeaderFields({});
                          setNotes([]);
                          setRemarks("");
                          setLoading(false);
                          setSurveyor({ name: "", date: "", place: "" });

                          setFile(selectedSurvey.surveyTypes.checkListDocument);
                        } else {
                          toast.error("No checklist is attached for this activity.");
                          setFile(null);
                          setRows([]);
                        }
                      }
                    }}
                    getOptionLabel={(option) => option.label || ""}
                    renderInput={(params) => <TextField {...params} placeholder="Search activity type..." size="small" />}
                  />
                )}
              />
            </Box>
          </Box>
        )}
        {loading && (
          <Box sx={{ textAlign: "center", py: 5 }}>
            <CircularProgress />
          </Box>
        )}
      </Stack>

      {/* Document Preview */}
      {rows?.length > 0 && (
        <Box sx={{ mt: 4, p: 3, border: "1px solid #ddd", borderRadius: 1, bgcolor: "white" }}>
          {/* Document Title */}
          {documentTitle && (
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, textAlign: "center", textTransform: "uppercase" }}>
              {documentTitle}
            </Typography>
          )}

          {/* Header Fields */}
          <Box sx={{ mb: 3, p: 2, bgcolor: "#f9f9f9", borderRadius: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography sx={{ fontWeight: 500, minWidth: 120 }}>Name of Ship:</Typography>
                  <TextField fullWidth size="small" value={headerFields.shipName} onChange={(e) => setHeaderFields({ ...headerFields, shipName: e.target.value })} />
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography sx={{ fontWeight: 500, minWidth: 120 }}>Port of Survey:</Typography>
                  <TextField fullWidth size="small" value={headerFields.portOfSurvey} onChange={(e) => setHeaderFields({ ...headerFields, portOfSurvey: e.target.value })} />
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography sx={{ fontWeight: 500, minWidth: 120 }}>I. R. No.:</Typography>
                  <TextField fullWidth size="small" value={headerFields.irNumber} onChange={(e) => setHeaderFields({ ...headerFields, irNumber: e.target.value })} />
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography sx={{ fontWeight: 500, minWidth: 120 }}>IMO No.:</Typography>
                  <TextField fullWidth size="small" value={headerFields.imoNumber} onChange={(e) => setHeaderFields({ ...headerFields, imoNumber: e.target.value })} />
                </Stack>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* NOTES Section */}
          {notes.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                NOTES:
              </Typography>
              {notes?.map((note, idx) => (
                <Typography key={idx} variant="body2" sx={{ mb: 0.5, pl: 2 }}>
                  {idx + 1}. {note}
                </Typography>
              ))}
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Table Header */}
          <Grid container spacing={2} sx={{ mb: 2, p: 1, bgcolor: "#f5f5f5" }}>
            <Grid item xs={1}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Sr. No.
              </Typography>
            </Grid>
            <Grid item xs={8}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Item
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Y/N/NO/NA/P
              </Typography>
            </Grid>
          </Grid>

          {/* Checklist Rows */}
          {rows.map((r, index) => (
            <Box key={index} sx={{ mb: 1 }}>
              {r.type === "section" ? (
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
                  {r.number} {r.text}
                </Typography>
              ) : r.type === "subsection" ? (
                <Typography variant="body1" sx={{ fontWeight: 500, mt: 1.5, mb: 1, pl: 2 }}>
                  {r.number} {r.text}
                </Typography>
              ) : (
                <Grid container spacing={2} alignItems="center" sx={{ py: 1 }}>
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
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 500, mb: 1 }}>Remarks:</Typography>
            <TextareaAutosize
              minRows={3}
              placeholder="Enter remarks..."
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "14px",
                fontFamily: "inherit",
              }}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </Box>

          {/* Signature Section */}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              Surveyor Information
            </Typography>
            <TextField size="small" fullWidth sx={{ mb: 2, maxWidth: 400 }} placeholder="Surveyor Name" value={surveyor.name} onChange={(e) => setSurveyor({ ...surveyor, name: e.target.value })} />
            <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
              Surveyor(s) to Indian Register of Shipping
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                  Date:
                </Typography>
                <TextField type="date" size="small" InputLabelProps={{ shrink: true }} value={surveyor.date} onChange={(e) => setSurveyor({ ...surveyor, date: e.target.value })} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                  Place:
                </Typography>
                <TextField size="small" placeholder="Location" value={surveyor.place} onChange={(e) => setSurveyor({ ...surveyor, place: e.target.value })} />
              </Box>
            </Stack>
          </Box>
        </Box>
      )}

      {/* Submit Button */}
      {rows?.length > 0 && (
        <Box sx={{ mt: 3, textAlign: "end" }}>
          <CommonButton variant="contained" onClick={handleSubmit(onSubmit)} sx={{ px: 4 }} text={buttonText}></CommonButton>
        </Box>
      )}
    </CommonCard>
  );
};

export default CheckListCreate;
