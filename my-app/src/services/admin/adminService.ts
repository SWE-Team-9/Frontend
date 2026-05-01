import { adminServiceMock } from "../admin/adminService.mock";
import { adminServiceReal } from "../admin/adminService.real";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// Same interface always returned
export const adminService = USE_MOCK
  ? adminServiceMock
  : adminServiceReal;
