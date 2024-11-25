import express, { Request, Response } from 'express';
import { json, urlencoded } from 'body-parser';
import { authKey } from './config/config_parser'; // 假设authKey已经转换为TypeScript并导出
import { MiService,Device } from './service';

const app = express();
app.use(json());
app.use(urlencoded({ extended: true }));

function authToken (req: Request, res: Response, next: any):any{
    const authorization = req.headers['authorization'];
    if (!authorization || authorization !== authKey) {
      return res.status(401).json({
        message: 'Unauthorized',
        code: 401,
      });
    }
    next();
  };
  

const service = new MiService();
const devices: [string, Device][] = [];

app.use((req: Request, res: Response, next: any) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

const locateDevice = (deviceId: string, deviceName?: string): any | null => {
  if (deviceId) {
    for (const [id, device] of devices) {
      if (id === deviceId) {
        return device;
      }
    }
    const device = service.useDevice(deviceId);
    devices.push([deviceId, device]);
    return device;
  } else if (deviceName) {
    try {
      const device = service.findDevice(deviceName);
      return device;
    } catch (e) {
      return null;
    }
  }
  return null;
};


const handleForm = (req: Request) => {
  let data = req.body;
  if (!data) {
    data = req;
  }
  return data;
};

app.post('/api/do_action', authToken, (req: any, res: any) => {
  const data = handleForm(req);
  const deviceId = data.device_id;
  const deviceName = data.device_name;
  const device = locateDevice(deviceId, deviceName);
  if (!device) {
    return res.status(404).json({ code: 404, message: 'Device not found' });
  }
  const sid = data.sid;
  const aid = data.aid;
  const action = data.action;
  res.json(device.doAction(sid, aid, action));
});

app.post('/api/get_prop', authToken, (req: any, res: any) => {
  const data = handleForm(req);
  const deviceId = data.device_id;
  const deviceName = data.device_name;
  const device = locateDevice(deviceId, deviceName);
  if (!device) {
    return res.status(404).json({ code: 404, message: 'Device not found' });
  }
  const sid = data.sid;
  const pid = data.pid;
  res.json(device.getDeviceProp(sid, pid));
});

app.post('/api/get_props', authToken, (req: any, res: any) => {
  const data = handleForm(req);
  const deviceId = data.device_id;
  const deviceName = data.device_name;
  const device = locateDevice(deviceId, deviceName);
  if (!device) {
    return res.status(404).json({ code: 404, message: 'Device not found' });
  }
  const params = data.params;
  res.json(device.getDeviceProps(params));
});

app.post('/api/set_prop', authToken, (req: any, res: any) => {
  const data = handleForm(req);
  const deviceId = data.device_id;
  const deviceName = data.device_name;
  const device = locateDevice(deviceId, deviceName);
  if (!device) {
    return res.status(404).json({ code: 404, message: 'Device not found' });
  }
  const sid = data.sid;
  const pid = data.pid;
  const value = data.value;
  res.json(device.setDeviceProp(sid, pid, value));
});

app.post('/api/set_props', authToken, (req: any, res: any) => {
  const data = handleForm(req);
  const deviceId = data.device_id;
  const deviceName = data.device_name;
  const device = locateDevice(deviceId, deviceName);
  if (!device) {
    return res.status(404).json({ code: 404, message: 'Device not found' });
  }
  const params = data.params;
  res.json(device.setDeviceProps(params));
});

app.get('/api/get_device_list', (req: Request, res: Response) => {
  res.json(service.getDeviceList());
});

// Global error handling
app.use((err: any, req: Request, res: Response, next: any) => {
  const response = {
    code: err.status || 500,
    msg: '服务器错误',
    data: {
      http_code: err.status || 500,
      name: err.name,
      description: err.message,
    },
  };
  res.status(response.code).json(response);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});