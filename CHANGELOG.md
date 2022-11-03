# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [UNRELEASED] - YYYY-MM-DD

## Changed

- [#12](https://github.com/equinor/webviz-config-editor/pull/12) - Added a check if on Mac before running terminal command in order to prevent misleading error message on other OSes. Also switched from deprecated `uuidv4` to `uuid.v4`.
- [#9](https://github.com/equinor/webviz-config-editor/pull/9) - Changed executable name to `webviz-config-editor`.

### Fixed

- [#10](https://github.com/equinor/webviz-config-editor/pull/10) - Fixed: Build was automatically triggered when opening/editing an existing config file. Now it is only triggered when opening the `Play` view.
