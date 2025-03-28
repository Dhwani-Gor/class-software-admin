import axios from "axios";
import { store } from "../redux/store";

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
});

const getToken = () => {
  const state = store.getState();
  return state.auth?.userInfo?.token;
};

//axios instance
axiosInstance.interceptors.request.use(
  function (config) {
    try {
      config.headers["Content-Type"] = "application/json";
      const token = getToken();

      if (token) {
        config.headers["authorization"] = `Bearer ${token}`;
      }
      /*  if (config.data instanceof FormData) {
         config.headers["Content-Type"] = "multipart/form-data";
       } */
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

export const addInspectors = async (payload) => {
  let result;
  try {
    result = await axiosInstance.post(`/api/users`, payload);
  } catch (e) {
    result = e;
  }
  return result;
};

export const getUsersDetails = async (page, limit, search) => {
  let result;
  try {
    result = await axiosInstance.get("/api/users", {
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