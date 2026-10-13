//
//  OnboardingView.swift
//
//  First run: fill in the page, then start asking.
//

import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject private var profiles: ProfileStore

    var body: some View {
        Screen {
            ProfileFormView(mode: .create, title: "Tell me about your person.", submitLabel: "Deal me in") { input in
                let profile = try await APIClient.shared.createProfile(input)
                // Setting the id swaps the root to Today (see RootView).
                profiles.profileId = profile.id
            }
        }
    }
}
