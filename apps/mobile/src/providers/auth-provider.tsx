import { AuthContext } from "@/hooks/use-auth-context";
import { authClient } from "@/lib/auth-client";
import { PropsWithChildren } from "react";

export default function AuthProvider({ children }: PropsWithChildren) {
  const { data, isPending } = authClient.useSession();

  return (
    <AuthContext.Provider
      value={{
        session: data?.session ?? null,
        user: data?.user ?? null,
        isLoading: isPending,
        isLoggedIn: !!data?.session,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
