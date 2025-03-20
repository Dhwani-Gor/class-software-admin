import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "@reduxjs/toolkit";
import rootReducer from "../reducer";

const persistConfig = {
  key: "root",
  storage,
};

const combinedReducer = combineReducers(rootReducer);

const persistedReducer = persistReducer(persistConfig, combinedReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE", "REGISTER"],
        ignoredPaths: ["register"],
      },
    }),
});

export const persistor = persistStore(store);
