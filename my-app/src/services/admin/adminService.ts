import { adminServiceMock } from "../admin/adminService.mock";
import { adminServiceReal } from "../admin/adminService.real";
import axios from 'axios';

export const adminApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, 
});



const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// Same interface always returned
export const adminService = USE_MOCK
  ? adminServiceMock
  : adminServiceReal;
