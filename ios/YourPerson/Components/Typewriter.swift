//
//  Typewriter.swift
//
//  Text that types itself out, one character at a time, with an underscore
//  cursor after the last character.
//
//  The cursor has three states, matching what the page is doing:
//    steady    while the line is still being typed
//    blinking  once the line is done and the page is waiting on you
//    gone      once you have answered (`answered` is true)
//
//  Tapping the text finishes it instantly, for anyone who has read it before.
//  Reduce Motion shows the finished text at once. A soft tick under the
//  finger as each word starts, like the carriage moving.
//
//  How it works: `shown` is how many characters are on the page. `.task(id:)`
//  starts an async loop when the text changes and cancels it when the view
//  goes away or the text changes again; each step sleeps for one character's
//  worth of time and bumps the count. There are no timers to clean up.
//

import SwiftUI

struct Typewriter: View {
    let text: String
    /// Hides the cursor: the page has what it asked for.
    var answered = false
    var size: CGFloat = TypeSize.question
    /// Characters per second.
    var speed: Double = Typing.charactersPerSecond
    /// Tick as each word starts.
    var haptics = true
    /// Called once the whole line is on the page (typed or tapped through).
    var onDone: (() -> Void)? = nil

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var shown = 0
    @State private var blinkOn = true

    private var characters: [Character] { Array(text) }
    private var done: Bool { shown >= characters.count }
    private var cursorVisible: Bool { !answered && (!done || blinkOn) }

    var body: some View {
        // A non-breaking space keeps the cursor glued to the last word, so it never
        // wraps alone onto a new line. When the cursor is gone it is still laid out
        // (clear) so the line does not shift.
        (Text(String(characters.prefix(shown))) + Text("\u{00A0}_").foregroundColor(cursorVisible ? Ink.ink : .clear))
            .font(.type(size))
            .foregroundStyle(Ink.ink)
            .lineSpacing(size * 0.3)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
            .contentShape(Rectangle())
            .onTapGesture { shown = characters.count }
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(text)
            .accessibilityAddTraits(.isHeader)
            .task(id: text) { await type() }
            .task(id: done && !answered) { await blink() }
    }

    private func type() async {
        shown = 0
        if reduceMotion || speed <= 0 {
            shown = characters.count
            onDone?()
            return
        }
        if haptics { Haptics.prepare() }
        var wordStart = true
        for (index, character) in characters.enumerated() {
            try? await Task.sleep(for: .seconds(1 / speed))
            if Task.isCancelled { return }
            if shown >= characters.count { break } // tapped through
            shown = max(shown, index + 1)
            if haptics && wordStart && !character.isWhitespace { Haptics.tick() }
            wordStart = character.isWhitespace
        }
        onDone?()
    }

    private func blink() async {
        blinkOn = true
        guard done && !answered else { return }
        while !Task.isCancelled {
            try? await Task.sleep(for: .seconds(0.5))
            if Task.isCancelled { return }
            blinkOn.toggle()
        }
    }
}
