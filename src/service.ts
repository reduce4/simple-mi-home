import axios from 'axios';
import { signData } from './utils'; // 假设signData函数已经转换为TypeScript并导出
import { MiAccountSession } from './account'
let DEVICES: any = [];

export class Device {
  miAccount: any;
  session: any;
  securityToken: string;
  serverUrl: string;
  deviceId: string;

  constructor(deviceId: string) {
    this.miAccount = new MiAccountSession();
    this.session = this.miAccount.request;
    this.securityToken = this.miAccount.token?.['security_token'];
    this.serverUrl = 'https://api.io.mi.com/app';
    this.deviceId = deviceId;
  }

  deviceInfo(): any {
    for (const device of DEVICES) {
      if (device.did === this.deviceId) {
        return device;
      }
    }
    return {};
  }

  async httpRequest(uri: string, data?: any): Promise<any> {
    const url = this.serverUrl + uri;
    let response;
    if (data) {
      const params = signData(uri, data, this.securityToken);
      response = await this.session.post(url, params);
    } else {
      response = await this.session.get(url);
    }
    return response.data;
  }

  async doAction(sid: string, aid: string, values: any[] = [], pid: string = '1'): Promise<any> {
    const uri = '/miotspec/action';
    const params = { params: { did: this.deviceId, siid: sid, piid: pid, aiid: aid, in: values } };
    const result = await this.httpRequest(uri, params);
    const requestCode = result.code;
    if (!requestCode) {
      const data = result.result;
      const code = result.code;
      if (!code) {
        return { code: 0, msg: 'success', data };
      } else {
        return { code, msg: 'error', data: {} };
      }
    }
    return { code: requestCode, msg: 'request error', data: {} };
  }

  async getDeviceProps(items: any[]): Promise<any> {
    const uri = '/miotspec/prop/get';
    const params = { params: this.addDevicesId(items) };
    const result = await this.httpRequest(uri, params);
    const code = result.code;
    if (!code) {
      const data = result.result;
      return { code: 0, msg: 'success', data };
    } else {
      return { code, msg: result.message, data: [] };
    }
  }

  async getDeviceProp(sid: string, pid: string): Promise<any> {
    const uri = '/miotspec/prop/get';
    const params = { params: [{ did: this.deviceId, piid: pid, siid: sid }] };
    const result = await this.httpRequest(uri, params);
    const code = result.code;
    if (!code) {
      const data = result.result[0];
      return { code: 0, msg: 'success', data };
    } else {
      return { code, msg: result.message, data: {} };
    }
  }

  async setDeviceProp(sid: string, pid: string, value: any): Promise<any> {
    const uri = '/miotspec/prop/set';
    const params = { params: [{ did: this.deviceId, piid: pid, siid: sid, value }] };
    const result = await this.httpRequest(uri, params);
    const code = result.code;
    if (!code) {
      const data = result.result[0];
      return { code: 0, msg: 'success', data };
    } else {
      return { code, msg: result.message, data: {} };
    }
  }

  async setDeviceProps(items: any[]): Promise<any> {
    const uri = '/miotspec/prop/set';
    const params = { params: this.addDevicesId(items) };
    const result = await this.httpRequest(uri, params);
    const code = result.code;
    if (!code) {
      const data = result.result;
      return { code: 0, msg: 'success', data };
    } else {
      return { code, msg: result.message, data: [] };
    }
  }

  addDevicesId(items: any[]): any[] {
    return items.map(item => ({ ...item, did: this.deviceId }));
  }
}

export class MiService {
  miAccount: any;
  securityToken: string;

  constructor() {
    this.miAccount = new MiAccountSession();
    this.securityToken = this.miAccount.token?.['security_token'];
    DEVICES = this.__getDeviceList();
  }

  public async findDevice(deviceName: string): Promise<Device> {
    for (const device of DEVICES) {
      const name = device.name;
      if (name.includes(deviceName)) {
        return new Device(device.did);
      }
    }
    throw new Error('device not found');
  }

  public useDevice(deviceId: string): Device {
    return new Device(deviceId);
  }

  private async __getDeviceList(): Promise<any> {
    const uri = '/home/device_list';
    const params = { getVirtualModel: false, getHuamiDevices: 0 };
    const result = await this.__httpRequest(uri, params);
    const deviceList = result.result?.list;
    return deviceList || [];
  }

  async getDeviceList(): Promise<any> {
    const result = await this.__getDeviceList();
    const code = result.code;
    if (!code) {
      const deviceList = result.result?.list || [];
      return { code: 0, msg: 'success', data: deviceList };
    } else {
      return { code, msg: result.message, data: [] };
    }
  }

  private async __httpRequest(uri: string, data?: any): Promise<any> {
    const url = 'https://api.io.mi.com/app' + uri;
    let response;
    if (data) {
      const params = signData(uri, data, this.securityToken);
      response = await axios.post(url, params);
    } else {
      response = await axios.get(url);
    }
    return response.data;
  }
}