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
  const { roleId } = useAuth(); // Get roleId from context
  const pathName = usePathname();
  const [activeTab, setActiveTab] = useState(pathName);

  // Define role-based filtering logic
  const getFilteredMenuItems = () => {
    if (roleId === "1") {
      return sidemenu_items; // Show all items for roleId 1
    } else if (roleId === "3") {
      return sidemenu_items.filter((item) =>
        ["Reporting", "Issued Documents", "Settings"].includes(item.label)
      );
    } else if (roleId === "2") {
      return sidemenu_items.filter((item) =>
        ["Journal", "Reporting", "Issued Documents", "Survey Types", "Documents", "Settings"].includes(item.label)
      );
    }
    return [];
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
