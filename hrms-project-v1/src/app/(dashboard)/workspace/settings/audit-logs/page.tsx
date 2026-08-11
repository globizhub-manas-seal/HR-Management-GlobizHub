"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Shield, Activity, MonitorSmartphone, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AuditLogsPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["auditLogs"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/audit`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    }
  });

  const getActionColor = (action: string) => {
    switch(action) {
      case 'CREATE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'DELETE': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'UPDATE': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'APPROVE': return 'bg-teal-100 text-teal-700 border-teal-200';
      case 'REJECT': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (isLoading) return <div className="p-8 text-slate-500">Loading security logs...</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-slate-900 rounded-lg text-white">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Security & Audit Logs</h1>
          <p className="text-slate-500 mt-1">Immutable trail of system activities and data modifications.</p>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
          <CardTitle className="text-lg flex items-center">
            <Activity className="w-4 h-4 mr-2" /> Recent System Activity
          </CardTitle>
          <CardDescription>Showing the last 50 events across the workspace.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target Entity</TableHead>
                <TableHead>Details / ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 py-12">No audit logs found.</TableCell>
                </TableRow>
              ) : (
                logs?.map((log: any) => (
                  <TableRow key={log.id} className="hover:bg-slate-50">
                    <TableCell className="text-xs text-slate-500">
                      {new Date(log.createdAt).toLocaleDateString()}{" "}
                      <span className="font-medium text-slate-700">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </TableCell>
                    
                    <TableCell>
                      {log.actor ? (
                        <div>
                          <p className="text-sm font-medium text-slate-900">{log.actor.firstName} {log.actor.lastName}</p>
                          <p className="text-xs text-slate-500">{log.actor.email}</p>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-slate-400 italic">System Auto-Action</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline" className={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="font-medium text-sm text-slate-700">
                      {log.entity}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded w-fit">
                          {log.entityId || "N/A"}
                        </span>
                        {/* If we have IP info, show it */}
                        {log.ipAddress && (
                          <span className="text-[10px] text-slate-400 mt-1 flex items-center">
                            <MonitorSmartphone className="w-3 h-3 mr-1" /> {log.ipAddress}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}