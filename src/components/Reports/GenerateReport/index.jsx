"use client";
import React, { useEffect, useState } from "react";
import { Box, Typography, MenuItem, FormControl, Select } from "@mui/material";
import CommonCard from "@/components/CommonCard";
import CommonButton from "@/components/CommonButton";
import { useRouter } from "next/navigation";
import { getAllUsers, getShipDetails } from "@/api";

const ship_data = [
    { label: "Ship 1", value: "Ship1" },
    { label: "Ship 2", value: "Ship2" },
    { label: "Ship 3", value: "Ship3" },
    { label: "Ship 4", value: "Ship4" },
];

const client_data = [
    { label: "Client 1", value: "Client1" },
    { label: "Client 2", value: "Client2" },
    { label: "Client 3", value: "Client3" },
    { label: "Client 4", value: "Client4" },
];

const GenerateReport = () => {
    const router = useRouter();
    const [selectedShip, setSelectedShip] = useState("");
    const [selectedClient, setSelectedClient] = useState("");
     const [clientLists, setClientLists] = useState([]);
     const [shipLists, setShipLists] = useState([]);

    const handleClientChange = (event) => {
        setSelectedClient(event.target.value);
        setSelectedShip("");
    };

    const handleShipChange = (event) => {
        setSelectedShip(event.target.value);
    };

    const fetchUserListData = async (page, limit, searchQuery) => {
        try {
          const res = await getAllUsers(page, limit, searchQuery);
      
          if (res?.data?.data?.length > 0) {
            const filteredData = res.data.data
              .filter((item) => item.roleId === "3")
              .map((item) => ({
                value: item.id || "-",
                label: item.name || "-",
              }));
      
            const sortedData = filteredData.sort((a, b) => a.value - b.value);
      
            setClientLists(sortedData);
          } else {
            setClientLists([]);
          }
        } catch (error) {
          console.error("Error fetching client list:", error);
        }
      };
      
      const fetchShipListData = async (page, limit, searchQuery) => {
        try {
          const res = await getShipDetails(page, limit, searchQuery);
      
          if (res?.data?.data?.length > 0) {
            const formattedData = res.data.data.map((item) => ({
              value: item.id || "-",
              label: item.name || "-",
            }));
      
            const sortedData = formattedData.sort((a, b) => a.value - b.value);
      
            setShipLists(sortedData);
          } else {
            setShipLists([]);
          }
        } catch (error) {
          console.error("Error fetching ship list:", error);
        }
      };
      
      useEffect(() => {
        fetchUserListData();
        fetchShipListData();
      }, []);
      

    const manageReport = () => {
        router.push(
            `/journal/journal-entry?ship=${selectedShip}&client=${selectedClient}`
        );
    };

    return (
        <Box>
            <CommonCard sx={{ mt: 0 }}>
                <Typography variant="h4" fontWeight={700}>
                    Generate Journal
                </Typography>
            </CommonCard>

            <Box mt={3}>
                <CommonCard>
                    <Box>
                        <FormControl fullWidth sx={{ maxWidth: 300 }}>
                            <Typography variant="body1" mb={1}>
                                Select Client
                            </Typography>
                            <Select
                                value={selectedClient}
                                onChange={handleClientChange}
                                displayEmpty
                            >
                                <MenuItem value="" disabled>
                                    Select Client
                                </MenuItem>
                                {clientLists.map((client) => (
                                    <MenuItem key={client.value} value={client.value}>
                                        {client.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {selectedClient && (
                        <Box mt={2}>
                            <FormControl fullWidth sx={{ maxWidth: 300 }}>
                                <Typography variant="body1" mb={1}>
                                    Select Ship
                                </Typography>
                                <Select
                                    value={selectedShip}
                                    onChange={handleShipChange}
                                    displayEmpty
                                >
                                    <MenuItem value="" disabled>
                                        Select Ship
                                    </MenuItem>
                                    {shipLists.map((ship) => (
                                        <MenuItem key={ship.value} value={ship.value}>
                                            {ship.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    )}

                    {selectedShip && selectedClient && (
                        <CommonButton onClick={manageReport} sx={{ marginTop: 3 }} />
                    )}
                </CommonCard>
            </Box>
        </Box>
    );
};

export default GenerateReport;
