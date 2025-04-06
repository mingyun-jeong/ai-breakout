import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for leaderboard entries
export interface LeaderboardEntry {
  id?: string;
  user_name: string;
  score: number;
  play_time: number; // in seconds
  remaining_lives: number;
  difficulty: 'Easy' | 'Normal' | 'Hard';
  created_at?: string;
}

// Functions to interact with leaderboard
export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .order('play_time', { ascending: true })
    .order('remaining_lives', { ascending: false });

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }

  return data || [];
};

export const saveScore = async (entry: Omit<LeaderboardEntry, 'id' | 'created_at'>): Promise<boolean> => {
  const { error } = await supabase.from('leaderboard').insert([entry]);

  if (error) {
    console.error('Error saving score:', error);
    return false;
  }

  return true;
}; 