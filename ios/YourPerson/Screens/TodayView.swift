//
//  TodayView.swift
//
//  Today: the heart of the app. One prompt at a time, written in front of you.
//
//    "Nope" hides it and moves on; "Good one" keeps it coming back; "Not now"
//    skips without judging it. After a question, "What did they say?" writes
//    a one-line memory. Day mode deals questions with the occasional
//    appreciation, bid or dream card; Evening mode deals the end-of-day
//    conversation.
//
//  State lives in this view. For an app this size that is the right amount
//  of architecture; a separate view model would be ceremony.
//

import SwiftUI

struct TodayView: View {
    private enum Status {
        case loading, ready, error
    }

    private static let batchSize = 3

    @EnvironmentObject private var theme: ThemeStore
    @EnvironmentObject private var profiles: ProfileStore

    @State private var status: Status = .loading
    @State private var error: String? = nil
    @State private var askName = ""
    @State private var mode: PromptMode = .day
    @State private var prompts: [Prompt] = []
    @State private var nudges: Nudges? = nil
    @State private var index = 0
    /// questionId -> the score given this session, so a chosen word stays circled.
    @State private var ratings: [String: Score] = [:]
    @State private var rating = false
    /// True once the current prompt has finished writing itself; the hint waits for it.
    @State private var written = false
    @State private var memoryText = ""
    @State private var savedMemoryFor: String? = nil
    @State private var savingMemory = false
    @State private var showProfile = false

    private var current: Prompt? {
        index < prompts.count ? prompts[index] : nil
    }

    private var finished: Bool {
        status == .ready && !prompts.isEmpty && index >= prompts.count
    }

    var body: some View {
        Screen {
            VStack(alignment: .leading, spacing: 0) {
                // Top: who we're asking, day or evening, and the way to the profile.
                HStack {
                    Hand(askName.isEmpty ? " " : "Ask \(askName).", size: TypeSize.small, tone: .muted)
                    Spacer()
                    Word("Profile", size: TypeSize.small) { showProfile = true }
                }
                .frame(minHeight: 44)

                WordChoice(
                    options: [Choice(id: "day", label: "Day"), Choice(id: "evening", label: "Evening")],
                    selected: Binding(
                        get: { [mode.rawValue] },
                        set: { ids in
                            if let first = ids.first, let next = PromptMode(rawValue: first) { switchMode(next) }
                        }
                    ),
                    size: TypeSize.small
                )
                .frame(minHeight: 40)

                // A gentle nudge from the server: a date coming up, or details worth a second look.
                if status == .ready, let nudge {
                    Word(nudge, variant: .quiet, size: TypeSize.small) { showProfile = true }
                }

                switch status {
                case .loading:
                    centered { Thinking() }
                case .error:
                    centered {
                        HandwritingView(text: "Hmm.", size: HandSize.title, color: theme.paper.ink)
                        Hand(error ?? "", tone: .muted)
                        Word("Try again") { Task { await loadBatch(mode) } }
                    }
                case .ready:
                    if prompts.isEmpty {
                        centered {
                            HandwritingView(text: "No cards left.", size: HandSize.title, color: theme.paper.ink)
                            Hand("Add a few more interests to the profile to unlock more.", tone: .muted)
                            Word("Edit profile") { showProfile = true }
                        }
                    } else if let current {
                        card(current)
                    } else {
                        centered {
                            HandwritingView(
                                text: "That's \(prompts.count).\n\(mode == .evening ? "Now go listen to \(askName)." : "Go talk to \(askName).")",
                                size: HandSize.title,
                                color: theme.paper.ink
                            )
                            Word("\(prompts.count) more") { Task { await loadBatch(mode) } }
                        }
                    }
                }
            }
        }
        .navigationDestination(isPresented: $showProfile) { ProfileView() }
        // Runs every time this screen is shown, including coming back from the
        // profile, so a renamed partner shows up immediately.
        .onAppear { Task { await focus() } }
    }

    // MARK: - Pieces

    private func centered<Content: View>(@ViewBuilder _ content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 24) {
            Spacer()
            content()
            Spacer()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    @ViewBuilder
    private func card(_ current: Prompt) -> some View {
        // The prompt, written in front of you. Long ones get a smaller pen.
        VStack(alignment: .leading, spacing: 16) {
            Spacer()
            Hand(kindLabel(current), size: TypeSize.small, tone: .muted)
            HandwritingView(
                text: current.text,
                size: current.text.count > 72 ? HandSize.body + 6 : HandSize.hero,
                color: theme.paper.ink,
                delay: 0.35,
                haptics: true
            ) {
                written = true
            }
            .id(current.id)
            .padding(.vertical, 4)
            Hand(hint(current), size: TypeSize.small, tone: .muted)
                .opacity(written ? 1 : 0)
                .animation(.easeIn(duration: 0.6), value: written)
            Spacer()
        }

        // "What did they say?" Only for cards that ask something.
        if current.kind != .bid && current.kind != .appreciation {
            HStack(alignment: .bottom, spacing: 16) {
                if savedMemoryFor == current.id {
                    Hand("Saved. It will shape the next cards.", size: TypeSize.small, tone: .muted)
                } else {
                    HandField(placeholder: "What did \(askName) say?", text: $memoryText, size: TypeSize.small) {
                        Task { await saveMemory(current) }
                    }
                    Word("Save", disabled: memoryText.trimmingCharacters(in: .whitespaces).isEmpty, busy: savingMemory, size: TypeSize.small) {
                        Task { await saveMemory(current) }
                    }
                }
            }
            .frame(minHeight: 48)
            .padding(.bottom, 16)
        }

        HStack {
            HStack(spacing: 24) {
                Word("Nope", variant: .toggle, selected: ratings[current.id] == .down, disabled: rating) {
                    Task { await rate(current, .down) }
                }
                .accessibilityLabel("Hide this question")
                Word("Good one", variant: .toggle, selected: ratings[current.id] == .up, disabled: rating) {
                    Task { await rate(current, .up) }
                }
                .accessibilityLabel("Good question")
            }
            Spacer()
            Word(index + 1 < prompts.count ? "Next" : "Done") { advance() }
        }
        HStack {
            Hand("\(index + 1) of \(prompts.count)", size: TypeSize.small, tone: .muted)
            Spacer()
            Word("Not now", variant: .quiet, size: TypeSize.small) { advance() }
                .accessibilityLabel("Skip this card for now")
        }
        .padding(.bottom, 8)
    }

    private var nudge: String? {
        if let upcoming = nudges?.upcomingDates.first {
            let when = upcoming.daysAway == 0 ? "today" : upcoming.daysAway == 1 ? "tomorrow" : "in \(upcoming.daysAway) days"
            return "\(upcoming.label) is \(when)."
        }
        if nudges?.reviewDetails == true {
            return "It's been a while. Still true? Give \(askName)'s page a once-over."
        }
        return nil
    }

    /// The small line above a card that says what to do with it.
    private func kindLabel(_ prompt: Prompt) -> String {
        switch prompt.kind {
        case .question: return prompt.interest ?? "Just because"
        case .appreciation: return "Say it out loud"
        case .bid: return "Today"
        case .dream: return "Go deeper"
        case .stress: return "Just listen"
        }
    }

    private func hint(_ prompt: Prompt) -> String {
        switch prompt.kind {
        case .appreciation: return "Not a question. Tell \(askName), in your own words."
        case .bid: return "One small thing. Good one if it landed."
        case .dream: return "A bigger one. No rush, and no fixing."
        case .stress: return "Listen, take their side, don't solve it."
        case .question: return prompt.source == "ai" ? "Written for \(askName). Rate it to teach the deck." : "Rate it so your deck gets better."
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
            ratings = [:]
            memoryText = ""
            savedMemoryFor = nil
            written = false
            status = .ready
        } catch {
            self.error = describe(error)
            status = .error
        }
    }

    private func advance() {
        index += 1
        memoryText = ""
        written = false
    }

    private func rate(_ prompt: Prompt, _ score: Score) async {
        guard let profileId = profiles.profileId, !rating else { return }
        rating = true
        ratings[prompt.id] = score // optimistic
        do {
            _ = try await APIClient.shared.rate(profileId, questionId: prompt.id, score: score)
            if score == .down { advance() } // "Nope" means "not this one"; move along without another tap.
        } catch {
            self.error = describe(error)
        }
        rating = false
    }

    private func saveMemory(_ prompt: Prompt) async {
        let text = memoryText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let profileId = profiles.profileId, !text.isEmpty else { return }
        savingMemory = true
        do {
            _ = try await APIClient.shared.addMemory(profileId, text: text, questionId: prompt.id)
            savedMemoryFor = prompt.id
            memoryText = ""
            Haptics.success()
        } catch {
            self.error = describe(error)
        }
        savingMemory = false
    }

    private func switchMode(_ next: PromptMode) {
        guard next != mode else { return }
        mode = next
        Task { await loadBatch(next) }
    }
}
