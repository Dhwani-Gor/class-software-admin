"use client";
import React, { useState, useEffect } from "react";
import { Box, FormControl, IconButton, MenuItem, Select, Stack, Typography } from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import Grid2 from "@mui/material/Grid2";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import CommonCard from "@/components/CommonCard";
import CommonInput from "@/components/CommonInput";
import CommonButton from "@/components/CommonButton";
import VisitModal from "../VisitModal";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ActivitiesModal from "../ActivitiesModal";
import { generateInspection, getShipDetails, getUsersDetails } from "@/api";

// Validation schema using Yup
const schema = yup.object().shape({
  shipWork: yup.string().required("Ship name is required"),
  imoNumber: yup.string().required("IMO Number is required"),
  classId: yup.string().required("Class ID is required"),
  requestedBy: yup.string().required("Requested By is required"),
  date: yup.date().required("Date is required").typeError("required"),
});

const JournalEntryForm = () => {
  const [visitList, setVisitList] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editVisit, setEditVisit] = useState(null);
  const [activitiesList, setActivitiesList] = useState([]);
  const [openActivityModal, setOpenActivityModal] = useState(false);
  const [editActivity, setEditActivity] = useState(null);
  const [selectedShip, setSelectedShip] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
   const [clientLists, setClientLists] = useState([]);
   const [shipLists, setShipLists] = useState([]);
   const [isShowForm , setIsShowForm] = useState(false);
     const [loading, setLoading] = useState(false);

  const handleOpenModal = () => {
    setEditVisit(null);
    setOpenModal(true);
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
          setSelectedClient(event.target.value);
          setSelectedShip("");
      };
  
      const handleShipChange = (event) => {
          setSelectedShip(event.target.value);
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
        
        useEffect(() => {
          fetchUserListData();
          fetchShipListData();
        }, []);

        const showForm = () => {
          setIsShowForm(true);
        }


  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      shipWork: "",
      imoNumber: "",
      classId: "",
      requestedBy: "",
      date: "",
    },
  });

  const onSubmit = async (data) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Survey Report", 14, 20);

    doc.setFontSize(12);
    doc.text("General Information:", 14, 30);

    // const generalData = [
    //   ["Ship Name", selectedShip],
    //   ["Client Name", selectedClient],
    //   ["Class ID", data.classId || "N/A"],
    //   ["IMO Number", data.imoNumber || "N/A"],
    //   ["Requested By", data.requestedBy || "N/A"],
    //   ["Ship Work", data.shipWork || "N/A"],
    //   ["Date", data.date ? new Date(data.date).toDateString() : "N/A"],
    // ];

    let payload = {
      userId: 3,
      shipId: 1,
      reportId: 1,
      journalEntry: {
        basic_details: {
          ship_name: "asd",
          imo_no: "asd1212",
          class_id_no: "asd12",
          requested_by: "qwe",
          date: "asdqw",
        },
      },
    };

    try {
      const res = await generateInspection(payload);
      console.log("API Response:", res);
    
      // Ensure the response contains a valid URL
      if (res?.data.status === "success" && res?.data?.url) {
        window.open(res.data.url, "_blank"); // Opens the PDF in a new tab
        console.log("PDF opened successfully");
      } else {
        throw new Error("Invalid response format or missing URL");
      }
    } catch (error) {
      console.error("Error:", error);
    }

    
    

    // console.log(payload, 'payload');

    // autoTable(doc, {
    //   startY: 35,
    //   body: generalData,
    //   theme: "grid",
    //   styles: { fontSize: 10 },
    // });

    // let nextY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 45;

    // doc.text("Visit List:", 14, nextY);

    // if (visitList?.length) {
    //   autoTable(doc, {
    //     startY: nextY + 5,
    //     head: [["Date", "Location", "Time From", "Time To"]],
    //     body: visitList.map((item) => [
    //       item.date || "N/A",
    //       item.location || "N/A",
    //       item.timeFrom || "N/A",
    //       item.timeTo || "N/A",
    //     ]),
    //     theme: "striped",
    //   });
    //   nextY = doc.lastAutoTable.finalY + 10;
    // } else {
    //   doc.text("No visit data available", 14, nextY + 5);
    //   nextY += 15;
    // }

    // doc.text("Activities List:", 14, nextY);

    // if (activitiesList?.length) {
    //   autoTable(doc, {
    //     startY: nextY + 5,
    //     head: [["Survey", "Surveyors"]],
    //     body: activitiesList.map((item) => [
    //       item.survey || "N/A",
    //       item.surveyors || "N/A",
    //     ]),
    //     theme: "striped",
    //   });
    // } else {
    //   doc.text("No activities data available", 14, nextY + 5);
    // }

    // doc.save("Survey Report.pdf");
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
                  Select Client
                </Typography>
                <Select
                  value={selectedClient}
                  onChange={handleClientChange}
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    Select Client
                  </MenuItem>
                  {clientLists.map((client) => (
                    <MenuItem key={client.value} value={client.value}>
                      {client.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {selectedClient && (
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
            )}

            {selectedShip && selectedClient && (
              <CommonButton onClick={showForm} sx={{ marginTop: 3 }} />
            )}
          </CommonCard>
        </Box>
      )}
      {isShowForm && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <CommonCard>
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
                        <TableCell align="right">Date</TableCell>
                        <TableCell align="right">Time from</TableCell>
                        <TableCell align="right">Time to</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activitiesList.map((visit, index) => (
                        <TableRow key={visit.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell align="right">{visit.survey}</TableCell>
                          <TableCell align="right">{visit.surveyors}</TableCell>
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
              <CommonButton type="submit">Submit</CommonButton>
            </CommonCard>
          </Box>
        </form>
      )}
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
