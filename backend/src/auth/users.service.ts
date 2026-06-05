import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { BCRYPT_SALT_ROUNDS, PASSWORD_CHANGED_MESSAGE } from '../constants';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RefreshToken } from './refresh-token.entity';
import { User } from './user.entity';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  timezone: string;
  created_at: Date;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly tokenRepo: Repository<RefreshToken>,
  ) {}

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found.');
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.displayName,
      bio: user.bio,
      avatar_url: user.avatarUrl,
      timezone: user.timezone,
      created_at: user.createdAt,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserProfile> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found.');

    if (dto.display_name !== undefined) user.displayName = dto.display_name;
    if (dto.bio !== undefined) user.bio = dto.bio;
    if (dto.avatar_url !== undefined) user.avatarUrl = dto.avatar_url;
    if (dto.timezone !== undefined) user.timezone = dto.timezone;

    await this.userRepo.save(user);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.displayName,
      bio: user.bio,
      avatar_url: user.avatarUrl,
      timezone: user.timezone,
      created_at: user.createdAt,
    };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found.');

    const currentValid = await bcrypt.compare(dto.current_password, user.passwordHash);
    if (!currentValid) {
      throw new UnauthorizedException('Invalid current password.');
    }

    user.passwordHash = await bcrypt.hash(dto.new_password, BCRYPT_SALT_ROUNDS);
    await this.userRepo.save(user);

    await this.tokenRepo
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revokedAt: new Date() })
      .where('user_id = :userId AND revoked_at IS NULL', { userId })
      .execute();

    return { message: PASSWORD_CHANGED_MESSAGE };
  }

  async savePushToken(userId: string, pushToken: string | null): Promise<void> {
    await this.userRepo.update(userId, { pushToken });
  }
}
