# TaxiHub Changelog

## [Unreleased] - 2024

### Fixed
- **Subscriber vs Driver Distinction** - Corrected critical business logic issue where all community subscribers were being counted and displayed as "drivers"
  - Dashboard stats now show:
    - "Total Subscribers" - All members who joined the community (any role)
    - "Verified Drivers" - Only members with role="member" (authorized fleet drivers)
    - "Recent Signups" - Pending subscribers without driver role (role="")
  - Separated members view into two distinct views:
    - **Subscribers View** - Shows pending community members without driver status, includes "Promote to Driver" button
    - **Drivers View** - Shows verified drivers (role="member"), includes "Demote" and "Promote to Mod" buttons

### Changed
- Updated menu navigation:
  - Removed generic "Members" menu item
  - Added "Subscribers" menu item (👥 icon)
  - Added "Drivers" menu item (🚕 icon)
- Updated translations (en.json, es.json):
  - Changed "totalDrivers" to "totalSubscribers" and "verifiedDrivers"
  - Changed "activeAuthors" to "recentSignups"
  - Added comprehensive "subscribers" section with promoteToDriver action
  - Added comprehensive "drivers" section with demote and promoteToMod actions

### Technical Details
- Role mapping in Hive community:
  - `role=""` (empty) = Subscriber/Rider (can view and comment, cannot post)
  - `role="member"` = Verified Driver (can post shifts and rides)
  - `role="mod"` = Moderator
  - `role="admin"` = Administrator
  - `role="muted"` = Muted user
- Dashboard now filters `listSubscribers` API response by role value
- Added data table styling for subscriber and driver lists

## Purpose
This distinction is critical for fleet management where:
- Anyone can subscribe to the community (potential riders/clients)
- Only authorized drivers receive the "member" role to post shifts
- Admins need clear visibility into pending applications vs active drivers
