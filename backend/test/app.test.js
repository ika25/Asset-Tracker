import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

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