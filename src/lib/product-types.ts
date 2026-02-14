/** Product type: equipment (stays) vs consumable (gets used up) */
export const PRODUCT_TYPES = ["equipment", "consumable"] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

/** Get allowed product types for an admin. null/empty = all types. */
export function getAllowedTypes(allowedProductTypes: string | null | undefined): ProductType[] | null {
  if (!allowedProductTypes || allowedProductTypes.trim() === "") return null; // all
  const parts = allowedProductTypes.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const valid = parts.filter((p) => p === "equipment" || p === "consumable");
  if (valid.length === 0) return null;
  return valid as ProductType[];
}

/** Check if admin can manage a product type */
export function canManageType(allowedTypes: ProductType[] | null, productType: string): boolean {
  if (!allowedTypes) return true; // super admin: all
  return allowedTypes.includes(productType as ProductType);
}
