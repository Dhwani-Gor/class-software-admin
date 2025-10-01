import React, { useState } from "react";
import { Box, Drawer, List, ListItem, ListItemText } from "@mui/material";
import { styled } from "@mui/system";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { sidemenu_items } from "@/data";
import { useAuth } from "@/hooks/useAuth";

const drawerWidth = 320;

const Sidebar = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  "& .MuiDrawer-paper": {
    width: drawerWidth,
    boxSizing: "border-box",
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    boxShadow: "2px 0px 6px rgba(0, 0, 0, 0.1)",
  },
}));

const SidebarComponent = ({ isSidebarOpen }) => {
  const { roleId, permissions } = useAuth(); // Get permissions from context
  console.log("=>permissions", permissions)
  const pathName = usePathname();
  const [activeTab, setActiveTab] = useState(pathName);

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem("data") || "{}");

  // Module to menu item mapping
  const moduleMenuMapping = {
    "Clients": "Clients",
    "Users": "Users",
    "Journals": "Journal",
    "Reporting": "Reporting",
    "IssuedDocument": "Issued Documents",
    "SurveyType": "Survey Types",
    "Documents": "Documents",
    "SystemVariable": "System Variables",
    "Classification": "Classification",
    "AdditionalFields": "Additional Fields"
  };

  const getFilteredMenuItems = () => {
    let allowedMenuItems = [];

    // Filter based on permission modules ONLY
    permissions.forEach(module => {
      const menuLabel = moduleMenuMapping[module];
      if (menuLabel) {
        const menuItem = sidemenu_items.find(item => item.label === menuLabel);
        if (menuItem) {
          allowedMenuItems.push(menuItem);
        }
      }
    });

    // // Special case: Only show Clients if user has both "Clients" permission AND dataEntryRights
    // if (permissions.includes("Clients") && userData?.dataEntryRights === true) {
    //   const clientsItem = sidemenu_items.find(item => item.label === "Clients");
    //   if (clientsItem && !allowedMenuItems.find(item => item.label === "Clients")) {
    //     allowedMenuItems.push(clientsItem);
    //   }
    // } else {
    //   // Remove Clients if user doesn't have proper permissions
    //   allowedMenuItems = allowedMenuItems.filter(item => item.label !== "Clients");
    // }

    // Fallback to role-based filtering if no permissions are set
    if (permissions.length === 0) {
      if (roleId === "1") {
        return sidemenu_items;
      } else if (roleId === "3") {
        return sidemenu_items.filter((item) =>
          ["Reporting", "Issued Documents", "System Variables", "AdditionalFields"].includes(item.label)
        );
      } else if (roleId === "2") {
        return sidemenu_items.filter((item) => {
          if (item.label === "Clients") {
            return userData?.dataEntryRights === true;
          }
          return ["Journal", "Reporting", "Issued Documents", "Survey Types", "Documents", "System Variables", "Classification", "AdditionalFields"].includes(item.label);
        });
      }
    }

    // Remove duplicates and maintain original order
    const uniqueItems = [];
    const seenLabels = new Set();

    sidemenu_items.forEach(item => {
      if (allowedMenuItems.find(allowed => allowed.label === item.label) && !seenLabels.has(item.label)) {
        uniqueItems.push(item);
        seenLabels.add(item.label);
      }
    });

    return uniqueItems;
  };

  return (
    <Sidebar variant="persistent" open={isSidebarOpen}>
      <Box
        sx={{
          mt: 8,
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          px: 2,
        }}
      >
        <List sx={{ pt: 5 }}>
          {getFilteredMenuItems().map((item, index) => (
            <Link
              key={index}
              href={item.to}
              style={{
                textDecoration: "none",
                display: "block",
              }}
            >
              <ListItem
                button
                sx={{
                  mt: 2,
                  background:
                    activeTab === pathName.startsWith(item.to) ||
                      pathName.includes(item.to) ||
                      (item.to === pathName && pathName.startsWith(pathName))
                      ? "linear-gradient(to right, #4a90e2, #9013fe)"
                      : "transparent",
                  color:
                    activeTab === pathName.startsWith(item.to) ||
                      pathName.includes(item.to) ||
                      (item.to === pathName && pathName.startsWith(pathName))
                      ? "primary.contrastText"
                      : "text.primary",
                  borderRadius: "8px",
                  paddingLeft: "16px",
                  paddingRight: "16px",
                  "&:hover": {
                    background: "linear-gradient(to right, #4a90e2, #9013fe)",
                    color: "white",
                  },
                  transition: "all 0.3s ease",
                }}
                onClick={() => setActiveTab(item.to)}
              >
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight:
                      activeTab === pathName.startsWith(item.to) ||
                        pathName.includes(item.to) ||
                        (item.to === pathName && pathName.startsWith(pathName))
                        ? "bold"
                        : "normal",
                  }}
                />
              </ListItem>
            </Link>
          ))}
        </List>
      </Box>
    </Sidebar>
  );
};

export default SidebarComponent;