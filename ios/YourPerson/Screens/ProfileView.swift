//
//  ProfileView.swift
//
//  Their page: everything the journal knows about your person, on one long
//  page you can write on. Name, where they live, what they're into with
//  every follow-up, what's going on lately, dates that matter, the weekly
//  nudge, and the AI deck. "save" at the bottom; "start over" below it.
//

import SwiftUI

struct ProfileView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var profiles: ProfileStore

    @State private var profile: Profile? = nil
    @State private var options: [Interest] = []
    @State private var error: String? = nil

    @State private var name = ""
    @State private var location: ProfileLocation? = nil
    @State private var locating = false
    @State private var interests: [String] = []
    @State private var details: InterestDetails = [:]
    @State private var lately = ""
    @State private var dates: [ImportantDate] = []
    @State private var saving = false

    @State private var reminder: ReminderSetting = Reminders.load()
    @State private var reminderNote: String? = nil
    @State private var aiNote: String? = nil
    @State private var generating = false
    @State private var showMemories = false

    var body: some View {
        Page {
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Word("back", tone: .grey, size: TypeSize.small) { dismiss() }
                    Spacer()
                    Word("what they said", tone: .grey, size: TypeSize.small) { showMemories = true }
                }
                .frame(minHeight: 24)

                if let profile {
                    ScrollView(showsIndicators: false) {
                        page(profile)
                            .padding(.top, 24)
                            .padding(.bottom, Margin.bottom)
                    }
                    .scrollDismissesKeyboard(.interactively)
                } else {
                    Spacer()
                    if let error {
                        Typewriter(text: error, size: TypeSize.heading)
                    } else {
                        Typewriter(text: "", haptics: false)
                    }
                    Spacer()
                }
            }
        }
        .navigationDestination(isPresented: $showMemories) { MemoriesView() }
        .task { await load() }
    }

    // MARK: - The page

    private func page(_ profile: Profile) -> some View {
        let chosen = options.filter { interests.contains($0.id) && !$0.followUps.isEmpty }
        let hour12 = reminder.hour > 12 ? reminder.hour - 12 : reminder.hour
        let ampm = reminder.hour >= 12 ? "pm" : "am"
        let weekday = Reminders.weekdays[max(0, min(6, reminder.weekday - 1))]

        return VStack(alignment: .leading, spacing: 4) {
            Line(placeholder: "Sam", text: $name, size: TypeSize.heading, capitalization: .words, autocorrect: false)
                .accessibilityLabel("Their name")

            label("where they live")
            Line(
                placeholder: "Minneapolis",
                text: Binding(
                    get: { location?.city ?? "" },
                    set: { city in location = city.isEmpty ? nil : ProfileLocation(city: city) }
                ),
                capitalization: .words,
                autocorrect: false
            )
            .accessibilityLabel("Where they live")
            Word(locating ? "finding you" : "use my location", tone: .grey, disabled: locating, size: TypeSize.small) {
                Task { await useMyLocation() }
            }

            label("into")
            Choices(options: options.map { Choice(id: $0.id, label: $0.label.lowercased()) }, selected: $interests, multi: true)

            ForEach(chosen) { interest in
                label(interest.label.lowercased())
                ForEach(interest.followUps) { followUp in
                    VStack(alignment: .leading, spacing: 4) {
                        Small(followUp.prompt, tone: .muted)
                        FollowUpAnswer(
                            followUp: followUp,
                            value: Binding(
                                get: { details[interest.id]?[followUp.id] },
                                set: { details[interest.id, default: [:]][followUp.id] = $0 }
                            )
                        )
                    }
                    .padding(.top, 8)
                }
            }

            label("lately")
            Line(placeholder: "what's going on in their world", text: $lately, multiline: true)
                .accessibilityLabel("What is going on in their world lately")

            label("dates that matter")
            DatesEditorView(dates: $dates)

            label("weekly nudge")
            HStack(spacing: 24) {
                Word("off", tone: reminder.enabled ? .faint : .ink, marked: !reminder.enabled) {
                    if reminder.enabled { Task { await toggleReminder() } }
                }
                .accessibilityLabel("Weekly reminder off")
                Word("on", tone: reminder.enabled ? .ink : .faint, marked: reminder.enabled) {
                    if !reminder.enabled { Task { await toggleReminder() } }
                }
                .accessibilityLabel("Weekly reminder on")
                Word("\(weekday)s at \(hour12)\(ampm)", tone: .grey) { Task { await cycleWeekday() } }
                    .accessibilityLabel("Change the day")
            }
            if let reminderNote {
                Small(reminderNote)
            }

            label("questions written for \(profile.name)")
            Small(deckLine(profile), tone: .muted)
            Word(generating ? "writing" : "write new ones", tone: .grey, disabled: generating, size: TypeSize.small) {
                Task { await refreshAI(profile) }
            }
            .accessibilityLabel("Write new AI questions")
            if let aiNote {
                Small(aiNote)
            }

            if let error {
                Small(error)
                    .padding(.top, 16)
            }
            VStack(alignment: .leading, spacing: 8) {
                Word(saving ? "saving" : "save", disabled: saving || name.trimmingCharacters(in: .whitespaces).isEmpty, size: TypeSize.body) {
                    Task { await save(profile) }
                }
                .accessibilityLabel("Save")
                Word("start over", tone: .grey) {
                    dismiss()
                    profiles.profileId = nil
                }
                .accessibilityLabel("Start over with a new profile")
            }
            .padding(.top, 32)

            // Credit where it is due.
            Small("The type is Special Elite, by Astigmatic. Apache License 2.0.")
                .padding(.top, 32)
        }
    }

    private func label(_ text: String) -> some View {
        Small(text)
            .padding(.top, 32)
    }

    private func deckLine(_ profile: Profile) -> String {
        var parts: [String] = []
        if profile.aiQuestionCount > 0 { parts.append("\(profile.aiQuestionCount) in the deck.") }
        if profile.hiddenCount > 0 { parts.append("\(profile.hiddenCount) marked not for us.") }
        return parts.isEmpty ? "Nothing yet." : parts.joined(separator: " ")
    }

    // MARK: - Actions

    private func load() async {
        guard let profileId = profiles.profileId else { return }
        do {
            async let loaded = APIClient.shared.getProfile(profileId)
            async let taxonomy = APIClient.shared.listInterests()
            let (profile, interestsList) = try await (loaded, taxonomy)
            self.profile = profile
            options = interestsList
            name = profile.name
            location = profile.location
            interests = profile.interests
            details = profile.interestDetails ?? [:]
            lately = profile.currentFocus ?? ""
            dates = profile.dates
        } catch {
            self.error = describe(error)
        }
    }

    private func save(_ profile: Profile) async {
        guard !saving else { return }
        saving = true
        error = nil
        do {
            let city = location?.city.trimmingCharacters(in: .whitespaces) ?? ""
            var cleaned = location
            cleaned?.city = city
            let focus = lately.trimmingCharacters(in: .whitespacesAndNewlines)
            _ = try await APIClient.shared.updateProfile(profile.id, ProfileInput(
                name: name.trimmingCharacters(in: .whitespaces),
                interests: interests,
                interestDetails: details,
                location: city.isEmpty ? nil : cleaned,
                dates: dates,
                currentFocus: focus.isEmpty ? nil : focus
            ))
            dismiss()
        } catch {
            self.error = describe(error)
            saving = false
        }
    }

    private func useMyLocation() async {
        locating = true
        if case .ok(let found) = await LocationService().detect() {
            location = found
        }
        locating = false
    }

    private func toggleReminder() async {
        var next = reminder
        next.enabled.toggle()
        reminder = next
        let on = await Reminders.apply(next, askName: name.isEmpty ? "them" : name)
        reminderNote = next.enabled && !on ? "Could not schedule it. Reminders need notification permission in Settings." : nil
    }

    private func cycleWeekday() async {
        var next = reminder
        next.weekday = (reminder.weekday % 7) + 1
        reminder = next
        if next.enabled { _ = await Reminders.apply(next, askName: name.isEmpty ? "them" : name) }
    }

    /// Ask the server to write a fresh AI deck. Harmless when the engine is off.
    private func refreshAI(_ profile: Profile) async {
        generating = true
        aiNote = nil
        do {
            let result = try await APIClient.shared.generate(profile.id)
            aiNote = result.enabled
                ? "Wrote \(result.generated) new question\(result.generated == 1 ? "" : "s") for \(name)."
                : "AI questions are switched off on this server."
            self.profile = try await APIClient.shared.getProfile(profile.id)
        } catch {
            aiNote = describe(error)
        }
        generating = false
    }
}
