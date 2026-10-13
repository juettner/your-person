//
//  ProfileStore.swift
//
//  Remembers which profile this phone is using. The whole "session" for the
//  MVP is one string in UserDefaults. Accounts replace this later.
//

import SwiftUI

@MainActor
final class ProfileStore: ObservableObject {
    private static let key = "your-person.profileId"

    @Published var profileId: String? {
        didSet {
            if let profileId {
                UserDefaults.standard.set(profileId, forKey: Self.key)
            } else {
                UserDefaults.standard.removeObject(forKey: Self.key)
            }
        }
    }

    init() {
        profileId = UserDefaults.standard.string(forKey: Self.key)
    }
}
