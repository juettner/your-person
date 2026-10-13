//
//  WordChoice.swift
//
//  Pick words from a list. Chosen ones get circled.
//
//  Single-select behaves like radio buttons, multi-select like checkboxes.
//  `limit` shows only the first N words plus anything already chosen, with a
//  "+n more" word to reveal the rest, so a long list (the interests) fits on
//  one screen. The words flow onto as many lines as they need (FlowLayout).
//

import SwiftUI

struct Choice: Identifiable, Equatable {
    let id: String
    let label: String
}

struct WordChoice: View {
    let options: [Choice]
    @Binding var selected: [String]
    var multi = false
    var limit: Int? = nil
    var size: CGFloat = TypeSize.body

    @State private var expanded = false

    private var visible: [Choice] {
        guard let limit, !expanded else { return options }
        return options.enumerated().filter { index, option in index < limit || selected.contains(option.id) }.map(\.element)
    }

    var body: some View {
        let hidden = options.count - visible.count
        FlowLayout(horizontalSpacing: 18, verticalSpacing: 2) {
            ForEach(visible) { option in
                Word(option.label, variant: .option, selected: selected.contains(option.id), size: size) {
                    toggle(option.id)
                }
            }
            if hidden > 0 {
                Word("+\(hidden) more", variant: .quiet, size: size) {
                    expanded = true
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

/// Lays children left to right and wraps to the next line when they don't fit.
struct FlowLayout: Layout {
    var horizontalSpacing: CGFloat = 16
    var verticalSpacing: CGFloat = 4

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0
        var widest: CGFloat = 0
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x > 0 && x + size.width > maxWidth {
                x = 0
                y += rowHeight + verticalSpacing
                rowHeight = 0
            }
            x += size.width + horizontalSpacing
            rowHeight = max(rowHeight, size.height)
            widest = max(widest, x - horizontalSpacing)
        }
        return CGSize(width: proposal.width ?? widest, height: y + rowHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let maxWidth = bounds.width
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x > 0 && x + size.width > maxWidth {
                x = 0
                y += rowHeight + verticalSpacing
                rowHeight = 0
            }
            subview.place(at: CGPoint(x: bounds.minX + x, y: bounds.minY + y), proposal: .unspecified)
            x += size.width + horizontalSpacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}
