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
      const token = localStorage.getItem("token");

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
    result = await axiosInstance.post(`/users/signUp`, payload);
  } catch (error) {
    result = error;
  }
  return result;
};
export const adminLogin = async (payload) => {
  let result;
  try {
    result = await axiosInstance.post(`/users/login`, payload);
  } catch (error) {
    result = error;
  }
  return result;
};

export const getVisitDetails = async (filterKey, filterValue) => {
  let result;
  try {
    result = await axiosInstance.get(`/visitDetails?filterKey=${filterKey}&filterValue=${filterValue}`);
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
    result = await axiosInstance.post(`/users`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const getAllUsers = async (page, limit, search, isActiveUsers = true) => {
  let result;
  try {
    result = await axiosInstance.get(`/users?filterKey=isActive&filterValue=${isActiveUsers}`, {
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
    result = await axiosInstance.delete(`/users/${payload.id}`);
  } catch (e) {
    result = e;
  }
  return result;
};

export const getInspectorsDetails = async (id) => {
  let result;
  try {
    result = await axiosInstance.get(`/users/${id}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const updateInspectorDetail = async (id, payload) => {
  let result;
  try {
    result = await axiosInstance.patch(`/users/${id}`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const getAllJournals = async ({ filterKey = "", filterValue = "", search = "", page, limit } = {}) => {
  let result;

  const params = {};
  params.filterKey = filterKey;
  params.filterValue = filterValue;

  if (search) params.search = String(search);
  if (page) params.page = page;
  if (limit) params.limit = limit;

  try {
    result = await axiosInstance.get("/journals", { params });
  } catch (error) {
    result = error;
  }

  return result;
};

export const getJournalsList = async ({ filterKey = "", filterValue = "", search = "", page, limit } = {}) => {
  let result;

  const params = {};
  params.filterKey = filterKey;
  params.filterValue = filterValue;

  if (search) params.search = String(search);
  if (page) params.page = page;
  if (limit) params.limit = limit;

  try {
    result = await axiosInstance.get("/journals/list", { params });
  } catch (error) {
    result = error;
  }

  return result;
};

export const getJournal = async (journalId) => {
  let result;
  try {
    result = await axiosInstance.get(`/journals/${journalId}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const deleteJournal = async (id) => {
  let result;
  try {
    result = await axiosInstance.delete(`/journals/${id}`);
  } catch (error) {
    result = error;
  }
  return result;
};
export const generateInspection = async (payload) => {
  let result;
  try {
    result = await axiosInstance.post(`/journals`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const updateInspection = async (payload, journalId) => {
  let result;
  try {
    result = await axiosInstance.patch(`/journals/${journalId}`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const getShipDetails = async (page, limit, search) => {
  let result;
  try {
    result = await axiosInstance.get("/ships", {
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
    result = await axiosInstance.get("/clients", {
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
    result = await axiosInstance.get(`/clients/${clientId}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const createClient = async (payload) => {
  let result;
  try {
    result = await axiosInstance.post(`/clients`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const updateClient = async (clientId, payload) => {
  let result;
  try {
    result = await axiosInstance.patch(`/clients/${clientId}`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const deleteClient = async (payload) => {
  let result;
  try {
    result = await axiosInstance.delete(`/clients/${payload.id}`);
  } catch (e) {
    result = e;
  }
  return result;
};

export const searchowner_detail = async (searchQuery) => {
  let result;
  try {
    result = await axiosInstance.get(`/search/ownerDetails?search=${searchQuery}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const searchmanager_detail = async (searchQuery) => {
  let result;
  try {
    result = await axiosInstance.get(`/search/managerDetails?search=${searchQuery}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const searchinvoicing_detail = async (searchQuery) => {
  let result;
  try {
    result = await axiosInstance.get(`/search/invoicingDetails?search=${searchQuery}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const getClientHistory = async (clientId) => {
  let result;
  try {
    result = await axiosInstance.get(`/clients/${clientId}/history`);
  } catch (e) {
    result = e;
  }
  return result;
};

export const createReportDetail = async (payload) => {
  let result;
  try {
    result = await axiosInstance.post(`/reportDetails`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const updateReportDetail = async (reportId, payload) => {
  let result;
  try {
    result = await axiosInstance.patch(`/reportDetails/${reportId}`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const createActivity = async (payload) => {
  let result;
  try {
    result = await axiosInstance.post(`/activities`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const updateActivity = async (payload, journalId) => {
  let result;
  try {
    result = await axiosInstance.patch(`/activities/${journalId}`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const getActivity = async (activityId) => {
  let result;
  try {
    result = await axiosInstance.get(`/activities/${activityId}`);
  } catch (e) {
    result = e;
  }
  return result;
};

export const deleteActivity = async (activityId) => {
  let result;
  try {
    result = await axiosInstance.delete(`/activities/${activityId}`);
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

    result = await axiosInstance.get("/activities", config);
  } catch (error) {
    result = error;
  }
  return result;
};

export const createVisitDetails = async (payload) => {
  let result;
  try {
    result = await axiosInstance.post(`/visitDetails`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const updateVisitDetails = async (payload, journalId) => {
  let result;
  try {
    result = await axiosInstance.patch(`/visitDetails/${journalId}`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const deleteVisitDetails = async (activityId) => {
  let result;
  try {
    result = await axiosInstance.delete(`/visitDetails/${activityId}`);
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

    result = await axiosInstance.get("/visitDetails", config);
  } catch (error) {
    result = error;
  }
  return result;
};

export const getSurveyTypes = async (search = "", page = "", limit = "") => {
  let result;
  try {
    result = await axiosInstance.get(`/surveyTypes?search=${search}&page=${page}&limit=${limit}`);
  } catch (error) {
    result = error;
  }
  return result;
};

// Survey Types API functions

export const createSurveyType = async (payload) => {
  let result;
  try {
    result = await axiosInstance.post(`/surveyTypes`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const updateSurveyType = async (id, payload) => {
  let result;
  try {
    result = await axiosInstance.patch(`/surveyTypes/${id}`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const deleteSurveyType = async (payload) => {
  let result;
  try {
    result = await axiosInstance.delete(`/surveyTypes/${payload.id}`);
  } catch (e) {
    result = e;
  }
  return result;
};

export const getSurveyTypeDetails = async (id) => {
  let result;
  try {
    result = await axiosInstance.get(`/surveyTypes/${id}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const getReports = async () => {
  let result;
  try {
    result = await axiosInstance.get(`/reports`);
  } catch (error) {
    result = error;
  }
  return result;
};

// Document API functions
export const getAllDocuments = async (params) => {
  let result;
  try {
    result = await axiosInstance.get("/reports", { params });
  } catch (error) {
    result = error;
  }
  return result;
};

export const getDocumentDetails = async (id) => {
  let result;
  try {
    result = await axiosInstance.get(`/reports/${id}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const createDocument = async (payload) => {
  let result;
  try {
    result = await axiosInstance.post(`/reports`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const updateDocument = async (id, payload) => {
  let result;
  try {
    result = await axiosInstance.patch(`/reports/${id}`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const deleteDocument = async (id) => {
  let result;
  try {
    result = await axiosInstance.delete(`/reports/${id}`);
  } catch (e) {
    result = e;
  }
  return result;
};

export const searchUnloCodes = async (query) => {
  let result;
  try {
    result = await axiosInstance.get("/unloCodes/search", {
      params: {
        query: query,
      },
    });
  } catch (error) {
    result = error;
  }
  return result;
};

export const updateActivityDetails = async (id, payload) => {
  let result;
  try {
    result = await axiosInstance.patch(`/activities/${id}`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const getSelectedReportDetails = async (id) => {
  let result;
  try {
    result = await axiosInstance.get(`/reportDetails/${id}`);
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

    result = await axiosInstance.get("/reportDetails", config);
  } catch (error) {
    result = error;
  }
  return result;
};

export const getSelectedActivityReportDetails = async (id) => {
  let result;
  try {
    result = await axiosInstance.get(`/reportDetails?filterKey=activityId&filterValue=${id}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const generateFullReport = async (payload) => {
  let result;
  try {
    result = await axiosInstance.post(`/reportDetails/generateReport`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const getEndorsedIssuedBy = async (filterKey, filterValue) => {
  let result;
  try {
    result = await axiosInstance.get(`/visitDetails?filterKey=${filterKey}&filterValue=${filterValue}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const getAllIssuedDocuments = async (filterKeys = [], filterValues = [], searchQuery, page, limit, startDate, endDate, markAsArchive, issuedDocument) => {
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
    if (markAsArchive !== undefined) params.markAsArchive = markAsArchive;
    if (issuedDocument !== undefined) params.issuedDocument = issuedDocument;

    const result = await axiosInstance.get("/reportDetails", { params });
    return result;
  } catch (error) {
    return error;
  }
};

export const deleteAttachment = async (activityId, attachmentId) => {
  let result;
  try {
    result = await axiosInstance.delete(`/activities/${activityId}/attachments/${attachmentId}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const getAllReports = async (page, limit, searchQuery) => {
  let result;
  try {
    const params = {};
    if (searchQuery) params.search = searchQuery;
    if (page) params.page = page;
    if (limit) params.limit = limit;
    result = await axiosInstance.get(`/surveyStatusReports`, { params });
  } catch (error) {
    result = error;
  }
  return result;
};
// API functions for System Variables CRUD operations

export const createSystemVariable = async (payload) => {
  let result;
  try {
    const config = {};

    // If payload is FormData (for image upload), set appropriate headers
    if (payload instanceof FormData) {
      config.headers = {
        "Content-Type": "multipart/form-data",
      };
    }

    result = await axiosInstance.post(`/systemData`, payload, config);
  } catch (e) {
    result = e;
  }
  return result;
};

export const getAllSystemVariables = async (page, limit, search) => {
  let result;
  try {
    result = await axiosInstance.get(`/systemData`, {
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

export const deleteSystemVariable = async (payload) => {
  let result;
  try {
    result = await axiosInstance.delete(`/systemData/${payload.id}`);
  } catch (e) {
    result = e;
  }
  return result;
};

export const getSystemVariableDetails = async (id) => {
  let result;
  try {
    result = await axiosInstance.get(`/systemData?filterKey=id&filterValue=${id}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const updateSystemVariable = async (id, payload) => {
  let result;
  try {
    const config = {};

    // If payload is FormData (for image upload), set appropriate headers
    if (payload instanceof FormData) {
      config.headers = {
        "Content-Type": "multipart/form-data",
      };
    }

    result = await axiosInstance.patch(`/systemData/${id}`, payload, config);
  } catch (e) {
    result = e;
  }
  return result;
};

export const getSurveyReportData = async (clientId) => {
  let result;
  try {
    result = await axiosInstance.get(`/reportDetails?filterKey=activity.journal.clientId&filterValue=${clientId}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const getSurveyReportDataByJournalId = async (clientId, journalId) => {
  let result;
  try {
    result = await axiosInstance.get(`/reportDetails?filterKey=activity.journal.clientId&filterValue=${clientId}&journalId=${journalId}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const addClassificationSurvey = async (payload) => {
  let result;
  try {
    result = await axiosInstance.post(`/classificationSurveys`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const deleteClassificationSurvey = async (id) => {
  let result;
  try {
    result = await axiosInstance.delete(`/classificationSurveys/${id}`);
  } catch (e) {
    result = e;
  }
  return result;
};

export const updateClassificationSurvey = async (id, payload) => {
  let result;
  try {
    result = await axiosInstance.patch(`/classificationSurveys/update/${id}`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const getAllClassificationSurveys = async ({ clientId, page, limit }) => {
  let result;
  try {
    result = await axiosInstance.get(`/classificationSurveys?filterKey=clientId&filterValue=${clientId}&page=${page}&limit=${limit}`);
  } catch (error) {
    result = error;
  }
  return result;
};
export const getAllListClassificationSurveys = async ({ clientId }) => {
  let result;
  try {
    result = await axiosInstance.get(`/classificationSurveys?filterKey=clientId&filterValue=${clientId}`);
  } catch (error) {
    result = error;
  }
  return result;
};
export const getSingleClassificationSurveyDetails = async (id) => {
  let result;
  try {
    result = await axiosInstance.get(`/classificationSurveys/${id}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const uploadSurveyReport = async (payload) => {
  let result;
  try {
    result = await axiosInstance.post(`/surveyStatusReports`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const getAllSurveyStatusReport = async ({ params }) => {
  let result;
  try {
    result = await axiosInstance.get(`/surveyStatusReports`, { params });
  } catch (error) {
    result = error;
  }
  return result;
};

export const deleteSurveyReport = async (id) => {
  let result;
  try {
    result = await axiosInstance.delete(`/surveyStatusReports/${id}`);
  } catch (e) {
    result = e;
  }
  return result;
};

export const getAllClassificationSurveyType = async () => {
  let result;
  try {
    result = await axiosInstance.get(`/surveyTypes?type=classification`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const addArchiveDocument = async (payload) => {
  try {
    const result = await axiosInstance.post("/reportDetails/markAsArchived", payload);
    return result;
  } catch (e) {
    console.error("Error archiving document:", e);
    return e;
  }
};

export const addUnArchiveDocument = async (payload) => {
  try {
    const result = await axiosInstance.post("/reportDetails/markAsUnArchived", payload);
    return result;
  } catch (e) {
    console.error("Error archiving document:", e);
    return e;
  }
};

export const getAllModules = async () => {
  let result;
  try {
    result = await axiosInstance.get(`/modules`);
  } catch (e) {
    result = e;
  }
  return result;
};

export const deleteSurveyStatusReport = async (id) => {
  let result;
  try {
    result = await axiosInstance.delete(`/surveyStatusReports/${id}`);
  } catch (e) {
    result = e;
  }
  return result;
};

export const addAmdRemarks = async (payload) => {
  try {
    const result = await axiosInstance.post("/reportDetails/generateReport", payload);
    return result;
  } catch (e) {
    console.error("Error archiving document:", e);
    return e;
  }
};

export const addAdditionalFields = async (payload) => {
  try {
    const result = await axiosInstance.post("/additionalField", payload);
    return result;
  } catch (e) {
    console.error("Error archiving document:", e);
    return e;
  }
};

export const fetchJournalList = async (clientId) => {
  let result;
  try {
    result = await axiosInstance.get(`/journals/fetch?filterKey=clientId&filterValue=${clientId}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const fetchAdditionalDetails = async (clientId) => {
  let result;
  try {
    result = await axiosInstance.get(`/additionalField?clientId=${clientId}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const updateAdditionalFields = async (id, payload) => {
  let result;
  try {
    result = await axiosInstance.put(`/additionalField/${id}`, payload);
  } catch (error) {
    result = error;
  }
  return result;
};

export const getSingleAdditionalDetails = async (id) => {
  let result;
  try {
    result = await axiosInstance.get(`/additionalField/${id}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const fetchAmdReamrks = async (id) => {
  let result;
  try {
    result = await axiosInstance.get(`/reportDetails/amdReports/${id}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const deleteAdditionalField = async (id) => {
  let result;
  try {
    result = await axiosInstance.delete(`/additionalField/${id}`);
  } catch (error) {
    result = error;
  }
  return result;
};

export const forgotPassword = async (payload) => {
  let result;
  try {
    result = await axiosInstance.post(`users/forgotPassword`, payload);
  } catch (error) {
    result = error;
  }
  return result;
};

export const resetPassword = async (token, data) => {
  let result;
  try {
    result = await axiosInstance.post(`users/resetPassword/${token}`, data);
  } catch (error) {
    result = error;
  }
  return result;
};

export const uploadNarrativeReports = async (payload) => {
  let result;
  try {
    result = await axiosInstance.post(`/narrativeReport`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};
export const markAsRevoked = async (payload) => {
  let result;
  try {
    result = await axiosInstance.post(`/reportDetails/markAsRevoked`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};
