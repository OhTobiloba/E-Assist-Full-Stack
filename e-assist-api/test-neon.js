import 'dotenv/config';
import dns from 'node:dns/promises';
import net from 'node:net';

const host = new URL(process.env.DATABASE_URL).hostname;

console.log('Neon host:', host);

const addresses = await dns.lookup(host, { all: true });
console.log('Resolved addresses:', addresses);

for (const family of [4, 6]) {
  const address = addresses.find(a => a.family === family);

  if (!address) {
    console.log('IPv' + family + ': no address available');
    continue;
  }

  await new Promise(resolve => {
    const socket = net.connect({
      host: address.address,
      port: 5432,
      family
    });

    socket.setTimeout(10000);

    socket.on('connect', () => {
      console.log('IPv' + family + ': TCP connection successful');
      socket.destroy();
      resolve();
    });

    socket.on('timeout', () => {
      console.log('IPv' + family + ': connection timed out');
      socket.destroy();
      resolve();
    });

    socket.on('error', error => {
      console.log('IPv' + family + ':', error.code || error.message);
      resolve();
    });
  });
}
