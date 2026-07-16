import bcrypt from 'bcrypt';
import { login } from './auth.controller';
import { getUserByEmail } from '../../../core/database';
import { generateToken } from '../middleware/auth.middleware';

jest.mock('../../../core/database', () => ({
  getUserByEmail: jest.fn(),
  createUser: jest.fn(),
}));

jest.mock('../middleware/auth.middleware', () => ({
  generateToken: jest.fn(() => 'fake-token'),
}));

describe('auth controller login', () => {
  it('accepts a user whose password is stored as a bcrypt hash', async () => {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    (getUserByEmail as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'admin@forecastai.com',
      name: 'Admin',
      password: hashedPassword,
    });

    const req = {
      body: { email: 'admin@forecastai.com', password: 'admin123' },
    } as any;
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as any;
    const next = jest.fn();

    await login(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        token: 'fake-token',
        user: expect.objectContaining({ email: 'admin@forecastai.com' }),
      })
    );
    expect(generateToken).toHaveBeenCalledWith('user-1', 'admin@forecastai.com');
  });
});
