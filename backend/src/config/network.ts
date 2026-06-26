import os from 'os';

const VIRTUAL = [
  'vethernet', 'virtualbox', 'vmware', 'hyper-v', 'wsl',
  'loopback', 'default switch', 'docker', 'utun', 'tailscale',
];

function isPrivateLan(ip: string): boolean {
  if (ip.startsWith('192.168.')) return true;
  if (ip.startsWith('10.')) return true;
  const m = ip.match(/^172\.(\d+)\./);
  if (m) { const n = Number(m[1]); return n >= 16 && n <= 31; }
  return false;
}

export interface IPCandidate {
  name: string;
  address: string;
  recommended: boolean;
}

export function getNetworkIPs(): IPCandidate[] {
  const ifaces = os.networkInterfaces();
  const out: IPCandidate[] = [];

  for (const name of Object.keys(ifaces)) {
    const lower = name.toLowerCase();
    const isVirtual = VIRTUAL.some((v) => lower.includes(v));
    for (const iface of ifaces[name] ?? []) {
      if (iface.family !== 'IPv4' || iface.internal) continue;
      out.push({ name, address: iface.address, recommended: false });
      if (isVirtual) out[out.length - 1].recommended = false;
    }
  }

  const score = (c: IPCandidate) => {
    const virtual = VIRTUAL.some((v) => c.name.toLowerCase().includes(v));
    if (!virtual && isPrivateLan(c.address)) return 0;
    if (isPrivateLan(c.address)) return 1;
    if (!virtual) return 2;
    return 3;
  };
  out.sort((a, b) => score(a) - score(b));

  if (out.length) out[0].recommended = true;
  return out;
}

export function getRecommendedIP(): string {
  const list = getNetworkIPs();
  return list.find((c) => c.recommended)?.address ?? 'localhost';
}
