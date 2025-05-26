"use client";
import React, { useEffect, useState } from "react";
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
import { getClientHistory } from "@/api";
import { toast } from "react-toastify";
import { transformData } from "@/utils/helper";
import SurveyTypeForm from "@/components/AddSurveyType";

const UpdateClient = ({ params }) => {
  const router = useRouter();
  const [editHistoryDialog, setEditHistoryDialog] = useState(false);
  const [isEditDialogVisible, setIsEditDialogVisible] = useState(false);
  const [editingAllowed, setEditingAllowed] = useState(false);
  const [changeHistory, setChangeHistory] = useState([]);
  const [editReason, setEditReason] = useState('');

  const fetchClientsHistory = async () => {
    try {
      const result = await getClientHistory(params?.update);
      if (result?.status === 200) {
        const newData = transformData(result.data.data);
        setChangeHistory(newData)
      } else {
        // toast.error("Something went wrong ! Please try again after some time")
      }

    } catch (error) {
      toast.error(error)
    }
  }

  useEffect(() => {
    fetchClientsHistory();
  }, [])

  return (
    <Layout>
      <CommonCard sx={{ mt: 0, pl: 2 }}>
        <Stack direction={'row'} alignItems={'center'} gap={2}>
          <IconButton size="small" onClick={() => router.push('/survey-types')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" fontWeight={"700"}>
            Survey Types
          </Typography>
          {/* <CommonButton sx={{ ml: 'auto' }} variant="outlined" text="Edit History" onClick={() => setEditHistoryDialog(true)} /> */}
          {/* <CommonButton text="Edit" variant="outlined" color="secondary" onClick={() => setIsEditDialogVisible(true)} /> */}
        </Stack>
      </CommonCard>
      <Stack>
        <SurveyTypeForm  mode="update" surveyTypeId={params?.update} />
      </Stack>
      {/* {isEditDialogVisible && (
        <EditingReasonDialog
          open={isEditDialogVisible}
          onCancel={() => setIsEditDialogVisible(false)}
          onConfirm={(value) => {
            setEditingAllowed(true);
            setIsEditDialogVisible(false);
            setEditReason(value)
          }}
          title="Please mention the Reason of Updating Client Details to continue Editing."
        />
      )} */}
      {/* {editHistoryDialog && (
        <EditHistoryDialog
          open={editHistoryDialog}
          changeHistory={changeHistory}
          onCancel={() => setEditHistoryDialog(false)}
        />
      )} */}
    </Layout>
  );
};

export default UpdateClient;
