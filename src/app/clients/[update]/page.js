"use client";
import React, { useEffect, useState } from "react";
import { use } from "react";
import Typography from "@mui/material/Typography";
import Layout from "@/Layout";
import Stack from "@mui/material/Stack";
import CommonCard from "@/components/CommonCard";
import AddClientForm from "@/components/AddClientForm";
import { IconButton } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import CommonButton from "@/components/CommonButton";
import EditingReasonDialog from "@/components/Dialogs/EditingReasonDialog";
import EditHistoryDialog from "@/components/Dialogs/EditHistoryDialog";
import { getClientHistory, getSpecificClient, getSurveyReportData } from "@/api";
import { toast } from "react-toastify";
import { transformData } from "@/utils/helper";
import SurveyDialog from "@/components/Dialogs/SurveyDialog";

const UpdateClient = ({ params }) => {
  const { update }= use(params); // ✅ unwrap the promise
  const router = useRouter();
  const [editHistoryDialog, setEditHistoryDialog] = useState(false);
  const [isEditDialogVisible, setIsEditDialogVisible] = useState(false);
  const [editingAllowed, setEditingAllowed] = useState(false);
  const [changeHistory, setChangeHistory] = useState([]);
  const [editReason, setEditReason] = useState('');
  const [reportDetails, setReportDetails] = useState();
  const [surveyData,setSurveyData]=useState();
  const [loading,setLoading]=useState(false);

  const fetchClientsHistory = async () => {
    try {
      const result = await getClientHistory(update);
      if (result?.status === 200) {
        const newData = transformData(result.data.data);
        setChangeHistory(newData);
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
        if (!isReportAvailable) {
          setEditingAllowed(true);
        }
      } else {
        toast.error("Something went wrong! Please try again after some time");
      }
    } catch (error) {
      toast.error(error.message || "Error fetching client");
    }
  };

  useEffect(() => {
    fetchClientsHistory();
    getClient();
  }, []);

  const handleClick = () => {
    router.push(`/survey-report/${update}`)
  };

  return (
    <Layout>
      <CommonCard sx={{ mt: 0, pl: 2 }}>
        <Stack direction="row" alignItems="center" gap={2} justifyContent="space-between">
          <Stack direction="row" alignItems="center" gap={2}>
          <IconButton size="small" onClick={() => router.push("/clients")}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" fontWeight={"700"}>
            Clients
          </Typography>
          </Stack>
          

          {reportDetails && (
            <>
              <CommonButton
                sx={{ ml: "auto" }}
                variant="outlined"
                text="Edit History"
                onClick={() => setEditHistoryDialog(true)}
              />
              <CommonButton
                text="Edit"
                variant="outlined"
                color="secondary"
                onClick={() => setIsEditDialogVisible(true)}
              />
              {reportDetails && (
                <CommonButton variant="contained" fontWeight={"700"} 
                onClick={handleClick}
                text="Generate Survey Report">
                  Generate Report
                </CommonButton>
              )}
            </>
          )}
        </Stack>
      </CommonCard>
      <Stack>
        <AddClientForm
          editReason={editReason}
          editingAllowed={editingAllowed}
          mode="update"
          clientId={update}
          role="client"
        />
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
      {editHistoryDialog && (
        <EditHistoryDialog
          open={editHistoryDialog}
          changeHistory={changeHistory}
          onCancel={() => setEditHistoryDialog(false)}
        />
      )}
    </Layout>
  );
};

export default UpdateClient;
