import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DEFAULT_TIMEZONE } from '../constants';
import { RefreshToken } from './refresh-token.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20, unique: true })
  username: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ name: 'display_name', length: 100, nullable: true, default: null })
  displayName: string | null;

  @Column({ name: 'bio', type: 'text', nullable: true, default: null })
  bio: string | null;

  @Column({ name: 'avatar_url', length: 2048, nullable: true, default: null })
  avatarUrl: string | null;

  @Column({ name: 'timezone', length: 63, default: DEFAULT_TIMEZONE })
  timezone: string;

  @Column({ name: 'dnd_until', type: 'timestamptz', nullable: true, default: null })
  dndUntil: Date | null;

  @Column({ name: 'notification_enabled', default: true })
  notificationEnabled: boolean;

  @Column({ name: 'push_token', type: 'text', nullable: true, default: null })
  pushToken: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => RefreshToken, (token) => token.user, { cascade: true })
  refreshTokens: RefreshToken[];
}
