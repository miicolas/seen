import { AuthContext } from "@/hooks/use-auth-context";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { PropsWithChildren, useEffect, useState } from "react";

export default function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
