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

export const getVisitDetails = async (filterKey, filterValue, page, limit, search) => {
  let result;
  try {
    result = await axiosInstance.get("/api/visitDetails", {
      params: {
        filterKey: 'journalId',
        filterValue: 28,
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
        search: search,
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

export const getAllJournals = async ({
  filterKey = '',
  filterValue = '',
  search = '',
  page,
  limit,
} = {}) => {
  let result;

  const params = {};
  params.filterKey = filterKey;
  params.filterValue = filterValue;

  if (search) params.search = String(search);
  if (page) params.page = page;
  if (limit) params.limit = limit;

  try {
    result = await axiosInstance.get("/api/journals", { params });
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

export const deleteJournal = async (id) => {
  let result;
  try {
    result = await axiosInstance.delete(`/api/journals/${id}`);
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

export const getAllClients = async (page, limit, search) => {
  let result;
  try {
    result = await axiosInstance.get("/api/clients", {
      params: {
        page: page,
        limit: limit,
        search: search,
      },
    });
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

export const searchmanager_detail = async (searchQuery) => {
  let result;
  try {
    result = await axiosInstance.get(`/api/search/managerDetails?search=${searchQuery}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const searchinvoicing_detail = async (searchQuery) => {
  let result;
  try {
    result = await axiosInstance.get(`/api/search/invoicingDetails?search=${searchQuery}`);
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

export const updateReportDetail = async (reportId, payload) => {
  let result;
  try {
    result = await axiosInstance.patch(`/api/reportDetails/${reportId}`, payload);
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

export const getSurveyTypes = async (search = '', page = '', limit = '') => {
  let result;
  try {
    result = await axiosInstance.get(`/api/surveyTypes?search=${search}&page=${page}&limit=${limit}`);
  } catch (error) {
    result = error;
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

export const searchUnloCodes = async (query) => {
  let result;
  try {
    result = await axiosInstance.get('/api/unloCodes/search', {
      params: {
        query: query
      }
    });
  } catch (error) {
    result = error;
  }
  return result;
};

export const updateActivityDetails = async (id, payload) => {
  let result;
  try {
    result = await axiosInstance.patch(`/api/activities/${id}`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const getSelectedReportDetails = async (id) => {
  let result;
  try {
    result = await axiosInstance.get(`/api/reportDetails/${id}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const getAllActivityReportDetails = async (filterKey, filterValue) => {
  let result;
  try {
    const params = {};
    if (filterKey !== undefined) params.filterKey = filterKey;
    if (filterValue !== undefined) params.filterValue = filterValue;

    const config = Object.keys(params).length > 0 ? { params } : undefined;

    result = await axiosInstance.get("/api/reportDetails", config);
  } catch (error) {
    result = error;
  }
  return result;
};

export const getSelectedActivityReportDetails = async (id) => {
  let result;
  try {
    result = await axiosInstance.get(`/api/reportDetails?filterKey=activityId&filterValue=${id}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const generateFullReport = async (payload) => {
  let result;
  try {
    result = await axiosInstance.post(`/api/reportDetails/generateReport`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const getEndorsedIssuedBy = async (filterKey, filterValue) => {
  let result;
  try {
    result = await axiosInstance.get(`/api/visitDetails?filterKey=${filterKey}&filterValue=${filterValue}`);
  } catch (error) {
    result = error;
  }
  return result;
};


export const getAllIssuedDocuments = async (filterKeys = [], filterValues = [], searchQuery, page, limit, startDate, endDate) => {
  try {
    const params = {};

    if (filterKeys.length && filterValues.length) {
      params.filterKey = filterKeys.join(",");
      params.filterValue = filterValues.join(",");
    }

    if (searchQuery) params.search = searchQuery;
    if (page) params.page = page;
    if (limit) params.limit = limit;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const result = await axiosInstance.get("/api/reportDetails", { params });
    return result;
  } catch (error) {
    return error;
  }
};

export const deleteAttachment = async (activityId, attachmentId) => {
  let result;
  try {
    result = await axiosInstance.delete(`/api/activities/${activityId}/attachments/${attachmentId}`);
  } catch (error) {
    result = error;
  }
  return result;
}

