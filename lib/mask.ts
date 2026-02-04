export function maskEmail(email: string): string {
  if (!email) return "";
  const name = email.split("@")[0];
  if (name.length <= 2) return name[0] + "*";
  return name.slice(0, 2) + "*".repeat(name.length - 2);
}
