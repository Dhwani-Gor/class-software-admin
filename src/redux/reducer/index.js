import themeReducers from "../slice/themeSlice";
import authReducers from "../slice/authSlice";
import countrysReducers from "../slice/countrysSlice";

const rootReducer = {
  theme: themeReducers,
  auth: authReducers,
  countrys: countrysReducers,
};

export default rootReducer;
