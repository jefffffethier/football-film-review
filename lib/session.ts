import { SessionOptions } from "iron-session";

export type Role = "view" | "edit";

export interface SessionData {
  role?: Role;
}

export const sessionOptions: SessionOptions = {
  cookieName: "cfl-session",
  password: process.env.SESSION_SECRET!,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};
