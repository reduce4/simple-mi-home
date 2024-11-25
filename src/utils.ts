import { randomBytes } from 'crypto';
import { Buffer } from 'buffer';
import { performance } from 'perf_hooks';
import chalk from 'chalk';
import * as crypto from 'crypto';
import { stringify } from 'querystring';
import { format } from 'date-fns';

export function getRandom(length: number): string {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytes(1)[0] % characters.length;
    result += characters.charAt(randomIndex);
  }
  return result;
}


export function generateNonce(): string {
  // 生成8字节的随机数据
  const randomBytesPart = randomBytes(8);

  // 获取当前时间戳（以分钟为单位），并转换为4字节的big-endian格式
  const timePart = Math.floor(performance.now() / 60000);
  const timeBuffer = Buffer.alloc(4);
  timeBuffer.writeUInt32BE(timePart, 0);

  // 将随机数据和时间数据合并
  const nonce = Buffer.concat([randomBytesPart, timeBuffer]);

  // 进行base64编码并返回结果
  return nonce.toString('base64');
}




export function generateSignedNonce(secret: string, nonce: string): string {
  // 创建一个SHA-256哈希实例
  const hash = crypto.createHash('sha256');

  // 对secret进行base64解码并更新哈希
  hash.update(Buffer.from(secret, 'base64'));

  // 对nonce进行base64解码并更新哈希
  hash.update(Buffer.from(nonce, 'base64'));

  // 计算哈希的digest并进行base64编码
  const digest = hash.digest();
  return digest.toString('base64');
}


export function generateSignature(url: string, signedNonce: string, nonce: string, data: string): string {
  // 将url、signedNonce、nonce和data组合成一个字符串
  const sign = [url, signedNonce, nonce, `data=${data}`].join('&');

  // 使用signedNonce作为密钥，对组合后的字符串进行HMAC-SHA256签名
  const secretKey = Buffer.from(signedNonce, 'base64');
  const signature = crypto.createHmac('sha256', secretKey).update(sign).digest();

  // 将签名结果进行base64编码
  return signature.toString('base64');
}

export function signData(uri: string, data: any, secret: string): { _nonce: string; data: any; signature: string } {
  if (typeof data !== 'string') {
    data = JSON.stringify(data);
  }
  const nonce = generateNonce();
  const signedNonce = generateSignedNonce(secret, nonce);
  const signature = generateSignature(uri, signedNonce, nonce, data);
  return { _nonce: nonce, data, signature };
}

export function getHash(password: string): string {
  // 使用crypto模块创建MD5哈希
  const hash = crypto.createHash('md5');
  // 更新哈希实例，将密码编码为UTF-8
  hash.update(password);
  // 计算哈希值，并将其转换为大写字符串
  return hash.digest('hex').toUpperCase();
}



export function infoLog(message: string, module: string = "提示", ...args: any[]): void {
  // 获取当前时间
  const s = new Date().toISOString().replace('T', ' ').substring(0, 19);
  // 将消息设置为绿色
  const sf = chalk.green(message);
  // 打印日志
  console.log(`${s} [${module}] ${sf}`, ...args);
}



export function errorLog(message: string, module: string = "错误", ...args: any[]): void {
  // 获取当前时间并格式化为 "YYYY-MM-DD HH:mm:ss" 格式
  const s = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  // 将消息设置为红色
  const sf = chalk.red(message);
  // 打印错误日志
  console.error(`${s} [${module}] ${sf}`, ...args);
}