//
//  LocationService.swift
//
//  Turns the phone's position into a place name, so the questionnaire can
//  fill in "where they live" with one tap. Only the NAME goes to the API.
//
//  CoreLocation is callback-based; this wraps it in async/await so the form
//  can simply `await LocationService().detect()`.
//

import CoreLocation
import Foundation

enum DetectResult {
    case ok(ProfileLocation)
    case denied
    case unavailable
}

@MainActor
final class LocationService: NSObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    private var authorization: CheckedContinuation<CLAuthorizationStatus, Never>?
    private var position: CheckedContinuation<CLLocation?, Never>?

    override init() {
        super.init()
        manager.delegate = self
        // A city name does not need GPS precision; coarse is faster and kinder to the battery.
        manager.desiredAccuracy = kCLLocationAccuracyKilometer
    }

    func detect() async -> DetectResult {
        var status = manager.authorizationStatus
        if status == .notDetermined {
            status = await withCheckedContinuation { continuation in
                authorization = continuation
                manager.requestWhenInUseAuthorization()
            }
        }
        guard status == .authorizedWhenInUse || status == .authorizedAlways else { return .denied }

        let location = await withCheckedContinuation { continuation in
            position = continuation
            manager.requestLocation()
        }
        guard let location else { return .unavailable }

        do {
            let places = try await CLGeocoder().reverseGeocodeLocation(location)
            guard let place = places.first, let city = place.locality ?? place.subAdministrativeArea else { return .unavailable }
            return .ok(ProfileLocation(city: city, region: place.administrativeArea, country: place.isoCountryCode ?? place.country))
        } catch {
            return .unavailable
        }
    }

    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = manager.authorizationStatus
        Task { @MainActor in
            guard status != .notDetermined else { return }
            authorization?.resume(returning: status)
            authorization = nil
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        let latest = locations.last
        Task { @MainActor in
            position?.resume(returning: latest)
            position = nil
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        Task { @MainActor in
            position?.resume(returning: nil)
            position = nil
        }
    }
}
