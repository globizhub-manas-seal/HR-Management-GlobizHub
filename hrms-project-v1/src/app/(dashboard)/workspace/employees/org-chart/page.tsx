"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { employeesApi } from "@/lib/api";
import {
  Network,
  Users,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronDown,
  ChevronRight,
  User,
  Mail,
  Building,
  Shield,
  ArrowLeft,
  Loader2,
  Layers,
  ListTree,
  Filter,
  ExternalLink,
  Crown,
  Briefcase,
  UserCheck,
  UserPlus,
  GitBranch,
  Info,
  CheckCircle2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface OrgNode {
  id: string;
  employeeCode: string | null;
  name: string;
  email: string;
  role: string;
  profilePhoto: string | null;
  department: string | null;
  designation: string | null;
  designationColor: string | null;
  depth: number;
  directReportsCount: number;
  totalSubordinatesCount: number;
  children: OrgNode[];
}

interface OrgChartData {
  roots: OrgNode[];
  totalEmployees: number;
}

export default function OrgChartPage() {
  const queryClient = useQueryClient();
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"tree" | "list">("tree");
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);

  // Manager assignment state in drawer
  const [assigningManager, setAssigningManager] = useState(false);
  const [targetManagerId, setTargetManagerId] = useState<string>("");
  const [updateFeedback, setUpdateFeedback] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<OrgChartData>({
    queryKey: ["orgChartHierarchy"],
    queryFn: () => employeesApi.getOrgChart(),
  });

  // Fetch all employees for manager assignment dropdown
  const { data: allEmployees } = useQuery({
    queryKey: ["allEmployeesLookup"],
    queryFn: () => employeesApi.getAll(),
  });

  // Mutation: Update reporting manager
  const updateManagerMutation = useMutation({
    mutationFn: async ({ employeeId, managerId }: { employeeId: string; managerId: string | null }) => {
      return employeesApi.update(employeeId, {
        reportingManagerId: managerId === "none" || !managerId ? null : managerId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgChartHierarchy"] });
      setUpdateFeedback("Reporting line updated successfully!");
      setAssigningManager(false);
      setTimeout(() => {
        setUpdateFeedback(null);
        setSelectedNode(null);
      }, 1500);
    },
    onError: (err: any) => {
      setUpdateFeedback(err?.response?.data?.message || "Failed to update reporting manager");
    },
  });

  // Extract all unique departments for filter dropdown
  const departments = useMemo(() => {
    if (!data?.roots) return [];
    const depts = new Set<string>();
    const traverse = (node: OrgNode) => {
      if (node.department) depts.add(node.department);
      node.children?.forEach(traverse);
    };
    data.roots.forEach(traverse);
    return Array.from(depts).sort();
  }, [data]);

  // Compute maximum tree depth across the organization
  const maxDepth = useMemo(() => {
    if (!data?.roots?.length) return 0;
    let max = 1;
    const traverse = (node: OrgNode) => {
      if (node.depth > max) max = node.depth;
      node.children?.forEach(traverse);
    };
    data.roots.forEach(traverse);
    return max;
  }, [data]);

  // Toggle collapse state for an individual node
  const toggleCollapse = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Expand all nodes
  const expandAll = () => {
    setCollapsedNodes(new Set());
  };

  // Collapse all nodes having children
  const collapseAll = () => {
    if (!data?.roots) return;
    const allParentIds = new Set<string>();
    const traverse = (node: OrgNode) => {
      if (node.children?.length > 0) {
        allParentIds.add(node.id);
        node.children.forEach(traverse);
      }
    };
    data.roots.forEach(traverse);
    setCollapsedNodes(allParentIds);
  };

  const hasActiveFilter = Boolean(searchTerm.trim() || selectedDept !== "ALL");

  // Check if a node matches current search / department filter
  const matchesFilter = (node: OrgNode): boolean => {
    if (!hasActiveFilter) return false;
    if (selectedDept !== "ALL" && node.department !== selectedDept) {
      return false;
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = node.name.toLowerCase().includes(term);
      const matchEmail = node.email.toLowerCase().includes(term);
      const matchDesignation = node.designation?.toLowerCase().includes(term);
      const matchDept = node.department?.toLowerCase().includes(term);
      const matchCode = node.employeeCode?.toLowerCase().includes(term);
      return Boolean(matchName || matchEmail || matchDesignation || matchDept || matchCode);
    }
    return true;
  };

  // Check if subtree contains any matches
  const subtreeHasMatch = (node: OrgNode): boolean => {
    if (!hasActiveFilter) return true;
    if (matchesFilter(node)) return true;
    return node.children?.some(subtreeHasMatch) || false;
  };

  return (
    <div className="space-y-5 max-w-full pb-16 px-8 py-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
            <Link
              href="/workspace/employees"
              className="hover:text-primary transition-colors flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="h-3 w-3" />
              Employees
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Org Chart</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Network className="h-6 w-6 text-primary" />
            Organizational Hierarchy
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Interactive organizational structure, leadership trees, and reporting lines.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/workspace/employees">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs rounded-xl cursor-pointer">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              Directory View
            </Button>
          </Link>
        </div>
      </div>

      {/* Sleek Compact Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-card border border-border/70 rounded-xl p-3 flex items-center gap-3 shadow-xs">
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total Staff</p>
            <p className="text-base font-bold text-foreground tabular-nums leading-tight">
              {data?.totalEmployees ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-card border border-border/70 rounded-xl p-3 flex items-center gap-3 shadow-xs">
          <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Crown className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Executive Roots</p>
            <p className="text-base font-bold text-foreground tabular-nums leading-tight">
              {data?.roots?.length ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-card border border-border/70 rounded-xl p-3 flex items-center gap-3 shadow-xs">
          <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Max Depth</p>
            <p className="text-base font-bold text-foreground tabular-nums leading-tight">
              {maxDepth} {maxDepth === 1 ? "Level" : "Levels"}
            </p>
          </div>
        </div>

        <div className="bg-card border border-border/70 rounded-xl p-3 flex items-center gap-3 shadow-xs">
          <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Building className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Departments</p>
            <p className="text-base font-bold text-foreground tabular-nums leading-tight">
              {departments.length}
            </p>
          </div>
        </div>
      </div>

      {/* Multiple Roots Information Banner */}
      {data?.roots && data.roots.length > 1 && (
        <div className="p-3 rounded-xl border border-border/70 bg-card/60 backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary shrink-0" />
            <span>
              <strong>{data.roots.length} top-level members</strong> currently have no reporting manager assigned. Click on any member to assign their reporting manager and build vertical branches.
            </span>
          </div>
        </div>
      )}

      {/* Control & Toolbar */}
      <div className="bg-card border border-border/80 rounded-xl p-2.5 sm:p-3 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/70" />
            <Input
              placeholder="Filter by name, ID, or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 pl-8 text-xs bg-muted/20 border-border/80 rounded-lg"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-border/80 bg-muted/20 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer w-full sm:w-44"
          >
            <option value="ALL">All Departments ({departments.length})</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* View toggles & actions */}
        <div className="flex flex-wrap items-center gap-1.5 self-end md:self-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-muted/30 p-0.5 rounded-lg border border-border/80">
            <button
              onClick={() => setViewMode("tree")}
              className={`h-7 px-2.5 text-xs rounded-md font-medium transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === "tree"
                  ? "bg-card text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Network className="h-3 w-3" />
              <span>Tree</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`h-7 px-2.5 text-xs rounded-md font-medium transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === "list"
                  ? "bg-card text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ListTree className="h-3 w-3" />
              <span>Outline</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={expandAll}
            className="h-7 px-2.5 text-xs rounded-lg cursor-pointer text-muted-foreground hover:text-foreground"
          >
            Expand
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={collapseAll}
            className="h-7 px-2.5 text-xs rounded-lg cursor-pointer text-muted-foreground hover:text-foreground"
          >
            Collapse
          </Button>

          {/* Zoom controls */}
          {viewMode === "tree" && (
            <div className="flex items-center bg-muted/30 p-0.5 rounded-lg border border-border/80">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                className="h-6 w-6 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <span className="text-[10px] font-mono px-1.5 text-muted-foreground tabular-nums">
                {zoomLevel}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                className="h-6 w-6 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoomLevel(100)}
                className="h-6 w-6 cursor-pointer"
                title="Reset Zoom"
              >
                <Maximize2 className="h-2.5 w-2.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Visual Canvas */}
      {isLoading ? (
        <div className="bg-card border border-border/80 rounded-2xl p-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground">Loading organizational hierarchy...</p>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-6 text-center text-xs">
          Failed to load organizational chart. Please refresh the page.
        </div>
      ) : !data?.roots?.length ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center space-y-2">
          <Users className="h-8 w-8 text-muted-foreground mx-auto" />
          <h3 className="text-sm font-semibold text-foreground">No active employees found</h3>
          <p className="text-xs text-muted-foreground">Add and activate employees in the directory to render the hierarchy.</p>
        </div>
      ) : viewMode === "tree" ? (
        /* CANVAS VIEW WITH SUBTLE GRID PATTERN */
        <div
          className="rounded-2xl border border-border/80 p-8 md:p-12 overflow-x-auto min-h-[560px] relative shadow-xs bg-muted/15"
          style={{
            backgroundImage: "radial-gradient(circle, var(--border) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        >
          <div
            className="flex justify-center transition-transform duration-200 origin-top min-w-max pb-16"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            <div className="flex gap-10 sm:gap-14 items-start justify-center">
              {data.roots.map((root) => (
                <TreeNodeComponent
                  key={root.id}
                  node={root}
                  collapsedNodes={collapsedNodes}
                  onToggleCollapse={toggleCollapse}
                  hasActiveFilter={hasActiveFilter}
                  matchesFilter={matchesFilter}
                  subtreeHasMatch={subtreeHasMatch}
                  onSelectNode={setSelectedNode}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* OUTLINE / LIST VIEW */
        <div className="bg-card border border-border/80 rounded-xl divide-y divide-border overflow-hidden shadow-xs">
          <div className="bg-muted/30 px-4 py-2.5 text-xs font-semibold text-muted-foreground flex items-center justify-between">
            <span>Organizational Tree</span>
            <span>Reports & Level</span>
          </div>
          <div className="p-2 divide-y divide-border/50">
            {data.roots.map((root) => (
              <ListRowComponent
                key={root.id}
                node={root}
                level={0}
                collapsedNodes={collapsedNodes}
                onToggleCollapse={toggleCollapse}
                hasActiveFilter={hasActiveFilter}
                matchesFilter={matchesFilter}
                subtreeHasMatch={subtreeHasMatch}
                onSelectNode={setSelectedNode}
              />
            ))}
          </div>
        </div>
      )}

      {/* QUICK DRAWER / DETAILS MODAL */}
      {selectedNode && (
        <div
          className="fixed inset-0 z-50 bg-background/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => {
            setSelectedNode(null);
            setAssigningManager(false);
            setUpdateFeedback(null);
          }}
        >
          <div
            className="bg-card border border-border rounded-2xl max-w-md w-full p-5 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="size-12 border border-border">
                  {selectedNode.profilePhoto ? (
                    <AvatarImage src={selectedNode.profilePhoto} alt={selectedNode.name} />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                      {selectedNode.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h3 className="font-bold text-base text-foreground capitalize">
                    {selectedNode.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedNode.designation || "Staff Member"}
                  </p>
                  {selectedNode.employeeCode && (
                    <span className="font-mono text-[10px] text-muted-foreground/70">
                      ID: {selectedNode.employeeCode}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
                onClick={() => {
                  setSelectedNode(null);
                  setAssigningManager(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Details */}
            <div className="bg-muted/30 rounded-xl p-3 divide-y divide-border/60 text-xs space-y-2">
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-muted-foreground">Role:</span>
                <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                  {selectedNode.role.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-muted-foreground">Department:</span>
                <span className="font-medium text-foreground">{selectedNode.department || "General"}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-mono text-foreground text-[11px]">{selectedNode.email}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-muted-foreground">Direct Reports:</span>
                <span className="font-semibold text-primary">{selectedNode.directReportsCount} members</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-muted-foreground">Hierarchy Depth:</span>
                <span className="font-semibold text-foreground">Level {selectedNode.depth}</span>
              </div>
            </div>

            {/* QUICK ASSIGN REPORTING MANAGER SECTION */}
            <div className="border border-border/80 rounded-xl p-3 bg-card space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <GitBranch className="h-3.5 w-3.5 text-primary" />
                  Reporting Manager
                </span>
                {!assigningManager && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px] text-primary hover:bg-primary/10 cursor-pointer"
                    onClick={() => {
                      setAssigningManager(true);
                      setTargetManagerId("");
                    }}
                  >
                    Change Manager
                  </Button>
                )}
              </div>

              {assigningManager ? (
                <div className="space-y-2 pt-1">
                  <select
                    value={targetManagerId}
                    onChange={(e) => setTargetManagerId(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="">Select Reporting Manager...</option>
                    <option value="none">No Manager (Set as Executive Root)</option>
                    {Array.isArray(allEmployees) &&
                      allEmployees
                        .filter((emp: any) => emp.id !== selectedNode.id)
                        .map((emp: any) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName} ({emp.role} {emp.department?.name ? `• ${emp.department.name}` : ""})
                          </option>
                        ))}
                  </select>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs cursor-pointer"
                      onClick={() => setAssigningManager(false)}
                      disabled={updateManagerMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs cursor-pointer gap-1"
                      disabled={!targetManagerId || updateManagerMutation.isPending}
                      onClick={() =>
                        updateManagerMutation.mutate({
                          employeeId: selectedNode.id,
                          managerId: targetManagerId,
                        })
                      }
                    >
                      {updateManagerMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      Save Line
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-[11px]">
                  {selectedNode.depth === 1
                    ? "Currently set as an Executive Root (Reports to Board / Nobody)."
                    : "Assigned under managerial hierarchy."}
                </p>
              )}

              {updateFeedback && (
                <p className="text-[11px] text-emerald-600 font-medium pt-1">{updateFeedback}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedNode(null)}
                className="cursor-pointer text-xs h-8"
              >
                Close
              </Button>
              <Link href={`/workspace/employees/${selectedNode.id}`}>
                <Button size="sm" className="cursor-pointer text-xs h-8 gap-1.5">
                  <ExternalLink className="h-3 w-3" />
                  View Full Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// REFINED TREE NODE COMPONENT (CLEAN SLATE / APPLE AESTHETIC)
// =========================================================================
interface TreeNodeProps {
  node: OrgNode;
  collapsedNodes: Set<string>;
  onToggleCollapse: (id: string, e?: React.MouseEvent) => void;
  hasActiveFilter: boolean;
  matchesFilter: (node: OrgNode) => boolean;
  subtreeHasMatch: (node: OrgNode) => boolean;
  onSelectNode: (node: OrgNode) => void;
}

function TreeNodeComponent({
  node,
  collapsedNodes,
  onToggleCollapse,
  hasActiveFilter,
  matchesFilter,
  subtreeHasMatch,
  onSelectNode,
}: TreeNodeProps) {
  const isCollapsed = collapsedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isMatch = matchesFilter(node);
  const isSubtreeRelevant = subtreeHasMatch(node);

  // Role pill styling helper
  const getRoleStyle = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
      case "OWNER":
        return "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20";
      case "HR_HEAD":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20";
      case "MANAGER":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20";
      default:
        return "bg-muted/80 text-muted-foreground border-border";
    }
  };

  return (
    <div className={`flex flex-col items-center transition-opacity duration-200 ${!isSubtreeRelevant ? "opacity-25" : ""}`}>
      {/* NODE CARD */}
      <div
        onClick={() => onSelectNode(node)}
        className={`w-64 rounded-xl p-3.5 transition-all duration-200 cursor-pointer border relative select-none bg-card ${
          isMatch
            ? "border-primary ring-2 ring-primary/20 shadow-md scale-[1.02]"
            : "border-border/70 shadow-xs hover:border-border hover:shadow-md hover:-translate-y-0.5"
        }`}
      >
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-1.5 mb-2.5">
          <Badge
            variant="outline"
            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md ${getRoleStyle(
              node.role
            )}`}
          >
            {node.role.replace("_", " ")}
          </Badge>

          {node.employeeCode && (
            <span className="font-mono text-[10px] text-muted-foreground/60 tracking-wider">
              {node.employeeCode}
            </span>
          )}
        </div>

        {/* Member Profile Info */}
        <div className="flex items-center gap-3">
          <Avatar className="size-10 border border-border/80 shrink-0">
            {node.profilePhoto ? (
              <AvatarImage src={node.profilePhoto} alt={node.name} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                {node.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-xs text-foreground truncate capitalize" title={node.name}>
              {node.name}
            </h4>
            <p className="text-[11px] text-muted-foreground truncate" title={node.designation || ""}>
              {node.designation || "Staff Member"}
            </p>
            {node.department && (
              <p className="text-[10px] text-muted-foreground/70 truncate flex items-center gap-1 mt-0.5">
                <Building className="h-2.5 w-2.5 text-muted-foreground/50" />
                <span>{node.department}</span>
              </p>
            )}
          </div>
        </div>

        {/* Subordinates & Toggle Footer */}
        {hasChildren && (
          <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-xs">
            <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3 text-muted-foreground/70" />
              <span>
                {node.directReportsCount} direct · {node.totalSubordinatesCount} team
              </span>
            </span>

            <button
              onClick={(e) => onToggleCollapse(node.id, e)}
              className="size-5 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center cursor-pointer"
              title={isCollapsed ? "Expand branch" : "Collapse branch"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* CONNECTING STEM AND SIBLING BRANCHES */}
      {hasChildren && !isCollapsed && (
        <div className="flex flex-col items-center w-full">
          {/* Vertical stem from parent */}
          <div className="w-px h-6 bg-border/80" />

          {/* Children container with connecting crossbar */}
          <div className="relative flex gap-8 sm:gap-10 pt-6">
            {/* Horizontal crossbar connecting siblings */}
            {node.children.length > 1 && (
              <div
                className="absolute top-0 border-t border-border/80"
                style={{
                  left: "calc(16rem / 2)", // half card width of first child
                  right: "calc(16rem / 2)", // half card width of last child
                }}
              />
            )}

            {/* Individual child branches */}
            {node.children.map((child) => (
              <div key={child.id} className="relative flex flex-col items-center">
                {/* Vertical stem up to the crossbar */}
                <div className="absolute -top-6 w-px h-6 bg-border/80" />

                <TreeNodeComponent
                  node={child}
                  collapsedNodes={collapsedNodes}
                  onToggleCollapse={onToggleCollapse}
                  hasActiveFilter={hasActiveFilter}
                  matchesFilter={matchesFilter}
                  subtreeHasMatch={subtreeHasMatch}
                  onSelectNode={onSelectNode}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// OUTLINE ROW COMPONENT (LIST / DENSITY VIEW)
// =========================================================================
interface ListRowProps {
  node: OrgNode;
  level: number;
  collapsedNodes: Set<string>;
  onToggleCollapse: (id: string, e?: React.MouseEvent) => void;
  hasActiveFilter: boolean;
  matchesFilter: (node: OrgNode) => boolean;
  subtreeHasMatch: (node: OrgNode) => boolean;
  onSelectNode: (node: OrgNode) => void;
}

function ListRowComponent({
  node,
  level,
  collapsedNodes,
  onToggleCollapse,
  hasActiveFilter,
  matchesFilter,
  subtreeHasMatch,
  onSelectNode,
}: ListRowProps) {
  const isCollapsed = collapsedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isMatch = matchesFilter(node);
  const isSubtreeRelevant = subtreeHasMatch(node);

  if (!isSubtreeRelevant) return null;

  return (
    <>
      <div
        onClick={() => onSelectNode(node)}
        className={`py-2 px-3 rounded-lg flex items-center justify-between gap-3 transition-colors cursor-pointer ${
          isMatch ? "bg-primary/10" : "hover:bg-muted/40"
        }`}
        style={{ paddingLeft: `${Math.max(12, level * 26 + 12)}px` }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {hasChildren ? (
            <button
              onClick={(e) => onToggleCollapse(node.id, e)}
              className="size-5 rounded hover:bg-muted text-muted-foreground flex items-center justify-center cursor-pointer"
            >
              {isCollapsed ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          ) : (
            <div className="size-5 flex items-center justify-center">
              <span className="size-1 rounded-full bg-border" />
            </div>
          )}

          <Avatar className="size-7 border border-border/80 shrink-0">
            {node.profilePhoto ? (
              <AvatarImage src={node.profilePhoto} alt={node.name} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-[10px]">
                {node.name.charAt(0)}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-foreground capitalize truncate">
                {node.name}
              </span>
              {node.employeeCode && (
                <span className="font-mono text-[9px] text-muted-foreground/60 hidden sm:inline">
                  {node.employeeCode}
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground truncate">
              {node.designation || "Staff"} {node.department ? `• ${node.department}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 text-xs">
          {hasChildren && (
            <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0.2">
              {node.directReportsCount} reports
            </Badge>
          )}
          <Badge
            variant="secondary"
            className="text-[9px] uppercase font-bold hidden sm:inline-flex px-1.5 py-0.2"
          >
            Level {node.depth}
          </Badge>
        </div>
      </div>

      {hasChildren &&
        !isCollapsed &&
        node.children.map((child) => (
          <ListRowComponent
            key={child.id}
            node={child}
            level={level + 1}
            collapsedNodes={collapsedNodes}
            onToggleCollapse={onToggleCollapse}
            hasActiveFilter={hasActiveFilter}
            matchesFilter={matchesFilter}
            subtreeHasMatch={subtreeHasMatch}
            onSelectNode={onSelectNode}
          />
        ))}
    </>
  );
}
