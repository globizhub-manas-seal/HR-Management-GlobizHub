"use client";

import { useState, useRef } from "react";
import { employeesApi } from "@/lib/api";
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Search,
  Users,
  Download,
  X,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  parseEmployeeFile,
  ParsedEmployeeRow,
  ParseResult,
  downloadSampleCsvTemplate,
  downloadSampleExcelTemplate,
} from "@/lib/bulkEmployeeParser";

interface BulkImportEmployeesModalProps {
  onImportSuccess?: () => void;
}

interface ImportSummary {
  totalProcessed: number;
  importedCount: number;
  skippedCount: number;
  imported: Array<{ id: string; email: string; name: string }>;
  skipped: Array<{ email: string; reason: string }>;
}

export function BulkImportEmployeesModal({ onImportSuccess }: BulkImportEmployeesModalProps) {
  const [open, setOpen] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // File Inputs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parsed Preview State
  const [previewData, setPreviewData] = useState<ParseResult | null>(null);
  const [previewRows, setPreviewRows] = useState<ParsedEmployeeRow[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "VALID" | "INVALID">("ALL");

  // Post-Import Result State
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

  const resetState = () => {
    setPreviewData(null);
    setPreviewRows([]);
    setSearchFilter("");
    setStatusFilter("ALL");
    setParseError(null);
    setImportSummary(null);
    setIsParsing(false);
    setIsSubmitting(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetState();
    }
  };

  const handleFileProcess = async (file: File) => {
    setIsParsing(true);
    setParseError(null);
    setImportSummary(null);
    try {
      const result = await parseEmployeeFile(file);
      setPreviewData(result);
      setPreviewRows(result.rows);
      setSearchFilter("");
      setStatusFilter("ALL");
    } catch (err: any) {
      console.error("Failed to parse file:", err);
      setParseError(err.message || "Failed to parse the uploaded file.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const name = file.name.toLowerCase();
      if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")) {
        handleFileProcess(file);
      } else {
        setParseError("Please upload a valid Excel (.xlsx, .xls) or CSV (.csv) file.");
      }
    }
  };

  const handleRemoveRow = (rowId: string) => {
    setPreviewRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const validRows = previewRows.filter((r) => r.isValid);
  const invalidRows = previewRows.filter((r) => !r.isValid);

  const displayedRows = previewRows.filter((r) => {
    if (statusFilter === "VALID" && !r.isValid) return false;
    if (statusFilter === "INVALID" && r.isValid) return false;
    if (searchFilter.trim()) {
      const query = searchFilter.toLowerCase();
      return (
        r.firstName.toLowerCase().includes(query) ||
        r.lastName.toLowerCase().includes(query) ||
        r.email.toLowerCase().includes(query) ||
        r.department.toLowerCase().includes(query) ||
        r.designation.toLowerCase().includes(query) ||
        r.role.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handleExecuteImport = async () => {
    if (validRows.length === 0) return;
    setIsSubmitting(true);
    setParseError(null);

    try {
      const payload = validRows.map((r) => ({
        firstName: r.firstName || undefined,
        lastName: r.lastName || undefined,
        email: r.email,
        phone: r.phone || undefined,
        department: r.department || undefined,
        designation: r.designation || undefined,
        role: r.role || "EMPLOYEE",
      }));

      const res = await employeesApi.bulkImport(payload);
      setImportSummary(res);
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err: any) {
      console.error("Bulk import failed:", err);
      setParseError(
        err?.response?.data?.message || err.message || "Failed to process bulk import.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger className="inline-flex h-9 items-center justify-center rounded-[10px] border border-border bg-card px-3.5 text-[14px] font-medium whitespace-nowrap text-foreground transition-all hover:bg-muted/50 apple-shadow-sm active:scale-[0.98] cursor-pointer">
        <Upload className="mr-2 h-4 w-4 text-primary" />
        <span>Bulk Import</span>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6 rounded-2xl overflow-hidden bg-card border-border">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Users className="h-5 w-5 text-primary" />
            Bulk Import & Invite Employees
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Import multiple team members at once via CSV or Excel sheet. System auto-matches departments, validates emails, and dispatches onboarding invitations.
          </DialogDescription>
        </DialogHeader>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* PARSE / IMPORT ERROR */}
        {parseError && (
          <div className="shrink-0 my-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        {/* SUCCESS SUMMARY VIEW */}
        {importSummary ? (
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm">Bulk Import Processed</h4>
                  <p className="text-xs mt-0.5 opacity-90">
                    Successfully invited <strong>{importSummary.importedCount}</strong> employee(s) out of {importSummary.totalProcessed} processed.
                  </p>
                </div>
              </div>
            </div>

            {/* Skipped Details */}
            {importSummary.skippedCount > 0 && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2 mb-2 font-semibold text-xs">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span>Skipped Records ({importSummary.skippedCount})</span>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 text-xs">
                  {importSummary.skipped.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 border-b border-amber-500/10 last:border-0">
                      <span className="font-mono text-[11px]">{s.email}</span>
                      <span className="text-muted-foreground">{s.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Successfully Imported List */}
            {importSummary.importedCount > 0 && (
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border">
                  Invited Employees ({importSummary.importedCount})
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-border">
                  {importSummary.imported.map((emp) => (
                    <div key={emp.id} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-medium text-foreground">{emp.name}</p>
                        <p className="text-muted-foreground font-mono text-[11px]">{emp.email}</p>
                      </div>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                        Invitation Sent
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : previewData ? (
          /* PREVIEW TABLE VIEW */
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            {/* Filter & Metric Bar */}
            <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/30 p-3 rounded-xl border border-border">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={statusFilter === "ALL" ? "secondary" : "ghost"}
                  onClick={() => setStatusFilter("ALL")}
                  className="h-7 text-xs cursor-pointer"
                >
                  All ({previewRows.length})
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === "VALID" ? "secondary" : "ghost"}
                  onClick={() => setStatusFilter("VALID")}
                  className="h-7 text-xs text-emerald-600 cursor-pointer"
                >
                  Valid ({validRows.length})
                </Button>
                {invalidRows.length > 0 && (
                  <Button
                    size="sm"
                    variant={statusFilter === "INVALID" ? "secondary" : "ghost"}
                    onClick={() => setStatusFilter("INVALID")}
                    className="h-7 text-xs text-destructive cursor-pointer"
                  >
                    Invalid ({invalidRows.length})
                  </Button>
                )}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter rows..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="h-8 pl-8 text-xs bg-card"
                />
              </div>
            </div>

            {/* Scrollable Table */}
            <div className="flex-1 overflow-y-auto border border-border rounded-xl">
              <Table>
                <TableHeader className="bg-muted/40 sticky top-0 z-10 backdrop-blur-xs">
                  <TableRow>
                    <TableHead className="w-12 text-[11px]">Status</TableHead>
                    <TableHead className="text-[11px]">Name</TableHead>
                    <TableHead className="text-[11px]">Email</TableHead>
                    <TableHead className="text-[11px]">Department</TableHead>
                    <TableHead className="text-[11px]">Designation</TableHead>
                    <TableHead className="text-[11px]">Role</TableHead>
                    <TableHead className="w-10 text-[11px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                        No rows matching filter
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedRows.map((row) => (
                      <TableRow key={row.id} className={!row.isValid ? "bg-destructive/5" : ""}>
                        <TableCell>
                          {row.isValid ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <div title={row.validationError}>
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-xs">
                          {row.firstName} {row.lastName}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground">
                          {row.email}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {row.department || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {row.designation || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-mono capitalize">
                            {row.role.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive cursor-pointer"
                            onClick={() => handleRemoveRow(row.id)}
                            title="Remove row"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          /* INITIAL UPLOAD & TEMPLATE DOWNLOAD VIEW */
          <div className="flex-1 flex flex-col justify-center space-y-4 py-2">
            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[0.99]"
                  : "border-border/80 hover:border-primary/50 hover:bg-muted/30"
              }`}
            >
              <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                {isParsing ? (
                  <Loader2 className="h-7 w-7 animate-spin" />
                ) : (
                  <Upload className="h-7 w-7" />
                )}
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">
                  {isParsing ? "Analyzing file..." : "Click to upload or drag & drop"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supported formats: Excel (.xlsx, .xls) and CSV (.csv) up to 10MB
                </p>
              </div>
            </div>

            {/* Template Download Card */}
            <div className="bg-muted/30 border border-border rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Need the standard spreadsheet format?</h4>
                  <p className="text-[11px] text-muted-foreground">Download pre-formatted sample templates with standard columns.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs cursor-pointer gap-1.5"
                  onClick={downloadSampleCsvTemplate}
                >
                  <Download className="h-3.5 w-3.5" />
                  CSV
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs cursor-pointer gap-1.5"
                  onClick={downloadSampleExcelTemplate}
                >
                  <Download className="h-3.5 w-3.5" />
                  Excel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* DIALOG FOOTER */}
        <DialogFooter className="shrink-0 mt-3 flex items-center justify-between border-t border-border pt-3">
          {importSummary ? (
            <Button
              className="ml-auto cursor-pointer"
              onClick={() => handleOpenChange(false)}
            >
              Done
            </Button>
          ) : previewData ? (
            <div className="w-full flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetState}
                className="text-xs text-muted-foreground cursor-pointer"
                disabled={isSubmitting}
              >
                Choose another file
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenChange(false)}
                  disabled={isSubmitting}
                  className="cursor-pointer text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={validRows.length === 0 || isSubmitting}
                  onClick={handleExecuteImport}
                  className="cursor-pointer text-xs gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Importing ({validRows.length})...
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-3.5 w-3.5" />
                      Import & Invite ({validRows.length})
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
              className="ml-auto cursor-pointer text-xs"
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
