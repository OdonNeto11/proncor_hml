import { createClient } from '@supabase/supabase-js'

// Certifique-se que estas variáveis existem no seu .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('ERRO: Faltam as chaves do Supabase no .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseKey)