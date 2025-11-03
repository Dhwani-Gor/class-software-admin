"use client";
import React, { use, useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import Layout from "@/Layout";
import Stack from "@mui/material/Stack";
import CommonCard from "@/components/CommonCard";
import AddClientForm from "@/components/AddClientForm";
import { Autocomplete, Box, Dialog, IconButton, TextField } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import CommonButton from "@/components/CommonButton";
import EditingReasonDialog from "@/components/Dialogs/EditingReasonDialog";
import EditHistoryDialog from "@/components/Dialogs/EditHistoryDialog";
import { fetchJournalList, getClientHistory, getSpecificClient } from "@/api";
import { toast } from "react-toastify";
import { transformData } from "@/utils/helper";
import { useAuth } from "@/hooks/useAuth";

const UpdateClient = ({ params }) => {
  const { update } = use(params);
  const router = useRouter();
  const { data } = useAuth();

  const [editHistoryDialog, setEditHistoryDialog] = useState(false);
  const [isEditDialogVisible, setIsEditDialogVisible] = useState(false);
  const [editingAllowed, setEditingAllowed] = useState(false);
  const [changeHistory, setChangeHistory] = useState([]);
  const [editReason, setEditReason] = useState("");
  const [reportDetails, setReportDetails] = useState(false);
  const [journalData, setJournalData] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState("");

  // 👇 NEW STATE to know which report type was triggered
  const [reportType, setReportType] = useState("");

  const fetchClientsHistory = async () => {
    try {
      const result = await getClientHistory(update);
      if (result?.status === 200) {
        setChangeHistory(transformData(result.data.data));
      }
    } catch (error) {
      toast.error(error.message || "Error fetching client history");
    }
  };

  const getClient = async () => {
    try {
      const result = await getSpecificClient(update);
      if (result?.status === 200) {
        const isReportAvailable = result.data.data.isReportDetailAvailable;
        setReportDetails(isReportAvailable);
        if (!isReportAvailable) setEditingAllowed(true);
      } else {
        toast.error("Something went wrong! Please try again later");
      }
    } catch (error) {
      toast.error(error.message || "Error fetching client");
    }
  };

  useEffect(() => {
    if (!update) return;
    const fetchJournals = async () => {
      try {
        const res = await fetchJournalList(update);
        if (res?.status === 200) setJournalData(res.data.data || []);
      } catch (err) {
        console.error("Error fetching journals:", err);
      }
    };
    fetchJournals();
  }, [update]);

  useEffect(() => {
    if (!update) return;
    fetchClientsHistory();
    getClient();
  }, [update]);

  // 👇 Common function to open dialog for either report type
  const openReportDialog = (type) => {
    setReportType(type);
    setOpenDialog(true);
  };

  // 👇 Handles redirect based on selected report type
  const handleSaveReport = () => {
    if (!selectedJournal) {
      toast.error("Please select a journal");
      return;
    }

    if (reportType === "survey") {
      router.push(`/survey-report/${update}?journalId=${selectedJournal}`);
    } else if (reportType === "narrative") {
      router.push(`/narative-report/${update}?journalId=${selectedJournal}`);
    }

    setOpenDialog(false);
  };

  const handleSurveyStatusReport = () => {
    router.push(`/survey-status-report/${update}`);
  };

  return (
    <Layout>
      <CommonCard sx={{ mt: 0, pl: 2 }}>
        <Stack direction="row" alignItems="center" gap={2} justifyContent="space-between">
          <Stack direction="row" alignItems="center" gap={2}>
            <IconButton size="small" onClick={() => router.push("/clients")}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" fontWeight={700}>
              Clients
            </Typography>
          </Stack>

          {reportDetails && (
            <Stack direction="row" spacing={2}>
              {data?.specialPermission?.includes("DataEntryRights(Clients)") && (
                <>
                  <CommonButton variant="outlined" text="Edit History" onClick={() => setEditHistoryDialog(true)} />
                  <CommonButton text="Edit" variant="outlined" color="secondary" onClick={() => setIsEditDialogVisible(true)} />
                </>
              )}
              <CommonButton variant="contained" fontWeight={700} onClick={handleSurveyStatusReport} text="GENERATE SURVEY STATUS" />
              <CommonButton variant="contained" fontWeight={700} onClick={() => openReportDialog("survey")} text="GENERATE SURVEY REPORT" />
              {/* <CommonButton variant="contained" fontWeight={700} onClick={() => openReportDialog("narrative")} text="GENERATE NARRATIVE REPORT" /> */}
            </Stack>
          )}
        </Stack>
      </CommonCard>

      <Stack>
        <AddClientForm editReason={editReason} editingAllowed={editingAllowed} mode="update" clientId={update} role="client" />
      </Stack>

      {isEditDialogVisible && (
        <EditingReasonDialog
          open={isEditDialogVisible}
          onCancel={() => setIsEditDialogVisible(false)}
          onConfirm={(value) => {
            setEditingAllowed(true);
            setIsEditDialogVisible(false);
            setEditReason(value);
          }}
          title="Please mention the Reason of Updating Client Details to continue Editing."
        />
      )}

      {editHistoryDialog && <EditHistoryDialog open={editHistoryDialog} changeHistory={changeHistory} onCancel={() => setEditHistoryDialog(false)} />}

      {/* Common Dialog for both report types */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm">
        {journalData?.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Select Report Number
            </Typography>

            <Autocomplete options={journalData} getOptionLabel={(option) => option.journalTypeId || ""} value={journalData.find((j) => j.id === selectedJournal) || null} onChange={(event, newValue) => setSelectedJournal(newValue?.id || "")} renderInput={(params) => <TextField {...params} label="Report No" fullWidth />} isOptionEqualToValue={(option, value) => option.id === value.id} />

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
              <CommonButton variant="outlined" color="secondary" text="Cancel" onClick={() => setOpenDialog(false)} />
              <CommonButton text="Ok" variant="contained" onClick={handleSaveReport} />
            </Box>
          </Box>
        ) : (
          <Box sx={{ p: 3 }}>
            <Typography>No Journals Found</Typography>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <CommonButton variant="outlined" color="secondary" text="Close" onClick={() => setOpenDialog(false)} />
            </Box>
          </Box>
        )}
      </Dialog>
    </Layout>
  );
};

export default UpdateClient;
