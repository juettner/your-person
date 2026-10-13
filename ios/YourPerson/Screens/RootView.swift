//
//  RootView.swift
//
//  Decides what the app opens on: onboarding until a profile exists, then
//  Today. A NavigationStack lets Today push Profile, and Profile push
//  Memories, with the system swipe-back gesture and no visible bar.
//

import SwiftUI

struct RootView: View {
    @EnvironmentObject private var theme: ThemeStore
    @EnvironmentObject private var profiles: ProfileStore

    var body: some View {
        NavigationStack {
            if profiles.profileId == nil {
                OnboardingView()
            } else {
                TodayView()
            }
        }
        .tint(theme.paper.ink)
        .preferredColorScheme(theme.paper.isDark ? .dark : .light)
    }
}
