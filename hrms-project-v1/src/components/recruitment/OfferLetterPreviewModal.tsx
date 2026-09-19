"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Printer,
  FileCheck,
  Building2,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
} from "lucide-react";

interface OfferLetterPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: any;
  versionData?: any; // The specific version to display (defaults to latest or approved)
}

export function OfferLetterPreviewModal({
  open,
  onOpenChange,
  offer,
  versionData,
}: OfferLetterPreviewModalProps) {
  // Use passed versionData, or find approved version, or fallback to latest version
  const activeVersion =
    versionData ||
    offer?.versions?.find((v: any) => v.status === "APPROVED") ||
    offer?.versions?.[0] ||
    null;

  if (!offer || !activeVersion) return null;

  const candidate = offer.candidate || offer.application?.candidate;
  const requisition = offer.jobRequisition || offer.application?.jobRequisition;
  const company = offer.company || offer.application?.company;

  const handlePrint = () => {
    const printContent = document.getElementById("printable-offer-letter-content");
    if (!printContent) {
      window.print();
      return;
    }

    // Create isolated printing iframe so no website background, dashboard, or other modals are printed
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.zIndex = "-9999";
    document.body.appendChild(iframe);

    const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!frameDoc) {
      window.print();
      return;
    }

    // Clone stylesheets to preserve Tailwind styling in isolated iframe
    const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
      .map((tag) => tag.outerHTML)
      .join("\n");

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Official Offer Letter - ${offer.offerCode}</title>
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 14mm 16mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              background: #ffffff !important;
              color: #0f172a !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-break-inside-avoid {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
            table {
              border-collapse: collapse !important;
              width: 100% !important;
            }
            /* Force light theme on printed document */
            .text-slate-100, .text-slate-200, .text-slate-300 {
              color: #0f172a !important;
            }
            .text-indigo-200, .text-indigo-300, .text-indigo-400 {
              color: #312e81 !important;
            }
            .bg-slate-900, .bg-slate-950 {
              background-color: #f8fafc !important;
              color: #0f172a !important;
            }
          </style>
        </head>
        <body class="bg-white text-slate-900">
          <div style="padding: 10px 0;">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    frameDoc.close();

    // Trigger printing once content is rendered in iframe
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error("Iframe print error", err);
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }, 300);
  };

  const formattedJoiningDate = activeVersion.joiningDate
    ? new Date(activeVersion.joiningDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "TBD";

  const formattedExpiryDate = activeVersion.expiryDate
    ? new Date(activeVersion.expiryDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "TBD";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-5xl lg:max-w-6xl max-h-[92vh] overflow-y-auto p-0 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl rounded-2xl printable-offer-dialog print:fixed print:inset-0 print:m-0 print:p-0 print:border-none print:shadow-none print:max-w-none print:max-h-none print:overflow-visible print:bg-white print:transform-none">
        {/* Header toolbar (Hidden in print) */}
        <DialogHeader className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                Official Offer Letter — {offer.offerCode} (v{activeVersion.version})
              </DialogTitle>
              {activeVersion.status === "APPROVED" && (
                <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200">
                  Approved Snapshot
                </Badge>
              )}
              {(offer.status === "ACCEPTED" || activeVersion.status === "ACCEPTED") && (
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-300 font-bold">
                  Offer Accepted 🎉
                </Badge>
              )}
            </div>

            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save PDF
            </Button>
          </div>
        </DialogHeader>

        {/* The Printable Letter Document */}
        <div id="printable-offer-letter-content" className="printable-offer-document p-8 md:p-14 text-slate-800 dark:text-slate-200 font-sans leading-relaxed text-sm print:text-black print:p-0 print:m-0 print:text-xs space-y-6">
          {/* Company Branding & Letterhead */}
          <div className="flex items-start justify-between border-b-2 border-indigo-600 pb-6 print:pb-4 print-break-inside-avoid">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-indigo-950 dark:text-indigo-200 uppercase print:text-black">
                {company?.name || "Globizhub Enterprise HRMS"}
              </h1>
              <p className="text-xs text-slate-500 print:text-gray-600 mt-1">
                Corporate Headquarters • Talent Acquisition & People Operations
              </p>
            </div>
            <div className="text-right text-xs text-slate-500 print:text-gray-600">
              <p className="font-semibold text-slate-800 dark:text-slate-300 print:text-black">
                Ref: {offer.offerCode}
              </p>
              <p>
                Date:{" "}
                {new Date().toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Recipient Details */}
          <div className="space-y-1">
            <p className="font-bold text-slate-900 dark:text-slate-100 text-base print:text-black">
              {candidate?.firstName} {candidate?.lastName}
            </p>
            {candidate?.email && <p className="text-xs text-slate-600 dark:text-slate-400">{candidate.email}</p>}
            {candidate?.phone && <p className="text-xs text-slate-600 dark:text-slate-400">{candidate.phone}</p>}
            {candidate?.currentLocation && (
              <p className="text-xs text-slate-600 dark:text-slate-400">{candidate.currentLocation}</p>
            )}
          </div>

          {/* Salutation & Formal Offer Statement */}
          <div className="space-y-3">
            <p className="font-semibold">Dear {candidate?.firstName},</p>
            <p>
              We are delighted to formally extend this offer of employment for the position of{" "}
              <strong className="text-indigo-900 dark:text-indigo-300 print:text-black">
                {activeVersion.designation?.name || requisition?.title || "Specialist"}
              </strong>{" "}
              within the{" "}
              <strong>{activeVersion.department?.name || requisition?.department?.name || "Operations"}</strong> department
              at <strong>{company?.name || "Globizhub"}</strong>.
            </p>
            <p>
              Your skills and experience impressed our interview panel, and we are confident you will make a significant
              contribution to our continued growth and innovation.
            </p>
          </div>

          {/* Key Appointment Terms */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 print:bg-slate-50/80 print:border-slate-300 print-break-inside-avoid">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                Expected Joining
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200 print:text-black">
                {formattedJoiningDate}
              </span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                Workplace Mode
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200 print:text-black">
                {activeVersion.workplaceType?.replace("_", "-")}
              </span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                Probation Period
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200 print:text-black">
                {activeVersion.probationDurationMonths} Months
              </span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                Notice Period
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200 print:text-black">
                {activeVersion.noticePeriodDays} Days
              </span>
            </div>
          </div>

          {/* ANNEXURE A: COMPENSATION & BENEFITS SCHEDULE */}
          <div className="space-y-3 pt-2 print-break-inside-avoid">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 uppercase tracking-wide print:text-black">
                Annexure A: Compensation & Benefits Structure
              </h3>
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 print:text-black">
                Total Annual CTC: ₹{activeVersion.totalCtc?.toLocaleString()}
              </span>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 print:border-slate-400 print:border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 print:bg-gray-200 text-slate-700 dark:text-slate-300 print:text-black border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2 px-3 font-semibold">Compensation Component</th>
                    <th className="py-2 px-3 font-semibold text-right">Monthly (₹)</th>
                    <th className="py-2 px-3 font-semibold text-right">Annualized (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-gray-300">
                  {/* Earnings */}
                  <tr>
                    <td className="py-2 px-3">Basic Salary</td>
                    <td className="py-2 px-3 text-right font-mono">₹{activeVersion.basicSalary?.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-mono">₹{(activeVersion.basicSalary * 12)?.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">House Rent Allowance (HRA)</td>
                    <td className="py-2 px-3 text-right font-mono">₹{(activeVersion.hra || 0)?.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-mono">₹{((activeVersion.hra || 0) * 12)?.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">Conveyance Allowance</td>
                    <td className="py-2 px-3 text-right font-mono">₹{(activeVersion.conveyanceAllowance || 0)?.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-mono">₹{((activeVersion.conveyanceAllowance || 0) * 12)?.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">Medical Allowance</td>
                    <td className="py-2 px-3 text-right font-mono">₹{(activeVersion.medicalAllowance || 0)?.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-mono">₹{((activeVersion.medicalAllowance || 0) * 12)?.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">Special Allowance</td>
                    <td className="py-2 px-3 text-right font-mono">₹{(activeVersion.specialAllowance || 0)?.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-mono">₹{((activeVersion.specialAllowance || 0) * 12)?.toLocaleString()}</td>
                  </tr>
                  {activeVersion.otherAllowances > 0 && (
                    <tr>
                      <td className="py-2 px-3">Other Allowances</td>
                      <td className="py-2 px-3 text-right font-mono">₹{activeVersion.otherAllowances?.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono">₹{(activeVersion.otherAllowances * 12)?.toLocaleString()}</td>
                    </tr>
                  )}

                  {/* Gross Monthly Total */}
                  <tr className="bg-indigo-50/60 dark:bg-indigo-950/40 font-bold print:bg-gray-100">
                    <td className="py-2 px-3">A. Gross Monthly Earnings</td>
                    <td className="py-2 px-3 text-right font-mono">₹{activeVersion.grossMonthly?.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-mono">₹{activeVersion.annualGross?.toLocaleString()}</td>
                  </tr>

                  {/* Standard Deductions */}
                  <tr>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">Less: Provident Fund (Employee PF)</td>
                    <td className="py-2 px-3 text-right font-mono text-rose-600 dark:text-rose-400">
                      - ₹{(activeVersion.pfContribution || 0)?.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-rose-600 dark:text-rose-400">
                      - ₹{((activeVersion.pfContribution || 0) * 12)?.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">Less: Professional Tax (PT)</td>
                    <td className="py-2 px-3 text-right font-mono text-rose-600 dark:text-rose-400">
                      - ₹{(activeVersion.professionalTax || 0)?.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-rose-600 dark:text-rose-400">
                      - ₹{((activeVersion.professionalTax || 0) * 12)?.toLocaleString()}
                    </td>
                  </tr>
                  {activeVersion.taxDeduction > 0 && (
                    <tr>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400">Less: Estimated Tax / TDS</td>
                      <td className="py-2 px-3 text-right font-mono text-rose-600 dark:text-rose-400">
                        - ₹{activeVersion.taxDeduction?.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-rose-600 dark:text-rose-400">
                        - ₹{(activeVersion.taxDeduction * 12)?.toLocaleString()}
                      </td>
                    </tr>
                  )}

                  {/* Net Take-Home */}
                  <tr className="bg-emerald-50/70 dark:bg-emerald-950/40 font-bold text-emerald-900 dark:text-emerald-300 print:bg-gray-100 print:text-black">
                    <td className="py-2 px-3">B. Net Monthly In-Hand (Estimated)</td>
                    <td className="py-2 px-3 text-right font-mono">₹{activeVersion.netMonthly?.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-mono">₹{(activeVersion.netMonthly * 12)?.toLocaleString()}</td>
                  </tr>

                  {/* Bonuses */}
                  {activeVersion.annualPerformanceBonus > 0 && (
                    <tr>
                      <td className="py-2 px-3">Annual Performance Bonus (Variable)</td>
                      <td className="py-2 px-3 text-right text-slate-400 font-mono">—</td>
                      <td className="py-2 px-3 text-right font-mono">₹{activeVersion.annualPerformanceBonus?.toLocaleString()}</td>
                    </tr>
                  )}
                  {activeVersion.joiningBonus > 0 && (
                    <tr>
                      <td className="py-2 px-3">One-Time Joining / Sign-on Bonus</td>
                      <td className="py-2 px-3 text-right text-slate-400 font-mono">—</td>
                      <td className="py-2 px-3 text-right font-mono">₹{activeVersion.joiningBonus?.toLocaleString()}</td>
                    </tr>
                  )}

                  {/* Total Annual CTC */}
                  <tr className="bg-slate-900 text-white font-black text-sm print:bg-black print:text-white">
                    <td className="py-2.5 px-3 uppercase tracking-wider">Total Cost to Company (CTC)</td>
                    <td className="py-2.5 px-3 text-right font-mono">—</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-300 print:text-white">
                      ₹{activeVersion.totalCtc?.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Terms and Conditions */}
          {activeVersion.termsAndConditions && (
            <div className="space-y-1.5 pt-2 print-break-inside-avoid">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100 print:text-black">
                Terms of Employment & Covenants
              </h4>
              <p className="text-xs font-mono whitespace-pre-line text-slate-600 dark:text-slate-400 print:text-slate-900 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 print:bg-transparent print:border print:border-slate-300 print:p-2.5">
                {activeVersion.termsAndConditions}
              </p>
            </div>
          )}

          {/* Acceptance Deadline Notice */}
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 print:border-slate-300 print:bg-amber-50/50 print:text-black print-break-inside-avoid">
            <strong>Offer Validity:</strong> This offer is valid until{" "}
            <strong>{formattedExpiryDate}</strong>. Please sign and return the accepted copy before this deadline.
          </div>

          {/* Signatures Block */}
          <div className="pt-8 grid grid-cols-2 gap-12 text-xs print-break-inside-avoid print:pt-6">
            <div className="space-y-8">
              <p className="text-slate-500 print:text-slate-700">For {company?.name || "Globizhub Enterprise"}:</p>
              <div className="border-t border-slate-400 pt-2 space-y-0.5">
                <p className="font-bold text-slate-900 dark:text-slate-100 print:text-black">
                  {offer.approvedBy
                    ? `${offer.approvedBy.firstName} ${offer.approvedBy.lastName}`
                    : "Authorized Signatory"}
                </p>
                <p className="text-[11px] text-slate-500 print:text-slate-600">Head of People Operations & HR</p>
              </div>
            </div>

            <div className="space-y-8">
              <p className="text-slate-500 print:text-slate-700">Candidate Acceptance & Confirmation:</p>
              <div className="border-t border-slate-400 pt-2 space-y-0.5">
                <p className="font-bold text-slate-900 dark:text-slate-100 print:text-black">
                  {candidate?.firstName} {candidate?.lastName}
                </p>
                {offer.status === "ACCEPTED" || activeVersion.status === "ACCEPTED" ? (
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 print:text-emerald-800 font-semibold flex items-center gap-1 mt-1">
                    <CheckCircle2 className="h-3.5 w-3.5 inline" /> Digitally Accepted & Confirmed
                    {offer.respondedAt && (
                      <span className="text-[10px] text-slate-500 print:text-slate-600 block">
                        • on {new Date(offer.respondedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 print:text-slate-600">Signature & Date</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions (Hidden in print) */}
        <DialogFooter className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 print:hidden">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 text-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / Save PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
