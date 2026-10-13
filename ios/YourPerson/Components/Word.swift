//
//  Word.swift
//
//  A word you can tap. This replaces every button in the app.
//
//    action   underlined, like a link in a letter ("Next", "Save", "Profile")
//    option   muted; circled in ink when selected (a chosen interest, "Day" / "Evening")
//    toggle   ink; circled when selected ("Nope" / "Good one", where neither is the quiet choice)
//    quiet    plain, muted; for the least important thing on the screen ("Not now")
//
//  Every tap gives a soft click under the finger, like a pen touching paper.
//

import SwiftUI

enum WordVariant {
    case action, option, toggle, quiet
}

struct Word: View {
    let title: String
    var variant: WordVariant = .action
    var selected = false
    var disabled = false
    /// Dims and disables while something is in flight.
    var busy = false
    var size: CGFloat = TypeSize.body
    let action: () -> Void

    @EnvironmentObject private var theme: ThemeStore

    init(_ title: String, variant: WordVariant = .action, selected: Bool = false, disabled: Bool = false, busy: Bool = false, size: CGFloat = TypeSize.body, action: @escaping () -> Void) {
        self.title = title
        self.variant = variant
        self.selected = selected
        self.disabled = disabled
        self.busy = busy
        self.size = size
        self.action = action
    }

    private var inactive: Bool { disabled || busy }

    private var decoration: ScribbleKind? {
        switch variant {
        case .action: return .underline
        case .option, .toggle: return selected ? .loop : nil
        case .quiet: return nil
        }
    }

    private var tone: Color {
        switch variant {
        case .quiet: return theme.paper.muted
        case .option: return selected ? theme.paper.ink : theme.paper.muted
        case .action, .toggle: return theme.paper.ink
        }
    }

    var body: some View {
        Button {
            Haptics.tick()
            action()
        } label: {
            Text(title)
                .font(.hand(size))
                .foregroundStyle(tone)
                .scribbled(decoration, color: theme.paper.ink, seed: title)
                .padding(.horizontal, 2)
                .frame(minHeight: 44)
                .contentShape(Rectangle())
        }
        .buttonStyle(PressedStyle())
        .disabled(inactive)
        .opacity(inactive ? 0.4 : 1)
        .accessibilityAddTraits(selected ? .isSelected : [])
    }
}

/// Dims a word while the finger is on it. No background, no shape: it is just a word.
struct PressedStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .opacity(configuration.isPressed ? 0.6 : 1)
    }
}
