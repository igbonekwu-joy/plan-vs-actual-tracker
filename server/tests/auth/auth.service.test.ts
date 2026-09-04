import { connectTestDb, clearTestDb, closeTestDb } from '../setup/testDb';
import * as authService from '../../src/modules/auth/auth.service';
import { HttpError } from '../../src/errors/HttpError';

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

describe('authService.signup', () => {
  it('creates a user with a hashed password', async () => {
    const user = await authService.signup('joy@example.com', 'password123');
    expect(user.email).toBe('joy@example.com');
    expect(user.password).not.toBe('password123'); 
  });

  it('rejects duplicate emails', async () => {
    await authService.signup('joy@example.com', 'password123');
    await expect(authService.signup('joy@example.com', 'otherpass'))
      .rejects.toThrow(HttpError);
  });
});

describe('authService.login', () => {
  it('returns a token for correct credentials', async () => {
    await authService.signup('joy@example.com', 'password123');
    const { accessToken } = await authService.login('joy@example.com', 'password123');
    expect(typeof accessToken).toBe('string');
  });

  it('rejects wrong password', async () => {
    await authService.signup('joy@example.com', 'password123');
    await expect(authService.login('joy@example.com', 'wrongpass'))
      .rejects.toThrow(HttpError);
  });

  it('rejects unknown email', async () => {
    await expect(authService.login('nobody@example.com', 'password123'))
      .rejects.toThrow(HttpError);
  });
});