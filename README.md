# SignalK Attitude Converter

Converts between `navigation.attitude` (object) and individual values (`pitch`/`roll`/`yaw`).

## Installation
```bash
cd ~/.signalk/node_modules
git clone https://github.com/macjl/signalk-attitude-converter.git
```

Restart SignalK server.

## Configuration

Choose conversion direction:
- **Object → Values**: Splits `navigation.attitude` into separate paths
- **Values → Object**: Combines individual values into `navigation.attitude` object

## License

MIT
