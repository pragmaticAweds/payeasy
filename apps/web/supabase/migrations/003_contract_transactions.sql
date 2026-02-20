-- Store lifecycle events for contract transaction signing/submission.

CREATE TABLE IF NOT EXISTS public.contract_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  contract_id text NOT NULL,
  method text NOT NULL,
  wallet_address text NOT NULL,
  network text NOT NULL DEFAULT 'testnet',
  status text NOT NULL DEFAULT 'pending_signature' CHECK (
    status IN (
      'pending_signature',
      'signed',
      'submitted',
      'pending',
      'success',
      'failed',
      'cancelled'
    )
  ),
  tx_hash text UNIQUE,
  fee_stroops bigint,
  gas_estimate bigint,
  request_xdr text,
  signed_xdr text,
  result_xdr text,
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_contract_transactions_user_created
  ON public.contract_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contract_transactions_tx_hash
  ON public.contract_transactions(tx_hash)
  WHERE tx_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contract_transactions_status
  ON public.contract_transactions(status);

ALTER TABLE public.contract_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contract_transactions_select_own"
  ON public.contract_transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "contract_transactions_insert_own"
  ON public.contract_transactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "contract_transactions_update_own"
  ON public.contract_transactions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON public.contract_transactions TO authenticated;

CREATE OR REPLACE FUNCTION public.trigger_set_contract_transactions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_contract_transactions_updated_at ON public.contract_transactions;

CREATE TRIGGER set_contract_transactions_updated_at
  BEFORE UPDATE ON public.contract_transactions
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_contract_transactions_updated_at();
