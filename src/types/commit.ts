export interface Commit {
  id: string;
  short_id: string;
  title: string;
  author_name: string;
  author_email: string;
  committer_name: string;
  committer_email: string;
  created_at: string;
  message: string;
  parent_ids: string[];
  web_url: string;
}

export interface CommitDiff {
  old_path: string;
  new_path: string;
  a_mode: string;
  b_mode: string;
  diff: string;
  new_file: boolean;
  renamed_file: boolean;
  deleted_file: boolean;
}

export interface CommitBundle {
  author_name: string;
  commit_id: string;
  message: string;
  files_changed: {
    file_path: string;
    diff: string;
  }[];
}


