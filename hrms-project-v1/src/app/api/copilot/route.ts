import { NextRequest, NextResponse } from "next/server";
import { matchHRMSKnowledge } from "@/lib/copilot/knowledge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, route = "", role = "EMPLOYEE" } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Always attempt high-fidelity local HRMS domain knowledge first
    const localMatch = matchHRMSKnowledge(query, route, role);

    // If local match found a high-confidence answer, return it immediately
    if (localMatch) {
      return NextResponse.json(localMatch);
    }

    // Fallback answer
    return NextResponse.json({
      reply: "I am Gpilot, your TeamHub HRMS assistant. I can guide you through Employees, Attendance, Leave, Payroll, Recruitment, and Company Settings. How can I help you today?",
      suggestedActions: [
        { label: "Go to Dashboard", url: "/workspace/dashboard" },
        { label: "Employees Directory", url: "/workspace/employees" }
      ],
      suggestedQuestions: [
        "How do I add an employee?",
        "How do I apply for leave?",
        "Where can I find my payslip?"
      ],
      source: "knowledge_base"
    });
  } catch (error: any) {
    console.error("Gpilot API route error:", error);
    return NextResponse.json(
      { error: "Internal Gpilot error", details: error?.message },
      { status: 500 }
    );
  }
}

