"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Users2,
  Key,
  Lock,
} from "lucide-react";

interface RoleCapability {
  name: string;
  category: string;
  superAdmin: boolean;
  platformAdmin: boolean;
  billingAdmin: boolean;
  supportAdmin: boolean;
  platformAnalyst: boolean;
}

export default function RolesMatrixPage() {
  const capabilities: RoleCapability[] = [
    {
      name: "View All Organizations & Metrics",
      category: "Tenant Management",
      superAdmin: true,
      platformAdmin: true,
      billingAdmin: true,
      supportAdmin: true,
      platformAnalyst: true,
    },
    {
      name: "Onboard, Approve & Verify Organizations",
      category: "Tenant Management",
      superAdmin: true,
      platformAdmin: true,
      billingAdmin: false,
      supportAdmin: false,
      platformAnalyst: false,
    },
    {
      name: "Suspend & Terminate Tenant Accounts",
      category: "Tenant Management",
      superAdmin: true,
      platformAdmin: true,
      billingAdmin: false,
      supportAdmin: false,
      platformAnalyst: false,
    },
    {
      name: "Issue Privileged Diagnostic Access Sessions",
      category: "Tenant Management",
      superAdmin: true,
      platformAdmin: true,
      billingAdmin: false,
      supportAdmin: true,
      platformAnalyst: false,
    },
    {
      name: "Configure Pricing Plans & Entitlements",
      category: "Subscription & Billing",
      superAdmin: true,
      platformAdmin: false,
      billingAdmin: true,
      supportAdmin: false,
      platformAnalyst: false,
    },
    {
      name: "Assign / Upgrade Tenant Subscriptions",
      category: "Subscription & Billing",
      superAdmin: true,
      platformAdmin: false,
      billingAdmin: true,
      supportAdmin: false,
      platformAnalyst: false,
    },
    {
      name: "Issue Tax Invoices & Reconcile Payments",
      category: "Subscription & Billing",
      superAdmin: true,
      platformAdmin: false,
      billingAdmin: true,
      supportAdmin: false,
      platformAnalyst: false,
    },
    {
      name: "Tenant Module Overrides & Feature Flags",
      category: "Product & Architecture",
      superAdmin: true,
      platformAdmin: true,
      billingAdmin: false,
      supportAdmin: false,
      platformAnalyst: false,
    },
    {
      name: "Staff Provisioning & Role Modification",
      category: "Platform Administration",
      superAdmin: true,
      platformAdmin: false,
      billingAdmin: false,
      supportAdmin: false,
      platformAnalyst: false,
    },
    {
      name: "Read Platform Immutable Audit Trail",
      category: "Platform Administration",
      superAdmin: true,
      platformAdmin: true,
      billingAdmin: false,
      supportAdmin: false,
      platformAnalyst: false,
    },
    {
      name: "Manage Customer Support Desk & Tickets",
      category: "Support & Operations",
      superAdmin: true,
      platformAdmin: true,
      billingAdmin: false,
      supportAdmin: true,
      platformAnalyst: false,
    },
    {
      name: "Access Executive SaaS Revenue Dashboards",
      category: "Analytics & Intelligence",
      superAdmin: true,
      platformAdmin: true,
      billingAdmin: true,
      supportAdmin: false,
      platformAnalyst: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/platform-admin/users"
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Platform Roles & RBAC Matrix</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 ml-7">
            Principle of least privilege architecture: Granular SaaS operational permissions isolated from tenant-level roles.
          </p>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-4">Permission Capability</th>
                <th className="py-4 px-3 text-center">Super Admin</th>
                <th className="py-4 px-3 text-center">Platform Admin</th>
                <th className="py-4 px-3 text-center">Billing Admin</th>
                <th className="py-4 px-3 text-center">Support Admin</th>
                <th className="py-4 px-3 text-center">Analyst</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {capabilities.map((cap, idx) => (
                <tr key={idx} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-foreground">{cap.name}</div>
                    <span className="text-[10px] text-muted-foreground font-mono">{cap.category}</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {cap.superAdmin ? (
                      <CheckCircle2 className="h-4 w-4 text-status-green mx-auto" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {cap.platformAdmin ? (
                      <CheckCircle2 className="h-4 w-4 text-status-green mx-auto" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {cap.billingAdmin ? (
                      <CheckCircle2 className="h-4 w-4 text-status-green mx-auto" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {cap.supportAdmin ? (
                      <CheckCircle2 className="h-4 w-4 text-status-green mx-auto" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {cap.platformAnalyst ? (
                      <CheckCircle2 className="h-4 w-4 text-status-green mx-auto" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

