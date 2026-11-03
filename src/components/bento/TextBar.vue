<script>
// Text meter: label [██████░░░░] 61%. Switches to warn + ▲ at the threshold.
export default {
	name: 'TextBar',
	props: {
		label: { type: String, default: '' },
		percent: { type: Number, default: 0 },
		warnAt: { type: Number, default: 80 },
		cells: { type: Number, default: 10 },
	},
	computed: {
		pct() {
			return Math.min(100, Math.max(0, Math.round(this.percent || 0)))
		},
		filled() {
			return Math.round(this.pct / 100 * this.cells)
		},
		warn() {
			return this.pct >= this.warnAt
		},
	},
}
</script>

<template>
	<div :aria-label="`${label} ${pct}%`" class="ao-bar" role="meter" :aria-valuenow="pct" aria-valuemin="0" aria-valuemax="100">
		<span v-if="label" class="ao-bar__lbl">{{ label }}</span><span aria-hidden="true">[<span
			:class="warn ? 'ao-warn' : 'ao-bar__f'">{{ '█'.repeat(filled) }}</span><span class="ao-bar__e">{{ '█'.repeat(cells - filled) }}</span>]</span>
		<span :class="{ 'ao-warn': warn }"> <template v-if="warn">▲ </template>{{ pct }}%</span>
		<span class="ao-sub"><slot /></span>
	</div>
</template>
