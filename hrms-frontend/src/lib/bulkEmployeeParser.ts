import * as XLSX from "xlsx";

export interface ParsedEmployeeRow {
  id: string; // temporary key for UI
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  role: string;
  isValid: boolean;
  validationError?: string;
}

export interface ParseResult {
  rows: ParsedEmployeeRow[];
  totalCount: number;
  validCount: number;
  invalidCount: number;
  fileName: string;
  fileSize: number;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Normalizes headers to known fields
 */
function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Parses an Excel (.xlsx, .xls) or CSV (.csv) file into structured employee records with validation.
 */
export async function parseEmployeeFile(file: File): Promise<ParseResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });

  // Read the first sheet
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("The uploaded file does not contain any readable sheets.");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  // Parse sheet to array of objects
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
    raw: false,
  });

  if (!rawRows || rawRows.length === 0) {
    throw new Error("The uploaded file is empty or has no data rows.");
  }

  const seenEmails = new Set<string>();
  const parsedRows: ParsedEmployeeRow[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    const normalizedRow: Record<string, string> = {};

    for (const [key, val] of Object.entries(raw)) {
      normalizedRow[normalizeKey(key)] = String(val).trim();
    }

    // Extract first name and last name
    let firstName =
      normalizedRow["firstname"] ||
      normalizedRow["fname"] ||
      normalizedRow["givenname"] ||
      "";
    let lastName =
      normalizedRow["lastname"] ||
      normalizedRow["lname"] ||
      normalizedRow["surname"] ||
      "";

    // Fallback if full name is provided under "name" or "fullname"
    if (!firstName && !lastName) {
      const fullName =
        normalizedRow["name"] ||
        normalizedRow["fullname"] ||
        normalizedRow["employeename"] ||
        "";
      if (fullName) {
        const parts = fullName.split(" ").filter(Boolean);
        firstName = parts[0] || "";
        lastName = parts.slice(1).join(" ") || "";
      }
    }

    // Extract email
    const email = (
      normalizedRow["email"] ||
      normalizedRow["emailaddress"] ||
      normalizedRow["workemail"] ||
      normalizedRow["mail"] ||
      ""
    ).toLowerCase();

    // Extract phone
    const phone =
      normalizedRow["phone"] ||
      normalizedRow["phonenumber"] ||
      normalizedRow["mobile"] ||
      normalizedRow["contact"] ||
      normalizedRow["cell"] ||
      "";

    // Extract department
    const department =
      normalizedRow["department"] ||
      normalizedRow["dept"] ||
      normalizedRow["division"] ||
      "";

    // Extract designation / role
    const designation =
      normalizedRow["designation"] ||
      normalizedRow["jobtitle"] ||
      normalizedRow["position"] ||
      normalizedRow["title"] ||
      "";

    const role =
      normalizedRow["role"] ||
      normalizedRow["systemrole"] ||
      "EMPLOYEE";

    // Validation
    let isValid = true;
    let validationError = "";

    if (!email) {
      isValid = false;
      validationError = "Email is required";
    } else if (!EMAIL_REGEX.test(email)) {
      isValid = false;
      validationError = "Invalid email format";
    } else if (seenEmails.has(email)) {
      isValid = false;
      validationError = "Duplicate email in file";
    }

    if (isValid && email) {
      seenEmails.add(email);
    }

    // Default names if missing
    if (!firstName && email) {
      firstName = email.split("@")[0] || "Team";
    }
    if (!lastName) {
      lastName = "Member";
    }

    parsedRows.push({
      id: `row-${i}-${Date.now()}`,
      firstName,
      lastName,
      email,
      phone,
      department,
      designation,
      role: role.toUpperCase().includes("HR")
        ? "HR_HEAD"
        : role.toUpperCase().includes("MANAGE")
        ? "MANAGER"
        : "EMPLOYEE",
      isValid,
      validationError,
    });
  }

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return {
    rows: parsedRows,
    totalCount: parsedRows.length,
    validCount,
    invalidCount,
    fileName: file.name,
    fileSize: file.size,
  };
}

/**
 * Sample template row definitions
 */
const SAMPLE_DATA = [
  {
    "First Name": "Alexander",
    "Last Name": "Wright",
    "Email": "alexander.wright@acmecorp.com",
    "Phone": "+1 (555) 234-5678",
    "Department": "IT",
    "Designation": "Senior Developer",
    "Role": "EMPLOYEE",
  },
  {
    "First Name": "Sophia",
    "Last Name": "Chen",
    "Email": "sophia.chen@acmecorp.com",
    "Phone": "+1 (555) 345-6789",
    "Department": "HR",
    "Designation": "HR Specialist",
    "Role": "HR_HEAD",
  },
  {
    "First Name": "Marcus",
    "Last Name": "Vance",
    "Email": "marcus.vance@acmecorp.com",
    "Phone": "+1 (555) 456-7890",
    "Department": "Finance",
    "Designation": "Financial Analyst",
    "Role": "EMPLOYEE",
  },
  {
    "First Name": "Elena",
    "Last Name": "Rostova",
    "Email": "elena.rostova@acmecorp.com",
    "Phone": "+1 (555) 567-8901",
    "Department": "Sales",
    "Designation": "Account Executive",
    "Role": "EMPLOYEE",
  },
  {
    "First Name": "David",
    "Last Name": "Kim",
    "Email": "david.kim@acmecorp.com",
    "Phone": "+1 (555) 678-9012",
    "Department": "Support",
    "Designation": "Support Lead",
    "Role": "MANAGER",
  },
];

/**
 * Downloads a sample Excel (.xlsx) template
 */
export function downloadSampleExcelTemplate() {
  const worksheet = XLSX.utils.json_to_sheet(SAMPLE_DATA);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 15 }, // First Name
    { wch: 15 }, // Last Name
    { wch: 32 }, // Email
    { wch: 20 }, // Phone
    { wch: 18 }, // Department
    { wch: 22 }, // Designation
    { wch: 15 }, // Role
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
  XLSX.writeFile(workbook, "employee_import_template.xlsx");
}

/**
 * Downloads a sample CSV (.csv) template
 */
export function downloadSampleCsvTemplate() {
  const worksheet = XLSX.utils.json_to_sheet(SAMPLE_DATA);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "employee_import_template.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
