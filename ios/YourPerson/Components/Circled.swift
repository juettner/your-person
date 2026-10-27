//
//  Circled.swift
//
//  A word with a circle drawn around it in ink when it is picked.
//
//  The circle is one pen stroke: it starts low on the left, sweeps over the
//  top, comes down the right, runs back along the bottom, and overlaps its
//  own start before stopping, the way a hand closes a loop. It is drawn over
//  0.7s by trimming the path from nothing to its full length, with the pen
//  moving quickly through the middle and slowing into the overlap. Unpicking
//  removes it at once: nobody un-draws a circle.
//
//  The path is defined in a 100 x 40 box and stretched to the word's size,
//  so a long word gets a wider loop with the same hand-drawn shape.
//

import SwiftUI

struct Circled: View {
    let label: String
    let on: Bool
    var size: CGFloat = TypeSize.body
    let action: () -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    /// 0 = nothing drawn, 1 = the whole loop.
    @State private var progress: CGFloat

    init(_ label: String, on: Bool, size: CGFloat = TypeSize.body, action: @escaping () -> Void) {
        self.label = label
        self.on = on
        self.size = size
        self.action = action
        // A word that starts picked (their page) shows its circle without redrawing it.
        _progress = State(initialValue: on ? 1 : 0)
    }

    var body: some View {
        Button {
            Haptics.tick()
            action()
        } label: {
            Text(label)
                .font(.type(size))
                .foregroundStyle(Ink.ink)
                .lineSpacing(size * 0.3)
                .padding(.horizontal, 10)
                .padding(.vertical, 2)
                .overlay {
                    if on {
                        LoopShape()
                            .trim(from: 0, to: progress)
                            .stroke(Ink.ink, style: StrokeStyle(lineWidth: 1.6, lineCap: .round, lineJoin: .round))
                            .padding(.horizontal, -6)
                            .padding(.vertical, -6)
                            .allowsHitTesting(false)
                    }
                }
                // Side padding gives the loop room to start before the first letter; the negative margin keeps the text flush.
                .padding(.horizontal, -10)
                .frame(minHeight: 42)
                .contentShape(Rectangle())
        }
        .buttonStyle(PressedStyle())
        .accessibilityAddTraits(on ? .isSelected : [])
        .onChange(of: on) { _, next in
            guard next else {
                progress = 0
                return
            }
            progress = 0
            if reduceMotion {
                progress = 1
                return
            }
            // Let the 0 land before animating to 1, so the stroke draws from the start every time.
            Task { @MainActor in
                try? await Task.sleep(for: .milliseconds(16))
                withAnimation(.timingCurve(0.3, 0, 0.2, 1, duration: 0.7)) { progress = 1 }
            }
        }
    }
}

/// One loop with a run-up and an overlap, drawn in a 100 x 40 box and scaled to the rect.
struct LoopShape: Shape {
    func path(in rect: CGRect) -> Path {
        let sx = rect.width / 100
        let sy = rect.height / 40
        func p(_ x: CGFloat, _ y: CGFloat) -> CGPoint {
            CGPoint(x: rect.minX + x * sx, y: rect.minY + y * sy)
        }
        var path = Path()
        path.move(to: p(14, 29))
        path.addCurve(to: p(30, 5), control1: p(6, 24), control2: p(6, 10))
        path.addCurve(to: p(94, 11), control1: p(52, 1), control2: p(80, 2))
        path.addCurve(to: p(80, 35), control1: p(102, 17), control2: p(98, 30))
        path.addCurve(to: p(14, 36), control1: p(62, 40), control2: p(30, 41))
        path.addCurve(to: p(10, 17), control1: p(4, 33), control2: p(2, 24))
        path.addCurve(to: p(36, 8), control1: p(16, 12), control2: p(26, 9))
        return path
    }
}
