import axios from "axios";
export const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  timeout: 15000,
});
let csrf;
export async function prepareCsrf() {
  const response = await api.get("/auth/csrf");
  csrf = response.data.data.csrfToken;
  return csrf;
}
api.interceptors.request.use(async (config) => {
  if (!["get", "head", "options"].includes(config.method)) {
    if (!csrf) await prepareCsrf();
    config.headers["X-CSRF-Token"] = csrf;
  }
  return config;
});
export const errorMessage = (error) =>
  error.response?.data?.error?.fields
    ?.map((f) => `${f.path}: ${f.message}`)
    .join(" · ") ||
  error.response?.data?.error?.message ||
  "Could not connect. Check your connection and try again.";
export async function uploadImage(file) {
  const form = new FormData();
  form.append("image", file);
  return (await api.post("/media", form)).data.data.url;
}
