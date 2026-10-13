//
//  Reminders.swift
//
//  The weekly nudge: one local notification, off by default. Scheduled on
//  the phone itself; no server, no push token.
//

import Foundation
import UserNotifications

struct ReminderSetting: Codable, Equatable {
    var enabled: Bool
    /// 1 = Sunday ... 7 = Saturday, as Calendar counts them.
    var weekday: Int
    var hour: Int

    static let `default` = ReminderSetting(enabled: false, weekday: 6, hour: 18) // Friday, 6pm
}

enum Reminders {
    private static let key = "your-person.reminder"
    private static let identifier = "weekly-nudge"

    static let weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    static func load() -> ReminderSetting {
        guard let data = UserDefaults.standard.data(forKey: key),
              let setting = try? JSONDecoder().decode(ReminderSetting.self, from: data)
        else { return .default }
        return setting
    }

    /// Saves the setting and (re)schedules or cancels the notification. Returns whether it is actually on.
    static func apply(_ setting: ReminderSetting, askName: String) async -> Bool {
        if let data = try? JSONEncoder().encode(setting) {
            UserDefaults.standard.set(data, forKey: key)
        }

        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [identifier])
        guard setting.enabled else { return false }

        let granted = (try? await center.requestAuthorization(options: [.alert, .sound])) ?? false
        guard granted else { return false }

        let content = UNMutableNotificationContent()
        content.title = "Ask \(askName) something"
        content.body = "Three cards are waiting. One good question is enough."

        var components = DateComponents()
        components.weekday = setting.weekday
        components.hour = setting.hour
        components.minute = 0
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)

        do {
            try await center.add(UNNotificationRequest(identifier: identifier, content: content, trigger: trigger))
            return true
        } catch {
            return false
        }
    }
}
