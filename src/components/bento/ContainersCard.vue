<script>
export default {
	name: 'ContainersCard',
	computed: {
		// System tiles (Files, App Store) are not containers
		containers() {
			return (this.$store.state.appList || []).filter(app => app.app_type !== 'system' && app.app_type !== 'LinkApp')
		},
		running() {
			return this.containers.filter(app => app.status === 'running')
		},
		stopped() {
			return this.containers.length - this.running.length
		},
	},
}
</script>

<template>
	<section class="ao-card ao-containers">
		<h2 class="ao-card__title">containers</h2>
		<p v-if="$store.state.appList === null" class="ao-sub" role="status">loading…</p>
		<div v-else class="ao-row">
			<span class="ao-big"><span :class="running.length ? 'ao-ok' : 'ao-sub'">●</span> {{ running.length }} <span class="ao-sub">running</span></span>
			<span v-if="stopped" class="ao-err ao-mono">✕ {{ stopped }} stopped</span>
		</div>
		<p v-if="$store.state.appList && running.length" class="ao-sub ao-one-line mt-2">
			{{ running.slice(0, 4).map(app => app.name).join(' · ') }}<template v-if="running.length > 4"> · +{{ running.length - 4 }}</template>
		</p>
	</section>
</template>
