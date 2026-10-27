//
//  Word.swift
//
//  A word you can tap. The journal has no buttons: actions are words on the
//  page. "keep", "not for us", "back", "what they said".
//
//    tone    ink (an action), grey (a quiet link), faint (the option you did not pick)
//    marked  underlines the word in ink, for the choice you made
//
//  Every tap gives a soft click under the finger.
//

import SwiftUI

enum WordTone {
    case ink, grey, faint
}

struct Word: View {
    let title: String
    var tone: WordTone = .ink
    var marked = false
    var disabled = false
    var size: CGFloat = TypeSize.word
    let action: () -> Void

    init(_ title: String, tone: WordTone = .ink, marked: Bool = false, disabled: Bool = false, size: CGFloat = TypeSize.word, action: @escaping () -> Void) {
        self.title = title
        self.tone = tone
        self.marked = marked
        self.disabled = disabled
        self.size = size
        self.action = action
    }

    private var color: Color {
        switch tone {
        case .ink: return Ink.ink
        case .grey: return Ink.muted
        case .faint: return Ink.faint
        }
    }

    var body: some View {
        Button {
            Haptics.tick()
            action()
        } label: {
            Text(title)
                .font(.type(size))
                .foregroundStyle(color)
                .underline(marked, color: Ink.ink)
                .frame(minHeight: 44)
                .contentShape(Rectangle())
        }
        .buttonStyle(PressedStyle())
        .disabled(disabled)
        .opacity(disabled ? 0.5 : 1)
        .accessibilityAddTraits(marked ? .isSelected : [])
    }
}

/// Dims a word while the finger is on it. No background, no shape: it is just a word.
struct PressedStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .opacity(configuration.isPressed ? 0.6 : 1)
    }
}
