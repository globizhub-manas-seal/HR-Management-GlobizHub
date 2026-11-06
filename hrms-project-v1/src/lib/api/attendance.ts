import api from "../api";

export const attendanceApi = {
  getMyStats: async () => {
    const res = await api.get("/attendance/my-stats");
    return res.data;
  },

  getMyHistory: async (params?: any) => {
    const res = await api.get("/attendance/my-history", { params });
    return res.data;
  },

  clockIn: async (data?: any) => {
    const res = await api.post("/attendance/clock-in", data);
    return res.data;
  },

  clockOut: async (data?: any) => {
    const res = await api.post("/attendance/clock-out", data);
    return res.data;
  },

  getApprovals: async (params?: any) => {
    const res = await api.get("/attendance/approvals", { params });
    return res.data;
  },

  approveCorrection: async (id: string, data: any) => {
    const res = await api.patch(`/attendance/approvals/${id}`, data);
    return res.data;
  },
};

