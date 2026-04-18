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
      bookmarks: {
        Row: {
          created_at: string
          id: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      claims: {
        Row: {
          category: string
          confidence: number
          contradicting_sources: Json
          created_at: string
          explanation: string
          id: string
          story_id: string
          supporting_sources: Json
          text: string
        }
        Insert: {
          category?: string
          confidence?: number
          contradicting_sources?: Json
          created_at?: string
          explanation?: string
          id?: string
          story_id: string
          supporting_sources?: Json
          text: string
        }
        Update: {
          category?: string
          confidence?: number
          contradicting_sources?: Json
          created_at?: string
          explanation?: string
          id?: string
          story_id?: string
          supporting_sources?: Json
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "claims_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      coverages: {
        Row: {
          full_content: string | null
          headline: string
          id: string
          is_international: boolean
          published_at: string | null
          source_id: string
          story_id: string
          summary: string | null
          url: string | null
        }
        Insert: {
          full_content?: string | null
          headline: string
          id?: string
          is_international?: boolean
          published_at?: string | null
          source_id: string
          story_id: string
          summary?: string | null
          url?: string | null
        }
        Update: {
          full_content?: string | null
          headline?: string
          id?: string
          is_international?: boolean
          published_at?: string | null
          source_id?: string
          story_id?: string
          summary?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coverages_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      reading_history: {
        Row: {
          id: string
          read_at: string
          source_ids: Json
          story_id: string
          user_id: string
        }
        Insert: {
          id?: string
          read_at?: string
          source_ids?: Json
          story_id: string
          user_id: string
        }
        Update: {
          id?: string
          read_at?: string
          source_ids?: Json
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_history_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      scrape_log: {
        Row: {
          errors: Json | null
          id: string
          scraped_at: string
          sources_scraped: number | null
          stories_found: number | null
        }
        Insert: {
          errors?: Json | null
          id?: string
          scraped_at?: string
          sources_scraped?: number | null
          stories_found?: number | null
        }
        Update: {
          errors?: Json | null
          id?: string
          scraped_at?: string
          sources_scraped?: number | null
          stories_found?: number | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          ai_summary: string | null
          bias_distribution: Json
          created_at: string
          id: string
          image_url: string | null
          importance_score: number
          is_breaking: boolean
          is_trending: boolean
          key_points: Json | null
          published_at: string
          region: string
          title: string
          title_urdu: string | null
          topic: string
        }
        Insert: {
          ai_summary?: string | null
          bias_distribution?: Json
          created_at?: string
          id?: string
          image_url?: string | null
          importance_score?: number
          is_breaking?: boolean
          is_trending?: boolean
          key_points?: Json | null
          published_at?: string
          region?: string
          title: string
          title_urdu?: string | null
          topic?: string
        }
        Update: {
          ai_summary?: string | null
          bias_distribution?: Json
          created_at?: string
          id?: string
          image_url?: string | null
          importance_score?: number
          is_breaking?: boolean
          is_trending?: boolean
          key_points?: Json | null
          published_at?: string
          region?: string
          title?: string
          title_urdu?: string | null
          topic?: string
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
