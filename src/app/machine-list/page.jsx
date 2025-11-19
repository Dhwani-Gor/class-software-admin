import Layout from "@/Layout";
import CommonCard from "@/components/CommonCard";
import { Stack, Typography } from "@mui/material";
import MachineryForm from "@/components/AddMachineList/page";

const MachineList = () => {
    return (
        <>
            <Layout>
                <CommonCard sx={{ mt: 0 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="h4" fontWeight={700}>
                            Machine List
                        </Typography>
                    </Stack>
                </CommonCard>
                <MachineryForm />
            </Layout>
        </>

    );
};
export default MachineList;
