"use client";

import React, { useEffect, useRef, useState } from "react";
import { Box, Typography, Select, MenuItem, FormControl, TextField, Autocomplete, Stack, CircularProgress } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import mammoth from "mammoth";
import { toast } from "react-toastify";

import { getAllClients, fetchJournalList, getAllActivities, getSpecificClient, addCheckList, updateCheckList, getAllChecklist, getAllSystemVariables } from "@/api";

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

const injectCompanyHeader = (html, systemVariables) => {
  if (!systemVariables?.company_name && !systemVariables?.company_logo) return html;

  const container = document.createElement("div");
  container.innerHTML = html;

  // Prevent duplicate header
  if (container.querySelector('[data-company-header="true"]')) {
    return html;
  }

  const header = document.createElement("div");
  header.setAttribute("data-company-header", "true");
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";
  header.style.marginBottom = "24px";
  header.style.borderBottom = "1px solid #ccc";
  header.style.paddingBottom = "12px";

  // Logo
  if (systemVariables.company_logo) {
    const logo = document.createElement("img");
    logo.src = systemVariables.company_logo;
    logo.alt = "Company Logo";
    logo.style.height = "80px";
    logo.style.objectFit = "contain";
    header.appendChild(logo);
  }

  // Company Name
  if (systemVariables.company_name) {
    const name = document.createElement("div");
    name.textContent = systemVariables.company_name;
    name.style.fontSize = "18px";
    name.style.fontWeight = "700";
    name.style.textAlign = "right";
    header.appendChild(name);
  }

  container.prepend(header);

  return container.innerHTML;
};

const getClientValue = (field, client) => {
  console.log(client, "client");
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
   TEXT-ONLY AUTO FILL
======================= */

const prepopulateFields = (html, clientData) => {
  if (!clientData) return html;

  const container = document.createElement("div");
  container.innerHTML = html;

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);

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

/* =======================
   COMPONENT
======================= */

const CheckListCreate = () => {
  const { control, handleSubmit } = useForm();

  const editableRef = useRef(null);
  const isLoadingDoc = useRef(false);

  const [clients, setClients] = useState([]);
  const [journals, setJournals] = useState([]);
  const [surveyTypes, setSurveyTypes] = useState([]);

  const [selectedShip, setSelectedShip] = useState(null);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [selectedSurvey, setSelectedSurvey] = useState(null);

  const [clientData, setClientData] = useState(null);
  const [htmlContent, setHtmlContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingChecklist, setExistingChecklist] = useState(null);
  const [systemVariables, setSystemVariables] = useState(null);
  console.log(systemVariables, "system variables");

  const companyName = systemVariables?.find((item) => item.name === "company_name")?.information || "-";
  const companyLogo = systemVariables?.find((item) => item.name === "company_logo")?.information || "-";
  console.log(companyName, companyLogo, "test");
  /* =======================
     FETCH DATA
  ======================= */

  useEffect(() => {
    fetchSystemVariables();
    getAllClients().then((res) => {
      if (res?.data?.status === "success") {
        setClients(res.data.data);
      }
    });
  }, []);

  const fetchSystemVariables = async () => {
    let res = await getAllSystemVariables();
    if (res?.data?.status === "success") {
      setSystemVariables(res.data.data);
    }
  };

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
     LOAD DOCUMENT
  =======================
   */
  const normalizedSystemVariables = {
    company_name: companyName,
    company_logo: companyLogo,
  };

  const loadChecklistDoc = async (docUrl) => {
    try {
      setLoading(true);

      const response = await fetch(docUrl);
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();

      const result = await mammoth.convertToHtml({ arrayBuffer: buffer });

      let html = result.value;

      // ✅ 1. Inject company logo + name at TOP
      html = injectCompanyHeader(html, normalizedSystemVariables);

      // ✅ 2. Auto-fill Name of Ship, IMO, Port, etc.
      html = prepopulateFields(html, clientData);

      setHtmlContent(html);

      toast.success("Checklist loaded with company header & client data");
    } catch (err) {
      console.error(err);
      toast.error("Failed to load checklist");
    } finally {
      setLoading(false);
      isLoadingDoc.current = false;
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
        checkList: editableRef.current.innerHTML,
      },
    };

    try {
      const res = existingChecklist ? await updateCheckList(existingChecklist.id, payload) : await addCheckList(payload);

      if (res?.data?.status === "success") {
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
      <Stack spacing={3}>
        {/* Ship */}
        <FormControl sx={{ maxWidth: 400 }}>
          <Select value={selectedShip?.id || ""} onChange={(e) => setSelectedShip(clients.find((c) => c.id === e.target.value))} displayEmpty size="small">
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

        {/* Report */}
        {selectedShip && (
          <FormControl sx={{ maxWidth: 400 }}>
            <Select value={selectedJournal?.id || ""} onChange={(e) => setSelectedJournal(journals.find((j) => j.id === e.target.value))} displayEmpty size="small">
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
        )}

        {/* Survey */}
        {selectedJournal && (
          <Controller
            name="survey"
            control={control}
            render={({ field }) => (
              <Autocomplete
                options={surveyTypes.map((s) => ({
                  label: s.surveyTypes.name,
                  value: s.surveyTypes.id,
                  doc: s.surveyTypes.checkListDocument,
                }))}
                onChange={(_, val) => {
                  setSelectedSurvey(val?.value);
                  if (val?.doc) loadChecklistDoc(val.doc);
                }}
                renderInput={(params) => <TextField {...params} size="small" />}
              />
            )}
          />
        )}

        {loading && <CircularProgress />}

        {/* Editor */}
        {!loading && htmlContent && (
          <>
            <Box
              ref={editableRef}
              contentEditable
              suppressContentEditableWarning
              dangerouslySetInnerHTML={{ __html: htmlContent }}
              sx={{
                border: "1px solid #ccc",
                minHeight: 400,
                p: 2,
                borderRadius: 2,
              }}
            />
            <CommonButton text="Submit" variant="contained" onClick={handleSubmit(onSubmit)} />
          </>
        )}
      </Stack>
    </CommonCard>
  );
};

export default CheckListCreate;
