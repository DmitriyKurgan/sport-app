import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './jwt.strategy';

export interface JwtPayloadWithToken extends JwtPayload {
  refreshToken: string;
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.refreshSecret')!,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload): JwtPayloadWithToken {
    const authHeader = req.get('authorization');
    const refreshToken = authHeader?.replace('Bearer ', '').trim();
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token отсутствует');
    }
    return { ...payload, refreshToken };
  }
}
