//
//  TextPlan.swift
//
//  Lays text out on lines and decides when each letter gets written.
//
//  The output is a flat list of placed glyphs with a start time and a
//  duration. Rendering a frame is then trivial: for each glyph,
//  progress = (elapsed - delay) / duration, clamped to 0...1, and draw that
//  much of its strokes. One clock for the whole text, no per-letter timers.
//
//  Timing: a letter takes its path length divided by a pen speed in font
//  units per second, clamped so that a dot is not instant and a capital with
//  a flourish does not drag. Longer, loopier letters take longer, which is
//  what makes a script feel written rather than typed. A space is a short
//  pause, a line break a longer one. `speed` scales all of it: 1 is the
//  default pace, 2 is twice as slow.
//

import SwiftUI

struct PlannedGlyph: Identifiable {
    let id: Int
    let character: Character
    /// Pen origin in text points: x at the left of the advance box, y on the baseline.
    let x: CGFloat
    let y: CGFloat
    /// nil when the typeface has no drawing for this character; it is shown in the font instead.
    let glyph: ScaledGlyph?
    let width: CGFloat
    /// Which word this letter belongs to, counted from 0. Used for the haptic tick at each new word.
    let word: Int
    /// Seconds after the start of the animation when the pen reaches this letter.
    let delay: TimeInterval
    /// Seconds the pen spends on it.
    let duration: TimeInterval
}

struct TextPlan {
    enum Alignment {
        case leading, center
    }

    let glyphs: [PlannedGlyph]
    let width: CGFloat
    let height: CGFloat
    /// Seconds until the last stroke is finished.
    let totalDuration: TimeInterval
    let visibleCount: Int

    /// Frame rate: 30 fps for a few letters, easing to 15 fps for long text. Nobody can tell, and it saves battery.
    var framesPerSecond: Double {
        if visibleCount <= 5 { return 30 }
        if visibleCount >= 40 { return 15 }
        return 30 - (Double(visibleCount - 5) / 35) * 15
    }

    /// When the pen starts each word, in seconds from the start. One haptic tick per entry.
    var wordStartTimes: [TimeInterval] {
        var times: [TimeInterval] = []
        var lastWord = -1
        for g in glyphs where g.word != lastWord {
            lastWord = g.word
            times.append(g.delay)
        }
        return times
    }

    private static let unitsPerSecond: CGFloat = 18_000
    private static let minGlyphSeconds: TimeInterval = 0.03
    private static let maxGlyphSeconds: TimeInterval = 0.3
    private static let spaceSeconds: TimeInterval = 0.06
    private static let lineBreakSeconds: TimeInterval = 0.12

    private static func glyphSeconds(unitLength: CGFloat, speed: Double) -> TimeInterval {
        let unscaled = min(maxGlyphSeconds, max(minGlyphSeconds, TimeInterval(unitLength / unitsPerSecond)))
        return unscaled * speed
    }

    private struct Measured {
        let character: Character
        let glyph: ScaledGlyph?
        let width: CGFloat
        let duration: TimeInterval
    }

    @MainActor
    init(text: String, width maxWidth: CGFloat, size: CGFloat, speed: Double, align: Alignment, lineHeight: CGFloat, tracking: CGFloat = 0) {
        let typeface = Typeface.shared
        // Connected letters start a little left of their origin; give the first one room.
        let inset = size * 0.12
        let usable = max(1, maxWidth - inset * 2)
        let spaceWidth = CGFloat(typeface.spaceAdvance) * size / CGFloat(typeface.data.upm)

        var glyphs: [PlannedGlyph] = []
        var delay: TimeInterval = 0
        var visibleCount = 0
        var line = 0
        var x: CGFloat = 0
        var lineStart = 0
        var wordCount = 0

        func measure(_ character: Character) -> Measured {
            guard let glyph = typeface.scaled(character, size: size) else {
                return Measured(character: character, glyph: nil, width: size * 0.45, duration: Self.glyphSeconds(unitLength: 0, speed: speed))
            }
            return Measured(
                character: character,
                glyph: glyph,
                width: glyph.advance + tracking,
                duration: Self.glyphSeconds(unitLength: glyph.unitLength, speed: speed)
            )
        }

        func finishLine() {
            let lineWidth = x
            let shift = inset + (align == .center ? max(0, (usable - lineWidth) / 2) : 0)
            for i in lineStart..<glyphs.count {
                let g = glyphs[i]
                glyphs[i] = PlannedGlyph(id: g.id, character: g.character, x: g.x + shift, y: g.y, glyph: g.glyph, width: g.width, word: g.word, delay: g.delay, duration: g.duration)
            }
            lineStart = glyphs.count
            line += 1
            x = 0
        }

        let explicitLines = text.components(separatedBy: "\n")
        for (lineNumber, explicitLine) in explicitLines.enumerated() {
            let words = explicitLine.split(whereSeparator: { $0.isWhitespace }).map(String.init)
            for (wordNumber, word) in words.enumerated() {
                let measured = Array(word).map(measure)
                let wordWidth = measured.reduce(0) { $0 + $1.width }
                if x > 0 && x + wordWidth > usable { finishLine() }

                for m in measured {
                    // A single word longer than the line still has to go somewhere: break inside it.
                    if x > 0 && x + m.width > usable { finishLine() }
                    if m.glyph != nil { visibleCount += 1 }
                    glyphs.append(PlannedGlyph(
                        id: glyphs.count,
                        character: m.character,
                        x: x,
                        y: CGFloat(line) * lineHeight + size * Typeface.baselineEm,
                        glyph: m.glyph,
                        width: m.width,
                        word: wordCount,
                        delay: delay,
                        duration: m.duration
                    ))
                    delay += m.duration
                    x += m.width
                }
                wordCount += 1

                if wordNumber < words.count - 1 {
                    x += spaceWidth
                    delay += Self.spaceSeconds * speed
                }
            }
            if lineNumber < explicitLines.count - 1 {
                finishLine()
                delay += Self.lineBreakSeconds * speed
            }
        }
        finishLine()

        self.glyphs = glyphs
        self.width = maxWidth
        // `line` is now the number of lines. The last line needs its whole box, not just the pitch.
        self.height = CGFloat(max(0, line - 1)) * lineHeight + size * Typeface.boxEm
        self.totalDuration = delay
        self.visibleCount = visibleCount
    }
}
