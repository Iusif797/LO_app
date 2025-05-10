import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, RefreshControl, Alert, BackHandler, TouchableOpacity, StatusBar, Image } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Post } from '../../types';
import { PostItem } from './index';
import { fetchPosts } from '../../services/api';
import { clearAuthData } from '../../utils/authUtils';

type PostListScreenProps = NativeStackScreenProps<RootStackParamList, 'PostList'>;

const PostListScreen: React.FC<PostListScreenProps> = ({ route, navigation }) => {
  const { token } = route.params;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      title: 'Лента LO',
      headerTitleStyle: {
        fontWeight: '700',
        fontSize: 18,
        color: '#212121',
      },
      headerStyle: {
        backgroundColor: 'white',
      },
      headerTintColor: '#9c27b0',
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={{ padding: 8 }}>
          <Text style={{ fontSize: 15, color: '#9c27b0', fontWeight: '600' }}>Выйти</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true
    );

    return () => backHandler.remove();
  }, []);

  const loadPosts = useCallback(async (pageNum: number, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await fetchPosts(token, pageNum);
      
      if (refresh || pageNum === 1) {
        setPosts(response.data);
      } else {
        const existingIds = new Set(posts.map(post => post.id));
        const newPosts = response.data.filter(post => !existingIds.has(post.id));
        
        setPosts(prevPosts => [...prevPosts, ...newPosts]);
      }
      
      setHasMore(response.hasMore);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Не удалось загрузить посты';
      setError(errorMessage);
      
      if (errorMessage.includes('401')) {
        Alert.alert(
          'Ошибка аутентификации',
          'Ваш токен истек или недействителен. Пожалуйста, войдите снова.',
          [{ text: 'OK', onPress: handleLogout }]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [token, posts]);

  const handleRefresh = useCallback(() => {
    setPage(1);
    loadPosts(1, true);
  }, [loadPosts]);

  const handleLoadMore = useCallback(() => {
    if (!loading && !refreshing && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPosts(nextPage);
    }
  }, [loading, refreshing, loadingMore, hasMore, page, loadPosts]);

  const handleLogout = async () => {
    try {
      await clearAuthData();
      navigation.replace('TokenInput');
    } catch (error) {
      console.error('Logout error:', error);
      navigation.replace('TokenInput');
    }
  };

  useEffect(() => {
    loadPosts(1);
  }, []);

  const ErrorDisplay = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Не удалось загрузить ленту</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity 
        style={styles.retryButton} 
        onPress={() => loadPosts(1)}
      >
        <Text style={styles.retryButtonText}>Повторить</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing && posts.length === 0) {
    return (
      <View style={styles.centered}>
        <StatusBar backgroundColor="#fff" barStyle="dark-content" />
        <Image 
          source={{ uri: 'https://i.imgur.com/eE4vLbq.png' }} 
          style={{ width: 60, height: 60, marginBottom: 16 }}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#9c27b0" />
        <Text style={styles.loadingText}>Загрузка ленты...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      {error && posts.length === 0 ? (
        <ErrorDisplay />
      ) : (
        <FlashList
          data={posts}
          renderItem={({ item }) => <PostItem post={item} />}
          estimatedItemSize={280}
          keyExtractor={item => item.id}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              colors={['#9c27b0']}
              tintColor="#9c27b0"
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Image 
                source={{ uri: 'https://i.imgur.com/JvYlWEH.png' }} 
                style={{ width: 80, height: 80, marginBottom: 16, opacity: 0.6 }}
                resizeMode="contain"
              />
              <Text style={styles.emptyText}>В ленте пока нет постов</Text>
              <Text style={styles.emptySubtext}>Попробуйте обновить через минуту</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore && posts.length > 0 ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#9c27b0" />
                <Text style={styles.footerText}>Загрузка постов...</Text>
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <TouchableOpacity 
        style={styles.fabButton}
        onPress={() => Alert.alert('Создать пост', 'Эта функция будет доступна в следующей версии приложения.')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContent: {
    padding: 12,
    paddingBottom: 80,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#d32f2f',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorText: {
    color: '#757575',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#9c27b0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 2,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footerLoader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#757575',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#757575',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9c27b0',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#757575',
    textAlign: 'center',
  },
  separator: {
    height: 12,
  },
  fabButton: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    backgroundColor: '#9c27b0',
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 10,
  },
  fabText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  }
});

export default PostListScreen;