"use client";
import React, { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import Layout from "@/Layout";
import { Box, CircularProgress, Grid, Grid2, Stack } from "@mui/material";
import CommonCard from "@/components/CommonCard";
import { getParticularVisaApplicantDetails } from "@/api";
import Image from "next/image";

const ViewEachApplication = (props) => {
  const { appId } = props;

  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchApplicantDetails = async () => {
    setLoading(true);
    await getParticularVisaApplicantDetails(appId)
      .then((res) => {
        if (res?.status) {
          setData(res?.data?.data);
        }
        setLoading(false);
      })
      .catch((e) => console.log("error", e));
    setLoading(false);
  };

  useEffect(() => {
    fetchApplicantDetails();
  }, [appId]);

  return (
    <Stack mt={1} spacing={1}>
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
        <Grid container spacing={3}>
          <Grid item xs={2.3}>
            <Typography fontWeight="700">First Name:</Typography>
          </Grid>
          <Grid item xs={9.5}>
            <Typography>{data?.details?.firstName || "-"}</Typography>
          </Grid>

          <Grid item xs={2.3}>
            <Typography fontWeight="700">Last Name:</Typography>
          </Grid>
          <Grid item xs={9.5}>
            <Typography>{data?.details?.lastName || "-"}</Typography>
          </Grid>

          <Grid item xs={2.3}>
            <Typography fontWeight="700">Gender:</Typography>
          </Grid>
          <Grid item xs={9.5}>
            <Typography>{data?.details?.gender || "-"}</Typography>
          </Grid>

          <Grid item xs={2.3}>
            <Typography fontWeight="700">Date of Birth:</Typography>
          </Grid>
          <Grid item xs={9.5}>
            <Typography>{data?.details?.dob || "-"}</Typography>
          </Grid>

          <Grid item xs={2.3}>
            <Typography fontWeight="700">Place of Birth:</Typography>
          </Grid>
          <Grid item xs={9.5}>
            <Typography>{data?.details?.placeOfBirth || "-"}</Typography>
          </Grid>
          <Grid item xs={2.3}>
            <Typography fontWeight="700">Passport Number:</Typography>
          </Grid>
          <Grid item xs={9.5}>
            <Typography>{data?.details?.passportNumber || "-"}</Typography>
          </Grid>
          <Grid item xs={2.3}>
            <Typography fontWeight="700">Passport Issued From:</Typography>
          </Grid>
          <Grid item xs={9.5}>
            <Typography>{data?.details?.passportFrom || "-"}</Typography>
          </Grid>
          <Grid item xs={2.3}>
            <Typography fontWeight="700">Passport Issued On:</Typography>
          </Grid>
          <Grid item xs={9.5}>
            <Typography>{data?.details?.passportIssuedOn || "-"}</Typography>
          </Grid>
          <Grid item xs={2.3}>
            <Typography fontWeight="700">Passport Valid Until:</Typography>
          </Grid>
          <Grid item xs={9.5}>
            <Typography>{data?.details?.passportValidUntil || "-"}</Typography>
          </Grid>
          <Grid item xs={2.3}>
            <Typography fontWeight="700">Expected Visa Date:</Typography>
          </Grid>
          <Grid item xs={9.5}>
            <Typography>{data?.expectedVisaDate || "-"}</Typography>
          </Grid>
          {/* <Grid item xs={2.3}>
          <Typography fontWeight="700">Extracted Details:</Typography>
        </Grid>
        <Grid item xs={9.5}>
          <Typography>{data.extractedDetails || "-"}</Typography>
        </Grid> */}
          <Grid item xs={2.3}>
            <Typography fontWeight="700">photo:</Typography>
          </Grid>
          <Grid item xs={9.5}>
            {data?.photo && (
              <Image
                src={data?.photo}
                alt="profilephoto"
                height={100}
                width={100}
              />
            )}
          </Grid>
          <Grid item xs={2.3}>
            <Typography fontWeight="700">passport:</Typography>
          </Grid>
          <Grid item xs={9.5}>
            {data?.passport && (
              <Image
                src={data?.passport}
                alt="profilephoto"
                height={100}
                width={180}
              />
            )}
          </Grid>
        </Grid>
      )}
    </Stack>
  );
};

const ViewApplications = ({ params }) => {
  return (
    <Layout>
      <CommonCard>
        <Typography variant="h6" fontWeight={"700"}>
          Visa Applications
        </Typography>
      </CommonCard>
      <CommonCard>
        <Stack>
          <ViewEachApplication appId={params?.view} />
        </Stack>
      </CommonCard>
    </Layout>
  );
};

export default ViewApplications;
