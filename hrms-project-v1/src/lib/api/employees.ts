import api from "../api";

export const employeesApi = {
  getAll: async (params?: any) => {
    const res = await api.get("/employees", { params });
    return res.data;
  },

  getById: async (employeeId: string) => {
    const res = await api.get(`/employees/${employeeId}`);
    return res.data;
  },

  update: async (employeeId: string, data: any) => {
    const res = await api.patch(`/employees/${employeeId}`, data);
    return res.data;
  },

  invite: async (data: any) => {
    const res = await api.post("/employees/invite", data);
    return res.data;
  },

  bulkImport: async (employees: any[]) => {
    const res = await api.post("/employees/bulk-import", { employees });
    return res.data;
  },

  resendInvite: async (employeeId: string) => {
    const res = await api.post(`/employees/${employeeId}/resend-invite`);
    return res.data;
  },

  delete: async (employeeId: string) => {
    const res = await api.delete(`/employees/${employeeId}`);
    return res.data;
  },

  // Skills
  getSkills: async (employeeId: string) => {
    const res = await api.get(`/employees/${employeeId}/skills`);
    return res.data;
  },

  addSkill: async (employeeId: string, data: any) => {
    const res = await api.post(`/employees/${employeeId}/skills`, data);
    return res.data;
  },

  removeSkill: async (employeeId: string, skillId: string) => {
    const res = await api.delete(`/employees/${employeeId}/skills/${skillId}`);
    return res.data;
  },

  // Emergency Contacts
  getEmergencyContacts: async (employeeId: string) => {
    const res = await api.get(`/employees/${employeeId}/emergency-contacts`);
    return res.data;
  },

  addEmergencyContact: async (employeeId: string, data: any) => {
    const res = await api.post(`/employees/${employeeId}/emergency-contacts`, data);
    return res.data;
  },

  removeEmergencyContact: async (employeeId: string, contactId: string) => {
    const res = await api.delete(`/employees/${employeeId}/emergency-contacts/${contactId}`);
    return res.data;
  },

  // History & Exit
  getHistory: async (employeeId: string) => {
    const res = await api.get(`/employees/${employeeId}/history`);
    return res.data;
  },

  removeHistory: async (employeeId: string, historyId: string) => {
    const res = await api.delete(`/employees/${employeeId}/history/${historyId}`);
    return res.data;
  },

  processExit: async (employeeId: string, data: any) => {
    const res = await api.post(`/employees/${employeeId}/exit`, data);
    return res.data;
  },

  getOrgChart: async () => {
    const res = await api.get("/employees/org-chart");
    return res.data;
  },
};

