import createClient from "openapi-fetch";
import type { paths } from "@/types/api";

const apiClient = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3110",
});

export default apiClient;
