# SignalK Attitude Converter

Converts between `navigation.attitude` (object) and individual values (`pitch`/`roll`/`yaw`).

## Installation
```bash
npm install --prefix ~/.signalk https://github.com/macjl/signalk-attitude-converter.git
```

Or from the SignalK plugin installer (Appstore) if published to npm.

Restart SignalK server.

## Configuration

Go to **Server → Plugin Config → Attitude Converter**.

Choose conversion direction:
- **Object → Values**: Splits `navigation.attitude` into separate `pitch`, `roll`, and `yaw` paths
- **Values → Object**: Combines individual `pitch`, `roll`, and `yaw` values into `navigation.attitude` object

The plugin preserves timestamps from the original data.

## Usage Examples

### Mode: Object → Values
Send this delta:
```json
{
  "path": "navigation.attitude",
  "value": {"pitch": 0.15, "roll": -0.08, "yaw": 1.57}
}
```
Results in three separate paths: `navigation.attitude.pitch`, `navigation.attitude.roll`, `navigation.attitude.yaw`

### Mode: Values → Object
Send individual values:
```json
{"path": "navigation.attitude.pitch", "value": 0.15}
{"path": "navigation.attitude.roll", "value": -0.08}
{"path": "navigation.attitude.yaw", "value": 1.57}
```
Results in: `navigation.attitude` object containing all three values

## License

MIT
