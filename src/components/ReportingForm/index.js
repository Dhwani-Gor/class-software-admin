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
import { useRouter } from "next/navigation";
import { createReportDetail, generateFullReport, getAllClients, getAllJournals, getEndorsedIssuedBy, getSelectedActivityReportDetails, getSelectedReportDetails, updateReportDetail, addArchiveDocument, addUnArchiveDocument, addAmdRemarks, updateActivityDetails } from "@/api";
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
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider } from "@mui/material";
import ArchiveHistoryDialog from "../Dialogs/ArchiveHistoryDialog";
import EndorsementDialog from "../documents/EndorsementDialog";
import { calculateDates } from "@/utils/DateCalculation";

const reportSchema = yup.object().shape({
  typesOfSurvey: yup.string().required("Type of survey is required"),
  typeOfCertificate: yup.string().required("Type of certificate is required"),
  issuancedate: yup.string().optional(),
  validitydate: yup.string().optional(),
  surveydate: yup.string().required("Survey date is required"),
  endorsementdate: yup.string().optional(),
  issuedBy: yup.string().required("Issued by is required"),
  place: yup.string().required("Place is required"),
  newValidityDate: yup.string().optional(),
  rangeFrom: yup.string().optional(),
  rangeTo: yup.string().optional(),
  assignmentDate: yup.string().optional(),
  dueDate: yup.string().optional(),
  postponedDate: yup.string().optional(),
  certificateBaseDate: yup.string().optional(),
});

const ReportingForm = () => {
  const router = useRouter();
  const { data } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clientsList, setClientsList] = useState([]);
  const [shipName, setShipName] = useState("");
  const [journals, setJournals] = useState([]);
  const [fullScreenRemarksVisible, setFullScreenRemarksVisible] = useState(null);
  const [selectedShip, setSelectedShip] = useState({ id: "", shipName: "" });
  const [specialPermission, setSpecialPermission] = useState(false);
  const [filteredJournals, setFilteredJournals] = useState([]);
  const [showButton, setShowButton] = useState(true);
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
  const [showEndorsementField, setShowEndorsementField] = useState(false);
  const [showExtraEndorsementField, setShowExtraEndorsementField] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [isOpenArchiveModal, setIsOpenArchiveModal] = useState(false);
  const [continueBtnLoading, setContinueBtnLoading] = useState(false);
  const [showAmendmentDialog, setShowAmendmentDialog] = useState(false);
  const [isOpenConfirmModal, setIsOpenConfirmModal] = useState(false);
  const [amdRemarks, setAmdRemarks] = useState("");
  const [showArchiveHistoryDialog, setShowArchiveHistoryDialog] = useState(false);
  const [archiveHistory, setArchiveHistory] = useState([]);
  const [endorsementValues, setEndorsementValues] = useState([]);
  const [endorsements, setEndorsements] = useState([]);

  useEffect(() => {
    ``;
    if (selectCertificate === "full_term") {
      setShowEndorsementField(true);
      setShowExtraEndorsementField(false);
    } else if (selectCertificate === "short_term" || selectCertificate === "interim") {
      setShowEndorsementField(false);
      setShowExtraEndorsementField(false);
    } else if (selectCertificate === "extended") {
      setShowEndorsementField(true);
      setShowExtraEndorsementField(true);
    } else {
      setShowEndorsementField(false);
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
    handleSubmit,
    getValues,
    setValue,
    trigger,
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
      postponedDate: "",
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
    setShowEndorsementField(false);
    setShowExtraEndorsementField(false);

    // Reset form values
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
    setValue("postponedDate", "");
    setValue("certificateBaseDate", "");
    clearErrors();
  };

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
  const handleFieldChange = (fieldName, value) => {
    if (!value) return;

    if (errors[fieldName]) clearErrors(fieldName);

    if (fieldName === "surveydate") {
      // Copy to assignmentDate
      setValue("assignmentDate", value);

      const surveyType = getValues("typesOfSurvey");
      const issuanceDate = getValues("issuancedate");

      // Format existing surveys from tableData (now includes reportDetail)
      const existingSurveys = tableData
        .filter((activity) => activity.reportDetail && activity.surveyTypes?.name)
        .map((activity) => ({
          surveyName: activity.surveyTypes.name,
          surveyDate: activity.reportDetail.surveyDate,
          issuanceDate: activity.reportDetail.issuanceDate,
          dueDate: activity.reportDetail.dueDate,
          rangeFrom: activity.reportDetail.rangeFrom,
          rangeTo: activity.reportDetail.rangeTo,
        }));

      console.log("Existing surveys for calculation:", existingSurveys);

      // Recalculate dependent dates
      const { dueDate, rangeFrom, rangeTo, anniversaryDate } = calculateDates(issuanceDate, surveyType, existingSurveys);

      setValue("dueDate", dueDate ? moment(dueDate).format("YYYY-MM-DD") : "");
      setValue("rangeFrom", rangeFrom ? moment(rangeFrom).format("YYYY-MM-DD") : "");
      setValue("rangeTo", rangeTo ? moment(rangeTo).format("YYYY-MM-DD") : "");
      setValue("anniversaryDate", anniversaryDate ? moment(anniversaryDate).format("YYYY-MM-DD") : "");
    }

    if (fieldName === "issuancedate") {
      const surveyType = getValues("typesOfSurvey");

      // Format existing surveys from tableData (now includes reportDetail)
      const existingSurveys = tableData
        .filter((activity) => activity.reportDetail && activity.surveyTypes?.name)
        .map((activity) => ({
          surveyName: activity.surveyTypes.name,
          surveyDate: activity.reportDetail.surveyDate,
          issuanceDate: activity.reportDetail.issuanceDate,
          dueDate: activity.reportDetail.dueDate,
          rangeFrom: activity.reportDetail.rangeFrom,
          rangeTo: activity.reportDetail.rangeTo,
        }));

      console.log("Existing surveys for calculation:", existingSurveys);

      const { dueDate, rangeFrom, rangeTo, anniversaryDate } = calculateDates(value, surveyType, existingSurveys);

      setValue("dueDate", dueDate ? moment(dueDate).format("YYYY-MM-DD") : "");
      setValue("rangeFrom", rangeFrom ? moment(rangeFrom).format("YYYY-MM-DD") : "");
      setValue("rangeTo", rangeTo ? moment(rangeTo).format("YYYY-MM-DD") : "");
      setValue("anniversaryDate", anniversaryDate ? moment(anniversaryDate).format("YYYY-MM-DD") : "");
    }
  };

  const handleShowTable = () => {
    setShowTable(true);
    setShowButton(true);
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

      if (specialPermission && data.specialPermission?.includes("archive/unarchive")) {
        const result = await addUnArchiveDocument(payload);
        if (result?.data?.status === "success") {
          setShowTable(false);
          setShowButton(false);
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
          setShowButton(false);
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
      postponedDate: values.postponedDate ? formatDate(values.postponedDate) : null,
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
      console.log(payload, "payload");
      const result = await createReportDetail(payload);

      console.log(result, "result");
      if (result?.data?.status === "success") {
        setReportDetails(result?.data?.data);
        toast.success("Report saved successfully.");
      } else {
        toast.error(result.data.message);
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
      console.log(result, "result");
      if (result?.data?.status === "success") {
        setReportDetails(result?.data?.data);
        toast.success("Report updated successfully.");
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
    if (endorsements?.length > 0 && reportDetails.endorsementDate !== null) {
      setEndorsementTitle(endorsements);
      setOpenEndrosemet(true);
    } else {
      await fetchReportDetails(reportDetails?.id);
      if (reportDetails.lastUnarchivedAt !== null && !reportDetails?.endorsementDate) {
        setShowAmendmentDialog(true);
      } else {
        setOpen(true);
      }
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
          stamp: 6,
          companyText: 8,
          ...(reportName.toLocaleLowerCase() === "certificate of class" && {
            logo: 7,
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

        // Fetch report details for all activities
        const activitiesWithReports = await Promise.all(
          activities.map(async (activity) => {
            try {
              const reportResult = await getSelectedActivityReportDetails(activity.id);
              const reportData = reportResult?.data?.data?.[0];
              return {
                ...activity,
                reportDetail: reportData || null, // Add report details to activity
              };
            } catch (error) {
              console.warn(`Failed to fetch report for activity ${activity.id}`, error);
              return {
                ...activity,
                reportDetail: null,
              };
            }
          })
        );

        setTableData(activitiesWithReports);
        console.log(activitiesWithReports, "table data with reports");
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

  // STEP 3: Update handleReportClick to use the new structure
  const handleReportClick = async (row) => {
    try {
      setLoading(true);
      const result = await getSelectedActivityReportDetails(row?.id);
      const reportData = result?.data?.data[0];

      setReportDetails(reportData);
      setSelectedRow(row);
      setShowForm(true);
      clearErrors();

      const surveyType = row.surveyTypes?.name;
      const issuanceDate = reportData?.issuanceDate;

      // Format existing surveys from tableData (now includes reportDetail)
      // console.log(tableData, "tableData");
      // const existingSurveys = [
      //   {
      //     surveyName: "Special Survey (Fi-Fi)",
      //     surveyDate: "2025-10-25T00:00:00.000Z",
      //     issuanceDate: "2025-10-18T00:00:00.000Z",
      //     dueDate: "2030-10-25T00:00:00.000Z",
      //     rangeFrom: "2030-07-25T00:00:00.000Z",
      //     rangeTo: "2030-10-25T00:00:00.000Z",
      //   },
      // ];

      // const result1 = calculateDates("2025-10-06", "Annual Survey ( Fi-Fi)", existingSurveys);
      // console.log(result1, "result1");

      // // Auto-calculate dates if backend doesn't provide them
      // const { dueDate, rangeFrom, rangeTo, anniversaryDate } = calculateDates(issuanceDate, surveyType, existingSurveys);
      // console.log(
      //   {
      //     dueDate,
      //     rangeFrom,
      //     rangeTo,
      //     anniversaryDate,
      //   },
      //   "calculateDates"
      // );
      // console.log("Before setValue:", {
      //   surveydate: getValues("surveydate"),
      //   issuancedate: getValues("issuancedate"),
      // });

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
      setValue("postponedDate", reportData?.postponedDate ? moment(reportData.postponedDate).format("YYYY-MM-DD") : "");
      setValue("certificateBaseDate", reportData?.certificateBaseDate ? moment(reportData.certificateBaseDate).format("YYYY-MM-DD") : "");
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
                {data?.specialPermission?.includes("archive/unarchive") && <FormControlLabel control={<Checkbox checked={specialPermission} onChange={handleSpecialPermission} color="primary" />} label="Show Archived Reports" sx={{ mb: 2, display: "block" }} />}
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
                {selectedShip.id && selectedReportNumber.journalTypeId && data?.specialPermission?.includes("archive/unarchive") && <CommonButton onClick={handleContinue} sx={{ marginTop: 3, marginLeft: 2 }} disabled={!tableData?.length > 0} text={specialPermission ? "Unarchive" : "Archive"} />}
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
              <Grid2 item size={{ md: 3 }}>
                <Controller
                  name="typesOfSurvey"
                  control={control}
                  render={({ field }) => (
                    <CommonInput
                      {...field}
                      disabled
                      label={
                        <>
                          Type of Survey <span style={{ color: "red" }}>*</span>
                        </>
                      }
                      placeholder="Type of Survey"
                    />
                  )}
                />
                {errors.typesOfSurvey && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, ml: 1.75 }}>
                    {errors.typesOfSurvey.message}
                  </Typography>
                )}
              </Grid2>

              <Grid2 item size={{ md: 3 }}>
                <FormControl fullWidth sx={{ maxWidth: 255 }}>
                  <Typography variant="body1" fontWeight={"500"} mb={1.5}>
                    Type of Certificate <span style={{ color: "red" }}>*</span>
                  </Typography>
                  <Select value={selectCertificate} onChange={handleCertificate} displayEmpty error={!!errors.typeOfCertificate}>
                    <MenuItem value="" disabled>
                      Select Certificate
                    </MenuItem>
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
              <Grid2 size={{ md: 6 }} sx={{ maxWidth: 255 }}>
                <Controller name="anniversaryDate" control={control} render={({ field }) => <CommonInput {...field} type="date" label="Anniversary Date" disabled />} />
              </Grid2>
              {/* Row 2 — All Date Fields in One Line */}
              <Grid2 size={{ md: 3 }}>
                <Controller
                  name="issuancedate"
                  control={control}
                  render={({ field }) => (
                    <CommonInput
                      {...field}
                      type="date"
                      label="Issuance Date"
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange("issuancedate", e.target.value);
                      }}
                    />
                  )}
                />
              </Grid2>

              {!hiddenReports.includes(reportName) && (
                <Grid2 size={{ md: 3 }}>
                  <Controller
                    name="validitydate"
                    control={control}
                    render={({ field }) => (
                      <CommonInput
                        {...field}
                        type="date"
                        label="Validity Date"
                        error={!!errors.validitydate}
                        helperText={errors.validitydate?.message}
                        onChange={(e) => {
                          field.onChange(e);
                          handleFieldChange("validitydate", e.target.value);
                        }}
                      />
                    )}
                  />
                </Grid2>
              )}

              <Grid2 size={{ md: 3 }}>
                <Controller
                  name="certificateBaseDate"
                  control={control}
                  render={({ field }) => (
                    <CommonInput
                      {...field}
                      type="date"
                      label={
                        <>
                          Date on which certificate is based <span style={{ color: "red" }}>*</span>
                        </>
                      }
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange("basedDate", e.target.value);
                      }}
                    />
                  )}
                />
              </Grid2>

              <Grid2 size={{ md: 3 }}>
                <Controller
                  name="surveydate"
                  control={control}
                  render={({ field }) => (
                    <CommonInput
                      {...field}
                      type="date"
                      label={
                        <>
                          Survey Date <span style={{ color: "red" }}>*</span>
                        </>
                      }
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange("surveydate", e.target.value);
                      }}
                    />
                  )}
                />
                {errors.surveydate && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, ml: 1.75 }}>
                    {errors.surveydate.message}
                  </Typography>
                )}
              </Grid2>

              <Grid2 container spacing={2} sx={{ mt: 0 }}>
                {/* Survey Date */}

                {/* Assignment Date */}
                <Grid2 size={{ md: 3 }}>
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
                <Grid2 size={{ md: 3 }}>
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

                {/* Range From */}
                <Grid2 size={{ md: 3 }}>
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
                <Grid2 size={{ md: 3 }}>
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
                <Grid2 size={{ md: 3 }}>
                  <Controller
                    name="postponedDate"
                    control={control}
                    render={({ field }) => (
                      <CommonInput
                        {...field}
                        type="date"
                        label="Postponed Date"
                        onChange={(e) => {
                          field.onChange(e);
                          handleFieldChange("postponedDate", e.target.value);
                        }}
                      />
                    )}
                  />
                </Grid2>
                {showEndorsementField && (
                  <Grid2 size={{ md: 3 }}>
                    <Controller
                      name="endorsementdate"
                      control={control}
                      render={({ field }) => (
                        <CommonInput
                          {...field}
                          type="date"
                          label="Endorsement Date"
                          onChange={(e) => {
                            field.onChange(e);
                            handleFieldChange("endorsementdate", e.target.value);
                          }}
                        />
                      )}
                    />
                  </Grid2>
                )}
                {(showExtraEndorsementField || reportDetails?.typeOfCertificate === "extended") && (
                  <Grid2 size={{ md: 3 }}>
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
                <Grid2 item size={{ md: 3 }}>
                  <FormControl fullWidth>
                    <Typography variant="body1" mb={1.5} fontWeight={500}>
                      Endorsed / Issued By <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <Select value={selectSurveyor} onChange={handleSurveyor} displayEmpty name="issuedBy" error={!!errors.issuedBy}>
                      <MenuItem value="" disabled>
                        Select Endorsed / Issued By
                      </MenuItem>
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
                <Grid2 item size={{ md: 3 }}>
                  <Controller
                    name="place"
                    control={control}
                    render={({ field }) => (
                      <CommonInput
                        {...field}
                        label={
                          <>
                            Place of Issuance / Endorsement <span style={{ color: "red" }}>*</span>
                          </>
                        }
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

              {/* Row 3 — Remaining Fields */}

              {/* Place of Issuance */}
            </Grid2>

            {/* Action Buttons */}
            <Stack direction="row" gap={"20px"}>
              <CommonButton onClick={handleGenerateReport} sx={{ marginTop: 3 }} text="Save" isLoading={loading} />
              {selectedRow?.status === "Completed" && <CommonButton onClick={handleFullReportGeneration} sx={{ marginTop: 3 }} text="Generate Certificate" isLoading={loading} disabled={!reportDetails} />}
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
      {reportDetails?.typeOfCertificate === "full_term" && openEndrosemet && !!reportDetails?.endorsementDate && (
        <EndorsementDialog
          open={openEndrosemet}
          onClose={() => setOpenEndrosemet(false)}
          onSubmit={(values) => {
            setEndorsementValues(values);
            handleSubmitReport(values);
          }}
          endorsementList={endorsementTitle}
          reportDetailsId={reportDetails?.id}
          endorsedIssuedBy={surveyorOptions}
        />
      )}
      <AmendmentRemarksDialog open={showAmendmentDialog} onClose={() => setShowAmendmentDialog(false)} onSubmit={handleAmendmentSubmit} isLoading={continueBtnLoading} />
      {/* <Dialog open={showArchiveHistoryDialog} onClose={() => setShowArchiveHistoryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Archive Remarks History</DialogTitle>
        <DialogContent dividers>
          {archiveHistory.length > 0 ? (
            archiveHistory.map((remark, index) => (
              <Box key={remark.id || index} mb={2}>
                <Typography variant="body1">
                  <b>Remark {index + 1}:</b> {remark.remark || "-"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {remark.journalTypeId}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {moment(remark.createdAt).format("DD MMM YYYY, HH:mm")}
                </Typography>
                {index < archiveHistory.length - 1 && <Divider sx={{ my: 1 }} />}
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No remarks history found.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowArchiveHistoryDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog> */}
      <ArchiveHistoryDialog open={showArchiveHistoryDialog} archiveHistory={archiveHistory} onClose={() => setShowArchiveHistoryDialog(false)} shipName={shipName} />
    </Box>
  );
};

export default ReportingForm;
