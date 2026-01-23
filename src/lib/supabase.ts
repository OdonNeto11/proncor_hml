import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug: Se isso aparecer vazio no console, o .env não foi lido
if (!supabaseUrl || !supabaseKey) {
  console.error('ERRO CRÍTICO: Variáveis de ambiente do Supabase não encontradas!');
}

export const supabase = createClient(supabaseUrl, supabaseKey)