import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BodyTypeModule } from '../body-type/body-type.module';
import { ProfileModule } from '../profile/profile.module';
import { UserModule } from '../user/user.module';
import { AvatarController } from './avatar.controller';
import { AvatarSnapshot } from './avatar.entity';
import { AvatarService } from './avatar.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AvatarSnapshot]),
    UserModule,
    ProfileModule,
    BodyTypeModule,
  ],
  providers: [AvatarService],
  controllers: [AvatarController],
  exports: [AvatarService],
})
export class AvatarModule {}
