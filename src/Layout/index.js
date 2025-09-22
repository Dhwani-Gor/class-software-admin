"use client";
import React, { useState } from "react";
import { Box, AppBar, Toolbar, IconButton, Typography, Divider, Menu, MenuItem, Avatar, Tooltip } from "@mui/material";
import { Stack, styled } from "@mui/system";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/redux/slice/authSlice";
import { usePathname } from "next/navigation";
import Logo from "../../public/assets/logo.svg";
import Image from "next/image";
import SidebarComponent from "./Sidebar";
import { useAuth } from "@/hooks/useAuth";

const MainContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(4),
  marginLeft: 10,
  transition: theme.transitions.create(["margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
}));

// App Header
const Header = styled(AppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  backgroundColor: theme.palette.mode === "dark" ? theme.palette.background.default : "white",
  color: theme.palette.mode === "dark" ? theme.palette.text.primary : "#000000",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
}));

const Layout = ({ children }) => {
  const { roleId, logout } = useAuth();
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.auth.userInfo);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const onLogout = () => {
    logout();
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Header position="fixed">
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box display="flex" alignItems="center">
            <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={toggleSidebar} sx={{ mr: 2, ...(isSidebarOpen && { display: "none" }) }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h4" fontWeight={"700"}>
              MARINE ASSURE
              {/* <Image src={Logo} width={80} alt="visayard_logo" /> */}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center">
            <Tooltip title="User Menu">
              <Avatar
                onClick={handleMenuClick}
                sx={{
                  bgcolor: "primary.main",
                  cursor: "pointer",
                  "&:hover": { opacity: 0.8 },
                }}
              >
                {userInfo?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              keepMounted
              PaperProps={{
                style: { minWidth: "200px" },
              }}
            >
              <MenuItem>
                <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                  <Typography> {userInfo?.name}</Typography>
                </Box>
              </MenuItem>
              <Divider />
              <MenuItem onClick={onLogout}>
                <LogoutIcon sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Header>

      <SidebarComponent isSidebarOpen={isSidebarOpen} />

      <MainContent sx={{ overflowX: "hidden" }}>
        <Toolbar />
        {children}
      </MainContent>
    </Box>
  );
};

export default Layout;
