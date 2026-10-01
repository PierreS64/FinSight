import { Platform } from 'react-native';

const defaultUrl = Platform.OS === 'android'
  ? 'http://10.0.2.2:8080'
  : 'http://localhost:8080';

export const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || defaultUrl;
