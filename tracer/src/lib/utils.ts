import os from 'os';


export function degreeToRad(deg: number): number {
  return deg * (Math.PI/180);
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

export function swap(a: number, b: number): void {
  const tmp: number = a;
  a = b;
  b = tmp;
}

export function numberWithCommas(x: number): string {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function getNetInterfaceIP(): string {
  let addr = null;
  for(const iface in os.networkInterfaces()) {
    if(iface.startsWith('eth')) {
      addr = os.networkInterfaces()[iface][0].address;
    }
  }
  return addr;
}

export function hashCode(str: string): number {
  let hash = 0, i, chr;
  for (i = 0; i < str.length; i++) {
    chr   = str.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}


export function lerp(v0: number, v1: number, t: number): number {
  return (1 - t) * v0 + t * v1;
}
