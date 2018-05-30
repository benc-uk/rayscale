import os from 'os';

export class Utils {

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