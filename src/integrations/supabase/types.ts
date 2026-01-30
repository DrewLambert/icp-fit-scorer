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
      disqualified_leads: {
        Row: {
          created_at: string
          disqualified_at: string
          id: string
          is_overridden: boolean
          lead_id: string
          overridden_at: string | null
          overridden_by: string | null
          override_reason: string | null
          total_negative_score: number
          triggered_rules: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          disqualified_at?: string
          id?: string
          is_overridden?: boolean
          lead_id: string
          overridden_at?: string | null
          overridden_by?: string | null
          override_reason?: string | null
          total_negative_score: number
          triggered_rules?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          disqualified_at?: string
          id?: string
          is_overridden?: boolean
          lead_id?: string
          overridden_at?: string | null
          overridden_by?: string | null
          override_reason?: string | null
          total_negative_score?: number
          triggered_rules?: Json
          updated_at?: string
        }
        Relationships: []
      }
      engagement_events: {
        Row: {
          created_at: string
          engagement_type_id: string
          id: string
          lead_id: string
          metadata: Json | null
          occurred_at: string
          points_earned: number
        }
        Insert: {
          created_at?: string
          engagement_type_id: string
          id?: string
          lead_id: string
          metadata?: Json | null
          occurred_at?: string
          points_earned: number
        }
        Update: {
          created_at?: string
          engagement_type_id?: string
          id?: string
          lead_id?: string
          metadata?: Json | null
          occurred_at?: string
          points_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "engagement_events_engagement_type_id_fkey"
            columns: ["engagement_type_id"]
            isOneToOne: false
            referencedRelation: "engagement_types"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_settings: {
        Row: {
          cold_threshold: number
          created_at: string
          decay_period_days: number
          engagement_enabled: boolean
          hot_threshold: number
          id: string
          updated_at: string
          warm_threshold: number
        }
        Insert: {
          cold_threshold?: number
          created_at?: string
          decay_period_days?: number
          engagement_enabled?: boolean
          hot_threshold?: number
          id?: string
          updated_at?: string
          warm_threshold?: number
        }
        Update: {
          cold_threshold?: number
          created_at?: string
          decay_period_days?: number
          engagement_enabled?: boolean
          hot_threshold?: number
          id?: string
          updated_at?: string
          warm_threshold?: number
        }
        Relationships: []
      }
      engagement_types: {
        Row: {
          category: string
          created_at: string
          current_points: number
          default_points: number
          description: string | null
          enabled: boolean
          icon: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          category: string
          created_at?: string
          current_points: number
          default_points: number
          description?: string | null
          enabled?: boolean
          icon?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          category?: string
          created_at?: string
          current_points?: number
          default_points?: number
          description?: string | null
          enabled?: boolean
          icon?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      first_party_signals: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          metadata: Json | null
          observed_at: string
          page_url: string | null
          signal_type: string
          visit_count: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          metadata?: Json | null
          observed_at?: string
          page_url?: string | null
          signal_type: string
          visit_count?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          metadata?: Json | null
          observed_at?: string
          page_url?: string | null
          signal_type?: string
          visit_count?: number | null
        }
        Relationships: []
      }
      historical_deals: {
        Row: {
          closed_at: string
          company_name: string
          company_size: string | null
          created_at: string
          days_to_close: number | null
          deal_value: number | null
          engagement_score: number | null
          funding_stage: string | null
          id: string
          industry: string | null
          job_title: string | null
          outcome: string
          region: string | null
          source_channel: string | null
        }
        Insert: {
          closed_at?: string
          company_name: string
          company_size?: string | null
          created_at?: string
          days_to_close?: number | null
          deal_value?: number | null
          engagement_score?: number | null
          funding_stage?: string | null
          id?: string
          industry?: string | null
          job_title?: string | null
          outcome: string
          region?: string | null
          source_channel?: string | null
        }
        Update: {
          closed_at?: string
          company_name?: string
          company_size?: string | null
          created_at?: string
          days_to_close?: number | null
          deal_value?: number | null
          engagement_score?: number | null
          funding_stage?: string | null
          id?: string
          industry?: string | null
          job_title?: string | null
          outcome?: string
          region?: string | null
          source_channel?: string | null
        }
        Relationships: []
      }
      intent_settings: {
        Row: {
          competitor_research_weight: number
          created_at: string
          demo_page_weight: number
          email_click_weight: number
          email_open_weight: number
          email_reply_weight: number
          first_party_weight: number
          g2_research_weight: number
          id: string
          in_market_threshold: number
          intent_enabled: boolean
          intent_provider_weight: number
          pricing_page_weight: number
          product_page_weight: number
          third_party_weight: number
          trial_signup_weight: number
          trustradius_weight: number
          updated_at: string
        }
        Insert: {
          competitor_research_weight?: number
          created_at?: string
          demo_page_weight?: number
          email_click_weight?: number
          email_open_weight?: number
          email_reply_weight?: number
          first_party_weight?: number
          g2_research_weight?: number
          id?: string
          in_market_threshold?: number
          intent_enabled?: boolean
          intent_provider_weight?: number
          pricing_page_weight?: number
          product_page_weight?: number
          third_party_weight?: number
          trial_signup_weight?: number
          trustradius_weight?: number
          updated_at?: string
        }
        Update: {
          competitor_research_weight?: number
          created_at?: string
          demo_page_weight?: number
          email_click_weight?: number
          email_open_weight?: number
          email_reply_weight?: number
          first_party_weight?: number
          g2_research_weight?: number
          id?: string
          in_market_threshold?: number
          intent_enabled?: boolean
          intent_provider_weight?: number
          pricing_page_weight?: number
          product_page_weight?: number
          third_party_weight?: number
          trial_signup_weight?: number
          trustradius_weight?: number
          updated_at?: string
        }
        Relationships: []
      }
      negative_scoring_rules: {
        Row: {
          condition_type: string
          condition_value: string
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          name: string
          points: number
          reason_label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          condition_type: string
          condition_value?: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name: string
          points: number
          reason_label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          condition_type?: string
          condition_value?: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name?: string
          points?: number
          reason_label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      negative_scoring_settings: {
        Row: {
          auto_disqualify: boolean
          created_at: string
          disqualification_threshold: number
          id: string
          negative_enabled: boolean
          subtract_from_other_models: boolean
          updated_at: string
        }
        Insert: {
          auto_disqualify?: boolean
          created_at?: string
          disqualification_threshold?: number
          id?: string
          negative_enabled?: boolean
          subtract_from_other_models?: boolean
          updated_at?: string
        }
        Update: {
          auto_disqualify?: boolean
          created_at?: string
          disqualification_threshold?: number
          id?: string
          negative_enabled?: boolean
          subtract_from_other_models?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      predictive_model_state: {
        Row: {
          accuracy_score: number | null
          created_at: string
          error_message: string | null
          feature_weights: Json
          id: string
          last_trained_at: string | null
          lost_records: number
          total_records: number
          training_status: string | null
          updated_at: string
          won_records: number
        }
        Insert: {
          accuracy_score?: number | null
          created_at?: string
          error_message?: string | null
          feature_weights?: Json
          id?: string
          last_trained_at?: string | null
          lost_records?: number
          total_records?: number
          training_status?: string | null
          updated_at?: string
          won_records?: number
        }
        Update: {
          accuracy_score?: number | null
          created_at?: string
          error_message?: string | null
          feature_weights?: Json
          id?: string
          last_trained_at?: string | null
          lost_records?: number
          total_records?: number
          training_status?: string | null
          updated_at?: string
          won_records?: number
        }
        Relationships: []
      }
      predictive_settings: {
        Row: {
          created_at: string
          id: string
          min_deals_threshold: number
          predictive_enabled: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          min_deals_threshold?: number
          predictive_enabled?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          min_deals_threshold?: number
          predictive_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      scoring_rules: {
        Row: {
          category: Database["public"]["Enums"]["rule_category"]
          condition_type: Database["public"]["Enums"]["condition_type"]
          condition_value: string
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          name: string
          points: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["rule_category"]
          condition_type: Database["public"]["Enums"]["condition_type"]
          condition_value: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name: string
          points: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["rule_category"]
          condition_type?: Database["public"]["Enums"]["condition_type"]
          condition_value?: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name?: string
          points?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      scoring_settings: {
        Row: {
          created_at: string
          id: string
          qualification_threshold: number
          rule_based_enabled: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          qualification_threshold?: number
          rule_based_enabled?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          qualification_threshold?: number
          rule_based_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      third_party_signals: {
        Row: {
          confidence_level: string
          created_at: string
          id: string
          lead_id: string
          notes: string | null
          observed_at: string
          signal_type: string
          source_name: string
        }
        Insert: {
          confidence_level: string
          created_at?: string
          id?: string
          lead_id: string
          notes?: string | null
          observed_at?: string
          signal_type: string
          source_name: string
        }
        Update: {
          confidence_level?: string
          created_at?: string
          id?: string
          lead_id?: string
          notes?: string | null
          observed_at?: string
          signal_type?: string
          source_name?: string
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
      condition_type:
        | "job_title_contains"
        | "email_domain_personal"
        | "email_domain_business"
        | "company_size_range"
        | "industry_matches"
        | "visited_pricing_page"
        | "visited_product_page"
        | "blog_only_engagement"
        | "funding_stage"
        | "region_matches"
        | "custom"
      rule_category: "demographic" | "firmographic" | "behavioral"
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
      condition_type: [
        "job_title_contains",
        "email_domain_personal",
        "email_domain_business",
        "company_size_range",
        "industry_matches",
        "visited_pricing_page",
        "visited_product_page",
        "blog_only_engagement",
        "funding_stage",
        "region_matches",
        "custom",
      ],
      rule_category: ["demographic", "firmographic", "behavioral"],
    },
  },
} as const
