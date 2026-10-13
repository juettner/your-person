//
//  Screen.swift
//
//  Every screen's outer frame: the paper. Fills the display, respects the
//  safe areas for content, and hides the system navigation bar so the only
//  chrome is the words themselves. The swipe-back gesture keeps working.
//

import SwiftUI

struct Screen<Content: View>: View {
    @ViewBuilder let content: () -> Content

    @EnvironmentObject private var theme: ThemeStore

    var body: some View {
        ZStack(alignment: .top) {
            theme.paper.paper.ignoresSafeArea()
            content()
                .padding(.horizontal, 24)
                .padding(.top, 16)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        }
        .toolbar(.hidden, for: .navigationBar)
    }
}
