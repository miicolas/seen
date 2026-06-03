import { AuthContext } from "@/hooks/use-auth-context";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { PropsWithChildren, useEffect, useState } from "react";

export default function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Restore any persisted session on startup.
    supabase.auth.getSession().then(({ data, error }) => {
      console.log("[auth] getSession →", {
        hasSession: !!data.session,
        email: data.session?.user.email ?? null,
        error: error?.message ?? null,
      });
      setSession(data.session);
      setIsLoading(false);
    });

    // Keep the session in sync (sign in / sign out / token refresh).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.log(
        "[auth] event →",
        event,
        "| email:",
        nextSession?.user.email ?? null
      );
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  console.log(
    "[auth] render → isLoggedIn:",
    !!session,
    "| email:",
    session?.user.email ?? null
  );

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isLoading,
        isLoggedIn: !!session,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
