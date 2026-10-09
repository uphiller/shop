export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProductBadge = "new" | "sale" | "bestseller";

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          description: string;
          price: number;
          stock: number;
          image_url: string;
          category: string;
          badge: ProductBadge | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          price: number;
          stock?: number;
          image_url?: string;
          category?: string;
          badge?: ProductBadge | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          price?: number;
          stock?: number;
          image_url?: string;
          category?: string;
          badge?: ProductBadge | null;
          created_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          keycloak_sub: string;
          email: string;
          display_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          keycloak_sub: string;
          email?: string;
          display_name?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          keycloak_sub?: string;
          email?: string;
          display_name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          stripe_checkout_session_id: string;
          status: string;
          subtotal: number;
          currency: string;
          created_at: string;
          paid_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_checkout_session_id: string;
          status?: string;
          subtotal: number;
          currency?: string;
          created_at?: string;
          paid_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_checkout_session_id?: string;
          status?: string;
          subtotal?: number;
          currency?: string;
          created_at?: string;
          paid_at?: string | null;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          product_name: string;
          unit_price: number;
          quantity: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          product_name: string;
          unit_price: number;
          quantity: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          product_name?: string;
          unit_price?: number;
          quantity?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
