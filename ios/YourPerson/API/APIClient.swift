//
//  APIClient.swift
//
//  The only file that knows the API's URLs. Spring analogy: a RestTemplate
//  client in one place.
//
//  The base URL comes from Info.plist (`APIBaseURL`), which the build settings
//  fill in: `http://localhost:3000` for Debug, and whatever `API_BASE_URL`
//  says for Release. A phone cannot reach your laptop's localhost; set the
//  Debug value to your laptop's LAN address (System Settings > Wi-Fi) when
//  running on a device, or point it at a deployed API (docs/DEPLOY.md).
//

import Foundation

struct APIError: LocalizedError {
    let status: Int
    let message: String

    var errorDescription: String? { message }
}

enum AppConfig {
    static var apiBaseURL: URL {
        let raw = (Bundle.main.object(forInfoDictionaryKey: "APIBaseURL") as? String) ?? ""
        return URL(string: raw.isEmpty ? "http://localhost:3000" : raw) ?? URL(string: "http://localhost:3000")!
    }
}

final class APIClient {
    static let shared = APIClient()

    private let session = URLSession.shared
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    /// Builds the full URL by hand: `appendingPathComponent` would escape the `?` in a query string.
    private func url(_ path: String) -> URL {
        let base = AppConfig.apiBaseURL.absoluteString.hasSuffix("/")
            ? String(AppConfig.apiBaseURL.absoluteString.dropLast())
            : AppConfig.apiBaseURL.absoluteString
        return URL(string: base + "/api" + path) ?? AppConfig.apiBaseURL
    }

    private func request(_ method: String, _ path: String, body: (any Encodable)? = nil) async throws -> (Data, Int) {
        var request = URLRequest(url: url(path))
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let body {
            request.httpBody = try encoder.encode(body)
        }
        let (data, response) = try await session.data(for: request)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(status) else {
            // NestJS error bodies look like { statusCode, message: string | string[], error }.
            throw APIError(status: status, message: Self.errorMessage(in: data) ?? "Request failed (\(status))")
        }
        return (data, status)
    }

    private func send<T: Decodable>(_ method: String, _ path: String, body: (any Encodable)? = nil) async throws -> T {
        let (data, _) = try await request(method, path, body: body)
        return try decoder.decode(T.self, from: data)
    }

    private static func errorMessage(in data: Data) -> String? {
        struct Body: Decodable {
            let message: AnswerValue?
        }
        guard let body = try? JSONDecoder().decode(Body.self, from: data), let message = body.message else { return nil }
        switch message {
        case .text(let text): return text
        case .list(let parts): return parts.joined(separator: ". ")
        }
    }

    private func id(_ value: String) -> String {
        value.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? value
    }

    // MARK: - Endpoints

    func listInterests() async throws -> [Interest] {
        try await send("GET", "/interests")
    }

    func createProfile(_ input: ProfileInput) async throws -> Profile {
        try await send("POST", "/profiles", body: input)
    }

    func getProfile(_ profileId: String) async throws -> Profile {
        try await send("GET", "/profiles/\(id(profileId))")
    }

    func updateProfile(_ profileId: String, _ input: ProfileInput) async throws -> Profile {
        try await send("PATCH", "/profiles/\(id(profileId))", body: input)
    }

    func getPrompts(_ profileId: String, count: Int = 3, mode: PromptMode) async throws -> PromptsResponse {
        try await send("GET", "/profiles/\(id(profileId))/questions?count=\(count)&mode=\(mode.rawValue)")
    }

    func listMemories(_ profileId: String) async throws -> [Memory] {
        try await send("GET", "/profiles/\(id(profileId))/memories")
    }

    func addMemory(_ profileId: String, text: String, questionId: String?) async throws -> Memory {
        struct Body: Encodable {
            let text: String
            let questionId: String?
        }
        return try await send("POST", "/profiles/\(id(profileId))/memories", body: Body(text: text, questionId: questionId))
    }

    func deleteMemory(_ profileId: String, memoryId: String) async throws {
        _ = try await request("DELETE", "/profiles/\(id(profileId))/memories/\(id(memoryId))")
    }

    func rate(_ profileId: String, questionId: String, score: Score) async throws -> RatingResponse {
        struct Body: Encodable {
            let score: Int
        }
        return try await send("POST", "/profiles/\(id(profileId))/questions/\(id(questionId))/rating", body: Body(score: score.rawValue))
    }

    /// Ask the server to write a fresh AI deck now. Takes a few seconds when enabled.
    func generate(_ profileId: String) async throws -> GenerateResponse {
        try await send("POST", "/profiles/\(id(profileId))/questions/generate")
    }
}

/// Turns any thrown error into something we can show a person.
func describe(_ error: Error) -> String {
    if let apiError = error as? APIError {
        if apiError.status == 404 { return "We couldn't find that profile." }
        return apiError.message
    }
    if error is URLError {
        return "Can't reach the server at \(AppConfig.apiBaseURL.absoluteString). Is the API running?"
    }
    return "Something went wrong."
}
