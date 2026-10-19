// Types tương ứng với schema db/migrations/0001_init.sql
// Khi đổi schema, cập nhật file này.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type CustomerRow = {
  id: string;
  code: string;
  name: string;
  kind: string;
  contact: string | null;
  phone: string | null;
  address: string | null;
  samples_ytd: number;
  last_sample_at: string | null;
  created_at: string;
  updated_at: string;
};

type SampleRow = {
  id: string;
  code: string;
  customer_id: string | null;
  customer: string | null;
  type: string | null;
  received_at: string | null;
  due_at: string | null;
  technician: string | null;
  status: string;
  progress: number;
  criteria: Json;
  created_at: string;
};

type TestRequestRow = {
  id: string;
  code: string;
  customer_id: string | null;
  customer: string | null;
  customer_code: string | null;
  contact: string | null;
  phone: string | null;
  matrix: string | null;
  expected_samples: number | null;
  criteria: Json;
  purpose: string | null;
  decision_rule: string | null;
  expected_delivery_days: number | null;
  vat_rate: number;
  notes: string | null;
  status: string;
  contract_code: string | null;
  linked_sample_codes: Json;
  created_at: string;
  quoted_at: string | null;
  accepted_at: string | null;
};

type EquipmentRow = {
  id: string;
  code: string;
  name: string;
  model: string | null;
  location: string | null;
  last_calibration: string | null;
  next_calibration: string | null;
  status: string;
  usage_hours: number;
  created_at: string;
};

type ChemicalRow = {
  id: string;
  code: string;
  name: string;
  cas: string | null;
  unit: string | null;
  stock: number;
  min_stock: number;
  expiry: string | null;
  hazard: string | null;
  location: string | null;
  technical_spec: string | null;
  manufacturer: string | null;
  manufacture_date: string | null;
  received_at: string | null;
  storage_condition: string | null;
  used_for: Json;
  is_reference: boolean;
  created_at: string;
};

type StaffRow = {
  id: string;
  code: string;
  full_name: string;
  position: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  joined_at: string | null;
  competencies: Json;
  trainings: Json;
  status: string;
  created_at: string;
};

type ToolRow = {
  id: string;
  code: string;
  name: string;
  category: string | null;
  spec: string | null;
  qty: number;
  unit: string | null;
  min_qty: number;
  location: string | null;
  calibration_required: boolean;
  last_calibration: string | null;
  next_calibration: string | null;
  status: string;
};

type ArchivedSampleRow = {
  id: string;
  archive_code: string;
  original_sample_code: string | null;
  customer: string | null;
  type: string | null;
  archived_at: string | null;
  expiry_at: string | null;
  location: string | null;
  storage_condition: string | null;
  amount: string | null;
  status: string;
  qc_analysis_at: string | null;
  qc_note: string | null;
  purpose: string | null;
  created_at: string;
};

type RiskRow = {
  id: string;
  code: string;
  category: string | null;
  title: string;
  cause: string | null;
  effect: string | null;
  likelihood: number;
  impact: number;
  controls: string | null;
  treatment: string | null;
  action: string | null;
  owner: string | null;
  review_at: string | null;
  residual_likelihood: number | null;
  residual_impact: number | null;
  status: string;
  iso_clause: string | null;
  created_at: string;
};

type CustomerFeedbackRow = {
  id: string;
  code: string;
  customer_name: string | null;
  customer_kind: string | null;
  submitted_at: string | null;
  service_attitude: string | null;
  fee: string | null;
  quality: string | null;
  info_availability: string | null;
  delivery_time: string | null;
  comments: string | null;
  is_complaint: boolean;
  complaint_status: string | null;
  response_date: string | null;
  responder: string | null;
  response_note: string | null;
  created_at: string;
};

type ServiceRow = {
  id: string;
  code: string;
  name: string;
  group_name: string;
  description: string | null;
  unit: string | null;
  base_price: number;
  turnaround: string | null;
  methods: Json;
  vilas: boolean;
};

type DecisionRuleRow = {
  id: string;
  criterion: string;
  matrix: string | null;
  method: string | null;
  unit: string | null;
  limit_value: number | null;
  limit_direction: string | null;
  limit_min: number | null;
  limit_source: string | null;
  uncertainty: number | null;
  rule_type: string | null;
  acceptance_upper: number | null;
  acceptance_lower: number | null;
  rejection_upper: number | null;
  rejection_lower: number | null;
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
};

type CampaignRow = {
  id: string;
  code: string;
  name: string;
  scope: string | null;
  area: string | null;
  client: string | null;
  funding_source: string | null;
  purpose: string | null;
  matrix: Json;
  criteria: Json;
  planned_points: number;
  collected_samples: number;
  analyzed_samples: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
  leader: string | null;
  report_code: string | null;
  report_published_at: string | null;
  exceedance_count: number | null;
  points: Json;
  trend: Json;
  created_at: string;
};

type GenericInsert<T> = Omit<T, "id" | "created_at" | "updated_at"> & {
  id?: string;
};
type GenericUpdate<T> = Partial<T>;

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: CustomerRow;
        Insert: GenericInsert<CustomerRow>;
        Update: GenericUpdate<CustomerRow>;
      };
      samples: {
        Row: SampleRow;
        Insert: GenericInsert<SampleRow>;
        Update: GenericUpdate<SampleRow>;
      };
      test_requests: {
        Row: TestRequestRow;
        Insert: GenericInsert<TestRequestRow>;
        Update: GenericUpdate<TestRequestRow>;
      };
      equipment: {
        Row: EquipmentRow;
        Insert: GenericInsert<EquipmentRow>;
        Update: GenericUpdate<EquipmentRow>;
      };
      chemicals: {
        Row: ChemicalRow;
        Insert: GenericInsert<ChemicalRow>;
        Update: GenericUpdate<ChemicalRow>;
      };
      staff: {
        Row: StaffRow;
        Insert: GenericInsert<StaffRow>;
        Update: GenericUpdate<StaffRow>;
      };
      tools: {
        Row: ToolRow;
        Insert: GenericInsert<ToolRow>;
        Update: GenericUpdate<ToolRow>;
      };
      archived_samples: {
        Row: ArchivedSampleRow;
        Insert: GenericInsert<ArchivedSampleRow>;
        Update: GenericUpdate<ArchivedSampleRow>;
      };
      risks: {
        Row: RiskRow;
        Insert: GenericInsert<RiskRow>;
        Update: GenericUpdate<RiskRow>;
      };
      customer_feedback: {
        Row: CustomerFeedbackRow;
        Insert: GenericInsert<CustomerFeedbackRow>;
        Update: GenericUpdate<CustomerFeedbackRow>;
      };
      services: {
        Row: ServiceRow;
        Insert: GenericInsert<ServiceRow>;
        Update: GenericUpdate<ServiceRow>;
      };
      decision_rules: {
        Row: DecisionRuleRow;
        Insert: GenericInsert<DecisionRuleRow>;
        Update: GenericUpdate<DecisionRuleRow>;
      };
      campaigns: {
        Row: CampaignRow;
        Insert: GenericInsert<CampaignRow>;
        Update: GenericUpdate<CampaignRow>;
      };
    };
  };
};
