import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import {
  ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  BCRYPT_SALT_ROUNDS,
  JWT_ACCESS_TOKEN_EXPIRY,
  JWT_REFRESH_TOKEN_EXPIRY_DAYS,
  JWT_SECRET_ENV_KEY,
  LOGOUT_ALL_MESSAGE,
  LOGOUT_SUCCESS_MESSAGE,
  REFRESH_TOKEN_BYTES,
  TOKEN_TYPE_BEARER,
} from '../constants';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshToken } from './refresh-token.entity';
import { User } from './user.entity';

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly tokenRepo: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(
    dto: RegisterDto,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<AuthResponse> {
    const existing = await this.userRepo.findOne({
      where: [{ username: dto.username }, { email: dto.email }],
    });

    if (existing) {
      const field = existing.username === dto.username ? 'Username' : 'Email';
      throw new ConflictException(`${field} already taken.`);
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    const user = this.userRepo.create({
      username: dto.username,
      email: dto.email,
      passwordHash,
    });
    await this.userRepo.save(user);

    return this.issueTokens(user, ipAddress, userAgent);
  }

  async login(
    dto: LoginDto,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<AuthResponse> {
    const user = await this.userRepo.findOne({
      where: [{ username: dto.username_or_email }, { email: dto.username_or_email }],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return this.issueTokens(user, ipAddress, userAgent);
  }

  async logout(rawToken: string): Promise<{ message: string }> {
    const tokenRecord = await this.tokenRepo.findOne({
      where: { token: rawToken },
    });

    if (!tokenRecord || tokenRecord.revokedAt || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or revoked refresh token.');
    }

    tokenRecord.revokedAt = new Date();
    await this.tokenRepo.save(tokenRecord);

    return { message: LOGOUT_SUCCESS_MESSAGE };
  }

  async logoutAll(userId: string): Promise<{ message: string }> {
    await this.tokenRepo
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revokedAt: new Date() })
      .where('user_id = :userId AND revoked_at IS NULL', { userId })
      .execute();

    return { message: LOGOUT_ALL_MESSAGE };
  }

  async refresh(rawToken: string): Promise<AuthResponse> {
    const tokenRecord = await this.tokenRepo.findOne({
      where: { token: rawToken },
      relations: ['user'],
    });

    if (!tokenRecord || tokenRecord.revokedAt || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid, revoked, or expired refresh token.');
    }

    tokenRecord.lastUsedAt = new Date();
    await this.tokenRepo.save(tokenRecord);

    const accessToken = this.signAccessToken(tokenRecord.user);
    return {
      access_token: accessToken,
      refresh_token: rawToken,
      token_type: TOKEN_TYPE_BEARER,
      expires_in: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    };
  }

  private async issueTokens(
    user: User,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<AuthResponse> {
    const rawToken = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + JWT_REFRESH_TOKEN_EXPIRY_DAYS);

    const tokenRecord = this.tokenRepo.create({
      userId: user.id,
      token: rawToken,
      ipAddress,
      userAgent,
      expiresAt,
    });
    await this.tokenRepo.save(tokenRecord);

    return {
      access_token: this.signAccessToken(user),
      refresh_token: rawToken,
      token_type: TOKEN_TYPE_BEARER,
      expires_in: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    };
  }

  private signAccessToken(user: User): string {
    const secret = this.configService.get<string>(JWT_SECRET_ENV_KEY, 'dev-secret');
    return this.jwtService.sign(
      { sub: user.id, username: user.username },
      { secret, expiresIn: JWT_ACCESS_TOKEN_EXPIRY },
    );
  }
}
