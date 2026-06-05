import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import {
  ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  LOGOUT_ALL_MESSAGE,
  LOGOUT_SUCCESS_MESSAGE,
  TOKEN_TYPE_BEARER,
} from '../constants';
import { AuthService } from './auth.service';
import { RefreshToken } from './refresh-token.entity';
import { User } from './user.entity';

type MockRepository<T> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const mockUserRepo = (): MockRepository<User> => ({
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockTokenRepo = (): MockRepository<RefreshToken> & { createQueryBuilder: jest.Mock } => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockUser: User = {
  id: 'user-uuid-1',
  username: 'john_doe',
  email: 'john@example.com',
  passwordHash: '$2b$10$hashedpassword',
  displayName: 'John Doe',
  bio: null,
  avatarUrl: null,
  timezone: 'UTC',
  dndUntil: null,
  notificationEnabled: true,
  pushToken: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  refreshTokens: [],
};

const mockToken: RefreshToken = {
  id: 'token-uuid-1',
  userId: 'user-uuid-1',
  token: 'raw-refresh-token',
  userAgent: null,
  ipAddress: null,
  lastUsedAt: null,
  revokedAt: null,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date(),
  user: mockUser,
};

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: MockRepository<User>;
  let tokenRepo: MockRepository<RefreshToken> & { createQueryBuilder: jest.Mock };
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useFactory: mockUserRepo,
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useFactory: mockTokenRepo,
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('signed-jwt') },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-secret') },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    tokenRepo = module.get(getRepositoryToken(RefreshToken));
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('register', () => {
    it('creates user and returns auth tokens on success', async () => {
      userRepo.findOne!.mockResolvedValue(null);
      userRepo.create!.mockReturnValue(mockUser);
      userRepo.save!.mockResolvedValue(mockUser);
      tokenRepo.create!.mockReturnValue(mockToken);
      tokenRepo.save!.mockResolvedValue(mockToken);

      const result = await service.register(
        { username: 'john_doe', email: 'john@example.com', password: 'Pass123!' },
        null,
        null,
      );

      expect(result.token_type).toBe(TOKEN_TYPE_BEARER);
      expect(result.expires_in).toBe(ACCESS_TOKEN_EXPIRES_IN_SECONDS);
      expect(result.access_token).toBe('signed-jwt');
      expect(typeof result.refresh_token).toBe('string');
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('throws ConflictException when username already taken', async () => {
      userRepo.findOne!.mockResolvedValue({ ...mockUser, username: 'john_doe' });

      await expect(
        service.register(
          { username: 'john_doe', email: 'new@example.com', password: 'Pass123!' },
          null,
          null,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when email already taken', async () => {
      userRepo.findOne!.mockResolvedValue({ ...mockUser, username: 'other', email: 'john@example.com' });

      await expect(
        service.register(
          { username: 'newuser', email: 'john@example.com', password: 'Pass123!' },
          null,
          null,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('returns auth tokens on valid credentials', async () => {
      const hashed = await bcrypt.hash('Pass123!', 10);
      userRepo.findOne!.mockResolvedValue({ ...mockUser, passwordHash: hashed });
      tokenRepo.create!.mockReturnValue(mockToken);
      tokenRepo.save!.mockResolvedValue(mockToken);

      const result = await service.login(
        { username_or_email: 'john_doe', password: 'Pass123!' },
        null,
        null,
      );

      expect(result.token_type).toBe(TOKEN_TYPE_BEARER);
      expect(result.access_token).toBe('signed-jwt');
    });

    it('throws UnauthorizedException when user not found', async () => {
      userRepo.findOne!.mockResolvedValue(null);

      await expect(
        service.login({ username_or_email: 'ghost', password: 'Pass123!' }, null, null),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException on wrong password', async () => {
      const hashed = await bcrypt.hash('CorrectPass1', 10);
      userRepo.findOne!.mockResolvedValue({ ...mockUser, passwordHash: hashed });

      await expect(
        service.login({ username_or_email: 'john_doe', password: 'WrongPass1' }, null, null),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('revokes token and returns success message', async () => {
      tokenRepo.findOne!.mockResolvedValue({ ...mockToken });
      tokenRepo.save!.mockResolvedValue({});

      const result = await service.logout('raw-refresh-token');
      expect(result.message).toBe(LOGOUT_SUCCESS_MESSAGE);
      expect(tokenRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ revokedAt: expect.any(Date) }),
      );
    });

    it('throws UnauthorizedException when token not found', async () => {
      tokenRepo.findOne!.mockResolvedValue(null);
      await expect(service.logout('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when token already revoked', async () => {
      tokenRepo.findOne!.mockResolvedValue({ ...mockToken, revokedAt: new Date() });
      await expect(service.logout('raw-refresh-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when token expired', async () => {
      tokenRepo.findOne!.mockResolvedValue({
        ...mockToken,
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(service.logout('raw-refresh-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logoutAll', () => {
    it('revokes all user tokens and returns message', async () => {
      const updateMock = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };
      tokenRepo.createQueryBuilder!.mockReturnValue(updateMock);

      const result = await service.logoutAll('user-uuid-1');
      expect(result.message).toBe(LOGOUT_ALL_MESSAGE);
      expect(updateMock.execute).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('issues new access token and returns same refresh token', async () => {
      tokenRepo.findOne!.mockResolvedValue({ ...mockToken });
      tokenRepo.save!.mockResolvedValue({});

      const result = await service.refresh('raw-refresh-token');
      expect(result.access_token).toBe('signed-jwt');
      expect(result.refresh_token).toBe('raw-refresh-token');
      expect(result.token_type).toBe(TOKEN_TYPE_BEARER);
      expect(result.expires_in).toBe(ACCESS_TOKEN_EXPIRES_IN_SECONDS);
    });

    it('throws UnauthorizedException when token not found', async () => {
      tokenRepo.findOne!.mockResolvedValue(null);
      await expect(service.refresh('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when token revoked', async () => {
      tokenRepo.findOne!.mockResolvedValue({ ...mockToken, revokedAt: new Date() });
      await expect(service.refresh('raw-refresh-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when token expired', async () => {
      tokenRepo.findOne!.mockResolvedValue({
        ...mockToken,
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(service.refresh('raw-refresh-token')).rejects.toThrow(UnauthorizedException);
    });

    it('updates lastUsedAt on valid refresh', async () => {
      const token = { ...mockToken, lastUsedAt: null };
      tokenRepo.findOne!.mockResolvedValue(token);
      tokenRepo.save!.mockResolvedValue({});

      await service.refresh('raw-refresh-token');
      expect(tokenRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ lastUsedAt: expect.any(Date) }),
      );
    });
  });
});
