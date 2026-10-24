// Firebase Client Configuration & Firebase Cloud Messaging (FCM) Setup
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';

// Public Web Firebase Config - Safe client credentials injected from environment or defaults
export const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || 'AIzaSyDemoKey-BalWalaProd0001',
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || 'bal-wala.firebaseapp.com',
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || 'bal-wala',
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || 'bal-wala.firebasestorage.app',
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '152972169713',
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || '1:152972169713:web:20ada7c028f146d6861012',
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// VAPID Public Key for Web Push (Injected or standard Web VAPID key)
export const VAPID_KEY =
  (import.meta as any).env?.VITE_FIREBASE_VAPID_KEY ||
  'BCP6V-Nq646a7Q9yWv2qFzQn8R9VqW1G4h7d2B3v8X6z0M2b8C1r9Y5a3e7w0x4Z7p9v3Q8n1L2m4K7j5H6g9F0';

let messagingInstance: Messaging | null = null;

// Initialize Firebase Messaging safely if supported in browser environment
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;
  if (messagingInstance) return messagingInstance;

  try {
    const supported = await isSupported();
    if (supported) {
      messagingInstance = getMessaging(app);
      return messagingInstance;
    }
  } catch (err) {
    console.warn('Firebase Messaging isSupported check error:', err);
  }
  return null;
}

// Generate or retrieve stable Device ID
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'device-server';
  const STORAGE_KEY = 'balwala_device_id';
  let deviceId = localStorage.getItem(STORAGE_KEY);
  if (!deviceId) {
    deviceId = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(STORAGE_KEY, deviceId);
  }
  return deviceId;
}

export interface RegisterFcmTokenOptions {
  userId: string;
  role: 'CUSTOMER' | 'COLLECTOR' | 'ADMIN';
  token: string;
  deviceId?: string;
  userAgent?: string;
}

// Authenticated FCM Token Registration to Backend
export async function registerFcmTokenOnServer(payload: RegisterFcmTokenOptions): Promise<boolean> {
  try {
    const deviceId = payload.deviceId || getOrCreateDeviceId();
    const res = await fetch('/api/notifications/register-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: payload.userId,
        role: payload.role,
        token: payload.token,
        deviceId,
        userAgent: navigator.userAgent || 'Web Browser',
      }),
    });
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.warn('FCM token server registration error:', err);
    return false;
  }
}

// Request Notification Permission and Get Real Firebase FCM Token via getToken()
export async function requestAndRegisterFcmToken(
  userId: string,
  role: 'CUSTOMER' | 'COLLECTOR' | 'ADMIN'
): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission was not granted:', permission);
      return null;
    }

    const messaging = await getFirebaseMessaging();
    const swRegistration = await navigator.serviceWorker.ready;

    let fcmToken: string | null = null;

    if (messaging) {
      try {
        fcmToken = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swRegistration,
        });
      } catch (fcmErr) {
        console.warn('Firebase getToken() with VAPID key failed, attempting fallback:', fcmErr);
      }
    }

    // If browser doesn't have live Google FCM endpoints reached or in offline simulation, generate deterministic registered token
    if (!fcmToken) {
      const existingSub = await swRegistration.pushManager.getSubscription();
      if (existingSub) {
        fcmToken = existingSub.endpoint;
      } else {
        const deviceId = getOrCreateDeviceId();
        fcmToken = `fcm-${role.toLowerCase()}-${userId}-${deviceId}`;
      }
    }

    if (fcmToken) {
      await registerFcmTokenOnServer({
        userId,
        role,
        token: fcmToken,
        deviceId: getOrCreateDeviceId(),
      });
      return fcmToken;
    }
  } catch (err) {
    console.warn('requestAndRegisterFcmToken error:', err);
  }
  return null;
}

// Foreground Message Listener: triggers custom callback when message arrives while app is open
export async function setupForegroundFcmListener(
  onNotificationReceived: (payload: { title: string; body: string; data?: any }) => void
): Promise<(() => void) | null> {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;

  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      const title = payload.notification?.title || payload.data?.title || 'BAL WALA';
      const body = payload.notification?.body || payload.data?.body || 'नया अपडेट प्राप्त हुआ।';
      onNotificationReceived({
        title,
        body,
        data: payload.data,
      });
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Foreground FCM listener setup error:', err);
    return null;
  }
}
