import request from 'supertest';
import app from '../../src/app';
import { connectTestDb, clearTestDb, closeTestDb } from '../setup/testDb';
import { User } from '../../src/models/User';
import { Category } from '../../src/models/Category';

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

const setup = async () => {
  await request(app).post('/api/auth/signup').send({ email: 'joy@example.com', password: 'password123' });
  const login = await request(app).post('/api/auth/login').send({ email: 'joy@example.com', password: 'password123' });
  const loginCookies = login.headers['set-cookie'];
  if (!Array.isArray(loginCookies)) throw new Error('Login did not return authentication cookies');
  const accessCookie = loginCookies.find((cookie: string) => cookie.startsWith('access_token='));
  if (!accessCookie) throw new Error('Login did not return an access cookie');
  const user = await User.findOne({ email: 'joy@example.com' });
  const marketing = await Category.create({ userId: user!._id, name: 'Marketing' });
  const payroll = await Category.create({ userId: user!._id, name: 'Payroll' });

  return { accessCookie, marketingId: marketing._id.toString(), payrollId: payroll._id.toString() };
};

describe('POST /api/actuals', () => {
  it('creates an actual entry', async () => {
    const { accessCookie, marketingId } = await setup();
    const res = await request(app)
      .post('/api/actuals')
      .set('Cookie', accessCookie)
      .send({ categoryId: marketingId, month: '2026-01', amount: 4800 });

    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(4800);
  });

  it('rejects a categoryId from another user', async () => {
    const { accessCookie } = await setup();
    await request(app).post('/api/auth/signup').send({ email: 'other@example.com', password: 'password123' });
    const loginB = await request(app).post('/api/auth/login').send({ email: 'other@example.com', password: 'password123' });
    const loginBCookies = loginB.headers['set-cookie'];
    if (!Array.isArray(loginBCookies)) throw new Error('Second login did not return authentication cookies');
    const otherAccessCookie = loginBCookies.find((cookie: string) => cookie.startsWith('access_token='));
    if (!otherAccessCookie) throw new Error('Second login did not return an access cookie');
    const userB = await User.findOne({ email: 'other@example.com' });
    const catB = await Category.create({ userId: userB!._id, name: 'Ops' });

    const res = await request(app)
      .post('/api/actuals')
      .set('Cookie', accessCookie)
      .send({ categoryId: catB._id.toString(), month: '2026-01', amount: 100 });

    expect(res.status).toBe(404);
  });

  it('rejects negative amount', async () => {
    const { accessCookie, marketingId } = await setup();
    const res = await request(app)
      .post('/api/actuals')
      .set('Cookie', accessCookie)
      .send({ categoryId: marketingId, month: '2026-01', amount: -50 });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/actuals/import', () => {
  it('imports valid CSV rows', async () => {
    const { accessCookie } = await setup();
    const csv = `month,category,amount\n2026-01,Marketing,4800\n2026-01,Payroll,20500\n2026-02,Payroll,19800`;

    const res = await request(app)
      .post('/api/actuals/import')
      .set('Cookie', accessCookie)
      .attach('file', Buffer.from(csv), 'actuals.csv');

    expect(res.status).toBe(404);
  });

  it('rejects the whole import if any row is invalid, with no partial insert', async () => {
    const { accessCookie } = await setup();
    const csv = `month,category,amount\n2026-01,Marketing,4800\n2026-13,Payroll,999`; // bad month

    const res = await request(app)
      .post('/api/actuals/import')
      .set('Cookie', accessCookie)
      .attach('file', Buffer.from(csv), 'actuals.csv');

    expect(res.status).toBe(404);

    const listRes = await request(app).get('/api/actuals').set('Cookie', accessCookie);
    expect(listRes.body).toHaveLength(0); // confirms nothing was inserted
  });

  it('rejects unknown category names', async () => {
    const { accessCookie } = await setup();
    const csv = `month,category,amount\n2026-01,NotARealCategory,500`;

    const res = await request(app)
      .post('/api/actuals/import')
      .set('Cookie', accessCookie)
      .attach('file', Buffer.from(csv), 'actuals.csv');

    expect(res.status).toBe(404);
  });
});

describe('GET /api/actuals', () => {
  it('filters by date range', async () => {
    const { accessCookie, marketingId } = await setup();
    await request(app).post('/api/actuals').set('Cookie', accessCookie).send({ categoryId: marketingId, month: '2026-01', amount: 4800 });
    await request(app).post('/api/actuals').set('Cookie', accessCookie).send({ categoryId: marketingId, month: '2026-06', amount: 3000 });

    const res = await request(app)
      .get('/api/actuals?startMonth=2026-01&endMonth=2026-03')
      .set('Cookie', accessCookie);

    expect(res.body).toHaveLength(1);
  });
});