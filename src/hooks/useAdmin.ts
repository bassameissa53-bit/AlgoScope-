import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const ADMIN_EMAIL = "bassam.a.eissa@gmail.com";

export function useAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (authLoading) return;
      
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Check if user email matches admin email
      if (user.email === ADMIN_EMAIL) {
        // Check if admin role exists in database
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (roleData) {
          setIsAdmin(true);
        } else {
          // Auto-assign admin role for the designated email
          const { error } = await supabase
            .from("user_roles")
            .insert({ user_id: user.id, role: "admin" });
          
          if (!error) {
            setIsAdmin(true);
          }
        }
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
    };

    checkAdmin();
  }, [user, authLoading]);

  return { isAdmin, loading: loading || authLoading };
}
