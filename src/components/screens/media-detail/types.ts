export interface CastMember {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  job?: string;
}

export interface InfoRowData {
  label: string;
  value: string;
}
