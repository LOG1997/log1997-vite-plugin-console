# @log1997/vite-plugin-console

A Vite plugin that overrides `console.log` with **dynamic CSS styles** driven by type prefixes inside the log message (e.g. `[info]`, `[warn]`, `[error]`). Dev-mode only.

## Features

- 🏷️ **Type-prefix detection** — `console.log('[error] 服务器挂了')` automatically picks the error style
- 🎨 **Configurable palette** — map any type string (`info`, `warn`, `error`, `success`, `debug` …) to custom CSS
- 🔤 **Global prefix** — prepend a shared label (e.g. `🎯`) before every log line
- 🔒 **Dev-only** — runtime guard checks `NODE_ENV`; zero cost in production
- 📦 **ESM + CJS + `.d.ts`** — built with tsup

## Installation

```bash
pnpm add -D @log1997/vite-plugin-console
```

## Usage

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { vitePluginConsole } from '@log1997/vite-plugin-console';

export default defineConfig({
  plugins: [
    vitePluginConsole({
      prefix: '🎯',
      defaultStyles:
        'color: #333; background: #e0e0e0; padding: 2px 8px; border-radius: 4px;',
      typeStyles: {
        info:    'color: #0d6efd; background: #cfe2ff; font-weight: bold;',
        warn:    'color: #664d03; background: #fff3cd; border: 1px solid #ffc107;',
        error:   'color: #842029; background: #f8d7da; border: 1px solid #f5c2c7; font-weight: bold;',
        success: 'color: #0f5132; background: #d1e7dd;',
      },
    }),
  ],
});
```

Then in your app code:

```ts
console.log('[info] 用户已登录');       // → blue style
console.log('[warn] 磁盘空间不足');      // → yellow style
console.log('[error] 服务器无响应');     // → red style
console.log('普通日志');                 // → default gray style
```

## Configuration

| Option          | Type                                          | Default                                    | Description                                     |
| --------------- | --------------------------------------------- | ------------------------------------------ | ----------------------------------------------- |
| `enable`        | `boolean`                                     | `true`                                     | Enable / disable the plugin.                    |
| `prefix`        | `string`                                      | `''`                                       | Global label prepended to every log.            |
| `defaultStyles` | `string \| { prefix?, message? }`             | built-in blue palette                      | Fallback style when no type prefix matches.     |
| `typeStyles`    | `Record<string, string \| { prefix?, message? }>` | `{}`                                   | Per-type style overrides (case-sensitive).      |
| `logLevel`      | `'log' \| 'warn' \| 'error'`                   | `'log'`                                    | Which `console` method to override.             |

### Style object form

Both `defaultStyles` and each `typeStyles` entry accept an object with separate `prefix` and `message` keys to style the type tag and message body independently:

```ts
typeStyles: {
  error: {
    prefix:  'background: #dc3545; color: #fff; padding: 2px 6px; border-radius: 4px 0 0 4px;',
    message: 'background: #f8d7da; color: #842029; padding: 2px 6px; border-radius: 0 4px 4px 0;',
  },
}
```

### Built-in default style

When `defaultStyles` is omitted the plugin uses:

```
color: #00a8ff; font-weight: bold; background: #f0f8ff;
padding: 2px 6px; border-radius: 4px;
```

## How It Works

The plugin injects a small `<script>` at the end of `<body>` via Vite's `transformIndexHtml` hook. That script:

1. Saves a reference to the original `console.log`.
2. On each call, checks if the first argument starts with `[word] `.
3. Looks up the captured word in the `typeStyles` map.
   - **Found** → applies the mapped CSS.
   - **Not found** → falls back to `defaultStyles` (or the built-in palette).
4. If the first argument is not a string, the default style is used as well.
5. The global `prefix` (if set) is rendered *before* everything with its own style.

Everything runs **only when `NODE_ENV === 'development'`** and `enable` is `true`.

## License

MIT
