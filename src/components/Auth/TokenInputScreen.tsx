import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Text, Alert, Linking, ActivityIndicator, TouchableOpacity, ImageBackground, StatusBar } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { setupUrlListener, getStoredTokens, clearAuthData, saveToken, getValidToken } from '../../utils/authUtils';
import { generatePKCE, getAuthorizationUrl, exchangeCodeForToken, getTokenDirectly, authenticateUser, runApiDiagnostics, testEndpointAccess } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TokenInputScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TokenInput'>;
};

const REDIRECT_URI = 'exp://192.168.1.108:8081';

const TokenInputScreen: React.FC<TokenInputScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [manualToken, setManualToken] = useState('');

  useEffect(() => {
    const checkExistingToken = async () => {
      try {
        setLoading(true);
        
        const token = await getValidToken();
        
        if (token) {
          console.log('Найден действительный токен, переходим к ленте');
          navigation.replace('PostList', { token });
          return;
        }
        
        const tokens = await getStoredTokens();
        
        if (tokens && !isTokenExpired(tokens.expiresAt)) {
          navigation.replace('PostList', { token: tokens.accessToken });
        }
      } catch (error) {
        console.error('Error checking tokens:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkExistingToken();
  }, [navigation]);

  useEffect(() => {
    const cleanup = setupUrlListener(handleRedirectUrl);
    return cleanup;
  }, []);

  const handleRedirectUrl = async (url: string) => {
    console.log('Получен URL перенаправления:', url);
    
    if (!url.includes('exp://')) {
      console.log('URL не является URL приложения Expo');
      return;
    }

    setLoading(true);
    try {
      if (!url.includes('code=')) {
        console.log('Код авторизации отсутствует в URL');
        throw new Error('Не удалось получить код авторизации');
      }
      
      const authCode = extractAuthCode(url);
      console.log('Извлечен код авторизации:', authCode ? 'Успешно' : 'Ошибка');
      
      if (!authCode) {
        throw new Error('Не удалось извлечь код авторизации');
      }
      
      const codeVerifier = await AsyncStorage.getItem('code_verifier');
      if (!codeVerifier) {
        throw new Error('Отсутствует code_verifier');
      }
      
      console.log('Обмениваем код на токен, параметры:', {
        code: authCode,
        codeVerifier: codeVerifier.substring(0, 5) + '...',
        redirectUri: REDIRECT_URI
      });
      
      const tokens = await exchangeCodeForToken(authCode, codeVerifier, REDIRECT_URI);
      console.log('Получен токен доступа длиной:', tokens.access_token.length);
      
      await saveToken(tokens.access_token, tokens.refresh_token, tokens.expires_in);
      
      navigation.replace('PostList', { token: tokens.access_token });
    } catch (error) {
      console.error('Auth redirect error:', error);
      
      Alert.alert(
        'Ошибка авторизации',
        'Не удалось завершить процесс авторизации. Попробуйте использовать демо-режим.',
        [
          { text: 'Использовать демо-режим', onPress: () => useMockToken() },
          { text: 'Отмена', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const enterLOFeed = async () => {
    setLoading(true);
    
    try {
      console.log('Пытаемся получить реальный токен для доступа к данным...');
      
      const result = await authenticateUser();
      
      if (result.success && result.token) {
        console.log('Получен реальный токен для доступа к API');
        
        console.log('Тестирование полученного токена...');
        const isTokenValid = await testEndpointAccess(result.token);
        
        if (isTokenValid) {
          console.log('Токен успешно прошел тестирование!');
          
          await saveToken(result.token);
          
          navigation.replace('PostList', { token: result.token });
          return;
        } else {
          console.error('Токен получен, но не прошел тестирование API');
          Alert.alert(
            'Проблема с доступом к данным',
            'Токен получен, но доступ к данным не работает. Хотите использовать демо-режим?',
            [
              { text: 'Да, использовать демо', onPress: () => useMockToken() },
              { text: 'Отмена', style: 'cancel' }
            ]
          );
          return;
        }
      }
      
      Alert.alert(
        'Не удалось получить доступ к данным',
        result.error || 'К сожалению, не удалось получить доступ к реальным данным. Хотите открыть ленту с тестовыми данными?',
        [
          { 
            text: 'Да, показать тестовые данные', 
            onPress: () => {
              useMockToken();
            }
          },
          {
            text: 'Отмена',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('Ошибка при получении токена:', error);
      Alert.alert(
        'Ошибка подключения',
        'Не удалось подключиться к серверу. Проверьте подключение к интернету.',
        [
          { 
            text: 'Использовать тестовые данные', 
            onPress: () => useMockToken() 
          },
          { text: 'Отмена', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const extractAuthCode = (url: string): string | null => {
    try {
      console.log('Извлечение кода из URL:', url);
      
      let code = null;
      
      if (url.includes('?')) {
        const queryParams = url.split('?')[1];
        const urlParams = new URLSearchParams(queryParams);
        code = urlParams.get('code');
      }
      
      if (!code && url.includes('#')) {
        const fragmentParams = url.split('#')[1];
        const urlParams = new URLSearchParams(fragmentParams);
        code = urlParams.get('code');
      }
      
      if (!code) {
        const codeMatch = url.match(/code=([^&]+)/);
        if (codeMatch && codeMatch[1]) {
          code = codeMatch[1];
        }
      }
      
      console.log('Извлеченный код:', code ? code.substring(0, 5) + '...' : 'не найден');
      
      return code;
    } catch (error) {
      console.error('Ошибка при извлечении кода:', error);
      return null;
    }
  };

  const isTokenExpired = (expiresAt: number): boolean => {
    return Date.now() >= expiresAt;
  };

  const useMockToken = () => {
    const mockToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ik1vY2sgVXNlciIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MzI1NDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    
    saveToken(mockToken);
    
    navigation.replace('PostList', { token: mockToken });
  };

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      console.log('Запускаем диагностику API');
      const result = await runApiDiagnostics();
      console.log('Результат диагностики:', result);
      
      if (result.success) {
        console.log('Диагностика прошла успешно');
        Alert.alert('Диагностика API', result.results.message);
      } else {
        console.error('Ошибка при выполнении диагностики:', result.results.message);
        Alert.alert('Ошибка диагностики', result.results.message || 'Неизвестная ошибка');
      }
    } catch (error) {
      console.error('Ошибка при выполнении диагностики:', error);
      Alert.alert('Ошибка диагностики', 'Не удалось выполнить диагностику. Проверьте подключение к интернету.');
    } finally {
      setLoading(false);
    }
  };

  const startPKCEAuth = async () => {
    try {
      setLoading(true);
      console.log('Начинаем PKCE авторизацию...');
      
      const { codeVerifier, codeChallenge } = await generatePKCE();
      console.log('Сгенерированы PKCE параметры');
      
      await AsyncStorage.setItem('code_verifier', codeVerifier);
      
      const state = Math.random().toString(36).substring(2, 15);
      await AsyncStorage.setItem('oauth_state', state);
      
      const authUrl = getAuthorizationUrl(codeChallenge, REDIRECT_URI, state);
      console.log('URL авторизации:', authUrl);
      
      const canOpen = await Linking.canOpenURL(authUrl);
      if (!canOpen) {
        throw new Error('Не удалось открыть URL авторизации');
      }
      
      await Linking.openURL(authUrl);
    } catch (error) {
      console.error('Ошибка при инициировании PKCE авторизации:', error);
      Alert.alert(
        'Ошибка авторизации',
        'Не удалось начать процесс авторизации. Попробуйте использовать демо-режим.',
        [
          { text: 'Использовать демо-режим', onPress: () => useMockToken() },
          { text: 'Отмена', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Подключение к LO...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=1000' }} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <View style={styles.contentContainer}>
            <Text style={styles.logo}>LO App</Text>
            <Text style={styles.title}>Добро пожаловать</Text>
            <Text style={styles.subtitle}>Авторизуйтесь для входа в ленту</Text>
            
            <TouchableOpacity 
              style={styles.mainButton} 
              onPress={enterLOFeed} 
              activeOpacity={0.8}
            >
              <Text style={styles.mainButtonText}>Открыть ленту</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    width: '85%',
    maxWidth: 400,
    padding: 25,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#9c27b0',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  logo: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    letterSpacing: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 30,
    textAlign: 'center',
  },
  mainButton: {
    width: '100%',
    height: 60,
    backgroundColor: '#9c27b0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  infoText: {
    color: '#BBBBBB',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 10,
  }
});

export default TokenInputScreen;