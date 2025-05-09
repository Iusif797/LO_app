import axios from 'axios';
import { Post, PostsResponse, TokenResponse } from '../types';
import * as CryptoJS from 'crypto-js';
import { encode as base64encode } from 'base-64';

const API_URL = 'https://apidev.lo.ink/v1';
const AUTH_URL = 'https://api.lo.ink/v1';
const CLIENT_ID = 1;

const authApi = axios.create({
  baseURL: AUTH_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const postsApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchPosts = async (
  token: string,
  page: number = 1,
  limit: number = 10
): Promise<PostsResponse> => {
  try {
    const response = await postsApi.get('/posts/feed/', {
      params: {
        page,
        limit,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      data: response.data.items || [],
      hasMore: (response.data.total || 0) > page * limit,
      total: response.data.total,
      page,
      limit,
    };
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw new Error('Не удалось загрузить посты');
  }
};

export const generatePKCE = async (): Promise<{ codeVerifier: string; codeChallenge: string }> => {
  try {
    const generateRandomString = (length: number): string => {
      const possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
      let result = '';
      
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * possibleChars.length);
        result += possibleChars.charAt(randomIndex);
      }
      
      return result;
    };
    
    const codeVerifier = generateRandomString(64);
    
    const hashDigest = CryptoJS.SHA256(codeVerifier);
    
    const hashArray = CryptoJS.enc.Hex.parse(hashDigest.toString());
    const hashBase64 = hashArray.toString(CryptoJS.enc.Base64);
    
    const codeChallenge = hashBase64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    return {
      codeVerifier,
      codeChallenge
    };
  } catch (error) {
    console.error('Error generating PKCE:', error);
    throw error;
  }
};

export const getAuthorizationUrl = (
  codeChallenge: string,
  redirectUri: string,
  state: string
): string => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID.toString(),
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    scope: 'openid profile posts',
    state,
  });
  
  console.log('Auth URL params:', {
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    code_challenge_length: codeChallenge.length,
  });
  
  return `${AUTH_URL}/auth?${params.toString()}`;
};

export const exchangeCodeForToken = async (
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<TokenResponse> => {
  try {
    const formData = new URLSearchParams();
    formData.append('grant_type', 'authorization_code');
    formData.append('client_id', CLIENT_ID.toString());
    formData.append('code', code);
    formData.append('code_verifier', codeVerifier);
    formData.append('redirect_uri', redirectUri);

    console.log('Sending token request with params:', {
      client_id: CLIENT_ID,
      redirect_uri: redirectUri,
      code_verifier_length: codeVerifier.length
    });

    const response = await authApi.post('/identity/token', formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw new Error('Не удалось обменять код на токен');
  }
};