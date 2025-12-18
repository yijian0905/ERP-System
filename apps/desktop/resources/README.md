# Application Icons

This folder should contain the application icons for distribution:

| File | Platform | Size | Format |
|------|----------|------|--------|
| `icon.png` | All (source) | 1024x1024 | PNG |
| `icon.ico` | Windows | Multi-size | ICO |
| `icon.icns` | macOS | Multi-size | ICNS |

## Generating Icons

Generate icons from a source PNG (1024x1024):

### Using electron-icon-maker (recommended):
```bash
npm install -g electron-icon-maker
electron-icon-maker --input=icon-source.png --output=./
```

### Manual generation:
- **Windows ICO**: Use online tools or ImageMagick
- **macOS ICNS**: Use `iconutil` on macOS

## For Development

During development, icons are optional. The app will use default Electron icons.

## Placeholder Usage

For testing without icons, the application will continue to work but may show default system icons.
