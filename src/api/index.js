import axios from "axios";
import { store } from "../redux/store";

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
});



//axios instance
axiosInstance.interceptors.request.use(
  function (config) {
    try {
      config.headers["Content-Type"] = "application/json";
      const token = localStorage.getItem("token")

      if (token) {
        config.headers["authorization"] = `Bearer ${token}`;
      }
      /*  if (config.data instanceof FormData) {
         config.headers["Content-Type"] = "multipart/form-data";
       } */
       if (config.data instanceof FormData) {
        config.headers["Content-Type"] = "multipart/form-data";
      } else {
        config.headers["Content-Type"] = "application/json";
      }
      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  function (error) {
    return Promise.reject(error);
  }
);

export const addCountry = async (payload) => {
  let result;
  try {
    result = await axiosInstance.post(`/visa/create-visa`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const registerUser = async (payload) => {
  let result;
  try {
    result = await axiosInstance.post(`/api/users/signUp`, payload);
  } catch (error) {
    result = error;
  }
  return result;
};
export const adminLogin = async (payload) => {
  let result;
  try {
    result = await axiosInstance.post(`/api/users/login`, payload);
  } catch (error) {
    result = error;
  }
  return result;
};

export const getVisaDetails = async (page, limit, search) => {
  let result;
  try {
    result = await axiosInstance.get("/visa/visa-list", {
      params: {
        page: page,
        limit: limit,
        query: search,
      },
    });
  } catch (error) {
    result = error;
  }
  return result;
};

export const getParticularVisaDetails = async (id) => {
  let result;
  try {
    result = await axiosInstance.get(`/visa/get-visa/${id}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const updateCountry = async (id, payload) => {
  let result;
  try {
    result = await axiosInstance.put(`/visa/update-visa/${id}`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const deleteVisa = async (payload) => {
  let result;
  try {
    result = await axiosInstance.delete(`/visa/delete-visa/${payload.id}`);
  } catch (e) {
    result = e;
  }
  return result;
};

export const getAllVisas = async (page, limit, search) => {
  let result;
  try {
    result = await axiosInstance.get(`/visaApplication/get-visa-application`, {
      params: {
        page: page,
        limit: limit,
        query: search,
      },
    });
  } catch (e) {
    result = e;
  }
  return result;
};

export const getParticularVisaApplicantDetails = async (id) => {
  let result;
  try {
    result = await axiosInstance.get(`/visaApplication/get-visa-application/${id}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const createInspector = async (payload) => {
  let result;
  try {
    result = await axiosInstance.post(`/api/users`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const getAllUsers = async (page, limit, search, isActiveUsers = true) => {
  let result;
  try {
    result = await axiosInstance.get(`/api/users?filterKey=isActive&filterValue=${isActiveUsers}`, {
      params: {
        page: page,
        limit: limit,
        query: search,
      },
    });
  } catch (error) {
    result = error;
  }
  return result;
};

export const deleteUser = async (payload) => {
  let result;
  try {
    result = await axiosInstance.delete(`/api/users/${payload.id}`);
  } catch (e) {
    result = e;
  }
  return result;
};

export const getInspectorsDetails = async (id) => {
  let result;
  try {
    result = await axiosInstance.get(`/api/users/${id}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const updateInspectorDetail = async (id, payload) => {
  let result;
  try {
    result = await axiosInstance.patch(`/api/users/${id}`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};


export const getAllJournals = async (filterKey, filterValue) => {
  let result;
  try {
    // Create params object only if parameters are provided
    const params = {};
    if (filterKey !== undefined) params.filterKey = filterKey;
    if (filterValue !== undefined) params.filterValue = filterValue;
    
    // Only include params object if it's not empty
    const config = Object.keys(params).length > 0 ? { params } : undefined;
    
    result = await axiosInstance.get("/api/journals", config);
  } catch (error) {
    result = error;
  }
  return result;
};

export const getJournal = async (journalId) => {
  let result;
  try {
    result = await axiosInstance.get(`/api/journals/${journalId}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const generateInspection = async (payload) => {
  let result;
  try {
    result = await axiosInstance.post(`/api/journals`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const updateInspection = async (payload, journalId) => {
  let result;
  try {
    result = await axiosInstance.patch(`/api/journals/${journalId}`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const getShipDetails = async (page, limit, search) => {
  let result;
  try {
    result = await axiosInstance.get("/api/ships", {
      params: {
        page: page,
        limit: limit,
        query: search,
      },
    });
  } catch (error) {
    result = error;
  }
  return result;
};

export const getAllClients = async () => {
  let result;
  try {
    result = await axiosInstance.get("/api/clients");
  } catch (error) {
    result = error;
  }
  return result;
};

export const getSpecificClient = async (clientId) => {
  let result;
  try {
    result = await axiosInstance.get(`/api/clients/${clientId}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const createClient = async (payload) => {
  let result;
  try {
    result = await axiosInstance.post(`/api/clients`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const updateClient = async (clientId, payload) => {
  let result;
  try {
    result = await axiosInstance.patch(`/api/clients/${clientId}`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const deleteClient = async (payload) => {
  let result;
  try {
    result = await axiosInstance.delete(`/api/clients/${payload.id}`);
  } catch (e) {
    result = e;
  }
  return result;
};

export const searchowner_detail = async (searchQuery) => {
  let result;
  try {
    result = await axiosInstance.get(`/api/search/ownerDetails?search=${searchQuery}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const getClientHistory = async (clientId) => {
  let result;
  try {
    result = await axiosInstance.get(`/api/clients/${clientId}/history`);
  } catch (e) {
    result = e;
  }
  return result;
};

export const createReportDetail = async (payload) => {
  let result;
  try {
    result = await axiosInstance.post(`/api/reportDetails`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const createActivity = async (payload) => {
  let result;
  try {
    result = await axiosInstance.post(`/api/activities`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const updateActivity = async (payload, journalId) => {
  let result;
  try {
    result = await axiosInstance.patch(`/api/activities/${journalId}`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const deleteActivity = async (activityId) => {
  let result;
  try {
    result = await axiosInstance.delete(`/api/activities/${activityId}`);
  } catch (e) {
    result = e;
  }
  return result;
};


export const getAllActivities = async (filterKey, filterValue) => {
  let result;
  try {
    // Create params object only if parameters are provided
    const params = {};
    if (filterKey !== undefined) params.filterKey = filterKey;
    if (filterValue !== undefined) params.filterValue = filterValue;
    
    // Only include params object if it's not empty
    const config = Object.keys(params).length > 0 ? { params } : undefined;
    
    result = await axiosInstance.get("/api/activities", config);
  } catch (error) {
    result = error;
  }
  return result;
};


export const createVisitDetails = async (payload) => {
  let result;
  try {
    result = await axiosInstance.post(`/api/visitDetails`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const updateVisitDetails = async (payload, journalId) => {
  let result;
  try {
    result = await axiosInstance.patch(`/api/visitDetails/${journalId}`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const deleteVisitDetails = async (activityId) => {
  let result;
  try {
    result = await axiosInstance.delete(`/api/visitDetails/${activityId}`);
  } catch (e) {
    result = e;
  }
  return result;
};


export const getAllVisitDetails = async (filterKey, filterValue) => {
  let result;
  try {
    // Create params object only if parameters are provided
    const params = {};
    if (filterKey !== undefined) params.filterKey = filterKey;
    if (filterValue !== undefined) params.filterValue = filterValue;
    
    // Only include params object if it's not empty
    const config = Object.keys(params).length > 0 ? { params } : undefined;
    
    result = await axiosInstance.get("/api/visitDetails", config);
  } catch (error) {
    result = error;
  }
  return result;
};

export const getSurveyTypes = async () => {
  let result;
  try {
    result = await axiosInstance.get("/api/surveyTypes");
  } catch (error) {
    result = ertror;
  }
  return result;
};

// Survey Types API functions

export const createSurveyType = async (payload) => {
  let result;
  try {
    result = await axiosInstance.post(`/api/surveyTypes`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const updateSurveyType = async (id, payload) => {
  let result;
  try {
    result = await axiosInstance.patch(`/api/surveyTypes/${id}`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};


export const deleteSurveyType = async (payload) => {
  let result;
  try {
    result = await axiosInstance.delete(`/api/surveyTypes/${payload.id}`);
  } catch (e) {
    result = e;
  }
  return result;
};

export const getSurveyTypeDetails = async (id) => {
  let result;
  try {
    result = await axiosInstance.get(`/api/surveyTypes/${id}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const getReports = async () => {
  let result;
  try {
    result = await axiosInstance.get(`/api/reports`);
  } catch (error) {
    result = error;
  }
  return result;
};

// Document API functions
export const getAllDocuments = async () => {
  let result;
  try {
    result = await axiosInstance.get("/api/reports");
  } catch (error) {
    result = error;
  }
  return result;
};

export const getDocumentDetails = async (id) => {
  let result;
  try {
    result = await axiosInstance.get(`/api/reports/${id}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const createDocument = async (payload) => {
  let result;
  try {
    result = await axiosInstance.post(`/api/reports`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const updateDocument = async (id, payload) => {
  let result;
  try {
    result = await axiosInstance.patch(`/api/reports/${id}`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const deleteDocument = async (payload) => {
  let result;
  try {
    result = await axiosInstance.delete(`/api/reports/${payload.id}`);
  } catch (e) {
    result = e;
  }
  return result;
};