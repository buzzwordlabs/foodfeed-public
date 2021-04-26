import faker from 'faker';
import { users_devices_platform_enum } from '../../../zapatos/schema';
export const getMockDeviceData = () => {
  return {
    appVersion: '1.0.0',
    codePushVersion: null,
    deviceId: faker.random.uuid().toUpperCase(),
    platform: 'ios' as users_devices_platform_enum,
    systemModel: 'iPhone 11',
    systemVersion: '13.3'
  };
};
