import * as fs from 'fs';

import file from '../mobile/env';

const fileName = './mobile/env.ts';

process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', function (data) {
  const { tunnels } = JSON.parse(String(data));
  const url =
    tunnels[0].proto === 'https'
      ? tunnels[0].public_url
      : tunnels[1].public_url;
  file.API_BASE_URL = url;
  fs.writeFileSync(
    fileName,
    `export const ENV = ${JSON.stringify(file)}; export default ENV;`
  );
  console.log('Ngrok URL: ', url);
});
