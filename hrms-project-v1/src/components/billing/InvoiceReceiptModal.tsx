"use client";

import React, { useRef } from "react";
import {
  Printer,
  X,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Building2,
  Calendar,
  Receipt,
  ShieldCheck,
  CreditCard,
  Download,
} from "lucide-react";

export interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: "DRAFT" | "ISSUED" | "PAID" | "VOID" | "UNCOLLECTIBLE";
  dueDate: string;
  paidAt?: string;
  createdAt: string;
  company: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    gstin?: string;
    pan?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  subscription?: {
    billingCycle?: string;
    plan?: {
      name: string;
      code: string;
      monthlyPrice: number;
      annualPrice: number;
    };
  };
  payments?: Array<{
    id: string;
    amount: number;
    currency: string;
    gateway: string;
    status: string;
    gatewayPaymentId?: string;
    createdAt: string;
  }>;
}

interface Props {
  invoice: InvoiceDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function InvoiceReceiptModal({ invoice, isOpen, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPaid = invoice.status === "PAID";
  const isIssued = invoice.status === "ISSUED";
  const subtotal = invoice.amountDue / 1.18;
  const taxGst = invoice.amountDue - subtotal;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      {/* Container */}
      <div className="w-full max-w-3xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden my-8 relative flex flex-col max-h-[90vh]">
        {/* Modal Action Bar (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30 print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Tax Invoice Details</h3>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                isPaid
                  ? "bg-status-green/15 text-status-green border-status-green/25"
                  : isIssued
                  ? "bg-status-yellow/15 text-status-yellow border-status-yellow/25"
                  : "bg-destructive/15 text-destructive border-destructive/25"
              }`}
            >
              {invoice.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div ref={printRef} className="p-8 sm:p-10 overflow-y-auto bg-card text-foreground print:p-0 print:overflow-visible">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-border pb-8">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-md">
                  A
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-foreground leading-tight">Antigravity Technologies Inc.</h1>
                  <p className="text-xs text-muted-foreground">SaaS Enterprise Platform Cloud</p>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground space-y-0.5">
                <p>Cyber City, DLF Phase II, Sector 24</p>
                <p>Gurugram, Haryana 122002, India</p>
                <p>GSTIN: 06AAACA9876Q1Z9 | PAN: AAACA9876Q</p>
                <p>support@antigravity.saas | +91 800-HRMS-CLOUD</p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <h2 className="text-2xl font-black font-mono tracking-tight text-primary uppercase">TAX INVOICE</h2>
              <div className="mt-2 text-xs space-y-1">
                <p className="text-muted-foreground">
                  Invoice No: <span className="font-mono font-bold text-foreground">{invoice.invoiceNumber}</span>
                </p>
                <p className="text-muted-foreground">
                  Issue Date: <span className="font-mono text-foreground">{new Date(invoice.createdAt).toLocaleDateString()}</span>
                </p>
                <p className="text-muted-foreground">
                  Due Date: <span className="font-mono text-foreground">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                </p>
                {invoice.paidAt && (
                  <p className="text-muted-foreground">
                    Paid Date: <span className="font-mono text-status-green font-semibold">{new Date(invoice.paidAt).toLocaleDateString()}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Billed To / Account Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-8 p-4 rounded-xl bg-muted/30 border border-border text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                BILLED TO
              </span>
              <p className="font-bold text-sm text-foreground">{invoice.company?.name || "Customer Organization"}</p>
              <p className="text-muted-foreground mt-1">{invoice.company?.email}</p>
              {invoice.company?.phone && <p className="text-muted-foreground">{invoice.company.phone}</p>}
              {invoice.company?.address && (
                <p className="text-muted-foreground mt-1">
                  {invoice.company.address}
                  {invoice.company.city ? `, ${invoice.company.city}` : ""}
                  {invoice.company.state ? `, ${invoice.company.state}` : ""}
                  {invoice.company.pincode ? ` - ${invoice.company.pincode}` : ""}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                TAX & REGISTRATION
              </span>
              <p className="text-muted-foreground">
                GSTIN: <span className="font-mono font-semibold text-foreground">{invoice.company?.gstin || "N/A (Unregistered)"}</span>
              </p>
              <p className="text-muted-foreground">
                PAN: <span className="font-mono font-semibold text-foreground">{invoice.company?.pan || "N/A"}</span>
              </p>
              <p className="text-muted-foreground">
                Place of Supply: <span className="text-foreground">{invoice.company?.state || "Haryana (06)"}</span>
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-border rounded-xl overflow-hidden mb-6">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Item & Description</th>
                  <th className="py-2.5 px-4 text-center">Cycle</th>
                  <th className="py-2.5 px-4 text-right">Taxable Amt</th>
                  <th className="py-2.5 px-4 text-right">GST (18%)</th>
                  <th className="py-2.5 px-4 text-right">Total ({invoice.currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                <tr>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-foreground">
                      {invoice.subscription?.plan?.name || "Cloud HRMS"} Subscription
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Full SaaS workspace access including attendance, biometric sync, payroll, and statutory reporting.
                    </p>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono">
                    {invoice.subscription?.billingCycle || "MONTHLY"}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono">
                    ₹{subtotal.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono">
                    ₹{taxGst.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold">
                    ₹{invoice.amountDue.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="text-xs text-muted-foreground max-w-xs space-y-1">
              <p className="font-semibold text-foreground">Payment Terms & Notes:</p>
              <p>Payment is due within 15 days of invoice issue date. Electronic bank transfers and card gateway transactions are reconciled in real time.</p>
            </div>

            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span className="font-mono text-foreground">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Integrated GST (18%):</span>
                <span className="font-mono text-foreground">₹{taxGst.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-border flex justify-between font-bold text-sm text-foreground">
                <span>Total Amount Due:</span>
                <span className="font-mono text-primary">₹{invoice.amountDue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground pt-1">
                <span>Amount Paid:</span>
                <span className="font-mono text-status-green font-semibold">₹{invoice.amountPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-xs pt-1 border-t border-dashed border-border">
                <span>Balance Due:</span>
                <span className="font-mono text-foreground">
                  ₹{Math.max(0, invoice.amountDue - invoice.amountPaid).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Receipts History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Transaction & Settlement Ledger
              </h4>
              <div className="space-y-2">
                {invoice.payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-semibold text-foreground">
                          {p.gateway} Payment Ref: {p.gatewayPaymentId || p.id.slice(0, 8)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{new Date(p.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-status-green">₹{p.amount.toFixed(2)}</p>
                      <span className="text-[10px] font-semibold text-status-green uppercase">{p.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-border text-center text-[10px] text-muted-foreground">
            <p>This is a computer-generated tax invoice generated by Antigravity Cloud Platform. No physical signature is required.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
