//
//  Line.swift
//
//  A line to write on: a text field with nothing but a rule underneath, the
//  way a journal page has lines. Used for a name, a city, what they said.
//

import SwiftUI

struct Line: View {
    let placeholder: String
    @Binding var text: String
    var size: CGFloat = TypeSize.body
    var multiline = false
    var keyboard: UIKeyboardType = .default
    var capitalization: TextInputAutocapitalization = .sentences
    var autocorrect = true
    var submitLabel: SubmitLabel = .done
    var onSubmit: (() -> Void)? = nil

    var body: some View {
        VStack(spacing: 2) {
            field
                .font(.type(size))
                .foregroundStyle(Ink.ink)
                .tint(Ink.ink)
                .keyboardType(keyboard)
                .textInputAutocapitalization(capitalization)
                .autocorrectionDisabled(!autocorrect)
                .submitLabel(submitLabel)
                .onSubmit { onSubmit?() }
                .padding(.vertical, 6)
                .frame(minHeight: 44)
            Rectangle()
                .fill(Ink.ink)
                .frame(height: 1)
        }
    }

    @ViewBuilder
    private var field: some View {
        let prompt = Text(placeholder).font(.type(size)).foregroundColor(Ink.faint)
        if multiline {
            TextField("", text: $text, prompt: prompt, axis: .vertical)
                .lineLimit(2...6)
        } else {
            TextField("", text: $text, prompt: prompt)
        }
    }
}
