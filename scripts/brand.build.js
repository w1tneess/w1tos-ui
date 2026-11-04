// One source for every theme. Writes:
//   _brand.generated.scss   Sass vars for Bulma (compile-time). Values are "sentinels": the default theme's colours,
//                           nudged so each token has a unique hex that vue.config.js rewrites to var(--token).
//   _tokens.generated.scss  runtime CSS vars for every theme, selected by <html data-theme="…">
//   theme.generated.js      theme list, default theme and the xterm palette per theme
const fs = require('fs');
const path = require('path');

// Contrast (WCAG 2.x, checked with every change): text >= 4.5:1 on surface and raised, controls >= 3:1.
const themes = {
	'mono-dark': {
		label: 'Mono Dark', scheme: 'dark',
		bg: '#000000', surface: '#0A0A0A', raised: '#171717', inset: '#050505',
		line: '#262626', 'line-active': '#383838', 'line-strong': '#737373',
		text: '#F0F0F0', 'text-soft': '#D4D4D4', muted: '#A3A3A3',
		accent: '#FAFAFA', 'accent-hover': '#D4D4D4',
		burgundy: '#383838', maroon: '#1A1A1A',
		ok: '#4ADE80', warn: '#FBBF24', err: '#F87171', cool: '#8A8A8A',
		'line-glow': 'rgba(255, 255, 255, 0.05)', 'accent-tint': 'rgba(250, 250, 250, 0.08)',
		'accent-gradient': 'linear-gradient(90deg, #A3A3A3, #FAFAFA)',
		terminal: {
			background: '#000000', foreground: '#F0F0F0', cursor: '#FAFAFA', cursorAccent: '#000000',
			selection: 'rgba(250, 250, 250, 0.22)',
			black: '#171717', red: '#F87171', green: '#4ADE80', yellow: '#FBBF24',
			blue: '#93A8C8', magenta: '#C4A7D7', cyan: '#7DD3C8', white: '#D4D4D4',
			brightBlack: '#737373', brightRed: '#FCA5A5', brightGreen: '#86EFAC', brightYellow: '#FDE68A',
			brightBlue: '#BFCDE2', brightMagenta: '#DDC8EA', brightCyan: '#A7E8DF', brightWhite: '#FFFFFF',
		},
	},
	'mono-light': {
		label: 'Mono Light', scheme: 'light',
		bg: '#F5F5F5', surface: '#FFFFFF', raised: '#FFFFFF', inset: '#FAFAFA',
		line: '#E5E5E5', 'line-active': '#D4D4D4', 'line-strong': '#737373',
		text: '#0A0A0A', 'text-soft': '#262626', muted: '#525252',
		accent: '#171717', 'accent-hover': '#404040',
		burgundy: '#A3A3A3', maroon: '#E5E5E5',
		ok: '#15803D', warn: '#A16207', err: '#B91C1C', cool: '#525252',
		'line-glow': 'rgba(255, 255, 255, 0.8)', 'accent-tint': 'rgba(23, 23, 23, 0.06)',
		'accent-gradient': 'linear-gradient(90deg, #525252, #171717)',
		terminal: {
			background: '#FFFFFF', foreground: '#171717', cursor: '#171717', cursorAccent: '#FFFFFF',
			selection: 'rgba(23, 23, 23, 0.15)',
			black: '#171717', red: '#B91C1C', green: '#15803D', yellow: '#A16207',
			blue: '#1D4ED8', magenta: '#7E22CE', cyan: '#0E7490', white: '#525252',
			brightBlack: '#525252', brightRed: '#991B1B', brightGreen: '#166534', brightYellow: '#854D0E',
			brightBlue: '#1E40AF', brightMagenta: '#6B21A8', brightCyan: '#155E75', brightWhite: '#262626',
		},
	},
	'royal-charcoal': {
		label: 'Royal Charcoal', scheme: 'dark',
		bg: '#141518', surface: '#1E1F22', raised: '#2A2C30', inset: '#18191C',
		line: '#2F3135', 'line-active': '#47484C', 'line-strong': '#7D7F85',
		text: '#F0F0F0', 'text-soft': '#D4D4D6', muted: '#A3A4A8',
		accent: '#9DB4FF', 'accent-hover': '#C2D0FF',
		burgundy: '#4C4E51', maroon: '#26282C',
		ok: '#6EE7A0', warn: '#FCD34D', err: '#FB8A8A', cool: '#9AA3B5',
		'line-glow': 'rgba(255, 255, 255, 0.05)', 'accent-tint': 'rgba(157, 180, 255, 0.10)',
		'accent-gradient': 'linear-gradient(90deg, #7D7F85, #9DB4FF)',
		terminal: {
			background: '#141518', foreground: '#F0F0F0', cursor: '#9DB4FF', cursorAccent: '#141518',
			selection: 'rgba(157, 180, 255, 0.25)',
			black: '#1E1F22', red: '#FB8A8A', green: '#6EE7A0', yellow: '#FCD34D',
			blue: '#9DB4FF', magenta: '#D2A8FF', cyan: '#7DD3E0', white: '#D4D4D6',
			brightBlack: '#7D7F85', brightRed: '#FCB1B1', brightGreen: '#A7F3C9', brightYellow: '#FDE68A',
			brightBlue: '#C2D0FF', brightMagenta: '#E4CCFF', brightCyan: '#A9E5EE', brightWhite: '#FFFFFF',
		},
	},
};

const sassKeys = ['bg', 'surface', 'raised', 'inset', 'line', 'line-active', 'line-strong', 'text', 'text-soft', 'muted',
	'accent', 'accent-hover', 'burgundy', 'maroon', 'ok', 'warn', 'err', 'cool'];
const cssKeys = [...sassKeys, 'line-glow', 'accent-tint', 'accent-gradient'];

// Unique hex per token, close to the default theme so Bulma's derived shades still look right.
function sentinels(defaultTheme) {
	const used = new Set();
	const map = {};
	for (const key of sassKeys) {
		const [r, g, b] = [1, 3, 5].map((i) => parseInt(themes[defaultTheme][key].slice(i, i + 2), 16));
		for (let d = 1; ; d++) {
			const nb = b + d <= 255 ? b + d : b - d;
			const hex = '#' + [r, g, nb].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
			if (!used.has(hex)) { used.add(hex); map[key] = hex; break; }
		}
	}
	return map;
}

module.exports = { themes, sassKeys, sentinels };

if (require.main === module) {
	const brand = require('../src/config/brand.config.js');
	const def = brand.theme;
	if (!themes[def]) throw new Error(`Unknown theme "${def}". Choose one of: ${Object.keys(themes).join(', ')}`);
	const hdr = '// Generated by scripts/brand.build.js. Do not edit.\n';
	const dir = path.join(__dirname, '../src/assets/scss/common');
	const s = sentinels(def);

	// Sass: injected into every SCSS block, so variables only, no CSS output.
	fs.writeFileSync(path.join(dir, '_brand.generated.scss'),
		hdr + sassKeys.map((k) => `$ao-${k}: ${s[k]};`).join('\n') + '\n');

	const block = (t) => cssKeys.map((k) => `  --${k}: ${themes[t][k]};`).join('\n') + `\n  color-scheme: ${themes[t].scheme};`;
	const css = Object.keys(themes).map((t) =>
		`${t === def ? ':root, ' : ''}:root[data-theme="${t}"] {\n${block(t)}\n}`).join('\n\n');
	fs.writeFileSync(path.join(dir, '_tokens.generated.scss'), hdr + css + '\n');

	const meta = {
		defaultTheme: def,
		themes: Object.entries(themes).map(([id, t]) => ({ id, label: t.label, scheme: t.scheme })),
		terminal: Object.fromEntries(Object.entries(themes).map(([id, t]) => [id, t.terminal])),
	};
	fs.writeFileSync(path.join(__dirname, '../src/config/theme.generated.js'),
		hdr + `export default ${JSON.stringify(meta, null, 2)}\n`);
	console.log(`brand: ${Object.keys(themes).length} themes, default ${def}`);
}
