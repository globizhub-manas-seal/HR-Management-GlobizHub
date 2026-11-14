import api from "../api";

export interface AuditLog {
  id: string;
  companyId: string;
  actorId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  actor?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export const auditApi = {
  getLogs: async (params?: { limit?: number }): Promise<AuditLog[]> => {
    const res = await api.get("/audit", { params });
    return res.data;
  },
};

