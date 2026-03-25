export interface AuthSession {
  authenticated: boolean;
  expires_at: string | null;
}

export interface ProvinceOption {
  id: number;
  code: string;
  name: string;
}

export interface SceneTemplateOption {
  id: number;
  description: string;
  device_type: string;
  placement_type: string;
  channel_type: string;
  example_count: number;
}

export interface CatalogOptions {
  versions: number[];
  provinces: ProvinceOption[];
  scene_templates: SceneTemplateOption[];
}

export interface GenerationRecord {
  id: string;
  sequence: number;
  synthetic_id: string;
  thai_prefix: string;
  thai_first_name: string;
  thai_last_name: string;
  english_prefix: string;
  english_first_name: string;
  english_last_name: string;
  birth_date_iso: string;
  birth_date_th: string;
  birth_date_en: string;
  religion: string;
  address: string;
  issue_date_iso: string;
  issue_date_th: string;
  issue_date_en: string;
  expiry_date_iso: string;
  expiry_date_th: string;
  expiry_date_en: string;
  portrait_description: string;
  scene_description: string;
  version: number;
  selected_for_generation: boolean;
  generation_status: string;
  prompt: string | null;
  province_id: number;
  district_id: number;
  scene_template_id: number | null;
  generated_asset_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GenerationBatchSummary {
  id: string;
  status: string;
  requested_count: number;
  created_at: string;
  updated_at: string;
  record_count: number;
  selected_count: number;
}

export interface GenerationBatch {
  id: string;
  status: string;
  requested_count: number;
  created_at: string;
  updated_at: string;
  selected_count: number;
  records: GenerationRecord[];
}

export interface JobItem {
  id: string;
  record_id: string;
  asset_id: string | null;
  status: string;
  output_path: string | null;
  error: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface GenerationJob {
  id: string;
  batch_id: string;
  status: string;
  total_items: number;
  completed_items: number;
  failed_items: number;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  error: string | null;
  items: JobItem[];
}

export interface BatchCreateRequest {
  count: number;
  versions: number[];
  province_ids: number[];
  scene_template_ids: number[];
  use_llm: boolean;
}

export interface GeneratedAsset {
  id: string;
  batch_id: string;
  record_id: string;
  job_id: string;
  file_name: string;
  file_path: string;
  prompt: string;
  created_at: string;
}
