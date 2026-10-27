//
//  Page.swift
//
//  One page of the journal: white paper, the safe areas respected for the
//  words, the system navigation bar hidden so the only chrome is the words,
//  and, when the page can be turned, a lifted corner at the bottom right.
//
//  Turning the page: tap the corner, or swipe left anywhere on the page.
//  Swiping right goes back where the page allows it. The drag claims the
//  gesture only once the finger has clearly moved sideways, so taps and
//  vertical scrolling inside the page still work.
//

import SwiftUI

struct Page<Content: View>: View {
    /// When set, the page shows the fold and can be turned.
    var onTurn: (() -> Void)? = nil
    /// What the fold is called to a screen reader ("Turn the page", "Three more").
    var turnLabel = "Turn the page"
    /// Swipe right, when the page allows going back.
    var onTurnBack: (() -> Void)? = nil
    @ViewBuilder let content: () -> Content

    init(onTurn: (() -> Void)? = nil, turnLabel: String = "Turn the page", onTurnBack: (() -> Void)? = nil, @ViewBuilder content: @escaping () -> Content) {
        self.onTurn = onTurn
        self.turnLabel = turnLabel
        self.onTurnBack = onTurnBack
        self.content = content
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            Ink.paper.ignoresSafeArea()
            content()
                .padding(.horizontal, Margin.side)
                .padding(.top, Margin.top)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            if let onTurn {
                Fold(label: turnLabel, action: onTurn)
                    .ignoresSafeArea(edges: .bottom)
            }
        }
        .contentShape(Rectangle())
        .gesture(
            DragGesture(minimumDistance: 24)
                .onEnded { value in
                    let dx = value.translation.width
                    let dy = value.translation.height
                    guard abs(dx) > abs(dy) * 2 else { return }
                    if dx < -60, let onTurn {
                        onTurn()
                    } else if dx > 60, let onTurnBack {
                        onTurnBack()
                    }
                }
        )
        .toolbar(.hidden, for: .navigationBar)
    }
}

/// The lifted corner: a diagonal crease with the page underneath showing through, white on white.
struct Fold: View {
    let label: String
    let action: () -> Void

    private static let size: CGFloat = 120

    var body: some View {
        Button {
            Haptics.tap()
            action()
        } label: {
            ZStack {
                FoldShape().fill(Ink.fold)
                Path { path in
                    path.move(to: CGPoint(x: 0, y: Self.size))
                    path.addLine(to: CGPoint(x: Self.size, y: 0))
                }
                .stroke(Ink.foldEdge, lineWidth: 2)
            }
            .frame(width: Self.size, height: Self.size)
            .contentShape(Rectangle())
        }
        .buttonStyle(PressedStyle())
        .accessibilityLabel(label)
    }
}

/// The lower-right triangle of a square.
struct FoldShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.minX, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
        path.closeSubpath()
        return path
    }
}
