import axios from "axios";
import { toast } from "react-toastify";
import tokenService from "./tokenService";

axios.interceptors.request.use((config) => {
  config.baseURL = process.env.API_URL || "http://localhost:5000";
  config.withCredentials = true;
  return config;
});

axios.interceptors.response.use(null, async (error) => {
  const unauthorized =
    error.response &&
    error.response.status === 401 &&
    error.config.url.indexOf("/token") != 0;

  if (unauthorized) {
    try {
      await tokenService.refreshToken();
      axios.request(error.config);
    } catch (error) {}
  }

  const expectedError =
    error.response &&
    error.response.status >= 400 &&
    error.response.status < 500;

  if (!expectedError) {
    toast.error("An unexpected error occured");
  }

  return Promise.reject(error);
});

export default {
  get: axios.get,
  post: axios.post,
  put: axios.put,
  patch: axios.patch,
  delete: axios.delete,
};
