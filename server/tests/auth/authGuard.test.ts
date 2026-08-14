import request from 'supertest';
import app from '../../src/app';
import { connectTestDb, clearTestDb, closeTestDb } from '../setup/testDb';

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

const signupAndLogin = async () => {
  await request(app).post('/api/auth/signup').send({ email: 'joy@example.com', password: 'password123' });
  const res = await request(app).post('/api/auth/login').send({ email: 'joy@example.com', password: 'password123' });
  return res.body.token;
};

describe('authGuard middleware', () => {
  it('allows access with a valid token', async () => {
    const token = await signupAndLogin();
    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.userId).toBeDefined();
  });

  it('rejects requests with no Authorization header', async () => {
    const res = await request(app).get('/api/protected');
    expect(res.status).toBe(401);
  });

  it('rejects requests with a malformed header (no Bearer prefix)', async () => {
    const token = await signupAndLogin();
    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', token); // missing "Bearer "

    expect(res.status).toBe(401);
  });

  it('rejects an invalid/tampered token', async () => {
    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', 'Bearer not.a.valid.token');

    expect(res.status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const jwt = require('jsonwebtoken');
    const expiredToken = jwt.sign(
      { userId: 'some-id' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '-1s' } // already expired
    );

    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
  });
});