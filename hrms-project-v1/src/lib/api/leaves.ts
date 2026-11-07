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
    const res = await api.get("/leaves/admin/company", { params });
    return res.data;
  },

  updateStatus: async (id: string, data: any) => {
    const res = await api.patch(`/leaves/${id}/status`, data);
    return res.data;
  },
};
