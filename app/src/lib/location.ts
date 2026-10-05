/**
 * Turns the device's position into a place name, so the questionnaire can
 * fill in "where they live" with one tap. Only the NAME goes to the API.
 *
 * expo-location wraps the platform location services. On iOS and Android it
 * prompts for permission (the text comes from app.json's plugin config); on
 * web it uses the browser's geolocation API, which has no reverse geocoder,
 * so web users may need to type the city.
 */
import * as Location from 'expo-location';
import type { ProfileLocation } from '@/lib/api';

export type DetectResult =
  | { status: 'ok'; location: ProfileLocation }
  | { status: 'denied' }
  | { status: 'unavailable' };

export async function detectLocation(): Promise<DetectResult> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { status: 'denied' };

    // Low accuracy is plenty for a city name and is faster and kinder to the battery.
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });

    const places = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
    const place = places[0];
    const city = place?.city ?? place?.subregion ?? place?.district ?? null;
    if (!city) return { status: 'unavailable' };

    return {
      status: 'ok',
      location: {
        city,
        region: place.region ?? undefined,
        country: place.isoCountryCode ?? place.country ?? undefined,
      },
    };
  } catch {
    // Reverse geocoding is not supported on web, and anything can fail on a device.
    return { status: 'unavailable' };
  }
}
