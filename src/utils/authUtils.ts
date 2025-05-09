import 'react-native-get-random-values';
import { Platform, Linking } from 'react-native';
import { generatePKCE, getAuthorizationUrl, exchangeCodeForToken } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TokenData } from '../types';

const STATE_STORAGE_KEY = 'auth_state';
const CODE_VERIFIER_STORAGE_KEY = 'code_verifier';
const TOKEN_STORAGE_KEY = 'auth_tokens';

const saveToStorage = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
    throw error;
  }
};

const getFromStorage = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error(`Error getting ${key} from storage:`, error);
    throw error;
  }
};

export const initiateAuthFlow = async (redirectUri: string): Promise<string> => {
  try {
    const state = Math.random().toString(36).substring(2, 15);
    
    const { codeVerifier, codeChallenge } = await generatePKCE();
    
    await saveToStorage(STATE_STORAGE_KEY, state);
    await saveToStorage(CODE_VERIFIER_STORAGE_KEY, codeVerifier);
    
    const authUrl = getAuthorizationUrl(codeChallenge, redirectUri, state);
    
    return authUrl;
  } catch (error) {
    console.error('Error initiating auth flow:', error);
    throw new Error('Не удалось инициализировать процесс аутентификации');
  }
};

export const setupUrlListener = (callback: (url: string) => void): (() => void) => {
  const subscription = Linking.addEventListener('url', (event) => {
    callback(event.url);
  });

  Linking.getInitialURL().then((url) => {
    if (url) {
      callback(url);
    }
  });

  return () => subscription.remove();
};

export const extractAuthCode = async (url: string): Promise<string | null> => {
  try {
    console.log('Extracting auth code from URL:', url);

    let code = null;
    let state = null;

    if (url.includes('default?')) {
      const queryString = url.split('default?')[1];
      const params = new URLSearchParams(queryString);
      code = params.get('code');
      state = params.get('state');
    }
    else if (url.includes('?')) {
      const urlObj = new URL(url);
      code = urlObj.searchParams.get('code');
      state = urlObj.searchParams.get('state');
    } 
    else if (url.includes('#')) {
      const hashPart = url.split('#')[1];
      const params = new URLSearchParams(hashPart);
      code = params.get('code');
      state = params.get('state');
    }

    console.log('Extracted code:', code ? 'exists' : 'null');
    console.log('Extracted state:', state ? 'exists' : 'null');
    
    const savedState = await getFromStorage(STATE_STORAGE_KEY);
    console.log('Saved state exists:', savedState ? 'yes' : 'no');
    
    if (!state || state !== savedState) {
      console.warn('State mismatch, possible CSRF attack');
      console.log('Received state:', state);
      console.log('Saved state:', savedState);
      throw new Error('Неверное состояние, возможная CSRF атака');
    }
    
    return code;
  } catch (error) {
    console.error('Error extracting auth code:', error);
    return null;
  }
};

export const completeAuthFlow = async (
  code: string,
  redirectUri: string
): Promise<TokenData> => {
  try {
    console.log('Completing auth flow with code:', code ? code.substring(0, 5) + '...' : 'null');
    console.log('Redirect URI:', redirectUri);
    
    const codeVerifier = await getFromStorage(CODE_VERIFIER_STORAGE_KEY);
    
    if (!codeVerifier) {
      console.error('No code_verifier found in storage');
      throw new Error('Не найден code_verifier');
    }
    
    console.log('Code verifier found, length:', codeVerifier.length);
    
    const tokenResponse = await exchangeCodeForToken(code, codeVerifier, redirectUri);
    
    if (!tokenResponse || !tokenResponse.access_token) {
      console.error('Token response is invalid:', tokenResponse);
      throw new Error('Получен некорректный ответ от сервера аутентификации');
    }
    
    console.log('Token exchange successful, access token received');
    
    const expiresAt = Date.now() + (tokenResponse.expires_in || 3600) * 1000;
    
    const tokenData: TokenData = {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt
    };
    
    await saveToStorage(TOKEN_STORAGE_KEY, JSON.stringify(tokenData));
    
    return tokenData;
  } catch (error) {
    console.error('Error completing auth flow:', error);
    throw new Error('Не удалось завершить аутентификацию');
  }
};

export const getStoredTokens = async (): Promise<TokenData | null> => {
  try {
    const tokensJson = await getFromStorage(TOKEN_STORAGE_KEY);
    
    if (!tokensJson) {
      return null;
    }
    
    return JSON.parse(tokensJson) as TokenData;
  } catch (error) {
    console.error('Error getting stored tokens:', error);
    return null;
  }
};

export const isTokenExpired = (expiresAt: number): boolean => {
  return Date.now() >= expiresAt;
};

export const clearAuthData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STATE_STORAGE_KEY,
      CODE_VERIFIER_STORAGE_KEY,
      TOKEN_STORAGE_KEY
    ]);
  } catch (error) {
    console.error('Error clearing auth data:', error);
    throw error;
  }
};