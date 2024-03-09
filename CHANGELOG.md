# Change Log

All notable changes to this project is documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [2.1.0]

### Added
- Allow users to specify the precision level for target and ambient temperatures, introducing variables `targetTemperaturePrecision` and `ambientTemperaturePrecision`. This enhancement offers greater control over temperature display precision.
- Added a class to the `lblPowerCircle` element to allow users to hide the power circle via custom CSS, providing more flexibility in module appearance.

### Deprecated
- Deprecated `roundTargetTemperature` and `roundAmbientTemperature` options in favor of the new precision variables.

These updates focus on enhancing customization and precision in temperature displays, responding to user feedback and requests.

## [2.0.0]

This release bring some breaking change. Here is a small list of noticable changes:
* Renaming "fanSpeed" to "power"
* Renaming "hvacState" to "state"
* Adding "Icon" field
* Fix the bug preventing field "power" to 0 to hide icon
* Fixing some typos errors


## [1.1.0]

Update js code to ES6. Correction of some small details.

## [1.0.0]

First public release.
