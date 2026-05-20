import { ComingSoon } from "../_components/coming-soon";

export default function CredentialsPage() {
  return (
    <ComingSoon
      title="Logins & Passwords"
      intent="A private vault for the credentials you actually use. RLS protects rows; client-side encryption is the next step before storing high-sensitivity entries."
      tables={["credentials"]}
    />
  );
}
