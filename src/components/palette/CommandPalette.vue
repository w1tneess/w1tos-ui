<script>
import { fuzzyFilter } from '@/utils/fuzzy'

// Actions are sent over $EventBus; the components that already own each flow
// (AppCard, Home, AppSection, TopBar) carry them out, so nothing is duplicated here.
const GROUPS = ['go', 'apps', 'system']

export default {
	name: 'CommandPalette',
	data() {
		return {
			open: false,
			query: '',
			active: 0,
			confirming: null, // the system action waiting for its typed word
			lastFocus: null,
		}
	},
	computed: {
		items() {
			const apps = (this.$store.state.appList || [])
				.filter(app => app.app_type !== 'system')
				.map(app => ({
					id: `app-${app.name}`, group: 'apps', label: `open ${app.name}`,
					hint: app.status === 'running' ? '● running' : app.status === 'stopped' ? '✕ stopped' : `▲ ${app.status || 'unknown'}`,
					hintClass: app.status === 'running' ? 'ao-ok' : app.status === 'stopped' ? 'ao-err' : 'ao-warn', run: () => this.$EventBus.$emit('casaUI:paletteOpenApp', app.name),
				}))
			return [
				{ id: 'go-files', group: 'go', label: 'go files', run: () => this.$EventBus.$emit('casaUI:paletteGo', 'files') },
				{ id: 'go-store', group: 'go', label: 'go app store', run: () => this.$EventBus.$emit('casaUI:paletteGo', 'store') },
				{ id: 'go-settings', group: 'go', label: 'go settings', run: () => this.$EventBus.$emit('casaUI:paletteGo', 'settings') },
				...apps,
				{ id: 'sys-restart', group: 'system', label: 'restart', danger: true, word: 'restart', power: 'Restart' },
				{ id: 'sys-shutdown', group: 'system', label: 'shut down', danger: true, word: 'shutdown', power: 'Shutdown' },
			]
		},
		results() {
			return this.confirming ? [] : fuzzyFilter(this.query, this.items)
		},
		activeItem() {
			return this.results[this.active]
		},
		confirmed() {
			return this.confirming && this.query.trim().toLowerCase() === this.confirming.word
		},
	},
	watch: {
		query() {
			if (!this.confirming) this.active = 0
		},
	},
	mounted() {
		window.addEventListener('keydown', this.onGlobalKey)
		this.$EventBus.$on('casaUI:paletteToggle', this.toggle)
	},
	beforeDestroy() {
		window.removeEventListener('keydown', this.onGlobalKey)
		this.$EventBus.$off('casaUI:paletteToggle', this.toggle)
	},
	methods: {
		onGlobalKey(e) {
			if (!((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) return
			// The terminal needs its own keys (Ctrl+K kills the line in a shell)
			if (e.target?.closest?.('.xterm')) return
			e.preventDefault()
			this.toggle()
		},
		toggle() {
			this.open ? this.close() : this.show()
		},
		show() {
			this.lastFocus = document.activeElement
			this.open = true
			this.query = ''
			this.active = 0
			this.confirming = null
			this.$nextTick(() => this.$refs.input.focus())
		},
		close() {
			this.open = false
			this.confirming = null
			this.lastFocus?.focus?.()
		},
		move(step) {
			const n = this.results.length
			if (n) this.active = (this.active + step + n) % n
		},
		nextGroup(step) {
			const groups = GROUPS.filter(g => this.results.some(r => r.group === g))
			if (!groups.length) return
			const current = groups.indexOf(this.activeItem?.group)
			const target = groups[(current + step + groups.length) % groups.length]
			this.active = this.results.findIndex(r => r.group === target)
		},
		runActive() {
			if (this.confirming) {
				if (!this.confirmed) return
				this.$EventBus.$emit('casaUI:palettePower', this.confirming.power)
				this.close()
				return
			}
			const item = this.activeItem
			if (!item) return
			if (item.word) {
				this.confirming = item
				this.query = ''
				return
			}
			this.close()
			item.run()
		},
		onKey(e) {
			const keys = {
				ArrowDown: () => this.move(1),
				ArrowUp: () => this.move(-1),
				Enter: () => this.runActive(),
				Tab: () => this.nextGroup(e.shiftKey ? -1 : 1),
				Escape: () => (this.confirming ? (this.confirming = null, this.query = '') : this.close()),
			}
			if (!keys[e.key]) return
			e.preventDefault() // also keeps Tab inside the dialog
			keys[e.key]()
		},
		isFirstOfGroup(index) {
			return index === 0 || this.results[index - 1].group !== this.results[index].group
		},
	},
}
</script>

<template>
	<transition name="ao-palette">
		<div v-if="open" class="ao-palette" @mousedown.self="close">
			<div aria-label="Command palette" aria-modal="true" class="ao-palette__panel" role="dialog">
				<div class="ao-palette__prompt">
					<span aria-hidden="true">{{ confirming ? '!' : '>' }}</span>
					<input
						ref="input" v-model="query"
						:aria-activedescendant="activeItem ? `ao-pal-${activeItem.id}` : null"
						:aria-label="confirming ? `Type ${confirming.word} to confirm` : 'Search commands'"
						:placeholder="confirming ? `type “${confirming.word}” to confirm` : 'open an app, go somewhere, restart…'"
						aria-autocomplete="list" aria-controls="ao-pal-list" autocomplete="off" role="combobox"
						aria-expanded="true" spellcheck="false" @keydown="onKey"
					>
					<kbd>esc</kbd>
				</div>

				<p v-if="confirming" :class="confirmed ? 'ao-err' : 'ao-sub'" class="ao-palette__confirm" role="status">
					✕ {{ confirming.label }} the server<template v-if="confirmed"> · press enter</template>
				</p>

				<ul v-else id="ao-pal-list" class="ao-palette__list" role="listbox">
					<template v-for="(item, index) in results">
						<li v-if="isFirstOfGroup(index)" :key="`g-${item.group}`" class="ao-palette__group" role="presentation">
							{{ item.group }}
						</li>
						<li
							:id="`ao-pal-${item.id}`" :key="item.id" :aria-selected="index === active"
							:class="{ 'is-active': index === active, 'is-danger': item.danger }"
							class="ao-palette__item" role="option"
							@click="active = index; runActive()" @mousemove="active = index"
						>
							<span><template v-if="item.danger">✕ </template>{{ item.label }}</span>
							<span v-if="item.hint" :class="item.hintClass" class="ao-palette__hint">{{ item.hint }}</span>
						</li>
					</template>
					<li v-if="!results.length" class="ao-palette__empty" role="presentation">no match</li>
				</ul>

				<footer class="ao-palette__foot ao-sub">↑↓ move · enter run · tab group · esc close</footer>
			</div>
		</div>
	</transition>
</template>

<style lang="scss">
.ao-palette {
	position: fixed;
	inset: 0;
	z-index: 1000;
	background: color-mix(in srgb, var(--bg) 60%, transparent);
	padding: 15vh 16px 16px;

	&__panel {
		max-width: 640px;
		margin: 0 auto;
		background: var(--raised);
		border: 1px solid var(--line-active);
		border-radius: var(--r-md);
		box-shadow: inset 0 1px 0 var(--line-glow);
		font-family: $family-monospace;
		overflow: hidden;
	}

	&__prompt {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 14px;
		border-bottom: 1px solid var(--line);
		color: var(--accent);

		input {
			flex: 1;
			min-width: 0;
			background: transparent;
			border: 0;
			outline: 0;
			color: var(--text);
			font: inherit;
			font-size: 15px;
			caret-color: var(--accent);
			&::placeholder { color: var(--muted); }
		}

		kbd {
			font: inherit;
			font-size: 11px;
			color: var(--muted);
			border: 1px solid var(--line-strong);
			border-radius: var(--r-sm);
			padding: 0 6px;
		}
	}

	&__list {
		max-height: 50vh;
		overflow-y: auto;
		padding: 6px 0;
		margin: 0;
		list-style: none;
	}

	&__group {
		padding: 8px 14px 4px;
		font-size: 11px;
		color: var(--muted);
		letter-spacing: 0.04em;
	}

	&__item {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		min-height: 32px;
		align-items: center;
		padding: 6px 14px;
		color: var(--text-soft);
		cursor: pointer;
		border-left: 2px solid transparent;

		&.is-active { background: var(--accent-tint); border-left-color: var(--accent); color: var(--text); }
		// Danger is the text, never a red row
		&.is-danger { color: var(--err); }
	}

	&__hint { font-size: 11px; }

	&__empty, &__confirm { padding: 12px 14px; margin: 0; color: var(--muted); }
	&__foot { padding: 8px 14px; border-top: 1px solid var(--line); font-size: 11px; }
}

.ao-palette-enter-active, .ao-palette-leave-active {
	transition: opacity var(--t-panel) var(--ease-out);
	.ao-palette__panel { transition: transform var(--t-panel) var(--ease-out); }
}
.ao-palette-enter, .ao-palette-leave-to {
	opacity: 0;
	.ao-palette__panel { transform: scale(0.98); }
}
</style>
