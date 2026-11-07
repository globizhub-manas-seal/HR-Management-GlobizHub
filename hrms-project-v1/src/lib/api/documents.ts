import api from "../api";

export const documentsApi = {
  getMyDocuments: async () => {
    const res = await api.get("/documents/me");
    return res.data;
  },

  getAllDocuments: async (params?: any) => {
    const res = await api.get("/documents", { params });
    return res.data;
  },

  getEmployeeDocuments: async (employeeId: string) => {
    const res = await api.get(`/documents/employee/${employeeId}`);
    return res.data;
  },

  getDocumentDetails: async (documentId: string) => {
    const res = await api.get(`/documents/${documentId}/details`);
    return res.data;
  },

  uploadDocument: async (formData: FormData) => {
    const res = await api.post("/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  requestDocument: async (payload: { employeeId: string; name: string; category?: string; note?: string }) => {
    const res = await api.post("/documents/request", payload);
    return res.data;
  },

  updateStatus: async (documentId: string, payload: { status: string; reason?: string }) => {
    const res = await api.patch(`/documents/${documentId}/status`, payload);
    return res.data;
  },

  deleteDocument: async (documentId: string) => {
    const res = await api.delete(`/documents/${documentId}`);
    return res.data;
  },
};

