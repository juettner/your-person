/**
 * Remembers which profile this device is using.
 *
 * AsyncStorage is a tiny key-value store: on iOS and Android it is backed by
 * native storage, on web by localStorage. The whole "session" for the MVP is
 * one string: the profile id. Accounts replace this later (docs/ROADMAP.md).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'your-person.profileId';

export async function getProfileId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export async function setProfileId(id: string): Promise<void> {
  await AsyncStorage.setItem(KEY, id);
}

export async function clearProfileId(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
