import { redirect } from "next/navigation";

export default function SuspendedOrganizationsPage() {
  redirect("/platform-admin/organizations?status=SUSPENDED");
}

