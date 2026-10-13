//
//  Haptics.swift
//
//  The tactile side of the writing. Three feelings, named for what they mean:
//
//    tick     the pen starts a word; also any tap on a word
//    tap      the line is finished
//    success  something was saved
//
//  UIKit's feedback generators are the lightest way to do this. `prepare()`
//  warms the Taptic Engine so the first tick is not late.
//

import UIKit

@MainActor
enum Haptics {
    private static let selection = UISelectionFeedbackGenerator()
    private static let light = UIImpactFeedbackGenerator(style: .light)
    private static let notification = UINotificationFeedbackGenerator()

    static func prepare() {
        selection.prepare()
        light.prepare()
    }

    static func tick() {
        selection.selectionChanged()
        selection.prepare()
    }

    static func tap() {
        light.impactOccurred(intensity: 0.7)
    }

    static func success() {
        notification.notificationOccurred(.success)
    }
}
