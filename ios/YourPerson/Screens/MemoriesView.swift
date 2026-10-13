//
//  MemoriesView.swift
//
//  What they said. The list of memories written down after questions, newest first.
//

import SwiftUI

struct MemoriesView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var theme: ThemeStore
    @EnvironmentObject private var profiles: ProfileStore

    @State private var memories: [Memory]? = nil
    @State private var error: String? = nil

    var body: some View {
        Screen {
            VStack(alignment: .leading, spacing: 8) {
                Word("Back", size: TypeSize.small) { dismiss() }
                HandwritingView(text: "What they said.", size: HandSize.title, color: theme.paper.ink)
                    .padding(.bottom, 16)

                if let error {
                    Hand(error, tone: .muted)
                }

                if let memories {
                    if memories.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Hand("Nothing yet.")
                            Hand("After you ask a question, jot down what they said. It shows up here, and it makes the next questions better.", tone: .muted)
                        }
                    } else {
                        ScrollView(showsIndicators: false) {
                            LazyVStack(alignment: .leading, spacing: 0) {
                                ForEach(memories) { memory in
                                    VStack(alignment: .leading, spacing: 4) {
                                        if let question = memory.questionText {
                                            Hand(question, size: TypeSize.small, tone: .muted)
                                        }
                                        Hand(memory.text)
                                        HStack {
                                            Hand(memory.createdDate.map { $0.formatted(date: .numeric, time: .omitted) } ?? "", size: TypeSize.small, tone: .muted)
                                            Spacer()
                                            Word("Remove", variant: .quiet, size: TypeSize.small) { Task { await remove(memory) } }
                                        }
                                    }
                                    .padding(.vertical, 16)
                                    Rectangle()
                                        .fill(theme.paper.muted.opacity(0.3))
                                        .frame(height: 1)
                                }
                            }
                            .padding(.bottom, 32)
                        }
                    }
                } else {
                    Thinking()
                        .padding(.top, 32)
                }
            }
        }
        .task { await load() }
    }

    private func load() async {
        guard let profileId = profiles.profileId else { return }
        do {
            memories = try await APIClient.shared.listMemories(profileId)
        } catch {
            self.error = describe(error)
        }
    }

    private func remove(_ memory: Memory) async {
        guard let profileId = profiles.profileId else { return }
        memories?.removeAll { $0.id == memory.id } // optimistic
        do {
            try await APIClient.shared.deleteMemory(profileId, memoryId: memory.id)
        } catch {
            self.error = describe(error)
        }
    }
}
