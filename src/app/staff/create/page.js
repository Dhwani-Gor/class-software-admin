"use client";
import React, { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
//relative path imports
import Layout from "@/Layout";
import { IconButton, Stack } from "@mui/material";
import CommonCard from "@/components/CommonCard";
import AddInspectorForm from "@/components/AddInspectorForm";
import { useRouter } from "next/navigation";
import { ArrowBack } from "@mui/icons-material";
import { getAllModules } from "@/api";

const AddStaff = () => {
  const router = useRouter();
  const [permissionData, setPermissionData] = useState([]);
  const [specialPermissionData, setSpecialPermissionData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAllModules();
  }, []);

  const fetchAllModules = async () => {
    setLoading(true);
    try {
      const response = await getAllModules();
      if (response?.data?.status === "success") {
        let temp = [];
        let specialPermission = [];
        response?.data?.data?.modules?.forEach((ele, index) => {
          temp.push({
            label: ele?.description,
            value: ele?.name,
          });
        });
        response?.data?.data?.specialPermission?.forEach(
          (ele, index) => {
            specialPermission.push({
              label: ele,
              value: ele,
            });
          }
        );
        setPermissionData(temp);
        setSpecialPermissionData(specialPermission);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <CommonCard sx={{ mt: 0, pl: 2 }}>
        <Stack direction={"row"} alignItems={"center"} gap={2}>
          <IconButton size="small" onClick={() => router.push("/staff")}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" fontWeight={"700"}>
            Users
          </Typography>
        </Stack>
      </CommonCard>
      <Stack>
        <AddInspectorForm
          mode="create"
          permissionData={permissionData}
          specialPermissionData={specialPermissionData}
        />
        {/* <AddClientInspectorCommonForm mode="create" role="inspector" /> */}
      </Stack>
    </Layout>
  );
};

export default AddStaff;
