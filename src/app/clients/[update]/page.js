"use client";
import React, { use, useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import Layout from "@/Layout";
import Stack from "@mui/material/Stack";
import CommonCard from "@/components/CommonCard";
import AddClientForm from "@/components/AddClientForm";
import { Box, Dialog, IconButton, MenuItem, TextField } from "@mui/material";
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

  const handleSurveyReport = () => {
    setOpenDialog(true);
    // router.push(`/survey-report/${update}`);
  };

  const handleSaveJournal = () => {
    if (!selectedJournal) {
      toast.error("Please select a journal");
      return;
    }
    router.push(`/survey-report/${update}?journalId=${selectedJournal}`);
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
              <CommonButton variant="contained" fontWeight={700} onClick={handleSurveyReport} text="GENERATE SURVEY REPORT" />
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

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm">
        {journalData?.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Select Report Number
            </Typography>
            <TextField label="Report No" select fullWidth size="medium" value={selectedJournal} onChange={(e) => setSelectedJournal(e.target.value)}>
              <MenuItem value="">&nbsp;</MenuItem>
              {journalData.map((journal) => (
                <MenuItem key={journal.id} value={journal.id}>
                  {journal.journalTypeId}
                </MenuItem>
              ))}
            </TextField>

            {/* Action buttons */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
              <CommonButton variant="outlined" color="secondary" text="Cancel" onClick={() => setOpenDialog(false)} />
              <CommonButton text="Save" variant="contained" onClick={handleSaveJournal} />
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
