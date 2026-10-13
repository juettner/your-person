//
//  FollowUpFieldsView.swift
//
//  The follow-up questions for ONE interest, rendered from the taxonomy the
//  API serves: words to pick for `choice`, a line to write on for `text`.
//  Nothing here knows about sports or music specifically; it only knows the
//  two field kinds.
//

import SwiftUI

struct FollowUpFieldsView: View {
    let interest: Interest
    @Binding var answers: [String: AnswerValue]

    var body: some View {
        ForEach(interest.followUps) { followUp in
            VStack(alignment: .leading, spacing: 4) {
                Hand(followUp.prompt, size: TypeSize.small, tone: .muted)
                if followUp.kind == .choice {
                    let multi = followUp.multi ?? false
                    WordChoice(
                        options: (followUp.options ?? []).map { Choice(id: $0, label: $0) },
                        selected: Binding(
                            get: { answers[followUp.id]?.list ?? [] },
                            set: { ids in answers[followUp.id] = multi ? .list(ids) : .text(ids.first ?? "") }
                        ),
                        multi: multi
                    )
                } else {
                    HandField(
                        placeholder: followUp.placeholder ?? "",
                        text: Binding(
                            get: { answers[followUp.id]?.text ?? "" },
                            set: { answers[followUp.id] = .text($0) }
                        )
                    )
                    .accessibilityLabel(followUp.prompt)
                }
            }
        }
    }
}
