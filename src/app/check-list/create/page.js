"use client";

import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, Select, MenuItem, TextField, FormControl, Grid, Autocomplete, Button, Divider, TextareaAutosize, Paper, Stack, CircularProgress } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import mammoth from "mammoth";
import { toast } from "react-toastify";
import { addCheckList, fetchJournalList, getAllActivities, getAllChecklist, getAllClients, getAllJournals, getSurveyTypes, updateCheckList } from "@/api";
import CommonButton from "@/components/CommonButton";
import CommonCard from "@/components/CommonCard";

const CheckListCreate = () => {
  const [clientsList, setClientsList] = useState([]);
  const [documentTitle, setDocumentTitle] = useState("");
  const [file, setFile] = useState("");
  const [selectedShip, setSelectedShip] = useState(null);
  const [selectedReportNumber, setSelectedReportNumber] = useState(null);
  const [existingChecklist, setExistingChecklist] = useState(null);
  const [selectedSurveyType, setSelectedSurveyType] = useState(null);

  const [buttonText, setButtonText] = useState("Submit");

  const fetchExistingChecklist = async () => {
    if (!selectedShip?.id || !selectedReportNumber?.id || !selectedSurveyType) return;

    try {
      setLoading(true);
      const response = await getAllChecklist();

      if (response?.data?.status === "success" && response.data?.data) {
        const allChecklists = response?.data?.data;

        // Find matching checklist based on clientId, reportNo, and typeOfSurvey
        const matchingChecklist = allChecklists.find((checklist) => checklist.clientId === String(selectedShip.id) && checklist.reportNo === String(selectedReportNumber.id) && checklist.typeOfSurvey === String(selectedSurveyType));

        if (matchingChecklist) {
          setExistingChecklist(matchingChecklist);

          // Set the HTML content from existing checklist
          if (matchingChecklist.checkListData?.checkList) {
            setCheckListData(matchingChecklist.checkListData.checkList);
          }

          // Set notes if available
          if (matchingChecklist.checkListData?.notes) {
            setNotes(matchingChecklist.checkListData.notes.split("\n"));
          }

          setButtonText("Update");
          toast.info("Existing checklist loaded for editing");
        } else {
          setExistingChecklist(null);
          setButtonText("Submit");
        }
      } else {
        setExistingChecklist(null);
        setButtonText("Submit");
      }
    } catch (err) {
      console.error("Error fetching checklist:", err);
      toast.error("Failed to fetch existing checklist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExistingChecklist();
  }, [selectedShip?.id, selectedReportNumber?.id, selectedSurveyType]);

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, setValue } = useForm();
  const [journals, setJournals] = useState();
  const [surveyType, setSurveyType] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [checkListData, setCheckListData] = useState("");
  const editableRef = useRef(null);
  const shouldInjectHTML = useRef(true);

  const handleContentChange = () => {
    if (editableRef.current) {
      setEditedContent(editableRef.current.innerHTML);
    }
  };

  useEffect(() => {
    if (checkListData) {
      setEditedContent(checkListData);
      shouldInjectHTML.current = true;
    }
  }, [checkListData]);

  useEffect(() => {
    if (shouldInjectHTML.current && editableRef.current) {
      editableRef.current.innerHTML = editedContent || "";
      shouldInjectHTML.current = false;
    }
  }, [editedContent]);

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
    setSelectedSurveyType(null);
    setFile("");
    setCheckListData("");
    setValue("typeOfSurvey", null);
  };

  const handleReportNumberChange = async (event) => {
    const selectedJournalTypeId = event.target.value;
    const journal = journals?.find((j) => j.journalTypeId === selectedJournalTypeId);
    if (!journal) return;

    setSelectedReportNumber({
      id: journal.id,
      journalTypeId: selectedJournalTypeId,
    });

    setSelectedSurveyType(null);
    setFile("");
    setCheckListData("");
    setValue("typeOfSurvey", null);

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
  };

  useEffect(() => {
    if (file && !existingChecklist) {
      handleFileUpload(file);
    }
  }, [file]);

  const handleFileUpload = async (fileUrl) => {
    try {
      setLoading(true);

      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      const result = await mammoth.convertToHtml({ arrayBuffer });

      setCheckListData(result.value);

      toast.success("Checklist loaded.");
    } catch (error) {
      console.error("Error parsing file:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async () => {
    const surveyId = control._formValues?.typeOfSurvey;

    const checkListDataPayload = {
      checkList: editedContent,
    };

    const payload = {
      clientId: selectedShip?.id,
      typeOfSurvey: surveyId ? [String(surveyId)] : [],
      reportNo: selectedReportNumber?.id || null,
      checkListData: {
        ...checkListDataPayload,
        notes: notes.join("\n"),
      },
    };

    try {
      let response;

      if (existingChecklist) {
        // Update existing checklist
        response = await updateCheckList(existingChecklist.id, payload);
      } else {
        // Create new checklist
        response = await addCheckList(payload);
      }

      if (response?.data?.status === "success") {
        toast.success(`Checklist ${existingChecklist ? "updated" : "added"} successfully`);

        // Refresh the checklist data
        fetchExistingChecklist();
      } else {
        toast.error(response?.data?.message || "Failed to save checklist");
      }
    } catch (error) {
      console.error("Error saving checklist:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CommonCard>
      <Stack spacing={3} sx={{ mb: 4 }}>
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
                      setSelectedSurveyType(newValue ? newValue.value : null);

                      if (newValue) {
                        const selectedSurvey = surveyType?.find((s) => Number(s.surveyTypes?.id) === newValue.value);

                        // Only load from file if no existing checklist is found
                        if (selectedSurvey?.surveyTypes?.checkListDocument && !existingChecklist) {
                          setFile(selectedSurvey.surveyTypes.checkListDocument);
                        } else if (!selectedSurvey?.surveyTypes?.checkListDocument && !existingChecklist) {
                          toast.error("No checklist is attached for this activity.");
                          setFile(null);
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

      {!loading && checkListData && (
        <>
          {/* <Box
            sx={{
              borderColor: "divider",
              borderRadius: 2,
              mb: 2,
              border: "1px solid",
              "&:focus-within": {
                borderColor: "primary.main",
                boxShadow: "0 0 0 3px rgba(25, 118, 210, 0.2)",
              },
            }}
          >
            <Box
              ref={editableRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleContentChange}
              style={{
                minHeight: 400,
                padding: "16px",
                overflowY: "auto",
                outline: "none",
                cursor: "text",
              }}
            />
          </Box> */}
          <CommonButton variant="contained" onClick={handleSubmit(onSubmit)} text={buttonText} />
        </>
      )}
    </CommonCard>
  );
};

export default CheckListCreate;
