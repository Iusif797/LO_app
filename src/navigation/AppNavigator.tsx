import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TokenInputScreen } from '../components/Auth';
import { PostListScreen } from '../components/Posts';
import { RootStackParamList } from '../types';
import { StatusBar } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();

const COLORS = {
  primary: '#9c27b0',
  primaryDark: '#7b1fa2',
  background: '#f6f6f6',
  white: '#ffffff',
  text: '#212121',
  textSecondary: '#757575',
};

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <StatusBar 
        backgroundColor={COLORS.primaryDark} 
        barStyle="light-content" 
      />
      <Stack.Navigator
        initialRouteName="TokenInput"
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.white,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          animation: 'slide_from_right',
          contentStyle: {
            backgroundColor: COLORS.background,
          }
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
            headerLeft: () => null,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;