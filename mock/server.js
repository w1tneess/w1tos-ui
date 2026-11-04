// Dev-only mock of the CasaOS API so the UI can be clicked through without a server.
// Run: node mock/server.js   then set .env.dev.local to VUE_APP_DEV_IP=127.0.0.1 / VUE_APP_DEV_PORT=8090
// Any login works. Unknown endpoints answer { success: 200, data: null } and are logged.
const http = require('http');

const PORT = 8090;
const ok = (data) => ({ success: 200, message: 'ok', data });
const storage = {}; // custom storage (widgets_config, app_order, system...) kept in memory

const user = { id: 1, username: 'w1t', role: 'admin', email: '', nickname: 'w1t', avatar: '', description: '' };
const now = () => Math.floor(Date.now() / 1000);
let netBase = 5e9;

function utilization() {
	netBase += 1.2e6 + Math.random() * 4e5;
	return {
		cpu: { percent: 35 + Math.round(Math.random() * 30), num: 8, temperature: 52, power: { timestamp: now(), value: 0 }, model: 'amd' },
		mem: { total: 16.6e9, used: 6.3e9, available: 10.3e9, free: 9e9, usedPercent: 38 },
		sys_disk: { size: 3.6e12, used: 1.6e12, avail: 2.0e12, health: true },
		sys_usb: [{ name: 'sdb', model: 'SanDisk Ultra 64G', size: 64e9, avail: 40e9, mount_point: '/media/usb' }],
		net: [{ name: 'eth0', bytesRecv: netBase, bytesSent: netBase / 4, time: now(), state: 'up' }],
	};
}

const apps = [
	['jellyfin', 'running'], ['immich', 'running'], ['nextcloud', 'running'], ['vaultwarden', 'running'],
	['home-assistant', 'running'], ['syncthing', 'running'], ['pihole', 'stopped'], ['qbittorrent', 'running'],
	['portainer', 'running'], ['uptime-kuma', 'running'],
].map(([name, status], i) => ({
	name, status, app_type: 'v2app', store_app_id: name, title: { en_us: name },
	icon: `https://cdn.jsdelivr.net/gh/IceWhaleTech/CasaOS-AppStore@main/Apps/${name.replace(/(^|-)\w/g, (m) => m.toUpperCase()).replace(/-/g, '')}/icon.png`,
	hostname: '', port: String(8100 + i), scheme: 'http', index: '/', image: `${name}:latest`, is_uncontrolled: false,
}));

const folder = (path) => {
	const day = new Date().toISOString();
	const dirs = ['Media', 'Documents', 'Downloads', 'Backup', 'AppData'];
	const files = [['notes.md', 2400], ['photo.jpg', 3.2e6], ['movie.mkv', 4.1e9], ['config.yaml', 900]];
	return [
		...dirs.map((name) => ({ name, path: `${path}/${name}`, is_dir: true, size: 0, date: day, write: true, extensions: null })),
		...files.map(([name, size]) => ({ name, path: `${path}/${name}`, is_dir: false, size, date: day, write: true, extensions: null })),
	];
};


// App Store catalogue: real CasaOS-AppStore entries (icons/screenshots from that repo's CDN)
const CDN = 'https://cdn.jsdelivr.net/gh/IceWhaleTech/CasaOS-AppStore@main/Apps';
const catalogue = [
	['jellyfin', 'Jellyfin', 'Media', 'The free software media system', 'Jellyfin', true],
	['immich', 'Immich', 'Gallery', 'Self-hosted photo and video backup', 'Immich', true],
	['nextcloud', 'Nextcloud', 'Cloud', 'Your files, everywhere', 'Nextcloud', true],
	['vaultwarden', 'Vaultwarden', 'Utilities', 'Bitwarden-compatible password server', 'Vaultwarden', false],
	['home-assistant', 'Home Assistant', 'Home Automation', 'Open-source home automation', 'HomeAssistant', true],
	['syncthing', 'Syncthing', 'Backup', 'Continuous file synchronisation', 'Syncthing', false],
	['pihole', 'Pi-hole', 'Network', 'Network-wide ad blocking', 'Pi-hole', false],
	['qbittorrent', 'qBittorrent', 'Downloader', 'Open-source BitTorrent client', 'qBittorrent', false],
	['portainer', 'Portainer', 'Developer', 'Container management UI', 'Portainer', false],
	['uptime-kuma', 'Uptime Kuma', 'Utilities', 'Self-hosted monitoring tool', 'UptimeKuma', false],
	['navidrome', 'Navidrome', 'Media', 'Modern music server and streamer', 'Navidrome', false],
	['audiobookshelf', 'Audiobookshelf', 'Media', 'Audiobook and podcast server', 'Audiobookshelf', false],
].map(([id, title, category, tagline, dir, recommend]) => ({
	id, recommend,
	info: {
		title: { en_us: title }, tagline: { en_us: tagline }, category, author: 'CasaOS Team', developer: title,
		description: { en_us: `${title}: ${tagline.toLowerCase()}. (mock description)` },
		icon: `${CDN}/${dir}/icon.png`, thumbnail: `${CDN}/${dir}/thumbnail.png`,
		screenshot_link: [1, 2, 3].map((n) => `${CDN}/${dir}/screenshot-${n}.png`),
		architectures: ['amd64', 'arm64'], main: id, port_map: '8096', scheme: 'http', index: '/',
		tips: {},
	},
}));
const installedIds = ['jellyfin', 'immich', 'nextcloud', 'vaultwarden', 'home-assistant', 'syncthing', 'pihole', 'qbittorrent', 'portainer', 'uptime-kuma'];
const storeList = (q) => {
	const cat = q.get('category'); const rec = q.get('recommend') === 'true';
	const items = catalogue.filter((a) => (!cat || a.info.category === cat) && (!rec || a.recommend));
	return { list: Object.fromEntries(items.map((a) => [a.id, a.info])), installed: installedIds, community: [], recommend: [] };
};
const categories = () => {
	const counts = {};
	catalogue.forEach((a) => { counts[a.info.category] = (counts[a.info.category] || 0) + 1; });
	return [{ name: 'All', font: 'apps', count: catalogue.length, description: '' },
		...Object.entries(counts).map(([name, count]) => ({ name, font: 'apps', count, description: '' }))];
};
const composeOf = (id) => ({
	name: id,
	services: { [id]: { image: `mock/${id}:latest`, deploy: { resources: { reservations: { memory: '268435456' } } }, ports: [{ target: 8096, published: '8096', protocol: 'tcp' }] } },
	'x-casaos': { main: id, title: { en_us: id }, architectures: ['amd64', 'arm64'], index: '/', port_map: '8096', scheme: 'http' },
});
const composeYaml = (id) => `name: ${id}\nservices:\n  ${id}:\n    image: mock/${id}:latest\n    ports:\n      - target: 8096\n        published: "8096"\n        protocol: tcp\nx-casaos:\n  main: ${id}\n  architectures: [amd64, arm64]\n  index: /\n  port_map: "8096"\n  scheme: http\n  title:\n    en_us: ${id}\n`;

const routes = {
	'GET /users/status': () => ok({ initialized: true, key: '' }),
	'POST /users/login': () => ok({ token: { access_token: 'mock', refresh_token: 'mock', expires_at: now() + 86400 }, user }),
	'POST /users/refresh': () => ok({ access_token: 'mock', refresh_token: 'mock', expires_at: now() + 86400 }),
	'GET /users/current': () => ok(user),
	'GET /sys/version': () => ok({ current_version: '0.4.15', need_update: false, version: { change_log: '', version: '0.4.15' } }),
	'GET /sys/utilization': () => ok(utilization()),
	'GET /sys/hardware': () => ok({ drive_model: 'mock', arch: 'amd64', device_model: 'Mock NAS' }),
	'GET /sys/hardware/info': () => ok({ drive_model: 'mock', arch: 'amd64', device_model: 'Mock NAS' }),
	'GET /sys/port': () => ok('8080'),
	'GET /gateway/port': () => ok('8080'),
	'GET /usb/usb-auto-mount': () => ok({ state: 'off' }),
	'GET /sys/usb-auto-mount': () => ok({ state: 'off' }),
	'GET /v2/app_management/web/appgrid': () => ok(apps),
	'GET /v2/casaos/health/ports': () => ok({ tcp: [], udp: [] }),
	'GET /v2/app_management/apps': (url) => ok(storeList(url.searchParams)),
	'GET /v2/app_management/categories': () => ok(categories()),
	'POST /v2/app_management/compose': () => ok('mock: install accepted (no container is created)'),
	'GET /v2/app_management/appstore': () => ok([]),
	'GET /disks': () => ok([]),
	'GET /container/usage': () => ok([]),
	'GET /container/networks': () => ok([{ id: 'n1', name: 'bridge', driver: 'bridge' }, { id: 'n2', name: 'host', driver: 'host' }, { id: 'n3', name: 'macvlan0', driver: 'macvlan' }]),
	'GET /v2/users/events': () => [], // the UI reads this one as a bare array
	'GET /storage': () => ok([]),
	'GET /cloud': () => ok([]),
	'PUT /sys/state/restart': () => ok('mock: restart requested (nothing happens)'),
	'PUT /sys/state/off': () => ok('mock: shutdown requested (nothing happens)'),
	'GET /driver': () => ok([]),
	'GET /samba/connections': () => ok([]),
	'GET /samba/shares': () => ok([]),
	'GET /v2/local_storage/merge': () => ok([{ source_volume_uuids: [] }]),
	'GET /folder': (url) => ok({ content: folder(url.searchParams.get('path') || '/DATA'), total: 0, index: 1, size: 100 }),
};

http.createServer((req, res) => {
	const url = new URL(req.url, 'http://x');
	const path = url.pathname.replace(/^\/v1(?=\/)/, '');
	let body = '';
	req.on('data', (c) => { body += c; });
	req.on('end', () => {
		const key = `${req.method} ${path}`;
		let out;
		const custom = path.match(/^\/users\/current\/custom\/([\w-]+)$/);
		const app = path.match(/^\/v2\/app_management\/apps\/([\w-]+)(\/compose)?$/);
		if (app && req.method === 'GET' && !routes[key]) {
			const id = app[1];
			if (app[2] && /yaml/.test(req.headers.accept || '')) { res.writeHead(200, { 'Content-Type': 'application/yaml' }); return res.end(composeYaml(id)); }
			const entry = catalogue.find((a) => a.id === id);
			res.writeHead(entry ? 200 : 404, { 'Content-Type': 'application/json' });
			return res.end(JSON.stringify(app[2] ? ok({ compose: composeOf(id), store_info: entry?.info }) : (entry ? ok(entry.info) : { success: 404, message: 'app not found' })));
		}
		// No socket.io server here; refuse fast instead of answering JSON
		if (path.startsWith('/v2/message_bus/socket.io')) { res.writeHead(404); return res.end(); }
		if (custom && req.method === 'GET') out = ok(storage[custom[1]] ?? '');
		else if (custom && req.method === 'POST') { storage[custom[1]] = JSON.parse(body || 'null'); out = ok(storage[custom[1]]); }
		else if (routes[key]) out = routes[key](url);
		else { console.log('[mock] unhandled', key); out = ok(null); }
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify(out));
	});
}).listen(PORT, '127.0.0.1', () => console.log(`[mock] CasaOS API mock on http://127.0.0.1:${PORT}`));
