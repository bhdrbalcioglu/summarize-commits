export interface Group {
  id: string | number;
  avatar_url: string | null;
  description: string | null;
  name: string;
  path: string;
  provider: 'gitlab' | 'github';
  web_url: string;
}
