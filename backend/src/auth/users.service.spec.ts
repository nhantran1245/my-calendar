import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { PASSWORD_CHANGED_MESSAGE } from '../constants';
import { RefreshToken } from './refresh-token.entity';
import { User } from './user.entity';
import { UsersService } from './users.service';

type MockRepository<T> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const mockUserRepo = (): MockRepository<User> => ({
  findOneBy: jest.fn(),
  save: jest.fn(),
});

const mockTokenRepo = (): MockRepository<RefreshToken> & { createQueryBuilder: jest.Mock } => ({
  createQueryBuilder: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: MockRepository<User>;
  let tokenRepo: MockRepository<RefreshToken> & { createQueryBuilder: jest.Mock };

  const hashedPassword = '$2b$10$placeholder';

  const mockUser: User = {
    id: 'user-uuid-1',
    username: 'john_doe',
    email: 'john@example.com',
    passwordHash: hashedPassword,
    displayName: 'John Doe',
    bio: 'A test user.',
    avatarUrl: null,
    timezone: 'UTC',
    dndUntil: null,
    notificationEnabled: true,
    pushToken: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    refreshTokens: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useFactory: mockUserRepo },
        { provide: getRepositoryToken(RefreshToken), useFactory: mockTokenRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepo = module.get(getRepositoryToken(User));
    tokenRepo = module.get(getRepositoryToken(RefreshToken));
  });

  describe('getProfile', () => {
    it('returns full user profile for existing user', async () => {
      userRepo.findOneBy!.mockResolvedValue(mockUser);

      const result = await service.getProfile('user-uuid-1');

      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        display_name: mockUser.displayName,
        bio: mockUser.bio,
        avatar_url: mockUser.avatarUrl,
        timezone: mockUser.timezone,
        created_at: mockUser.createdAt,
      });
    });

    it('throws NotFoundException when user does not exist', async () => {
      userRepo.findOneBy!.mockResolvedValue(null);
      await expect(service.getProfile('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('updates profile fields and returns updated profile', async () => {
      const updatedUser: User = {
        ...mockUser,
        displayName: 'Jane Doe',
        bio: 'Updated bio.',
        timezone: 'America/New_York',
      };
      userRepo.findOneBy!.mockResolvedValue({ ...mockUser });
      userRepo.save!.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('user-uuid-1', {
        display_name: 'Jane Doe',
        bio: 'Updated bio.',
        timezone: 'America/New_York',
      });

      expect(result.display_name).toBe('Jane Doe');
      expect(result.bio).toBe('Updated bio.');
      expect(result.timezone).toBe('America/New_York');
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('only updates provided fields (partial update)', async () => {
      const originalUser = { ...mockUser };
      userRepo.findOneBy!.mockResolvedValue(originalUser);
      userRepo.save!.mockImplementation(async (u: User) => u);

      await service.updateProfile('user-uuid-1', { bio: 'New bio only.' });

      const saved = userRepo.save!.mock.calls[0][0] as User;
      expect(saved.bio).toBe('New bio only.');
      expect(saved.displayName).toBe(mockUser.displayName); // unchanged
      expect(saved.timezone).toBe(mockUser.timezone); // unchanged
    });

    it('throws NotFoundException when user does not exist', async () => {
      userRepo.findOneBy!.mockResolvedValue(null);
      await expect(
        service.updateProfile('non-existent', { display_name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('changePassword', () => {
    it('changes password, revokes all tokens, returns success message', async () => {
      const currentPassword = 'OldPass123';
      const hashed = await bcrypt.hash(currentPassword, 10);
      userRepo.findOneBy!.mockResolvedValue({ ...mockUser, passwordHash: hashed });
      userRepo.save!.mockResolvedValue({});

      const updateMock = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };
      tokenRepo.createQueryBuilder!.mockReturnValue(updateMock);

      const result = await service.changePassword('user-uuid-1', {
        current_password: currentPassword,
        new_password: 'NewPass456!',
      });

      expect(result.message).toBe(PASSWORD_CHANGED_MESSAGE);
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ passwordHash: expect.any(String) }),
      );
      expect(updateMock.execute).toHaveBeenCalled();
    });

    it('throws NotFoundException when user does not exist', async () => {
      userRepo.findOneBy!.mockResolvedValue(null);

      await expect(
        service.changePassword('ghost', { current_password: 'any', new_password: 'NewPass1!' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws UnauthorizedException on wrong current password', async () => {
      const hashed = await bcrypt.hash('CorrectPass1', 10);
      userRepo.findOneBy!.mockResolvedValue({ ...mockUser, passwordHash: hashed });

      await expect(
        service.changePassword('user-uuid-1', {
          current_password: 'WrongPass1',
          new_password: 'NewPass456!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('hashes the new password before saving', async () => {
      const currentPassword = 'OldPass123';
      const hashed = await bcrypt.hash(currentPassword, 10);
      userRepo.findOneBy!.mockResolvedValue({ ...mockUser, passwordHash: hashed });
      userRepo.save!.mockImplementation(async (u) => u);

      const updateMock = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };
      tokenRepo.createQueryBuilder!.mockReturnValue(updateMock);

      await service.changePassword('user-uuid-1', {
        current_password: currentPassword,
        new_password: 'NewPass456!',
      });

      const savedUser = userRepo.save!.mock.calls[0][0] as User;
      const isNewHash = await bcrypt.compare('NewPass456!', savedUser.passwordHash);
      expect(isNewHash).toBe(true);
    });
  });
});
