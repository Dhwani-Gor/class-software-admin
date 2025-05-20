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

// New component for Document Upload Dialog
const DocumentUploadDialog = ({
  open,
  onClose,
  onUpload,
  selectedDocuments,
  onRemoveDocument
}) => {
  const [documents, setDocuments] = useState([]);
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
    const fileType = file?.type?.split('/')[0];
    // const fileName = file.name;

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

  console.log(documents, "documents")

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

          {/* Newly selected documents */}
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
                    {renderFileIcon(file)} {file.name}
                  </Typography>
                  {/* <IconButton onClick={() => handleRemoveDocument(index)} size="small">
                    <DeleteIcon fontSize="small" />
                  </IconButton> */}
                </Box>
              ))}
            </Box>
          )}

          {/* Previously uploaded documents */}
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
                    {renderFileIcon(doc)} {doc.name}
                  </Typography>
                  {/* <IconButton onClick={() => onRemoveDocument(index)} size="small">
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
  // New state for document uploads
  const [documentUploadDialogOpen, setDocumentUploadDialogOpen] = useState(false);
  const [currentRowForDocuments, setCurrentRowForDocuments] = useState(null);
  const [endorsedIssuedBy, setEndorsedIssuedBy] = useState([]);
  const [selectSurveyor, setSelectSurveyor] = useState("");
  console.log(selectSurveyor,"selectSurveyor")

  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      remarks: "",
    },
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
    setSelectCertificate(event.target.value);
  };

  const handleSurveyor = (event) => {
    setSelectSurveyor(event.target.value);
  };

  const handleShowTable = () => {
    setShowTable(true);
    getAllActivity(journalId)
  };

  const generateReport = async (payload) => {
    try {
      setLoading(true);
      const result = await createReportDetail(payload);
      if (result?.data?.status === 'success') {
        setReportDetails(result?.data?.data);
        toast.success("Report saved successfully.")
        showForm(false);
      } else {
        toast.error("Something went wrong ! Please try again after some time")
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error(error)
    }
  };

  const updateReport = async (payload) => {
    try {
      setLoading(true);
      const result = await updateReportDetail(reportDetails?.id, payload);
      if (result?.data?.status === 'success') {
        setReportDetails(result?.data?.data);
        toast.success("Report updated successfully.")
        showForm(false);
      } else {
        toast.error("Something went wrong ! Please try again after some time")
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error(error)
    }
  };

  const handleGenerateReport = () => {
    const values = getValues();

    const formatDate = (date) => {
      return date ? new Date(date).toISOString() : null;
    };

    const payload = {
      activityId: selectedRow?.id,
      typeOfSurvey: values.typesOfSurvey || null,
      typeOfCertificate: selectCertificate || null,
      issuanceDate: values.issuancedate ? formatDate(values.issuancedate) : null,
      validityDate: values.validitydate ? formatDate(values.validitydate) : null,
      surveyDate: values.surveydate ? formatDate(values.surveydate) : null,
      endorsementDate: values.endorsementdate ? formatDate(values.endorsementdate) : null,
      issuedBy: Number(selectSurveyor) || null,
      place: values.place || null
    };

    if (reportDetails) {
      updateReport(payload)
    } else {
      generateReport(payload);
    }
  };

  const handleFullReportGeneration = async () => {
    try {
      console.log('278 ===>', reportDetails);

      const result = await generateFullReport({
        reportDetailId: reportDetails?.id
      })
      if (result?.data.data) {
        setLoading(true);
        const link = document.createElement('a');
        link.href = result.data.data;
        link.download = 'report.docx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setLoading(false);
      }
      console.log('280 ===>', result);
      if (result?.data?.status === 'success') {
        toast.success("Report generated successfully.")
        showForm(false);
      } else {
        toast.error("Something went wrong ! Please try again after some time")
      }
      console.log('279 ===>', result.data.data);
    } catch (error) {
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

    // Check if max length is defined and enforce it
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
        setValue('typesOfSurvey', getSurveyTitle(row.surveyTypes?.name));
        setSelectCertificate(reportData?.typeOfCertificate ? reportData?.typeOfCertificate : "");
        setValue('issuancedate', reportData?.issuanceDate ? moment(reportData?.issuanceDate).format("YYYY-MM-DD") : '');
        setValue('validitydate', reportData?.validityDate ? moment(reportData?.validityDate).format("YYYY-MM-DD") : '');
        setValue('surveydate', reportData?.surveyDate ? moment(reportData?.surveyDate).format("YYYY-MM-DD") : "");
        setValue('endorsementdate', reportData?.endorsementDate ? moment(reportData?.endorsementDate).format("YYYY-MM-DD") : "");
        setValue('issuedBy', reportData?.issuedBy ? reportData?.issuedBy : "");
        setSelectSurveyor(reportData?.issuedBy.toString() ? reportData?.issuedBy.toString() : "");
        setValue('place', reportData?.place ? reportData?.place : "");
      } else {
        const reportData = result?.data?.data[0];
        setShowForm(true);
        setSelectedRow(row);
        setValue('typesOfSurvey', getSurveyTitle(row.surveyTypes?.name));
        setSelectCertificate(reportData?.typeOfCertificate ? reportData?.typeOfCertificate : "");
        setValue('issuancedate', reportData?.issuanceDate ? moment(reportData?.issuanceDate).format("YYYY-MM-DD") : '');
        setValue('validitydate', reportData?.validityDate ? moment(reportData?.validityDate).format("YYYY-MM-DD") : '');
        setValue('surveydate', reportData?.surveyDate ? moment(reportData?.surveyDate).format("YYYY-MM-DD") : "");
        setValue('endorsementdate', reportData?.endorsementDate ? moment(reportData?.endorsementDate).format("YYYY-MM-DD") : "");
        setValue('issuedBy', reportData?.issuedBy ? reportData?.issuedBy : "");
        setSelectSurveyor(reportData?.issuedBy ? reportData?.issuedBy : "");
        setValue('place', reportData?.place ? reportData?.place : "");
      }
    } catch (error) {
      toast.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (data) => {
    console.log("Form submitted:", data);
    console.log("Table data:", tableData);
  };

  // Get remaining characters for specific row
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
        toast.error("Something went wrong ! Please try again after some time")
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error(error)
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
      toast.error(error)
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
      toast.error(error);
    }
  };

  useEffect(() => {
    getAllActivity(journalId)
    getEndorsedIssuedByList(journalId);

  }, [journalId]);

console.log(journalId,"journalId")
console.log(endorsedIssuedBy,"endorsedIssuedBy 544")
  const getEndorsedIssuedByList = async (journalId) => {
    try {
    
      const result = await getEndorsedIssuedBy('journalId', journalId);
      console.log(result,"result")
      if (result?.data?.status === "success") {
        setEndorsedIssuedBy(result?.data.uniqueSurveyors);
      } else {
        toast.error("Something went wrong ! Please try again after some time");
      }
    } catch (error) {
      toast.error(error);
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
                  Select the ship / Work
                </Typography>
                <Select
                  value={selectedShip.id || ""}
                  onChange={handleClientChange}
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    Select the ship / Work
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
                                placeholder="Enter remarks"
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
            <Typography fontSize={'18px'} fontWeight={'600'} mt={2} mb={4}>Report Details for {selectedRow.surveyTypes?.name}</Typography>
            <Grid2 container spacing={2}>
              <Grid2 item size={{ md: 3 }}>
                <Controller
                  name="typesOfSurvey"
                  control={control}
                  render={({ field }) => (
                    <CommonInput
                      {...field}
                      disabled
                      label="Type of Survey"
                      placeholder="Type of Survey"
                      error={!!errors.typesOfSurvey}
                      helperText={errors.typesOfSurvey?.message}
                    />
                  )}
                />
              </Grid2>
              <Grid2 item size={{ md: 9 }}>
                <FormControl fullWidth sx={{ maxWidth: 255 }}>
                  <Typography variant="body1" mb={1.5}>
                    Type Of Certificate
                  </Typography>
                  <Select
                    value={selectCertificate}
                    onChange={handleCertificate}
                    displayEmpty
                  >
                    <MenuItem value="" disabled>
                      Select certificate
                    </MenuItem>
                    {certificateList.map((report) => (
                      <MenuItem key={report.value} value={report.value}>
                        {report.label}
                      </MenuItem>
                    ))}
                  </Select>
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
                      label="Issuance date"
                      error={!!errors.issuancedate}
                      helperText={errors.issuancedate?.message}
                    />
                  )}
                />
              </Grid2>
              <Grid2 size={{ md: 3 }}>
                <Controller
                  name="validitydate"
                  control={control}
                  render={({ field }) => (
                    <CommonInput
                      {...field}
                      type="date"
                      label="Validity date"
                      error={!!errors.validitydate}
                      helperText={errors.validitydate?.message}
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
                      label="Survey date"
                      error={!!errors.surveydate}
                      helperText={errors.surveydate?.message}
                    />
                  )}
                />
              </Grid2>
              <Grid2 size={{ md: 3 }}>
                <Controller
                  name="endorsementdate"
                  control={control}
                  render={({ field }) => (
                    <CommonInput
                      {...field}
                      type="date"
                      label="Endorsement date"
                      error={!!errors.endorsementdate}
                      helperText={errors.endorsementdate?.message}
                    />
                  )}
                />
              </Grid2>
              <Grid2 item size={{ md: 3 }}>
                {/* <Controller
                  name="issuedBy"
                  control={control}
                  render={({ field }) => (
                    <CommonInput
                      {...field}
                      label="Endorsed / Issued By"
                      placeholder="Endorsed / Issued By"
                      error={!!errors.issuedBy}
                      helperText={errors.issuedBy?.message}
                    />
                  )}
                /> */}
                <FormControl fullWidth sx={{ maxWidth: 255 }}>
                  <Typography variant="body1" mb={1.5}>
                  Endorsed / Issued By
                  </Typography>
                  <Select
                    value={selectSurveyor}
                    onChange={handleSurveyor}
                    displayEmpty
                    name="issuedBy"
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
                </FormControl>
              </Grid2>
              <Grid2 item size={{ md: 3 }}>
                <Controller
                  name="place"
                  control={control}
                  render={({ field }) => (
                    <CommonInput
                      {...field}
                      label="Place of Issuance"
                      placeholder="Enter place name"
                      error={!!errors.place}
                      helperText={errors.place?.message}
                    />
                  )}
                />
              </Grid2>
            </Grid2>
            <Stack direction="row" gap={'20px'}>
              <CommonButton
                onClick={handleGenerateReport}
                sx={{ marginTop: 3 }}
                text="Save"
              />
              <CommonButton
                onClick={handleFullReportGeneration}
                sx={{ marginTop: 3 }}
                text="Generate Full Report"
                isLoading={loading}
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