export interface Consent {
  id: string;
  center_id: string;
  title: string;
  description: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateConsentData {
  title: string;
  description: string;
  content: string;
  is_active: boolean;
}

export interface UpdateConsentData {
  title: string;
  description: string;
  content: string;
  is_active: boolean;
}

export interface DeleteConsentResponse {
  message: string;
}
