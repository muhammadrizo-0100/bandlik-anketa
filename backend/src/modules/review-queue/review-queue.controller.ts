import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewQueueService } from './review-queue.service';
import { FilterQueueDto } from './dto/filter-queue.dto';
import { ResolveSurveyDto } from './dto/resolve-survey.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../../database/entities/user.entity';
import { UserRole } from '../../database/enums';

@ApiTags('Review Queue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('review-queue')
export class ReviewQueueController {
  constructor(private readonly reviewQueueService: ReviewQueueService) {}

  @Get()
  @Roles(
    UserRole.DATA_REVIEWER,
    UserRole.SUPER_ADMIN,
    UserRole.DISTRICT_ADMIN,
    UserRole.MAHALLA_OPERATOR,
  )
  @ApiOperation({
    summary: 'Tekshiruv kutayotgan ziddiyatli va dublikat anketalar ro\'yxati',
  })
  getQueue(
    @Query() filterDto: FilterQueueDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.reviewQueueService.getQueue(filterDto, user);
  }

  @Get('count')
  @Roles(
    UserRole.DATA_REVIEWER,
    UserRole.SUPER_ADMIN,
    UserRole.DISTRICT_ADMIN,
    UserRole.MAHALLA_OPERATOR,
  )
  @ApiOperation({
    summary: 'Tekshiruv kutayotgan anketalar umumiy soni (Dashboard bildirishnomasi uchun)',
  })
  getPendingCount(@CurrentUser() user: UserEntity) {
    return this.reviewQueueService.getPendingCount(user);
  }

  @Get(':id')
  @Roles(
    UserRole.DATA_REVIEWER,
    UserRole.SUPER_ADMIN,
    UserRole.DISTRICT_ADMIN,
    UserRole.MAHALLA_OPERATOR,
  )
  @ApiOperation({
    summary: 'Bitta tekshiruv elementi: yangi anketa va amaldagi fuqaro taqqoslashi',
  })
  getQueueItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewQueueService.getQueueItem(id);
  }

  @Post(':id/resolve')
  @Roles(
    UserRole.DATA_REVIEWER,
    UserRole.SUPER_ADMIN,
    UserRole.DISTRICT_ADMIN,
    UserRole.MAHALLA_OPERATOR,
  )
  @ApiOperation({
    summary: 'Ziddiyatli anketani tekshirib tasdiqlash yoki rad etish',
  })
  resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveSurveyDto,
    @CurrentUser() reviewer: UserEntity,
  ) {
    return this.reviewQueueService.resolve(id, dto, reviewer);
  }
}
