import api from "@/src/services/api";

export type ReportTargetType = "TRACK" | "COMMENT" | "USER" | "PLAYLIST";
export type ReportReason = "COPYRIGHT" | "INAPPROPRIATE" | "SPAM";

export interface CreateReportPayload {
  targetId: string;
  targetType: ReportTargetType;
  reason: ReportReason;
  description?: string;
}

export interface CreateReportResponse {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  status: string;
  createdAt: string;
}

export const reportService = {
  createReport: async (payload: CreateReportPayload): Promise<CreateReportResponse> => {
    const response = await api.post("/reports", payload);
    return response.data;
  },
};
