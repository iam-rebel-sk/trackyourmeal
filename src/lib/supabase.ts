import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Member {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Meal {
  id: string;
  user_id: string;
  member_id: string;
  meal_date: string;
  meal_type: 'lunch' | 'dinner';
  price_at_time: number;
  archived: boolean;
  created_at: string;
}

export interface Settings {
  id: string;
  user_id: string;
  global_meal_price: number;
  created_at: string;
  updated_at: string;
}

export interface Archive {
  id: string;
  user_id: string;
  archived_at: string;
  total_amount: number;
  meal_count: number;
  snapshot_data: {
    members: { name: string; count: number; total: number; paid: number; remaining: number }[];
    meals: { member: string; date: string; type: string; price: number }[];
  };
  price_at_archive: number;
}
