import { redirect } from "next/navigation";

export default function EntitlementsRedirect() {
  redirect("/platform-admin/subscriptions/plans");
}

