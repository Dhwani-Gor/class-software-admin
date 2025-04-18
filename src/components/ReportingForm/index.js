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
import TextareaAutosize from "@mui/material/TextareaAutosize";
import Grid2 from "@mui/material/Grid2";

const ReportingForm = () => {
  const [loading, setLoading] = useState(false);
  const [selectedShip, setSelectedShip] = useState("");
  const [selectedReportNumber, setSelectedReportNumber] = useState("");
  const [selectCertificate, setSelectCertificate] = useState("");
  const [showTable, setShowTable] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [tableData, setTableData] = useState([
    {
      id: 1,
      serialNo: "1",
      activityName: "activity 1",
      status: "",
      remarks: "",
    },
    {
      id: 2,
      serialNo: "2",
      activityName: "activity 2",
      status: "",
      remarks: "",
    },
    {
      id: 3,
      serialNo: "3",
      activityName: "activity 3",
      status: "",
      remarks: "",
      maxLength: 1000,
    },
    {
      id: 4,
      serialNo: "4",
      activityName: "activity 4",
      status: "",
      remarks: "",
      maxLength: 1000,
    },
  ]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      remarks: "",
    },
  });

  const statusOptions = [
    { value: "completed", label: "Completed" },
    { value: "partheld", label: "Part held" },
  ];

  const shipList = [
    { value: "1", label: "ship 1" },
    { value: "2", label: "ship 2" },
    { value: "3", label: "ship 3" },
    { value: "4", label: "ship 4" },
  ];

  const ReportNumberList = [
    { value: "CC25N001", label: "CC25N001" },
    { value: "CC25P001", label: "CC25P001" },
    { value: "CC25C001", label: "CC25C001" },
    { value: "CC25M001", label: "CC25M001" },
  ];

  const certificateList = [
    { value: "interim", label: "Interim" },
    { value: "shortterm", label: "Short Term" },
    { value: "fullterm", label: "Full Term" },
    { value: "extended", label: "Extended" },
  ];

  const handleClientChange = (event) => {
    setSelectedShip(event.target.value);
  };

  const handleReportNumber = (event) => {
    setSelectedReportNumber(event.target.value);
  };

  const handleCertificate = (event) => {
    setSelectCertificate(event.target.value);
  };

  const handleShowTable = () => {
    setShowTable(true);
  };

  const handleGenerateReport = () => {};

  const handleStatusChange = (id, value) => {
    setTableData((prevData) =>
      prevData.map((item) =>
        item.id === id ? { ...item, status: value } : item
      )
    );
  };

  const handleRemarksChange = (id, value) => {
    const row = tableData.find((item) => item.id === id);

    // Check if max length is defined and enforce it
    if (row.maxLength && value.length > row.maxLength) {
      return;
    }

    setTableData((prevData) =>
      prevData.map((item) =>
        item.id === id ? { ...item, remarks: value } : item
      )
    );
  };

  const handleReportClick = (row) => {
    console.log("Report clicked for row:", row);
    setShowForm(true);
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
                  value={selectedShip}
                  onChange={handleClientChange}
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    Select the ship / Work
                  </MenuItem>
                  {shipList.map((client) => (
                    <MenuItem key={client.value} value={client.value}>
                      {client.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {selectedShip && (
              <Box mt={2}>
                <FormControl fullWidth sx={{ maxWidth: 300 }}>
                  <Typography variant="body1" mb={1}>
                    Select Report Number
                  </Typography>
                  <Select
                    value={selectedReportNumber}
                    onChange={handleReportNumber}
                    displayEmpty
                  >
                    <MenuItem value="" disabled>
                      Select Report
                    </MenuItem>
                    {ReportNumberList.map((report) => (
                      <MenuItem key={report.value} value={report.value}>
                        {report.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            {selectedShip && selectedReportNumber && (
              <CommonButton
                onClick={handleShowTable}
                sx={{ marginTop: 3 }}
                text="Submit"
              />
            )}
          </Box>
        )}
      </CommonCard>

      {showTable && (
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <CommonCard sx={{ mt: 2 }}>
            {/* <Typography variant="h6" fontWeight={700} mb={2}>
              Report Details
            </Typography> */}
            {/* <TableContainer component={Paper}> */}
            <TableContainer>
              <Table sx={{ minWidth: 650 }} aria-label="report details table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Serial No</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Activity Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Remarks</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Report</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableData.map((row) => (
                    <TableRow
                      key={row.id}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {row.serialNo}
                      </TableCell>
                      <TableCell>{row.activityName}</TableCell>
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
            {/* <Box mt={3} display="flex" justifyContent="flex-start">
              <CommonButton type="submit" text="Generate Report" />
            </Box> */}
          </CommonCard>
        </Box>
      )}

      {showForm && (
        <CommonCard sx={{ mt: 2 }}>
          <Grid2 container spacing={2}>
            <Grid2 item size={{ md: 3 }}>
              <Controller
                name="typesOfSurvey"
                control={control}
                render={({ field }) => (
                  <CommonInput
                    {...field}
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
              <Controller
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
              />
            </Grid2>
          </Grid2>
          <Box>
            <CommonButton
              onClick={handleGenerateReport}
              sx={{ marginTop: 3 }}
              text="Generate Report"
            />
          </Box>
        </CommonCard>
      )}
    </Box>
  );
};

export default ReportingForm;
