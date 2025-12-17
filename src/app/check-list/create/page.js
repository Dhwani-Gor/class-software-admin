"use client";

import React, { useEffect, useRef, useState } from "react";
import { Box, Select, MenuItem, FormControl, TextField, Autocomplete, Stack, CircularProgress, Typography } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import mammoth from "mammoth";
import { toast } from "react-toastify";
import { Editor } from "@tinymce/tinymce-react";

import { getAllClients, fetchJournalList, getAllActivities, getSpecificClient, addCheckList, updateCheckList, getAllSystemVariables, getSingleChecklist, getAllChecklist } from "@/api";

import CommonButton from "@/components/CommonButton";
import CommonCard from "@/components/CommonCard";

/* =======================
   LABEL → FIELD MAPPING
======================= */

const LABEL_FIELD_MAP = {
  shipName: ["name of ship", "ship name", "vessel name"],
  classNumber: ["class number", "class no", "class no."],
  imoNumber: ["imo number", "imo no", "imo no."],
  portOfSurvey: ["port of survey", "survey port"],
};

/* =======================
   COMPANY HEADER
======================= */

const injectCompanyHeader = (html, systemVariables) => {
  if (!systemVariables?.company_name && !systemVariables?.company_logo) return html;

  const container = document.createElement("div");
  container.innerHTML = html;

  if (container.querySelector('[data-company-header="true"]')) return html;

  const header = document.createElement("div");
  header.setAttribute("data-company-header", "true");
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.marginBottom = "24px";
  header.style.borderBottom = "1px solid #ccc";
  header.style.paddingBottom = "12px";

  const left = document.createElement("div");
  left.style.flex = "1";

  if (systemVariables.company_logo) {
    const logo = document.createElement("img");
    logo.src = systemVariables.company_logo;
    logo.style.height = "80px";
    left.appendChild(logo);
  }

  const center = document.createElement("div");
  center.style.flex = "1";
  center.style.textAlign = "center";
  center.style.fontWeight = "700";
  center.style.fontSize = "20px";
  center.textContent = "Survey Checklist Report";

  const right = document.createElement("div");
  right.style.flex = "1";
  right.style.textAlign = "right";
  right.style.fontWeight = "700";
  right.style.fontSize = "18px";
  right.textContent = systemVariables.company_name || "";

  header.append(left, center, right);
  container.prepend(header);

  return container.innerHTML;
};

/* =======================
   CLIENT VALUE
======================= */

const getClientValue = (field, client) => {
  switch (field) {
    case "shipName":
      return client?.shipName || "";
    case "classNumber":
      return client?.classId || "";
    case "imoNumber":
      return client?.imoNumber || "";
    case "portOfSurvey":
      return client?.portOfSurvey || "";
    default:
      return "";
  }
};

/* =======================
   AUTO-FILL TEXT
======================= */

const prepopulateFields = (html, clientData) => {
  if (!clientData) return html;

  const container = document.createElement("div");
  container.innerHTML = html;

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node;

  while ((node = walker.nextNode())) {
    let text = node.textContent;

    Object.entries(LABEL_FIELD_MAP).forEach(([field, labels]) => {
      const value = getClientValue(field, clientData);
      if (!value) return;

      labels.forEach((label) => {
        const regex = new RegExp(`(${label}\\s*:?\\s*)([_\\.\\-\\s]*)$`, "i");
        if (regex.test(text.trim())) {
          text = text.replace(regex, `$1${value}`);
        }
      });
    });

    node.textContent = text;
  }

  return container.innerHTML;
};

const CheckListCreate = () => {
  const { control, handleSubmit } = useForm();
  const editorRef = useRef(null);
  const [clients, setClients] = useState([]);
  const [journals, setJournals] = useState([]);
  const [surveyTypes, setSurveyTypes] = useState([]);
  const [selectedShip, setSelectedShip] = useState(null);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [htmlContent, setHtmlContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [systemVariables, setSystemVariables] = useState([]);
  const [noChecklist, setNoChecklist] = useState(false);
  const isLoadingNewDocument = useRef(false);
  const [existingChecklist, setExistingChecklist] = useState(null);
  const [buttonText, setButtonText] = useState("Submit");

  const FIELD_WIDTH = 400;
  const LABEL_PROPS = {
    mt: 0,
    mb: 0,
  };

  const fetchExistingChecklist = async () => {
    // ✅ EXACT guard from working code
    if (!selectedShip?.id || !selectedJournal?.id || !selectedSurvey) {
      return;
    }

    try {
      setLoading(true);
      const response = await getAllChecklist();

      if (response?.data?.status === "success" && response.data?.data) {
        const allChecklists = response.data.data;

        const matchingChecklist = allChecklists.find((checklist) => checklist.clientId === String(selectedShip?.id) && checklist.reportNo === String(selectedJournal.id) && checklist.typeOfSurvey === String(selectedSurvey));

        if (matchingChecklist) {
          setExistingChecklist(matchingChecklist);

          // ✅ ALWAYS Update if checklist exists
          setButtonText("Update");

          if (matchingChecklist.checkListData?.checkList) {
            setHtmlContent(matchingChecklist.checkListData.checkList);

            setTimeout(() => {
              editorRef.current?.setContent(matchingChecklist.checkListData.checkList);
            }, 0);
          }

          toast.info("Existing checklist loaded for editing");
        } else {
          setExistingChecklist(null);
          setButtonText("Submit");
        }
      } else {
        setExistingChecklist(null);
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
  }, [selectedShip?.id, selectedJournal?.id, selectedSurvey]);

  /* =======================
     FETCH DATA
  ======================= */

  useEffect(() => {
    getAllSystemVariables().then((res) => {
      if (res?.data?.status === "success") {
        setSystemVariables(res.data.data);
      }
    });

    getAllClients().then((res) => {
      if (res?.data?.status === "success") {
        setClients(res.data.data);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedShip) return;

    fetchJournalList(selectedShip.id).then((res) => {
      if (res?.data?.status === "success") {
        setJournals(res.data.data);
      }
    });

    getSpecificClient(selectedShip.id).then((res) => {
      if (res?.status === 200) {
        setClientData(res.data.data);
      }
    });
  }, [selectedShip]);

  useEffect(() => {
    if (!selectedJournal) return;

    getAllActivities("journalId", selectedJournal.id).then((res) => {
      if (res?.data?.status === "success") {
        setSurveyTypes(res.data.data);
      }
    });
  }, [selectedJournal]);

  /* =======================
     LOAD DOC
  ======================= */
  const normalizeEmptyTableCells = (html) => {
    const container = document.createElement("div");
    container.innerHTML = html;

    container.querySelectorAll("td, th").forEach((cell) => {
      if (!cell.textContent.trim()) {
        cell.innerHTML = "&nbsp;";
      }
    });

    return container.innerHTML;
  };

  const loadChecklistDoc = async (docUrl) => {
    if (!docUrl) {
      setHtmlContent("");
      setNoChecklist(true);
      return;
    }

    try {
      setLoading(true);
      setNoChecklist(false);

      const response = await fetch(docUrl);
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer: buffer });

      let html = result.value;

      const company_name = systemVariables.find((v) => v.name === "company_name")?.information;
      const company_logo = systemVariables.find((v) => v.name === "company_logo")?.information;

      html = injectCompanyHeader(html, { company_name, company_logo });
      html = prepopulateFields(html, clientData);
      html = normalizeEmptyTableCells(html);

      setHtmlContent(html);
      toast.success("Checklist loaded successfully");
    } catch {
      toast.error("Failed to load checklist");
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     SUBMIT
  ======================= */

  const onSubmit = async () => {
    const payload = {
      clientId: selectedShip.id,
      reportNo: selectedJournal.id,
      typeOfSurvey: [String(selectedSurvey)],
      checkListData: {
        checkList: editorRef.current.getContent(),
      },
    };

    try {
      if (existingChecklist?.id) {
        await updateCheckList(existingChecklist.id, payload);
        toast.success("Checklist updated successfully");
      } else {
        await addCheckList(payload);
        toast.success("Checklist saved successfully");
      }
    } catch {
      toast.error("Save failed");
    }
  };

  /* =======================
     UI
  ======================= */

  return (
    <CommonCard>
      <Stack>
        <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }} {...LABEL_PROPS}>
          Select Ship
        </Typography>

        <FormControl sx={{ maxWidth: 400 }}>
          <Select
            value={selectedShip?.id || ""}
            onChange={(e) => {
              const ship = clients.find((c) => c.id === e.target.value);
              setSelectedShip(ship);
              setSelectedSurvey(null);
            }}
            displayEmpty
            size="small"
          >
            <MenuItem value="">
              <em>Select Ship</em>
            </MenuItem>
            {clients.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.shipName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedShip && (
          <>
            <Typography variant="body1" fontWeight="bold" mb={1} mt={1}>
              Select Report
            </Typography>
            <FormControl sx={{ maxWidth: 400 }}>
              <Select
                value={selectedJournal?.id || ""}
                onChange={(e) => {
                  const journal = journals.find((j) => j.id === e.target.value);
                  setSelectedJournal(journal);
                  setSelectedSurvey(null);
                  setSurveyTypes([]);
                  setHtmlContent("");
                  setNoChecklist(false);
                  setExistingChecklist(null);
                  isLoadingNewDocument.current = false;

                  // clear TinyMCE content safely
                  editorRef.current?.setContent("");
                }}
                displayEmpty
                size="small"
              >
                <MenuItem value="">
                  <em>Select Report</em>
                </MenuItem>
                {journals.map((j) => (
                  <MenuItem key={j.id} value={j.id}>
                    {j.journalTypeId}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        )}

        {selectedJournal && (
          <>
            <Box sx={{ width: FIELD_WIDTH }}>
              <Typography variant="body1" fontWeight="bold" mt={1} mb={1}>
                Select Survey Type
              </Typography>
              <Controller
                name="survey"
                control={control}
                render={() => (
                  <Autocomplete
                    sx={{ marginBottom: "15px" }}
                    size="small"
                    options={surveyTypes.map((s) => ({
                      label: s.surveyTypes.name,
                      value: s.surveyTypes.id,
                      doc: s.surveyTypes.checkListDocument,
                    }))}
                    value={
                      surveyTypes
                        .map((s) => ({
                          label: s.surveyTypes.name,
                          value: s.surveyTypes.id,
                          doc: s.surveyTypes.checkListDocument,
                        }))
                        .find((opt) => opt.value === selectedSurvey) || null
                    }
                    onChange={async (_, val) => {
                      const surveyId = val?.value || null;
                      setButtonText("Submit");
                      setSelectedSurvey(surveyId);
                      setExistingChecklist(null);
                      setHtmlContent("");
                      editorRef.current?.setContent("");
                      setNoChecklist(false);

                      if (!val?.doc) {
                        setNoChecklist(true);
                        return;
                      }
                      isLoadingNewDocument.current = true;

                      await loadChecklistDoc(val.doc);
                      isLoadingNewDocument.current = false;
                      fetchExistingChecklist();
                    }}
                    renderInput={(params) => <TextField {...params} size="small" />}
                  />
                )}
              />
            </Box>
          </>
        )}

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "80%",
          }}
        >
          {loading && <CircularProgress />}
        </Box>
        {noChecklist && (
          <Typography textAlign="center" fontWeight="bold" mt={5} mb={5}>
            No checklist attached
          </Typography>
        )}

        {!loading && htmlContent && (
          <>
            <Editor
              apiKey="p9j94lg0okz82u9rr4v3zhap0pimbq1hob48rzesv3c5dylj"
              onInit={(evt, editor) => (editorRef.current = editor)}
              initialValue={htmlContent}
              init={{
                height: 600,
                menubar: false,
                branding: false,
                forced_root_block: false,
                plugins: ["table", "lists", "paste", "code"],
                toolbar: "undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist | table | code",
                content_style: `
    body { font-family: Arial; font-size: 14px; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #000; padding: 6px; }
  `,
              }}
            />

            {htmlContent && <CommonButton text={buttonText} variant="contained" onClick={handleSubmit(onSubmit)} />}
          </>
        )}
      </Stack>
    </CommonCard>
  );
};

export default CheckListCreate;
