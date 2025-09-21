import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Customer {
  id: string
  customer_code: string
  company_name: string
  address_line1?: string
  address_line2?: string
  city?: string
  postal_code?: string
  country?: string
  primary_contact_name?: string
  primary_contact_email?: string
  primary_contact_phone?: string
  secondary_contact_name?: string
  secondary_contact_email?: string
  secondary_contact_phone?: string
  website?: string
  opening_hours?: string
  internal_notes?: string
  created_at: string
  updated_at: string
}

export interface Port {
  id: string
  port_code: string
  port_name: string
  city: string
  country: string
  region?: string
  created_at: string
}

export interface Supplier {
  id: string
  supplier_code: string
  company_name: string
  category: string
  address?: string
  contact_person?: string
  email?: string
  phone?: string
  website?: string
  payment_terms?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  service_code: string
  service_name: string
  category: string
  unit: string
  description?: string
  default_purchase_price?: number
  default_sales_price?: number
  currency: string
  created_at: string
  updated_at: string
}

export interface DocumentTemplate {
  id: string
  template_name: string
  template_type: string
  html_content: string
  variables: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Case {
  id: string
  case_number: string
  case_type: 'quotation' | 'booking'
  direction: string
  status: string
  customer_id?: string
  customer_reference?: string
  cargo_description?: string
  container_type?: string
  container_quantity?: number
  weight_kg?: number
  volume_cbm?: number
  loading_port_id?: string
  discharge_port_id?: string
  loading_terminal?: string
  discharge_terminal?: string
  vessel_name?: string
  carrier?: string
  voyage_number?: string
  pickup_date?: string
  delivery_date?: string
  standard_closing?: string
  vwm_closing?: string
  cy_closing?: string
  dock_closing_carrier?: string
  dock_closing_customer?: string
  validity_from?: string
  validity_to?: string
  incoterms?: string
  payment_terms?: string
  notes?: string
  created_at: string
  updated_at: string
  customer?: Customer
  loading_port?: Port
  discharge_port?: Port
}

export interface CaseStatusHistory {
  id: string
  case_id: string
  old_status?: string
  new_status: string
  changed_by?: string
  change_reason?: string
  created_at: string
}

export interface CaseDocument {
  id: string
  case_id: string
  document_name: string
  document_type: string
  file_path?: string
  html_content?: string
  created_at: string
}

export interface CaseFinance {
  id: string
  case_id: string
  quantity: number
  service_id?: string
  additional_text?: string
  purchase_price: number
  purchase_currency: string
  supplier_id?: string
  sales_price: number
  sales_currency: string
  customer_id?: string
  created_at: string
  updated_at: string
  service?: Service
  supplier?: Supplier
  customer?: Customer
}

// Status options
export const STATUS_OPTIONS = [
  'draft',
  'active',
  'completed',
  'cancelled',
  'on_hold',
  'archived'
]

// Currency options
export const CURRENCY_OPTIONS = [
  'EUR',
  'USD',
  'GBP',
  'JPY',
  'CNY',
  'SGD',
  'AED'
]

// Container types
export const CONTAINER_TYPES = [
  '20ft Standard',
  '40ft Standard',
  '40ft High Cube',
  '45ft High Cube',
  '20ft Reefer',
  '40ft Reefer',
  'LCL'
]

// Incoterms
export const INCOTERMS = [
  'EXW',
  'FCA',
  'CPT',
  'CIP',
  'DAP',
  'DPU',
  'DDP',
  'FAS',
  'FOB',
  'CFR',
  'CIF'
]