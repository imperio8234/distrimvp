import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      companyId: string | null;   // null para SUPER_ADMIN
      companyName: string | null; // null para SUPER_ADMIN
    };
  }
}
