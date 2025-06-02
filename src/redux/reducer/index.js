import themeReducers from "../slice/themeSlice";
import authReducers from "../slice/authSlice";
import activityReducers from "../slice/activitySlice";

const rootReducer = {
  theme: themeReducers,
  auth: authReducers,
  activity: activityReducers,
};

export default rootReducer;
