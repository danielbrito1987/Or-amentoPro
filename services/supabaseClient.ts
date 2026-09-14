import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xdgqllcqowkcxydzsfup.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZ3FsbGNxb3drY3h5ZHpzZnVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTE3MTQsImV4cCI6MjA4OTA2NzcxNH0.FvY6eE5i7M3g1z8_1q1mGqH4jQ3g_X2n4m8L7p4q0R4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);