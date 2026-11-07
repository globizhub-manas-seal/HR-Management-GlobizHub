import api from "../api";

export const payrollApi = {
  getMyPayslips: async (params?: any) => {
    const res = await api.get("/payroll/my-payslips", { params });
    return res.data;
  },

  getSettings: async () => {
    const res = await api.get("/payroll/settings");
    return res.data;
  },

  updateSettings: async (data: any) => {
    const res = await api.put("/payroll/settings", data);
    return res.data;
  },

  getSalaryStructure: async (employeeId: string) => {
    const res = await api.get(`/payroll/salary-structure/${employeeId}`);
    return res.data;
  },

  saveSalaryStructure: async (employeeId: string, data: any) => {
    const res = await api.post(`/payroll/salary-structure/${employeeId}`, data);
    return res.data;
  },
};

