export type UserProfile = {
  id: string;
  public_key: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
};

export type Listing = {
  id: string;
  landlord_id: string;
  title: string;
  description: string | null;
  address: string;
  rent_xlm: number;
  bedrooms: number;
  bathrooms: number;
  latitude?: number;
  longitude?: number;
  is_available: boolean;
  images: string[];
  amenities: string[];
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  listing_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
};

export type PaymentRecord = {
  id: string;
  user_id: string;
  listing_id: string;
  amount_paid: number;
  transaction_hash: string;
  status: "pending" | "confirmed" | "failed" | "refunded";
  memo: string | null;
  created_at: string;
};

export type ContractTransactionStatus =
  | "pending_signature"
  | "signed"
  | "submitted"
  | "pending"
  | "success"
  | "failed"
  | "cancelled";

export type ContractTransaction = {
  id: string;
  user_id: string;
  listing_id: string | null;
  contract_id: string;
  method: string;
  wallet_address: string;
  network: string;
  status: ContractTransactionStatus;
  tx_hash: string | null;
  fee_stroops: number | null;
  gas_estimate: number | null;
  request_xdr: string | null;
  signed_xdr: string | null;
  result_xdr: string | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type RentAgreement = {
  id: string;
  listing_id: string;
  tenant_id: string;
  contract_id: string;
  status: "pending" | "active" | "expired" | "terminated";
  start_date: string | null;
  end_date: string | null;
  deposit_xlm: number | null;
  terms: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

// Joined types for UI
export type ListingWithLandlord = Listing & {
  users: Pick<UserProfile, "username" | "avatar_url" | "public_key">;
};

export type MessageWithSender = Message & {
  sender: Pick<UserProfile, "username" | "avatar_url">;
};
