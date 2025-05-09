import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, RefreshControl, Alert, BackHandler } from 'react-native';
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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        return true;
      }
    );

    return () => backHandler.remove();
  }, []);

  const loadPosts = async (pageNum: number, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (!refresh && pageNum === 1) {
        setLoading(true);
      }

      const response = await fetchPosts(token, pageNum);
      
      if (refresh || pageNum === 1) {
        setPosts(response.data);
      } else {
        setPosts(prevPosts => [...prevPosts, ...response.data]);
      }
      
      setHasMore(response.hasMore);
      setError(null);
    } catch (err) {
      setError('Не удалось загрузить посты');
      if (err instanceof Error && err.message.includes('401')) {
        Alert.alert(
          'Ошибка аутентификации',
          'Ваш токен истек или недействителен. Пожалуйста, войдите снова.',
          [
            {
              text: 'OK',
              onPress: handleLogout,
            },
          ]
        );
      }
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    loadPosts(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && !refreshing && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPosts(nextPage);
    }
  };

  const handleLogout = async () => {
    try {
      await clearAuthData();
      navigation.replace('TokenInput');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    loadPosts(1);
  }, [token]);

  if (loading && !refreshing && posts.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && posts.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlashList
          data={posts}
          renderItem={({ item }) => <PostItem post={item} />}
          estimatedItemSize={180}
          keyExtractor={item => item.id}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              colors={['#0000ff']}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text>Постов пока нет</Text>
            </View>
          }
          ListFooterComponent={
            hasMore && posts.length > 0 ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#0000ff" />
                <Text style={styles.footerText}>Загрузка постов...</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  footerLoader: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    marginLeft: 10,
    fontSize: 14,
  },
});

export default PostListScreen;