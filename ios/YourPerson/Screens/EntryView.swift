//
//  EntryView.swift
//
//  The entry: the heart of the app. One question per page.
//
//    Tuesday, October 27 · 1 of 3                       evening   Sam
//
//    say it out loud                   (only on the pages that are not questions)
//    Is there a dish you've been wanting to try making? _
//
//                      keep        not for us
//                                                                [fold]
//
//  - The question types itself out. The underscore blinks until you answer.
//  - "keep" means more like this; "not for us" hides it for good. Either
//    one stays underlined, and the next page is a page turn away. Turning
//    the page without marking anything is "not now": no judgement.
//  - "what did they say?" opens a line to write down their answer.
//  - After three, the last page sends you off to go talk to them.
//  - "evening" switches to the end-of-day conversation: listen, don't fix.
//
//  State lives in this view. For an app this size that is the right amount
//  of architecture; a separate view model would be ceremony.
//

import SwiftUI

struct EntryView: View {
    private enum Status {
        case loading, ready, error
    }

    private static let batchSize = 3
    private static let countWords = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"]

    @EnvironmentObject private var profiles: ProfileStore

    @State private var status: Status = .loading
    @State private var error: String? = nil
    @State private var askName = ""
    @State private var mode: PromptMode = .day
    @State private var prompts: [Prompt] = []
    @State private var nudges: Nudges? = nil
    @State private var index = 0
    /// questionId -> the mark given this session, so the chosen word stays underlined.
    @State private var marks: [String: Score] = [:]
    @State private var marking = false
    @State private var memoryOpen = false
    @State private var memoryText = ""
    @State private var savedMemoryFor: String? = nil
    @State private var savingMemory = false
    @State private var showProfile = false
    @State private var showMemories = false
    @FocusState private var memoryFocused: Bool

    private var current: Prompt? {
        index < prompts.count ? prompts[index] : nil
    }

    private var finished: Bool {
        status == .ready && !prompts.isEmpty && index >= prompts.count
    }

    var body: some View {
        Group {
            switch status {
            case .loading:
                Page {
                    VStack(alignment: .leading, spacing: 0) {
                        topLine
                        Spacer()
                        Typewriter(text: "", haptics: false)
                        Spacer()
                    }
                }
            case .error:
                Page {
                    VStack(alignment: .leading, spacing: 0) {
                        topLine
                        Spacer()
                        Typewriter(text: error ?? "Something went wrong.", size: TypeSize.heading)
                        Word("try again", tone: .grey) { Task { await loadBatch(mode) } }
                            .padding(.top, 16)
                        Spacer()
                    }
                }
            case .ready:
                if prompts.isEmpty {
                    Page {
                        VStack(alignment: .leading, spacing: 0) {
                            topLine
                            Spacer()
                            Typewriter(text: "Nothing left to ask. Add a few more things \(askName) is into.", size: TypeSize.heading)
                            Word("their page", tone: .grey) { showProfile = true }
                                .padding(.top, 16)
                            Spacer()
                        }
                    }
                } else if let current, !finished {
                    entry(current)
                } else {
                    lastPage
                }
            }
        }
        .navigationDestination(isPresented: $showProfile) { ProfileView() }
        .navigationDestination(isPresented: $showMemories) { MemoriesView() }
        // Runs every time this screen is shown, including coming back from
        // their page, so a renamed person shows up immediately.
        .onAppear { Task { await focus() } }
    }

    // MARK: - Pages

    private var topLine: some View {
        HStack(alignment: .firstTextBaseline) {
            Small(current.map { _ in "\(Self.today) · \(index + 1) of \(prompts.count)" } ?? Self.today)
            Spacer()
            HStack(spacing: 16) {
                if status == .ready {
                    Word(mode == .day ? "evening" : "day", tone: .grey, size: TypeSize.small) { switchMode() }
                        .accessibilityLabel(mode == .day ? "Switch to evening questions" : "Switch to day questions")
                }
                Word(askName.isEmpty ? "them" : askName, tone: .grey, size: TypeSize.small) { showProfile = true }
                    .accessibilityLabel("Their page")
            }
        }
        .frame(minHeight: 24)
    }

    private func entry(_ current: Prompt) -> some View {
        let mark = marks[current.id]
        let answered = mark != nil
        let canWriteDown = current.kind != .bid && current.kind != .appreciation

        return Page(onTurn: { turn() }) {
            VStack(alignment: .leading, spacing: 0) {
                topLine
                Spacer()

                if let note = Self.kindNote(current.kind) {
                    Small(note)
                        .padding(.bottom, 8)
                }
                Typewriter(text: current.text, answered: answered)
                    .id(current.id)

                if canWriteDown {
                    if savedMemoryFor == current.id {
                        Small("written down.")
                            .padding(.top, 16)
                    } else if memoryOpen {
                        VStack(alignment: .leading, spacing: 4) {
                            Line(placeholder: "what \(askName) said", text: $memoryText) {
                                Task { await saveMemory(current) }
                            }
                            .focused($memoryFocused)
                            .accessibilityLabel("What did they say")
                            Word(savingMemory ? "saving" : "save", tone: .grey, disabled: savingMemory || memoryText.trimmingCharacters(in: .whitespaces).isEmpty) {
                                Task { await saveMemory(current) }
                            }
                        }
                        .padding(.top, 16)
                    } else {
                        Word("what did they say?", tone: .grey) {
                            memoryOpen = true
                            memoryFocused = true
                        }
                        .padding(.top, 16)
                    }
                }

                Spacer()

                HStack(spacing: 40) {
                    Spacer()
                    Word("keep", tone: mark == .down ? .faint : .ink, marked: mark == .up, disabled: marking) {
                        Task { await rate(current, .up) }
                    }
                    .accessibilityLabel("Keep this question")
                    Word("not for us", tone: mark == .up ? .faint : .ink, marked: mark == .down, disabled: marking) {
                        Task { await rate(current, .down) }
                    }
                    .accessibilityLabel("Not for us")
                    Spacer()
                }
                .padding(.bottom, Margin.bottom)
            }
        }
    }

    private var lastPage: some View {
        let count = Self.countWords.indices.contains(prompts.count - 1) ? Self.countWords[prompts.count - 1] : String(prompts.count)
        return Page(onTurn: { Task { await loadBatch(mode) } }, turnLabel: "\(count.capitalized) more") {
            VStack(alignment: .leading, spacing: 0) {
                topLine
                Spacer()
                Typewriter(
                    text: mode == .evening ? "That's \(count). Now go listen to \(askName)." : "That's \(count). Go talk to \(askName).",
                    answered: true
                )
                if let nudge {
                    Small(nudge)
                        .padding(.top, 16)
                }
                Spacer()
                HStack {
                    Spacer()
                    Word("what they said", tone: .grey) { showMemories = true }
                    Spacer()
                }
                .padding(.bottom, Margin.bottom)
            }
        }
    }

    private var nudge: String? {
        if let upcoming = nudges?.upcomingDates.first {
            let when = upcoming.daysAway == 0 ? "today" : upcoming.daysAway == 1 ? "tomorrow" : "in \(upcoming.daysAway) days"
            return "\(upcoming.label) is \(when)."
        }
        if nudges?.reviewDetails == true {
            return "It's been a while. Is \(askName)'s page still true?"
        }
        return nil
    }

    /// "Tuesday, October 27".
    private static var today: String {
        Date().formatted(.dateTime.weekday(.wide).month(.wide).day())
    }

    /// A small grey note above the pages that are not plain questions, so the asker knows whether to ask or to act.
    private static func kindNote(_ kind: PromptKind) -> String? {
        switch kind {
        case .question: return nil
        case .appreciation: return "say it out loud"
        case .bid: return "one small thing today"
        case .dream: return "a bigger one"
        case .stress: return "just listen"
        }
    }

    // MARK: - Actions

    private func focus() async {
        guard let profileId = profiles.profileId else { return }
        if prompts.isEmpty {
            await loadBatch(mode)
        } else if let profile = try? await APIClient.shared.getProfile(profileId) {
            askName = profile.name
        }
    }

    private func loadBatch(_ nextMode: PromptMode) async {
        guard let profileId = profiles.profileId else { return }
        status = .loading
        error = nil
        do {
            let response = try await APIClient.shared.getPrompts(profileId, count: Self.batchSize, mode: nextMode)
            askName = response.askName
            prompts = response.questions
            nudges = response.nudges
            index = 0
            marks = [:]
            memoryOpen = false
            memoryText = ""
            savedMemoryFor = nil
            status = .ready
        } catch {
            self.error = describe(error)
            status = .error
        }
    }

    private func turn() {
        index += 1
        memoryOpen = false
        memoryText = ""
    }

    private func rate(_ prompt: Prompt, _ score: Score) async {
        guard let profileId = profiles.profileId, !marking else { return }
        marking = true
        marks[prompt.id] = score // optimistic
        do {
            _ = try await APIClient.shared.rate(profileId, questionId: prompt.id, score: score)
        } catch {
            self.error = describe(error)
        }
        marking = false
    }

    private func saveMemory(_ prompt: Prompt) async {
        let text = memoryText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let profileId = profiles.profileId, !text.isEmpty else { return }
        savingMemory = true
        do {
            _ = try await APIClient.shared.addMemory(profileId, text: text, questionId: prompt.id)
            savedMemoryFor = prompt.id
            memoryText = ""
            memoryOpen = false
            Haptics.success()
        } catch {
            self.error = describe(error)
        }
        savingMemory = false
    }

    private func switchMode() {
        let next: PromptMode = mode == .day ? .evening : .day
        mode = next
        Task { await loadBatch(next) }
    }
}
