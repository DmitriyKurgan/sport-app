import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Хранит SHA-256 хэши password-reset токенов (raw токен живёт только в email).
 * Single-use: после успешного reset проставляется usedAt.
 * TTL — 30 минут (проверка expiresAt при validate).
 */
@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_prt_user')
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Index('idx_prt_token_hash', { unique: true })
  @Column({ name: 'token_hash', type: 'varchar', length: 64 })
  tokenHash!: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt!: Date;

  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  usedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
