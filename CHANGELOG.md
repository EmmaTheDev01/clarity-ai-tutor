# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Low Light Mode**: A new theme specifically designed for users with eye problems, featuring an amber/sepia-tinted dark background and warm muted text to reduce blue light and harsh contrast.
- **Theme Persistence**: Theme preferences are now saved directly to the Supabase database under the user's profile (`theme_preference`), syncing automatically across devices.
- **Dark Mode Color Variables**: Implemented full `.dark` and `.low-light` mode CSS variable overrides including `--elevated`, `--card`, `--popover`, and all semantic tokens.

### Fixed
- **Dark Mode Dropdowns**: All header dropdown panels (Notifications, Cognitive Mode, User Menu) now use `bg-popover` instead of the hardcoded `bg-white`, correctly responding to dark/low-light themes.
- **Card Component**: `Card` now uses `bg-card` for proper visual separation in dark mode.
- **ADHD Chat Mode**: Fixed hardcoded `text-white` in ADHD bubble mode replaced with `text-primary-foreground`.
- **CSS Variant Scope**: Updated `@custom-variant dark` to match both the `.dark` root element and its descendants for correct theme inheritance.

### Changed
- **Default Theme**: Changed the default application theme from `system` to `light`.
