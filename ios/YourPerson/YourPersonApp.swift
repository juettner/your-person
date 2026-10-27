//
//  YourPersonApp.swift
//
//  The app's entry point. SwiftUI's `App` protocol replaces AppDelegate for
//  everything this app needs. One store lives for the whole run and is
//  handed down to every view through the environment:
//
//    ProfileStore  which profile this phone is using (one string)
//
//  Spring analogy: an application-scoped bean, injected by type.
//

import SwiftUI

@main
struct YourPersonApp: App {
    @StateObject private var profiles = ProfileStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(profiles)
        }
    }
}
