//
//  RootView.swift
//
//  Decides what the app opens on: the first pages until a profile exists,
//  then the entry. A NavigationStack lets the entry push their page, and
//  their page push what they said, with the system swipe-back gesture and
//  no visible bar. The journal is always white paper, so the light scheme
//  is fixed.
//

import SwiftUI

struct RootView: View {
    @EnvironmentObject private var profiles: ProfileStore

    var body: some View {
        NavigationStack {
            if profiles.profileId == nil {
                OnboardingView()
            } else {
                EntryView()
            }
        }
        .tint(Ink.ink)
        .preferredColorScheme(.light)
    }
}
