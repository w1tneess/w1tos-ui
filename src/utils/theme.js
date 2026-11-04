import meta from '@/config/theme.generated'

const KEY = 'theme'
const known = id => meta.themes.some(t => t.id === id)

export const themes = meta.themes

export function currentTheme() {
	const id = document.documentElement.dataset.theme
	return known(id) ? id : meta.defaultTheme
}

// Per-browser choice: localStorage can be blocked (private mode), so fall back to the default quietly.
export function applySavedTheme() {
	let saved = null
	try {
		saved = localStorage.getItem(KEY)
	}
	catch (e) {}
	document.documentElement.dataset.theme = known(saved) ? saved : meta.defaultTheme
}

export function setTheme(id, bus) {
	if (!known(id)) return
	document.documentElement.dataset.theme = id
	try {
		localStorage.setItem(KEY, id)
	}
	catch (e) {}
	bus?.$emit('casaUI:themeChanged', id)
}

export function terminalTheme() {
	return meta.terminal[currentTheme()]
}

export function token(name) {
	return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim()
}
