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
      bible_entries: {
        Row: {
          book: string
          chapters: string | null
          created_at: string
          entry_date: string
          id: string
          minutes: number | null
          note: string | null
          user_id: string
        }
        Insert: {
          book: string
          chapters?: string | null
          created_at?: string
          entry_date: string
          id?: string
          minutes?: number | null
          note?: string | null
          user_id: string
        }
        Update: {
          book?: string
          chapters?: string | null
          created_at?: string
          entry_date?: string
          id?: string
          minutes?: number | null
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          category: string
          id: string
          monthly_target: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          id?: string
          monthly_target: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          id?: string
          monthly_target?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coding_entries: {
        Row: {
          category: string
          created_at: string
          entry_date: string
          id: string
          note: string | null
          platform: string | null
          problems: number
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          entry_date: string
          id?: string
          note?: string | null
          platform?: string | null
          problems: number
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          entry_date?: string
          id?: string
          note?: string | null
          platform?: string | null
          problems?: number
          user_id?: string
        }
        Relationships: []
      }
      daily_entries: {
        Row: {
          created_at: string
          energy: number | null
          entry_date: string
          id: string
          mood: number | null
          stress: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          energy?: number | null
          entry_date: string
          id?: string
          mood?: number | null
          stress?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          energy?: number | null
          entry_date?: string
          id?: string
          mood?: number | null
          stress?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_pulse: {
        Row: {
          energy: number | null
          entry_date: string
          id: string
          mood: number | null
          stress: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          energy?: number | null
          entry_date: string
          id?: string
          mood?: number | null
          stress?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          energy?: number | null
          entry_date?: string
          id?: string
          mood?: number | null
          stress?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      deep_work_entries: {
        Row: {
          area_id: string
          created_at: string
          description: string | null
          entry_date: string
          id: string
          minutes: number
          project: string | null
          user_id: string
        }
        Insert: {
          area_id: string
          created_at?: string
          description?: string | null
          entry_date: string
          id?: string
          minutes: number
          project?: string | null
          user_id: string
        }
        Update: {
          area_id?: string
          created_at?: string
          description?: string | null
          entry_date?: string
          id?: string
          minutes?: number
          project?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deep_work_entries_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "life_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      direction_versions: {
        Row: {
          created_at: string
          direction_id: string
          effective_from: string
          effective_to: string | null
          id: string
          statement: string
          why: string | null
        }
        Insert: {
          created_at?: string
          direction_id: string
          effective_from: string
          effective_to?: string | null
          id?: string
          statement: string
          why?: string | null
        }
        Update: {
          created_at?: string
          direction_id?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          statement?: string
          why?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "direction_versions_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "life_directions"
            referencedColumns: ["id"]
          },
        ]
      }
      entries: {
        Row: {
          amount: number | null
          area: string | null
          created_at: string
          detail: string
          entry_date: string
          id: string
          metric_key: string | null
          project: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          area?: string | null
          created_at?: string
          detail: string
          entry_date: string
          id?: string
          metric_key?: string | null
          project?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number | null
          area?: string | null
          created_at?: string
          detail?: string
          entry_date?: string
          id?: string
          metric_key?: string | null
          project?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_entries: {
        Row: {
          amount: number
          area: string | null
          category: string
          created_at: string
          entry_date: string
          id: string
          kind: string
          metric_key: string | null
          note: string | null
          project: string | null
          user_id: string
        }
        Insert: {
          amount: number
          area?: string | null
          category: string
          created_at?: string
          entry_date: string
          id?: string
          kind: string
          metric_key?: string | null
          note?: string | null
          project?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          area?: string | null
          category?: string
          created_at?: string
          entry_date?: string
          id?: string
          kind?: string
          metric_key?: string | null
          note?: string | null
          project?: string | null
          user_id?: string
        }
        Relationships: []
      }
      goal_evidence: {
        Row: {
          created_at: string
          goal_id: string
          id: string
          kind: string
          note: string | null
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string
          goal_id: string
          id?: string
          kind: string
          note?: string | null
          user_id: string
          value: string
        }
        Update: {
          created_at?: string
          goal_id?: string
          id?: string
          kind?: string
          note?: string | null
          user_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_evidence_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_updates: {
        Row: {
          created_at: string
          effective_date: string
          goal_id: string
          id: string
          note: string | null
          recorded_at: string
          status: string
          user_id: string
          value: number | null
        }
        Insert: {
          created_at?: string
          effective_date: string
          goal_id: string
          id?: string
          note?: string | null
          recorded_at?: string
          status?: string
          user_id: string
          value?: number | null
        }
        Update: {
          created_at?: string
          effective_date?: string
          goal_id?: string
          id?: string
          note?: string | null
          recorded_at?: string
          status?: string
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_updates_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          area_id: string
          baseline: number
          baseline_value: number
          carried_from_goal_id: string | null
          created_at: string
          current_value: number
          deadline: string | null
          direction_id: string | null
          goal_type: Database["public"]["Enums"]["goal_type"]
          horizon_id: string | null
          id: string
          metric_key: string | null
          objective: string | null
          season_id: string
          status: string
          target: number | null
          title: string
          tracking_mode: string
          updated_at: string
          user_id: string
          weight: number
        }
        Insert: {
          area_id: string
          baseline?: number
          baseline_value?: number
          carried_from_goal_id?: string | null
          created_at?: string
          current_value?: number
          deadline?: string | null
          direction_id?: string | null
          goal_type: Database["public"]["Enums"]["goal_type"]
          horizon_id?: string | null
          id?: string
          metric_key?: string | null
          objective?: string | null
          season_id: string
          status?: string
          target?: number | null
          title: string
          tracking_mode?: string
          updated_at?: string
          user_id: string
          weight?: number
        }
        Update: {
          area_id?: string
          baseline?: number
          baseline_value?: number
          carried_from_goal_id?: string | null
          created_at?: string
          current_value?: number
          deadline?: string | null
          direction_id?: string | null
          goal_type?: Database["public"]["Enums"]["goal_type"]
          horizon_id?: string | null
          id?: string
          metric_key?: string | null
          objective?: string | null
          season_id?: string
          status?: string
          target?: number | null
          title?: string
          tracking_mode?: string
          updated_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "goals_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "life_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_carried_from_goal_id_fkey"
            columns: ["carried_from_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "life_directions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_horizon_id_fkey"
            columns: ["horizon_id"]
            isOneToOne: false
            referencedRelation: "horizons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      horizon_outcomes: {
        Row: {
          horizon_id: string
          id: string
          position: number
          statement: string
        }
        Insert: {
          horizon_id: string
          id?: string
          position?: number
          statement: string
        }
        Update: {
          horizon_id?: string
          id?: string
          position?: number
          statement?: string
        }
        Relationships: [
          {
            foreignKeyName: "horizon_outcomes_horizon_id_fkey"
            columns: ["horizon_id"]
            isOneToOne: false
            referencedRelation: "horizons"
            referencedColumns: ["id"]
          },
        ]
      }
      horizons: {
        Row: {
          created_at: string
          direction_id: string
          end_date: string | null
          horizon_type: string
          id: string
          name: string
          start_date: string | null
          statement: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          direction_id: string
          end_date?: string | null
          horizon_type: string
          id?: string
          name: string
          start_date?: string | null
          statement: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          direction_id?: string
          end_date?: string | null
          horizon_type?: string
          id?: string
          name?: string
          start_date?: string | null
          statement?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "horizons_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "life_directions"
            referencedColumns: ["id"]
          },
        ]
      }
      journal: {
        Row: {
          content: string
          created_at: string
          entry_date: string
          entry_type: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entry_date: string
          entry_type: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_date?: string
          entry_type?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          entry_date: string
          entry_type: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entry_date?: string
          entry_type: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_date?: string
          entry_type?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_tags: {
        Row: {
          journal_id: string
          tag_id: string
        }
        Insert: {
          journal_id: string
          tag_id: string
        }
        Update: {
          journal_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_tags_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "journal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_import_map: {
        Row: {
          created_at: string
          legacy_id: string
          source_table: string
          target_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          legacy_id: string
          source_table: string
          target_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          legacy_id?: string
          source_table?: string
          target_id?: string
          user_id?: string
        }
        Relationships: []
      }
      life_areas: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
          user_id: string
          weight: number
        }
        Insert: {
          color: string
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
          user_id: string
          weight: number
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      life_directions: {
        Row: {
          area_id: string
          created_at: string
          id: string
          statement: string
          status: string
          updated_at: string
          user_id: string
          why: string | null
        }
        Insert: {
          area_id: string
          created_at?: string
          id?: string
          statement: string
          status?: string
          updated_at?: string
          user_id: string
          why?: string | null
        }
        Update: {
          area_id?: string
          created_at?: string
          id?: string
          statement?: string
          status?: string
          updated_at?: string
          user_id?: string
          why?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "life_directions_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "life_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          achieved_at: string | null
          area: string | null
          area_id: string | null
          created_at: string
          id: string
          note: string | null
          season_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          achieved_at?: string | null
          area?: string | null
          area_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          season_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          achieved_at?: string | null
          area?: string | null
          area_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          season_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "life_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_reviews: {
        Row: {
          created_at: string
          id: string
          intentions: string | null
          lessons: string | null
          month: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          intentions?: string | null
          lessons?: string | null
          month: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          intentions?: string | null
          lessons?: string | null
          month?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          currency: string
          display_name: string | null
          id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          display_name?: string | null
          id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          display_name?: string | null
          id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          accomplishment: string | null
          created_at: string
          id: string
          priority: string | null
          slipped: string | null
          user_id: string
          week: string
        }
        Insert: {
          accomplishment?: string | null
          created_at?: string
          id?: string
          priority?: string | null
          slipped?: string | null
          user_id: string
          week: string
        }
        Update: {
          accomplishment?: string | null
          created_at?: string
          id?: string
          priority?: string | null
          slipped?: string | null
          user_id?: string
          week?: string
        }
        Relationships: []
      }
      season_area_plans: {
        Row: {
          area: string
          created_at: string
          id: string
          outcome: string
          priority: number
          season_id: string
        }
        Insert: {
          area: string
          created_at?: string
          id?: string
          outcome?: string
          priority?: number
          season_id: string
        }
        Update: {
          area?: string
          created_at?: string
          id?: string
          outcome?: string
          priority?: number
          season_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "season_area_plans_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      season_planning_lessons: {
        Row: {
          content: string
          created_at: string
          id: string
          kind: string
          season_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          kind: string
          season_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          kind?: string
          season_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "season_planning_lessons_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      season_reviews: {
        Row: {
          carry_forward: string
          changed_most: string
          completed_at: string | null
          created_at: string
          id: string
          leave_behind: string
          lesson: string
          obstacles: string
          proud_of: string
          season_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          carry_forward?: string
          changed_most?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          leave_behind?: string
          lesson?: string
          obstacles?: string
          proud_of?: string
          season_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          carry_forward?: string
          changed_most?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          leave_behind?: string
          lesson?: string
          obstacles?: string
          proud_of?: string
          season_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "season_reviews_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      season_snapshots: {
        Row: {
          bible_days: number
          coding_problems: number
          created_at: string
          deep_work_minutes: number
          gym_sessions: number
          id: string
          month: string
          user_id: string
        }
        Insert: {
          bible_days?: number
          coding_problems?: number
          created_at?: string
          deep_work_minutes?: number
          gym_sessions?: number
          id?: string
          month: string
          user_id: string
        }
        Update: {
          bible_days?: number
          coding_problems?: number
          created_at?: string
          deep_work_minutes?: number
          gym_sessions?: number
          id?: string
          month?: string
          user_id?: string
        }
        Relationships: []
      }
      seasons: {
        Row: {
          activated_at: string | null
          completed_at: string | null
          created_at: string
          ends_on: string
          id: string
          intention: string | null
          name: string
          previous_season_id: string | null
          starts_on: string
          statement: string | null
          status: string
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          completed_at?: string | null
          created_at?: string
          ends_on: string
          id?: string
          intention?: string | null
          name: string
          previous_season_id?: string | null
          starts_on: string
          statement?: string | null
          status?: string
          theme: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          completed_at?: string | null
          created_at?: string
          ends_on?: string
          id?: string
          intention?: string | null
          name?: string
          previous_season_id?: string | null
          starts_on?: string
          statement?: string | null
          status?: string
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasons_previous_season_id_fkey"
            columns: ["previous_season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          id: string
          name: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          onboarding_completed: boolean
          onboarding_completed_at: string | null
          onboarding_season_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          onboarding_season_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          onboarding_season_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_onboarding_season_id_fkey"
            columns: ["onboarding_season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_reviews: {
        Row: {
          completed_at: string | null
          created_at: string
          got_in_way: string
          id: string
          lesson: string
          next_primary_focus: string
          next_secondary_focus: string
          proud_of: string
          season_id: string
          updated_at: string
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          got_in_way?: string
          id?: string
          lesson?: string
          next_primary_focus?: string
          next_secondary_focus?: string
          proud_of?: string
          season_id: string
          updated_at?: string
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          got_in_way?: string
          id?: string
          lesson?: string
          next_primary_focus?: string
          next_secondary_focus?: string
          proud_of?: string
          season_id?: string
          updated_at?: string
          user_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_reviews_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          exercise: string
          id: string
          reps: number | null
          rpe: number | null
          sets: number | null
          weight: number | null
          workout_id: string
        }
        Insert: {
          exercise: string
          id?: string
          reps?: number | null
          rpe?: number | null
          sets?: number | null
          weight?: number | null
          workout_id: string
        }
        Update: {
          exercise?: string
          id?: string
          reps?: number | null
          rpe?: number | null
          sets?: number | null
          weight?: number | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          body_weight: number | null
          created_at: string
          duration: number | null
          entry_date: string
          id: string
          notes: string | null
          user_id: string
          workout_type: string
        }
        Insert: {
          body_weight?: number | null
          created_at?: string
          duration?: number | null
          entry_date: string
          id?: string
          notes?: string | null
          user_id: string
          workout_type: string
        }
        Update: {
          body_weight?: number | null
          created_at?: string
          duration?: number | null
          entry_date?: string
          id?: string
          notes?: string | null
          user_id?: string
          workout_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_onboarding: {
        Args: { input: Json }
        Returns: {
          already_completed: boolean
          season_id: string
        }[]
      }
    }
    Enums: {
      goal_type:
        | "binary"
        | "count"
        | "numeric"
        | "currency"
        | "duration"
        | "milestone"
        | "consistency"
        | "qualitative"
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
      goal_type: [
        "binary",
        "count",
        "numeric",
        "currency",
        "duration",
        "milestone",
        "consistency",
        "qualitative",
      ],
    },
  },
} as const
