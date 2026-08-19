export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      backup_prompts: {
        Row: {
          id: string
          prompt_text: string
        }
        Insert: {
          id?: string
          prompt_text: string
        }
        Update: {
          id?: string
          prompt_text?: string
        }
        Relationships: []
      }
      daily_prompts: {
        Row: {
          author_id: string
          id: string
          is_backup: boolean
          posted_at: string
          prompt_date: string
          prompt_text: string
          window_ends_at: string
        }
        Insert: {
          author_id: string
          id?: string
          is_backup?: boolean
          posted_at?: string
          prompt_date: string
          prompt_text: string
          window_ends_at: string
        }
        Update: {
          author_id?: string
          id?: string
          is_backup?: boolean
          posted_at?: string
          prompt_date?: string
          prompt_text?: string
          window_ends_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_prompts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          token: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          token: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_archive: {
        Row: {
          archived_at: string
          author_id: string | null
          caption: string | null
          id: string
          is_top_of_day: boolean
          original_post_id: string
          photo_path: string | null
          post_type: string
          posted_at: string
          reaction_count: number
        }
        Insert: {
          archived_at?: string
          author_id?: string | null
          caption?: string | null
          id?: string
          is_top_of_day?: boolean
          original_post_id: string
          photo_path?: string | null
          post_type: string
          posted_at: string
          reaction_count?: number
        }
        Update: {
          archived_at?: string
          author_id?: string | null
          caption?: string | null
          id?: string
          is_top_of_day?: boolean
          original_post_id?: string
          photo_path?: string | null
          post_type?: string
          posted_at?: string
          reaction_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "post_archive_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          caption: string | null
          created_at: string
          daily_prompt_id: string | null
          id: string
          is_time_capsule: boolean
          photo_path: string | null
          post_type: string
          unlock_at: string | null
        }
        Insert: {
          author_id: string
          caption?: string | null
          created_at?: string
          daily_prompt_id?: string | null
          id?: string
          is_time_capsule?: boolean
          photo_path?: string | null
          post_type: string
          unlock_at?: string | null
        }
        Update: {
          author_id?: string
          caption?: string | null
          created_at?: string
          daily_prompt_id?: string | null
          id?: string
          is_time_capsule?: boolean
          photo_path?: string | null
          post_type?: string
          unlock_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_daily_prompt_id_fkey"
            columns: ["daily_prompt_id"]
            isOneToOne: false
            referencedRelation: "daily_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          animal_adjective: string | null
          animal_nickname: string | null
          created_at: string
          display_name: string
          id: string
          is_admin: boolean
          last_prompt_master_date: string | null
          prompt_fire_streak: number
          prompt_last_fire_date: string | null
          spirit_animal: string
          username: string
        }
        Insert: {
          animal_adjective?: string | null
          animal_nickname?: string | null
          created_at?: string
          display_name: string
          id: string
          is_admin?: boolean
          last_prompt_master_date?: string | null
          prompt_fire_streak?: number
          prompt_last_fire_date?: string | null
          spirit_animal: string
          username: string
        }
        Update: {
          animal_adjective?: string | null
          animal_nickname?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_admin?: boolean
          last_prompt_master_date?: string | null
          prompt_fire_streak?: number
          prompt_last_fire_date?: string | null
          spirit_animal?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_spirit_animal_fkey"
            columns: ["spirit_animal"]
            isOneToOne: false
            referencedRelation: "spirit_animals"
            referencedColumns: ["key"]
          },
        ]
      }
      prompt_assignments: {
        Row: {
          assigned_at: string
          deadline_at: string
          fulfilled: boolean
          id: string
          prompt_date: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          deadline_at: string
          fulfilled?: boolean
          id?: string
          prompt_date: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          deadline_at?: string
          fulfilled?: boolean
          id?: string
          prompt_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      setup_lock: {
        Row: {
          claimed_at: string
          claimed_by: string | null
          id: number
        }
        Insert: {
          claimed_at?: string
          claimed_by?: string | null
          id?: number
        }
        Update: {
          claimed_at?: string
          claimed_by?: string | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "setup_lock_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spirit_animals: {
        Row: {
          icon_url: string | null
          image_path: string | null
          key: string
          label: string
          personality_blurb: string | null
          taken_by: string | null
        }
        Insert: {
          icon_url?: string | null
          image_path?: string | null
          key: string
          label: string
          personality_blurb?: string | null
          taken_by?: string | null
        }
        Update: {
          icon_url?: string | null
          image_path?: string | null
          key?: string
          label?: string
          personality_blurb?: string | null
          taken_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spirit_animals_taken_by_fkey"
            columns: ["taken_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spirit_crown: {
        Row: {
          achieved_at: string | null
          holder_id: string | null
          id: number
        }
        Insert: {
          achieved_at?: string | null
          holder_id?: string | null
          id?: number
        }
        Update: {
          achieved_at?: string | null
          holder_id?: string | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "spirit_crown_holder_id_fkey"
            columns: ["holder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      statuses: {
        Row: {
          status_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          status_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          status_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "statuses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      streaks: {
        Row: {
          current_streak: number
          last_active_date: string | null
          longest_streak: number
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_active_date?: string | null
          longest_streak?: number
          user_id: string
        }
        Update: {
          current_streak?: number
          last_active_date?: string | null
          longest_streak?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_recaps: {
        Row: {
          generated_at: string
          id: string
          most_active_user_id: string | null
          summary_json: Json
          top_post_id: string | null
          week_end: string
          week_start: string
        }
        Insert: {
          generated_at?: string
          id?: string
          most_active_user_id?: string | null
          summary_json: Json
          top_post_id?: string | null
          week_end: string
          week_start: string
        }
        Update: {
          generated_at?: string
          id?: string
          most_active_user_id?: string | null
          summary_json?: Json
          top_post_id?: string | null
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_recaps_most_active_user_id_fkey"
            columns: ["most_active_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_recaps_top_post_id_fkey"
            columns: ["top_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
