// Supabaseから自動生成される型定義
// supabase gen types typescript --project-id <project-id> > src/types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      games: {
        Row: {
          id: number;
          title: string;
          description: string | null;
          player_min: number;
          player_max: number;
          image_url: string | null;
          stock: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          title: string;
          description?: string | null;
          player_min: number;
          player_max: number;
          image_url?: string | null;
          stock?: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          title?: string;
          description?: string | null;
          player_min?: number;
          player_max?: number;
          image_url?: string | null;
          stock?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      reservations: {
        Row: {
          id: number;
          game_id: number;
          user_id: string | null;
          reserved_at: string;
          returned_at: string | null;
          status: string;
        };
        Insert: {
          id?: number;
          game_id: number;
          user_id?: string | null;
          reserved_at?: string;
          returned_at?: string | null;
          status?: string;
        };
        Update: {
          id?: number;
          game_id?: number;
          user_id?: string | null;
          reserved_at?: string;
          returned_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reservations_game_id_fkey";
            columns: ["game_id"];
            referencedRelation: "games";
            referencedColumns: ["id"];
          }
        ];
      };
      reviews: {
        Row: {
          id: number;
          game_id: number;
          user_id: string | null;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          game_id: number;
          user_id?: string | null;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          game_id?: number;
          user_id?: string | null;
          rating?: number;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_game_id_fkey";
            columns: ["game_id"];
            referencedRelation: "games";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      reserve_game: {
        Args: {
          p_game_id: number;
          p_user_id: string;
        };
        Returns: Json;
      };
      return_game: {
        Args: {
          p_reservation_id: number;
          p_user_id: string;
        };
        Returns: Json;
      };
      cancel_reservation: {
        Args: {
          p_reservation_id: number;
          p_user_id: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
