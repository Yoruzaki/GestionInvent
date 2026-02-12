import "next-auth";

declare module "next-auth" {
  interface User {
    id?: string;
    role?: string;
    employeeId?: string;
  }
  interface Session {
    user: User & { id?: string; role?: string; employeeId?: string };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    employeeId?: string;
  }
}
