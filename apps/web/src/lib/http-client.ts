import { env } from "@DealFlow360/env/web";
import axios from "axios";

const defaultBaseURL =
  typeof window !== "undefined" ? "" : env.VITE_SERVER_URL;

export function createHttpClient(baseURL = defaultBaseURL) {
  return axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
    timeout: 10_000,
    withCredentials: true,
  });
}

export const httpClient = createHttpClient();
