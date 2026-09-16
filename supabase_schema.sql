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
  status TEXT DEFAULT 'pending', -- 'pending' ou 'approved'
  contract_id TEXT, -- ID do contrato gerado a partir deste orçamento
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

-- 4. Tabela de Contratos de Prestação de Serviços & Assinaturas
CREATE TABLE IF NOT EXISTS public.contracts (
  id TEXT PRIMARY KEY,
  contract_number TEXT NOT NULL,
  quote_id TEXT,
  quote_number TEXT,
  user_email TEXT,
  company_id TEXT,
  status TEXT DEFAULT 'pending_signatures', -- 'draft', 'pending_signatures', 'partially_signed', 'signed', 'cancelled'
  provider_name TEXT NOT NULL DEFAULT '',
  provider_document TEXT DEFAULT '',
  provider_address TEXT DEFAULT '',
  provider_email TEXT DEFAULT '',
  provider_phone TEXT DEFAULT '',
  client_name TEXT NOT NULL DEFAULT '',
  client_document TEXT DEFAULT '',
  client_address TEXT DEFAULT '',
  client_email TEXT DEFAULT '',
  client_phone TEXT DEFAULT '',
  client_city TEXT DEFAULT '',
  client_state TEXT DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  total_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  payment_terms TEXT DEFAULT '',
  deadline TEXT DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  item_clauses JSONB DEFAULT '[]'::jsonb,
  signatures JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabela de Perfis e Assinaturas dos Usuários (SaaS)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT '',
  company_id TEXT,
  role TEXT DEFAULT 'user', -- 'admin' ou 'user'
  plan TEXT DEFAULT 'pro', -- 'basic' (R$ 29,90), 'pro' (R$ 59,90) ou 'premium' (R$ 199,90)
  billing_cycle TEXT DEFAULT 'monthly', -- 'monthly' ou 'annual'
  subscription_status TEXT DEFAULT 'trial', -- 'trial', 'active', 'expired', 'partner'
  trial_ends_at TIMESTAMPTZ DEFAULT (timezone('utc'::text, now()) + interval '7 days'),
  subscription_valid_until TIMESTAMPTZ,
  partner_company TEXT,
  partner_code TEXT,
  status TEXT DEFAULT 'active', -- 'active' ou 'blocked' / 'suspended'
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Se a tabela profiles já existir no seu Supabase, adicione apenas as novas colunas se necessário:
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'pro';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_valid_until TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner_company TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner_code TEXT;

-- Se as tabelas quotes ou contracts já existirem, garanta as novas colunas:
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS contract_id TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS item_clauses JSONB DEFAULT '[]'::jsonb;

-- Políticas de segurança RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Permitir acesso total a contratos para anon" 
  ON public.contracts FOR ALL 
  TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Permitir leitura e escrita em profiles" 
  ON public.profiles FOR ALL 
  TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

-- Gatilho Automático opcional: quando um usuário se cadastra no auth.users, cria o perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  chosen_plan TEXT;
  chosen_cycle TEXT;
BEGIN
  chosen_plan := COALESCE(new.raw_user_meta_data->>'plan', 'pro');
  chosen_cycle := COALESCE(new.raw_user_meta_data->>'billing_cycle', 'monthly');

  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    company_id, 
    plan, 
    billing_cycle, 
    subscription_status, 
    trial_ends_at
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'company_id', 'comp_' || substr(md5(random()::text), 1, 8)),
    chosen_plan,
    chosen_cycle,
    CASE WHEN chosen_plan = 'premium' THEN 'expired' ELSE 'trial' END,
    CASE WHEN chosen_plan = 'premium' THEN now() ELSE now() + interval '7 days' END
  )
  ON CONFLICT (id) DO UPDATE SET
    plan = EXCLUDED.plan,
    billing_cycle = EXCLUDED.billing_cycle;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

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
