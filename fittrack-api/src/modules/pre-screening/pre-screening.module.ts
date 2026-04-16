import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { PreScreeningController } from './pre-screening.controller';
import { PreScreening } from './pre-screening.entity';
import { PreScreeningService } from './pre-screening.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PreScreening]),
    UserModule, // нужен JwtAuthGuard + JwtStrategy
  ],
  providers: [PreScreeningService],
  controllers: [PreScreeningController],
  exports: [PreScreeningService],
})
export class PreScreeningModule {}
