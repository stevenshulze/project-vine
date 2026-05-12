export type UserRole = 'employer' | 'affiliate' | 'admin'
export type JobStatus = 'draft' | 'active' | 'paused' | 'closed'
export type ApplicationStatus = 'applied' | 'reviewing' | 'hired' | 'rejected'
export type CommissionType = 'referral' | 'self_referral'
export type CommissionStatus = 'pending' | 'pending_verification' | 'approved' | 'paid' | 'disputed'
export type PayoutStatus = 'pending' | 'processing' | 'complete' | 'failed'
export type DisputeStatus = 'open' | 'resolved'

export interface User {
  id: string
  email: string
  role: UserRole
  created_at: string
}

export interface Organization {
  id: string
  name: string
  owner_id: string
  created_at: string
}

export interface Job {
  id: string
  org_id: string
  title: string
  description: string
  commission_amount: number
  status: JobStatus
  created_at: string
}

export interface AffiliateProfile {
  id: string
  user_id: string
  payout_email: string | null
  stripe_account_id: string | null
  created_at: string
}

export interface ReferralLink {
  id: string
  affiliate_id: string
  job_id: string
  token: string
  created_at: string
}

export interface ClickEvent {
  id: string
  referral_link_id: string
  ip_address: string | null
  user_agent: string | null
  fingerprint: string | null
  clicked_at: string
}

export interface Application {
  id: string
  job_id: string
  referral_link_id: string | null
  candidate_name: string
  candidate_email: string
  resume_url: string | null
  is_self_referral: boolean
  status: ApplicationStatus
  applied_at: string
}

export interface Commission {
  id: string
  application_id: string
  affiliate_id: string
  amount: number
  commission_type: CommissionType
  status: CommissionStatus
  eligible_at: string | null
  created_at: string
}

export interface Payout {
  id: string
  affiliate_id: string
  amount: number
  stripe_transfer_id: string | null
  status: PayoutStatus
  created_at: string
}

export interface Dispute {
  id: string
  commission_id: string
  raised_by: string
  reason: string
  status: DisputeStatus
  created_at: string
}

export interface AuditLog {
  id: string
  entity_type: string
  entity_id: string
  changed_by: string | null
  change_type: string
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  created_at: string
}

// Supabase generic Database type — use with createClient<Database>()
export type Database = {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'created_at'>
        Update: Partial<Omit<User, 'id' | 'created_at'>>
      }
      organizations: {
        Row: Organization
        Insert: Omit<Organization, 'id' | 'created_at'>
        Update: Partial<Omit<Organization, 'id' | 'created_at'>>
      }
      jobs: {
        Row: Job
        Insert: Omit<Job, 'id' | 'created_at'>
        Update: Partial<Omit<Job, 'id' | 'created_at'>>
      }
      affiliate_profiles: {
        Row: AffiliateProfile
        Insert: Omit<AffiliateProfile, 'id' | 'created_at'>
        Update: Partial<Omit<AffiliateProfile, 'id' | 'created_at'>>
      }
      referral_links: {
        Row: ReferralLink
        Insert: Omit<ReferralLink, 'id' | 'token' | 'created_at'>
        Update: Partial<Omit<ReferralLink, 'id' | 'created_at'>>
      }
      click_events: {
        Row: ClickEvent
        Insert: Omit<ClickEvent, 'id' | 'clicked_at'>
        Update: never
      }
      applications: {
        Row: Application
        Insert: Omit<Application, 'id' | 'applied_at'>
        Update: Partial<Omit<Application, 'id' | 'applied_at'>>
      }
      commissions: {
        Row: Commission
        Insert: Omit<Commission, 'id' | 'created_at'>
        Update: Partial<Omit<Commission, 'id' | 'created_at'>>
      }
      payouts: {
        Row: Payout
        Insert: Omit<Payout, 'id' | 'created_at'>
        Update: Partial<Omit<Payout, 'id' | 'created_at'>>
      }
      disputes: {
        Row: Dispute
        Insert: Omit<Dispute, 'id' | 'created_at'>
        Update: Partial<Omit<Dispute, 'id' | 'created_at'>>
      }
      audit_logs: {
        Row: AuditLog
        Insert: Omit<AuditLog, 'id' | 'created_at'>
        Update: never
      }
    }
  }
}
