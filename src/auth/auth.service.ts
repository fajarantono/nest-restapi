import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import ms from 'ms';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { LoginResponseType } from './types/login-response.type';
import { UsersService } from '@/users/users.service';
import { User } from '@/users/entities/user.entity';
import { AuthProvidersEnum } from './auth-providers.enum';
import { SessionService } from '@/session/session.service';
import { Session } from '@/session/entities/session.entity';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@/config/config.type';
import { JwtPayloadType } from './strategies/types/jwt-payload.type';
import { NullableType } from '@/utils/types/nullable.type';
import { JwtRefreshPayloadType } from './strategies/types/jwt-refresh-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private sessionService: SessionService,
    private configService: ConfigService<AllConfigType>,
  ) { }

  async validateLogin(loginDto: AuthEmailLoginDto): Promise<LoginResponseType> {
    try {
      const user = await this.usersService.findOne({
        email: loginDto.email,
      });

      if (!user) {
        throw new HttpException(
          {
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            errors: {
              email: 'notFound',
            },
          },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      if (user.provider !== AuthProvidersEnum.email) {
        throw new HttpException(
          {
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            errors: {
              email: `needLoginViaProvider:${user.provider}`,
            },
          },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      const isValidPassword = await bcrypt.compare(loginDto.password, user.password);

      if (!isValidPassword) {
        throw new HttpException(
          {
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            errors: {
              password: 'incorrectPassword',
            },
          },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      const session = await this.sessionService.create({
        user,
      });

      const { token, refreshToken, tokenExpires } = await this.getTokensData({
        id: user.id,
        role: user.role,
        sessionId: session.id,
      });

      return {
        refreshToken,
        token,
        tokenExpires,
        user,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async me(userJwtPayload: JwtPayloadType): Promise<NullableType<User>> {
    return this.usersService.findOne({
      id: userJwtPayload.id,
    });
  }

  async refreshToken(
    data: Pick<JwtRefreshPayloadType, 'sessionId'>,
  ): Promise<Omit<LoginResponseType, 'user'>> {
    const session = await this.sessionService.findOne({
      where: {
        id: data.sessionId,
      },
    });

    if (!session) {
      throw new UnauthorizedException();
    }

    const { token, refreshToken, tokenExpires } = await this.getTokensData({
      id: session.user.id,
      role: session.user.role,
      sessionId: session.id,
    });

    return {
      token,
      refreshToken,
      tokenExpires,
    };
  }

  async logout(data: Pick<JwtRefreshPayloadType, 'sessionId'>) {
    return this.sessionService.softDelete({
      id: data.sessionId,
    });
  }

  private async getTokensData(data: { id: User['id']; role: User['role']; sessionId: Session['id'] }) {
    const tokenExpiresIn = this.configService.getOrThrow('auth.expires', {
      infer: true,
    });

    const tokenExpires = Date.now() + ms(tokenExpiresIn);

    const [token, refreshToken] = await Promise.all([
      await this.jwtService.signAsync(
        {
          id: data.id,
          role: data.role,
          sessionId: data.sessionId,
        },
        {
          secret: this.configService.getOrThrow('auth.secret', { infer: true }),
          expiresIn: tokenExpiresIn,
        },
      ),
      await this.jwtService.signAsync(
        {
          sessionId: data.sessionId,
        },
        {
          secret: this.configService.getOrThrow('auth.refreshSecret', {
            infer: true,
          }),
          expiresIn: this.configService.getOrThrow('auth.refreshExpires', {
            infer: true,
          }),
        },
      ),
    ]);

    return {
      token,
      refreshToken,
      tokenExpires,
    };
  }
}
