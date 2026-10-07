import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tizimga kirish (Xodimlar uchun login)' })
  @ApiResponse({ status: 200, description: 'Muvaffaqiyatli tizimga kirdi' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
