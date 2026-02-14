import "next-auth";

declare module "next-auth" {
  interface User {
    id?: string;
    role?: string;
    employeeId?: string;
    allowedProductTypes?: string; // "equipment" | "consumable" | "equipment,consumable" | null = all
  }
  interface Session {
    user: User & { id?: string; role?: string; employeeId?: string; allowedProductTypes?: string };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    employeeId?: string;
    allowedProductTypes?: string;
  }
}
