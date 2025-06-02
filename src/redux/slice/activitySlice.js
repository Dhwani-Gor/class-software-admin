import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activity: null,
  reportsBySurveyId: {} // 👈 Key: survey ID (46, 47), Value: reports[]
};

const activitySlice = createSlice({
  name: "activity",
  initialState,
  reducers: {
    saveActivity: (state, action) => {
      state.activity = action.payload;
    },
    saveReportsBySurveyId: (state, action) => {
        const surveyList = action.payload;
        const newReports = {};
      
        surveyList.forEach((item) => {
          const surveyId = item.id;
          const reports = item?.surveyTypes?.reports || [];
          newReports[surveyId] = reports;
        });
      
        state.reportsBySurveyId = {
          ...state.reportsBySurveyId,
          ...newReports,
        };
      },
    clearReports: (state) => {
      state.reportsBySurveyId = {};
    }
  }
});

export default activitySlice.reducer;

export const { saveActivity, saveReportsBySurveyId, clearReports } = activitySlice.actions;
