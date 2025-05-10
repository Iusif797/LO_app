import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { Post } from '../../types';

type PostItemProps = {
  post: Post;
};

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      return 'Недавно';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);
    
    if (diffMinutes < 60) {
      return diffMinutes <= 1 ? 'Только что' : `${diffMinutes} мин. назад`;
    } else if (diffHours < 24) {
      return `${diffHours} ч. назад`;
    } else if (diffDays < 7) {
      return `${diffDays} дн. назад`;
    }
    
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Дата неизвестна';
  }
}

const PostItem = memo(function PostItem({ post }: PostItemProps) {
  const hasPhoto = post.photos && post.photos.length > 0;
  const screenWidth = Dimensions.get('window').width;
  const imageWidth = screenWidth - 40;
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(Math.floor(Math.random() * 50));
  const [commentsCount, setCommentsCount] = useState(Math.floor(Math.random() * 10));
  const [modalVisible, setModalVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<{id: string, text: string, author: string, date: string}[]>([]);
  
  const displayText = post.text ? post.text.trim() : 'Нет текста';

  const handleLike = () => {
    if (liked) {
      setLikesCount(likesCount - 1);
    } else {
      setLikesCount(likesCount + 1);
    }
    setLiked(!liked);
  };

  const handleComment = () => {
    setModalVisible(true);
  };

  const handleShare = () => {
    Alert.alert('Поделиться', 'Публикация успешно отправлена в сохраненные.');
  };
  
  const submitComment = () => {
    if (commentText.trim() === '') {
      Alert.alert('Ошибка', 'Пожалуйста, введите текст комментария');
      return;
    }
    
    const newComment = {
      id: Date.now().toString(),
      text: commentText,
      author: 'Вы',
      date: new Date().toISOString()
    };
    
    setComments([...comments, newComment]);
    setCommentsCount(commentsCount + 1);
    setCommentText('');
    setModalVisible(false);
    
    Alert.alert('Успех', 'Комментарий добавлен');
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {post.author.avatar ? (
          <Image 
            source={{ uri: post.author.avatar }} 
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: '#9c27b0' }]}>
            <Text style={styles.avatarInitial}>
              {post.author.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.headerText}>
          <Text style={styles.author}>{post.author.name}</Text>
          <Text style={styles.date}>{formatDate(post.created_at)}</Text>
        </View>
        
        <TouchableOpacity style={styles.menuButton} onPress={() => Alert.alert('Меню', 'Дополнительные опции будут доступны в следующей версии приложения.')}>
          <View style={styles.menuDot} />
          <View style={styles.menuDot} />
          <View style={styles.menuDot} />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.text}>{displayText}</Text>
      
      {hasPhoto && post.photos && post.photos.length > 0 && post.photos[0]?.url && (
        <View style={styles.imageContainer}>
          {imageLoading && !imageError && (
            <View style={[styles.imageLoader, { width: imageWidth, height: imageWidth * 0.75 }]}>
              <ActivityIndicator size="large" color="#9c27b0" />
            </View>
          )}
          
          {imageError && (
            <View style={[styles.imageError, { width: imageWidth, height: imageWidth * 0.75 }]}>
              <Text style={styles.imageErrorText}>Не удалось загрузить изображение</Text>
            </View>
          )}
          
          <Image 
            source={{ uri: post.photos[0].url }} 
            style={[
              styles.image,
              {
                width: imageWidth,
                height: post.photos[0].height && post.photos[0].width
                  ? (imageWidth * post.photos[0].height) / post.photos[0].width
                  : imageWidth * 0.75,
                display: imageLoading || imageError ? 'none' : 'flex'
              }
            ]}
            onLoadStart={() => setImageLoading(true)}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              console.error('Error loading image:', post.photos && post.photos[0] ? post.photos[0].url : 'undefined URL');
              setImageLoading(false);
              setImageError(true);
            }}
            resizeMode="cover"
          />
          {post.photos.length > 1 && !imageError && (
            <View style={styles.morePhotosIndicator}>
              <Text style={styles.morePhotosText}>+{post.photos.length - 1}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.statsBar}>
        {likesCount > 0 && (
          <Text style={styles.statsText}>{likesCount} отметок "Нравится"</Text>
        )}
        {commentsCount > 0 && (
          <Text style={styles.statsText}>{commentsCount} комментариев</Text>
        )}
      </View>
      
      {comments.length > 0 && (
        <View style={styles.commentsContainer}>
          {comments.slice(0, 2).map(comment => (
            <View key={comment.id} style={styles.commentItem}>
              <Text style={styles.commentAuthor}>{comment.author}</Text>
              <Text style={styles.commentText}>{comment.text}</Text>
              <Text style={styles.commentDate}>{formatDate(comment.date)}</Text>
            </View>
          ))}
          {comments.length > 2 && (
            <TouchableOpacity onPress={() => Alert.alert('Комментарии', 'Просмотр всех комментариев будет доступен в следующей версии')}>
              <Text style={styles.viewAllComments}>Просмотреть все комментарии ({comments.length})</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      <View style={styles.divider} />
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <View style={styles.actionIcon}>
            <Text style={[styles.actionIconText, liked && styles.actionIconActive]}>
              {liked ? '♥' : '♡'}
            </Text>
          </View>
          <Text style={[styles.actionText, liked && styles.actionTextActive]}>
            Нравится
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
          <View style={styles.actionIcon}>
            <Text style={styles.actionIconText}>✉</Text>
          </View>
          <Text style={styles.actionText}>Комментировать</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <View style={styles.actionIcon}>
            <Text style={styles.actionIconText}>↗</Text>
          </View>
          <Text style={styles.actionText}>Поделиться</Text>
        </TouchableOpacity>
      </View>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Новый комментарий</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Написать комментарий..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={submitComment}
              >
                <Text style={styles.submitButtonText}>Опубликовать</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#9c27b0',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  avatarInitial: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerText: {
    flex: 1,
  },
  author: {
    fontWeight: '700',
    fontSize: 16,
    color: '#212121',
  },
  date: {
    fontSize: 13,
    color: '#757575',
    marginTop: 2,
  },
  menuButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  menuDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#757575',
    marginVertical: 1.5,
  },
  text: {
    fontSize: 15,
    marginBottom: 16,
    lineHeight: 22,
    color: '#212121',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  image: {
    borderRadius: 12,
  },
  morePhotosIndicator: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  morePhotosText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  statsBar: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  statsText: {
    fontSize: 13,
    color: '#616161',
    marginRight: 10,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionIcon: {
    marginRight: 6,
  },
  actionIconText: {
    fontSize: 18,
    color: '#616161',
  },
  actionIconActive: {
    color: '#e91e63',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#616161',
  },
  actionTextActive: {
    color: '#e91e63',
    fontWeight: '600',
  },
  imageLoader: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  imageError: {
    backgroundColor: '#ffeeee',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  imageErrorText: {
    color: '#d32f2f',
    fontSize: 14,
    textAlign: 'center',
    padding: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#212121',
    textAlign: 'center',
  },
  commentInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9c27b0',
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#9c27b0',
    fontWeight: '600',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#9c27b0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  commentsContainer: {
    marginTop: 4,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
  },
  commentItem: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentAuthor: {
    fontWeight: '700',
    fontSize: 14,
    color: '#212121',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 4,
  },
  commentDate: {
    fontSize: 12,
    color: '#9e9e9e',
  },
  viewAllComments: {
    color: '#9c27b0',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 5,
  }
});

export default PostItem;