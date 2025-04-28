"use client";
import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Grid2 from "@mui/material/Grid2";
import CommonCard from "@/components/CommonCard";
import CommonInput from "@/components/CommonInput";
import CommonButton from "@/components/CommonButton";
import VisitModal from "../VisitModal";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ActivitiesModal from "../ActivitiesModal";
import {
  generateInspection,
  getAllClients,
  getJournal,
  getShipDetails,
  getUsersDetails,
} from "@/api";
import {
  CircularProgress,
  Divider,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import CommonConfirmationDialog from "@/components/Dialogs/CommonConfirmationDialog";
import moment from "moment";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const schema = yup.object().shape({
  shipWork: yup.string().required("Ship name is required"),
  imoNumber: yup.string().required("IMO Number is required"),
  classId: yup.string().required("Class ID is required"),
  requestedBy: yup.string().required("Requested By is required"),
  date: yup.date().required("Date is required").typeError("required"),
  type: yup.string().required("Type of survey must be selected"),
});

const journalTypeOptions = [
  { id: "new_entry", value: "new_entry", label: "New Entry" },
  { id: "periodical", value: "periodical", label: "Periodical" },
  {
    id: "component_survey",
    value: "component_survey",
    label: "Component Survey",
  },
  {
    id: "miscellaneous_survey",
    value: "miscellaneous_survey",
    label: "Miscellaneous Survey",
  },
];

const JournalEntryForm = ({ journalId = null }) => {
  const { userInfo } = useSelector((state) => state.auth);
  const [visitList, setVisitList] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editVisit, setEditVisit] = useState(null);
  const [activitiesList, setActivitiesList] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [openActivityModal, setOpenActivityModal] = useState(false);
  const [editActivity, setEditActivity] = useState(null);
  const [selectedClient, setSelectedClient] = useState("");
  const [isShowForm, setIsShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [journalData, setJournalData] = useState(null);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      shipWork: "",
      imoNumber: "",
      classId: "",
      requestedBy: "",
      date: "",
      type: "",
    },
  });

  const handleOpenModal = () => {
    setEditVisit(null);
    setOpenModal(true);
  };

  const onLastVisitConfirmation = (response) => {
    if (response) {
      // freezeJournal()
      console.log("journalFreezed");
      setOpenDialog(false);
    } else {
      setOpenDialog(false);
      handleSubmit(onSubmit);
    }
  };

  const handleCloseModal = () => setOpenModal(false);

  const handleSaveVisit = (visitData) => {
    if (editVisit) {
      setVisitList(
        visitList.map((visit) =>
          visit.id === editVisit.id
            ? { ...visit, ...visitData, id: editVisit.id }
            : visit
        )
      );
    } else {
      setVisitList([...visitList, { id: Date.now(), ...visitData }]);
    }
    setOpenModal(false);
  };

  const handleEdit = (visit) => {
    setEditVisit(visit);
    setOpenModal(true);
  };

  const handleDelete = (id) => {
    setVisitList(visitList.filter((visit) => visit.id !== id));
  };

  const handleOpenActivityModal = () => {
    setEditActivity(null);
    setOpenActivityModal(true);
  };

  const handleCloseActivityModal = () => setOpenActivityModal(false);

  const handleSaveActivity = (activityData) => {
    if (editActivity) {
      setActivitiesList(
        activitiesList.map((activity) =>
          activity.id === editActivity.id
            ? { ...activity, ...activityData, id: editActivity.id }
            : activity
        )
      );
    } else {
      setActivitiesList([
        ...activitiesList,
        { id: Date.now(), ...activityData },
      ]);
    }
    setOpenActivityModal(false);
  };

  const handleEditActivity = (activity) => {
    setEditActivity(activity);
    setOpenActivityModal(true);
  };

  const handleActivityDelete = (id) => {
    setActivitiesList(activitiesList.filter((activity) => activity.id !== id));
  };

  const handleClientChange = (event) => {
    const { shipName, classId, imoNumber } = event.target.value;
    setSelectedClient(event.target.value);
    setValue("shipWork", shipName);
    setValue("classId", classId);
    setValue("imoNumber", imoNumber);
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      const result = await getAllClients();
      if (result?.status === 200) {
        setClientsList(result.data.data);
      } else {
        toast.error("Something went wrong ! Please try again after some time");
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error(error);
    }
  };

  const fetchJournal = async () => {
    try {
      setLoading(true);
      const result = await getJournal(journalId);
      if (result?.status === 200) {
        const journalData = result.data.data;
        setJournalData(journalData);
        
        // Set the form values
        setValue("shipWork", journalData.client.shipName);
        setValue("imoNumber", journalData.client.imoNumber);
        setValue("classId", journalData.client.classId);
        setValue("requestedBy", journalData.requestedBy);
        setValue("date", moment(journalData.date).format("YYYY-MM-DD"));
        setValue("type", journalData.journalType);
        
        // Set the client
        setSelectedClient({
          id: journalData.clientId,
          shipName: journalData.client.shipName,
          imoNumber: journalData.client.imoNumber,
          classId: journalData.client.classId
        });
        
        // Set visit details and activities if they exist
        if (journalData.visitDetails && journalData.visitDetails.length > 0) {
          setVisitList(journalData.visitDetails);
        }
        
        if (journalData.activities && journalData.activities.length > 0) {
          setActivitiesList(journalData.activities);
        }
        
        // Show the form for editing
        setIsShowForm(true);
      } else {
        toast.error("Something went wrong ! Please try again after some time");
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error(error.message || "Failed to fetch journal data");
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (journalId) {
      fetchJournal();
    }
  }, [journalId]);

  const showForm = () => {
    setIsShowForm(true);
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        userId: userInfo?.id,
        clientId: selectedClient?.id,
        journalType: data.type,
        requestedBy: data.requestedBy,
        date: moment(data.date).toISOString(),
        isLocked: false,
        visitDetails: visitList,
        activities: activitiesList,
      };
      
      // If editing existing journal, add the journal ID
      if (journalId) {
        payload.id = journalId;
      }

      const res = await generateInspection(payload);

      if (res?.data.status === "success") {
        toast.success(journalId ? "Journal updated successfully" : "Journal created successfully");
      } else {
        throw new Error("Something went wrong");
      }
    } catch (error) {
      toast.error("Error saving journal: " + (error.message || "Unknown error"));
    }
  };

  return (
    <Box mt={2}>
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
        !journalId && !isShowForm && (
          <Box mt={3}>
            <CommonCard>
              <Box>
                <FormControl fullWidth sx={{ maxWidth: 300 }}>
                  <Typography variant="body1" mb={1}>
                    Select the ship / Work
                  </Typography>
                  <Select
                    value={selectedClient}
                    onChange={handleClientChange}
                    displayEmpty
                  >
                    <MenuItem value="" disabled>
                      Select the ship / Work
                    </MenuItem>
                    {clientsList.map((client) => (
                      <MenuItem key={client.id} value={client}>
                        {client.shipName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {selectedClient && (
                <CommonButton onClick={showForm} sx={{ marginTop: 3 }} />
              )}
            </CommonCard>
          </Box>
        )
      )}
      
      {(isShowForm || journalId) && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <CommonCard>
            <Box>
              <Typography fontSize={"18px"} fontWeight={"600"}>
                Type of Journal
              </Typography>
              <Stack>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <FormControl component="fieldset" fullWidth>
                      <RadioGroup
                        {...field}
                        row
                        aria-label="type"
                        name="type"
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                        }}
                      >
                        {journalTypeOptions.map((type) => (
                          <FormControlLabel
                            key={type.id}
                            value={type.value}
                            control={
                              <Radio
                                sx={{
                                  "&.Mui-checked": {
                                    color: "black",
                                  },
                                  "&:focus-within": {
                                    outline: "none",
                                  },
                                }}
                              />
                            }
                            label={type.label}
                          />
                        ))}
                      </RadioGroup>
                      {Boolean(errors.type) && (
                        <FormHelperText error>
                          {errors.type?.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Stack>
              <Divider sx={{ my: 3 }} />
            </Box>
            <Grid2 container spacing={2}>
              <Grid2 size={{ md: 4 }}>
                <Controller
                  name="shipWork"
                  control={control}
                  render={({ field }) => (
                    <CommonInput
                      {...field}
                      label="Name of the ship/works"
                      placeholder="Name of the ship/works"
                      error={!!errors.shipWork}
                      helperText={errors.shipWork?.message}
                    />
                  )}
                />
              </Grid2>
              <Grid2 size={{ md: 4 }}>
                <Controller
                  name="imoNumber"
                  control={control}
                  render={({ field }) => (
                    <CommonInput
                      {...field}
                      label="IMO No."
                      placeholder="IMO No."
                      error={!!errors.imoNumber}
                      helperText={errors.imoNumber?.message}
                    />
                  )}
                />
              </Grid2>
              <Grid2 size={{ md: 4 }}>
                <Controller
                  name="classId"
                  control={control}
                  render={({ field }) => (
                    <CommonInput
                      {...field}
                      label="Class ID No."
                      placeholder="Class ID No."
                      error={!!errors.classId}
                      helperText={errors.classId?.message}
                    />
                  )}
                />
              </Grid2>
            </Grid2>

            <Box mt={3}>
              <Grid2 container spacing={2}>
                <Grid2 size={{ md: 6 }}>
                  <Controller
                    name="requestedBy"
                    control={control}
                    render={({ field }) => (
                      <CommonInput
                        {...field}
                        label="Requested by"
                        placeholder="Requested by"
                        error={!!errors.requestedBy}
                        helperText={errors.requestedBy?.message}
                      />
                    )}
                  />
                </Grid2>
                <Grid2 size={{ md: 6 }}>
                  <Controller
                    name="date"
                    control={control}
                    render={({ field }) => (
                      <CommonInput
                        {...field}
                        type="date"
                        label="Date"
                        error={!!errors.date}
                        helperText={errors.date?.message}
                      />
                    )}
                  />
                </Grid2>
              </Grid2>
            </Box>
          </CommonCard>

          <Box mt={2}>
            <CommonCard>
              <Stack
                direction={"row"}
                alignItems={"center"}
                justifyContent={"space-between"}
              >
                <Typography variant="h6" fontWeight={700}>
                  Visit Details
                </Typography>
                <CommonButton
                  sx={{ fontSize: "14px" }}
                  text="Add Visit"
                  onClick={handleOpenModal}
                />
              </Stack>

              <Box mt={2} border={"1px solid black"}>
                <TableContainer>
                  <Table aria-label="simple table">
                    <TableHead sx={{ backgroundColor: "lightgray" }}>
                      <TableRow>
                        <TableCell>SL No.</TableCell>
                        <TableCell align="right">Date</TableCell>
                        <TableCell align="right">Time from</TableCell>
                        <TableCell align="right">Time to</TableCell>
                        <TableCell align="right">Location</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {visitList.map((visit, index) => (
                        <TableRow key={visit.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell align="right">{visit.date}</TableCell>
                          <TableCell align="right">{visit.timeFrom}</TableCell>
                          <TableCell align="right">{visit.timeTo}</TableCell>
                          <TableCell align="right">{visit.location}</TableCell>
                          <TableCell align="right">
                            <IconButton onClick={() => handleEdit(visit)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton onClick={() => handleDelete(visit.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </CommonCard>
          </Box>

          <Box mt={2}>
            <CommonCard>
              <Stack
                direction={"row"}
                alignItems={"center"}
                justifyContent={"space-between"}
              >
                <Typography variant="h6" fontWeight={700}>
                  Activities
                </Typography>
                <CommonButton
                  sx={{ fontSize: "14px" }}
                  text="Add Activity"
                  onClick={handleOpenActivityModal}
                />
              </Stack>

              <Box mt={2} border={"1px solid black"}>
                <TableContainer>
                  <Table aria-label="simple table">
                    <TableHead sx={{ backgroundColor: "lightgray" }}>
                      <TableRow>
                        <TableCell>SL No.</TableCell>
                        <TableCell>Type of survey/Inspection</TableCell>
                        <TableCell>Initial of surveyors</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activitiesList.map((activity, index) => (
                        <TableRow key={activity.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{activity.typeOfSurvey}</TableCell>
                          <TableCell>{activity.initialOfSurveyors}</TableCell>
                          <TableCell align="right">
                            <IconButton
                              onClick={() => handleEditActivity(activity)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => handleActivityDelete(activity.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </CommonCard>
          </Box>

          <Box mt={2}>
            <CommonCard>
              <CommonButton
                type="submit"
                text={journalId ? "Update" : "Save"}
              />
            </CommonCard>
          </Box>
        </form>
      )}
      <CommonConfirmationDialog
        open={openDialog}
        onCancel={() => onLastVisitConfirmation(false)}
        onConfirm={() => onLastVisitConfirmation(true)}
        title="Please confirm if this is your last Visit ?"
      />
      <VisitModal
        open={openModal}
        onClose={handleCloseModal}
        onSave={handleSaveVisit}
        defaultValues={editVisit}
      />
      <ActivitiesModal
        open={openActivityModal}
        onClose={handleCloseActivityModal}
        onSave={handleSaveActivity}
        defaultValues={editActivity}
      />
    </Box>
  );
};

export default JournalEntryForm;