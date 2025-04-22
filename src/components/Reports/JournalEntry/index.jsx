"use client";
import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
// import autoTable from "jspdf-autotable";
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

const schema = yup.object().shape({
  shipWork: yup.string().required("Ship name is required"),
  imoNumber: yup.string().required("IMO Number is required"),
  classId: yup.string().required("Class ID is required"),
  requestedBy: yup.string().required("Requested By is required"),
  date: yup.date().required("Date is required").typeError("required"),
  type: yup.string().required("Type of survey must be selected"),
});

const journalTypeOptions = [
  "New Entry",
  "Periodical",
  "Component Survey",
  "Miscellaneous Survey",
];

const JournalEntryForm = () => {
  const [visitList, setVisitList] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editVisit, setEditVisit] = useState(null);
  const [activitiesList, setActivitiesList] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [openActivityModal, setOpenActivityModal] = useState(false);
  const [editActivity, setEditActivity] = useState(null);
  const [selectedShip, setSelectedShip] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [clientLists, setClientLists] = useState([]);
  const [shipLists, setShipLists] = useState([]);
  const [isShowForm, setIsShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

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
    setOpenModal(false);
  };

  const handleEditActivity = (activity) => {
    setEditActivity(activity);
    setOpenActivityModal(true);
  };

  const handleActivityDelete = (id) => {
    setVisitList(activitiesList.filter((activity) => activity.id !== id));
  };

  const handleClientChange = (event) => {
    const { shipName, classId, imoNumber } = event.target.value;
    setSelectedClient(event.target.value);
    setValue("shipWork", shipName);
    setValue("classId", classId);
    setValue("imoNumber", imoNumber);
  };

  const fetchUserListData = async (page, limit, searchQuery) => {
    try {
      const res = await getUsersDetails(page, limit, searchQuery);
      setLoading(true);
      if (res?.data?.data?.length > 0) {
        const filteredData = res.data.data
          .filter((item) => item.roleId === "3")
          .map((item) => ({
            value: item.id || "-",
            label: item.name || "-",
          }));

        const sortedData = filteredData.sort((a, b) => a.value - b.value);

        setClientLists(sortedData);
        setLoading(false);
      } else {
        setClientLists([]);
      }
    } catch (error) {
      console.error("Error fetching client list:", error);
    }
  };

  const fetchShipListData = async (page, limit, searchQuery) => {
    try {
      const res = await getShipDetails(page, limit, searchQuery);
      if (res?.data?.data?.length > 0) {
        const formattedData = res.data.data.map((item) => ({
          value: item.id || "-",
          label: item.name || "-",
        }));

        const sortedData = formattedData.sort((a, b) => a.value - b.value);

        setShipLists(sortedData);
      } else {
        setShipLists([]);
      }
    } catch (error) {
      console.error("Error fetching ship list:", error);
    }
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      const result = await getAllClients();
      if (result?.status === 200) {
        setClientsList(result.data.data);
        console.log(result.data.data);
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
    fetchClients();
    fetchUserListData();
    fetchShipListData();
  }, []);

  const showForm = () => {
    setIsShowForm(true);
  };

  const {
    control,
    handleSubmit,
    setValue,
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

  const onSubmit = async (data) => {
    console.log("226 ===>", data);
    // const doc = new jsPDF();

    // doc.setFontSize(18);
    // doc.text("Survey Report", 14, 20);

    // doc.setFontSize(12);
    // doc.text("General Information:", 14, 30);

    // let payload = {
    //   userId: 3,
    //   shipId: 1,
    //   reportId: 1,
    //   journalEntry: {
    //     basic_details: {
    //       ship_name: "asd",
    //       imo_no: "asd1212",
    //       class_id_no: "asd12",
    //       requested_by: "qwe",
    //       date: "asdqw",
    //     },
    //   },
    // };

    // try {
    //   const res = await generateInspection(payload);
    //   console.log("API Response:", res);

    //   // Ensure the response contains a valid URL
    //   if (res?.data.status === "success" && res?.data?.url) {
    //     window.open(res.data.url, "_blank"); // Opens the PDF in a new tab
    //     console.log("PDF opened successfully");
    //   } else {
    //     throw new Error("Invalid response format or missing URL");
    //   }
    // } catch (error) {
    //   console.error("Error:", error);
    // }
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

            {/* {selectedClient && (
              <Box mt={2}>
                <FormControl fullWidth sx={{ maxWidth: 300 }}>
                  <Typography variant="body1" mb={1}>
                    Select Ship
                  </Typography>
                  <Select
                    value={selectedShip}
                    onChange={handleShipChange}
                    displayEmpty
                  >
                    <MenuItem value="" disabled>
                      Select Ship
                    </MenuItem>
                    {shipLists.map((ship) => (
                      <MenuItem key={ship.value} value={ship.value}>
                        {ship.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )} */}

            {selectedClient && (
              <CommonButton onClick={showForm} sx={{ marginTop: 3 }} />
            )}
          </CommonCard>
        </Box>
      )}
      {isShowForm && (
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
                            key={type}
                            value={type}
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
                            label={type.charAt(0).toUpperCase() + type.slice(1)}
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
                  text="Add Activitiy"
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
                      {activitiesList.map((visit, index) => (
                        <TableRow key={visit.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{visit.survey}</TableCell>
                          <TableCell>{visit.surveyors}</TableCell>
                          <TableCell align="right">
                            <IconButton
                              onClick={() => handleEditActivity(visit)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => handleActivityDelete(visit.id)}
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
                // onClick={() => setOpenDialog(true)}
                text="Save"
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
