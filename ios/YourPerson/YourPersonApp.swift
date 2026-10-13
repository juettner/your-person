//
//  YourPersonApp.swift
//
//  The app's entry point. SwiftUI's `App` protocol replaces AppDelegate for
//  everything this app needs. Two stores live for the whole run and are
//  handed down to every view through the environment:
//
//    ThemeStore    which paper is on screen (remembered on the device)
//    ProfileStore  which profile this phone is using (one string)
//
//  Spring analogy: application-scoped beans, injected by type.
//

import SwiftUI

@main
struct YourPersonApp: App {
    @StateObject private var theme = ThemeStore()
    @StateObject private var profiles = ProfileStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(theme)
                .environmentObject(profiles)
        }
    }
}
