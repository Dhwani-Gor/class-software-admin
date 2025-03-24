"use client";
import React from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import ThemeProvider from "@/theme";
import { persistor, store } from "@/redux/store";
import AuthWrapper from "@/components/AuthWrapper";
import { ToastContainer, } from 'react-toastify';

const AppLayout = ({ children }) => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <AuthWrapper>{children}</AuthWrapper>
          <ToastContainer />
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
};

export default AppLayout;
