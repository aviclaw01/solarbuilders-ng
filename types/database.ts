// Auto-generated from Supabase schema — update when schema changes
// Run: npx supabase gen types typescript --project-id <project-id> > types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      builders: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          slug: string;
          bio: string | null;
          location: string | null;
          whatsapp: string | null;
          website: string | null;
          verified: boolean;
          badge: "none" | "verified" | "featured";
          badge_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["builders"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["builders"]["Insert"]>;
      };
      listings: {
        Row: {
          id: string;
          builder_id: string;
          title: string;
          description: string | null;
          type: "bundle" | "parts" | "service" | "repair";
          inverter_kva: number | null;
          battery_ah: number | null;
          panel_watts: number | null;
          panel_count: number | null;
          price_naira: number | null;
          images: string[];
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["listings"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["listings"]["Insert"]>;
      };
      quotes: {
        Row: {
          id: string;
          listing_id: string | null;
          builder_id: string;
          user_id: string | null;
          name: string | null;
          phone: string | null;
          email: string | null;
          location: string | null;
          load_watts: number | null;
          system_type: "budget" | "standard" | "premium" | null;
          message: string | null;
          status: "new" | "seen" | "replied" | "closed";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["quotes"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["quotes"]["Insert"]>;
      };
      reviews: {
        Row: {
          id: string;
          builder_id: string;
          user_id: string;
          rating: 1 | 2 | 3 | 4 | 5;
          body: string | null;
          verified: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["reviews"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
      };
      calculator_sessions: {
        Row: {
          id: string;
          session_token: string;
          user_id: string | null;
          appliances: Json;
          result: Json;
          total_watts_min: number;
          total_watts_max: number;
          ip_address: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["calculator_sessions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["calculator_sessions"]["Insert"]>;
      };
    };
  };
}
