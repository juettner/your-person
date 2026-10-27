//
//  MemoriesView.swift
//
//  What they said: their answers, written down as quotes, newest first.
//

import SwiftUI

struct MemoriesView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var profiles: ProfileStore

    @State private var askName = ""
    @State private var memories: [Memory]? = nil
    @State private var error: String? = nil

    var body: some View {
        Page {
            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .firstTextBaseline) {
                    Word("back", tone: .grey, size: TypeSize.small) { dismiss() }
                    Spacer()
                    Small(askName.isEmpty ? " " : "\(askName) said")
                }
                .frame(minHeight: 24)

                if let error {
                    Small(error)
                        .padding(.top, 16)
                }

                if let memories, memories.isEmpty {
                    Spacer()
                    Typewriter(text: "Nothing yet. After a question, write down what they said. It makes the next questions better.", answered: true, size: TypeSize.heading)
                    Spacer()
                } else {
                    ScrollView(showsIndicators: false) {
                        LazyVStack(alignment: .leading, spacing: 32) {
                            ForEach(memories ?? []) { memory in
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("\u{201C}\(memory.text)\u{201D}")
                                        .font(.type(20))
                                        .foregroundStyle(Ink.ink)
                                        .lineSpacing(8)
                                        .fixedSize(horizontal: false, vertical: true)
                                    HStack(spacing: 16) {
                                        Small(memory.createdDate.map { $0.formatted(.dateTime.month(.abbreviated).day()) } ?? "")
                                        Word("remove", tone: .grey, size: TypeSize.small) { Task { await remove(memory) } }
                                            .accessibilityLabel("Remove: \(memory.text)")
                                    }
                                }
                            }
                        }
                        .padding(.top, 48)
                        .padding(.bottom, Margin.bottom)
                    }
                }
            }
        }
        .task { await load() }
    }

    private func load() async {
        guard let profileId = profiles.profileId else { return }
        do {
            async let list = APIClient.shared.listMemories(profileId)
            async let profile = APIClient.shared.getProfile(profileId)
            let (loaded, who) = try await (list, profile)
            memories = loaded
            askName = who.name
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
