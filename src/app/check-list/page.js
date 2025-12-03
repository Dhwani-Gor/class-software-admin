"use client";
import Layout from "@/Layout";
import AdditionalFieldsList from "./create/page";
import CommonCard from "@/components/CommonCard";
import { IconButton, Stack, Typography } from "@mui/material";
import CheckListCreate from "./create/page";
import { ArrowBack } from "@mui/icons-material";

const Checklist = () => {
  return (
    <>
      {/* <Layout>
        <CommonCard sx={{ mt: 0 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h4" fontWeight={700}>
              Check List
            </Typography>
          </Stack>
        </CommonCard>
        <CheckListCreate />
      </Layout> */}
      <Layout>
        <CommonCard sx={{ mt: 0, pl: 2 }}>
          <Stack direction={"row"} alignItems={"center"} gap={2}>
            <IconButton size="small" onClick={() => router.push("/checklist")}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" fontWeight={"700"}>
              Checklist
            </Typography>
          </Stack>
        </CommonCard>
        <Stack>
          <CheckListCreate />
        </Stack>
      </Layout>
    </>
  );
};

export default Checklist;
