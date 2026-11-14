import api from "../api";

export interface Branch {
  id: string;
  name: string;
  address?: string;
}

export interface Department {
  id: string;
  name: string;
  branchId?: string;
  branch?: Branch;
}

export interface Role {
  id: string;
  name: string;
  departmentId?: string;
  department?: Department;
}

export const organizationApi = {
  // Branches
  getBranches: async (): Promise<Branch[]> => {
    const res = await api.get("/organization/branches");
    return res.data;
  },
  createBranch: async (data: {
    name: string;
    address?: string;
  }): Promise<Branch> => {
    const res = await api.post("/organization/branches", data);
    return res.data;
  },
  deleteBranch: async (id: string): Promise<any> => {
    const res = await api.delete(`/organization/branches/${id}`);
    return res.data;
  },

  // Departments
  getDepartments: async (): Promise<Department[]> => {
    const res = await api.get("/organization/departments");
    return res.data;
  },
  createDepartment: async (data: {
    name: string;
    branchId?: string;
  }): Promise<Department> => {
    const res = await api.post("/organization/departments", data);
    return res.data;
  },
  deleteDepartment: async (id: string): Promise<any> => {
    const res = await api.delete(`/organization/departments/${id}`);
    return res.data;
  },

  // Roles
  getRoles: async (): Promise<Role[]> => {
    const res = await api.get("/organization/roles");
    return res.data;
  },
  createRole: async (data: {
    name: string;
    departmentId?: string;
  }): Promise<Role> => {
    const res = await api.post("/organization/roles", data);
    return res.data;
  },
  deleteRole: async (id: string): Promise<any> => {
    const res = await api.delete(`/organization/roles/${id}`);
    return res.data;
  },

  // Subscription & Billing (Tenant Self-Service)
  getSubscriptionOverview: async (): Promise<any> => {
    const res = await api.get("/organization/subscription");
    return res.data;
  },
  getInvoices: async (): Promise<any[]> => {
    const res = await api.get("/organization/billing/invoices");
    return res.data;
  },
  getInvoiceById: async (id: string): Promise<any> => {
    const res = await api.get(`/organization/billing/invoices/${id}`);
    return res.data;
  },
};

