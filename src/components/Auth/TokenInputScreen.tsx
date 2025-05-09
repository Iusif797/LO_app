import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Text, Alert, Linking, ActivityIndicator, TouchableOpacity, ImageBackground, StatusBar } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { initiateAuthFlow, setupUrlListener, extractAuthCode, completeAuthFlow, getStoredTokens } from '../../utils/authUtils';

type TokenInputScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TokenInput'>;
};

const REDIRECT_URI = 'default';

const TokenInputScreen: React.FC<TokenInputScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [manualToken, setManualToken] = useState('');

  useEffect(() => {
    const checkExistingToken = async () => {
      try {
        setLoading(true);
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
    console.log('Got redirect URL:', url);
    
    if (!url.startsWith(REDIRECT_URI)) {
      console.log('URL does not match REDIRECT_URI');
      return;
    }

    setLoading(true);
    try {
      const code = await extractAuthCode(url);
      
      console.log('Extracted auth code:', code ? 'Success' : 'Failed');
      
      if (!code) {
        throw new Error('Не удалось извлечь код авторизации');
      }
      
      const tokens = await completeAuthFlow(code, REDIRECT_URI);
      console.log('Got tokens with access token length:', tokens.accessToken.length);
      
      navigation.replace('PostList', { token: tokens.accessToken });
    } catch (error) {
      console.error('Auth redirect error:', error);
      Alert.alert(
        'Ошибка аутентификации', 
        'Не удалось завершить процесс аутентификации. Проверьте корректность CLIENT_ID и CLIENT_SECRET.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async () => {
    setLoading(true);
    try {
      const authUrl = await initiateAuthFlow(REDIRECT_URI);
      
      console.log('Generated auth URL:', authUrl);
      
      const canOpen = await Linking.canOpenURL(authUrl);
      
      if (!canOpen) {
        throw new Error('Не удалось открыть URL для аутентификации');
      }
      
      await Linking.openURL(authUrl);
    } catch (error) {
      console.error('OAuth login error:', error);
      Alert.alert(
        'Ошибка аутентификации', 
        'Не удалось начать процесс аутентификации. Возможно, неверные данные клиента или неправильный URL перенаправления.'
      );
      setLoading(false);
    }
  };

  const handleManualTokenSubmit = () => {
    if (!manualToken.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, введите токен');
      return;
    }

    navigation.navigate('PostList', { token: manualToken });
  };

  const isTokenExpired = (expiresAt: number): boolean => {
    return Date.now() >= expiresAt;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Выполняется аутентификация...</Text>
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
            <Text style={styles.subtitle}>Войдите, чтобы продолжить</Text>
            
            <TouchableOpacity 
              style={styles.oauthButton} 
              onPress={handleOAuthLogin} 
              activeOpacity={0.8}
            >
              <Text style={styles.oauthButtonText}>Войти через LO</Text>
            </TouchableOpacity>
            
            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.orText}>ИЛИ</Text>
              <View style={styles.line} />
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="Введите ваш токен доступа"
              placeholderTextColor="#888"
              value={manualToken}
              onChangeText={setManualToken}
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <TouchableOpacity 
              style={styles.tokenButton} 
              onPress={handleManualTokenSubmit}
              activeOpacity={0.8}
            >
              <Text style={styles.tokenButtonText}>Использовать токен</Text>
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
    backgroundColor: '#0d47a1',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
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
  input: {
    height: 55,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#FFFFFF',
    fontSize: 16,
  },
  oauthButton: {
    width: '100%',
    height: 55,
    backgroundColor: '#1976d2',
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
  oauthButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tokenButton: {
    width: '100%',
    height: 55,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#1976d2',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  orText: {
    marginHorizontal: 10,
    color: '#BBBBBB',
    fontWeight: '600',
  },
});

export default TokenInputScreen;