//
//  DatesEditorView.swift
//
//  The dates that matter: label, month, day. Written as a short list with a
//  line to add one more. The parent owns the list. Three lines and an "add"
//  word beat a date picker for "Mom's birthday, March 3".
//

import SwiftUI

struct DatesEditorView: View {
    @Binding var dates: [ImportantDate]

    @State private var label = ""
    @State private var month = ""
    @State private var day = ""

    private static let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    private var canAdd: Bool {
        guard let m = Int(month), let d = Int(day) else { return false }
        return !label.trimmingCharacters(in: .whitespaces).isEmpty && (1...12).contains(m) && (1...31).contains(d)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            ForEach(Array(dates.enumerated()), id: \.offset) { index, date in
                HStack(spacing: 16) {
                    (Text(date.label).font(.type(TypeSize.body)).foregroundColor(Ink.ink)
                        + Text("  \(Self.months[max(0, min(11, date.month - 1))]) \(date.day)").font(.type(TypeSize.small)).foregroundColor(Ink.grey))
                    Spacer()
                    Word("remove", tone: .grey, size: TypeSize.small) { dates.remove(at: index) }
                        .accessibilityLabel("Remove \(date.label)")
                }
            }

            HStack(alignment: .bottom, spacing: 16) {
                Line(placeholder: "Mom's birthday", text: $label)
                    .accessibilityLabel("Date label")
                Line(placeholder: "MM", text: $month, keyboard: .numberPad)
                    .frame(width: 56)
                    .accessibilityLabel("Month")
                Line(placeholder: "DD", text: $day, keyboard: .numberPad)
                    .frame(width: 56)
                    .accessibilityLabel("Day")
            }
            Word("add", tone: canAdd ? .ink : .faint, disabled: !canAdd) { add() }
                .accessibilityLabel("Add date")
        }
    }

    private func add() {
        guard canAdd, let m = Int(month), let d = Int(day) else { return }
        dates.append(ImportantDate(label: label.trimmingCharacters(in: .whitespaces), month: m, day: d))
        label = ""
        month = ""
        day = ""
    }
}
