import * as fs from 'fs';
import * as path from 'path';
import * as ini from 'ini';
// 假设config.ini文件的格式和内容与Python中的configparser兼容
// 这里我们使用fs模块来读取和解析INI文件

const configDir = path.dirname(__dirname); // 获取当前文件的目录
const configPath = path.join(configDir, 'config.ini'); // 配置文件路径

// 读取配置文件
const configContent = fs.readFileSync(configPath, 'utf-8');

// 解析INI文件内容


// 其余代码与上面相同，只需将iniParse替换为ini.parse
export const config = ini.parse(configContent);
export const miUser = config['account']['MiUsername'];
export const miPass = config['account']['MiPassword'];
export const miNick = config['account']['MiNickname'];
export const authKey = config['server']['AuthKey'];