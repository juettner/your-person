//
//  Small.swift
//
//  The small grey text of the journal: the date line, a count, a hint.
//

import SwiftUI

enum SmallTone {
    case grey, muted, ink
}

struct Small: View {
    let text: String
    var tone: SmallTone = .grey
    var size: CGFloat = TypeSize.small

    init(_ text: String, tone: SmallTone = .grey, size: CGFloat = TypeSize.small) {
        self.text = text
        self.tone = tone
        self.size = size
    }

    private var color: Color {
        switch tone {
        case .grey: return Ink.grey
        case .muted: return Ink.muted
        case .ink: return Ink.ink
        }
    }

    var body: some View {
        Text(text)
            .font(.type(size))
            .foregroundStyle(color)
            .lineSpacing(size * 0.3)
            .fixedSize(horizontal: false, vertical: true)
    }
}
