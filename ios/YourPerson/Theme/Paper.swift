//
//  Paper.swift
//
//  The "Letter" look: one soft colour, a script hand, nothing else.
//
//  A screen is paper, words on it are ink, secondary words are a lighter ink.
//  Five papers to choose from; the chosen one is remembered on the device.
//  Every view reads colours from `theme.paper`, never from a literal.
//

import SwiftUI

enum Paper: String, CaseIterable, Identifiable {
    case linen, blush, sage, dusk, wine

    var id: String { rawValue }
    var name: String { rawValue }

    /// The screen.
    var paper: Color {
        switch self {
        case .linen: return Color(hex: 0xFBF5EE)
        case .blush: return Color(hex: 0xF8E3E2)
        case .sage: return Color(hex: 0xE7EDE2)
        case .dusk: return Color(hex: 0x2C2238)
        case .wine: return Color(hex: 0x4A1C2A)
        }
    }

    /// Words.
    var ink: Color {
        switch self {
        case .linen: return Color(hex: 0x3A2430)
        case .blush: return Color(hex: 0x6B2238)
        case .sage: return Color(hex: 0x2E3A30)
        case .dusk: return Color(hex: 0xF6EAEE)
        case .wine: return Color(hex: 0xFAEDE6)
        }
    }

    /// Secondary words: hints, dates, placeholders. Picked to pass 4.5:1 on `paper`.
    var muted: Color {
        switch self {
        case .linen: return Color(hex: 0x846A74)
        case .blush: return Color(hex: 0x9A6473)
        case .sage: return Color(hex: 0x66766A)
        case .dusk: return Color(hex: 0xB9A4B6)
        case .wine: return Color(hex: 0xCFA8AC)
        }
    }

    /// Dark papers want light status bar text.
    var isDark: Bool {
        switch self {
        case .dusk, .wine: return true
        default: return false
        }
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

/// Remembers the chosen paper. `@Published` makes every view that reads it re-render when it changes.
@MainActor
final class ThemeStore: ObservableObject {
    private static let key = "your-person.paper"

    @Published var paper: Paper {
        didSet { UserDefaults.standard.set(paper.rawValue, forKey: Self.key) }
    }

    init() {
        // Guard against a stale value from an older build that named papers differently.
        paper = Paper(rawValue: UserDefaults.standard.string(forKey: Self.key) ?? "") ?? .linen
    }
}
