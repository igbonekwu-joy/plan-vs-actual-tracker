import request from 'supertest';
import app from '../../src/app';
import { connectTestDb, clearTestDb, closeTestDb } from '../setup/testDb';
import { User } from '../../src/models/User';
import { Category } from '../../src/models/Category';

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

const authHeader = (accessCookie: string) => ({ Cookie: accessCookie });

const setupUser = async (email = 'joy@example.com') => {
  await request(app).post('/api/auth/signup').send({ email, password: 'password123' });
  const login = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
  const cookies = login.headers['set-cookie'];
  if (!Array.isArray(cookies)) throw new Error('Login did not return authentication cookies');
  const accessCookie = cookies.find((cookie) => cookie.startsWith('access_token='));
  if (!accessCookie) throw new Error('Login did not return an access cookie');
  return accessCookie;
};

const createCategory = async (accessCookie: string, name: string) => {
  const user = await User.findOne().sort({ createdAt: -1 });
  const category = await Category.create({ userId: user!._id, name });
  return category._id.toString();
};

const getFutureMonth = (offset: number) => {
  const date = new Date();
  date.setMonth(date.getMonth() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

describe('GET /api/report — assignment sample data', () => {
  it('matches the exact variance table from the assignment PDF', async () => {
    const token = await setupUser();
    const marketingId = await createCategory(token, 'Marketing');
    const payrollId = await createCategory(token, 'Payroll');
    const january = getFutureMonth(1);
    const february = getFutureMonth(2);

    // Plans
    await request(app).put('/api/plans').set(authHeader(token)).send({ categoryId: marketingId, month: january, targetAmount: 5000 });
    await request(app).put('/api/plans').set(authHeader(token)).send({ categoryId: payrollId, month: january, targetAmount: 20000 });
    await request(app).put('/api/plans').set(authHeader(token)).send({ categoryId: marketingId, month: february, targetAmount: 5000 });
    await request(app).put('/api/plans').set(authHeader(token)).send({ categoryId: payrollId, month: february, targetAmount: 20000 });

    // Actuals — Marketing Feb intentionally omitted, matching the sample CSV
    await request(app).post('/api/actuals').set(authHeader(token)).send({ categoryId: marketingId, month: january, amount: 4800 });
    await request(app).post('/api/actuals').set(authHeader(token)).send({ categoryId: payrollId, month: january, amount: 20500 });
    await request(app).post('/api/actuals').set(authHeader(token)).send({ categoryId: payrollId, month: february, amount: 19800 });

    const res = await request(app)
      .get(`/api/report?startMonth=${january}&endMonth=${february}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.rows).toHaveLength(4);

    const janMarketing = res.body.rows.find((r: any) => r.month === january && r.category === 'Marketing');
    expect(janMarketing).toMatchObject({ plan: 5000, actual: 4800, variance: -200, variancePercent: -4 });

    const janPayroll = res.body.rows.find((r: any) => r.month === january && r.category === 'Payroll');
    expect(janPayroll).toMatchObject({ plan: 20000, actual: 20500, variance: 500, variancePercent: 2.5 });

    const febMarketing = res.body.rows.find((r: any) => r.month === february && r.category === 'Marketing');
    expect(febMarketing).toMatchObject({ plan: 5000, actual: '-', variance: '-', variancePercent: '-' });

    const febPayroll = res.body.rows.find((r: any) => r.month === february && r.category === 'Payroll');
    expect(febPayroll).toMatchObject({ plan: 20000, actual: 19800, variance: -200, variancePercent: -1 });
  });
});

describe('GET /api/report — edge cases', () => {
  it('shows "-" for variancePercent when plan is 0, but keeps a real variance number', async () => {
    const token = await setupUser();
    const categoryId = await createCategory(token, 'Tools');
    const month = getFutureMonth(3);

    await request(app).put('/api/plans').set(authHeader(token)).send({ categoryId, month, targetAmount: 0 });
    await request(app).post('/api/actuals').set(authHeader(token)).send({ categoryId, month, amount: 500 });

    const res = await request(app).get(`/api/report?startMonth=${month}&endMonth=${month}`).set(authHeader(token));

    const row = res.body.rows[0];
    expect(row.plan).toBe(0);
    expect(row.actual).toBe(500);
    expect(row.variance).toBe(500); // real number — actual minus 0 is still meaningful
    expect(row.variancePercent).toBe('-'); // division by zero avoided
  });

  it('defaults a missing plan to 0 when only an actual exists', async () => {
    const token = await setupUser();
    const categoryId = await createCategory(token, 'Travel');
    const month = getFutureMonth(4);

    await request(app).post('/api/actuals').set(authHeader(token)).send({ categoryId, month, amount: 300 });

    const res = await request(app).get(`/api/report?startMonth=${month}&endMonth=${month}`).set(authHeader(token));

    const row = res.body.rows[0];
    expect(row.plan).toBe(0);
    expect(row.actual).toBe(300);
    expect(row.variancePercent).toBe('-');
  });

  it('excludes rows outside the requested date range', async () => {
    const token = await setupUser();
    const categoryId = await createCategory(token, 'Marketing');
    const includedMonth = getFutureMonth(1);
    const outsideMonth = getFutureMonth(2);

    await request(app).put('/api/plans').set(authHeader(token)).send({ categoryId, month: outsideMonth, targetAmount: 1000 });
    await request(app).put('/api/plans').set(authHeader(token)).send({ categoryId, month: includedMonth, targetAmount: 1000 });

    const res = await request(app).get(`/api/report?startMonth=${includedMonth}&endMonth=${includedMonth}`).set(authHeader(token));
    expect(res.body.rows).toHaveLength(1);
    expect(res.body.rows[0].month).toBe(includedMonth);
  });

  it('only returns the authenticated user\'s data', async () => {
    const tokenA = await setupUser('a@example.com');
    const catA = await createCategory(tokenA, 'Marketing');
    const month = getFutureMonth(1);
    await request(app).put('/api/plans').set(authHeader(tokenA)).send({ categoryId: catA, month, targetAmount: 1000 });

    const tokenB = await setupUser('b@example.com');
    const res = await request(app).get(`/api/report?startMonth=${month}&endMonth=${month}`).set(authHeader(tokenB));

    expect(res.body.rows).toHaveLength(0);
  });
});

describe('GET /api/report — validation', () => {
  it('rejects missing date range params', async () => {
    const token = await setupUser();
    const res = await request(app).get('/api/report').set(authHeader(token));
    expect(res.status).toBe(400);
  });

  it('rejects malformed month strings', async () => {
    const token = await setupUser();
    const res = await request(app).get('/api/report?startMonth=2026-13&endMonth=2026-01').set(authHeader(token));
    expect(res.status).toBe(400);
  });

  it('rejects startMonth after endMonth', async () => {
    const token = await setupUser();
    const res = await request(app).get('/api/report?startMonth=2026-06&endMonth=2026-01').set(authHeader(token));
    expect(res.status).toBe(400);
  });
});

describe('GET /api/report — chart', () => {
  it('returns monthly net variance data', async () => {
    const token = await setupUser();
    const categoryId = await createCategory(token, 'Marketing');
    const month = getFutureMonth(1);

    await request(app).put('/api/plans').set(authHeader(token)).send({ categoryId, month, targetAmount: 5000 });
    await request(app).post('/api/actuals').set(authHeader(token)).send({ categoryId, month, amount: 4800 });

    const res = await request(app).get(`/api/report?startMonth=${month}&endMonth=${month}`).set(authHeader(token));

    expect(res.body.chart.type).toBe('monthly_net_variance');
    expect(res.body.chart.labels).toEqual([month]);
    expect(res.body.chart.data).toEqual([-200]);
  });
});