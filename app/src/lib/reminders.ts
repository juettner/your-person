/**
 * The weekly nudge: one local notification, off by default.
 *
 * Local notifications are scheduled on the device itself; no server, no push
 * token. On iOS and Android this needs a development build (Expo Go dropped
 * notification support), so every call here fails softly: a missing
 * capability turns into `false`, never a crash.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const KEY = 'your-person.reminder';
const IDENTIFIER = 'weekly-nudge';

export interface ReminderSetting {
  enabled: boolean;
  /** 1 = Sunday ... 7 = Saturday, as expo-notifications counts them. */
  weekday: number;
  hour: number;
}

export const DEFAULT_REMINDER: ReminderSetting = { enabled: false, weekday: 6, hour: 18 }; // Friday, 6pm

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function loadReminder(): Promise<ReminderSetting> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...DEFAULT_REMINDER, ...(JSON.parse(raw) as Partial<ReminderSetting>) } : DEFAULT_REMINDER;
  } catch {
    return DEFAULT_REMINDER;
  }
}

/** Saves the setting and (re)schedules or cancels the notification. Returns whether it is actually on. */
export async function applyReminder(setting: ReminderSetting, askName: string): Promise<boolean> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(setting));
  } catch {
    // Keep going; the schedule still applies for this install.
  }

  if (Platform.OS === 'web') return false; // browsers: no scheduled notifications

  try {
    await Notifications.cancelScheduledNotificationAsync(IDENTIFIER).catch(() => {});
    if (!setting.enabled) return false;

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return false;

    await Notifications.scheduleNotificationAsync({
      identifier: IDENTIFIER,
      content: {
        title: `Ask ${askName} something`,
        body: 'Three cards are waiting. One good question is enough.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: setting.weekday,
        hour: setting.hour,
        minute: 0,
      },
    });
    return true;
  } catch {
    return false;
  }
}
