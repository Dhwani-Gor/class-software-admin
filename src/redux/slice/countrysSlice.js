const { createSlice } = require("@reduxjs/toolkit");

const initialState = {
  countryDetails: {
    countryId: null,
    basicDetails: null,
    visaDetails: null,
    documents: null,
    faqs: [],
  },
};

const countrysSlice = createSlice({
  name: "countrys",
  initialState,
  reducers: {
    addCountryInfos: (state, action) => {
      const { type, basicDetail, visaDetail, document, faqs,countryID } = action.payload;

      switch (type) {
        case "basic":
          state.countryDetails.basicDetails = basicDetail ?? null;
          state.countryDetails.countryId = countryID ?? null;
          break;

        case "visa":
          state.countryDetails.visaDetails = visaDetail ?? null;
          break;

        case "document":
          state.countryDetails.documents = document ?? null;
          break;

        case "faq":
          if (faqs) {
            state.countryDetails.faqs = []; 
            faqs.faqs.forEach((ele) => {
              return state.countryDetails.faqs.push(ele);
            });
          }

          break;

        default:
          break;
      }
    },
    clearCountry: () => initialState,
  },
});

export const { addCountryInfos, clearCountry } = countrysSlice.actions;

export default countrysSlice.reducer;
