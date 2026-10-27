//
//  OnboardingView.swift
//
//  First run: a few pages of a journal, one question per page.
//
//    What do you call them?            a line to write their name on
//    Where do they live?               a line, and "use my location"
//    What are they into?               the list; tap to circle
//    Which cuisines do they reach for? one page per follow-up, two per interest
//    ...
//    What's going on in their world lately?
//
//  Turn the page (the fold, swipe left, or return on a one-line page) to go
//  on; swipe right or tap "back" to go back. The last page's fold starts
//  the journal.
//
//  The pages are computed from the answers so far: circling "cooking" on
//  the third page adds the cooking follow-ups after it. Form state is plain
//  @State; the pages share it, so one view.
//

import SwiftUI

struct OnboardingView: View {
    /// How many follow-ups per interest the first run asks. The rest wait on their page.
    private static let followUpsPerInterest = 2

    private enum Step: Equatable {
        case name
        case city
        case into
        case followUp(interestId: String, followUpId: String)
        case lately
    }

    @EnvironmentObject private var profiles: ProfileStore

    @State private var name = ""
    @State private var location: ProfileLocation? = nil
    @State private var locating = false
    @State private var locationNote: String? = nil
    @State private var interests: [String] = []
    @State private var details: InterestDetails = [:]
    @State private var lately = ""
    @State private var step = 0

    @State private var options: [Interest]? = nil
    @State private var loadError: String? = nil
    @State private var submitting = false
    @State private var submitError: String? = nil

    /// The pages, in order, given what has been answered so far.
    private var steps: [Step] {
        let followUps: [Step] = (options ?? [])
            .filter { interests.contains($0.id) }
            .flatMap { interest in
                interest.followUps.prefix(Self.followUpsPerInterest).map { Step.followUp(interestId: interest.id, followUpId: $0.id) }
            }
        return [.name, .city, .into] + followUps + [.lately]
    }

    private var current: Step {
        let all = steps
        return all[min(step, all.count - 1)]
    }

    private var isLast: Bool { step >= steps.count - 1 }

    /// The name is the one thing the journal cannot start without; every other page can be turned blank.
    private var canTurn: Bool {
        current != .name || !name.trimmingCharacters(in: .whitespaces).isEmpty
    }

    var body: some View {
        let onTurn: (() -> Void)? = canTurn ? turn : nil
        let onBack: (() -> Void)? = step > 0 ? back : nil
        return Page(
            onTurn: onTurn,
            turnLabel: isLast ? (submitting ? "Starting" : "Start") : "Turn the page",
            onTurnBack: onBack
        ) {
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    if step > 0 {
                        Word("back", tone: .grey, size: TypeSize.small) { back() }
                    }
                    Spacer()
                }
                .frame(minHeight: 24)

                switch current {
                case .name: namePage
                case .city: wherePage
                case .into: intoPage
                case .followUp(let interestId, let followUpId): followUpPage(interestId: interestId, followUpId: followUpId)
                case .lately: latelyPage
                }
            }
        }
        // Runs once when the view appears: load the taxonomy. Spring analogy: @PostConstruct.
        .task { await loadInterests() }
    }

    private func loadInterests() async {
        loadError = nil
        do {
            options = try await APIClient.shared.listInterests()
        } catch {
            loadError = describe(error)
        }
    }

    // MARK: - Pages

    private var namePage: some View {
        VStack(alignment: .leading, spacing: 0) {
            Spacer()
            Typewriter(text: "What do you call them?", answered: !name.trimmingCharacters(in: .whitespaces).isEmpty, size: TypeSize.heading)
            Line(placeholder: "Sam", text: $name, size: 24, capitalization: .words, autocorrect: false, submitLabel: .next) {
                if canTurn { turn() }
            }
            .accessibilityLabel("Their name")
            .padding(.top, 32)
            // The first time anyone meets the fold, say what it is for.
            if canTurn {
                Small("then turn the page: the corner, a swipe, or return.")
                    .padding(.top, 24)
            }
            Spacer()
        }
        .padding(.bottom, Margin.bottom)
    }

    private var wherePage: some View {
        VStack(alignment: .leading, spacing: 0) {
            Spacer()
            Typewriter(text: "Where do they live?", answered: !(location?.city ?? "").isEmpty, size: TypeSize.heading)
            Line(
                placeholder: "Minneapolis",
                text: Binding(
                    get: { location?.city ?? "" },
                    // Typing replaces any detected region/country: they cannot be trusted for a new city.
                    set: { city in location = city.isEmpty ? nil : ProfileLocation(city: city) }
                ),
                size: 24,
                capitalization: .words,
                autocorrect: false,
                submitLabel: .next,
                onSubmit: { turn() }
            )
            .accessibilityLabel("Where they live")
            .padding(.top, 32)
            Word(locating ? "finding you" : "use my location", tone: .grey, disabled: locating) {
                Task { await useMyLocation() }
            }
            .padding(.top, 8)
            if let region = location?.region {
                Small([region, location?.country].compactMap { $0 }.joined(separator: ", "))
            }
            if let locationNote {
                Small(locationNote)
            }
            Small("Only the city name is kept. It unlocks questions about around town.")
                .padding(.top, 24)
            Spacer()
        }
        .padding(.bottom, Margin.bottom)
    }

    private var intoPage: some View {
        VStack(alignment: .leading, spacing: 0) {
            Typewriter(text: "What are they into?", answered: !interests.isEmpty, size: TypeSize.heading)
                .padding(.top, 16)
            if let options {
                ScrollView(showsIndicators: false) {
                    Choices(
                        options: options.map { Choice(id: $0.id, label: $0.label.lowercased()) },
                        selected: $interests,
                        multi: true
                    )
                    .padding(.top, 16)
                    .padding(.bottom, Margin.bottom)
                }
            } else if let loadError {
                Small(loadError)
                    .padding(.top, 16)
                Word("try again", tone: .grey) { Task { await loadInterests() } }
            } else {
                Typewriter(text: "", haptics: false)
                    .padding(.top, 16)
            }
        }
    }

    private func followUpPage(interestId: String, followUpId: String) -> some View {
        let interest = options?.first { $0.id == interestId }
        let followUp = interest?.followUps.first { $0.id == followUpId }
        return VStack(alignment: .leading, spacing: 0) {
            if let interest, let followUp {
                Small(interest.label.lowercased())
                    .padding(.top, 16)
                Typewriter(text: followUp.prompt, answered: hasAnswer(details[interestId]?[followUpId]), size: TypeSize.heading)
                    .padding(.top, 4)
                ScrollView(showsIndicators: false) {
                    FollowUpAnswer(
                        followUp: followUp,
                        value: Binding(
                            get: { details[interestId]?[followUpId] },
                            set: { details[interestId, default: [:]][followUpId] = $0 }
                        )
                    )
                    .padding(.top, 16)
                    .padding(.bottom, Margin.bottom)
                }
            }
        }
    }

    private var latelyPage: some View {
        VStack(alignment: .leading, spacing: 0) {
            Spacer()
            Typewriter(text: "What's going on in their world lately?", answered: !lately.trimmingCharacters(in: .whitespaces).isEmpty, size: TypeSize.heading)
            Line(placeholder: "a big week at work, training for a 10k", text: $lately, multiline: true)
                .accessibilityLabel("What is going on in their world lately")
                .padding(.top, 32)
            if let submitError {
                Small(submitError)
                    .padding(.top, 8)
            }
            Small(submitting ? "Starting the journal." : "Turn the page to start.")
                .padding(.top, 24)
            Spacer()
        }
        .padding(.bottom, Margin.bottom)
    }

    // MARK: - Actions

    private func turn() {
        if isLast { submit() } else { step += 1 }
    }

    private func back() {
        step = max(0, step - 1)
    }

    private func submit() {
        guard !submitting else { return }
        submitting = true
        submitError = nil
        Task {
            do {
                let city = location?.city.trimmingCharacters(in: .whitespaces) ?? ""
                var cleaned = location
                cleaned?.city = city
                let focus = lately.trimmingCharacters(in: .whitespacesAndNewlines)
                let profile = try await APIClient.shared.createProfile(ProfileInput(
                    name: name.trimmingCharacters(in: .whitespaces),
                    interests: interests,
                    interestDetails: details,
                    location: city.isEmpty ? nil : cleaned,
                    currentFocus: focus.isEmpty ? nil : focus
                ))
                // Setting the id swaps the root to the entry (see RootView).
                profiles.profileId = profile.id
            } catch {
                submitError = describe(error)
                submitting = false
            }
        }
    }

    private func useMyLocation() async {
        locating = true
        locationNote = nil
        switch await LocationService().detect() {
        case .ok(let found):
            location = found
        case .denied:
            locationNote = "Location permission was turned down. Type the city instead."
        case .unavailable:
            locationNote = "Couldn't work out a city here. Type it in instead."
        }
        locating = false
    }

    private func hasAnswer(_ value: AnswerValue?) -> Bool {
        guard let value else { return false }
        switch value {
        case .list(let list): return !list.isEmpty
        case .text(let text): return !text.trimmingCharacters(in: .whitespaces).isEmpty
        }
    }
}
