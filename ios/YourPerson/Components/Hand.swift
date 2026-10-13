//
//  Hand.swift
//
//  Static handwritten text: the Allura script with the app's sizes and
//  colours baked in. Use it for anything that doesn't need to be written in
//  front of you.
//

import SwiftUI

enum Tone {
    case ink, muted
}

struct Hand: View {
    let text: String
    var size: CGFloat = TypeSize.body
    var tone: Tone = .ink
    var align: TextAlignment = .leading

    @EnvironmentObject private var theme: ThemeStore

    init(_ text: String, size: CGFloat = TypeSize.body, tone: Tone = .ink, align: TextAlignment = .leading) {
        self.text = text
        self.size = size
        self.tone = tone
        self.align = align
    }

    var body: some View {
        Text(text)
            .font(.hand(size))
            .foregroundStyle(tone == .ink ? theme.paper.ink : theme.paper.muted)
            .multilineTextAlignment(align)
            .lineSpacing(size * 0.08)
            .fixedSize(horizontal: false, vertical: true)
    }
}
