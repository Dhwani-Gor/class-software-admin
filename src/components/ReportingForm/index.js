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

const reportSchema = yup.object().shape({
  typesOfSurvey: yup.string().required("Type of survey is required"),
  typeOfCertificate: yup.string().required("Type of certificate is required"),
  issuancedate: yup.string().required("Issuance date is required"),
  validitydate: yup.string().optional(),
  surveydate: yup.string().required("Survey date is required"),
  endorsementdate: yup.string().optional(),
  issuedBy: yup.string().optional(),
  place: yup.string().required("Place is required"),
  newValidityDate: yup.string().optional(),
});

const ReportingForm = () => {
  const router = useRouter();
  const { data } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clientsList, setClientsList] = useState([]);
  const [journals, setJournals] = useState([]);
  const [fullScreenRemarksVisible, setFullScreenRemarksVisible] = useState(null);
  const [selectedShip, setSelectedShip] = useState({ id: "", shipName: "" });
  const [specialPermission, setSpecialPermission] = useState(false);
  const [filteredJournals, setFilteredJournals] = useState([]);
  const [showButton, setShowButton] = useState(true);
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
  const [showRemarksDialog, setShowRemarksDialog] = useState(false);
  const [archiveRemarks, setArchiveRemarks] = useState("");
  const [showAmendmentDialog, setShowAmendmentDialog] = useState(false);
  const [isOpenConfirmModal, setIsOpenConfirmModal] = useState(false);
  const [amdRemarks, setAmdRemarks] = useState("");

  useEffect(() => {
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
    },
    resolver: yupResolver(reportSchema),
  });

  const certificateList = [
    { value: "interim", label: "Interim" },
    { value: "short_term", label: "Short Term" },
    { value: "full_term", label: "Full Term" },
    { value: "extended", label: "Extended" },
  ];

  const areAllActivitiesCompleted = () => {
    return tableData?.length > 0 && tableData.every((activity) => activity.status === "Completed");
  };

  const handleClientChange = (event) => {
    const selectedId = event.target.value;
    const selectedClient = clientsList.find((client) => client.id === selectedId);
    setSelectedShip({
      id: selectedId,
      shipName: selectedClient ? selectedClient.shipName : "",
    });
  };

  const handleReportNumber = (event) => {
    setShowTable(false);
    const selectedJournalTypeId = event.target.value;
    const selectedIndex = filteredJournals.findIndex((j) => j.journalTypeId === selectedJournalTypeId);
    setjournalId(filteredJournals[selectedIndex]?.id);
    setSelectedReportNumber({
      journalTypeId: selectedJournalTypeId,
      index: selectedIndex !== -1 ? selectedIndex : null,
    });
    setTableData(filteredJournals[selectedIndex]?.activities || []);
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
    if (value && value.trim() !== "" && errors[fieldName]) {
      clearErrors(fieldName);
    }
  };

  const handleShowTable = () => {
    setShowTable(true);
    setShowButton(true);
    getAllActivity(journalId);
  };

  const manageArchive = async () => {
    try {
      setContinueBtnLoading(true);

      if (specialPermission && data.specialPermission?.includes("archive/unarchive")) {
        // Unarchive logic
        const payload = {
          clientId: selectedShip.id,
          journalId,
        };

        const result = await addUnArchiveDocument(payload);
        if (result.data.status === "success") {
          setShowTable(false);
          setShowButton(false);
          fetchAllJournals();
          setIsOpenConfirmModal(false);
          toast.success(result.data.message);
        } else {
          toast.error("Failed to unarchive");
        }
      } else {
        // Archive logic - archiveRemarks should already be set from EditingReasonDialog
        const result = await addArchiveDocument({
          clientId: selectedShip.id,
          journalId,
          archiveRemarks: archiveRemarks,
        });
        if (result.data.status === "success") {
          setShowButton(false);
          setShowTable(false);
          fetchAllJournals();
          setIsOpenArchiveModal(false);
          toast.success(result.data.message);
        } else {
          toast.error("Failed to archive");
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

    // Show confirmation popup only for unarchive
    if (specialPermission && journals?.archived?.length > 0) {
      setIsOpenConfirmModal(true);
    } else {
      // Show EditingReasonDialog only for archive
      setIsOpenArchiveModal(true);
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
        endorsementDate: values.endorsementdate ? formatDate(values.endorsementdate) : "",
      }),
      ...(selectCertificate === "extended" && {
        newValidityDate: values.newValidityDate ? formatDate(values.newValidityDate) : "",
      }),
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
        toast.error("Failed to generate report");
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
        toast.success("Report updated successfully.");
      } else {
        toast.error(result?.data?.message);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error(error?.message || "An error occurred");
    }
  };

  const handleFullReportGeneration = async () => {
    fetchReportDetails(reportDetails?.id);
    if (reportDetails.lastUnarchivedAt !== null) {
      setShowAmendmentDialog(true);
    } else {
      setOpen(true);
      return;
    }
  };

  const handleSubmitReport = async (extraFields) => {
    setLoadingReport(true);
    try {
      const payload = {
        reportDetailId: reportDetails?.id,
        data: {
          ...extraFields,
          type: "image",
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
        return;
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
    areAllActivitiesCompleted();
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
        setTableData(result?.data?.data);
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
      const result = await getSelectedActivityReportDetails(row?.id);
      setReportName(row?.surveyTypes?.report?.name);

      const data = extractUnderscoreFields(row);
      setUnderscoreFields(data);

      if (result?.data?.status === "success") {
        setReportDetails(result?.data?.data[0]);
        router.push("#reportDetails");
        const reportData = result?.data?.data[0];
        setShowForm(true);
        setSelectedRow(row);
        clearErrors();

        setValue("typesOfSurvey", getSurveyTitle(row.surveyTypes?.name));
        setValue("typeOfCertificate", reportData?.typeOfCertificate || "");
        setSelectCertificate(reportData?.typeOfCertificate || "");
        setValue("issuancedate", reportData?.issuanceDate ? moment(reportData?.issuanceDate).format("YYYY-MM-DD") : "");
        setValue("validitydate", reportData?.validityDate ? moment(reportData?.validityDate).format("YYYY-MM-DD") : "");
        setValue("surveydate", reportData?.surveyDate ? moment(reportData?.surveyDate).format("YYYY-MM-DD") : "");
        setValue("endorsementdate", reportData?.endorsementDate ? moment(reportData?.endorsementDate).format("YYYY-MM-DD") : "");
        setValue("issuedBy", reportData?.issuedBy?.toString() || "");
        setSelectSurveyor(reportData?.issuedBy?.toString() || "");
        setValue("place", reportData?.place || "");
      } else {
        clearErrors();
        setShowForm(true);
        setSelectedRow(row);
        setValue("typesOfSurvey", getSurveyTitle(row.surveyTypes?.name));
      }
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
    if (!areAllActivitiesCompleted() && !specialPermission) {
      console.log(areAllActivitiesCompleted, specialPermission);
      setIsOpenArchiveModal(true);
    } else {
      manageArchive();
    }
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

  const handleArchiveRemarks = (remarks) => {
    setArchiveRemarks(remarks);
    manageArchive();
  };

  const handleAmendmentSubmit = async (amendmentReason) => {
    setAmdRemarks(amendmentReason);
    setShowAmendmentDialog(false);
    setOpen(true);
    const payload = {
      reportDetailId: reportDetails.id,
      amdRemarks: amendmentReason,
      data: {
        ...reportDetails.data,
        save: true,
      },
    };

    const result = await addAmdRemarks(payload);
    console.log(result);
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
            )}
            {selectedShip.id && selectedReportNumber.journalTypeId && (
              <>
                <CommonButton onClick={handleShowTable} sx={{ marginTop: 3 }} text="Continue" />
                {selectedShip.id && selectedReportNumber.journalTypeId && data?.specialPermission?.includes("archive/unarchive") && <CommonButton onClick={handleContinue} sx={{ marginTop: 3, marginLeft: 2 }} text={specialPermission ? "Unarchive" : "Archive"} />}
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
              <Grid2 item size={{ md: 9 }}>
                <FormControl fullWidth sx={{ maxWidth: 255 }}>
                  <Typography variant="body1" fontWeight={"500"} mb={1.5}>
                    Type Of Certificate <span style={{ color: "red" }}>*</span>
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
              <Grid2 size={{ md: 3 }}>
                <Controller
                  name="issuancedate"
                  control={control}
                  render={({ field }) => (
                    <CommonInput
                      {...field}
                      type="date"
                      label={
                        <>
                          Issuance Date <span style={{ color: "red" }}>*</span>
                        </>
                      }
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange("issuancedate", e.target.value);
                      }}
                    />
                  )}
                />
                {errors.issuancedate && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, ml: 1.75 }}>
                    {errors.issuancedate.message}
                  </Typography>
                )}
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
                        label={<>Validity Date</>}
                        error={!!errors.validitydate}
                        helperText={errors.validitydate?.message}
                        onChange={(e) => {
                          field.onChange(e);
                          handleFieldChange("validitydate", e.target.value);
                        }}
                      />
                    )}
                  />
                  {errors.validitydate && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, ml: 1.75 }}>
                      {errors.validitydate.message}
                    </Typography>
                  )}
                </Grid2>
              )}
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
              {showEndorsementField && (
                <Grid2 size={{ md: 3 }}>
                  <Controller
                    name="endorsementdate"
                    control={control}
                    render={({ field }) => (
                      <CommonInput
                        {...field}
                        type="date"
                        label={<>Endorsement Date</>}
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
              <Grid2 item size={{ md: 3 }}>
                <FormControl fullWidth>
                  <Typography variant="body1" mb={1.5} fontWeight={500}>
                    Endorsed / Issued By
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
                          Place Of Issuance
                          <span style={{ color: "red" }}>*</span>
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
      <EditingReasonDialog open={isOpenArchiveModal} onConfirm={handleArchiveRemarks} title="Are you sure you want to archive this journal?" onCancel={() => setIsOpenArchiveModal(false)} />
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
      <AmendmentRemarksDialog open={showAmendmentDialog} onClose={() => setShowAmendmentDialog(false)} onSubmit={handleAmendmentSubmit} isLoading={continueBtnLoading} />
    </Box>
  );
};

export default ReportingForm;
