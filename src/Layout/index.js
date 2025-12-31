"use client";
import React, { useEffect, useState } from "react";
import { Box, AppBar, Toolbar, IconButton, Typography, Badge, List, ListItem, ListItemText, ListItemSecondaryAction, Button, Divider, Menu, MenuItem, Avatar, Tooltip } from "@mui/material";
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
import { deleteAllNotification, deleteNotification, getNotificationList, markNotificationRead, readAllNotification } from "@/api";
import NotificationsIcon from "@mui/icons-material/Notifications";
import DeleteIcon from "@mui/icons-material/Delete";
import DoneAllIcon from "@mui/icons-material/DoneAll";

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
  const [notifications, setNotifications] = useState([]);
  const [notifAnchor, setNotifAnchor] = useState(null);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const res = await getNotificationList();

    if (res?.data?.success) {
      setNotifications(res.data.data);
    }
  };

  const handleNotifClick = (event) => {
    setNotifAnchor(event.currentTarget);
  };

  const handleNotifClose = () => {
    setNotifAnchor(null);
  };

  const handleDelete = async (id) => {
    await deleteNotification(id);
    loadNotifications();
  };

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    loadNotifications();
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
            {/* 🔔 Notification Icon */}
            <IconButton color="inherit" onClick={handleNotifClick}>
              <Badge badgeContent={notifications?.unreadCount || 0} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            {/* 🔔 Notification Dropdown */}
            <Menu anchorEl={notifAnchor} open={Boolean(notifAnchor)} onClose={handleNotifClose} PaperProps={{ style: { width: 380, maxHeight: 460 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" px={2} py={1}>
                <Typography variant="h6" fontWeight={600}>
                  Notifications
                </Typography>

                {/* Action Buttons */}
                <Box display="flex" gap={1}>
                  <Tooltip title="Mark all as read">
                    <IconButton
                      size="small"
                      onClick={async () => {
                        await readAllNotification(userInfo?.id);
                        loadNotifications();
                      }}
                    >
                      <DoneAllIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Delete all">
                    <IconButton
                      size="small"
                      onClick={async () => {
                        await deleteAllNotification(userInfo?.id);
                        loadNotifications();
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Divider />

              {/* <List sx={{ maxHeight: 390, overflowY: "auto" }}>
                {notifications?.data?.length === 0 && (
                  <ListItem>
                    <ListItemText primary="No notifications" />
                  </ListItem>
                )} */}

              {notifications?.data?.map((item) => (
                <ListItem
                  key={item.id}
                  sx={{
                    background: item.isRead ? "transparent" : "#e8f4ff",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <ListItemText
                    primary={item.title}
                    secondary={
                      <>
                        {item.body}
                        <br />
                        <Typography variant="caption" color="textSecondary">
                          {new Date(item.createdAt).toLocaleString()}
                        </Typography>
                      </>
                    }
                    onClick={() => {
                      if (item.webRedirectUrl) window.open(item.webRedirectUrl, "_blank");
                      handleMarkRead(item.id);
                    }}
                    sx={{ cursor: "pointer" }}
                  />

                  <ListItemSecondaryAction sx={{ display: "flex", gap: 1 }}>
                    {!item.isRead && (
                      <Tooltip title="Mark as read">
                        <IconButton size="small" onClick={() => handleMarkRead(item.id)}>
                          <DoneAllIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDelete(item.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {/* </List> */}
            </Menu>

            {/* <Menu anchorEl={notifAnchor} open={Boolean(notifAnchor)} onClose={handleNotifClose} PaperProps={{ style: { width: 350, maxHeight: 400 } }}> */}
            {/* <List>
                {notifications.length === 0 && (
                  <ListItem>
                    <ListItemText primary="No notifications" />
                  </ListItem>
                )} */}

            {notifications.map((item) => (
              <ListItem key={item.id} sx={{ background: item.isRead ? "transparent" : "#e3f2fd" }}>
                <ListItemText primary={item.title} secondary={item.message} />

                <ListItemSecondaryAction>
                  {/* Mark Read */}
                  {!item.isRead && (
                    <IconButton edge="end" onClick={() => handleMarkRead(item.id)}>
                      <DoneAllIcon fontSize="small" />
                    </IconButton>
                  )}

                  {/* Delete */}
                  <IconButton edge="end" onClick={() => handleDelete(item.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            {/* </List> */}
            {/* </Menu> */}

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
