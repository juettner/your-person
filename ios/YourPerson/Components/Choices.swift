//
//  Choices.swift
//
//  Pick words from a list, one per line. Chosen ones get circled.
//
//  Single-select behaves like radio buttons, multi-select like checkboxes.
//  The parent owns the selection, the React and SwiftUI norm for form state.
//

import SwiftUI

struct Choice: Identifiable, Equatable {
    let id: String
    let label: String
}

struct Choices: View {
    let options: [Choice]
    @Binding var selected: [String]
    var multi = false
    var size: CGFloat = TypeSize.body

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            ForEach(options) { option in
                Circled(option.label, on: selected.contains(option.id), size: size) {
                    toggle(option.id)
                }
            }
        }
    }

    private func toggle(_ id: String) {
        if multi {
            if let index = selected.firstIndex(of: id) {
                selected.remove(at: index)
            } else {
                selected.append(id)
            }
        } else {
            // Tapping the chosen word again clears it, so nothing is ever stuck.
            selected = selected.first == id ? [] : [id]
        }
    }
}
