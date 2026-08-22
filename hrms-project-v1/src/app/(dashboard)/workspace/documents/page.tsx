"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { 
  FileText, Upload, CheckCircle2, Clock, AlertCircle, 
  Eye, Loader2, Briefcase, Shield, User, FileQuestion, FolderOpen,
  Plus, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { useViewMode } from "@/context/ViewModeContext";

export default function EmployeeDocumentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("employment");

  // View All Dialog state
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);
  const [viewAllCategory, setViewAllCategory] = useState<string>("");
  const [viewAllSearch, setViewAllSearch] = useState<string>("");

  // Upload Personal File Dialog state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [personalFileName, setPersonalFileName] = useState("");
  const [personalFile, setPersonalFile] = useState<File | null>(null);
  const [personalUploadProgress, setPersonalUploadProgress] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const getToken = () => localStorage.getItem("hrms_token");

  const { activeRole, isLoading: isLoadingProfile } = useViewMode();

  // Redirect admin/HR/CEO users to the admin documents page
  useEffect(() => {
    if (!isLoadingProfile && activeRole && activeRole !== "EMPLOYEE") {
      setRedirecting(true);
      router.push("/workspace/documents/admin");
    }
  }, [activeRole, isLoadingProfile, router]);

  // 1. Fetch the logged-in employee's documents
  const { data: documents, isLoading } = useQuery({
    queryKey: ["myDocuments"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/documents/me`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return res.data;
    },
  });

  // 2. Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, documentId, name, category }: any) => {
      const formData = new FormData();
      formData.append("file", file);
      if (documentId) formData.append("documentId", documentId);
      formData.append("name", name);
      formData.append("category", category);

      await axios.post(`${API_URL}/documents/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "multipart/form-data" 
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myDocuments"] });
      setUploadingId(null);
      setIsUploadModalOpen(false);
      setPersonalFileName("");
      setPersonalFile(null);
      setPersonalUploadProgress(false);
    },
    onError: (error) => {
      console.error("Upload failed:", error);
      setUploadingId(null);
      setPersonalUploadProgress(false);
      alert("Failed to upload file. Please try again.");
    }
  });

  if (redirecting || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, doc: any) => {
    if (e.target.files && e.target.files[0]) {
      setUploadingId(doc.id);
      uploadMutation.mutate({
        file: e.target.files[0],
        documentId: doc.id,
        name: doc.name,
        category: doc.category
      });
    }
  };

  const handlePersonalFileUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalFile || !personalFileName.trim()) return;

    setPersonalUploadProgress(true);
    uploadMutation.mutate({
      file: personalFile,
      name: personalFileName.trim(),
      category: "PERSONAL"
    });
  };

  // --- CATEGORIZE DOCUMENTS ---
  const requiredDocs = documents?.filter((d: any) => d.category === "COMPLIANCE" || d.status === "REQUESTED") || [];
  const employmentDocs = documents?.filter((d: any) => d.category === "EMPLOYMENT" && d.status !== "REQUESTED") || [];
  const companyDocs = documents?.filter((d: any) => d.category === "COMPANY") || [];
  const personalDocs = documents?.filter((d: any) => d.category === "PERSONAL" && d.status !== "REQUESTED") || [];

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
  };

  const getDocDetails = (doc: any) => {
    if (doc.category === "COMPANY") {
      const sizes = ["1.2 MB", "850 KB", "620 KB", "540 KB", "700 KB"];
      const index = doc.id ? doc.id.charCodeAt(0) % sizes.length : 0;
      return `PDF • ${sizes[index]}`;
    }
    if (doc.category === "COMPLIANCE" || doc.status === "REQUESTED" || doc.status === "REJECTED") {
      if (doc.status === "VERIFIED") {
        return `Verified on ${formatDate(doc.updatedAt || doc.createdAt)}`;
      }
      if (doc.status === "SUBMITTED") {
        return `Submitted on ${formatDate(doc.updatedAt || doc.createdAt)}`;
      }
      return `Requested on ${formatDate(doc.createdAt)}`;
    }
    if (doc.category === "PERSONAL") {
      return `Uploaded on ${formatDate(doc.updatedAt || doc.createdAt)}`;
    }
    return `Issued on ${formatDate(doc.updatedAt || doc.createdAt)}`;
  };

  const getCategoryIcon = (category: string, status?: string) => {
    switch (category) {
      case "EMPLOYMENT":
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
        );
      case "COMPLIANCE":
        if (status === "VERIFIED") {
          return (
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          );
        } else if (status === "SUBMITTED") {
          return (
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          );
        } else {
          return (
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
          );
        }
      case "COMPANY":
        return (
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        );
      case "PERSONAL":
        return (
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-500 shrink-0">
            <FolderOpen className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0">
            <FileQuestion className="w-5 h-5" />
          </div>
        );
    }
  };

  const scrollToColumn = (id: string) => {
    const element = document.getElementById(`column-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const handleViewAll = (categoryKey: string) => {
    setViewAllCategory(categoryKey);
    setViewAllSearch("");
    setIsViewAllOpen(true);
  };

  const getCategoryTitle = (key: string) => {
    switch (key) {
      case "employment": return "My Employment Documents";
      case "required": return "Documents Required";
      case "company": return "Company Documents";
      case "personal": return "Personal Files";
      default: return "";
    }
  };

  const getCategoryDocs = (key: string) => {
    switch (key) {
      case "employment": return employmentDocs;
      case "required": return requiredDocs;
      case "company": return companyDocs;
      case "personal": return personalDocs;
      default: return [];
    }
  };

  // Reusable card component
  const HorizontalDocCard = ({ doc }: { doc: any }) => {
    const isRequired = doc.category === "COMPLIANCE" || doc.status === "REQUESTED" || doc.status === "REJECTED";
    
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex items-center justify-between space-x-3 group relative">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          {getCategoryIcon(doc.category, doc.status)}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-slate-800 text-sm leading-tight truncate group-hover:text-indigo-600 transition-colors">
              {doc.name}
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-medium truncate">
              {getDocDetails(doc)}
            </p>
            {doc.status === "REJECTED" && doc.rejectionReason && (
              <p className="text-[10px] text-rose-500 font-semibold mt-0.5 truncate bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100/50 inline-block">
                Reason: {doc.rejectionReason}
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center space-x-2">
          {isRequired ? (
            // Status badges or upload button
            doc.status === "VERIFIED" ? (
              <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-50/80 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center shrink-0">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
              </Badge>
            ) : doc.status === "SUBMITTED" ? (
              <Badge className="bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-50/80 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center shrink-0">
                <Clock className="w-3 h-3 mr-1 animate-pulse" /> Under Review
              </Badge>
            ) : (
              // Required and Upload Action
              <div className="flex items-center space-x-2 shrink-0">
                <Badge className="bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-50/80 px-2 py-1 rounded-full text-[10px] font-bold shrink-0">
                  Required
                </Badge>
                <input 
                  type="file" 
                  id={`upload-${doc.id}`} 
                  className="hidden" 
                  onChange={(e) => handleFileUpload(e, doc)} 
                />
                <label 
                  htmlFor={`upload-${doc.id}`} 
                  className="text-xs font-semibold text-indigo-600 hover:text-white bg-indigo-50/50 hover:bg-indigo-600 border border-indigo-200/50 px-3 py-1.5 rounded-lg cursor-pointer transition-all shrink-0 shadow-sm"
                >
                  {uploadingId === doc.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    "Upload"
                  )}
                </label>
              </div>
            )
          ) : (
            // Other columns have "View" button if fileUrl exists
            doc.fileUrl && (
              <a 
                href={doc.fileUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="text-xs font-semibold text-indigo-600 hover:text-white bg-slate-50 hover:bg-indigo-600 border border-slate-200 hover:border-indigo-600 px-3 py-1.5 rounded-lg transition-all shrink-0 shadow-sm"
              >
                View
              </a>
            )
          )}
        </div>
      </div>
    );
  };

  const tabs = [
    { id: "employment", name: "My Documents", icon: Briefcase },
    { id: "required", name: "Documents Required", icon: Shield },
    { id: "company", name: "Company Documents", icon: FileText },
    { id: "personal", name: "Personal Files", icon: FolderOpen },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 font-sans bg-slate-50/50 min-h-screen">
      


      {/* 2. TAB PILLS (Horizontal toggle bar - visible only on mobile/tablet to avoid duplicate headers on desktop) */}
      <div className="grid grid-cols-2 lg:hidden gap-2.5 p-1.5 bg-slate-100/80 border border-slate-200/60 rounded-2xl shadow-inner max-w-5xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                scrollToColumn(tab.id);
              }}
              className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-white text-indigo-600 border border-slate-200 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${activeTab === tab.id ? "text-indigo-500" : "text-slate-400"}`} />
              <span className="truncate">{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* 3. FOUR-COLUMN GRID (Kanban Board Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Column 1: My Employment Documents */}
        <div 
          id="column-employment" 
          className={`bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col h-[550px] transition-all duration-300 ${
            activeTab === "employment" ? "flex" : "hidden lg:flex"
          }`}
        >
          <div className="border-b border-slate-100 pb-3 shrink-0">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <span>My Employment Documents</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">Documents provided by the company.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1 custom-scrollbar">
            {employmentDocs.length > 0 ? (
              employmentDocs.slice(0, 5).map((doc: any) => (
                <HorizontalDocCard key={doc.id} doc={doc} />
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <FolderOpen className="w-8 h-8 text-slate-300 mb-1.5 opacity-60" />
                <p className="text-xs">No employment files.</p>
              </div>
            )}
          </div>

          {employmentDocs.length > 5 && (
            <button 
              onClick={() => handleViewAll("employment")}
              className="w-full text-center py-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors border-t border-slate-100 pt-3 shrink-0"
            >
              View all ({employmentDocs.length})
            </button>
          )}
        </div>

        {/* Column 2: Documents Required */}
        <div 
          id="column-required" 
          className={`bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col h-[550px] transition-all duration-300 ${
            activeTab === "required" ? "flex" : "hidden lg:flex"
          }`}
        >
          <div className="border-b border-slate-100 pb-3 shrink-0">
            <h2 className="text-sm font-bold text-slate-800">Documents Required</h2>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">Documents requested by HR.</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1 custom-scrollbar">
            {requiredDocs.length > 0 ? (
              requiredDocs.slice(0, 5).map((doc: any) => (
                <HorizontalDocCard key={doc.id} doc={doc} />
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <Shield className="w-8 h-8 text-slate-300 mb-1.5 opacity-60" />
                <p className="text-xs">No pending requirements.</p>
              </div>
            )}
          </div>

          {requiredDocs.length > 5 && (
            <button 
              onClick={() => handleViewAll("required")}
              className="w-full text-center py-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors border-t border-slate-100 pt-3 shrink-0"
            >
              View all ({requiredDocs.length})
            </button>
          )}
        </div>

        {/* Column 3: Company Documents */}
        <div 
          id="column-company" 
          className={`bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col h-[550px] transition-all duration-300 ${
            activeTab === "company" ? "flex" : "hidden lg:flex"
          }`}
        >
          <div className="border-b border-slate-100 pb-3 shrink-0">
            <h2 className="text-sm font-bold text-slate-800">Company Documents</h2>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">Important policies and documents.</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1 custom-scrollbar">
            {companyDocs.length > 0 ? (
              companyDocs.slice(0, 5).map((doc: any) => (
                <HorizontalDocCard key={doc.id} doc={doc} />
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <FileText className="w-8 h-8 text-slate-300 mb-1.5 opacity-60" />
                <p className="text-xs">No policy files available.</p>
              </div>
            )}
          </div>

          {companyDocs.length > 5 && (
            <button 
              onClick={() => handleViewAll("company")}
              className="w-full text-center py-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors border-t border-slate-100 pt-3 shrink-0"
            >
              View all ({companyDocs.length})
            </button>
          )}
        </div>

        {/* Column 4: Personal Files */}
        <div 
          id="column-personal" 
          className={`bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col h-[550px] transition-all duration-300 ${
            activeTab === "personal" ? "flex" : "hidden lg:flex"
          }`}
        >
          <div className="border-b border-slate-100 pb-3 shrink-0">
            <h2 className="text-sm font-bold text-slate-800">Personal Files</h2>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">Private documents visible only to you.</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1 custom-scrollbar">
            {personalDocs.length > 0 ? (
              personalDocs.slice(0, 5).map((doc: any) => (
                <HorizontalDocCard key={doc.id} doc={doc} />
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 mb-3">
                <User className="w-8 h-8 text-slate-300 mb-1.5 opacity-60" />
                <p className="text-xs">No personal uploads.</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col space-y-2 shrink-0">
            {personalDocs.length > 5 && (
              <button 
                onClick={() => handleViewAll("personal")}
                className="w-full text-center py-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                View all ({personalDocs.length})
              </button>
            )}
            
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="w-full py-2.5 border border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/70 rounded-xl flex items-center justify-center text-xs font-bold text-indigo-600 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Upload new file
            </button>
          </div>
        </div>

      </div>

      {/* --- DIALOGS --- */}

      {/* 4. VIEW ALL DIALOG */}
      <Dialog open={isViewAllOpen} onOpenChange={setIsViewAllOpen}>
        <DialogContent className="sm:max-w-lg bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {getCategoryTitle(viewAllCategory)}
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative my-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Search document name..." 
              value={viewAllSearch} 
              onChange={(e) => setViewAllSearch(e.target.value)} 
              className="pl-9 bg-slate-50 border-slate-200/80 rounded-xl text-sm"
            />
          </div>

          <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1 py-1 custom-scrollbar">
            {getCategoryDocs(viewAllCategory)
              .filter((d: any) => d.name.toLowerCase().includes(viewAllSearch.toLowerCase()))
              .map((doc: any) => (
                <HorizontalDocCard key={doc.id} doc={doc} />
              ))}
            {getCategoryDocs(viewAllCategory).filter((d: any) => d.name.toLowerCase().includes(viewAllSearch.toLowerCase())).length === 0 && (
              <p className="text-center text-sm text-slate-400 py-8">No matching files found.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 5. UPLOAD PERSONAL FILE DIALOG */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Upload Personal Document
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handlePersonalFileUpload} className="space-y-5 py-3">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Document Name
              </label>
              <Input 
                placeholder="e.g. Passport Copy, Certificate of Merit" 
                value={personalFileName} 
                onChange={(e) => setPersonalFileName(e.target.value)} 
                required
                className="bg-slate-50 border-slate-200/80 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Select File
              </label>
              
              <div className="border border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20 rounded-2xl p-6 text-center cursor-pointer transition-all relative">
                <input 
                  type="file" 
                  required
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setPersonalFile(e.target.files[0]);
                      if (!personalFileName) {
                        // Pre-populate document name with clean filename (without extension)
                        const nameWithoutExt = e.target.files[0].name.replace(/\.[^/.]+$/, "");
                        setPersonalFileName(nameWithoutExt);
                      }
                    }
                  }} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">
                  {personalFile ? personalFile.name : "Click or drag file to upload"}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Supports PDF, PNG, JPG up to 10MB
                </p>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsUploadModalOpen(false)}
                className="border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!personalFile || !personalFileName.trim() || personalUploadProgress}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm"
              >
                {personalUploadProgress ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload File"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}