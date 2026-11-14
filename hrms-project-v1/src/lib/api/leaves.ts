import api from "../api";

export const leavesApi = {
  getMyLeaves: async (params?: any) => {
    try {
      const res = await api.get("/leaves/my", { params });
      return res.data;
    } catch {
      const res = await api.get("/leaves/my-leaves", { params });
      return res.data;
    }
  },

  getMyBalance: async () => {
    const res = await api.get("/leaves/balance");
    return res.data;
  },

  applyLeave: async (data: any) => {
    const res = await api.post("/leaves", data);
    return res.data;
  },

  getCompanyLeaves: async (params?: any) => {
    const res = await api.get("/leaves/company", { params });
    return res.data;
  },

  getApprovals: async (params?: any) => {
    const res = await api.get("/leaves/approvals", { params });
    return res.data;
  },

  withdrawLeave: async (id: string) => {
    const res = await api.post(`/leaves/${id}/withdraw`);
    return res.data;
  },

  updateStatus: async (
    id: string,
    data: { status: string; rejectionReason?: string }
  ) => {
    const res = await api.patch(`/leaves/${id}/status`, data);
    return res.data;
  },

  adjustBalance: async (data: {
    employeeId: string;
    type: string;
    amount: number;
    reason: string;
    year?: number;
  }) => {
    const res = await api.post("/leaves/adjust-balance", data);
    return res.data;
  },

  updatePolicy: async (id: string, data: any) => {
    const res = await api.patch(`/leaves/policy/${id}`, data);
    return res.data;
  },

  deletePolicy: async (id: string) => {
    const res = await api.delete(`/leaves/policy/${id}`);
    return res.data;
  },

  getHolidays: async () => {
    const res = await api.get("/leaves/holidays");
    return res.data;
  },

  addHoliday: async (data: { name: string; date: string; type?: string }) => {
    const res = await api.post("/leaves/holidays", data);
    return res.data;
  },

  deleteHoliday: async (id: string) => {
    const res = await api.delete(`/leaves/holidays/${id}`);
    return res.data;
  },
};
