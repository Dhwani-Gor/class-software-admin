"use client";
import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import CommonButton from "@/components/CommonButton";
import CommonCard from "@/components/CommonCard";
import Grid2 from "@mui/material/Grid2";
import FullScreenRemarksDialog from "./FullScreenRemarksDialog";
import { createReportDetail, generateFullReport, getAllClients, getAllJournals, getEndorsedIssuedBy, getSelectedActivityReportDetails, getSelectedReportDetails, updateReportDetail, addArchiveDocument, addUnArchiveDocument, updateActivityDetails, getSystemVariableDetails, getAllSystemVariables } from "@/api";
import { toast } from "react-toastify";
import { TYPE_OF_SURVEYS } from "@/data";
import { getAllActivities } from "@/api";
import moment from "moment";
import { Checkbox, FormControlLabel, Stack } from "@mui/material";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { DialogForm } from "../documents/CommonDocumentForm";
import InternationalTonnage from "../documents/TonnageCertificateForm";
import IOPPForm from "../documents/OilPollutionPreventionCertificateForm";
import CSSForm from "../documents/CargoShipEquipmentRecordForm";
import LoadLineCertificateForm from "../documents/LoadLineCertificateForm";
import AntiFoulingCertificateForm from "../documents/AntiFoulingCertificateForm";
import IAPPForm from "../documents/RecordOfConstructioCertificate";
import { hiddenReports } from "@/utils/DocumentList";
import { useAuth } from "@/hooks/useAuth";
import ConfirmationPopup from "./ConfirmationPopup";
import CommonInput from "@/components/CommonInput";
import ActivityTable from "./ActivityTable";
import AmendmentRemarksDialog from "./AmendmentRemarksDialog";
import EditingReasonDialog from "../Dialogs/EditingReasonDialog";
import ArchiveHistoryDialog from "../Dialogs/ArchiveHistoryDialog";
import EndorsementDialog from "../documents/EndorsementDialog";
import { calculateDates } from "@/utils/DateCalculation";

const ReportingForm = () => {
  const { data } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clientsList, setClientsList] = useState([]);
  const [shipName, setShipName] = useState("");
  const [journals, setJournals] = useState([]);
  const [fullScreenRemarksVisible, setFullScreenRemarksVisible] = useState(null);
  const [selectedShip, setSelectedShip] = useState({ id: "", shipName: "" });
  const [specialPermission, setSpecialPermission] = useState(false);
  const [filteredJournals, setFilteredJournals] = useState([]);
  const [openEndrosemet, setOpenEndrosemet] = useState(false);
  const [endorsementTitle, setEndorsementTitle] = useState([]);
  const [selectedReportNumber, setSelectedReportNumber] = useState({
    journalTypeId: "",
    index: null,
  });
  const [selectCertificate, setSelectCertificate] = useState("");
  const [showTable, setShowTable] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [reportDetails, setReportDetails] = useState();
  const [tableData, setTableData] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [journalId, setjournalId] = useState(null);
  const [endorsedIssuedBy, setEndorsedIssuedBy] = useState([]);
  const [selectSurveyor, setSelectSurveyor] = useState("");
  const [open, setOpen] = useState();
  const [underscoreFields, setUnderscoreFields] = useState([]);
  const [reportName, setReportName] = useState("");
  const [showExtraEndorsementField, setShowExtraEndorsementField] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [isOpenArchiveModal, setIsOpenArchiveModal] = useState(false);
  const [continueBtnLoading, setContinueBtnLoading] = useState(false);
  const [showAmendmentDialog, setShowAmendmentDialog] = useState(false);
  const [isOpenConfirmModal, setIsOpenConfirmModal] = useState(false);
  const [amdRemarks, setAmdRemarks] = useState("");
  const [showArchiveHistoryDialog, setShowArchiveHistoryDialog] = useState(false);
  const [archiveHistory, setArchiveHistory] = useState([]);
  const [endorsements, setEndorsements] = useState([]);
  const [surveyType, setSurveyType] = useState(false);
  const [endorsementDate, setEndorsementDate] = useState(null);
  const [doingEndorsement, setDoingEndorsement] = useState(false);
  const [systemVariable, setSystemVariable] = useState([]);
  const [stampId, setStampId] = useState(null);
  const [companyLogoId, setCompanyLogoId] = useState(null);
  const [endorsementStamp, setEndorsementStamp] = useState(null);

  useEffect(() => {
    if (reportDetails) {
      setEndorsementDate(reportDetails.endorsementDate);
    }
  }, [reportDetails]);

  const reportSchema = yup.object().shape({
    typesOfSurvey: yup.string().required("Type of survey is required"),
    typeOfCertificate: yup.string(),
    issuancedate: yup.string().optional(),
    validitydate: yup.string().when([], {
      is: () => !surveyType && !hiddenReports.includes(reportName),
      then: (schema) => schema.required("Validity date is required"),
      otherwise: (schema) => schema.optional(),
    }),
    surveydate: yup.string().when([], {
      is: () => !surveyType,
      then: (schema) => schema.required("Survey date is required"),
    }),
    endorsementdate: yup.string().optional(),
    issuedBy: yup.string().when([], {
      is: () => !surveyType,
      then: (schema) => schema.required("Issued by is required"),
      otherwise: (schema) => schema.optional(),
    }),

    place: yup.string().when([], {
      is: () => !surveyType,
      then: (schema) => schema.required("Place is required"),
      otherwise: (schema) => schema.optional(),
    }),
    newValidityDate: yup.string().when([], {
      is: () => showExtraEndorsementField || reportDetails?.typeOfCertificate === "extended",
      then: (schema) => schema.required("New validity date is required"),
      otherwise: (schema) => schema.optional(),
    }),

    rangeFrom: yup.string().optional(),
    rangeTo: yup.string().optional(),
    assignmentDate: yup.string().optional(),
    dueDate: yup.string().optional(),
    postponed: yup.string().optional(),
    certificateBaseDate: yup.string().optional(),
  });

  useEffect(() => {
    if (selectCertificate === "full_term") {
      setShowExtraEndorsementField(false);
    } else if (selectCertificate === "short_term" || selectCertificate === "interim") {
      setShowExtraEndorsementField(false);
    } else if (selectCertificate === "extended") {
      setShowExtraEndorsementField(true);
    } else {
      setShowExtraEndorsementField(false);
    }
  }, [selectCertificate]);

  useEffect(() => {
    if (!journals) return;
    const data = specialPermission ? journals.archived : journals.unarchived;
    setFilteredJournals(data);
  }, [specialPermission, journals]);

  const handleSpecialPermission = (event) => {
    const checked = event.target.checked;
    setSpecialPermission(checked);
    setSelectedReportNumber({});
    setShowTable(false);
  };

  const renderReportForm = () => {
    const trimmedReportName = reportName?.trim();
    const commonProps = {
      open,
      onClose: () => setOpen(false),
      onSubmit: handleSubmitReport,
      fields: underscoreFields,
      reportDetails: reportDetails?.data,
    };

    switch (trimmedReportName) {
      case "INTERNATIONAL TONNAGE CERTIFICATE":
        return <InternationalTonnage {...commonProps} />;
      case "SUPPLEMENT TO THE INTERNATIONAL OIL POLLUTION PREVENTION CERTIFICATE":
      case "INTERNATIONAL OIL POLLUTION PREVENTION CERTIFICATE":
        return <IOPPForm {...commonProps} />;
      case "RECORD OF EQUIPMENT FOR CARGO SHIP SAFETY":
      case "CARGO SHIP SAFETY EQUIPMENT CERTIFICATE":
        return <CSSForm {...commonProps} />;
      case "INTERNATIONAL LOAD LINE CERTIFICATE":
        return <LoadLineCertificateForm {...commonProps} />;
      case "International Anti-Fouling System Statement of Compliance":
        return <AntiFoulingCertificateForm {...commonProps} />;
      case "RECORD OF CONSTRUCTION AND EQUIPMENT":
      case "INTERNATIONAL AIR POLLUTION PREVENTION CERTIFICATE":
        return <IAPPForm {...commonProps} />;
      default:
        return <DialogForm {...commonProps} />;
    }
  };

  const {
    control,
    getValues,
    setValue,
    trigger,
    watch,
    formState: { errors },
    clearErrors,
  } = useForm({
    defaultValues: {
      remarks: "",
      typesOfSurvey: "",
      typeOfCertificate: "",
      issuancedate: "",
      validitydate: "",
      surveydate: "",
      endorsementdate: "",
      issuedBy: "",
      place: "",
      rangeFrom: "",
      rangeTo: "",
      assignmentDate: "",
      dueDate: "",
      postponed: "",
      certificateBaseDate: "",
    },
    resolver: yupResolver(reportSchema),
  });

  const certificateList = [
    { value: "interim", label: "Interim" },
    { value: "short_term", label: "Short Term" },
    { value: "full_term", label: "Full Term" },
    { value: "extended", label: "Extended" },
  ];

  const areAnyActivitiesPending = () => {
    return tableData?.some((activity) => activity.status !== "Completed");
  };

  const getSystemVariable = async () => {
    const response = await getAllSystemVariables();
    const vars = response?.data?.data || [];

    if (vars.length > 0) {
      setSystemVariable(vars);

      const stamp = vars.find((item) => item.name === "company_stamp")?.id || null;
      const logo = vars.find((item) => item.name === "company_logo")?.id || null;

      setStampId(stamp);
      setCompanyLogoId(logo);
      setEndorsementStamp(stamp);
    }
  };

  useEffect(() => {
    getSystemVariable();
  }, []);
  const handleClientChange = (event) => {
    const selectedId = event.target.value;
    const selectedClient = clientsList.find((client) => client.id === selectedId);
    setSelectedShip({
      id: selectedId,
      shipName: selectedClient ? selectedClient.shipName : "",
    });
    setShipName(selectedClient?.shipName);
  };

  const handleReportNumber = (event) => {
    setShowTable(false);
    const selectedJournalTypeId = event.target.value;
    const selectedIndex = filteredJournals.findIndex((j) => j.journalTypeId === selectedJournalTypeId);
    const selectedJournal = filteredJournals[selectedIndex];
    setjournalId(selectedJournal?.id);
    setSelectedReportNumber({
      journalTypeId: selectedJournalTypeId,
      index: selectedIndex !== -1 ? selectedIndex : null,
    });
    setTableData(selectedJournal?.activities || []);
    setArchiveHistory(selectedJournal?.journalRemarks || []);

    setShowForm(false);
    setSelectedRow(null);
    setReportDetails(undefined);
    setSelectCertificate("");
    setSelectSurveyor("");
    setReportName("");
    setShowExtraEndorsementField(false);

    setValue("typesOfSurvey", "");
    setValue("typeOfCertificate", "");
    setValue("issuancedate", "");
    setValue("validitydate", "");
    setValue("surveydate", "");
    setValue("endorsementdate", "");
    setValue("issuedBy", "");
    setValue("place", "");
    setValue("newValidityDate", "");
    setValue("assignmentDate", "");
    setValue("rangeFrom", "");
    setValue("rangeTo", "");
    setValue("dueDate", "");
    setValue("postponed", "");
    setValue("certificateBaseDate", "");
    clearErrors();
  };

  const watchedFields = watch(["dueDate", "rangeFrom", "rangeTo", "anniversaryDate"]);

  const handleCertificate = (event) => {
    const value = event.target.value;
    setSelectCertificate(value);
    setValue("typeOfCertificate", value);
    if (value && errors.typeOfCertificate) {
      clearErrors("typeOfCertificate");
    }
  };

  const handleSurveyor = (event) => {
    const value = event.target.value;
    setSelectSurveyor(value);
    setValue("issuedBy", value);
    if (value && errors.issuedBy) {
      clearErrors("issuedBy");
    }
  };

  const normalizeName = (name) =>
    name
      ?.toLowerCase()
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\(\s+/g, "(")
      .replace(/\s+\)/g, ")")
      .replace(/\s*\(\s*/g, " (")
      .replace(/\s*\)\s*/g, ")");

  const fiveYearSpecials = ["special survey hull", "special survey machinery", "special survey ig system", "special survey (fi-fi)", "special survey (ums)", "continuous survey hull", "continuous survey machinery"];

  const enforceAnniversaryLimit = (date) => {
    const annivDate = getValues("anniversaryDate");
    if (!annivDate || !date) return date;

    return moment(date).isAfter(moment(annivDate)) ? moment(annivDate).format("YYYY-MM-DD") : date;
  };

  const applyAnniversaryDayMonth = (baseDate) => {
    const anniv = getValues("anniversaryDate");
    if (!anniv) return baseDate;

    const annivMoment = moment(anniv);
    const base = moment(baseDate);

    return base.month(annivMoment.month()).date(annivMoment.date()).format("YYYY-MM-DD");
  };

  const normalize = (str) => str.replace(/\(\s*/g, "(").replace(/\s*\)/g, ")");

  const calculateDueDateBase = (value, surveyType) => {
    let yearsToAdd = 0;
    const isFiveYearSpecial = fiveYearSpecials.includes(normalize(surveyType));
    if (isFiveYearSpecial) {
      // Add 5 years first
      let due = moment(value).add(5, "years");
      // Then subtract 1 day
      due = due.subtract(1, "day");
      return due.format("YYYY-MM-DD");
    }

    if (!isFiveYearSpecial && (surveyType.includes("special") || surveyType.includes("continuous") || surveyType.includes("renewal") || surveyType.includes("intermediate"))) {
      yearsToAdd = 1;
    }

    if (surveyType.includes("annual")) yearsToAdd = 1;

    if (surveyType === "docking survey" || surveyType === "main boiler survey" || surveyType === "auxiliary boiler survey" || surveyType === "thermal oil heating systems survey" || surveyType === "exhaust gas steam generators and economisers survey") {
      yearsToAdd = 2;
    }

    if (surveyType === "in water survey") yearsToAdd = 3;

    if (surveyType === "tailshaft initial survey" || surveyType === "tailshaft periodical survey" || surveyType === "tailshaft renewal survey") {
      yearsToAdd = 5;
    }
    if (yearsToAdd === 0) {
      yearsToAdd = 5;
    }

    return moment(value).add(yearsToAdd, "years").format("YYYY-MM-DD");
  };

  const isWithinExistingRange = (value) => {
    const rangeFrom = getValues("rangeFrom");
    const rangeTo = getValues("rangeTo");

    if (!rangeFrom || !rangeTo) return false;

    const v = moment(value, "YYYY-MM-DD");
    return v.isSameOrAfter(moment(rangeFrom, "YYYY-MM-DD")) && v.isSameOrBefore(moment(rangeTo, "YYYY-MM-DD"));
  };

  const applyRangeFromDueDate = (dueDate, surveyType) => {
    if (!dueDate) return;

    const due = moment(dueDate);
    let rangeFrom = "";
    let rangeTo = "";

    const isFiveYearSpecial = fiveYearSpecials.includes(normalize(surveyType));
    const noRangeSurveys = ["docking survey", "tailshaft initial survey", "tailshaft renewal survey", "tailshaft periodical survey", "main boiler survey", "auxiliary boiler survey", "thermal oil heating systems survey", "exhaust gas steam generators and economisers survey"];

    if (noRangeSurveys.includes(normalize(surveyType))) {
      rangeFrom = "";
      rangeTo = "";
    } else if (isFiveYearSpecial) {
      rangeFrom = moment(due).add(-3, "months").format("YYYY-MM-DD");
      rangeTo = dueDate;
      setValue("validitydate", dueDate);
    } else if (surveyType?.toLowerCase().includes("annual")) {
      rangeFrom = moment(due).add(-3, "months").format("YYYY-MM-DD");
      rangeTo = moment(due).add(3, "months").format("YYYY-MM-DD");
    } else {
      rangeFrom = moment(due).add(-3, "months").format("YYYY-MM-DD");
      rangeTo = moment(due).add(3, "months").format("YYYY-MM-DD");
    }

    rangeTo = enforceAnniversaryLimit(rangeTo);

    setValue("rangeFrom", rangeFrom);
    setValue("rangeTo", rangeTo);
  };

  const handleFieldChange = (fieldName, value) => {
    if (!value) return;

    if (errors[fieldName]) clearErrors(fieldName);

    const surveyType = normalizeName(getValues("typesOfSurvey"));

    const skipAutoCalc = fieldName === "surveydate" || fieldName === "assignmentDate" ? isWithinExistingRange(value) : false;

    if (skipAutoCalc) {
      setValue(fieldName, value);
      return;
    }
    if (fieldName === "surveydate") {
      setValue("assignmentDate", value);

      const baseDue = calculateDueDateBase(value, surveyType);
      const dueDate = applyAnniversaryDayMonth(baseDue);

      setValue("dueDate", dueDate);
      applyRangeFromDueDate(dueDate, surveyType);

      trigger(["dueDate", "rangeFrom", "rangeTo", "anniversaryDate"]);
    }

    if (fieldName === "assignmentDate") {
      const baseDue = calculateDueDateBase(value, surveyType);
      const dueDate = applyAnniversaryDayMonth(baseDue);

      setValue("dueDate", dueDate);
      applyRangeFromDueDate(dueDate, surveyType);

      trigger(["dueDate", "rangeFrom", "rangeTo", "anniversaryDate"]);
    }

    if (fieldName === "dueDate") {
      applyRangeFromDueDate(value, surveyType);
    }

    if (fieldName === "rangeFrom") {
      const dueDate = getValues("dueDate");
      if (!dueDate) return;

      if (surveyType.includes("annual")) {
        setValue("rangeTo", moment(dueDate).add(3, "months").format("YYYY-MM-DD"));
      } else if (surveyType.includes("special") || surveyType.includes("continuous") || surveyType.includes("renewal") || surveyType.includes("intermediate")) {
        setValue("rangeTo", dueDate);
      }
    }
  };

  const formatToDayMonth = (value) => {
    if (!value) return "";
    const [y, m, d] = value.split("-");
    return `${d}/${m}`;
  };

  const handleShowTable = () => {
    setShowTable(true);
    getAllActivity(journalId);
  };

  const manageArchive = async (remark = "") => {
    try {
      setContinueBtnLoading(true);

      const payload = {
        clientId: selectedShip.id,
        journalId,
        archiveRemarks: remark,
      };

      if (specialPermission && data.specialPermission?.includes("Archive/Unarchive")) {
        const result = await addUnArchiveDocument(payload);
        if (result?.data?.status === "success") {
          setShowTable(false);
          fetchAllJournals();
          setIsOpenConfirmModal(false);
          setSelectedReportNumber({});
          toast.success(result.data.message);
        } else {
          toast.error("Failed to unarchive");
        }
      } else {
        const result = await addArchiveDocument(payload);
        if (result?.data?.status === "success") {
          setIsOpenConfirmModal(false);
          setShowTable(false);
          fetchAllJournals();
          setIsOpenArchiveModal(false);
          setSelectedReportNumber({});
          toast.success(result.data.message);
        } else {
          toast.error(result?.response?.data?.message);
          setIsOpenConfirmModal(false);
        }
      }
    } catch (error) {
      console.error("Archive/Unarchive error:", error);
      toast.error(error?.message || "Failed to process");
    } finally {
      setIsOpenArchiveModal(false);
      setContinueBtnLoading(false);
      setShowAmendmentDialog(false);
    }
  };

  const handleContinue = async () => {
    if (!selectedShip.id) {
      toast.error("Client ID not found");
      return;
    }
    if (areAnyActivitiesPending() && !specialPermission) {
      setIsOpenArchiveModal(true);
    } else {
      setIsOpenConfirmModal(true);
    }
  };

  const handleGenerateReport = async () => {
    const isValid = await trigger();
    if (!isValid) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    const values = getValues();
    const formatDate = (date) => {
      return date ? new Date(date).toISOString() : null;
    };

    const payload = {
      activityId: selectedRow?.id,
      typeOfSurvey: values.typesOfSurvey || null,
      typeOfCertificate: values.typeOfCertificate || null,
      issuanceDate: values.issuancedate ? formatDate(values.issuancedate) : null,
      surveyDate: values.surveydate ? formatDate(values.surveydate) : null,
      issuedBy: Number(values.issuedBy) || null,
      place: values.place || "",
      isEndorsement: doingEndorsement ? true : false,
      validityDate: hiddenReports?.includes(reportName) ? "" : values.validitydate ? formatDate(values.validitydate) : "",
      ...((selectCertificate === "full_term" || selectCertificate === "extended") && {
        endorsementDate: values.endorsementdate ? formatDate(values.endorsementdate) : null,
      }),
      ...(selectCertificate === "extended" && {
        newValidityDate: values.newValidityDate ? formatDate(values.newValidityDate) : "",
      }),
      rangeFrom: values.rangeFrom ? formatDate(values.rangeFrom) : null,
      rangeTo: values.rangeTo ? formatDate(values.rangeTo) : null,
      assignmentDate: values.assignmentDate ? formatDate(values.assignmentDate) : null,
      dueDate: values.dueDate ? formatDate(values.dueDate) : null,
      postponed: values.postponed ? formatDate(values.postponed) : null,
      certificateBaseDate: values.certificateBaseDate ? formatDate(values.certificateBaseDate) : null,
    };

    if (reportDetails) {
      updateReport(payload);
    } else {
      generateReport(payload);
    }
  };

  const generateReport = async (payload) => {
    try {
      setLoading(true);
      const result = await createReportDetail(payload);

      if (result?.data?.status === "success") {
        setReportDetails(result?.data?.data);
        toast.success("Report saved successfully.");
      } else {
        toast.error(result?.data?.message);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error(error?.message || "An error occurred");
    }
  };

  const updateReport = async (payload) => {
    try {
      setLoading(true);
      const result = await updateReportDetail(reportDetails?.id, payload);
      if (result?.data?.status === "success") {
        setReportDetails(result?.data?.data);
        toast.success(result?.data?.message || "Report updated successfully");
      } else {
        toast.error(result?.response?.data?.message);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error(error?.message || "An error occurred");
    }
  };

  const handleFullReportGeneration = async () => {
    setEndorsementTitle(endorsements);
    await fetchReportDetails(reportDetails?.id);
    if (reportDetails.lastUnarchivedAt !== null && endorsementDate == null) {
      setShowAmendmentDialog(true);
    } else {
      setOpen(true);
    }
  };

  const handleSubmitReport = async (extraFieldsOrEndorsements = []) => {
    setLoadingReport(true);
    try {
      const isArrayData = Array.isArray(extraFieldsOrEndorsements);

      const { endorsementValues: _, ...cleanReportData } = reportDetails.data || {};

      const payload = {
        reportDetailId: reportDetails?.id,
        data: {
          ...cleanReportData,
          ...(isArrayData && { endorsementValues: extraFieldsOrEndorsements }),
          ...(!isArrayData ? extraFieldsOrEndorsements : {}),
          type: "image",
          amdRemarks,
          stamp: stampId,
          companyText: 8,
          ...(reportName?.toLocaleLowerCase() === "certificate of class" && {
            logo: companyLogoId,
          }),
        },
      };

      const result = await generateFullReport(payload);
      if (result?.data?.status === "success" && result?.data?.message) {
        toast.success(result.data.message);
        setAmdRemarks("");
      } else if (result?.data?.data) {
        const fileUrl = result?.data?.data;
        if (fileUrl) {
          toast.success("Report generated successfully.");
          setOpen(false);
        }
      } else {
        throw new Error(result?.data?.message || "Failed to generate report");
      }
    } catch (err) {
      console.error("Error downloading report:", err);
      toast.error(err.message || "Failed to generate full report");
    } finally {
      setLoading(false);
      setLoadingReport(false);
    }
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      const result = await getAllClients();
      if (result?.status === 200) {
        setClientsList(result.data.data);
      } else {
        toast.error(result?.message);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error(error?.message || "Failed to fetch clients");
    }
  };

  const fetchReportDetails = async () => {
    if (reportDetails?.id) {
      const response = await getSelectedReportDetails(reportDetails?.id);
      setReportDetails(response?.data?.data);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchReportDetails();
    areAnyActivitiesPending();
  }, []);

  const fetchAllJournals = async () => {
    try {
      setLoading(true);
      const response = await getAllJournals({
        filterKey: "clientId",
        filterValue: selectedShip.id,
      });

      if (response?.response?.data?.status === "error") {
        toast.error(response?.response?.data?.message);
        return;
      }

      const payload = response?.data;
      if (payload?.status === "success") {
        setJournals({
          archived: payload.marksAsArchive || [],
          unarchived: payload.unarchived || [],
        });
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
    if (selectedShip.id) {
      fetchAllJournals();
    }
  }, [selectedShip.id]);

  const getSurveyTitle = (val) => {
    return TYPE_OF_SURVEYS.find((ele) => ele.value === val)?.label || val;
  };

  const getAllActivity = async (id) => {
    try {
      setLoading(true);
      const result = await getAllActivities("journalId", id);
      if (result?.data?.status === "success") {
        const activities = result?.data?.data;

        setTableData(activities);
        setArchiveHistory(result.data?.data[0]?.journal?.journalRemarks);
      } else {
        toast.error("Something went wrong ! Please try again after some time");
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error(error?.message || "Failed to fetch activity");
    }
  };

  useEffect(() => {
    if (journalId) {
      getAllActivity(journalId);
      getEndorsedIssuedByList(journalId);
    }
  }, [journalId]);

  const getEndorsedIssuedByList = async (journalId) => {
    try {
      const result = await getEndorsedIssuedBy("journalId", journalId);
      if (result?.data?.status === "success") {
        setEndorsedIssuedBy(result?.data.uniqueSurveyors);
      } else {
        toast.error("Something went wrong ! Please try again after some time");
      }
    } catch (error) {
      toast.error(error?.message || "Failed to fetch surveyors");
    }
  };

  const extractUnderscoreFields = (data) => {
    const fields = [];
    if (data && typeof data === "object") {
      data?.surveyTypes?.report?.fields?.forEach((field) => {
        if (field?.attribute?.startsWith("_")) {
          fields.push({
            label: field.label,
            attribute: field.attribute,
          });
        }
      });
    }
    return fields;
  };

  const surveyorOptions = endorsedIssuedBy.map((surveyor) => ({
    label: surveyor.name,
    value: surveyor.id,
  }));

  const handleReportClick = async (row) => {
    try {
      setLoading(true);
      const matchedActivity = tableData?.find((item) => item?.surveyTypes?.id == row?.surveyTypes?.id);
      const classificationFlag = matchedActivity?.surveyTypes?.classificationSurvey;
      setSurveyType(classificationFlag ?? false);
      const result = await getSelectedActivityReportDetails(row?.id);
      const reportData = result?.data?.data[0];
      setReportDetails(reportData);
      setEndorsements(reportData?.activity?.surveyTypes?.report?.endorsements);
      setReportName(row?.surveyTypes?.report?.name);

      setSelectedRow(row);
      setShowForm(true);
      clearErrors();
      const data = extractUnderscoreFields(row);
      setUnderscoreFields(data);
      setValue("typesOfSurvey", getSurveyTitle(row.surveyTypes?.name));
      setValue("typeOfCertificate", reportData?.typeOfCertificate || "");
      setSelectCertificate(reportData?.typeOfCertificate || "");
      setValue("issuancedate", reportData?.issuanceDate ? moment(reportData.issuanceDate).format("YYYY-MM-DD") : "");
      setValue("validitydate", reportData?.validityDate ? moment(reportData.validityDate).format("YYYY-MM-DD") : "");
      setValue("surveydate", reportData?.surveyDate ? moment(reportData.surveyDate).format("YYYY-MM-DD") : "");
      setValue("assignmentDate", reportData?.assignmentDate ? moment(reportData.assignmentDate).format("YYYY-MM-DD") : reportData?.surveyDate ? moment(reportData.surveyDate).format("YYYY-MM-DD") : "");
      setValue("dueDate", reportData?.dueDate ? moment(reportData.dueDate).format("YYYY-MM-DD") : "");
      setValue("rangeFrom", reportData?.rangeFrom ? moment(reportData.rangeFrom).format("YYYY-MM-DD") : "");
      setValue("rangeTo", reportData?.rangeTo ? moment(reportData.rangeTo).format("YYYY-MM-DD") : "");
      setValue("anniversaryDate", reportData?.anniversaryDate ? moment(reportData.anniversaryDate).format("YYYY-MM-DD") : "");
      setValue("postponed", reportData?.postponed ? moment(reportData.postponed).format("YYYY-MM-DD") : "");
      setValue("certificateBaseDate", reportData?.certificateBaseDate ? moment(reportData.certificateBaseDate).format("YYYY-MM-DD") : reportData?.surveyDate ? moment(reportData.surveyDate).format("YYYY-MM-DD") : "");
      setValue("endorsementdate", reportData?.endorsementDate ? moment(reportData.endorsementDate).format("YYYY-MM-DD") : "");
      setValue("place", reportData?.place || "");
      setValue("issuedBy", reportData?.issuedBy?.toString() || "");
      setSelectSurveyor(reportData?.issuedBy?.toString() || "");
    } catch (error) {
      toast.error(error?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const onClose = () => {
    setIsOpenArchiveModal(false);
    setIsOpenConfirmModal(false);
  };

  const onConfirm = () => {
    manageArchive();
  };

  const handleRemarksChange = async (id, value) => {
    const row = tableData.find((item) => item.id === id);
    if (row && row.maxLength && value?.length > row.maxLength) {
      return;
    }

    setTableData((prevData) => prevData.map((item) => (item.id === id ? { ...item, remarks: value } : item)));
    try {
      const response = await updateActivityDetails(id, { remarks: value });
      if (response?.data?.status === "success") {
        toast.success("Remarks updated successfully.");
      } else {
        toast.error("Something went wrong ! Please try again after some time");
      }
    } catch (error) {
      toast.error("Something went wrong ! Please try again after some time", error);
    }
  };

  const handleAmendmentSubmit = async (amendmentReason) => {
    setAmdRemarks(amendmentReason);
    setShowAmendmentDialog(false);
    setOpen(true);
  };

  return (
    <Box mt={2}>
      <CommonCard sx={{ mt: 2 }}>
        <Typography variant="h6" fontWeight={700}>
          Preliminary Report
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
            <CircularProgress />
          </Box>
        ) : (
          <Box mt={3}>
            <Box>
              <FormControl fullWidth sx={{ maxWidth: 300 }}>
                <Typography variant="body1" mb={1}>
                  Select the Ship / Work
                </Typography>
                <Select value={selectedShip.id || ""} onChange={handleClientChange} displayEmpty>
                  <MenuItem value="" disabled>
                    Select the Ship / Work
                  </MenuItem>
                  {clientsList.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.shipName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {selectedShip?.id && (
              <Box mt={2} width="100%" display="block">
                {data?.specialPermission?.includes("Archive/Unarchive") && <FormControlLabel control={<Checkbox checked={specialPermission} onChange={handleSpecialPermission} color="primary" />} label="Show Archived Reports" sx={{ mb: 2, display: "block" }} />}
                <Box display="flex">
                  <FormControl fullWidth sx={{ maxWidth: 300 }}>
                    <Typography variant="body1" mb={1} display="block">
                      Select Report Number
                    </Typography>
                    <Select value={selectedReportNumber.journalTypeId || ""} onChange={handleReportNumber} displayEmpty fullWidth>
                      {filteredJournals?.length > 0 ? (
                        <MenuItem value="" disabled>
                          Select Report
                        </MenuItem>
                      ) : (
                        <MenuItem disabled>{specialPermission ? "No Archived Journals found" : "No Unarchived Journals found"}</MenuItem>
                      )}
                      {filteredJournals?.map((report) => (
                        <MenuItem key={report.id} value={report.journalTypeId}>
                          {report.journalTypeId}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            )}
            {selectedShip.id && selectedReportNumber.journalTypeId && (
              <>
                <CommonButton onClick={handleShowTable} sx={{ marginTop: 3 }} text="Continue" />
                {selectedShip.id && selectedReportNumber.journalTypeId && data?.specialPermission?.includes("Archive/Unarchive") && <CommonButton onClick={handleContinue} sx={{ marginTop: 3, marginLeft: 2 }} disabled={!tableData?.length > 0} text={specialPermission ? "Unarchive" : "Archive"} />}
                {archiveHistory?.length > 0 && <CommonButton onClick={() => setShowArchiveHistoryDialog(true)} sx={{ marginTop: 3, marginLeft: 2 }} text="Show Archive Remarks History" />}
              </>
            )}
          </Box>
        )}
      </CommonCard>
      {showTable && <ActivityTable tableData={tableData} setTableData={setTableData} setShowForm={setShowForm} setFullScreenRemarksVisible={setFullScreenRemarksVisible} handleReportClick={handleReportClick} getSurveyTitle={getSurveyTitle} journalId={journalId} getAllActivity={getAllActivity} />}
      {showForm && (
        <Box id="reportDetails">
          <CommonCard sx={{ mt: 2 }}>
            <Typography fontSize={"18px"} fontWeight={"600"} mt={2} mb={4}>
              Endorsement/Issuance Details for {selectedRow.surveyTypes?.name}
            </Typography>

            <Grid2 container spacing={2}>
              {/* Row 1 */}
              <Grid2 item size={{ xs: 12, sm: 6, md: 3 }}>
                <Controller name="typesOfSurvey" control={control} render={({ field }) => <CommonInput {...field} disabled label={<>Type of Survey {!surveyType && <span style={{ color: "red" }}>*</span>}</>} placeholder="Type of Survey" />} />
                {errors.typesOfSurvey && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, ml: 1.75 }}>
                    {errors.typesOfSurvey.message}
                  </Typography>
                )}
              </Grid2>

              <Grid2 item size={{ xs: 12, sm: 6, md: 3 }}>
                {/* {!surveyType && ( */}
                <FormControl fullWidth>
                  <Typography variant="body1" fontWeight={"500"} mb={1.5}>
                    Type of Certificate {!surveyType && <span style={{ color: "red" }}>*</span>}
                  </Typography>
                  <Select value={selectCertificate} onChange={handleCertificate} displayEmpty error={!!errors.typeOfCertificate}>
                    <MenuItem value="">&nbsp;</MenuItem>
                    {certificateList.map((report) => (
                      <MenuItem key={report.value} value={report.value}>
                        {report.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.typeOfCertificate && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, ml: 1.75 }}>
                      {errors.typeOfCertificate.message}
                    </Typography>
                  )}
                </FormControl>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <Controller name="anniversaryDate" control={control} render={({ field }) => <CommonInput {...field} type="text" label="Anniversary Date" value={formatToDayMonth(field.value)} disabled />} />
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}></Grid2>

              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <Controller
                  name="issuancedate"
                  control={control}
                  render={({ field }) => (
                    <CommonInput
                      {...field}
                      type="date"
                      label={<>Issuance Date {!surveyType && <span style={{ color: "red" }}>*</span>}</>}
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange("issuancedate", e.target.value);
                      }}
                    />
                  )}
                />
              </Grid2>
              {/* )} */}
              {!hiddenReports.map((r) => r?.toLowerCase()).includes(reportName?.toLowerCase()) && (
                <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                  <Controller
                    name="validitydate"
                    control={control}
                    render={({ field }) => (
                      <CommonInput
                        {...field}
                        type="date"
                        label={<>Validity Date {!surveyType && <span style={{ color: "red" }}>*</span>}</>}
                        error={!!errors.validitydate}
                        helperText={errors.validitydate?.message}
                        onChange={(e) => {
                          field.onChange(e);
                          handleFieldChange("validitydate", e.target.value);
                        }}
                      />
                    )}
                  />
                  {/* {!hiddenReports.includes(reportName) && !surveyType && errors.validitydate && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, ml: 1.75 }}>
                      {errors.validitydate.message}
                    </Typography>
                  )} */}
                </Grid2>
              )}

              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <Controller
                  name="certificateBaseDate"
                  control={control}
                  render={({ field }) => (
                    <CommonInput
                      {...field}
                      type="date"
                      label="Date on which certificate is based"
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange("certificateBaseDate", e.target.value);
                      }}
                    />
                  )}
                />
              </Grid2>

              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <Controller
                  name="surveydate"
                  control={control}
                  render={({ field }) => (
                    <CommonInput
                      {...field}
                      type="date"
                      label={<>Survey Date {!surveyType && <span style={{ color: "red" }}>*</span>}</>}
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange("surveydate", e.target.value);
                      }}
                    />
                  )}
                />
                {errors.surveydate && !surveyType && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, ml: 1.75 }}>
                    {errors.surveydate.message}
                  </Typography>
                )}
              </Grid2>

              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <Controller
                  name="assignmentDate"
                  control={control}
                  render={({ field }) => (
                    <CommonInput
                      {...field}
                      type="date"
                      label="Assignment Date"
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange("assignmentDate", e.target.value);
                      }}
                    />
                  )}
                />
              </Grid2>

              {/* Due Date */}
              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <Controller
                  name="dueDate"
                  control={control}
                  render={({ field }) => (
                    <CommonInput
                      {...field}
                      type="date"
                      label="Due Date"
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange("dueDate", e.target.value);
                      }}
                    />
                  )}
                />
              </Grid2>

              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <Controller
                  name="rangeFrom"
                  control={control}
                  render={({ field }) => (
                    <CommonInput
                      {...field}
                      type="date"
                      label="Range From"
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange("rangeFrom", e.target.value);
                      }}
                    />
                  )}
                />
              </Grid2>

              {/* Range To */}
              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <Controller
                  name="rangeTo"
                  control={control}
                  render={({ field }) => (
                    <CommonInput
                      {...field}
                      type="date"
                      label="Range To"
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange("rangeTo", e.target.value);
                      }}
                    />
                  )}
                />
              </Grid2>

              {/* Postponed Date */}
              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <Controller
                  name="postponed"
                  control={control}
                  render={({ field }) => (
                    <CommonInput
                      {...field}
                      type="date"
                      label="Postponed Date"
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange("postponed", e.target.value);
                      }}
                    />
                  )}
                />
              </Grid2>
              {(showExtraEndorsementField || reportDetails?.typeOfCertificate === "extended") && (
                <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                  <Controller
                    name="newValidityDate"
                    control={control}
                    render={({ field }) => (
                      <CommonInput
                        {...field}
                        type="date"
                        label={
                          <>
                            New Validity Date <span style={{ color: "red" }}>*</span>
                          </>
                        }
                        onChange={(e) => {
                          field.onChange(e);
                          handleFieldChange("newValidityDate", e.target.value);
                        }}
                      />
                    )}
                  />
                  {errors.newValidityDate && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, ml: 1.75 }}>
                      {errors.newValidityDate.message}
                    </Typography>
                  )}
                </Grid2>
              )}

              {/* Endorsed / Issued By */}
              <Grid2 item size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth>
                  <Typography variant="body1" mb={1.5} fontWeight={500}>
                    Issued By {!surveyType && <span style={{ color: "red" }}>*</span>}
                  </Typography>
                  <Select value={selectSurveyor} onChange={handleSurveyor} displayEmpty name="issuedBy" error={!!errors.issuedBy}>
                    <MenuItem value="">&nbsp;</MenuItem>
                    {surveyorOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.issuedBy && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, ml: 1.75 }}>
                      {errors.issuedBy.message}
                    </Typography>
                  )}
                </FormControl>
              </Grid2>
              <Grid2 item size={{ xs: 12, sm: 6, md: 3 }}>
                <Controller
                  name="place"
                  control={control}
                  render={({ field }) => (
                    <CommonInput
                      {...field}
                      label={<>Place of Issuance {!surveyType && <span style={{ color: "red" }}>*</span>}</>}
                      placeholder="Enter place name"
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange("place", e.target.value);
                      }}
                    />
                  )}
                />
                {errors.place && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, ml: 1.75 }}>
                    {errors.place.message}
                  </Typography>
                )}
              </Grid2>
            </Grid2>
            {selectCertificate === "full_term" && (
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 3 }}>
                <FormControlLabel control={<Checkbox checked={doingEndorsement} onChange={(e) => setDoingEndorsement(e.target.checked)} />} label="Endorse Certificate" />
              </Stack>
            )}

            <Stack direction="row" gap={"20px"}>
              <CommonButton onClick={handleGenerateReport} sx={{ marginTop: 3 }} text="Save" isLoading={loading} />

              {selectedRow?.status === "Completed" && (
                <CommonButton
                  onClick={() => {
                    if (doingEndorsement) {
                      setEndorsementTitle(endorsements);
                      setOpenEndrosemet(true);
                    } else {
                      handleFullReportGeneration();
                    }
                  }}
                  sx={{ marginTop: 3 }}
                  text="Generate Certificate"
                  isLoading={loading}
                  disabled={!reportDetails}
                />
              )}
            </Stack>
          </CommonCard>
        </Box>
      )}

      <FullScreenRemarksDialog
        open={fullScreenRemarksVisible}
        onCancel={() => setFullScreenRemarksVisible(null)}
        onConfirm={(value) => {
          if (fullScreenRemarksVisible && typeof fullScreenRemarksVisible === "object") {
            handleRemarksChange(fullScreenRemarksVisible.id, value);
          }
          setFullScreenRemarksVisible(null);
        }}
        title={fullScreenRemarksVisible && typeof fullScreenRemarksVisible === "object" ? `Remarks for ${fullScreenRemarksVisible.surveyTypes?.name}` : "Remarks"}
      />
      {renderReportForm()}
      {loadingReport && (
        <Box position="fixed" top={0} left={0} width="100vw" height="100vh" display="flex" justifyContent="center" alignItems="center" bgcolor="rgba(255,255,255,0.6)" zIndex={9999}>
          <CircularProgress />
        </Box>
      )}
      <ConfirmationPopup open={isOpenConfirmModal} onClose={onClose} onConfirm={onConfirm} isLoading={continueBtnLoading} text={specialPermission && journals?.archived?.length > 0 ? "unarchive" : "archive"} />
      <EditingReasonDialog
        open={isOpenArchiveModal}
        onConfirm={(value) => {
          setIsOpenArchiveModal(false);
          manageArchive(value);
        }}
        title="Are you sure you want to archive this journal?"
        onCancel={() => setIsOpenArchiveModal(false)}
      />

      <FullScreenRemarksDialog
        open={fullScreenRemarksVisible}
        onCancel={() => setFullScreenRemarksVisible(null)}
        onConfirm={(value) => {
          if (fullScreenRemarksVisible && typeof fullScreenRemarksVisible === "object") {
            handleRemarksChange(fullScreenRemarksVisible.id, value);
          }
          setFullScreenRemarksVisible(null);
        }}
        title={fullScreenRemarksVisible && typeof fullScreenRemarksVisible === "object" ? `Remarks for ${fullScreenRemarksVisible.surveyTypes?.name}` : "Remarks"}
      />
      {reportDetails?.typeOfCertificate === "full_term" && openEndrosemet && (
        <EndorsementDialog
          open={openEndrosemet}
          onClose={() => setOpenEndrosemet(false)}
          onSubmit={(values) => {
            handleSubmitReport(values);
          }}
          endorsementList={endorsementTitle}
          reportDetailsId={reportDetails?.id}
          endorsedIssuedBy={surveyorOptions}
          surveyorOptions={surveyorOptions}
          endorsementStamp={endorsementStamp}
        />
      )}
      <AmendmentRemarksDialog open={showAmendmentDialog} onClose={() => setShowAmendmentDialog(false)} onSubmit={handleAmendmentSubmit} isLoading={continueBtnLoading} />
      <ArchiveHistoryDialog open={showArchiveHistoryDialog} archiveHistory={archiveHistory} onClose={() => setShowArchiveHistoryDialog(false)} shipName={shipName} />
    </Box>
  );
};

export default ReportingForm;
