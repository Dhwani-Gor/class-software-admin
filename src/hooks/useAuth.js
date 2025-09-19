import { AuthContext } from "@/context/AuthContext";
import { useContext } from "react";

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  const { isAuthenticated, roleId, permissions, isLoading, login, logout, getAllowedRoutes } = context;

  // Get user data from localStorage
  const getUserData = () => {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem("data");
      return data ? JSON.parse(data) : {};
    }
    return {};
  };

  // Check if user has specific permission
  const hasPermission = (module) => {
    return permissions.includes(module);
  };

  // Check if user has specific right
  const hasRight = (rightName) => {
    const userData = getUserData();
    return userData[rightName] === true;
  };

  // Check if user can access a specific route
  const canAccessRoute = (route) => {
    const allowedRoutes = getAllowedRoutes();
    return allowedRoutes.some(allowedRoute => 
      route.startsWith(allowedRoute) || route.includes(allowedRoute)
    );
  };

  return {
    isAuthenticated,
    roleId,
    permissions,
    isLoading,
    login,
    logout,
    data: getUserData(),
    hasPermission,
    hasRight,
    canAccessRoute,
    getAllowedRoutes
  };
};