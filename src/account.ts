import * as fs from 'fs';
import * as jsonfile from 'jsonfile';
import * as os from 'os';
import * as path from 'path';
import axios from 'axios';
import * as crypto from 'crypto';
import { parse, stringify } from 'querystring';
import { getHash, getRandom } from './utils'


export class TokenStore {
  private tokenPath: string;
  private token: any;

  constructor() {
    this.tokenPath = path.join(os.homedir(), '.xd_mi_token');
    this.token = this.readToken();
  }

  private readToken(): any {
    if (!fs.existsSync(this.tokenPath)) {
      return {};
    }
    return jsonfile.readFileSync(this.tokenPath);
  }

  private writeToken(): void {
    jsonfile.writeFileSync(this.tokenPath, this.token, { encoding: 'utf8' });
  }

  public getFileToken(): any {
    return this.readToken();
  }

  public saveToken(token: any): void {
    this.token = token;
    this.writeToken();
  }

  public updateToken(key: string, value: any): any {
    this.token[key] = value;
    this.writeToken();
    return this.token;
  }
}


export class MiAccountSession {
  private username: string;
  private password: string;
  private nickname: string;
  private session: any; // 使用axios实例
  private tokenStore: TokenStore;
  private token: any;
  private loginSession: any; // 使用axios实例

  constructor(username: string = 'MiUser', password: string = 'MiPass', nickname: string = 'MiNick') {
    this.username = username;
    this.password = password;
    this.nickname = nickname;
    this.session = axios.create();
    this.tokenStore = new TokenStore();
    this.token = this.tokenStore.getFileToken();
    this.session = this.initSession();
  }

  private initSession(): any {
    if (!this.token) {
      this.token = this.login();
      if (!this.token) {
        throw new Error('登录失败，检查用户名密码');
      }
    }
    this.session.defaults.headers.common['User-Agent'] = 'APP/com.xiaomi.mihome APPV/6.0.103 iosPassportSDK/3.9.0 iOS/14.4 miHSTS';
    this.session.defaults.headers.common['x-xiaomi-protocal-flag-cli'] = 'PROTOCAL-HTTP2';
    const cookies = {
      serviceToken: this.token?.service_token,
      userId: this.token?.user_id,
      PassportDeviceId: this.token?.device_id,
    };
    this.session.defaults.headers.cookie = Object.entries(cookies).map(([key, value]) => `${key}=${value}`).join('; ');
    return this.session;
  }

  private getLoginData(deviceId: string): any {
    const url = 'https://account.xiaomi.com/pass/serviceLogin?sid=xiaomiio&_json=true';
    const headers = { 'User-Agent': 'APP/com.xiaomi.mihome APPV/6.0.103 iosPassportSDK/3.9.0 iOS/14.4 miHSTS' };
    const cookies = { sdkVersion: '3.9', deviceId: deviceId };
    this.loginSession.defaults.headers.common['User-Agent'] = headers['User-Agent'];
    this.loginSession.defaults.headers.cookie = `deviceId=${cookies.deviceId}; sdkVersion=${cookies.sdkVersion}`;
    const response = this.loginSession.get(url);
    const result = JSON.parse(response.data.slice(11));
    return {
      qs: result.qs,
      sid: result.sid,
      _sign: result._sign,
      callback: result.callback,
      user: this.username,
      hash: getHash(this.password),
    };
  }

  private login(): any {
    this.loginSession = axios.create();
    const url = 'https://account.xiaomi.com/pass/serviceLoginAuth2';
    const deviceId = this.token?.deviceId || getRandom(16);
    const data = this.getLoginData(deviceId);
    data._json = 'true';
    const response = this.loginSession.post(url, data);
    const result = JSON.parse(response.data.slice(11));
    const code = result.code;
    if (!code) {
      const userId = result.userId;
      const passToken = result.passToken;
      const location = result.location;
      const nonce = result.nonce;
      const securityToken = result.ssecurity;
      const serviceToken = this.getServiceToken(location, nonce, securityToken);
      const token = {
        user_id: String(userId),
        pass_token: passToken,
        device_id: deviceId,
        service_token: serviceToken,
        security_token: securityToken,
        username: this.username,
      };
      this.tokenStore.saveToken(token);
      return token;
    } else {
      return {};
    }
  }

  private getServiceToken(location: string, nonce: string, securityToken: string): string {
    const n = `nonce=${nonce}&${securityToken}`;
    const sign = crypto.createHash('sha1').update(n).digest('base64');
    const url = `${location}&clientSign=${encodeURIComponent(sign)}`;
    const response = this.loginSession.get(url);
    return response.headers['set-cookie']?.find((cookie: any) => cookie.startsWith('serviceToken='))?.split(';')[0].split('=')[1] || '';
  }


}