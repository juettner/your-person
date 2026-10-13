//
//  HandwritingView.swift
//
//  Text that writes itself, stroke by stroke, like ink appearing on paper.
//
//  The pieces:
//
//    1. Measure the available width (GeometryReader). Nothing can be laid
//       out before we know where the lines wrap.
//    2. Build a plan (TextPlan): every letter gets a position, a start time
//       and a duration. It is rebuilt only when the text, width or size change.
//    3. Run one clock. TimelineView redraws at 15-30 fps and hands us the
//       date; every frame derives each letter's progress from the time since
//       the pen started. There are no per-letter timers.
//    4. Draw. One Canvas strokes every path. A stroke that hasn't started is
//       skipped, a finished one is drawn whole, and the one being written
//       right now is trimmed to its progress (Path.trimmedPath).
//    5. A single Task sleeps until each word starts and ticks the haptics,
//       then marks the view finished so it renders statically from then on.
//
//  Reduce Motion shows the finished text at once. Characters the typeface
//  has no drawing for (emoji, odd symbols) are drawn in the Allura font at
//  the same spot, so nothing silently disappears.
//

import SwiftUI

struct HandwritingView: View {
    let text: String
    var size: CGFloat = HandSize.body
    var color: Color
    /// false renders the finished text immediately.
    var animate = true
    /// 1 is the default pace. 2 is twice as slow.
    var speed: Double = 1
    /// Seconds to wait before the pen starts.
    var delay: TimeInterval = 0
    /// Change this to write the same text again.
    var replayKey = 0
    /// Tick as each word starts, tap when done.
    var haptics = false
    var align: TextPlan.Alignment = .leading
    var lineHeight: CGFloat? = nil
    var lineWidth: CGFloat? = nil
    var onDone: (() -> Void)? = nil

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var width: CGFloat = 0
    @State private var plan: TextPlan? = nil
    @State private var startedAt = Date()
    @State private var finished = false
    @State private var runner: Task<Void, Never>? = nil

    var body: some View {
        GeometryReader { geo in
            Color.clear
                .onAppear { width = geo.size.width }
                .onChange(of: geo.size.width) { _, next in width = next }
        }
        .frame(height: plan?.height ?? size * Typeface.boxEm)
        .overlay(alignment: .topLeading) {
            if let plan {
                drawing(plan)
            }
        }
        .onChange(of: width) { _, _ in rebuild() }
        .onChange(of: text) { _, _ in rebuild() }
        .onChange(of: size) { _, _ in rebuild() }
        .onChange(of: replayKey) { _, _ in restart() }
        .onDisappear { runner?.cancel() }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(text)
    }

    @ViewBuilder
    private func drawing(_ plan: TextPlan) -> some View {
        if finished || !animate || reduceMotion {
            canvas(plan, elapsed: .infinity)
        } else {
            TimelineView(.animation(minimumInterval: 1.0 / plan.framesPerSecond)) { context in
                canvas(plan, elapsed: context.date.timeIntervalSince(startedAt) - delay)
            }
        }
    }

    private func canvas(_ plan: TextPlan, elapsed: TimeInterval) -> some View {
        let strokeWidth = lineWidth ?? max(1.1, size * 0.028)
        let style = StrokeStyle(lineWidth: strokeWidth, lineCap: .round, lineJoin: .round)
        return Canvas { context, _ in
            for g in plan.glyphs {
                let progress = min(1, max(0, (elapsed - g.delay) / max(0.001, g.duration)))
                if progress <= 0 { continue }

                guard let glyph = g.glyph else {
                    // No drawing for this character: the font steps in at the same spot.
                    context.draw(
                        Text(String(g.character)).font(.hand(size)).foregroundColor(color),
                        at: CGPoint(x: g.x, y: g.y),
                        anchor: .bottomLeading
                    )
                    continue
                }
                if glyph.totalLength <= 0 { continue }

                // The pen moves through the strokes in order, so earlier strokes
                // finish before later ones start: exactly like the letter was written.
                let inkSoFar = glyph.totalLength * CGFloat(progress)
                var accumulated: CGFloat = 0
                let transform = CGAffineTransform(translationX: g.x, y: g.y)
                for stroke in glyph.strokes {
                    if stroke.length <= 0 { continue }
                    if inkSoFar <= accumulated { break }
                    let strokeEnd = accumulated + stroke.length
                    let strokeProgress = inkSoFar >= strokeEnd ? 1 : (inkSoFar - accumulated) / stroke.length
                    accumulated = strokeEnd

                    let path = strokeProgress < 1 ? stroke.path.trimmedPath(from: 0, to: strokeProgress) : stroke.path
                    context.stroke(path.applying(transform), with: .color(color), style: style)
                }
            }
        }
        .frame(width: plan.width, height: plan.height)
    }

    private func rebuild() {
        guard width > 0 else { return }
        plan = TextPlan(
            text: text,
            width: width,
            size: size,
            speed: speed,
            align: align,
            lineHeight: lineHeight ?? size * 1.3
        )
        restart()
    }

    private func restart() {
        runner?.cancel()
        guard let plan else { return }
        if !animate || reduceMotion {
            finished = true
            onDone?()
            return
        }

        finished = false
        let start = Date()
        startedAt = start
        let wordStarts = plan.wordStartTimes
        let total = delay + plan.totalDuration
        let tick = haptics
        let done = onDone

        if tick { Haptics.prepare() }
        runner = Task { @MainActor in
            if tick {
                for wordStart in wordStarts {
                    let wait = delay + wordStart - Date().timeIntervalSince(start)
                    if wait > 0 { try? await Task.sleep(for: .seconds(wait)) }
                    if Task.isCancelled { return }
                    Haptics.tick()
                }
            }
            let remaining = total - Date().timeIntervalSince(start)
            if remaining > 0 { try? await Task.sleep(for: .seconds(remaining)) }
            if Task.isCancelled { return }
            finished = true
            if tick { Haptics.tap() }
            done?()
        }
    }
}
