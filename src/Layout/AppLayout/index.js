"use client";
import React from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import ThemeProvider from "@/theme";
import { persistor, store } from "@/redux/store";
// import AuthWrapper from "@/components/AuthWrapper";
import AuthProvider from "@/context/AuthContext";

const AppLayout = ({ children }) => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
};

export default AppLayout;
