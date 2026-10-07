import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { UserEntity } from '../../database/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByUsernameOrEmail(loginDto.username);
    if (!user) {
      throw new UnauthorizedException('Login yoki parol noto\'g\'ri');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Login yoki parol noto\'g\'ri');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Hisobingiz nofaol holatda. Administratorga murojaat qiling');
    }

    return this.generateTokens(user);
  }

  private async generateTokens(user: UserEntity) {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.roleCode,
      mahallaId: user.mahallaId,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret:
        this.configService.get<string>('jwt.refreshSecret') ||
        'super_secret_refresh_jwt_key_bandlik_monitoring_2026',
      expiresIn: (this.configService.get<string>('jwt.refreshExpiresIn') ||
        '7d') as any,
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.roleCode,
        roleName: user.role?.name,
        districtId: user.districtId,
        districtName: user.district?.name,
        mahallaId: user.mahallaId,
        mahallaName: user.mahalla?.name,
        phone: user.phone,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }
}
