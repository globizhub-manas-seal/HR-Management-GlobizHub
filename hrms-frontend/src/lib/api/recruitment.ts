import api from "../api";

export const recruitmentApi = {
  getJobs: async (params?: any) => {
    const res = await api.get("/recruitment/jobs", { params });
    return res.data;
  },

  getJobById: async (id: string) => {
    const res = await api.get(`/recruitment/jobs/${id}`);
    return res.data;
  },

  createJob: async (data: any) => {
    const res = await api.post("/recruitment/jobs", data);
    return res.data;
  },

  getApplications: async (params?: any) => {
    const res = await api.get("/recruitment/applications", { params });
    return res.data;
  },

  getApplicationById: async (id: string) => {
    const res = await api.get(`/recruitment/applications/${id}`);
    return res.data;
  },

  updateApplicationStatus: async (id: string, data: any) => {
    const res = await api.patch(`/recruitment/applications/${id}/status`, data);
    return res.data;
  },

  getRequisitions: async (params?: any) => {
    const res = await api.get("/recruitment/requisitions", { params });
    return res.data;
  },

  createRequisition: async (data: any) => {
    const res = await api.post("/recruitment/requisitions", data);
    return res.data;
  },

  createOffer: async (data: any) => {
    const res = await api.post("/recruitment/offers", data);
    return res.data;
  },
};

