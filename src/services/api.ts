import axios from 'axios';
import { Post, PostsResponse, TokenResponse } from '../types';
import * as CryptoJS from 'crypto-js';
import { encode as base64encode } from 'base-64';

const API_URL = 'https://api.lo.ink/v1';
const AUTH_URL = 'https://api.lo.ink/v1';
const CLIENT_ID = 1;
const CLIENT_SECRET = '';

const authApi = axios.create({
  baseURL: AUTH_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Origin': 'app://com.lo.app',
    'Accept-Language': 'en',
    'User-Agent': 'LOApp/1.0.0'
  },
});

const postsApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Origin': 'app://com.lo.app',
    'Accept-Language': 'en',
    'User-Agent': 'LOApp/1.0.0'
  },
});

const MOCK_POSTS: Post[] = [
  {
    id: "post1",
    text: "Это тестовый пост для демонстрации работы приложения. Вы видите этот пост, потому что используется мок-токен.",
    author: {
      id: "user1",
      name: "Юсиф Мамедов",
      avatar: "https://xsgames.co/randomusers/avatar.php?g=male"
    },
    photos: [
      {
        id: "photo1",
        url: "https://picsum.photos/800/600",
        width: 800,
        height: 600
      }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "post2",
    text: "Второй тестовый пост с другим форматированием и изображением. Поддерживается пагинация и рефреш.",
    author: {
      id: "user2",
      name: "Тестовый Пользователь",
      avatar: "https://xsgames.co/randomusers/avatar.php?g=female"
    },
    photos: [
      {
        id: "photo2",
        url: "https://picsum.photos/800/400",
        width: 800,
        height: 400
      }
    ],
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: "post3",
    text: "Пост без изображения, только текстовый контент для демонстрации разных типов постов.",
    author: {
      id: "user3",
      name: "LO Пользователь",
      avatar: undefined
    },
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString()
  }
];

export const fetchPosts = async (
  token: string,
  page: number = 1,
  limit: number = 10
): Promise<PostsResponse> => {
  try {
    if (token.startsWith("eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9") && token.includes("Mock User")) {
      console.log(`Используются мок-данные: страница ${page}, лимит ${limit}`);
      
      const totalMockPosts = [...MOCK_POSTS];
      for (let i = 0; i < 15; i++) {
        totalMockPosts.push({
          id: `post${i + 4}`,
          text: `Динамически сгенерированный пост #${i + 1} для тестирования пагинации.`,
          author: {
            id: "user1",
            name: "Юсиф Мамедов",
            avatar: "https://xsgames.co/randomusers/avatar.php?g=male"
          },
          created_at: new Date(Date.now() - (i * 900000)).toISOString(),
          updated_at: new Date(Date.now() - (i * 900000)).toISOString()
        });
      }
      
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedPosts = totalMockPosts.slice(startIndex, endIndex);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return {
        data: paginatedPosts,
        hasMore: endIndex < totalMockPosts.length,
        total: totalMockPosts.length,
        page,
        limit,
      };
    }
    
    console.log(`Запрос постов: страница ${page}, лимит ${limit}`);
    try {
      const response = await fetch(`${API_URL}/posts/feed?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
          'Origin': 'app://com.lo.app',
          'User-Agent': 'LOApp/1.0.0'
        }
      });
      
      console.log(`Ответ API статус: ${response.status}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Ошибка авторизации: токен недействителен или истек');
          throw new Error('401: Ошибка авторизации. Токен недействителен или истек');
        }
        
        console.error(`Ошибка API: ${response.status}`);
        const errorText = await response.text();
        console.error('Текст ошибки:', errorText);
        
        throw new Error(`${response.status}: ${errorText || 'Ошибка сервера'}`);
      }
      
      const responseData = await response.json();
      console.log('Полученные данные:', JSON.stringify(responseData).substring(0, 100) + '...');
      
      let items;
      if (responseData.data && responseData.data.items) {
        console.log(`Получено постов (во вложенной структуре): ${responseData.data.items.length || 0}`);
        items = responseData.data.items;
      } else if (responseData.items) {
        console.log(`Получено постов: ${responseData.items.length || 0}`);
        items = responseData.items;
      } else {
        console.error('Неожиданный формат ответа API:', responseData);
        throw new Error('Неверный формат данных от API');
      }

      const posts = items.map((item: any) => {
        return {
          id: item.id || `temp-${Math.random()}`,
          text: item.text || item.message || '',
          author: {
            id: item.author?.id || 'unknown',
            name: item.author?.name || 'Неизвестный автор',
            avatar: item.author?.avatar || null,
          },
          photos: (item.photos || item.images || [])
            .filter((photo: any) => photo && photo.url && photo.url.trim() !== '')
            .map((photo: any) => ({
              id: photo.id || `photo-${Math.random()}`,
              url: photo.url || '',
              width: photo.width || 300,
              height: photo.height || 300,
            })) || [],
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
        };
      });

      const totalCount = responseData.data?.count || responseData.total || 0;

      return {
        data: posts,
        hasMore: totalCount > page * limit,
        total: totalCount,
        page,
        limit,
      };
    } catch (apiError) {
      console.error('Ошибка при запросе к API:', apiError);
      
      try {
        console.log('Повторная попытка запроса с альтернативными заголовками...');
        
        const retryResponse = await postsApi.get('/posts/feed', {
          params: {
            page,
            limit,
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Accept-Language': 'en',
          },
        });
        
        if (retryResponse.data.items) {
          console.log('Успешный повторный запрос!');
          
          const posts = retryResponse.data.items.map((item: any) => ({
            id: item.id || `temp-${Math.random()}`,
            text: item.text || '',
            author: {
              id: item.author?.id || 'unknown',
              name: item.author?.name || 'Неизвестный автор',
              avatar: item.author?.avatar || null,
            },
            photos: item.photos?.map((photo: any) => ({
              id: photo.id || `photo-${Math.random()}`,
              url: photo.url || '',
              width: photo.width || 300,
              height: photo.height || 300,
            })) || [],
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || new Date().toISOString(),
          }));
          
          return {
            data: posts,
            hasMore: (retryResponse.data.total || 0) > page * limit,
            total: retryResponse.data.total || 0,
            page,
            limit,
          };
        }
      } catch (retryError) {
        console.error('Повторная попытка также не удалась:', retryError);
      }
      
      if (axios.isAxiosError(apiError)) {
        console.error('Детали ошибки:', {
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data,
          headers: apiError.response?.headers,
          config: {
            url: apiError.config?.url,
            method: apiError.config?.method,
            params: apiError.config?.params,
            headers: apiError.config?.headers
          }
        });
        
        console.log('Используются резервные мок-данные из-за ошибки API');
        
        const totalMockPosts = [...MOCK_POSTS];
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedPosts = totalMockPosts.slice(startIndex, endIndex);
        
        return {
          data: paginatedPosts,
          hasMore: endIndex < totalMockPosts.length,
          total: totalMockPosts.length,
          page,
          limit,
        };
      }
      
      throw apiError;
    }
  } catch (error) {
    console.error('Error fetching posts:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('401: Ошибка авторизации. Токен недействителен или истек');
      }
      
      if (!error.response) {
        throw new Error('Сервер недоступен или проблема с сетью');
      }
      
      throw new Error(`${error.response.status}: ${error.response.data?.message || 'Ошибка сервера'}`);
    }
    
    throw new Error('Не удалось загрузить посты');
  }
};

export const getTokenDirectly = async (): Promise<string | null> => {
  try {
    console.log('Начинаем процесс получения токена...');
    
    const isApiAvailable = await checkApiAvailability();
    if (!isApiAvailable) {
      console.log('API сервер недоступен, невозможно получить токен');
      return null;
    }
    
    try {
      console.log('Пытаемся получить токен через JSON запрос...');
      
      const jsonData = {
        grant_type: "password",
        client_id: CLIENT_ID.toString(),
        username: "yusifm.mamedov@mail.ru",
        password: "13579LO$"
      };
      
      console.log('Параметры запроса:', JSON.stringify(jsonData));
      
      const jsonResponse = await fetch(`${AUTH_URL}/identity/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': 'app://com.lo.app',
          'User-Agent': 'LOApp/1.0.0'
        },
        body: JSON.stringify(jsonData)
      });
      
      console.log('Получен ответ JSON с кодом:', jsonResponse.status);
      console.log('Заголовки ответа:', JSON.stringify(Object.fromEntries([...jsonResponse.headers.entries()])));
      
      if (jsonResponse.status === 200) {
        const jsonResponseData = await jsonResponse.json();
        console.log('Ответ на JSON запрос:', JSON.stringify(jsonResponseData).substring(0, 100) + '...');
        
        if (jsonResponseData && jsonResponseData.data && jsonResponseData.data.access_token) {
          console.log('Получен токен через JSON запрос (во вложенной структуре) длиной:', jsonResponseData.data.access_token.length);
          return jsonResponseData.data.access_token;
        } else if (jsonResponseData && jsonResponseData.access_token) {
          console.log('Получен токен через JSON запрос длиной:', jsonResponseData.access_token.length);
          return jsonResponseData.access_token;
        } else {
          console.log('Токен отсутствует в ответе с кодом 200:', jsonResponseData);
        }
      } else {
        console.log(`Ошибка при получении токена через JSON: ${jsonResponse.status}`);
        try {
          const errorData = await jsonResponse.json();
          console.log('Данные ошибки JSON:', JSON.stringify(errorData));
        } catch {
          const textError = await jsonResponse.text();
          console.log('Данные ошибки текст:', textError);
        }
      }
    } catch (jsonError) {
      console.log('Не удалось получить токен через JSON:', jsonError);
    }
    
    try {
      console.log('Пытаемся получить токен через form-data...');
      
      const passwordFormData = new URLSearchParams();
      passwordFormData.append('grant_type', 'password');
      passwordFormData.append('client_id', CLIENT_ID.toString());
      passwordFormData.append('username', 'yusifm.mamedov@mail.ru');
      passwordFormData.append('password', '13579LO$');
      
      passwordFormData.append('pushToken', '8F3F9678B591116F8338F7BD4FDC5BD1C8A8B399D7E50B06F1869EA1E1B7606C');
      
      console.log('Параметры запроса form-data:', passwordFormData.toString());
      
      const passwordResponse = await fetch(`${AUTH_URL}/identity/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Origin': 'app://com.lo.app',
          'User-Agent': 'LOApp/1.0.0'
        },
        body: passwordFormData
      });
      
      console.log('Получен ответ с кодом:', passwordResponse.status);
      console.log('Заголовки ответа form-data:', JSON.stringify(Object.fromEntries([...passwordResponse.headers.entries()])));
      
      if (passwordResponse.status === 200) {
        const responseData = await passwordResponse.json();
        
        if (responseData && responseData.data && responseData.data.access_token) {
          console.log('Получен токен через password grant длиной:', responseData.data.access_token.length);
          return responseData.data.access_token;
        } else {
          console.log('Токен отсутствует в успешном ответе:', responseData);
        }
      } else {
        console.log(`Ошибка при получении токена: ${passwordResponse.status}`);
        let errorData;
        try {
          errorData = await passwordResponse.json();
          console.log('Данные ошибки (JSON):', JSON.stringify(errorData));
        } catch {
          errorData = await passwordResponse.text();
          console.log('Данные ошибки (текст):', errorData);
        }
      }
    } catch (passwordError) {
      console.log('Не удалось получить токен через password grant:', passwordError);
    }
    
    try {
      console.log('Пытаемся получить токен через client credentials...');
      
      const clientFormData = new URLSearchParams();
      clientFormData.append('grant_type', 'client_credentials');
      clientFormData.append('client_id', CLIENT_ID.toString());
      
      if (CLIENT_SECRET) {
        clientFormData.append('client_secret', CLIENT_SECRET);
      }
      
      const clientResponse = await fetch(`${AUTH_URL}/identity/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Origin': 'app://com.lo.app',
          'User-Agent': 'LOApp/1.0.0'
        },
        body: clientFormData
      });
      
      console.log('Получен ответ client credentials с кодом:', clientResponse.status);
      
      if (clientResponse.status === 200) {
        const clientData = await clientResponse.json();
        
        if (clientData && clientData.data && clientData.data.access_token) {
          console.log('Получен токен через client credentials длиной:', clientData.data.access_token.length);
          return clientData.data.access_token;
        }
      } else {
        console.log('Ошибка при client credentials:', clientResponse.status);
        try {
          const errorText = await clientResponse.text();
          console.log('Текст ошибки:', errorText);
        } catch (e) {
          console.log('Не удалось прочитать ответ');
        }
      }
    } catch (clientError) {
      console.log('Ошибка при client credentials:', clientError);
    }
    
    console.log('Все методы получения реального токена не удались');
    return null;
  } catch (error) {
    console.error('Критическая ошибка при получении токена:', error);
    return null;
  }
};

export const refreshToken = async (refreshTokenValue: string): Promise<{ access_token: string, refresh_token: string } | null> => {
  try {
    const refreshFormData = new URLSearchParams();
    refreshFormData.append('grant_type', 'refresh_token');
    refreshFormData.append('client_id', CLIENT_ID.toString());
    refreshFormData.append('refresh_token', refreshTokenValue);
    
    const response = await fetch(`${AUTH_URL}/identity/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: refreshFormData
    });
    
    if (response.status === 200) {
      const responseData = await response.json();
      
      if (responseData && responseData.data && responseData.data.access_token) {
        console.log('Токен успешно обновлен');
        return {
          access_token: responseData.data.access_token,
          refresh_token: responseData.data.refresh_token || refreshTokenValue
        };
      }
    } else {
      console.log(`Ошибка при обновлении токена: ${response.status}`);
    }
    
    return null;
  } catch (error) {
    console.error('Ошибка при обновлении токена:', error);
    return null;
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
    console.log('Отправка запроса на обмен кода на токен...');
    
    const formData = new URLSearchParams();
    formData.append('grant_type', 'authorization_code');
    formData.append('client_id', CLIENT_ID.toString());
    formData.append('code', code);
    formData.append('code_verifier', codeVerifier);
    formData.append('redirect_uri', redirectUri);

    console.log('Параметры запроса токена:', {
      client_id: CLIENT_ID,
      redirect_uri: redirectUri,
      code_length: code.length,
      code_verifier_length: codeVerifier.length
    });

    const response = await fetch(`${AUTH_URL}/identity/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Origin': 'app://com.lo.app',
        'User-Agent': 'LOApp/1.0.0'
      },
      body: formData
    });
    
    console.log('Статус ответа при обмене кода:', response.status);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('Успешно получен ответ обмена токенов:', JSON.stringify(data).substring(0, 100) + '...');
      
      if (data.data && data.data.access_token) {
        console.log('Успешно получен токен длиной (во вложенной структуре):', data.data.access_token.length);
        return {
          access_token: data.data.access_token,
          refresh_token: data.data.refresh_token || '',
          expires_in: data.data.expires_in || 3600,
          token_type: data.data.token_type || 'Bearer',
          scope: data.data.scope || ''
        };
      } else if (data.access_token) {
        console.log('Успешно получен токен длиной:', data.access_token.length);
        return data;
      } else {
        console.error('Неожиданный формат ответа при обмене кода:', data);
        throw new Error('Неверный формат данных от API при обмене кода');
      }
    } else {
      let errorText = '';
      try {
        const errorData = await response.json();
        errorText = JSON.stringify(errorData);
        console.error('Данные ошибки:', errorData);
      } catch {
        errorText = await response.text();
        console.error('Текст ошибки:', errorText);
      }
      throw new Error(`Ошибка при обмене кода: ${response.status}, ${errorText}`);
    }
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw new Error('Не удалось обменять код на токен: ' + (error instanceof Error ? error.message : String(error)));
  }
};

export const checkApiAvailability = async (): Promise<boolean> => {
  try {
    console.log('Проверка доступности API...');
    const response = await axios.get(`${API_URL}/healthcheck`, {
      timeout: 5000
    });
    console.log('API сервер доступен, статус:', response.status);
    return response.status === 200;
  } catch (error) {
    console.error('API сервер недоступен:', error);
    return false;
  }
};

export const authenticateUser = async (): Promise<{ success: boolean, token?: string, error?: string }> => {
  try {
    const isApiAvailable = await checkApiAvailability();
    
    if (!isApiAvailable) {
      return { 
        success: false, 
        error: 'API сервер недоступен. Используйте демо-режим.' 
      };
    }
    
    const token = await getTokenDirectly();
    
    if (token) {
      console.log('Получен токен, проверяем его валидность...');
      
      return { 
        success: true, 
        token 
      };
    }
    
    return { 
      success: false, 
      error: 'Не удалось получить токен авторизации. Проверьте учетные данные.' 
    };
  } catch (error) {
    console.error('Ошибка при аутентификации:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Неизвестная ошибка при аутентификации' 
    };
  }
};

export const testEndpointAccess = async (token: string): Promise<boolean> => {
  try {
    console.log('Тестирование доступа с токеном длиной:', token.length);
    console.log('Первые 20 символов токена:', token.substring(0, 20) + '...');
    
    console.log('Тестовый запрос к API с простыми заголовками...');
    
    try {
      const response = await fetch(`${API_URL}/posts/feed?page=1&limit=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Ответ на тестовый запрос 1:', response.status);
      
      if (response.status === 200) {
        console.log('Удалось получить доступ к API с минимальными заголовками');
        return true;
      }
      
      const responseText = await response.text();
      console.log('Текст ответа 1:', responseText);
    } catch (error) {
      console.log('Ошибка в тестовом запросе 1:', error);
    }
    
    console.log('Тестовый запрос к API с расширенными заголовками...');
    
    try {
      const response2 = await fetch(`${API_URL}/posts/feed?page=1&limit=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
          'Origin': 'app://com.lo.app'
        }
      });
      
      console.log('Ответ на тестовый запрос 2:', response2.status);
      
      if (response2.status === 200) {
        console.log('Удалось получить доступ к API с расширенными заголовками');
        return true;
      }
      
      const responseText2 = await response2.text();
      console.log('Текст ответа 2:', responseText2);
    } catch (error) {
      console.log('Ошибка в тестовом запросе 2:', error);
    }
    
    return false;
  } catch (error) {
    console.error('Ошибка при тестировании API:', error);
    return false;
  }
};

export const runApiDiagnostics = async (): Promise<{
  success: boolean;
  results: {
    apiAvailable: boolean;
    authEndpointAvailable: boolean;
    tokenObtained: boolean;
    postsEndpointAvailable: boolean;
    token?: string;
    message: string;
  };
}> => {
  const results = {
    apiAvailable: false,
    authEndpointAvailable: false,
    tokenObtained: false,
    postsEndpointAvailable: false,
    token: undefined as string | undefined,
    message: ''
  };
  
  try {
    console.log('Запуск диагностики API...');
    
    results.apiAvailable = await checkApiAvailability();
    console.log('API доступен:', results.apiAvailable);
    
    if (!results.apiAvailable) {
      results.message = 'API сервер недоступен. Проверьте подключение к интернету.';
      return { success: false, results };
    }
    
    try {
      console.log('Проверка эндпоинта авторизации...');
      const authCheckResponse = await fetch(`${AUTH_URL}/identity`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'LOApp/1.0.0 Diagnostics'
        }
      });
      
      console.log('Статус ответа эндпоинта авторизации:', authCheckResponse.status);
      results.authEndpointAvailable = authCheckResponse.status < 500;
    } catch (error) {
      console.error('Эндпоинт авторизации недоступен:', error);
      results.authEndpointAvailable = false;
    }
    
    if (!results.authEndpointAvailable) {
      results.message = 'Сервер авторизации недоступен. Возможны технические работы.';
      return { success: false, results };
    }
    
    const token = await getTokenDirectly();
    results.tokenObtained = !!token;
    
    if (token) {
      results.token = token;
      console.log('Токен получен, длина:', token.length);
      
      try {
        console.log('Проверка доступа к постам с полученным токеном...');
        const postsCheckResponse = await fetch(`${API_URL}/posts/feed?page=1&limit=1`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Origin': 'app://com.lo.app',
            'User-Agent': 'LOApp/1.0.0 Diagnostics',
            'Accept-Language': 'en'
          }
        });
        
        console.log('Статус ответа эндпоинта постов:', postsCheckResponse.status);
        
        results.postsEndpointAvailable = postsCheckResponse.status === 200;
        
        if (postsCheckResponse.status === 200) {
          results.message = 'Все системы работают корректно. API доступно и авторизация работает.';
          return { success: true, results };
        } else if (postsCheckResponse.status === 401) {
          results.message = 'Токен получен, но не принимается API. Возможно, неверный формат токена или проблема с правами.';
          return { success: false, results };
        } else {
          results.message = `Ошибка доступа к постам: ${postsCheckResponse.status}. Токен получен, но API возвращает ошибку.`;
          return { success: false, results };
        }
      } catch (error) {
        console.error('Ошибка при проверке эндпоинта постов:', error);
        results.postsEndpointAvailable = false;
        results.message = 'Не удалось проверить доступ к постам. Возможна проблема с сетью или API.';
        return { success: false, results };
      }
    } else {
      results.message = 'Не удалось получить токен авторизации. Проверьте учетные данные и параметры запроса.';
      return { success: false, results };
    }
  } catch (error) {
    console.error('Ошибка диагностики:', error);
    results.message = 'Произошла ошибка при диагностике: ' + (error instanceof Error ? error.message : String(error));
    return { success: false, results };
  }
};