//
//  ProfileView.swift
//
//  Edit the partner profile: the pages, dates that matter, the weekly nudge,
//  the paper, and the way to "What they said".
//

import SwiftUI

struct ProfileView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var theme: ThemeStore
    @EnvironmentObject private var profiles: ProfileStore

    @State private var profile: Profile? = nil
    @State private var error: String? = nil
    @State private var dates: [ImportantDate] = []
    @State private var reminder: ReminderSetting = Reminders.load()
    @State private var reminderNote: String? = nil
    @State private var aiNote: String? = nil
    @State private var generating = false
    @State private var showMemories = false

    var body: some View {
        Screen {
            if let error {
                VStack(alignment: .leading, spacing: 32) {
                    header
                    Hand(error, tone: .muted)
                }
            } else if let profile {
                ProfileFormView(
                    mode: .edit,
                    title: "Your person.",
                    submitLabel: "Save",
                    initial: profile.input,
                    header: AnyView(header),
                    afterCard: AnyView(afterCard),
                    footer: AnyView(footer(profile))
                ) { input in
                    var values = input
                    values.dates = dates
                    _ = try await APIClient.shared.updateProfile(profile.id, values)
                    dismiss()
                }
            } else {
                VStack(alignment: .leading, spacing: 32) {
                    header
                    Thinking()
                }
            }
        }
        .navigationDestination(isPresented: $showMemories) { MemoriesView() }
        .task { await load() }
    }

    // MARK: - Pieces

    private var header: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Word("Back", size: TypeSize.small) { dismiss() }
                Spacer()
                Word("What they said", size: TypeSize.small) { showMemories = true }
            }
            VStack(alignment: .leading, spacing: 8) {
                Hand("Paper", size: TypeSize.small, tone: .muted)
                WordChoice(
                    options: Paper.allCases.map { Choice(id: $0.rawValue, label: $0.name) },
                    selected: Binding(
                        get: { [theme.paper.rawValue] },
                        set: { ids in
                            if let first = ids.first, let paper = Paper(rawValue: first) { theme.paper = paper }
                        }
                    )
                )
            }
        }
    }

    private var afterCard: some View {
        VStack(alignment: .leading, spacing: 24) {
            VStack(alignment: .leading, spacing: 8) {
                Hand("Dates that matter", size: TypeSize.small, tone: .muted)
                DatesEditorView(dates: $dates)
            }

            VStack(alignment: .leading, spacing: 8) {
                Hand("Weekly nudge", size: TypeSize.small, tone: .muted)
                HStack(spacing: 16) {
                    Hand("Remind me once a week")
                    Spacer()
                    WordChoice(
                        options: [Choice(id: "on", label: "On"), Choice(id: "off", label: "Off")],
                        selected: Binding(
                            get: { [reminder.enabled ? "on" : "off"] },
                            set: { ids in
                                if let first = ids.first { Task { await toggleReminder(first == "on") } }
                            }
                        ),
                        size: TypeSize.small
                    )
                }
                Hand(reminderLine, size: TypeSize.small, tone: .muted)
                Word("Change the day", variant: .quiet, size: TypeSize.small) { Task { await cycleWeekday() } }
                if let reminderNote {
                    Hand(reminderNote, size: TypeSize.small, tone: .muted)
                }
            }
        }
    }

    private func footer(_ profile: Profile) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            if profile.hiddenCount > 0 {
                Hand("You've hidden \(profile.hiddenCount) question\(profile.hiddenCount == 1 ? "" : "s").", size: TypeSize.small, tone: .muted)
            }
            if profile.aiQuestionCount > 0 {
                Hand("\(profile.aiQuestionCount) question\(profile.aiQuestionCount == 1 ? "" : "s") written just for \(profile.name).", size: TypeSize.small, tone: .muted)
            }
            Word(generating ? "Writing..." : "Write new AI questions", disabled: generating, size: TypeSize.small) {
                Task { await refreshAI(profile) }
            }
            if let aiNote {
                Hand(aiNote, size: TypeSize.small, tone: .muted)
            }
            Word("Start over with a new profile", variant: .quiet, size: TypeSize.small) {
                dismiss()
                profiles.profileId = nil
            }
            // Credit where it is due.
            Hand("The hand is Allura, by Rob Leuschke, traced as pen strokes by Sheldon B. Michaels and Windell H. Oskay. SIL Open Font License.", size: TypeSize.small, tone: .muted)
                .padding(.top, 24)
        }
        .padding(.top, 16)
    }

    private var reminderLine: String {
        let hour12 = reminder.hour > 12 ? reminder.hour - 12 : reminder.hour
        let ampm = reminder.hour >= 12 ? "pm" : "am"
        let weekday = Reminders.weekdays[max(0, min(6, reminder.weekday - 1))]
        return "\(weekday)s at \(hour12)\(ampm). Off by default, on purpose."
    }

    // MARK: - Actions

    private func load() async {
        guard let profileId = profiles.profileId else { return }
        do {
            let loaded = try await APIClient.shared.getProfile(profileId)
            profile = loaded
            dates = loaded.dates
        } catch {
            self.error = describe(error)
        }
    }

    private func toggleReminder(_ enabled: Bool) async {
        var next = reminder
        next.enabled = enabled
        reminder = next
        let on = await Reminders.apply(next, askName: profile?.name ?? "them")
        reminderNote = enabled && !on ? "Could not schedule it. Reminders need notification permission in Settings." : nil
    }

    private func cycleWeekday() async {
        var next = reminder
        next.weekday = (reminder.weekday % 7) + 1
        reminder = next
        if next.enabled { _ = await Reminders.apply(next, askName: profile?.name ?? "them") }
    }

    /// Ask the server to write a fresh AI deck. Harmless when the engine is off.
    private func refreshAI(_ profile: Profile) async {
        generating = true
        aiNote = nil
        do {
            let result = try await APIClient.shared.generate(profile.id)
            aiNote = result.enabled
                ? "Wrote \(result.generated) new question\(result.generated == 1 ? "" : "s") for \(profile.name)."
                : "AI questions are switched off on this server."
            self.profile = try await APIClient.shared.getProfile(profile.id)
        } catch {
            aiNote = describe(error)
        }
        generating = false
    }
}
