//
//  Thinking.swift
//
//  The loading state: a short line that writes itself, pauses, and writes
//  itself again. Quieter than a spinner and it matches the rest of the page.
//

import SwiftUI

struct Thinking: View {
    var text = "One moment."

    @EnvironmentObject private var theme: ThemeStore
    @State private var replayKey = 0
    @State private var pause: Task<Void, Never>? = nil

    var body: some View {
        HandwritingView(text: text, size: HandSize.body, color: theme.paper.muted, speed: 1.5, replayKey: replayKey) {
            pause = Task { @MainActor in
                try? await Task.sleep(for: .seconds(0.9))
                if !Task.isCancelled { replayKey += 1 }
            }
        }
        .onDisappear { pause?.cancel() }
    }
}
