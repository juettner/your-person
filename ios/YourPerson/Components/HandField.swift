//
//  HandField.swift
//
//  A line to write on. Handwritten font, a single rule underneath, no box.
//

import SwiftUI

struct HandField: View {
    let placeholder: String
    @Binding var text: String
    var size: CGFloat = TypeSize.body
    var multiline = false
    var keyboard: UIKeyboardType = .default
    var capitalization: TextInputAutocapitalization = .sentences
    var autocorrect = true
    var submitLabel: SubmitLabel = .done
    var onSubmit: (() -> Void)? = nil

    @EnvironmentObject private var theme: ThemeStore

    var body: some View {
        VStack(spacing: 2) {
            field
                .font(.hand(size))
                .foregroundStyle(theme.paper.ink)
                .tint(theme.paper.ink)
                .keyboardType(keyboard)
                .textInputAutocapitalization(capitalization)
                .autocorrectionDisabled(!autocorrect)
                .submitLabel(submitLabel)
                .onSubmit { onSubmit?() }
                .padding(.vertical, 6)
                .frame(minHeight: 44)
            Rectangle()
                .fill(theme.paper.ink)
                .frame(height: 1)
        }
    }

    @ViewBuilder
    private var field: some View {
        let prompt = Text(placeholder).font(.hand(size)).foregroundColor(theme.paper.muted)
        if multiline {
            TextField("", text: $text, prompt: prompt, axis: .vertical)
                .lineLimit(2...6)
        } else {
            TextField("", text: $text, prompt: prompt)
        }
    }
}
