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
  const cookies = login.headers['set-cookie'];
  if (!Array.isArray(cookies)) throw new Error('Login did not return authentication cookies');
  const accessCookie = cookies.find((cookie) => cookie.startsWith('access_token='));
  if (!accessCookie) throw new Error('Login did not return an access cookie');

  const user = await User.findOne({ email: 'joy@example.com' });
  const category = await Category.create({ userId: user!._id, name: 'Marketing' });
  return { accessCookie, categoryId: category._id.toString() };
};

const getFutureMonth = (offset: number) => {
  const date = new Date();
  date.setMonth(date.getMonth() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

describe('POST /api/locks', () => {
  it('locks a month', async () => {
    const { accessCookie } = await setup();
    const res = await request(app).post('/api/locks').set('Cookie', accessCookie).send({ month: '2026-01' });
    expect(res.status).toBe(201);
    expect(res.body.month).toBe('2026-01');
  });

  it('rejects locking an already-locked month', async () => {
    const { accessCookie } = await setup();
    await request(app).post('/api/locks').set('Cookie', accessCookie).send({ month: '2026-01' });
    const res = await request(app).post('/api/locks').set('Cookie', accessCookie).send({ month: '2026-01' });
    expect(res.status).toBe(409);
  });
});

describe('DELETE /api/locks/:month', () => {
  it('unlocks a locked month', async () => {
    const { accessCookie } = await setup();
    await request(app).post('/api/locks').set('Cookie', accessCookie).send({ month: '2026-01' });
    const res = await request(app).delete('/api/locks/2026-01').set('Cookie', accessCookie);
    expect(res.status).toBe(200);
  });

  it('returns 404 when unlocking a month that was never locked', async () => {
    const { accessCookie } = await setup();
    const res = await request(app).delete('/api/locks/2026-01').set('Cookie', accessCookie);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/locks', () => {
  it('lists locked months', async () => {
    const { accessCookie } = await setup();
    await request(app).post('/api/locks').set('Cookie', accessCookie).send({ month: '2026-01' });
    await request(app).post('/api/locks').set('Cookie', accessCookie).send({ month: '2026-02' });

    const res = await request(app).get('/api/locks').set('Cookie', accessCookie);
    expect(res.body).toEqual(['2026-01', '2026-02']);
  });
});

describe('Lock enforcement on Plans', () => {
  it('blocks creating a plan for a locked month with 423', async () => {
    const { accessCookie, categoryId } = await setup();
    const month = getFutureMonth(1);
    await request(app).post('/api/locks').set('Cookie', accessCookie).send({ month });

    const res = await request(app)
      .put('/api/plans')
      .set('Cookie', accessCookie)
      .send({ categoryId, month, targetAmount: 5000 });

    expect(res.status).toBe(423);
  });

  it('blocks editing an existing plan once its month is locked', async () => {
    const { accessCookie, categoryId } = await setup();
    const month = getFutureMonth(1);
    await request(app).put('/api/plans').set('Cookie', accessCookie).send({ categoryId, month, targetAmount: 5000 });
    await request(app).post('/api/locks').set('Cookie', accessCookie).send({ month });

    const res = await request(app)
      .put('/api/plans')
      .set('Cookie', accessCookie)
      .send({ categoryId, month, targetAmount: 6000 });

    expect(res.status).toBe(423);
  });

  it('allows creating a plan for an unlocked month', async () => {
    const { accessCookie, categoryId } = await setup();
    const month = getFutureMonth(2);
    const res = await request(app)
      .put('/api/plans')
      .set('Cookie', accessCookie)
      .send({ categoryId, month, targetAmount: 5000 });

    expect(res.status).toBe(200);
  });
});

describe('Lock enforcement on Actuals', () => {
  it('blocks logging an actual for a locked month with 423', async () => {
    const { accessCookie, categoryId } = await setup();
    await request(app).post('/api/locks').set('Cookie', accessCookie).send({ month: '2026-01' });

    const res = await request(app)
      .post('/api/actuals')
      .set('Cookie', accessCookie)
      .send({ categoryId, month: '2026-01', amount: 4800 });

    expect(res.status).toBe(423);
  });

  it('blocks CSV import if any row targets a locked month', async () => {
    const { accessCookie } = await setup();
    await request(app).post('/api/locks').set('Cookie', accessCookie).send({ month: '2026-01' });

    const csv = `month,category,amount\n2026-01,Marketing,4800`;
    const res = await request(app)
      .post('/api/actuals/import')
      .set('Cookie', accessCookie)
      .attach('file', Buffer.from(csv), 'actuals.csv');

    expect(res.status).toBe(423);
  });
});