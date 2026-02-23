/**
 * Convert a camelCase or snake_case identifier to Title Case.
 *
 * Examples:
 *   "firstName"   → "First Name"
 *   "email"       → "Email"
 *   "phone_number"→ "Phone Number"
 *   "myFieldId"   → "My Field Id"
 */
export function titleCase(key: string): string {
  // Handle snake_case first
  const withSpaces = key
    .replace(/_/g, " ")
    // Insert space before uppercase letters that follow a lowercase letter or digit
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2");

  return withSpaces
    .split(" ")
    .map((word) => (word.length === 0 ? word : word[0]!.toUpperCase() + word.slice(1)))
    .join(" ");
}
