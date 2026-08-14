import { connectTestDb, clearTestDb, closeTestDb } from '../setup/testDb';
import * as authService from '../../src/modules/auth/auth.service';
import { AuthError } from '../../src/modules/auth/auth.service';

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
      .rejects.toThrow(AuthError);
  });
});

describe('authService.login', () => {
  it('returns a token for correct credentials', async () => {
    await authService.signup('joy@example.com', 'password123');
    const { token } = await authService.login('joy@example.com', 'password123');
    expect(typeof token).toBe('string');
  });

  it('rejects wrong password', async () => {
    await authService.signup('joy@example.com', 'password123');
    await expect(authService.login('joy@example.com', 'wrongpass'))
      .rejects.toThrow(AuthError);
  });

  it('rejects unknown email', async () => {
    await expect(authService.login('nobody@example.com', 'password123'))
      .rejects.toThrow(AuthError);
  });
});