-- ============================================================
-- SQL DE CONFIGURAÇÃO E GERENCIAMENTO NO SUPABASE (ORÇAFÁCIL)
-- Execute no SQL Editor do painel Supabase se desejar
-- ============================================================

-- 1. Tabela de Itens do Catálogo (Serviços e Produtos)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  type TEXT NOT NULL DEFAULT 'SERVICE', -- 'SERVICE' ou 'PRODUCT'
  unit TEXT DEFAULT 'un',
  company_id TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Orçamentos
CREATE TABLE IF NOT EXISTS public.quotes (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  customer_name TEXT NOT NULL DEFAULT '',
  customer_phone TEXT DEFAULT '',
  customer_email TEXT DEFAULT '',
  customer_address TEXT DEFAULT '',
  customer_city TEXT DEFAULT '',
  customer_state TEXT DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  notes TEXT DEFAULT '',
  provider_info JSONB DEFAULT '{}'::jsonb,
  company_id TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Dados Profissionais do Prestador
CREATE TABLE IF NOT EXISTS public.provider_info (
  id TEXT PRIMARY KEY,
  company_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  document TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  logo TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Políticas de segurança RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso total a produtos para anon" 
  ON public.products FOR ALL 
  TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Permitir acesso total a orçamentos para anon" 
  ON public.quotes FOR ALL 
  TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Permitir acesso total a dados do prestador para anon" 
  ON public.provider_info FOR ALL 
  TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

-- ============================================================
-- COMANDOS PRONTOS PARA DESABILITAR / REATIVAR CLIENTES (INADIMPLÊNCIA)
-- ============================================================

-- A) PARA DESABILITAR UM CLIENTE INADIMPLENTE:
-- Substitua 'cliente@email.com' pelo e-mail do cliente:
/*
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"status": "suspended", "status_reason": "Assinatura suspensa por pendência financeira. Entre em contato para regularizar seu plano."}'::jsonb
WHERE email = 'cliente@email.com';
*/

-- B) PARA REATIVAR O CLIENTE APÓS O PAGAMENTO:
/*
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"status": "active", "status_reason": null}'::jsonb
WHERE email = 'cliente@email.com';
*/

-- C) CONSULTAR STATUS DE TODOS OS CLIENTES:
/*
SELECT id, email, created_at, raw_user_meta_data->>'name' as nome, raw_user_meta_data->>'status' as status
FROM auth.users
ORDER BY created_at DESC;
*/
