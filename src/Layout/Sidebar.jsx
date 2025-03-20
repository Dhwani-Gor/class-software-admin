import React, { useState } from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { styled } from "@mui/system";
import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboard";
import EventIcon from "@mui/icons-material/Event";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { sidemenu_items } from "@/data";

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
  const pathName = usePathname();
  const [activeTab, setActiveTab] = useState(pathName);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
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
          {sidemenu_items.map((item, index) => (
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
                onClick={() => handleTabClick(item.key)}
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
