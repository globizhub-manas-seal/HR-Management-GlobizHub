import { redirect } from "next/navigation";

export default function ActiveOrganizationsPage() {
  redirect("/platform-admin/organizations?status=VERIFIED");
}

