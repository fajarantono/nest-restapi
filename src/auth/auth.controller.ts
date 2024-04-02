import { Controller, Body, Post, Get, HttpCode, HttpStatus, Request, UseGuards, SerializeOptions } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { LoginResponseType } from './types/login-response.type';
import { AuthGuard } from '@nestjs/passport';
import { NullableType } from '@/utils/types/nullable.type';
import { User } from '@/users/entities/user.entity';
@ApiTags('Auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @SerializeOptions({
    groups: ['me'],
  })
  @Post('email/login')
  @HttpCode(HttpStatus.OK)
  public login(@Body() loginDto: AuthEmailLoginDto): Promise<LoginResponseType> {
    return this.authService.validateLogin(loginDto);
  }

  @ApiBearerAuth()
  @SerializeOptions({
    groups: ['me'],
  })

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  public me(@Request() request): Promise<NullableType<User>> {
    return this.authService.me(request.user);
  }
}
