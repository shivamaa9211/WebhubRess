import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ljsyaexfuygbesgnxkaq.supabase.co';
const supabaseKey = 'sb_publishable_7IJ4x4Ge3niYbxw8Wje90Q_2ZVXpnVV';

export const supabase = createClient(supabaseUrl, supabaseKey);