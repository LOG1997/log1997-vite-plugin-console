/**
 * Vite plugin: @log1997/vite-plugin-console
 *
 * Injects a client-side script that overrides `console.log` (or the configured
 * method) with **dynamic CSS styles** driven by optional type prefixes inside
 * the log message — e.g. `[info]`, `[warn]`, `[error]`.
 *
 * - No type prefix → default style (user-supplied or a built-in palette).
 * - Recognised type prefix → style from the `typeStyles` map.
 * - Optional global `prefix` is rendered *before* everything using the default
 *   style.
 */

import type { Plugin } from 'vite';

// ── Types ────────────────────────────────────────────────────────

/** A single CSS string, or an object with optional `prefix` / `message` keys. */
export type ConsoleStyles = string | { prefix?: string; message?: string };

export interface PluginOptions {
  /** Whether the plugin is active. Default: `true`. */
  enable?: boolean;

  /**
   * Global label prepended to every log message (e.g. `"🎯"`).
   * Rendered before any type tag, using the default style.
   */
  prefix?: string;

  /**
   * Fallback styles used when no type prefix is recognised (or when the first
   * argument is not a string).
   *
   * - **string**: same CSS for the prefix area and the message body.
   * - **object**: `{ prefix?, message? }` for independent styling.
   *
   * When omitted, a built-in blue palette is applied.
   */
  defaultStyles?: ConsoleStyles;

  /**
   * Per-type style overrides. Keys are matched case-sensitively against the
   * captured type string (e.g. `"info"`, `"warn"`, `"error"`).
   *
   * Each value is a `ConsoleStyles` — string for uniform styling, or
   * `{ prefix?, message? }` to style the type tag and message body
   * independently.
   */
  typeStyles?: Record<string, ConsoleStyles>;

  /** Which `console` method to override. Default: `'log'`. */
  logLevel?: 'log' | 'warn' | 'error';
}

// ── Built-in defaults ────────────────────────────────────────────

/** The style used when the user provides neither `defaultStyles` nor a matching `typeStyles` entry. */
const BUILTIN_DEFAULT_CSS =
  'color: #00a8ff; font-weight: bold; background: #f0f8ff; padding: 2px 6px; border-radius: 4px;';

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Normalise a `ConsoleStyles` value into a pair of CSS strings:
 * `[prefixStyle, messageStyle]`.
 */
function resolveStyle(raw?: ConsoleStyles): [string, string] {
  if (typeof raw === 'string') {
    const s = raw || '';
    return [s, s];
  }
  if (raw && typeof raw === 'object') {
    return [raw.prefix ?? '', raw.message ?? ''];
  }
  return ['', ''];
}

/**
 * Build a JSON-serialisable lookup so the client script can resolve
 * `type → [prefixStyle, messageStyle]` at runtime.
 */
function serialiseTypeStyles(
  raw: Record<string, ConsoleStyles> | undefined,
): Record<string, [string, string]> {
  const out: Record<string, [string, string]> = {};
  if (!raw) return out;
  for (const [key, val] of Object.entries(raw)) {
    out[key] = resolveStyle(val);
  }
  return out;
}

// ── Client script builder ────────────────────────────────────────

/**
 * Build the inline `<script>` tag injected at the end of `<body>`.
 */
function buildClientScript(opts: Required<PluginOptions>): string {
  const [defPrefixStyle, defMsgStyle] = resolveStyle(opts.defaultStyles);
  const typeStyleMap = serialiseTypeStyles(opts.typeStyles);

  // Escape backticks so the JavaScript template literal stays valid.
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`');

  // Serialise the type-styles map as a JS object literal for runtime use.
  const typeStylesLiteral = JSON.stringify(typeStyleMap);

  return `
<script>
(function() {
  if (!${opts.enable}) return;
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'development') return;

  var _method   = '${opts.logLevel}';
  var _original = console[_method];

  /* ---- configuration (serialised from plugin options) ---- */
  var _globalPrefix  = \`${esc(opts.prefix)}\`;
  var _hasGlobalPre  = _globalPrefix.length > 0;

  var _defPre  = \`${esc(defPrefixStyle)}\`;
  var _defMsg  = \`${esc(defMsgStyle)}\`;
  var _hasDef  = _defPre || _defMsg;   // user supplied defaultStyles?

  var _builtin = \`${esc(BUILTIN_DEFAULT_CSS)}\`;

  /** type → [tagStyle, msgStyle] */
  var _typeStyles = ${typeStylesLiteral};

  /* ---- helpers ---- */

  /** Return the style pair for a recognised type, or null. */
  function stylesForType(type) {
    return _typeStyles[type] || null;
  }

  /** Return [prefixStyle, messageStyle] for the default fallback. */
  function defaultStyles() {
    if (_hasDef) return [_defPre, _defMsg];
    return [_builtin, _builtin];
  }

  /**
   * Push a %c segment onto the format-parts / style-args arrays.
   * Skips the %c when the style string is empty (keeps output clean).
   */
  function pushStyled(fmtParts, styleArgs, text, style) {
    if (style) {
      fmtParts.push('%c' + text);
      styleArgs.push(style);
    } else {
      fmtParts.push(text);
    }
  }

  /* ---- override ---- */

  console[_method] = function() {
    var args = Array.prototype.slice.call(arguments);
    var firstIsStr = typeof args[0] === 'string';

    var type   = null;      // captured type string, e.g. "info"
    var body   = '';        // message text after the type tag
    var rest   = args;      // remaining arguments

    // 1. Try to extract a [type] prefix from the first argument
    if (firstIsStr) {
      var m = args[0].match(/^\\[(\\w+)\\]\\s*/);
      if (m) {
        type = m[1];
        body = args[0].slice(m[0].length);
        rest = args.slice(1);
      } else {
        body = args[0];
        rest = args.slice(1);
      }
    }

    // 2. Resolve effective style pair
    var eff = type ? stylesForType(type) : null;
    if (!eff) eff = defaultStyles();

    // 3. Build format string + style args
    var fmtParts   = [];
    var styleArgs  = [];

    // -- global prefix (always first, uses default prefix style) --
    if (_hasGlobalPre) {
      var globalPreStyle = defaultStyles()[0] || _builtin;
      pushStyled(fmtParts, styleArgs, _globalPrefix + ' ', globalPreStyle);
    }

    // -- type tag (when present) --
    if (type) {
      pushStyled(fmtParts, styleArgs, '[' + type + ']', eff[0] || _builtin);
    }

    // -- message body / placeholder --
    if (firstIsStr) {
      if (body) {
        pushStyled(fmtParts, styleArgs, body, eff[1]);
      }
    } else {
      // Non-string first arg: emit a styled empty placeholder, then
      // all original args follow unmodified.
      pushStyled(fmtParts, styleArgs, '', eff[1]);
    }

    _original.apply(console, [fmtParts.join('')].concat(styleArgs).concat(rest));
  };

  // Expose original method for debugging
  console['_original_' + _method] = _original;
})();
</script>`;
}

// ── Plugin factory ───────────────────────────────────────────────

/**
 * Create the Vite plugin instance.
 *
 * @example
 * ```ts
 * import { vitePluginConsole } from '@log1997/vite-plugin-console';
 *
 * export default defineConfig({
 *   plugins: [
 *     vitePluginConsole({
 *       prefix: '🎯',
 *       defaultStyles: 'color: #333; background: #e0e0e0;',
 *       typeStyles: {
 *         info: 'color: blue;',
 *         error: 'color: red; font-weight: bold;',
 *       },
 *     }),
 *   ],
 * });
 * ```
 */
export function vitePluginConsole(rawOpts: PluginOptions = {}): Plugin {
  const opts: Required<PluginOptions> = {
    enable:       rawOpts.enable        ?? true,
    prefix:       rawOpts.prefix        ?? '',
    defaultStyles: rawOpts.defaultStyles ?? BUILTIN_DEFAULT_CSS,
    typeStyles:   rawOpts.typeStyles    ?? {},
    logLevel:     rawOpts.logLevel      ?? 'log',
  };

  const clientScript = buildClientScript(opts);

  return {
    name: 'vite-plugin-console',

    transformIndexHtml(html) {
      return html.replace('</body>', clientScript + '\n</body>');
    },
  };
}

export default vitePluginConsole;
