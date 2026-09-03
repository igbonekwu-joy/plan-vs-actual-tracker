import request from 'supertest';
import app from '../../src/app';
import { connectTestDb, clearTestDb, closeTestDb } from '../setup/testDb';

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

const signupAndLogin = async () => {
  await request(app).post('/api/auth/signup').send({ email: 'joy@example.com', password: 'password123' });
  const res = await request(app).post('/api/auth/login').send({ email: 'joy@example.com', password: 'password123' });
  return res.body.access_token;
};

describe('POST /api/categories', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request(app).post('/api/categories').send({ name: 'Marketing' });
    expect(res.status).toBe(401);
  });

  it('creates a category for the authenticated user', async () => {
    const token = await signupAndLogin();
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Marketing' });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Category created successfully');
  });

  it('rejects duplicate category names for the same user', async () => {
    const token = await signupAndLogin();
    await request(app).post('/api/categories').set('Authorization', `Bearer ${token}`).send({ name: 'Marketing' });
    const res = await request(app).post('/api/categories').set('Authorization', `Bearer ${token}`).send({ name: 'Marketing' });

    expect(res.status).toBe(409);
  });
});

describe('GET /api/categories', () => {
  it('returns only the authenticated user\'s categories', async () => {
    const tokenA = await signupAndLogin();
    await request(app).post('/api/categories').set('Authorization', `Bearer ${tokenA}`).send({ name: 'Marketing' });

    // second user
    await request(app).post('/api/auth/signup').send({ email: 'other@example.com', password: 'password123' });
    const loginB = await request(app).post('/api/auth/login').send({ email: 'other@example.com', password: 'password123' });
    const tokenB = loginB.body.access_token;
    await request(app).post('/api/categories').set('Authorization', `Bearer ${tokenB}`).send({ name: 'Payroll' });

    const res = await request(app).get('/api/categories').set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Marketing');
  });
});