export const EXPENSE_CATEGORIES = [
  "Housing", "Food & Groceries", "Transportation", "Utilities",
  "Health & Insurance", "Subscriptions", "Personal Care",
  "Entertainment", "Shopping", "Education", "Childcare", "Debt", "Bills", "Other",
];

export const FREQUENCIES = ["weekly", "biweekly", "monthly", "yearly"] as const;

export const INVESTMENT_TYPES = [
  "Stocks", "ETF", "Index Fund", "Bonds", "Crypto", "Real Estate",
  "Retirement (401k/IRA)", "Other",
];

export const BUREAUS: { id: "experian" | "equifax" | "transunion"; name: string }[] = [
  { id: "experian", name: "Experian" },
  { id: "equifax", name: "Equifax" },
  { id: "transunion", name: "TransUnion" },
];

export const FINANCE_TABS = [
  { id: "income", label: "Income" },
  { id: "expenses", label: "Expenses" },
  { id: "bills", label: "Bills" },
  { id: "goals", label: "Goals" },
  { id: "investments", label: "Investments" },
  { id: "credit", label: "Credit" },
];
