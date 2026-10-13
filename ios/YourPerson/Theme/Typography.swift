//
//  Typography.swift
//
//  One typeface in two forms that are the same design:
//
//    Allura (Rob Leuschke, SIL Open Font License), a TTF in Resources, for
//    everything static: labels, fields, actions.
//
//    EMS Allure, Allura traced as pen strokes, for the words that should be
//    written in front of you. See Handwriting/.
//
//  Both are sized by the em, so an engine size of 30 and a font size of 30
//  are the same size. Script faces have a small x-height, so they run a few
//  points bigger than a sans would.
//

import SwiftUI

enum TypeSize {
    static let title: CGFloat = 42
    static let body: CGFloat = 28
    static let small: CGFloat = 23
}

enum HandSize {
    static let hero: CGFloat = 46
    static let title: CGFloat = 44
    static let body: CGFloat = 30
}

extension Font {
    /// The PostScript name inside Allura-Regular.ttf. Registered through UIAppFonts in Info.plist.
    static func hand(_ size: CGFloat) -> Font {
        .custom("Allura-Regular", size: size)
    }
}
