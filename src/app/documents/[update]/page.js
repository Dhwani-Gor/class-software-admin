"use client";
import React, { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import Layout from "@/Layout";
import Stack from "@mui/material/Stack";
import CommonCard from "@/components/CommonCard";
import { IconButton } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import CommonButton from "@/components/CommonButton";
import EditingReasonDialog from "@/components/Dialogs/EditingReasonDialog";
import EditHistoryDialog from "@/components/Dialogs/EditHistoryDialog";
import { getDocumentHistory } from "@/api";
import { toast } from "react-toastify";
import { transformData } from "@/utils/helper";
import DocumentForm from "@/components/AddDocumentForm";

const UpdateDocument = ({ params }) => {
  const router = useRouter();
  const [editHistoryDialog, setEditHistoryDialog] = useState(false);
  const [isEditDialogVisible, setIsEditDialogVisible] = useState(false);
  const [editingAllowed, setEditingAllowed] = useState(false);
  const [editReason, setEditReason] = useState('');

  return (
    <Layout>
      <CommonCard sx={{ mt: 0, pl: 2 }}>
        <Stack direction={'row'} alignItems={'center'} gap={2}>
          <IconButton size="small" onClick={() => router.push('/documents')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" fontWeight={"700"}>
            Documents
          </Typography>
        </Stack>
      </CommonCard>
      <Stack>
        <DocumentForm mode="update" documentId={params?.update} editReason={editReason} />
      </Stack>
    </Layout>
  );
};

export default UpdateDocument;