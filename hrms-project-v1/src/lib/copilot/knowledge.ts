export interface CopilotAction {
  label: string;
  url: string;
  variant?: "default" | "outline" | "secondary";
}

export interface CopilotResponse {
  reply: string;
  suggestedActions?: CopilotAction[];
  suggestedQuestions?: string[];
  source: "knowledge_base" | "llm";
}

export interface ModuleGuide {
  id: string;
  name: string;
  path: string;
  summary: string;
  quickQuestions: string[];
  topics: {
    keywords: string[];
    answer: string;
    action?: CopilotAction;
  }[];
}

export const HRMS_MODULE_GUIDES: ModuleGuide[] = [
  {
    id: "employees",
    name: "Employees & Directory",
    path: "/workspace/employees",
    summary:
      "Manage staff profiles, departmental assignments, personal data, and onboarding status.",
    quickQuestions: [
      "How do I add a new employee?",
      "Can I import employees in bulk from Excel or CSV?",
      "How do I view employee documents and identity proofs?",
      "How do I export the employee directory?",
    ],
    topics: [
      {
        keywords: ["add", "create", "new employee", "onboard employee", "hire", "single employee"],
        answer:
          "To add a new employee:\n1. Navigate to **Employees**.\n2. Click the **'+ Add Employee'** button at the top right.\n3. Fill in the **Basic Information** (Name, Work Email, Phone, Designation, Department).\n4. Enter the **Employment Details** (Date of Joining, Employment Type, Reporting Manager, Salary/CTC).\n5. (Optional) Provide Bank & Tax details or leave it for the employee to complete during onboarding.\n6. Click **Save & Send Invite** to trigger a welcome email with their login credentials.",
        action: { label: "Go to Employees Directory", url: "/workspace/employees" },
      },
      {
        keywords: ["bulk", "import", "csv", "excel", "xlsx", "multiple employees", "upload list"],
        answer:
          "To bulk import employees:\n1. Go to **Employees**.\n2. Click the **'Import Employees'** button next to Add Employee.\n3. Download the sample Excel/CSV template to ensure column headers match (First Name, Last Name, Email, Designation, Department, Date of Joining).\n4. Upload your populated file. The system validates records and reports any missing fields or duplicate emails before creating the accounts.",
        action: { label: "Open Employees Page", url: "/workspace/employees" },
      },
      {
        keywords: ["documents", "upload document", "passport", "aadhar", "pan", "id", "kyc", "identity"],
        answer:
          "To view or verify employee documents:\n1. Open the **Employees** table and click on the employee row.\n2. In the profile drawer or detail view, switch to the **Documents** tab (or visit `/workspace/employees/[id]/documents`).\n3. You can review uploaded Identity Proofs, Degree Certificates, and Signed Offer Letters.\n4. Admins can verify or reject submissions and upload new documents on the employee's behalf.",
        action: { label: "Go to Documents Center", url: "/workspace/documents" },
      },
      {
        keywords: ["status", "probation", "terminate", "inactive", "active", "filter", "exited"],
        answer:
          "To manage or filter employee employment status:\n1. Use the status filter tabs at the top of the table: **All**, **Active**, **On Probation**, or **Exited**.\n2. To change an employee's status, click the **Three-Dots Menu (⋮)** on their row and select **'Edit Status'**.\n3. Status changes are automatically recorded in the audit log for compliance.",
        action: { label: "View Employee Directory", url: "/workspace/employees" },
      },
      {
        keywords: ["export", "download list", "spreadsheet", "report", "csv export"],
        answer:
          "To export your employee records:\n1. Go to **Employees**.\n2. Apply any desired Department, Designation, or Status filters.\n3. Click the **'Export'** icon/button above the table.\n4. An Excel (`.xlsx`) file containing all filtered employee records and contact details will download immediately.",
        action: { label: "Open Employee Table", url: "/workspace/employees" },
      },
    ],
  },
  {
    id: "documents",
    name: "Documents Center",
    path: "/workspace/documents",
    summary: "Centralized repository for company policies, contracts, and employee records.",
    quickQuestions: [
      "What file formats and sizes are supported?",
      "Who has permission to view confidential documents?",
      "How do I upload company policies for all staff?",
      "How does document verification work?",
    ],
    topics: [
      {
        keywords: ["format", "supported", "file type", "size", "limit", "upload limit", "10mb"],
        answer:
          "The Documents module supports **PDF, PNG, JPG, and DOCX** files.\n- Maximum file size per upload is **10MB**.\n- Uploaded files are securely stored with cloud encryption.\n- For KYC and contracts, PDF format is recommended for optimal rendering in the in-app previewer.",
        action: { label: "Go to Documents", url: "/workspace/documents" },
      },
      {
        keywords: ["permission", "access", "confidential", "who can see", "privacy", "security"],
        answer:
          "Document access is strictly governed by Role-Based Access Control (RBAC):\n- **Employees**: Can view their own personal uploads and company-wide policies.\n- **Managers**: Can view non-confidential records of their direct reportees.\n- **HR Admins**: Have full privileges to inspect, approve, reject, and upload records across the organization.\n- Statutory data (PAN, Aadhaar, Bank Details) is encrypted at rest.",
        action: { label: "View Roles & Permissions", url: "/workspace/settings" },
      },
      {
        keywords: ["policy", "policies", "handbook", "company document", "leave policy", "publish policy"],
        answer:
          "To publish an organization-wide policy (e.g. Code of Conduct, Anti-Harassment, Leave Policy):\n1. Go to **Documents**.\n2. Select the **'Company Policies'** tab.\n3. Click **'Upload Policy'**.\n4. Give it a title, choose a category (HR, IT & Security, Operations), and attach the PDF.\n5. Click **Publish** to make it instantly visible in all employees' workspaces.",
        action: { label: "View Company Policies", url: "/workspace/documents" },
      },
      {
        keywords: ["verify", "verification", "approve document", "reject document", "kyc check"],
        answer:
          "To verify uploaded documents:\n1. In **Documents**, click the **'Pending Verification'** tab.\n2. Click the document preview to inspect the file.\n3. Click **'Verify & Approve'** to certify the document, or **'Reject'** with comments so the employee is asked to re-upload.",
        action: { label: "Open Documents", url: "/workspace/documents" },
      },
    ],
  },
  {
    id: "leave",
    name: "Leave & Time Off",
    path: "/workspace/leave",
    summary: "Apply for leaves, track leave balances, and approve time-off requests.",
    quickQuestions: [
      "How do I apply for leave?",
      "How do managers approve or reject leave requests?",
      "What leave types exist and what is the quota?",
      "What is the Sandwich Rule and Loss of Pay (LOP)?",
    ],
    topics: [
      {
        keywords: ["apply", "request leave", "take leave", "vacation", "sick leave", "casual leave", "time off"],
        answer:
          "To request time off:\n1. Head over to **Leave**.\n2. Click the **'Apply Leave'** button.\n3. Choose your leave category (Casual, Sick, Earned, or Maternity/Paternity).\n4. Select the Start and End dates (or toggle Half-Day).\n5. Provide a short reason and click **Submit Request**.\nYour reporting manager will receive an immediate notification to review your request.",
        action: { label: "Apply for Leave", url: "/workspace/leave" },
      },
      {
        keywords: ["approve", "reject", "manager approval", "pending leaves", "action request"],
        answer:
          "Managers and HR Admins can review pending requests:\n1. Open the **Leave** module.\n2. Switch to the **'Pending Approvals'** tab.\n3. Click on any request to inspect dates, leave category, remaining balance, and reason.\n4. Click **Approve** or **Reject** (with mandatory feedback remarks).",
        action: { label: "View Pending Approvals", url: "/workspace/leave" },
      },
      {
        keywords: ["types", "balance", "quota", "earned", "casual", "sick", "annual leave", "maternity"],
        answer:
          "Standard leave categories allocated per calendar year:\n- **Casual Leave (CL)**: For unexpected personal errands.\n- **Sick Leave (SL)**: For medical needs (medical certificate required for > 2 consecutive days).\n- **Earned / Privilege Leave (EL)**: Planned vacations accumulated based on service tenure.\n- **Maternity / Paternity Leave**: Statutory parental time off.\nCheck your remaining balances at the top of the Leave dashboard.",
        action: { label: "Check Leave Balances", url: "/workspace/leave" },
      },
      {
        keywords: ["sandwich", "sandwich rule", "lop", "loss of pay", "unpaid", "leave deduction"],
        answer:
          "**Sandwich Rule & Loss of Pay (LOP)**:\n- **Sandwich Rule**: If enabled in Company Settings, taking leave on Friday and Monday treats intervening Saturday and Sunday as leave days.\n- **Loss of Pay (LOP)**: If an employee exhausts their leave balance or takes unapproved absences, the payroll engine automatically marks those days as LOP and deducts pro-rata pay during monthly payroll processing.",
        action: { label: "View Leave Rules", url: "/workspace/leave" },
      },
    ],
  },
  {
    id: "attendance",
    name: "Attendance & Daily Logs",
    path: "/workspace/attendance",
    summary: "Clock in/out, view daily logs, track work hours, and schedule shifts.",
    quickQuestions: [
      "How do I clock in and out?",
      "How do I regularize a missed punch or forgot to clock out?",
      "Where can I see my monthly attendance record?",
      "What is the late mark and half-day policy?",
    ],
    topics: [
      {
        keywords: ["clock in", "punch in", "sign in", "mark attendance", "clock out", "punch out"],
        answer:
          "To mark daily attendance:\n1. Look at the top navigation bar or visit the **Attendance** page.\n2. Click the **'Clock In'** button at the start of your shift.\n3. The system captures your timestamp and network details.\n4. When finishing your workday, click **'Clock Out'** to compute total productive work hours.",
        action: { label: "Go to Attendance", url: "/workspace/attendance" },
      },
      {
        keywords: ["missed", "regularize", "forgot to clock", "adjustment", "correction", "punch error"],
        answer:
          "If you forgot to punch in or experienced technical issues:\n1. Go to **Attendance** -> **Attendance Logs**.\n2. Find the date and click **'Request Regularization'**.\n3. Enter the actual Check-In and Check-Out times along with an explanation.\n4. Submit for manager approval. Once approved, the record is updated from Absent to Present.",
        action: { label: "View Attendance Logs", url: "/workspace/attendance" },
      },
      {
        keywords: ["late", "late mark", "grace period", "half day", "threshold", "penalty"],
        answer:
          "Attendance calculation rules:\n- **Grace Period**: 15 minutes tolerance after shift start time.\n- **Late Mark**: Clocking in after the grace period registers a Late mark.\n- **Half-Day**: Completing between 4 and 8 hours of work counts as a Half-Day.",
        action: { label: "Check Shift Policies", url: "/workspace/shifts" },
      },
    ],
  },
  {
    id: "payroll",
    name: "Payroll Management",
    path: "/workspace/payroll",
    summary: "Manage salary structures, deductions, tax compliance, and monthly payouts.",
    quickQuestions: [
      "How do HR admins run monthly payroll?",
      "What is the payroll simulation step?",
      "How are statutory deductions (PF, Tax) calculated?",
      "How do I export bank payout transfer sheets?",
    ],
    topics: [
      {
        keywords: ["run payroll", "process salary", "generate payslips", "batch", "payroll cycle"],
        answer:
          "To process monthly payroll (HR Admins):\n1. Navigate to **Payroll**.\n2. Select the current pay month.\n3. The system automatically fetches attendance, unpaid leaves (LOP), and approved bonuses.\n4. Click **'Run Payroll Simulation'** to verify net pay and gross totals across all employees.\n5. Click **'Lock & Finalize'** to generate tamper-proof payslips and update employee records.",
        action: { label: "Open Payroll Console", url: "/workspace/payroll" },
      },
      {
        keywords: ["simulation", "preview payroll", "verify salary", "pre-check"],
        answer:
          "The **Payroll Simulation** feature calculates expected payouts without committing changes to the database. It alerts you to any anomalies (negative net pay, missing bank account details, or unregularized absences) so you can fix them before final disbursement.",
        action: { label: "Run Simulation", url: "/workspace/payroll" },
      },
      {
        keywords: ["deductions", "pf", "provident fund", "tax", "tds", "professional tax", "pt"],
        answer:
          "Statutory deductions in TeamHub HRMS:\n- **Provident Fund (PF)**: 12% of Basic Salary.\n- **Professional Tax (PT)**: State-regulated tier deduction (e.g. ₹200/month).\n- **TDS / Income Tax**: Deducted based on selected tax regime.\n- Formulas are customizable under **Settings -> Payroll**.",
        action: { label: "Manage Salary Templates", url: "/workspace/settings/payroll" },
      },
      {
        keywords: ["bank export", "bank transfer", "payout file", "neft", "salary disbursement"],
        answer:
          "Once payroll is finalized:\n1. Click **'Download Bank Payout File'** on the finalized payroll page.\n2. Choose your bank format (Excel/CSV with Account Number, Beneficiary Name, IFSC, Amount).\n3. Upload this batch file directly to your corporate banking portal for NEFT/RTGS salary transfers.",
        action: { label: "Go to Payroll", url: "/workspace/payroll" },
      },
    ],
  },
  {
    id: "my-payslips",
    name: "My Payslips (Employee View)",
    path: "/workspace/my-payslips",
    summary: "Download certified salary slips, review compensation breakdown, and view tax certificates.",
    quickQuestions: [
      "Where can I download my payslip PDF?",
      "How do I understand my gross vs net salary?",
    ],
    topics: [
      {
        keywords: ["payslip", "download payslip", "salary slip", "salary receipt", "pdf payslip"],
        answer:
          "To view and download your payslip:\n1. Go to **My Payslips** in the sidebar (or visit your Profile).\n2. Filter by month and year.\n3. Click the **'Download PDF'** icon on any finalized month to save a formal payslip with company letterhead, earnings breakdown, and deductions.",
        action: { label: "View My Payslips", url: "/workspace/my-payslips" },
      },
      {
        keywords: ["gross", "net", "take home", "earnings", "breakdown", "ctc vs take home"],
        answer:
          "Understanding your payslip calculation:\n- **Gross Earnings**: Basic + House Rent Allowance (HRA) + Conveyance + Medical + Special Allowances.\n- **Total Deductions**: PF (12% of Basic) + Professional Tax + TDS (Income Tax) + LOP (Unpaid Leaves).\n- **Net Salary (Take-Home)** = Gross Earnings minus Total Deductions.",
        action: { label: "Inspect My Payslips", url: "/workspace/my-payslips" },
      },
    ],
  },
  {
    id: "recruitment",
    name: "Recruitment & Jobs",
    path: "/workspace/recruitment",
    summary: "Post job openings, track candidate pipeline, schedule interviews, and send offers.",
    quickQuestions: [
      "How do I post a new job vacancy?",
      "How does the candidate pipeline Kanban board work?",
      "How do I schedule candidate interviews?",
      "How do I convert a hired candidate into an employee?",
    ],
    topics: [
      {
        keywords: ["job", "post job", "opening", "create vacancy", "new requisition", "careers"],
        answer:
          "To post a new job opening:\n1. Go to **Recruitment**.\n2. Click the **'Create Job Opening'** button.\n3. Enter Job Title, Department, Workplace Type (Remote / Hybrid / Onsite), and Salary Range.\n4. Define key responsibilities and qualifications.\n5. Click **Publish**. The vacancy immediately appears on your public `/careers` portal.",
        action: { label: "Open Recruitment Board", url: "/workspace/recruitment" },
      },
      {
        keywords: ["candidate", "pipeline", "kanban", "stages", "move candidate", "screening"],
        answer:
          "The recruitment pipeline is a drag-and-drop Kanban workflow with 5 standard stages:\n1. **Applied**: Newly submitted applications.\n2. **Screening**: Initial recruiter review.\n3. **Interview**: Panel assignments, technical tests, and scorecard rating.\n4. **Offered**: Compensation approved and offer letter dispatched.\n5. **Hired**: Candidate accepted offer and is ready for onboarding.",
        action: { label: "View Pipeline Board", url: "/workspace/recruitment" },
      },
      {
        keywords: ["convert", "hire", "offer acceptance", "convert to employee", "onboarding transfer"],
        answer:
          "Converting a candidate to a full employee:\n1. Move the candidate to the **Hired** column.\n2. Click **'Convert to Onboarding'**.\n3. The system pre-fills their name, email, phone, and offered salary into the employee database.\n4. An onboarding portal invite is dispatched to the candidate so they can submit IDs and bank details prior to Day 1.",
        action: { label: "Go to Onboarding", url: "/workspace/onboarding" },
      },
    ],
  },
  {
    id: "onboarding",
    name: "Employee Onboarding",
    path: "/workspace/onboarding",
    summary: "Coordinate pre-boarding tasks, document collection, IT provisioning, and orientation.",
    quickQuestions: [
      "What is the onboarding checklist?",
      "How do we track onboarding completion progress?",
    ],
    topics: [
      {
        keywords: ["onboarding", "pre-boarding", "welcome", "checklist", "new joiner", "orientation"],
        answer:
          "The Onboarding module manages all milestones before and during a new hire's first 90 days:\n- **Step 1: Welcome & Profile**: Employee fills personal and emergency contact details.\n- **Step 2: Statutory & Bank Details**: Collection of PAN, Aadhaar/SSN, and Bank Account IFSC.\n- **Step 3: Document Verification**: Uploading educational certificates and signed appointment letters.\n- **Step 4: IT & Equipment**: Provisioning laptop, corporate email, and software licenses.\n- **Step 5: Buddy & Manager Orientation**: Scheduled intro meetings.",
        action: { label: "Go to Onboarding", url: "/workspace/onboarding" },
      },
    ],
  },
  {
    id: "resignation",
    name: "Resignation & Offboarding",
    path: "/workspace/resignation",
    summary: "Manage voluntary resignations, notice periods, multi-department clearances, and final settlement.",
    quickQuestions: [
      "How do employees submit a resignation request?",
      "What are the 4 exit clearance departments?",
      "How is the Full & Final (FnF) settlement handled?",
    ],
    topics: [
      {
        keywords: ["resign", "resignation", "quit", "leave company", "notice", "submit resignation"],
        answer:
          "To submit a resignation request (Employee):\n1. Navigate to **Resignation**.\n2. Click **'Submit Resignation'**.\n3. Choose your intended Last Working Day (LWD) based on your contract's notice period.\n4. Provide the formal reason and transition notes.\n5. Click **Submit**. Your manager and HR receive an immediate notification.",
        action: { label: "Open Resignation Desk", url: "/workspace/resignation" },
      },
      {
        keywords: ["clearance", "exit clearance", "it clearance", "finance clearance", "handover", "laptop return"],
        answer:
          "TeamHub HRMS requires multi-department exit clearances before offboarding:\n1. **IT Clearance**: Return of company laptop, access revoke, and security sign-off.\n2. **Finance Clearance**: Travel expense claims settled, corporate credit card cleared.\n3. **HR Clearance**: Exit interview completed, non-disclosure agreement (NDA) reaffirmed.\n4. **Admin Clearance**: ID badge and physical office access cards returned.",
        action: { label: "Manage Clearances", url: "/workspace/resignation" },
      },
      {
        keywords: ["fnf", "full and final", "settlement", "gratuity", "leave encashment", "exit payroll"],
        answer:
          "**Full & Final (FnF) Settlement**:\nOnce all clearances are signed off, the payroll module calculates the final settlement:\n- Unused Earned Leave balance encashment.\n- Pro-rata salary for days worked in the final month.\n- Gratuity calculation (if eligible by tenure).\n- Deductions for notice shortfall or unreturned assets.",
        action: { label: "Go to Payroll", url: "/workspace/payroll" },
      },
    ],
  },
  {
    id: "training",
    name: "Training & Career Development",
    path: "/workspace/training",
    summary: "Assign skill plans, manage training cohorts, assess competencies, and track certifications.",
    quickQuestions: [
      "How do I create and assign a training plan?",
      "Does completing training automatically promote an employee?",
    ],
    topics: [
      {
        keywords: ["training", "create plan", "course", "cohort", "assign training", "curriculum"],
        answer:
          "To set up a training plan (HR / Department Managers):\n1. Navigate to **Training**.\n2. Click **'Create Training Plan'**.\n3. Specify Category and Target Competency.\n4. Define sessions, materials, trainer, and enroll individual employees or entire cohorts.\n5. Enrolled employees can access their learning roadmap and schedule directly from their dashboard.",
        action: { label: "Open Training Module", url: "/workspace/training" },
      },
      {
        keywords: ["promotion", "automatic promotion", "career", "position change", "strict non-automatic"],
        answer:
          "**Strict Non-Automatic Promotion Rule**:\nUnder TeamHub HRMS governance, completing a training program or earning a top assessment score **never automatically changes an employee's designation, grade, or salary**.\n\nCareer outcomes require a separate, governed **Employee Position Change** workflow that must be reviewed and approved by Department Heads, HR, and Finance.",
        action: { label: "View Training Governance", url: "/workspace/training" },
      },
    ],
  },
  {
    id: "settings-payroll",
    name: "Salary Templates & Payroll Settings",
    path: "/workspace/settings/payroll",
    summary: "Configure CTC calculation percentages (Basic, HRA, PF), allowances, and state tax rules.",
    quickQuestions: [
      "How do I configure salary structure templates?",
    ],
    topics: [
      {
        keywords: ["salary template", "ctc template", "basic percent", "hra percent", "structure", "configure salary"],
        answer:
          "To configure salary templates:\n1. Head to **Settings -> Payroll** (or `/workspace/settings/payroll`).\n2. Click **'+ Add Template'** or edit an existing salary blueprint.\n3. Configure default proportions:\n   - **Basic Salary**: 40% to 50% of CTC.\n   - **HRA**: 20% to 25% of CTC.\n   - **Provident Fund (PF)**: 12% of Basic.\n   - **Conveyance & Medical**: Fixed amounts (e.g. ₹1600 & ₹1250).\n   - **Professional Tax**: Fixed tier deduction (e.g. ₹200).\n4. Save template. You can link this template to designations during hiring.",
        action: { label: "Manage Salary Templates", url: "/workspace/settings/payroll" },
      },
    ],
  },
  {
    id: "settings-audit",
    name: "Audit Logs & Security",
    path: "/workspace/settings/audit-logs",
    summary: "Monitor chronological system actions, security changes, approvals, and user telemetry.",
    quickQuestions: [
      "Where can I view system audit logs?",
    ],
    topics: [
      {
        keywords: ["audit", "audit log", "security log", "history", "who did what", "track changes", "telemetry"],
        answer:
          "Audit Logs feature:\n1. Visit **Settings -> Audit Logs** (or `/workspace/settings/audit-logs`).\n2. The system maintains an immutable chronological log of actions:\n   - **CREATE**, **UPDATE**, **DELETE**, **APPROVE / REJECT**.\n3. Each entry logs User Identity, Action Badge, Target Entity, IP Address, Device Type, and ISO Timestamp.",
        action: { label: "View Audit Logs", url: "/workspace/settings/audit-logs" },
      },
    ],
  },
  {
    id: "support",
    name: "Help & Support Tickets",
    path: "/workspace/support",
    summary: "Raise internal IT, HR, or workplace tickets and track their resolution.",
    quickQuestions: [
      "How do I raise an HR or IT ticket?",
      "How to check the status of my ticket?",
    ],
    topics: [
      {
        keywords: ["ticket", "raise ticket", "issue", "it support", "hr query", "help desk", "problem"],
        answer:
          "To create an internal help ticket:\n1. Navigate to **Support**.\n2. Click **'Create Ticket'**.\n3. Pick the category (Hardware/IT, HR Query, Payroll Dispute, Facilities, Software Access).\n4. Select priority level (Low, Medium, High) and describe the problem.\n5. Click **Submit Ticket**. You will receive notifications as the assigned support agent updates the ticket status.",
        action: { label: "Open Support Desk", url: "/workspace/support" },
      },
    ],
  },
];

const ACRONYMS_MAP: Record<string, string[]> = {
  ctc: ["salary", "payroll", "template", "compensation"],
  pf: ["provident fund", "deductions", "payroll"],
  hra: ["house rent", "allowance", "salary"],
  lop: ["loss of pay", "unpaid", "deduction", "leave"],
  lwd: ["last working day", "resignation", "notice period"],
  kyc: ["document", "identity", "passport", "aadhar", "pan"],
  csv: ["bulk", "import", "export", "excel"],
  fnf: ["full and final", "settlement", "resignation"],
  rbac: ["roles", "permissions", "access control"],
  tds: ["tax", "deductions", "income tax"],
  pt: ["professional tax", "deductions"],
  wo: ["weekly off", "schedule", "roster"],
};

export function matchHRMSKnowledge(
  query: string,
  currentRoute: string = "",
  role: string = "EMPLOYEE"
): CopilotResponse {
  const cleanQuery = (query || "").trim().toLowerCase();

  const sortedModules = [...HRMS_MODULE_GUIDES].sort(
    (a, b) => b.path.length - a.path.length
  );
  const currentModule = sortedModules.find((m) =>
    currentRoute.startsWith(m.path)
  );

  const isGreeting =
    !cleanQuery ||
    ["hi", "hello", "hey", "help", "who are you", "what can you do", "start", "guide me"].includes(
      cleanQuery
    );

  if (isGreeting) {
    if (currentModule) {
      return {
        reply: `👋 **Hi there! I am Gpilot, your TeamHub HRMS assistant.**\n\nYou are currently on the **${currentModule.name}** page.\n\n${currentModule.summary}\n\nHere are the most common tasks you can do here:`,
        suggestedActions: [
          { label: `Explore ${currentModule.name}`, url: currentModule.path },
        ],
        suggestedQuestions: currentModule.quickQuestions,
        source: "knowledge_base",
      };
    }

    return {
      reply: `👋 **Hello! I am Gpilot, your TeamHub AI Assistant.**\n\nI can guide you step-by-step through any task in the HRMS—from onboarding and leave applications to payroll runs, shifts, and document verification.\n\nWhat would you like help with today?`,
      suggestedActions: [
        { label: "Employees Directory", url: "/workspace/employees" },
        { label: "Apply for Leave", url: "/workspace/leave" },
        { label: "Clock Attendance", url: "/workspace/attendance" },
        { label: "My Payslips", url: "/workspace/my-payslips" },
      ],
      suggestedQuestions: [
        "How do I add a new employee?",
        "How do I apply for leave?",
        "Where can I find my payslips?",
        "How do I configure salary templates?",
      ],
      source: "knowledge_base",
    };
  }

  let expandedQuery = cleanQuery;
  const words = cleanQuery.split(/\s+/);
  for (const w of words) {
    if (ACRONYMS_MAP[w]) {
      expandedQuery += " " + ACRONYMS_MAP[w].join(" ");
    }
  }

  let bestMatch: {
    score: number;
    answer: string;
    action?: CopilotAction;
    module: ModuleGuide;
  } | null = null;

  for (const mod of HRMS_MODULE_GUIDES) {
    for (const topic of mod.topics) {
      let score = 0;
      for (const kw of topic.keywords) {
        if (expandedQuery.includes(kw)) {
          score += kw.split(" ").length * 4;
        }
      }

      if (currentRoute.startsWith(mod.path)) {
        score += 3;
      }

      if (score > (bestMatch?.score || 0)) {
        bestMatch = {
          score,
          answer: topic.answer,
          action: topic.action,
          module: mod,
        };
      }
    }
  }

  if (bestMatch && bestMatch.score > 0) {
    const otherQuestions = bestMatch.module.quickQuestions.filter(
      (q) => !cleanQuery.includes(q.toLowerCase().slice(0, 10))
    );

    return {
      reply: bestMatch.answer,
      suggestedActions: bestMatch.action ? [bestMatch.action] : undefined,
      suggestedQuestions: otherQuestions.slice(0, 3),
      source: "knowledge_base",
    };
  }

  const defaultQuestions = currentModule
    ? currentModule.quickQuestions
    : [
        "How do I add an employee?",
        "How do I apply for leave?",
        "How do I run monthly payroll?",
        "How do exit clearances work?",
      ];

  return {
    reply: `I couldn't find an exact match for **"${query}"**, but here are key modules you can explore in TeamHub HRMS:\n\n- **Employees & Directory**: Add employees, import from CSV/Excel, verify KYC documents.\n- **Leave & Attendance**: Apply for time off, manage shifts, clock in/out, and regularize punches.\n- **Payroll & Payslips**: Configure CTC templates, run monthly payroll, and download payslip PDFs.\n- **Recruitment & Onboarding**: Post job openings, manage candidate pipeline, and assign new joiner checklists.\n- **Training & Career**: Enroll cohorts, track skill assessments, and manage certifications.\n- **Resignation & Clearances**: Notice period calculation and multi-department exit sign-offs.\n- **Settings**: Company profile, holiday calendar, salary templates, and security audit logs.\n\nClick any suggested question below or pick a module to navigate!`,
    suggestedActions: [
      { label: "Go to Dashboard", url: "/workspace/dashboard" },
      { label: "Help & Support Desk", url: "/workspace/support" },
      { label: "Company Settings", url: "/workspace/settings" },
    ],
    suggestedQuestions: defaultQuestions,
    source: "knowledge_base",
  };
}

