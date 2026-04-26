import { type Session } from "@supabase/supabase-js";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "./supabase";

type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  backloggdUsername: string | null;
  signInWithPassword: (args: {
    email: string;
    password: string;
  }) => Promise<void>;
  signUp: (args: {
    email: string;
    password: string;
    username: string;
  }) => Promise<void>;
  setBackloggdUsername: (username: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.warn("supabase.auth.getSession() failed", error);
        }
        setSession(data.session ?? null);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
      },
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const backloggdUsername =
    (session?.user?.user_metadata?.backloggdUsername as string | undefined) ??
    (session?.user?.user_metadata?.username as string | undefined) ??
    null;

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      session,
      backloggdUsername,
      signInWithPassword: async ({ email, password }) => {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      },
      signUp: async ({ email, password, username }) => {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              backloggdUsername: username.trim(),
            },
          },
        });
        if (error) throw error;
      },
      setBackloggdUsername: async (username) => {
        const trimmedUsername = username.trim();
        const { error } = await supabase.auth.updateUser({
          data: {
            backloggdUsername: trimmedUsername,
          },
        });
        if (error) throw error;

        const { data, error: refreshError } = await supabase.auth.getSession();
        if (refreshError) throw refreshError;
        setSession(data.session ?? null);
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
    }),
    [backloggdUsername, loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider />");
  return ctx;
}
