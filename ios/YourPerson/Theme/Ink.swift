//
//  Ink.swift
//
//  The "Journal" look: white paper, black ink, one typewriter face.
//
//  There is one look, so there is no theme store: every view reads these
//  statics. A screen is a page of a journal. The question is the only loud
//  thing on it; everything else is small, grey, and out of the way.
//
//    paper   the page. Pure white, on purpose (not cream, not off-white).
//    ink     the typed text, the drawn circles, the underline under "keep".
//    grey    the quiet things: the date line, a count, a hint.
//    muted   a quiet word you can tap.
//    faint   the option you did not pick, next to the one you did.
//    fold    the lifted corner at the bottom right that turns the page.
//

import SwiftUI

enum Ink {
    static let paper = Color(hex: 0xFFFFFF)
    static let ink = Color(hex: 0x1E1A17)
    static let grey = Color(hex: 0x9A9088)
    static let muted = Color(hex: 0x6B625A)
    static let faint = Color(hex: 0xC4BCB2)
    static let fold = Color(hex: 0xF1EEE9)
    static let foldEdge = Color(hex: 0xE6E1DA)
}

/// Type sizes. The question is the headline on every page; the rest stays small.
enum TypeSize {
    static let question: CGFloat = 30
    static let heading: CGFloat = 28
    static let body: CGFloat = 19
    static let word: CGFloat = 15
    static let small: CGFloat = 13
}

/// How fast the typewriter types, in characters per second: a brisk human typist.
enum Typing {
    static let charactersPerSecond: Double = 26
}

/// Page margins: the inset from the edge of the paper.
enum Margin {
    static let side: CGFloat = 36
    static let top: CGFloat = 24
    /// Room kept clear for the fold at the bottom right.
    static let bottom: CGFloat = 120
}

extension Font {
    /// Special Elite (Astigmatic, Apache License 2.0): a single-weight typewriter
    /// face. There is no bold, so emphasis comes from size, a drawn circle, or
    /// an underline, never weight. The PostScript name inside the TTF in
    /// Resources, registered through UIAppFonts in Info.plist.
    static func type(_ size: CGFloat) -> Font {
        .custom("SpecialElite-Regular", size: size)
    }
}

extension Color {
    init(hex: UInt32) {
        self.init(
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255
        )
    }
}
