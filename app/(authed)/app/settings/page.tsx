import Link from "next/link";
import { ComingSoon } from "../_components/coming-soon";

export default function SettingsPage() {
  return (
    <div>
      <ComingSoon
        title="Settings"
        intent="Profile, accent color, language, week start, currency, notification preferences."
        tables={["user_preferences"]}
      />
      <div className="max-w-3xl mx-auto px-6 lg:px-10 pb-10 -mt-4">
        <p className="text-sm text-stone">
          For now, manage your subscription on the{" "}
          <Link href="/billing" className="text-forest underline">
            billing page
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
