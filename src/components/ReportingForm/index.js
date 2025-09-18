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
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import CommonInput from "@/components/CommonInput";
import IconButton from "@mui/material/IconButton";
import DescriptionIcon from "@mui/icons-material/Description";
import AttachmentIcon from "@mui/icons-material/Attachment";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import TextareaAutosize from "@mui/material/TextareaAutosize";
import Grid2 from "@mui/material/Grid2";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import FullScreenRemarksDialog from "./FullScreenRemarksDialog";
import { useRouter } from "next/navigation";
import { createReportDetail, deleteAttachment, generateFullReport, getAllClients, getAllJournals, getEndorsedIssuedBy, getSelectedActivityReportDetails, getSelectedReportDetails, updateReportDetail, addArchiveDocument } from "@/api";
import { toast } from "react-toastify";
import { TYPE_OF_SURVEYS } from "@/data";
import { updateActivityDetails } from "@/api";
import { getAllActivities } from "@/api";
import moment from "moment";
import { Stack } from "@mui/material";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { DialogForm } from "../documents/CommonDocumentForm";
import InternationalTonnage from "../documents/TonnageCertificateForm";
import IOPPForm from "../documents/OilPollutionPreventionCertificateForm";
import CSSForm from "../documents/CargoShipEquipmentRecordForm";
import LoadLineCertificateForm from "../documents/LoadLineCertificateForm";
import AntiFoulingCertificateForm from "../documents/AntiFoulingCertificateForm";
import IAPPForm from "../documents/RecordOfConstructioCertificate";
import EndorsementDialog from "../documents/EndorsementDialog";
import { hiddenReports } from "@/utils/DocumentList";

// Updated schema with correct field names
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

const DocumentUploadDialog = ({ open, onClose, onUpload, selectedDocuments, onRemoveDocument, onPreviewDocument }) => {
  const [documents, setDocuments] = useState([]);

  const areAllActivitiesCompleted = () => {
    return tableData.length > 0 && tableData.every((activity) => activity.status === "Completed");
  };
  
  const handleFileChange = (event) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      const validFiles = newFiles.filter((file) => ["image/jpeg", "image/png", "image/gif", "application/pdf", "video/mp4", "video/mpeg"].includes(file.type));

      if (validFiles.length !== newFiles.length) {
        toast.warning("Some files were skipped due to invalid file type");
      }

      setDocuments((prev) => [...prev, ...validFiles]);
    }
  };

  const handleUpload = () => {
    if (documents.length === 0) {
      toast.warning("Please select at least one file to upload");
      return;
    }

    onUpload(documents);
    setDocuments([]);
    onClose();
  };

  const handleRemoveNewDocument = (index) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const renderFileIcon = (file) => {
    let fileType;

    if (file?.type) {
      fileType = file.type.split("/")[0];
    } else if (file?.fileType) {
      fileType = file.fileType.split("/")[0];
    } else {
      fileType = "unknown";
    }

    switch (fileType) {
      case "image":
        return "🖼️";
      case "application":
        return "📄";
      case "video":
        return "🎥";
      default:
        return "📁";
    }
  };

  const getFileName = (file) => {
    if (file?.name) {
      return file.name;
    } else if (file?.fileName) {
      return file.fileName;
    }
    return "Unknown file";
  };

  const handleSafeRemoveDocument = (docId) => {
    if (!docId) {
      toast.error("Cannot remove document: Invalid document ID");
      return;
    }

    if (typeof onRemoveDocument === "function") {
      onRemoveDocument(docId);
    } else {
      toast.error("Remove function not available");
    }
  };

  const handleSafePreviewDocument = (doc) => {
    if (!doc) {
      toast.error("Cannot preview document: Invalid document");
      return;
    }

    if (typeof onPreviewDocument === "function") {
      onPreviewDocument(doc);
    } else {
      toast.error("Preview function not available");
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Upload Documents</DialogTitle>
      <DialogContent sx={{ minWidth: "50vw" }}>
        <Box>
          <input type="file" multiple accept="image/jpeg,image/png,image/gif,application/pdf,video/mp4,video/mpeg" onChange={handleFileChange} style={{ margin: "16px 0" }} />

          {documents.length > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle1">New Documents:</Typography>
              {documents.map((file, index) => (
                <Box key={index} display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography>
                    {renderFileIcon(file)} {getFileName(file)}
                  </Typography>
                  <IconButton size="small" onClick={() => handleRemoveNewDocument(index)} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}

          {selectedDocuments && selectedDocuments.length > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle1">Existing Documents:</Typography>
              {selectedDocuments.map((doc) => (
                <Box key={doc.id} display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography>
                    {renderFileIcon(doc)} {getFileName(doc)}
                  </Typography>
                  <Box>
                    <IconButton size="small" onClick={() => handleSafePreviewDocument(doc)} color="primary" title="Preview Document">
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleSafeRemoveDocument(doc.id)} color="error" title="Delete Document" disabled={!doc.id}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleUpload} disabled={documents.length === 0}>
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DocumentPreviewModal = ({ open, onClose, document, loading }) => {
  let fileUrl;
  let fileType;

  const handleDownload = () => {
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = document.filePath;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  };

  const getPreviewContent = () => {
    if (!document) return null;
    fileUrl = document.filePath;
    fileType = document.fileType;
    if (fileType?.startsWith("image/")) {
      return (
        <img
          src={fileUrl}
          alt="Document preview"
          style={{
            maxWidth: "100%",
            maxHeight: "70vh",
            objectFit: "contain",
          }}
        />
      );
    } else if (fileType === "application/pdf") {
      return <iframe src={`https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`} style={{ width: "100%", height: "70vh", border: "none" }} title="PDF Preview" />;
    } else if (fileType?.startsWith("video/")) {
      return (
        <video controls style={{ maxWidth: "100%", maxHeight: "70vh" }}>
          <source src={fileUrl} type={fileType} />
          Your browser does not support the video tag.
        </video>
      );
    } else {
      return (
        <Box textAlign="center" p={4}>
          <Typography variant="h6" gutterBottom>
            Preview not available for this file type
          </Typography>
          <Button variant="contained" href={fileUrl} target="_blank" rel="noopener noreferrer">
            Download File
          </Button>
        </Box>
      );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        style: { minHeight: "80vh" },
      }}
    >
      <DialogTitle>
        Document Preview
        {document?.filePath && <Box onClick={handleDownload} style={{ float: "right", textDecoration: "none" }}></Box>}
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="400px">
            <CircularProgress />
          </Box>
        ) : (
          getPreviewContent()
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ReportingForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clientsList, setClientsList] = useState([]);
  const [journals, setJournals] = useState([]);
  const [fullScreenRemarksVisible, setFullScreenRemarksVisible] = useState(null);
  const [selectedShip, setSelectedShip] = useState({ id: "", shipName: "" });
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
  const [documentUploadDialogOpen, setDocumentUploadDialogOpen] = useState(false);
  const [currentRowForDocuments, setCurrentRowForDocuments] = useState(null);
  const [endorsedIssuedBy, setEndorsedIssuedBy] = useState([]);
  const [selectSurveyor, setSelectSurveyor] = useState("");
  const [surveyorName, setSurveyorName] = useState({});
  const [open, setOpen] = useState();
  const [openPreviewModal, setOpenPreviewModal] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [underscoreFields, setUnderscoreFields] = useState([]);
  const [reportName, setReportName] = useState("");
  const [showEndorsementField, setShowEndorsementField] = useState(false);
  const [showExtraEndorsementField, setShowExtraEndorsementField] = useState(false);
  const [endorsementTitle, setEndorsementTitle] = useState([]);
  const [openEndrosemet, setOpenEndrosemet] = useState(false);
  const [endorsementValues, setEndorsementValues] = useState({});
  const [loadingReport, setLoadingReport] = useState(false);
  const [confirmGenerate, setConfirmGenerate] = useState(false);

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

  const statusOptions = [
    { value: "Completed", label: "Completed" },
    { value: "Partheld", label: "Part held" },
  ];

  const certificateList = [
    { value: "interim", label: "Interim" },
    { value: "short_term", label: "Short Term" },
    { value: "full_term", label: "Full Term" },
    { value: "extended", label: "Extended" },
  ];

  const areAllActivitiesCompleted = () => {
    return tableData.length > 0 && tableData.every((activity) => activity.status === "Completed");
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
    const selectedIndex = journals.findIndex((journal) => journal.journalTypeId === selectedJournalTypeId);
    setjournalId(journals[selectedIndex]?.id);
    setSelectedReportNumber({
      journalTypeId: selectedJournalTypeId,
      index: selectedIndex !== -1 ? selectedIndex : null,
    });
    setTableData(journals[selectedIndex]?.activities);
    setShowTable(true);
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
    getAllActivity(journalId);
  };

  const handleContinue = async () => {
    if (!selectedShip.id) {
      toast.error("Client ID not found");
      return;
    }

    try {
      // setContinueBtnLoading(true);

      const result = await addArchiveDocument(selectedShip.id);
      console.log(result, "result");
      if (result.data.status == "success") {
        toast.success(result.data.message);
      } else {
        toast.error("Failed to continue process");
      }
    } catch (error) {
      console.error("Continue process error:", error);
      toast.error(error?.message || "Failed to continue process");
    } finally {
      // setContinueBtnLoading(false);
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
    try {
      if (underscoreFields.length > 0) {
        setOpen(true);
      } else {
        setLoadingReport(true);

        const payload = {
          reportDetailId: reportDetails?.id,

          data: {
            image: 7,
            stamp: 6,
            companyText: 8,
            ...(reportName?.toLocaleLowerCase() === "certificate of class" && {
              logo: 7,
            }),
          },
        };

        // const result = await generateFullReport({
        //   reportDetailId: reportDetails?.id,
        //   // type:"image",
        //   // image:7,
        //   // stamp:7
        //   // data: { ...reportDetails.data, endorsementValues }

        // });

        const result = await generateFullReport(payload);
        console.log(result, "result");
        if (result.data.status == "success") {
          toast.success("Report generated successfully.");
          setOpen(false);
        }
        const fileUrl = result?.data?.data;

        if (!fileUrl) {
          toast.error("Invalid file URL received.");
          return;
        }
      }
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleSubmitReport = async (extraFields) => {
    setLoading(true);
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
      if (result?.data?.status == "success" && result?.data?.message) {
        toast.success(result.data.message);
        return;
      } else if (result?.data?.data) {
        const fileUrl = result?.data?.data;
        if (fileUrl) {
          toast.success("Report generated successfully.");
          setOpen(false);
        }
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error("Network response was not ok");
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

  const handleStatusChange = async (id, value) => {
    setShowForm(false);
    setTableData((prevData) => prevData.map((item) => (item.id === id ? { ...item, status: value } : item)));
    try {
      const response = await updateActivityDetails(id, { status: value });
      if (response?.data?.status === "success") {
        toast.success("Status updated successfully.");
      } else {
        toast.error("Something went wrong ! Please try again after some time");
      }
    } catch (error) {
      toast.error("Something went wrong ! Please try again after some time");
    }
  };

  const handleRemarksChange = async (id, value) => {
    const row = tableData.find((item) => item.id === id);
    if (row && row.maxLength && value.length > row.maxLength) {
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

  const handleReportClick = async (row) => {
    try {
      setLoading(true);
      const result = await getSelectedActivityReportDetails(row?.id);
      setReportName(row?.surveyTypes?.report?.name);
      const endorsements = row?.surveyTypes?.report?.fields?.[0]?.endorsements || [];

      if (endorsements?.length > 0) {
        setEndorsementTitle(endorsements);
        // setOpenEndrosemet(true);
      }
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
        setSurveyorName(getSurveyTitle(row.surveyTypes));
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

  const onSubmit = (data) => {
    console.log("Form submitted:", data);
    console.log("Table data:", tableData);
  };

  const getRemainingChars = (rowId) => {
    const row = tableData.find((item) => item.id === rowId);
    if (row && row.maxLength) {
      return row.maxLength - (row.remarks ? row.remarks.length : 0);
    }
    return null;
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
    const response = await getSelectedReportDetails(reportDetails?.id);
    setReportDetails(response?.data?.data)
  };

  useEffect(() => {
    fetchClients();
    fetchReportDetails();
    areAllActivitiesCompleted()

  }, []);

  const fetchAllJournals = async () => {
    try {
      setLoading(true);
      const result = await getAllJournals({
        filterKey: "clientId",
        filterValue: selectedShip.id,
      });
      if (result?.status === 200) {
        setJournals(result.data.data);
      } else {
        toast.error("Something went wrong ! Please try again after some time");
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error(error?.message || "Failed to fetch journals");
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

  const handleDocumentUpload = async (rowId, documents) => {
    if (!rowId || !documents?.length) return;
  
    // optimistic update: show files immediately (using minimal metadata)
    setTableData((prev) =>
      prev.map((item) =>
        item.id === rowId
          ? {
              ...item,
              attachments: item.attachments
                ? [...item.attachments, ...documents.map((f) => ({ name: f.name, _tmp: true }))]
                : documents.map((f) => ({ name: f.name, _tmp: true })),
            }
          : item
      )
    );
  
    const formData = new FormData();
    // Backend may expect "attachments" repeated or "attachments[]". Check your API.
    documents.forEach((doc) => formData.append("attachments", doc));
  
    try {
      const response = await updateActivityDetails(rowId, formData);
  
      // If backend returns updated activity / attachments, prefer that to keep UI consistent
      if (response?.data?.status === "success") {
        const serverAttachments = response?.data?.data?.attachments;
        if (Array.isArray(serverAttachments)) {
          setTableData((prev) =>
            prev.map((item) => (item.id === rowId ? { ...item, attachments: serverAttachments } : item))
          );
        } else {
          await getAllActivity(journalId);
        }
        toast.success("Documents uploaded successfully.");
      } else {
        await getAllActivity(journalId);
        toast.error(response?.data?.message || "Something went wrong! Please try again after some time");
      }
    } catch (err) {
      console.error("Upload error:", err);
      await getAllActivity(journalId);
      toast.error("Upload failed. Please check your internet or file format.");
    }
  };
  
  const handleRemoveDocument = async (activityId, documentId) => {
    if (!activityId) {
      toast.error("Invalid activity ID");
      return;
    }

    if (!documentId) {
      toast.error("Invalid document ID");
      return;
    }

    const confirmDelete = window.confirm("Are you sure you want to delete this document?");
    if (!confirmDelete) {
      return;
    }

    try {
      const response = await deleteAttachment(activityId, documentId);
      setDocumentUploadDialogOpen(false);
      getAllActivity(journalId);
      if (response?.data?.status === "success") {
        setTableData((prevData) =>
          prevData.map((item) =>
            item.id === activityId
              ? {
                  ...item,
                  attachments: item.attachments ? item.attachments.filter((doc) => doc.id !== documentId) : [],
                }
              : item
          )
        );

        toast.success("Document removed successfully.");
      } else {
        // toast.error(response?.data?.message || "Failed to remove document");
      }
    } catch (error) {
      console.error("Error removing document:", error);
      toast.error("Failed to remove document. Please try again.");
    }
  };

  const handlePreviewDocument = (document) => {
    setPreviewDocument(document);
    setLoadingPreview(true);
    setOpenPreviewModal(true);

    setTimeout(() => {
      setLoadingPreview(false);
    }, 1000);
  };

  const openDocumentUpload = (row) => {
    setCurrentRowForDocuments(row);
    setDocumentUploadDialogOpen(true);
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

            {selectedShip.id && (
              <Box mt={2}>
                <FormControl fullWidth sx={{ maxWidth: 300 }}>
                  <Typography variant="body1" mb={1}>
                    Select Report Number
                  </Typography>
                  <Select value={selectedReportNumber.journalTypeId || ""} onChange={handleReportNumber} displayEmpty>
                    {journals.length > 0 ? (
                      <MenuItem value="" disabled>
                        Select Report
                      </MenuItem>
                    ) : (
                      <MenuItem disabled>No Journals found for this Client</MenuItem>
                    )}
                    {journals.map((report, index) => (
                      <MenuItem key={index} value={report.journalTypeId}>
                        {report.journalTypeId}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            {selectedShip.id && selectedReportNumber.journalTypeId && <CommonButton onClick={handleShowTable} sx={{ marginTop: 3 }} text="Continue" />}
            {selectedShip.id && selectedReportNumber.journalTypeId && <CommonButton onClick={handleContinue} disabled={!areAllActivitiesCompleted()} sx={{ marginTop: 3, marginLeft: 2 }} text="Completed" />}
 
          </Box>
        )}
      </CommonCard>

      {showTable && (
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <CommonCard sx={{ mt: 2 }}>
            <TableContainer>
              <Table sx={{ minWidth: 650 }} aria-label="report details table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Activity Name</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Remarks</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Attachments</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Activity Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableData.map((row, index) => (
                    <TableRow key={row.id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                      <TableCell component="th" scope="row">
                        {index + 1}
                      </TableCell>
                      <TableCell>{getSurveyTitle(row?.surveyTypes?.name || row?.name)}</TableCell>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Select value={row.status} onChange={(e) => handleStatusChange(row.id, e.target.value)} displayEmpty>
                            <MenuItem value="" disabled>
                              Select Status
                            </MenuItem>
                            {statusOptions.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <Controller
                          name={`remarks-${row.id}`}
                          control={control}
                          defaultValue={row.remarks}
                          render={({ field }) => (
                            <>
                              <TextareaAutosize
                                {...field}
                                value={row.remarks}
                                minRows={2}
                                placeholder="Enter Remarks"
                                style={{
                                  width: "100%",
                                  padding: "8px",
                                  fontFamily: "inherit",
                                  fontSize: "inherit",
                                  border: "1px solid #ccc",
                                  borderRadius: "4px",
                                }}
                                onFocus={(event) => {
                                  event.target.blur();
                                  setFullScreenRemarksVisible(row);
                                }}
                                maxLength={row.maxLength || undefined}
                                onChange={(e) => {
                                  field.onChange(e);
                                  handleRemarksChange(row.id, e.target.value);
                                }}
                              />
                            </>
                          )}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton color="primary" onClick={() => openDocumentUpload(row)} size="small" aria-label="upload attachments">
                          <AttachmentIcon />
                          {row.attachments && row.attachments.length > 0 && (
                            <Typography variant="caption" color="primary" sx={{ marginLeft: 1 }}>
                              {row.attachments.length}
                            </Typography>
                          )}
                        </IconButton>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton color="primary" onClick={() => handleReportClick(row)} size="small" aria-label="view report">
                          <DescriptionIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CommonCard>
        </Box>
      )}

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
                <>
                  <Grid2 size={{ md: 3 }}>
                    <Controller
                      name="validitydate"
                      control={control}
                      render={({ field }) => (
                        <CommonInput
                          {...field}
                          type="date"
                          label={
                            <>
                              Validity Date <span style={{ color: "red" }}>*</span>
                            </>
                          }
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
                </>
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
                <FormControl fullWidth sx={{ maxWidth: 255 }}>
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
                  {/* {errors.issuedBy && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, ml: 1.75 }}>
                      {errors.issuedBy.message}
                    </Typography>
                  )} */}
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
                          Place Of Issuance <span style={{ color: "red" }}>*</span>
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

      <DocumentUploadDialog
        open={documentUploadDialogOpen}
        onClose={() => setDocumentUploadDialogOpen(false)}
        onUpload={(documents) => {
          if (currentRowForDocuments) {
            handleDocumentUpload(currentRowForDocuments.id, documents);
            getAllActivity(journalId);
          }
        }}
        selectedDocuments={currentRowForDocuments?.attachments || []}
        onRemoveDocument={(documentId) => {
          if (currentRowForDocuments) {
            handleRemoveDocument(currentRowForDocuments.id, documentId);
          }
        }}
        onPreviewDocument={(document) => {
          handlePreviewDocument(document);
        }}
      />
      <DocumentPreviewModal open={openPreviewModal} onClose={() => setOpenPreviewModal(false)} document={previewDocument} loading={loadingPreview} />

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
    </Box>
  );
};

export default ReportingForm;
