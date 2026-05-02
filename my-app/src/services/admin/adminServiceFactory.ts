import { adminServiceMock } from "./adminService.mock";
import { adminServiceReal } from "./adminService.real";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export const adminService = USE_MOCK ? adminServiceMock : adminServiceReal;