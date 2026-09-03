import request from 'supertest';
import app from '../../src/app';
import { Category } from '../../src/models/Category';
import { connectTestDb, clearTestDb, closeTestDb } from '../setup/testDb';

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

const setup = async () => {
  await request(app).post('/api/auth/signup').send({ email: 'joy@example.com', password: 'password123' });
  const login = await request(app).post('/api/auth/login').send({ email: 'joy@example.com', password: 'password123' });
  const setCookieHeader = login.headers['set-cookie'];
  const accessCookie = (Array.isArray(setCookieHeader) ? setCookieHeader : [])
    .find((cookie) => cookie.startsWith('access_token='));
  const token = accessCookie?.split(';')[0].replace('access_token=', '');

  const catRes = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Marketing' });

  const category = await Category.findOne({ name: 'Marketing' });
  return { token, categoryId: category?._id.toString() };
};

const getMonth = (offset: number) => {
  const date = new Date();
  date.setMonth(date.getMonth() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

describe('PUT /api/plans', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request(app).put('/api/plans').send({ categoryId: 'x', month: getMonth(0), targetAmount: 5000 });
    expect(res.status).toBe(401);
  });

  it('creates a new plan', async () => {
    const { token, categoryId } = await setup();
    const res = await request(app)
      .put('/api/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ categoryId, month: getMonth(0), targetAmount: 5000 });

    expect(res.status).toBe(200);
    expect(res.body.targetAmount).toBe(5000);
    expect(res.body.month).toBe(getMonth(0));
  });

  it('updates an existing plan for the same category+month (upsert)', async () => {
    const { token, categoryId } = await setup();
    await request(app).put('/api/plans').set('Authorization', `Bearer ${token}`).send({ categoryId, month: getMonth(0), targetAmount: 5000 });
    const res = await request(app).put('/api/plans').set('Authorization', `Bearer ${token}`).send({ categoryId, month: getMonth(0), targetAmount: 6000 });

    expect(res.status).toBe(200);
    expect(res.body.targetAmount).toBe(6000);
  });

  it('rejects a categoryId belonging to another user', async () => {
    const { token, categoryId } = await setup();

    await request(app).post('/api/auth/signup').send({ email: 'other@example.com', password: 'password123' });
    const loginB = await request(app).post('/api/auth/login').send({ email: 'other@example.com', password: 'password123' });
    const setCookieHeader = loginB.headers['set-cookie'];
    const accessCookie = (Array.isArray(setCookieHeader) ? setCookieHeader : [])
      .find((cookie) => cookie.startsWith('access_token='));
    const tokenB = accessCookie?.split(';')[0].replace('access_token=', '');

    const res = await request(app)
      .put('/api/plans')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ categoryId, month: getMonth(0), targetAmount: 5000 });

    expect(res.status).toBe(404);
  });

  it('rejects invalid month format', async () => {
    const { token, categoryId } = await setup();
    const res = await request(app)
      .put('/api/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ categoryId, month: '2026-13', targetAmount: 5000 }); // invalid month

    expect(res.status).toBe(400);
  });

  it('rejects a negative targetAmount', async () => {
    const { token, categoryId } = await setup();
    const res = await request(app)
      .put('/api/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ categoryId, month: getMonth(0), targetAmount: -100 });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/plans', () => {
  it('filters by date range', async () => {
    const { token, categoryId } = await setup();
    const startMonth = getMonth(0);
    const nextMonth = getMonth(1);
    await request(app).put('/api/plans').set('Authorization', `Bearer ${token}`).send({ categoryId, month: startMonth, targetAmount: 5000 });
    await request(app).put('/api/plans').set('Authorization', `Bearer ${token}`).send({ categoryId, month: nextMonth, targetAmount: 3000 });

    const res = await request(app)
      .get(`/api/plans?startMonth=${startMonth}&endMonth=${startMonth}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].month).toBe(startMonth);
  });
});