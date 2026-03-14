# signalk-attitude-converter

SignalK plugin that converts between `navigation.attitude` (object) and individual `pitch`, `roll`, and `yaw` values.

## Conversion modes

**Object → Values** (`object-to-values`)

Subscribes to `navigation.attitude` (object) and republishes each component as individual paths:
- `navigation.attitude.pitch`
- `navigation.attitude.roll`
- `navigation.attitude.yaw`

**Values → Object** (`values-to-object`)

Subscribes to the three individual paths and republishes them as a `navigation.attitude` object.

## Configuration

| Option | Description | Default |
|--------|-------------|---------|
| Conversion Direction | `object-to-values` or `values-to-object` | `object-to-values` |
| Source filter | Only convert values from this source label. Leave empty to convert all sources. | *(all)* |

## Units

All values are in **radians**, as per the SignalK specification. The plugin declares `units: rad` metadata for the three individual paths at startup.

## Installation

```sh
npm install --prefix ~/.signalk signalk-attitude-converter
```

Restart SignalK after installation, then configure via **Server → Plugin Config → Attitude Converter**.

## Changelog

### 0.1.2
- Added optional source filter to limit conversion to a specific source label

### 0.1.1
- Added unit metadata (`rad`) for `navigation.attitude.pitch`, `.roll` and `.yaw` paths

### 0.1.0
- Initial release

## License

MIT — Jean-Laurent Girod
