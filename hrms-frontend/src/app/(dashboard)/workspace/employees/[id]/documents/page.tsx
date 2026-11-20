"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsApi } from "@/lib/api";
import { 
  FileText, CheckCircle2, AlertCircle, Clock, 
  Plus, XCircle, ShieldCheck, FileSignature, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function AdminEmployeeDocumentsPage() {
  const params = useParams();
  const employeeId = params.id as string;
  const queryClient = useQueryClient();

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({ name: "", category: "COMPLIANCE" });

  // Rejection modal state
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectDocId, setRejectDocId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // 1. Fetch this specific employee's documents
  const { data: documents, isLoading } = useQuery({
    queryKey: ["employeeDocuments", employeeId],
    queryFn: () => documentsApi.getEmployeeDocuments(employeeId),
  });

  // 2. Mutation: Request a new document
  const requestMutation = useMutation({
    mutationFn: (payload: typeof requestForm) =>
      documentsApi.requestDocument({ ...payload, employeeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeDocuments", employeeId] });
      setIsRequestModalOpen(false);
      setRequestForm({ name: "", category: "COMPLIANCE" });
    }
  });

  // 3. Mutation: Verify or Reject a document
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string, status: string, reason?: string }) =>
      documentsApi.updateStatus(id, { status, rejectionReason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeDocuments", employeeId] });
      setIsRejectModalOpen(false);
      setRejectDocId(null);
      setRejectionReason("");
    }
  });

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>;

  const complianceDocs = documents?.filter((d: any) => d.category === "COMPLIANCE") || [];
  const employmentDocs = documents?.filter((d: any) => d.category === "EMPLOYMENT") || [];

  const getStatusBadge = (status: string, reason?: string) => {
    switch(status) {
      case "VERIFIED": return <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3 mr-1"/> Verified</Badge>;
      case "SUBMITTED": return <Badge className="bg-amber-100 text-amber-700"><Clock className="w-3 h-3 mr-1"/> Needs Review</Badge>;
      case "REJECTED": return (
        <div className="flex flex-col items-start gap-1">
          <Badge className="bg-rose-100 text-rose-700"><XCircle className="w-3 h-3 mr-1"/> Rejected</Badge>
          {reason && <span className="text-[11px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">Reason: {reason}</span>}
        </div>
      );
      case "REQUESTED": return <Badge className="bg-slate-100 text-slate-600"><AlertCircle className="w-3 h-3 mr-1"/> Pending Upload</Badge>;
      default: return null;
    }
  };

  // Reusable component for the document list rows
  const DocumentRow = ({ doc }: { doc: any }) => (
    <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-shadow">
      <div className="flex items-center space-x-4">
        <div className="p-2 bg-slate-50 rounded-lg">
          <FileText className="w-5 h-5 text-slate-400" />
        </div>
        <div>
          <h4 className="font-semibold text-slate-900 text-sm">{doc.name}</h4>
          <div className="mt-1">{getStatusBadge(doc.status, doc.rejectionReason)}</div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {/* Only show View if a file actually exists (not just requested) */}
        {doc.fileUrl && (
          <Button asChild variant="outline" size="sm" className="text-indigo-600 hover:text-indigo-700">
            <a href={doc.fileUrl} target="_blank" rel="noreferrer">View File</a>
          </Button>
        )}

        {/* HR Approval Workflow Buttons - Only show if SUBMITTED */}
        {doc.status === "SUBMITTED" && (
          <>
            <Button 
              size="sm" 
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={() => updateStatusMutation.mutate({ id: doc.id, status: "VERIFIED" })}
              disabled={updateStatusMutation.isPending}
            >
              Approve
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-rose-200 text-rose-600 hover:bg-rose-50"
              onClick={() => {
                setRejectDocId(doc.id);
                setRejectionReason("");
                setIsRejectModalOpen(true);
              }}
              disabled={updateStatusMutation.isPending}
            >
              Reject
            </Button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 font-sans">
      
      {/* HEADER & ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Document Management</h1>
          <p className="text-sm text-slate-500 mt-1">Review uploads, verify identities, and request new paperwork.</p>
        </div>
        
        <Button 
          onClick={() => setIsRequestModalOpen(true)} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Request Document
        </Button>

        <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Document from Employee</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Document Name</label>
                <Input 
                  placeholder="e.g., Aadhar Card, Degree Certificate" 
                  value={requestForm.name} 
                  onChange={(e) => setRequestForm({...requestForm, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Category</label>
                <select 
                  className="w-full border rounded-md p-2 mt-1 text-sm bg-white"
                  value={requestForm.category}
                  onChange={(e) => setRequestForm({...requestForm, category: e.target.value})}
                >
                  <option value="COMPLIANCE">Identity & Compliance</option>
                  <option value="EMPLOYMENT">Employment Record</option>
                </select>
              </div>
              <Button 
                onClick={() => requestMutation.mutate(requestForm)} 
                disabled={!requestForm.name || requestMutation.isPending} 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white"
              >
                {requestMutation.isPending ? "Sending Request..." : "Send Request to Employee"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* REJECT REASON MODAL */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-slate-600">
              Please provide a reason for rejecting this document so the employee knows what to fix.
            </p>
            <Input
              placeholder="e.g. Document image is blurry, expired ID, etc."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex justify-end space-x-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsRejectModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={!rejectionReason.trim() || updateStatusMutation.isPending}
                onClick={() => {
                  if (rejectDocId) {
                    updateStatusMutation.mutate({
                      id: rejectDocId,
                      status: "REJECTED",
                      reason: rejectionReason,
                    });
                  }
                }}
              >
                {updateStatusMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* COMPLIANCE SECTION */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <CardTitle className="text-lg flex items-center text-slate-800">
            <ShieldCheck className="w-5 h-5 mr-2 text-indigo-500" /> Identity & Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3 bg-slate-50/50">
          {complianceDocs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No compliance documents tracked yet.</p>
          ) : (
            complianceDocs.map((doc: any) => <DocumentRow key={doc.id} doc={doc} />)
          )}
        </CardContent>
      </Card>

      {/* EMPLOYMENT SECTION */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <CardTitle className="text-lg flex items-center text-slate-800">
            <FileSignature className="w-5 h-5 mr-2 text-emerald-500" /> Employment Records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3 bg-slate-50/50">
          {employmentDocs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No employment records tracked yet.</p>
          ) : (
            employmentDocs.map((doc: any) => <DocumentRow key={doc.id} doc={doc} />)
          )}
        </CardContent>
      </Card>

    </div>
  );
}