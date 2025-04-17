import themeReducers from "../slice/themeSlice";
import authReducers from "../slice/authSlice";

const rootReducer = {
  theme: themeReducers,
  auth: authReducers,
};

export default rootReducer;
