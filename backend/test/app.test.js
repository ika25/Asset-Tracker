import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { normalizeCSVRows } from '../src/utils/csv.js';

test('GET / returns API metadata', async () => {
  const response = await request(app).get('/');

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    message: 'Asset Tracker API',
    version: '1.0.0',
  });
});

test('POST /api/hardware rejects invalid payloads before hitting the database', async () => {
  const response = await request(app)
    .post('/api/hardware')
    .send({ name: 'Monitor' });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, 'Invalid body.');
});

test('POST /api/device-software rejects non-numeric ids', async () => {
  const response = await request(app)
    .post('/api/device-software')
    .send({ device_id: 'abc', software_id: 3 });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, 'Invalid body.');
});

test('POST /api/devices/:deviceId/ports rejects invalid payloads before hitting the database', async () => {
  const response = await request(app)
    .post('/api/devices/12/ports')
    .send({ label: 'Missing port number' });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, 'Invalid body.');
});

test('POST /api/ports/:id/connection requires a connection endpoint', async () => {
  const response = await request(app)
    .post('/api/ports/7/connection')
    .send({ cable_label: 'Blue-17' });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, 'Invalid body.');
});

test('normalizeCSVRows maps common Excel header names to device import fields', () => {
  const rows = [
    {
      'PC Name': 'PC-183',
      Type: 'PC',
      Status: 'Active',
      Manufacturer: 'HP',
      'User Name': 'Anna',
      'Disk Space': '256GB',
      'Device Age': '8 Years',
      Location: 'B1 HR',
      'Microsoft Business Premium': 'Yes',
      'Upgrade Urgency': 'Low',
    },
  ];

  const normalized = normalizeCSVRows(rows, [
    'name',
    'ip_address',
    'type',
    'status',
    'location',
    'manufacturer',
    'os',
    'user_name',
    'ram',
    'disk_space',
    'serial_number',
    'install_date',
  ]);

  assert.equal(normalized[0].name, 'PC-183');
  assert.equal(normalized[0].type, 'PC');
  assert.equal(normalized[0].status, 'Active');
  assert.equal(normalized[0].location, 'B1 HR');
  assert.equal(normalized[0].manufacturer, 'HP');
  assert.equal(normalized[0].user_name, 'Anna');
  assert.equal(normalized[0].disk_space, '256GB');
  assert.equal(normalized[0].install_date, '2018-09-26');
});