//
//  ProfileFormView.swift
//
//  The partner questionnaire as a few pages of handwriting.
//
//    Page 1       name, where they live, interests, "lately"
//    Page 2..N    one per selected interest, with that interest's follow-ups
//                 ("Which sport?" -> "Which team?"), as served by the API
//
//  Used by onboarding (empty, must walk every page) and the profile screen
//  (pre-filled; can save from the first page or walk the pages to edit
//  details). Form state is plain @State; the pages share it, so one view.
//

import SwiftUI

struct ProfileFormView: View {
    enum Mode {
        case create, edit
    }

    /// How many follow-ups per interest the onboarding pages show.
    private static let onboardingFollowUps = 2
    /// How many interests show before "+n more".
    private static let visibleInterests = 12

    let mode: Mode
    let title: String
    let submitLabel: String
    /// Rendered above the first page only (back link, paper picker).
    var header: AnyView? = nil
    /// Rendered between the first page's fields and its actions (dates, reminders).
    var afterCard: AnyView? = nil
    /// Rendered under the actions on the first page only.
    var footer: AnyView? = nil
    /// Called with the cleaned-up values. Throw to show an error; return to finish.
    let onSubmit: (ProfileInput) async throws -> Void

    @EnvironmentObject private var theme: ThemeStore

    @State private var name: String
    @State private var interests: [String]
    @State private var currentFocus: String
    @State private var details: InterestDetails
    @State private var location: ProfileLocation?
    @State private var locating = false
    @State private var locationNote: String? = nil
    @State private var step = 0
    @State private var options: [Interest]? = nil
    @State private var loadError: String? = nil
    @State private var submitting = false
    @State private var submitError: String? = nil

    init(
        mode: Mode,
        title: String,
        submitLabel: String,
        initial: ProfileInput? = nil,
        header: AnyView? = nil,
        afterCard: AnyView? = nil,
        footer: AnyView? = nil,
        onSubmit: @escaping (ProfileInput) async throws -> Void
    ) {
        self.mode = mode
        self.title = title
        self.submitLabel = submitLabel
        self.header = header
        self.afterCard = afterCard
        self.footer = footer
        self.onSubmit = onSubmit
        _name = State(initialValue: initial?.name ?? "")
        _interests = State(initialValue: initial?.interests ?? [])
        _currentFocus = State(initialValue: initial?.currentFocus ?? "")
        _details = State(initialValue: initial?.interestDetails ?? [:])
        _location = State(initialValue: initial?.location)
    }

    /// The deeper pages: selected interests that have follow-ups, in taxonomy order.
    private var detailSteps: [Interest] {
        (options ?? []).filter { interests.contains($0.id) && !$0.followUps.isEmpty }
    }

    private var totalSteps: Int { 1 + detailSteps.count }
    private var isLast: Bool { step >= totalSteps - 1 }
    private var current: Interest? { step > 0 && step - 1 < detailSteps.count ? detailSteps[step - 1] : nil }
    private var canSubmit: Bool { !name.trimmingCharacters(in: .whitespaces).isEmpty && !submitting }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 24) {
                if step == 0, let header { header }

                // Page number and title. The title writes itself each time the page changes.
                VStack(alignment: .leading, spacing: 4) {
                    if totalSteps > 1 {
                        Hand("\(step + 1) of \(totalSteps)", size: TypeSize.small, tone: .muted)
                    }
                    HandwritingView(text: current.map { "\($0.label)." } ?? title, size: HandSize.title, color: theme.paper.ink)
                        .id(step)
                }

                if let current {
                    detailPage(current)
                } else {
                    firstPage
                }

                if step == 0, let afterCard { afterCard }

                if let submitError {
                    Hand(submitError, tone: .muted)
                }

                HStack(spacing: 24) {
                    // Edit mode, first page: save right away, or walk into the details.
                    if mode == .edit && step == 0 {
                        Word(submitLabel, disabled: !canSubmit, busy: submitting) { submit() }
                        if !detailSteps.isEmpty {
                            Word("Edit details", disabled: submitting) { step = 1 }
                        }
                    } else {
                        Word(isLast ? submitLabel : "Next", disabled: !canSubmit, busy: submitting) { next() }
                    }
                    if step > 0 {
                        Word("Back", variant: .quiet, disabled: submitting, size: TypeSize.small) { step = max(0, step - 1) }
                    }
                }
                .padding(.top, 8)

                if step == 0, let footer { footer }
            }
            .padding(.top, 8)
            .padding(.bottom, 48)
        }
        .scrollDismissesKeyboard(.interactively)
        .task {
            // Runs once when the form appears: load the taxonomy. Spring analogy: @PostConstruct.
            do {
                options = try await APIClient.shared.listInterests()
            } catch {
                loadError = describe(error)
            }
        }
    }

    // MARK: - Pages

    private var firstPage: some View {
        VStack(alignment: .leading, spacing: 24) {
            VStack(alignment: .leading, spacing: 4) {
                Hand("Name", size: TypeSize.small, tone: .muted)
                HandField(placeholder: "Sam", text: $name, capitalization: .words, autocorrect: false)
                    .accessibilityLabel("Their name")
            }

            VStack(alignment: .leading, spacing: 4) {
                Hand("Where they live", size: TypeSize.small, tone: .muted)
                HandField(
                    placeholder: "Minneapolis",
                    text: Binding(
                        get: { location?.city ?? "" },
                        // Typing replaces any detected region/country: we can't trust them for a new city.
                        set: { city in location = city.isEmpty ? nil : ProfileLocation(city: city) }
                    ),
                    capitalization: .words,
                    autocorrect: false
                )
                .accessibilityLabel("Where they live")
                HStack(spacing: 16) {
                    Word(locating ? "Finding you..." : "Use my location", variant: .quiet, disabled: locating, size: TypeSize.small) {
                        Task { await useMyLocation() }
                    }
                    if let region = location?.region {
                        Hand([region, location?.country].compactMap { $0 }.joined(separator: ", "), size: TypeSize.small, tone: .muted)
                    }
                }
                if let locationNote {
                    Hand(locationNote, size: TypeSize.small, tone: .muted)
                }
            }

            VStack(alignment: .leading, spacing: 4) {
                Hand("Into", size: TypeSize.small, tone: .muted)
                if let options {
                    WordChoice(
                        options: options.map { Choice(id: $0.id, label: $0.label) },
                        selected: $interests,
                        multi: true,
                        limit: Self.visibleInterests
                    )
                } else if let loadError {
                    Hand(loadError, tone: .muted)
                } else {
                    Thinking()
                }
            }

            VStack(alignment: .leading, spacing: 4) {
                Hand("Lately", size: TypeSize.small, tone: .muted)
                HandField(placeholder: "What's going on in their world right now?", text: $currentFocus, multiline: true)
                    .accessibilityLabel("What is going on in their world lately")
            }
        }
    }

    private func detailPage(_ interest: Interest) -> some View {
        // Keep onboarding short: the first two follow-ups now, the rest from the profile screen.
        let shown = mode == .create
            ? Interest(id: interest.id, label: interest.label, followUps: Array(interest.followUps.prefix(Self.onboardingFollowUps)))
            : interest
        let remaining = interest.followUps.count - shown.followUps.count
        return VStack(alignment: .leading, spacing: 24) {
            FollowUpFieldsView(
                interest: shown,
                answers: Binding(
                    get: { details[interest.id] ?? [:] },
                    set: { details[interest.id] = $0 }
                )
            )
            if remaining > 0 {
                Hand("\(remaining) more on the profile page, whenever.", size: TypeSize.small, tone: .muted)
            }
        }
    }

    // MARK: - Actions

    private func next() {
        if isLast { submit() } else { step += 1 }
    }

    private func submit() {
        submitting = true
        submitError = nil
        Task {
            do {
                let city = location?.city.trimmingCharacters(in: .whitespaces) ?? ""
                var cleaned = location
                cleaned?.city = city
                let focus = currentFocus.trimmingCharacters(in: .whitespacesAndNewlines)
                try await onSubmit(ProfileInput(
                    name: name.trimmingCharacters(in: .whitespaces),
                    interests: interests,
                    interestDetails: details,
                    // An empty city clears the location; the API treats null as "remove".
                    location: city.isEmpty ? nil : cleaned,
                    currentFocus: focus.isEmpty ? nil : focus
                ))
            } catch {
                submitError = describe(error)
            }
            submitting = false
        }
    }

    private func useMyLocation() async {
        locating = true
        locationNote = nil
        switch await LocationService().detect() {
        case .ok(let found):
            location = found
        case .denied:
            locationNote = "Location permission was turned down. You can write the city instead."
        case .unavailable:
            locationNote = "Couldn't work out a city here. Write it in instead."
        }
        locating = false
    }
}
