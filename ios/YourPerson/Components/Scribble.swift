//
//  Scribble.swift
//
//  Hand-drawn decoration around a word: a wobbly underline, or a loop around
//  it like you'd circle something on a list.
//
//  Drawn as an overlay sized by the word, so it needs no measuring code. The
//  wobble is seeded by the word itself, so it doesn't jitter on re-render.
//  Two to three points of wander is enough to read as a pen.
//

import SwiftUI

enum ScribbleKind {
    case underline, loop
}

/// A tiny seeded generator so the wobble is the same every render.
struct SeededRandom: RandomNumberGenerator {
    private var state: UInt64

    init(seed: String) {
        var hash: UInt64 = 14695981039346656037
        for byte in seed.utf8 {
            hash ^= UInt64(byte)
            hash = hash &* 1099511628211
        }
        state = hash == 0 ? 0x9E3779B97F4A7C15 : hash
    }

    mutating func next() -> UInt64 {
        state = state &* 6364136223846793005 &+ 1442695040888963407
        return state
    }

    mutating func unit() -> CGFloat {
        CGFloat(next() >> 11) / CGFloat(1 << 53)
    }
}

enum ScribblePath {
    static func make(_ kind: ScribbleKind, in size: CGSize, seed: String) -> Path {
        switch kind {
        case .underline: return underline(size, seed: seed)
        case .loop: return loop(size, seed: seed)
        }
    }

    private static func underline(_ size: CGSize, seed: String) -> Path {
        var rng = SeededRandom(seed: seed)
        var path = Path()
        let y = size.height - 3
        let steps = max(3, Int((size.width / 24).rounded()))
        path.move(to: CGPoint(x: 0, y: y + rng.unit() * 2 - 1))
        for i in 1...steps {
            let x = size.width * CGFloat(i) / CGFloat(steps)
            path.addLine(to: CGPoint(x: x, y: y + rng.unit() * 3 - 1.5))
        }
        return path
    }

    private static func loop(_ size: CGSize, seed: String) -> Path {
        var rng = SeededRandom(seed: seed)
        var path = Path()
        let pad: CGFloat = 10
        let cx = size.width / 2
        let cy = size.height / 2
        let rx = size.width / 2 + pad - 2
        let ry = size.height / 2 + pad - 3
        let steps = 56
        // Start on the left, go round once, and overshoot a little so the ends cross like a real loop.
        let start = CGFloat.pi * 0.9
        var wobble: CGFloat = 1
        for i in 0...(steps + 6) {
            let t = start + CGFloat(i) / CGFloat(steps) * CGFloat.pi * 2
            // Drift the wobble instead of re-rolling it, so the line wanders rather than shivers.
            wobble += (rng.unit() - 0.5) * 0.03
            wobble = min(1.05, max(0.95, wobble))
            let point = CGPoint(x: cx + cos(t) * rx * wobble, y: cy + sin(t) * ry * wobble)
            if i == 0 { path.move(to: point) } else { path.addLine(to: point) }
        }
        return path
    }
}

struct Scribbled: ViewModifier {
    let kind: ScribbleKind?
    let color: Color
    let seed: String

    func body(content: Content) -> some View {
        content.overlay {
            if let kind {
                GeometryReader { geo in
                    ScribblePath.make(kind, in: geo.size, seed: seed)
                        .stroke(color, style: StrokeStyle(lineWidth: 1.5, lineCap: .round, lineJoin: .round))
                }
                .allowsHitTesting(false)
            }
        }
    }
}

extension View {
    func scribbled(_ kind: ScribbleKind?, color: Color, seed: String) -> some View {
        modifier(Scribbled(kind: kind, color: color, seed: seed))
    }
}
