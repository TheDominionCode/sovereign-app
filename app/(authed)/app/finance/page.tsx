import { ComingSoon } from "../_components/coming-soon";

export default function FinancePage() {
  return (
    <ComingSoon
      title="Personal Finance"
      intent="Income, expenses, bills, savings goals, investments, and credit scores from all three bureaus."
      tables={[
        "pf_income",
        "pf_expenses",
        "pf_savings_goals",
        "pf_investments",
        "pf_credit_scores",
      ]}
    />
  );
}
