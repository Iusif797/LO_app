import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TokenInputScreen } from '../components/Auth';
import { PostListScreen } from '../components/Posts';
import { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="TokenInput"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0077cc',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen 
          name="TokenInput" 
          component={TokenInputScreen} 
          options={{ 
            title: 'Вход в LO App',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="PostList" 
          component={PostListScreen} 
          options={{ 
            title: 'Лента постов',
            headerLeft: () => null, // Отключаем кнопку назад
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 