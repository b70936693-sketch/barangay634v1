const dns = require('dns');
const net = require('net');
const host = 'db.glksfvfdwfmzqmqifses.supabase.co';
console.log('resolving', host);
dns.lookup(host, {all: true}, (err, addresses) => {
  if (err) {
    console.error('DNS lookup error:', err);
    process.exit(1);
  }
  console.log('addresses:', addresses);
  if (!addresses.length) {
    console.error('No addresses resolved');
    process.exit(1);
  }
  let remaining = addresses.length;
  addresses.forEach(addr => {
    const socket = new net.Socket();
    socket.setTimeout(5000);
    socket.on('error', (error) => {
      console.error('connect error', addr.address, error.message);
      if (--remaining === 0) process.exit(1);
    });
    socket.on('timeout', () => {
      console.error('connect timeout', addr.address);
      socket.destroy();
      if (--remaining === 0) process.exit(1);
    });
    socket.connect(5432, addr.address, () => {
      console.log('connected to', addr.address);
      socket.destroy();
      process.exit(0);
    });
  });
});
