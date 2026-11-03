// Dev-only mock of the CasaOS API so the UI can be clicked through without a server.
// Run: node mock/server.js   then set .env.dev.local to VUE_APP_DEV_IP=127.0.0.1 / VUE_APP_DEV_PORT=8090
// Any login works. Unknown endpoints answer { success: 200, data: null } and are logged.
const http = require('http');

const PORT = 8090;
const ok = (data) => ({ success: 200, message: 'ok', data });
const storage = {}; // custom storage (widgets_config, app_order, system...) kept in memory

const user = { id: 1, username: 'advaita', role: 'admin', email: '', nickname: 'advaita', avatar: '', description: '' };
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
	'GET /v2/app_management/apps': () => ok({ list: {}, recommend: [], installed: [], community: [] }),
	'GET /v2/app_management/categories': () => ok([]),
	'GET /v2/app_management/appstore': () => ok([]),
	'GET /disks': () => ok([]),
	'GET /container/usage': () => ok([]),
	'GET /v2/users/events': () => [], // the UI reads this one as a bare array
	'GET /storage': () => ok([]),
	'GET /cloud': () => ok([]),
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
