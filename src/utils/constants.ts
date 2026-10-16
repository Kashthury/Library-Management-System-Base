export const formatCurrency = (amount: number | null | undefined) => {
  if (amount == null || !Number.isFinite(amount)) return "—";
  return `Rs. ${amount.toLocaleString("en-LK")}`;
};
