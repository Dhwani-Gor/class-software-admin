import Layout from "@/Layout";
import AdditionalFieldsList from "./create/page";
import CommonCard from "@/components/CommonCard";
import { Stack, Typography } from "@mui/material";
import CheckListCreate from "./create/page";

const AdditionalField = async () => {
  return (
    <>
      <Layout>
        <CommonCard sx={{ mt: 0 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h4" fontWeight={700}>
              Check List
            </Typography>
          </Stack>
        </CommonCard>
        <CheckListCreate />
      </Layout>
    </>
  );
};

export default AdditionalField;
