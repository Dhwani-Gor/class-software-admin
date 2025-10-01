import Layout from "@/Layout";
import AdditionalFieldsList from "./create/page";
import CommonCard from "@/components/CommonCard";
import { Stack, Typography } from "@mui/material";

const AdditionalField = async () => {
  return (
    <>
      <Layout>
        <CommonCard sx={{ mt: 0 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h4" fontWeight={700}>
              Additional Fields
            </Typography>
            {/* <CommonButton
                    sx={{ textTransform: "capitalize" }}
                    text="Add Classification"
                    variant="contained"
                    onClick={() => {
                      router.push("/classification/create");
                    }}
                  /> */}
          </Stack>
        </CommonCard>
        <AdditionalFieldsList />
      </Layout>
    </>
  );
};

export default AdditionalField;
