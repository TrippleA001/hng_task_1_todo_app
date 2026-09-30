/**
 * Types for the schema in supabase/migrations/0001-0004.
 *
 * Hand-written to match the SQL. If you ever install the Supabase CLI you can
 * regenerate this with `supabase gen types typescript --project-id <ref>`, which
 * produces the same shape.
 *
 * The Row/Insert/Update/Relationships keys are not optional: supabase-js's
 * GenericTable type requires all four, so `Relationships` must be present even
 * when empty.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  __InternalSupabase: { PostgrestVersion: "13" };
  public: {
    Tables: {
      lists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          position: number;
          created_at: string;
          is_seeded: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          position?: number;
          created_at?: string;
          is_seeded?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          position?: number;
          created_at?: string;
          is_seeded?: boolean;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
          is_seeded: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
          is_seeded?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
          is_seeded?: boolean;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          list_id: string;
          title: string;
          description: string;
          done: boolean;
          due_date: string | null;
          position: number;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
          is_seeded: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          list_id: string;
          title: string;
          description?: string;
          done?: boolean;
          due_date?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
          is_seeded?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          list_id?: string;
          title?: string;
          description?: string;
          done?: boolean;
          due_date?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
          is_seeded?: boolean;
        };
        Relationships: [];
      };
      task_tags: {
        Row: { task_id: string; tag_id: string; user_id: string };
        Insert: { task_id: string; tag_id: string; user_id: string };
        Update: { task_id?: string; tag_id?: string; user_id?: string };
        Relationships: [];
      };
      subtasks: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          title: string;
          done: boolean;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          title: string;
          done?: boolean;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string;
          title?: string;
          done?: boolean;
          position?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          user_id: string;
          onboarded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          onboarded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          onboarded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      seed_demo_workspace_for_user: {
        Args: { target_user: string };
        Returns: undefined;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
