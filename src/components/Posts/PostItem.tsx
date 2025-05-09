import React, { memo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Post } from '../../types';

type PostItemProps = {
  post: Post;
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

const PostItem = memo(function PostItem({ post }: PostItemProps) {
  const hasPhoto = post.photos && post.photos.length > 0;
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {post.author.avatar ? (
          <Image 
            source={{ uri: post.author.avatar }} 
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder} />
        )}
        <View style={styles.headerText}>
          <Text style={styles.author}>{post.author.name}</Text>
          <Text style={styles.date}>{formatDate(post.created_at)}</Text>
        </View>
      </View>
      
      <Text style={styles.text}>{post.text}</Text>
      
      {hasPhoto && post.photos && (
        <Image 
          source={{ uri: post.photos[0].url }} 
          style={[
            styles.image,
            {
              aspectRatio: post.photos[0].width / post.photos[0].height
            }
          ]}
          resizeMode="cover"
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
    marginRight: 10,
  },
  headerText: {
    flex: 1,
  },
  author: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  date: {
    fontSize: 12,
    color: '#888',
  },
  text: {
    fontSize: 14,
    marginBottom: 10,
    lineHeight: 20,
  },
  image: {
    width: '100%',
    height: undefined,
    minHeight: 200,
    borderRadius: 8,
  },
});

export default PostItem;