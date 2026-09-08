
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fbbwsbhpdzbwulcjkoyn.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiYndzYmhwZHpid3VsY2prb3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MDI1OTEsImV4cCI6MjEwNDA3ODU5MX0._ue1B9f123rEXoiIw5mvxOBJBmB-tyzd1qi3tnqpw6w';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || process.env.API_KEY || ''),
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
  }
});
