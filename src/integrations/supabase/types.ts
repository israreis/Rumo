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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          attachment_url: string | null
          category: string
          converted_amount: number | null
          created_at: string
          currency: string
          date: string | null
          due_date: string | null
          first_installment_month: string | null
          fx_rate: number | null
          id: string
          installments: number
          lat: number | null
          lng: number | null
          location: string | null
          name: string
          position: number
          priority: string
          purchase_url: string | null
          purchased: boolean
          quantity: number
          time: string | null
          trip_id: string
          unit_price: number | null
        }
        Insert: {
          attachment_url?: string | null
          category?: string
          converted_amount?: number | null
          created_at?: string
          currency?: string
          date?: string | null
          due_date?: string | null
          first_installment_month?: string | null
          fx_rate?: number | null
          id?: string
          installments?: number
          lat?: number | null
          lng?: number | null
          location?: string | null
          name: string
          position?: number
          priority?: string
          purchase_url?: string | null
          purchased?: boolean
          quantity?: number
          time?: string | null
          trip_id: string
          unit_price?: number | null
        }
        Update: {
          attachment_url?: string | null
          category?: string
          converted_amount?: number | null
          created_at?: string
          currency?: string
          date?: string | null
          due_date?: string | null
          first_installment_month?: string | null
          fx_rate?: number | null
          id?: string
          installments?: number
          lat?: number | null
          lng?: number | null
          location?: string | null
          name?: string
          position?: number
          priority?: string
          purchase_url?: string | null
          purchased?: boolean
          quantity?: number
          time?: string | null
          trip_id?: string
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_items: {
        Row: {
          amount: number
          category: string
          converted_amount: number | null
          created_at: string
          currency: string
          days: number | null
          description: string
          due_date: string | null
          first_installment_month: string | null
          fx_rate: number | null
          id: string
          installments: number
          kind: string
          paid: boolean
          people: number | null
          trip_id: string
        }
        Insert: {
          amount?: number
          category?: string
          converted_amount?: number | null
          created_at?: string
          currency?: string
          days?: number | null
          description: string
          due_date?: string | null
          first_installment_month?: string | null
          fx_rate?: number | null
          id?: string
          installments?: number
          kind?: string
          paid?: boolean
          people?: number | null
          trip_id: string
        }
        Update: {
          amount?: number
          category?: string
          converted_amount?: number | null
          created_at?: string
          currency?: string
          days?: number | null
          description?: string
          due_date?: string | null
          first_installment_month?: string | null
          fx_rate?: number | null
          id?: string
          installments?: number
          kind?: string
          paid?: boolean
          people?: number | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          assignee: string | null
          created_at: string
          done: boolean
          due_date: string | null
          id: string
          list: string
          position: number
          title: string
          trip_id: string
        }
        Insert: {
          assignee?: string | null
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          list?: string
          position?: number
          title: string
          trip_id: string
        }
        Update: {
          assignee?: string | null
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          list?: string
          position?: number
          title?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_assignee_fkey"
            columns: ["assignee"]
            isOneToOne: false
            referencedRelation: "trip_travelers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          created_at: string
          id: string
          kind: string
          name: string
          notes: string | null
          phone: string | null
          trip_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          name: string
          notes?: string | null
          phone?: string | null
          trip_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          name?: string
          notes?: string | null
          phone?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          converted_amount: number
          created_at: string
          currency: string
          date: string
          description: string | null
          fees_pct: number
          fx_rate: number
          id: string
          paid_by: string | null
          payment_method: string
          receipt_url: string | null
          split_mode: string
          splits: Json
          trip_id: string
        }
        Insert: {
          amount: number
          category?: string
          converted_amount: number
          created_at?: string
          currency?: string
          date?: string
          description?: string | null
          fees_pct?: number
          fx_rate?: number
          id?: string
          paid_by?: string | null
          payment_method?: string
          receipt_url?: string | null
          split_mode?: string
          splits?: Json
          trip_id: string
        }
        Update: {
          amount?: number
          category?: string
          converted_amount?: number
          created_at?: string
          currency?: string
          date?: string
          description?: string | null
          fees_pct?: number
          fx_rate?: number
          id?: string
          paid_by?: string | null
          payment_method?: string
          receipt_url?: string | null
          split_mode?: string
          splits?: Json
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "trip_travelers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_events: {
        Row: {
          category: string
          converted_amount: number | null
          cost: number | null
          created_at: string
          day: string
          end_time: string | null
          fx_rate: number | null
          id: string
          lat: number | null
          lng: number | null
          location: string | null
          notes: string | null
          position: number
          start_time: string | null
          title: string
          trip_id: string
        }
        Insert: {
          category?: string
          converted_amount?: number | null
          cost?: number | null
          created_at?: string
          day: string
          end_time?: string | null
          fx_rate?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string | null
          notes?: string | null
          position?: number
          start_time?: string | null
          title: string
          trip_id: string
        }
        Update: {
          category?: string
          converted_amount?: number | null
          cost?: number | null
          created_at?: string
          day?: string
          end_time?: string | null
          fx_rate?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string | null
          notes?: string | null
          position?: number
          start_time?: string | null
          title?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_events_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      lodgings: {
        Row: {
          address: string | null
          attachment_url: string | null
          booking_code: string | null
          cancellation_policy: string | null
          check_in_date: string | null
          check_in_time: string | null
          check_out_date: string | null
          check_out_time: string | null
          cleaning_fee: number | null
          contact: string | null
          converted_amount: number | null
          created_at: string
          currency: string
          due_date: string | null
          first_installment_month: string | null
          free_cancel_until: string | null
          fx_rate: number | null
          id: string
          installments: number
          lat: number | null
          lng: number | null
          name: string
          nightly_rate: number | null
          payment_status: string
          total: number | null
          tourist_tax: number | null
          trip_id: string
          type: string
        }
        Insert: {
          address?: string | null
          attachment_url?: string | null
          booking_code?: string | null
          cancellation_policy?: string | null
          check_in_date?: string | null
          check_in_time?: string | null
          check_out_date?: string | null
          check_out_time?: string | null
          cleaning_fee?: number | null
          contact?: string | null
          converted_amount?: number | null
          created_at?: string
          currency?: string
          due_date?: string | null
          first_installment_month?: string | null
          free_cancel_until?: string | null
          fx_rate?: number | null
          id?: string
          installments?: number
          lat?: number | null
          lng?: number | null
          name: string
          nightly_rate?: number | null
          payment_status?: string
          total?: number | null
          tourist_tax?: number | null
          trip_id: string
          type?: string
        }
        Update: {
          address?: string | null
          attachment_url?: string | null
          booking_code?: string | null
          cancellation_policy?: string | null
          check_in_date?: string | null
          check_in_time?: string | null
          check_out_date?: string | null
          check_out_time?: string | null
          cleaning_fee?: number | null
          contact?: string | null
          converted_amount?: number | null
          created_at?: string
          currency?: string
          due_date?: string | null
          first_installment_month?: string | null
          free_cancel_until?: string | null
          fx_rate?: number | null
          id?: string
          installments?: number
          lat?: number | null
          lng?: number | null
          name?: string
          nightly_rate?: number | null
          payment_status?: string
          total?: number | null
          tourist_tax?: number | null
          trip_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lodgings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_stamps: {
        Row: {
          country: string
          created_at: string
          entry_city: string | null
          id: string
          note: string | null
          stamped_on: string
          user_id: string
        }
        Insert: {
          country: string
          created_at?: string
          entry_city?: string | null
          id?: string
          note?: string | null
          stamped_on: string
          user_id?: string
        }
        Update: {
          country?: string
          created_at?: string
          entry_city?: string | null
          id?: string
          note?: string | null
          stamped_on?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_currency: string
          full_name: string | null
          id: string
          passport_expiry: string | null
          passport_last4: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_currency?: string
          full_name?: string | null
          id: string
          passport_expiry?: string | null
          passport_last4?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_currency?: string
          full_name?: string | null
          id?: string
          passport_expiry?: string | null
          passport_last4?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transports: {
        Row: {
          arrival_at: string | null
          arrival_tz: string | null
          attachment_url: string | null
          baggage: string | null
          booking_url: string | null
          class: string | null
          code: string | null
          company: string | null
          converted_amount: number | null
          created_at: string
          currency: string
          departure_at: string | null
          departure_tz: string | null
          destination: string | null
          due_date: string | null
          first_installment_month: string | null
          fx_rate: number | null
          id: string
          installments: number
          locator: string | null
          origin: string | null
          payment_status: string
          price: number | null
          seat: string | null
          trip_id: string
          type: string
        }
        Insert: {
          arrival_at?: string | null
          arrival_tz?: string | null
          attachment_url?: string | null
          baggage?: string | null
          booking_url?: string | null
          class?: string | null
          code?: string | null
          company?: string | null
          converted_amount?: number | null
          created_at?: string
          currency?: string
          departure_at?: string | null
          departure_tz?: string | null
          destination?: string | null
          due_date?: string | null
          first_installment_month?: string | null
          fx_rate?: number | null
          id?: string
          installments?: number
          locator?: string | null
          origin?: string | null
          payment_status?: string
          price?: number | null
          seat?: string | null
          trip_id: string
          type?: string
        }
        Update: {
          arrival_at?: string | null
          arrival_tz?: string | null
          attachment_url?: string | null
          baggage?: string | null
          booking_url?: string | null
          class?: string | null
          code?: string | null
          company?: string | null
          converted_amount?: number | null
          created_at?: string
          currency?: string
          departure_at?: string | null
          departure_tz?: string | null
          destination?: string | null
          due_date?: string | null
          first_installment_month?: string | null
          fx_rate?: number | null
          id?: string
          installments?: number
          locator?: string | null
          origin?: string | null
          payment_status?: string
          price?: number | null
          seat?: string | null
          trip_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transports_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      traveler_documents: {
        Row: {
          attachment_url: string | null
          created_at: string
          expires_at: string | null
          id: string
          issuer: string | null
          kind: string
          notes: string | null
          number: string | null
          phone: string | null
          traveler_id: string | null
          trip_id: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          issuer?: string | null
          kind?: string
          notes?: string | null
          number?: string | null
          phone?: string | null
          traveler_id?: string | null
          trip_id: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          issuer?: string | null
          kind?: string
          notes?: string | null
          number?: string | null
          phone?: string | null
          traveler_id?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "traveler_documents_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "trip_travelers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_documents_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_destinations: {
        Row: {
          arrival_date: string | null
          city: string
          country: string | null
          created_at: string
          currency: string | null
          departure_date: string | null
          id: string
          position: number
          timezone: string | null
          trip_id: string
        }
        Insert: {
          arrival_date?: string | null
          city: string
          country?: string | null
          created_at?: string
          currency?: string | null
          departure_date?: string | null
          id?: string
          position?: number
          timezone?: string | null
          trip_id: string
        }
        Update: {
          arrival_date?: string | null
          city?: string
          country?: string | null
          created_at?: string
          currency?: string | null
          departure_date?: string | null
          id?: string
          position?: number
          timezone?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_destinations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["trip_role"]
          token: string
          trip_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["trip_role"]
          token?: string
          trip_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["trip_role"]
          token?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_invites_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["trip_role"]
          trip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["trip_role"]
          trip_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["trip_role"]
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_members_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_notes: {
        Row: {
          content: string
          created_at: string
          day: string | null
          id: string
          title: string
          trip_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          day?: string | null
          id?: string
          title?: string
          trip_id: string
        }
        Update: {
          content?: string
          created_at?: string
          day?: string | null
          id?: string
          title?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_notes_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_travelers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          position: number
          trip_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          position?: number
          trip_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          position?: number
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_travelers_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          budget: number | null
          card_spread_pct: number
          cover_url: string | null
          created_at: string
          currency: string
          end_date: string | null
          id: string
          iof_pct: number
          name: string
          owner_id: string
          public_token: string | null
          start_date: string | null
          status_override: Database["public"]["Enums"]["trip_status"] | null
          travelers_count: number
          updated_at: string
        }
        Insert: {
          budget?: number | null
          card_spread_pct?: number
          cover_url?: string | null
          created_at?: string
          currency?: string
          end_date?: string | null
          id?: string
          iof_pct?: number
          name: string
          owner_id?: string
          public_token?: string | null
          start_date?: string | null
          status_override?: Database["public"]["Enums"]["trip_status"] | null
          travelers_count?: number
          updated_at?: string
        }
        Update: {
          budget?: number | null
          card_spread_pct?: number
          cover_url?: string | null
          created_at?: string
          currency?: string
          end_date?: string | null
          id?: string
          iof_pct?: number
          name?: string
          owner_id?: string
          public_token?: string | null
          start_date?: string | null
          status_override?: Database["public"]["Enums"]["trip_status"] | null
          travelers_count?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_pending_invites: { Args: never; Returns: number }
      delete_my_account: { Args: never; Returns: undefined }
      accept_trip_invite: { Args: { _token: string }; Returns: string }
      get_public_trip: { Args: { _token: string }; Returns: Json }
      get_trip_members: {
        Args: { _trip: string }
        Returns: {
          avatar_url: string | null
          email: string | null
          full_name: string | null
          role: Database["public"]["Enums"]["trip_role"]
          user_id: string
        }[]
      }
      is_trip_owner: {
        Args: { _trip: string; _user: string }
        Returns: boolean
      }
      can_edit_trip: {
        Args: { _trip: string; _user: string }
        Returns: boolean
      }
      can_view_trip: {
        Args: { _trip: string; _user: string }
        Returns: boolean
      }
      seed_sample_budget: { Args: { d: string; t: string }; Returns: undefined }
      seed_sample_plan: { Args: { d: string; t: string }; Returns: undefined }
      trip_role_of: {
        Args: { _trip: string; _user: string }
        Returns: Database["public"]["Enums"]["trip_role"]
      }
    }
    Enums: {
      trip_role: "owner" | "editor" | "viewer"
      trip_status: "planning" | "confirmed" | "ongoing" | "completed"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      trip_role: ["owner", "editor", "viewer"],
      trip_status: ["planning", "confirmed", "ongoing", "completed"],
    },
  },
} as const
