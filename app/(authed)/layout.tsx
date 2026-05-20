import { requireActiveSubscription } from "@/lib/billing/subscription";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Redirects to /login if signed out, /pricing if no active or trialing sub.
  await requireActiveSubscription();
  return <>{children}</>;
}
