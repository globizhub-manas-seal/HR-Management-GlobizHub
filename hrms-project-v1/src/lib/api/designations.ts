import api from "../api";
import type { Designation } from "@/lib/permissions";

export interface CreateDesignationInput {
  name: string;
  description?: string;
  baseRole?: string;
  color?: string;
  sidebarModules?: string[];
  modulePermissions?: Record<string, string[]>;
  dashboardWidgets?: string[];
}

export interface UpdateDesignationInput {
  name?: string;
  description?: string;
  color?: string;
  baseRole?: string;
}

export interface UpdateDesignationPermissionsInput {
  sidebarModules?: string[];
  modulePermissions?: Record<string, string[]>;
  dashboardWidgets?: string[];
}

export const designationsApi = {
  getAll: async (): Promise<Designation[]> => {
    const res = await api.get("/organization/designations");
    return res.data;
  },

  getById: async (
    id: string
  ): Promise<
    Designation & {
      employees?: any[];
      jobRequisitionsCount?: number;
      manpowerRequisitionsCount?: number;
    }
  > => {
    const res = await api.get(`/organization/designations/${id}`);
    return res.data;
  },

  create: async (data: CreateDesignationInput): Promise<Designation> => {
    const res = await api.post("/organization/designations", data);
    return res.data;
  },

  update: async (
    id: string,
    data: UpdateDesignationInput
  ): Promise<Designation> => {
    const res = await api.patch(`/organization/designations/${id}`, data);
    return res.data;
  },

  updatePermissions: async (
    id: string,
    data: UpdateDesignationPermissionsInput
  ): Promise<Designation> => {
    const res = await api.patch(
      `/organization/designations/${id}/permissions`,
      data
    );
    return res.data;
  },

  delete: async (id: string): Promise<any> => {
    const res = await api.delete(`/organization/designations/${id}`);
    return res.data;
  },
};

