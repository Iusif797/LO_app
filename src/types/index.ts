export type RootStackParamList = {
  TokenInput: undefined;
  PostList: { token: string };
  [key: string]: object | undefined;
};

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface Post {
  id: string;
  text: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  photos?: {
    id: string;
    url: string;
    width: number;
    height: number;
  }[];
  created_at: string;
  updated_at: string;
}

export interface PostsResponse {
  data: Post[];
  hasMore: boolean;
  total?: number;
  page: number;
  limit: number;
} 