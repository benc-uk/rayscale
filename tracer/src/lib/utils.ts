import os from 'os';

export class Utils {

  static degreeToRad(deg: number): number {
    return deg * (Math.PI/180);
  }

  static clamp(v: number, min: number, max: number) {
    return Math.min(Math.max(v, min), max);
  }

  static numberWithCommas = (x: number) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  static getNetInterfaceIP() {
    let addr = null;
    for(let iface in os.networkInterfaces()) {
      if(iface.startsWith('eth')) {
        addr = os.networkInterfaces()[iface][0].address;
      }
    }
    return addr;
  }
}