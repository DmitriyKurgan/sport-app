import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileModule } from '../profile/profile.module';
import { UserModule } from '../user/user.module';
import { BodyTypeController } from './body-type.controller';
import { BodyTypeSnapshot } from './body-type.entity';
import { BodyTypeService } from './body-type.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([BodyTypeSnapshot]),
    UserModule, // JwtAuthGuard
    ProfileModule, // ProfileService для gatherInputs
  ],
  providers: [BodyTypeService],
  controllers: [BodyTypeController],
  exports: [BodyTypeService],
})
export class BodyTypeModule {}
