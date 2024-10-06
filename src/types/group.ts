export type Group = {
  id: number;
  avatar_url: string;
  created_at: string;
  description: string;
  full_name: string;
  full_path: string;
  visibility: string;
  web_url: string;
  [key: string]: any; // Accommodate any extra properties
};
