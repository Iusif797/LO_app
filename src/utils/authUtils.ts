import 'react-native-get-random-values';
import { Platform, Linking } from 'react-native';
import { generatePKCE, getAuthorizationUrl, exchangeCodeForToken, getTokenDirectly, refreshToken } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TokenData } from '../types';

const STATE_STORAGE_KEY = 'auth_state';
const CODE_VERIFIER_STORAGE_KEY = 'code_verifier';
const TOKEN_STORAGE_KEY = 'auth_tokens';
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';

const CLIENT_ID = 5;

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

/**
 * Сохраняет токен авторизации и данные о его сроке истечения
 */
export const saveToken = async (
  accessToken: string, 
  refreshToken?: string, 
  expiresIn: number = 3600
): Promise<void> => {
  try {
    const expiresAt = Date.now() + expiresIn * 1000;
    
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    await AsyncStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString());
    
    // Для обратной совместимости сохраняем токен в старом формате
    const tokenData: TokenData = {
      accessToken,
      refreshToken: refreshToken || '',
      expiresAt
    };
    
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenData));
    
    console.log('Токен успешно сохранен. Истечет через', expiresIn, 'секунд');
  } catch (error) {
    console.error('Ошибка при сохранении токена:', error);
    throw error;
  }
};

/**
 * Проверяет токен и при необходимости обновляет его
 */
export const getValidToken = async (): Promise<string | null> => {
  try {
    // Получаем текущий токен
    const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshTokenValue = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    const expiryString = await AsyncStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (!accessToken) {
      console.log('Токен не найден, необходима авторизация');
      return null;
    }
    
    // Проверяем, истек ли срок действия токена
    if (expiryString) {
      const expiresAt = parseInt(expiryString, 10);
      
      // Если токен действителен, возвращаем его
      if (Date.now() < expiresAt) {
        console.log('Токен действителен, используем его');
        return accessToken;
      }
      
      console.log('Токен истек, пытаемся обновить');
      
      // Пробуем обновить токен через refresh_token, если он есть
      if (refreshTokenValue) {
        console.log('Используем refresh_token для обновления');
        const newTokens = await refreshToken(refreshTokenValue);
        
        if (newTokens) {
          console.log('Токен успешно обновлен через refresh_token');
          await saveToken(newTokens.access_token, newTokens.refresh_token);
          return newTokens.access_token;
        }
      }
      
      // Если не удалось обновить через refresh_token, пытаемся получить новый токен напрямую
      console.log('Пытаемся получить новый токен напрямую');
      const newToken = await getTokenDirectly();
      
      if (newToken) {
        console.log('Получен новый токен');
        await saveToken(newToken);
        return newToken;
      }
    }
    
    // Если токен истек и не удалось обновить, возвращаем null
    console.log('Не удалось получить действительный токен');
    return null;
  } catch (error) {
    console.error('Ошибка при получении валидного токена:', error);
    return null;
  }
};

export const initiateAuthFlow = async (redirectUri: string): Promise<string> => {
  try {
    // Эта функция оставлена для обратной совместимости, 
    // но всю логику PKCE мы перенесли в TokenInputScreen
    return `https://api.lo.ink/v1/auth?client_id=1&redirect_uri=${redirectUri}&response_type=code`;
  } catch (error) {
    console.error('Error initiating OAuth flow:', error);
    throw error;
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

export const completeAuthFlow = async (code: string, redirectUri: string): Promise<{ accessToken: string, refreshToken: string }> => {
  try {
    // Функция оставлена для обратной совместимости
    return {
      accessToken: 'mock_token', 
      refreshToken: 'mock_refresh_token'
    };
  } catch (error) {
    console.error('Error completing OAuth flow:', error);
    throw error;
  }
};

export const getStoredTokens = async (): Promise<TokenData | null> => {
  try {
    // Сначала пытаемся получить токен из нового формата хранения
    const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    const expiryString = await AsyncStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (accessToken && expiryString) {
      return {
        accessToken,
        refreshToken: refreshToken || '',
        expiresAt: parseInt(expiryString, 10)
      };
    }
    
    // Для обратной совместимости пробуем старый формат
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
      TOKEN_STORAGE_KEY,
      ACCESS_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      TOKEN_EXPIRY_KEY
    ]);
    console.log('Все данные авторизации успешно очищены');
  } catch (error) {
    console.error('Error clearing auth data:', error);
    throw error;
  }
};