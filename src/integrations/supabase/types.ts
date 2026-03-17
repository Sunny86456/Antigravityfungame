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
      ads_watched: {
        Row: {
          id: string
          user_id: string
          watched_at: string
        }
        Insert: {
          id?: string
          user_id: string
          watched_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          watched_at?: string
        }
        Relationships: []
      }
      chess_game_results: {
        Row: {
          board_theme: string | null
          difficulty: string | null
          duration_seconds: number | null
          id: string
          moves_count: number | null
          opponent_type: string
          played_at: string
          result: string
          user_id: string
        }
        Insert: {
          board_theme?: string | null
          difficulty?: string | null
          duration_seconds?: number | null
          id?: string
          moves_count?: number | null
          opponent_type: string
          played_at?: string
          result: string
          user_id: string
        }
        Update: {
          board_theme?: string | null
          difficulty?: string | null
          duration_seconds?: number | null
          id?: string
          moves_count?: number | null
          opponent_type?: string
          played_at?: string
          result?: string
          user_id?: string
        }
        Relationships: []
      }
      chess_puzzle_completions: {
        Row: {
          attempts: number | null
          completed_at: string
          id: string
          puzzle_id: number
          user_id: string
        }
        Insert: {
          attempts?: number | null
          completed_at?: string
          id?: string
          puzzle_id: number
          user_id: string
        }
        Update: {
          attempts?: number | null
          completed_at?: string
          id?: string
          puzzle_id?: number
          user_id?: string
        }
        Relationships: []
      }
      chess_puzzle_unlocks: {
        Row: {
          id: string
          puzzle_id: number
          unlocked_at: string
          user_id: string
        }
        Insert: {
          id?: string
          puzzle_id: number
          unlocked_at?: string
          user_id: string
        }
        Update: {
          id?: string
          puzzle_id?: number
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chess_tutorial_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: number
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: number
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: number
          user_id?: string
        }
        Relationships: []
      }
      coding_game_progress: {
        Row: {
          attempts: number | null
          best_time_seconds: number | null
          completed: boolean | null
          completed_at: string | null
          created_at: string
          id: string
          last_attempted_at: string | null
          level_id: number
          user_id: string
        }
        Insert: {
          attempts?: number | null
          best_time_seconds?: number | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          last_attempted_at?: string | null
          level_id: number
          user_id: string
        }
        Update: {
          attempts?: number | null
          best_time_seconds?: number | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          last_attempted_at?: string | null
          level_id?: number
          user_id?: string
        }
        Relationships: []
      }
      coin_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          coins: number | null
          created_at: string
          games_played: number | null
          hours_played: number | null
          id: string
          level: number | null
          notifications_enabled: boolean | null
          sound_enabled: boolean | null
          theme: string | null
          updated_at: string
          user_id: string
          username: string | null
          wins: number | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          coins?: number | null
          created_at?: string
          games_played?: number | null
          hours_played?: number | null
          id?: string
          level?: number | null
          notifications_enabled?: boolean | null
          sound_enabled?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          wins?: number | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          coins?: number | null
          created_at?: string
          games_played?: number | null
          hours_played?: number | null
          id?: string
          level?: number | null
          notifications_enabled?: boolean | null
          sound_enabled?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          wins?: number | null
          xp?: number | null
        }
        Relationships: []
      }
      ranked_match_history: {
        Row: {
          coins_gained: number
          id: string
          match_fee: number
          opponent_id: string | null
          played_at: string
          result: string
          user_id: string
        }
        Insert: {
          coins_gained?: number
          id?: string
          match_fee: number
          opponent_id?: string | null
          played_at?: string
          result: string
          user_id: string
        }
        Update: {
          coins_gained?: number
          id?: string
          match_fee?: number
          opponent_id?: string | null
          played_at?: string
          result?: string
          user_id?: string
        }
        Relationships: []
      }
      unlocked_chess_boards: {
        Row: {
          board_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          board_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          board_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
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
