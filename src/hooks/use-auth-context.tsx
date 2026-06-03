import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext } from "react";

export type AuthData = {
  session?: Session | null;
  user?: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
};

export const AuthContext = createContext<AuthData>({
  session: undefined,
  user: undefined,
  isLoading: true,
  isLoggedIn: false,
});

export const useAuthContext = () => useContext(AuthContext);
