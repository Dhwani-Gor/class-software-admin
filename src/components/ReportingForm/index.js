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
import Paper from "@mui/material/Paper";
import CommonInput from "@/components/CommonInput";
import IconButton from "@mui/material/IconButton";
import DescriptionIcon from "@mui/icons-material/Description";
import AttachmentIcon from "@mui/icons-material/Attachment";
import DeleteIcon from "@mui/icons-material/Delete";
import TextareaAutosize from "@mui/material/TextareaAutosize";
import Grid2 from "@mui/material/Grid2";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import FullScreenRemarksDialog from "./FullScreenRemarksDialog";
import { useRouter } from "next/navigation";
import { createReportDetail, generateFullReport, getAllActivityReportDetails, getAllClients, getAllJournals, getEndorsedIssuedBy, getSelectedActivityReportDetails, updateReportDetail } from "@/api";
import { toast } from "react-toastify";
import { TYPE_OF_SURVEYS } from "@/data";
import { updateActivityDetails } from "@/api";
import { getAllActivities } from "@/api";
import moment from "moment";
import { Stack } from "@mui/material";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from 'yup';

// Updated schema with correct field names
const reportSchema = yup.object().shape({
  typesOfSurvey: yup.string().required('Type of survey is required'),
  typeOfCertificate: yup.string().required('Type of certificate is required'),
  issuancedate: yup.string().required('Issuance date is required'),
  validitydate: yup.string().required('Validity date is required'),
  surveydate: yup.string().required('Survey date is required'),
  endorsementdate: yup.string().optional(),
  issuedBy: yup.string().required('Issued by is required'),
  place: yup.string().required('Place is required'),
});

const DocumentUploadDialog = ({
  open,
  onClose,
  onUpload,
  selectedDocuments,
  onRemoveDocument
}) => {
  const [documents, setDocuments] = useState([]);
  console.log(documents, "documents")
  console.log(selectedDocuments, "selectedDocuments")

  const handleFileChange = (event) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      const validFiles = newFiles.filter(file =>
        ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'video/mp4', 'video/mpeg'].includes(file.type)
      );
      setDocuments(prev => [...prev, ...validFiles]);
    }
  };

  const handleUpload = () => {
    onUpload(documents);
    setDocuments([]);
    onClose();
  };

  const handleRemoveDocument = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const renderFileIcon = (file) => {
    let fileType;

    if (file?.type) {
      fileType = file.type.split('/')[0];
    } else if (file?.fileType) {
      fileType = file.fileType.split('/')[0];
    } else {
      fileType = 'unknown';
    }

    switch (fileType) {
      case 'image':
        return '🖼️';
      case 'application':
        return '📄';
      case 'video':
        return '🎥';
      default:
        return '📁';
    }
  };

  const getFileName = (file) => {
    if (file?.name) {
      return file.name;
    } else if (file?.fileName) {
      return file.fileName;
    }
    return 'Unknown file';
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Upload Documents</DialogTitle>
      <DialogContent sx={{ minWidth: "50vw" }}>
        <Box>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/gif,application/pdf,video/mp4,video/mpeg"
            onChange={handleFileChange}
            style={{ margin: '16px 0' }}
          />

          {documents.length > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle1">New Documents:</Typography>
              {documents.map((file, index) => (
                <Box
                  key={index}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={1}
                >
                  <Typography>
                    {renderFileIcon(file)} {getFileName(file)}
                  </Typography>
                  {/* <IconButton 
                    size="small" 
                    onClick={() => handleRemoveDocument(index)}
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton> */}
                </Box>
              ))}
            </Box>
          )}

          {selectedDocuments && selectedDocuments.length > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle1">Existing Documents:</Typography>
              {selectedDocuments.map((doc, index) => (
                <Box
                  key={index}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={1}
                >
                  <Typography>
                    {renderFileIcon(doc)} {getFileName(doc)}
                  </Typography>
                  {/* <IconButton 
                    size="small" 
                    onClick={() => onRemoveDocument && onRemoveDocument(index)}
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton> */}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleUpload}
          disabled={documents.length === 0}
        >
          Upload
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
  const [selectedReportNumber, setSelectedReportNumber] = useState({ journalTypeId: "", index: null });
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

  // Form setup with validation only on submit
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
      remarks: '',
      typesOfSurvey: '',
      typeOfCertificate: '',
      issuancedate: '',
      validitydate: '',
      surveydate: '',
      endorsementdate: '',
      issuedBy: '',
      place: '',
    },
    resolver: yupResolver(reportSchema),
    // Remove mode: 'onChange' to prevent validation on every change
  });

  console.log("Form errors:", errors);

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

  const handleClientChange = (event) => {
    const selectedId = event.target.value;
    const selectedClient = clientsList.find(client => client.id === selectedId);
    setSelectedShip({
      id: selectedId,
      shipName: selectedClient ? selectedClient.shipName : ""
    });
  };

  const handleReportNumber = (event) => {
    setShowTable(false)
    const selectedJournalTypeId = event.target.value;
    const selectedIndex = journals.findIndex(journal => journal.journalTypeId === selectedJournalTypeId);
    setjournalId(journals[selectedIndex]?.id)
    setSelectedReportNumber({
      journalTypeId: selectedJournalTypeId,
      index: selectedIndex !== -1 ? selectedIndex : null
    });
    setTableData(journals[selectedIndex]?.activities)
  };

  const handleCertificate = (event) => {
    const value = event.target.value;
    setSelectCertificate(value);
    setValue('typeOfCertificate', value);
    // Clear error when user makes a selection
    if (value && errors.typeOfCertificate) {
      clearErrors('typeOfCertificate');
    }
  };

  const handleSurveyor = (event) => {
    const value = event.target.value;
    setSelectSurveyor(value);
    setValue('issuedBy', value);
    // Clear error when user makes a selection
    if (value && errors.issuedBy) {
      clearErrors('issuedBy');
    }
  };

  // Function to clear field error when user types
  const handleFieldChange = (fieldName, value) => {
    if (value && value.trim() !== '' && errors[fieldName]) {
      clearErrors(fieldName);
    }
  };

  const handleShowTable = () => {
    setShowTable(true);
    getAllActivity(journalId)
  };

  const handleGenerateReport = async () => {
    const isValid = await trigger();

    if (!isValid) {
      console.log("Form validation failed:", errors);
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    const values = getValues();
    console.log("Form values:", values);

    const formatDate = (date) => {
      return date ? new Date(date).toISOString() : null;
    };

    const payload = {
      activityId: selectedRow?.id,
      typeOfSurvey: values.typesOfSurvey || null,
      typeOfCertificate: values.typeOfCertificate || null,
      issuanceDate: values.issuancedate ? formatDate(values.issuancedate) : null,
      validityDate: values.validitydate ? formatDate(values.validitydate) : null,
      surveyDate: values.surveydate ? formatDate(values.surveydate) : null,
      endorsementDate: values.endorsementdate ? formatDate(values.endorsementdate) : null,
      issuedBy: Number(values.issuedBy) || null,
      place: values.place || null
    };

    if (reportDetails) {
      updateReport(payload)
    } else {
      generateReport(payload);
    }
  };

  const generateReport = async (payload) => {
    try {
      setLoading(true);
      const result = await createReportDetail(payload);
      console.log(result, "result")
      if (result?.data?.status === 'success') {
        setReportDetails(result?.data?.data);
        toast.success("Report saved successfully.")
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
      if (result?.data?.status === 'success') {
        setReportDetails(result?.data?.data);
        toast.success("Report updated successfully.")
      } else {
        toast.error(result?.data?.message)
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error(error?.message || "An error occurred")
    }
  };

  const handleFullReportGeneration = async () => {
    try {
      const surveyAbbr = surveyorName?.abbreviation || 'Survey';
      const certType = selectCertificate || 'Type';
      const reportNo = selectedReportNumber?.journalTypeId || 'Unknown';
      const result = await generateFullReport({
        reportDetailId: reportDetails?.id
      })
      if (result?.data.data) {
        setLoading(true);

        const link = document.createElement('a');
        link.href = result.data.data;
        link.download = `${surveyAbbr}_${certType}_${reportNo}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setLoading(false);
      }
      if (result?.data?.status === 'success') {
        toast.success("Report generated successfully.")
      } else {
        toast.error("Something went wrong ! Please try again after some time")
      }
    } catch (error) {
      toast.error("Failed to generate full report");
    }
  }

  const handleStatusChange = async (id, value) => {
    setTableData((prevData) =>
      prevData.map((item) =>
        item.id === id ? { ...item, status: value } : item
      )
    );
    try {
      const response = await updateActivityDetails(id, { status: value });
      if (response?.data?.status === 'success') {
        toast.success("Status updated successfully.");
      } else {
        toast.error("Something went wrong ! Please try again after some time")
      }
    } catch (error) {
      toast.error("Something went wrong ! Please try again after some time")
    }
  };

  const handleRemarksChange = async (id, value) => {
    const row = tableData.find((item) => item.id === id);
    if (row && row.maxLength && value.length > row.maxLength) {
      return;
    }

    setTableData((prevData) =>
      prevData.map((item) =>
        item.id === id ? { ...item, remarks: value } : item
      )
    );
    try {
      const response = await updateActivityDetails(id, { remarks: value });
      if (response?.data?.status === 'success') {
        toast.success("Remarks updated successfully.");
      } else {
        toast.error("Something went wrong ! Please try again after some time")
      }
    } catch (error) {
      toast.error("Something went wrong ! Please try again after some time", error)
    }
  };

  const handleReportClick = async (row) => {
    try {
      setLoading(true);
      const result = await getSelectedActivityReportDetails(row?.id);
      console.log('375 ===>', result);
      if (result?.data?.status === "success") {
        setReportDetails(result?.data?.data[0]);
        router.push('#reportDetails');
        const reportData = result?.data?.data[0];
        console.log(reportData)
        setShowForm(true);
        setSelectedRow(row);

        // Clear any existing errors when loading existing data
        clearErrors();

        // Set form values
        setValue('typesOfSurvey', getSurveyTitle(row.surveyTypes?.name));
        setSurveyorName(getSurveyTitle(row.surveyTypes));
        setValue('typeOfCertificate', reportData?.typeOfCertificate || "");
        setSelectCertificate(reportData?.typeOfCertificate || "");
        setValue('issuancedate', reportData?.issuanceDate ? moment(reportData?.issuanceDate).format("YYYY-MM-DD") : '');
        setValue('validitydate', reportData?.validityDate ? moment(reportData?.validityDate).format("YYYY-MM-DD") : '');
        setValue('surveydate', reportData?.surveyDate ? moment(reportData?.surveyDate).format("YYYY-MM-DD") : "");
        setValue('endorsementdate', reportData?.endorsementDate ? moment(reportData?.endorsementDate).format("YYYY-MM-DD") : "");
        setValue('issuedBy', reportData?.issuedBy?.toString() || "");
        setSelectSurveyor(reportData?.issuedBy?.toString() || "");
        setValue('place', reportData?.place || "");
      } else {
        // Clear any existing errors when creating new form
        clearErrors();
        setShowForm(true);
        setSelectedRow(row);
        setValue('typesOfSurvey', getSurveyTitle(row.surveyTypes?.name));
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
        setClientsList(result.data.data)
      } else {
        toast.error(result?.message)
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error(error?.message || "Failed to fetch clients")
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchAllJournals = async () => {
    try {
      setLoading(true);
      const result = await getAllJournals('clientId', selectedShip.id);
      if (result?.status === 200) {
        setJournals(result.data.data)
      } else {
        toast.error("Something went wrong ! Please try again after some time")
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error(error?.message || "Failed to fetch journals")
    }
  };

  useEffect(() => {
    if (selectedShip.id) {
      fetchAllJournals();
    }
  }, [selectedShip.id]);

  const getSurveyTitle = (val) => {
    return TYPE_OF_SURVEYS.find(ele => ele.value === val)?.label || val;
  }

  const handleDocumentUpload = async (rowId, documents) => {
    setTableData((prevData) =>
      prevData.map((item) =>
        item.id === rowId
          ? {
            ...item,
            attachments: item.attachments
              ? [...item.attachments, ...documents]
              : documents
          }
          : item
      )
    );
    const formData = new FormData();
    documents.forEach((doc, index) => {
      formData.append("attachments", doc);
    });

    try {
      const response = await updateActivityDetails(rowId, formData);
      if (response?.data?.status === "success") {
        toast.success("Documents uploaded successfully.");
      } else {
        toast.error("Something went wrong! Please try again after some time");
      }
    } catch (err) {
      toast.error("Upload failed. Please check your internet or file format.");
      console.error(err);
    }
  };

  const handleRemoveDocument = (rowId, documentIndex) => {
    setTableData((prevData) =>
      prevData.map((item) =>
        item.id === rowId
          ? {
            ...item,
            attachments: item.attachments.filter((_, index) => index !== documentIndex)
          }
          : item
      )
    );
  };

  const openDocumentUpload = (row) => {
    setCurrentRowForDocuments(row);
    setDocumentUploadDialogOpen(true);
  };

  const getAllActivity = async (id) => {
    try {
      setLoading(true);
      const result = await getAllActivities('journalId', id);
      if (result?.data?.status === "success") {
        setTableData(result?.data?.data);
      } else {
        toast.error("Something went wrong ! Please try again after some time");
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error(error?.message || "Failed to fetch activities");
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
      const result = await getEndorsedIssuedBy('journalId', journalId);
      if (result?.data?.status === "success") {
        setEndorsedIssuedBy(result?.data.uniqueSurveyors);
      } else {
        toast.error("Something went wrong ! Please try again after some time");
      }
    } catch (error) {
      toast.error(error?.message || "Failed to fetch surveyors");
    }
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
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="300px"
          >
            <CircularProgress />
          </Box>
        ) : (
          <Box mt={3}>
            <Box>
              <FormControl fullWidth sx={{ maxWidth: 300 }}>
                <Typography variant="body1" mb={1}>
                  Select the Ship / Work
                </Typography>
                <Select
                  value={selectedShip.id || ""}
                  onChange={handleClientChange}
                  displayEmpty
                >
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
                  <Select
                    value={selectedReportNumber.journalTypeId || ""}
                    onChange={handleReportNumber}
                    displayEmpty
                  >
                    {journals.length > 0 ?
                      <MenuItem value="" disabled>
                        Select Report
                      </MenuItem> :
                      <MenuItem disabled>No Journals found for this Client</MenuItem>
                    }
                    {journals.map((report, index) => (
                      <MenuItem key={index} value={report.journalTypeId}>
                        {report.journalTypeId}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            {selectedShip.id && selectedReportNumber.journalTypeId && (
              <CommonButton
                onClick={handleShowTable}
                sx={{ marginTop: 3 }}
                text="Continue"
              />
            )}
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
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Activity Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Remarks</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Attachments</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Activity Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableData.map((row, index) => (
                    <TableRow
                      key={row.id}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {row.id}
                      </TableCell>
                      <TableCell>{getSurveyTitle(row.surveyTypes.name)}</TableCell>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Select
                            value={row.status}
                            onChange={(e) =>
                              handleStatusChange(row.id, e.target.value)
                            }
                            displayEmpty
                          >
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
                        <IconButton
                          color="primary"
                          onClick={() => openDocumentUpload(row)}
                          size="small"
                          aria-label="upload attachments"
                        >
                          <AttachmentIcon />
                          {row.attachments && row.attachments.length > 0 && (
                            <Typography
                              variant="caption"
                              color="primary"
                              sx={{ marginLeft: 1 }}
                            >
                              {row.attachments.length}
                            </Typography>
                          )}
                        </IconButton>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          onClick={() => handleReportClick(row)}
                          size="small"
                          aria-label="view report"
                        >
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
            <Typography fontSize={'18px'} fontWeight={'600'} mt={2} mb={4}>
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
                      label={<>Type of Survey <span style={{ color: 'red' }}>*</span></>}
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
                  <Typography variant="body1" fontWeight={'500'} mb={1.5}>
                    Type Of Certificate <span style={{ color: 'red' }}>*</span>
                  </Typography>
                  <Select
                    value={selectCertificate}
                    onChange={handleCertificate}
                    displayEmpty
                    error={!!errors.typeOfCertificate}
                  >
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
                      label={<>Issuance Date <span style={{ color: 'red' }}>*</span></>}
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange('issuancedate', e.target.value);
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
              <Grid2 size={{ md: 3 }}>
                <Controller
                  name="validitydate"
                  control={control}
                  render={({ field }) => (
                    <CommonInput
                      {...field}
                      type="date"
                      label={<>Validity Date <span style={{ color: 'red' }}>*</span></>}
                      error={!!errors.validitydate}
                      helperText={errors.validitydate?.message}
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange('validitydate', e.target.value);
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
              <Grid2 size={{ md: 3 }}>
                <Controller
                  name="surveydate"
                  control={control}
                  render={({ field }) => (
                    <CommonInput
                      {...field}
                      type="date"
                      label={<>Survey Date <span style={{ color: 'red' }}>*</span></>}
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange('surveydate', e.target.value);
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
              <Grid2 size={{ md: 3 }}>
                <Controller
                  name="endorsementdate"
                  control={control}
                  render={({ field }) => (
                    <CommonInput
                      {...field}
                      type="date"
                      label={<>Endorsement Date <span style={{ color: 'red' }}>*</span></>}
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange('endorsementdate', e.target.value);
                      }}
                    />
                  )}
                />
                {errors.endorsementdate && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, ml: 1.75 }}>
                    {errors.endorsementdate.message}
                  </Typography>
                )}
              </Grid2>
              <Grid2 item size={{ md: 3 }}>
                <FormControl fullWidth sx={{ maxWidth: 255 }}>
                  <Typography variant="body1" mb={1.5} fontWeight={500}>
                    Endorsed / Issued By <span style={{ color: 'red' }}>*</span>
                  </Typography>
                  <Select
                    value={selectSurveyor}
                    onChange={handleSurveyor}
                    displayEmpty
                    name="issuedBy"
                    error={!!errors.issuedBy}
                  >
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
                      label={<>Place Of Issuance <span style={{ color: "red" }}>*</span></>}
                      placeholder="Enter place name"
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange('place', e.target.value);
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
            <Stack direction="row" gap={'20px'}>
              <CommonButton
                onClick={handleGenerateReport}
                sx={{ marginTop: 3 }}
                text="Save"
                isLoading={loading}
              />
              <CommonButton
                onClick={handleFullReportGeneration}
                sx={{ marginTop: 3 }}
                text="Generate Full Report"
                isLoading={loading}
                disabled={!reportDetails}
              />
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
          }
        }}
        selectedDocuments={currentRowForDocuments?.attachments || []}
        onRemoveDocument={(index) => {
          if (currentRowForDocuments) {
            handleRemoveDocument(currentRowForDocuments.id, index);
          }
        }}
      />

      <FullScreenRemarksDialog
        open={fullScreenRemarksVisible}
        onCancel={() => setFullScreenRemarksVisible(null)}
        onConfirm={(value) => {
          if (fullScreenRemarksVisible && typeof fullScreenRemarksVisible === 'object') {
            handleRemarksChange(fullScreenRemarksVisible.id, value);
          }
          setFullScreenRemarksVisible(null);
        }}
        title={fullScreenRemarksVisible && typeof fullScreenRemarksVisible === 'object'
          ? `Remarks for ${fullScreenRemarksVisible.surveyTypes.name}`
          : "Remarks"}
      />
    </Box>
  );
};

export default ReportingForm;