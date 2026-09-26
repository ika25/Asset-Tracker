import test from 'node:test';
import assert from 'node:assert/strict';
import { parseScanOutput } from '../src/services/nmapService.js';

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<nmaprun>
  <host>
    <status state="up" reason="syn-ack" reason_ttl="0"/>
    <address addr="192.168.1.25" addrtype="ipv4"/>
    <address addr="AA:BB:CC:DD:EE:FF" addrtype="mac" vendor="HP"/>
    <hostnames>
      <hostname name="office-printer" type="PTR"/>
    </hostnames>
    <ports>
      <port protocol="tcp" portid="80">
        <state state="open"/>
        <service name="http" product="JetDirect" version="1.0"/>
      </port>
      <port protocol="tcp" portid="9100">
        <state state="open"/>
        <service name="jetdirect"/>
      </port>
    </ports>
    <os>
      <osmatch name="HP Embedded Printer OS" accuracy="92"/>
    </os>
  </host>
  <host>
    <status state="up" reason="syn-ack" reason_ttl="0"/>
    <address addr="192.168.1.50" addrtype="ipv4"/>
    <hostnames>
      <hostname name="app-server" type="PTR"/>
    </hostnames>
    <ports>
      <port protocol="tcp" portid="22">
        <state state="open"/>
        <service name="ssh" product="OpenSSH" version="9.0"/>
      </port>
      <port protocol="tcp" portid="443">
        <state state="open"/>
        <service name="https" product="nginx" version="1.26"/>
      </port>
    </ports>
    <os>
      <osmatch name="Linux 5.X" accuracy="88"/>
    </os>
  </host>
</nmaprun>`;

test('parseScanOutput extracts richer device details from nmap XML', () => {
  const devices = parseScanOutput(SAMPLE_XML);

  assert.equal(devices.length, 2);

  assert.deepEqual(devices[0], {
    ipAddress: '192.168.1.25',
    hostname: 'office-printer',
    macAddress: 'AA:BB:CC:DD:EE:FF',
    vendor: 'HP',
    status: 'up',
    osGuess: 'HP Embedded Printer OS',
    osAccuracy: 92,
    deviceTypeGuess: 'Printer',
    ports: [
      {
        port: 80,
        protocol: 'tcp',
        state: 'open',
        service: 'http',
        product: 'JetDirect',
        version: '1.0',
      },
      {
        port: 9100,
        protocol: 'tcp',
        state: 'open',
        service: 'jetdirect',
        product: null,
        version: null,
      },
    ],
    portSummary: '80/tcp http (JetDirect 1.0), 9100/tcp jetdirect',
  });

  assert.equal(devices[1].deviceTypeGuess, 'Server');
  assert.equal(devices[1].osGuess, 'Linux 5.X');
  assert.match(devices[1].portSummary, /22\/tcp ssh/);
  assert.match(devices[1].portSummary, /443\/tcp https/);
});
