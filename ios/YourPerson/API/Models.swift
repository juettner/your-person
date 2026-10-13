//
//  Models.swift
//
//  The JSON shapes the API speaks, as Swift types. Codable does what Jackson
//  does for you in Spring: field names map to keys, optionals to missing
//  keys. These mirror api/src exactly; change one, change the other.
//

import Foundation

/// A follow-up answer: a single string, or a list for multi-choice.
enum AnswerValue: Codable, Equatable {
    case text(String)
    case list([String])

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let list = try? container.decode([String].self) {
            self = .list(list)
        } else {
            self = .text(try container.decode(String.self))
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .text(let value): try container.encode(value)
        case .list(let value): try container.encode(value)
        }
    }

    var text: String {
        if case .text(let value) = self { return value }
        return ""
    }

    var list: [String] {
        switch self {
        case .list(let value): return value
        case .text(let value): return value.isEmpty ? [] : [value]
        }
    }
}

/// Answers keyed by interest id, then follow-up id.
typealias InterestDetails = [String: [String: AnswerValue]]

/// Where your person lives, as a place name. No coordinates are ever sent.
struct ProfileLocation: Codable, Equatable {
    var city: String
    var region: String? = nil
    var country: String? = nil
}

/// A birthday, an anniversary, the recital. Month and day; it recurs yearly.
struct ImportantDate: Codable, Equatable {
    var id: String? = nil
    var label: String
    var month: Int
    var day: Int
}

/// What the app sends to create or update a profile.
struct ProfileInput: Encodable {
    var name: String
    var interests: [String]
    var interestDetails: InterestDetails = [:]
    /// nil is sent as JSON null, which the API reads as "remove the location".
    var location: ProfileLocation? = nil
    var dates: [ImportantDate]? = nil
    var currentFocus: String? = nil

    enum CodingKeys: String, CodingKey {
        case name, interests, interestDetails, location, dates, currentFocus
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(name, forKey: .name)
        try container.encode(interests, forKey: .interests)
        try container.encode(interestDetails, forKey: .interestDetails)
        try container.encode(location, forKey: .location) // nil -> null on purpose
        try container.encodeIfPresent(dates, forKey: .dates)
        try container.encodeIfPresent(currentFocus, forKey: .currentFocus)
    }
}

struct Profile: Decodable, Identifiable {
    let id: String
    let name: String
    let interests: [String]
    let interestDetails: InterestDetails?
    let location: ProfileLocation?
    let dates: [ImportantDate]
    let currentFocus: String?
    let memoryCount: Int
    let hiddenCount: Int
    /// AI-written questions currently in this profile's deck (0 when the engine is off).
    let aiQuestionCount: Int

    /// The editable part, for pre-filling the form.
    var input: ProfileInput {
        ProfileInput(
            name: name,
            interests: interests,
            interestDetails: interestDetails ?? [:],
            location: location,
            dates: dates,
            currentFocus: currentFocus
        )
    }
}

/// A follow-up question for one interest ("Which sport?", "Which team?").
struct FollowUp: Decodable, Identifiable {
    enum Kind: String, Decodable {
        case choice, text
    }

    let id: String
    let prompt: String
    let kind: Kind
    let options: [String]?
    let multi: Bool?
    let placeholder: String?
}

struct Interest: Decodable, Identifiable {
    let id: String
    let label: String
    let followUps: [FollowUp]
}

/// What kind of card this is. Unknown kinds from a newer API read as questions.
enum PromptKind: String, Decodable {
    case question, appreciation, bid, dream, stress

    init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = PromptKind(rawValue: raw) ?? .question
    }
}

enum PromptMode: String {
    case day, evening
}

struct Prompt: Decodable, Identifiable {
    let id: String
    let text: String
    /// Label of the interest this question matched, or nil for a general one.
    let interest: String?
    /// "curated" from the hand-written bank, or "ai" from the engine.
    let source: String
    let kind: PromptKind
}

struct UpcomingDate: Decodable {
    let label: String
    let month: Int
    let day: Int
    let daysAway: Int
}

struct Nudges: Decodable {
    let reviewDetails: Bool
    let upcomingDates: [UpcomingDate]
}

struct PromptsResponse: Decodable {
    let askName: String
    let mode: String
    let questions: [Prompt]
    let nudges: Nudges
}

/// Something your person said, written down after a question.
struct Memory: Decodable, Identifiable {
    let id: String
    let questionId: String?
    let questionText: String?
    let text: String
    /// ISO 8601, as the API sends it.
    let createdAt: String

    var createdDate: Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.date(from: createdAt) ?? ISO8601DateFormatter().date(from: createdAt)
    }
}

struct GenerateResponse: Decodable {
    let enabled: Bool
    let generated: Int
}

struct RatingResponse: Decodable {
    let questionId: String
    let score: Int
    let hidden: Bool
}

/// +1 "good one, more like this"; -1 "nope, hide it".
enum Score: Int {
    case up = 1
    case down = -1
}
