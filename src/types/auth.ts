export type UserRole = "individual_buyer" | "seller" | "corporate_buyer";
export type AuthMethod = "phone" | "email";
export type AuthMode = "login" | "register";

export interface User {
  id: string;
  role: UserRole | "admin" | "delivery_agent";
  fullName: string;
  phone?: string | null;
  email?: string | null;
}
