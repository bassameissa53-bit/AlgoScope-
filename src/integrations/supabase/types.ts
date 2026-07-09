export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analyses: {
        Row: {
          analysis_notes: string | null
          chart_image_url: string
          confidence_score: number
          created_at: string
          direction: string
          entry_price: string
          id: string
          stop_loss: string
          take_profit_1: string
          take_profit_2: string | null
          take_profit_3: string | null
          trading_pair: string | null
          user_id: string
        }
        Insert: {
          analysis_notes?: string | null
          chart_image_url: string
          confidence_score: number
          created_at?: string
          direction: string
          entry_price: string
          id?: string
          stop_loss: string
          take_profit_1: string
          take_profit_2?: string | null
          take_profit_3?: string | null
          trading_pair?: string | null
          user_id: string
        }
        Update: {
          analysis_notes?: string | null
          chart_image_url?: string
          confidence_score?: number
          created_at?: string
          direction?: string
          entry_price?: string
          id?: string
          stop_loss?: string
          take_profit_1?: string
          take_profit_2?: string | null
          take_profit_3?: string | null
          trading_pair?: string | null
          user_id?: string
        }
        Relationships: []
      }
      course_videos: {
        Row: {
          course_id: string
          created_at: string
          duration_seconds: number | null
          id: string
          sort_order: number
          title: string
          title_ar: string
          video_url: string
        }
        Insert: {
          course_id: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          sort_order?: number
          title: string
          title_ar?: string
          video_url: string
        }
        Update: {
          course_id?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          sort_order?: number
          title?: string
          title_ar?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_videos_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string
          created_at: string
          description: string | null
          description_ar: string | null
          duration_minutes: number
          emoji: string
          id: string
          lesson_count: number
          required_role: string
          sort_order: number
          thumbnail_url: string | null
          title: string
          title_ar: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          duration_minutes?: number
          emoji?: string
          id?: string
          lesson_count?: number
          required_role?: string
          sort_order?: number
          thumbnail_url?: string | null
          title: string
          title_ar?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          duration_minutes?: number
          emoji?: string
          id?: string
          lesson_count?: number
          required_role?: string
          sort_order?: number
          thumbnail_url?: string | null
          title?: string
          title_ar?: string
        }
        Relationships: []
      }
      daily_usage: {
        Row: {
          analysis_count: number
          id: string
          usage_date: string
          user_id: string
        }
        Insert: {
          analysis_count?: number
          id?: string
          usage_date?: string
          user_id: string
        }
        Update: {
          analysis_count?: number
          id?: string
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      liveness_sessions: {
        Row: {
          attempt_number: number
          confidence: number | null
          created_at: string
          device_id: string | null
          failure_reason: string | null
          frame_hash: string | null
          id: string
          ip_address: unknown
          status: string
          user_id: string
        }
        Insert: {
          attempt_number?: number
          confidence?: number | null
          created_at?: string
          device_id?: string | null
          failure_reason?: string | null
          frame_hash?: string | null
          id?: string
          ip_address?: unknown
          status: string
          user_id: string
        }
        Update: {
          attempt_number?: number
          confidence?: number | null
          created_at?: string
          device_id?: string | null
          failure_reason?: string | null
          frame_hash?: string | null
          id?: string
          ip_address?: unknown
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          banned_at: string | null
          banned_reason: string | null
          created_at: string
          full_name: string
          id: string
          is_banned: boolean
          is_verified: boolean
          liveness_attempts: number
          liveness_locked_until: string | null
          phone_number: string | null
          subscription_tier: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          banned_at?: string | null
          banned_reason?: string | null
          created_at?: string
          full_name: string
          id?: string
          is_banned?: boolean
          is_verified?: boolean
          liveness_attempts?: number
          liveness_locked_until?: string | null
          phone_number?: string | null
          subscription_tier?: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          banned_at?: string | null
          banned_reason?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_banned?: boolean
          is_verified?: boolean
          liveness_attempts?: number
          liveness_locked_until?: string | null
          phone_number?: string | null
          subscription_tier?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      user_course_access: {
        Row: {
          course_id: string
          granted_at: string
          granted_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          course_id: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          course_id?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_access_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          device_id: string
          device_model: string | null
          first_seen: string | null
          id: string
          is_primary: boolean | null
          is_trusted: boolean | null
          last_seen: string | null
          user_id: string
        }
        Insert: {
          device_id: string
          device_model?: string | null
          first_seen?: string | null
          id?: string
          is_primary?: boolean | null
          is_trusted?: boolean | null
          last_seen?: string | null
          user_id: string
        }
        Update: {
          device_id?: string
          device_model?: string | null
          first_seen?: string | null
          id?: string
          is_primary?: boolean | null
          is_trusted?: boolean | null
          last_seen?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      alert_severity: "low" | "medium" | "high" | "critical"
      alert_type:
        | "concurrent_login"
        | "brute_force"
        | "new_ip_login"
        | "vpn_detected"
      app_role: "admin" | "user"
      ban_entity_type: "user_id" | "device_id" | "ip_address"
      sub_plan:
        | "free"
        | "premium_monthly"
        | "premium_yearly"
        | "premium_lifetime"
      sub_status: "active" | "expired" | "suspended" | "cancelled" | "trial"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      alert_severity: ["low", "medium", "high", "critical"],
      alert_type: [
        "concurrent_login",
        "brute_force",
        "new_ip_login",
        "vpn_detected",
      ],
      app_role: ["admin", "user"],
      ban_entity_type: ["user_id", "device_id", "ip_address"],
      sub_plan: [
        "free",
        "premium_monthly",
        "premium_yearly",
        "premium_lifetime",
      ],
      sub_status: ["active", "expired", "suspended", "cancelled", "trial"],
    },
  },
} as const
