import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreScreeningModule } from '../pre-screening/pre-screening.module';
import { UserModule } from '../user/user.module';
import { ProfileController } from './profile.controller';
import { Profile } from './profile.entity';
import { ProfileService } from './profile.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Profile]),
    UserModule, // JwtAuthGuard
    PreScreeningModule, // PreScreeningService для синка redFlags
  ],
  providers: [ProfileService],
  controllers: [ProfileController],
  exports: [ProfileService],
})
export class ProfileModule {}
