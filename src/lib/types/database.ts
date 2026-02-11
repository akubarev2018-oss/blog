export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  cover_image: string | null;
  images_urls: string[];
  tags: string[];
  created_at: string;
  profiles?: Profile | null;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  text: string;
  likes_count: number;
  created_at: string;
  profiles?: Profile | null;
}

export interface Like {
  id: number;
  user_id: string;
  post_id: string | null;
  comment_id: string | null;
}
