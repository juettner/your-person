//
//  FollowUpAnswer.swift
//
//  The answer to ONE follow-up question ("Which sport?", "Which team?"):
//  circled words for a `choice`, a line to write on for `text`. Nothing here
//  knows about sports or music; it only knows the two field kinds the API
//  serves.
//

import SwiftUI

struct FollowUpAnswer: View {
    let followUp: FollowUp
    @Binding var value: AnswerValue?

    var body: some View {
        if followUp.kind == .choice {
            let multi = followUp.multi ?? false
            Choices(
                options: (followUp.options ?? []).map { Choice(id: $0, label: $0) },
                selected: Binding(
                    get: { value?.list ?? [] },
                    set: { ids in value = multi ? .list(ids) : .text(ids.first ?? "") }
                ),
                multi: multi
            )
        } else {
            Line(
                placeholder: followUp.placeholder ?? "",
                text: Binding(
                    get: { value?.text ?? "" },
                    set: { value = .text($0) }
                )
            )
            .accessibilityLabel(followUp.prompt)
        }
    }
}
