import request from 'supertest';
import app from '../../src/app';
import { connectTestDb, clearTestDb, closeTestDb } from '../setup/testDb';

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

describe('POST /api/auth/signup', () => {
  it('returns 201 and the user (without password) on success', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'joy@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe('joy@example.com');
    expect(res.body.password).toBeUndefined();
  });

  it('returns 400 if email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ password: 'password123' });
    expect(res.status).toBe(400);
  });

  it('returns 409 for a duplicate email', async () => {
    await request(app).post('/api/auth/signup').send({ email: 'joy@example.com', password: 'password123' });
    const res = await request(app).post('/api/auth/signup').send({ email: 'joy@example.com', password: 'other' });
    expect(res.status).toBe(409);
  });
});