import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Sse,
} from '@nestjs/common';
import { Observable, interval, merge } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SurveysService } from './surveys.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { FilterSurveyDto } from './dto/filter-survey.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../../database/entities/user.entity';
import { UserRole } from '../../database/enums';

@ApiTags('Surveys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('surveys')
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) {}

  @Public()
  @Sse('stream')
  @ApiOperation({
    summary: 'Real-time bildirishnomalar oqimi (Server-Sent Events)',
  })
  stream(): Observable<{ data: any }> {
    const heartbeat$ = interval(25000).pipe(
      map(() => ({ data: { type: 'HEARTBEAT', time: new Date().toISOString() } })),
    );
    const events$ = this.surveysService.surveyEvents$.pipe(
      map((event) => ({ data: event })),
    );
    return merge(events$, heartbeat$);
  }

  @Public()
  @Post('public')
  @ApiOperation({
    summary: 'Fuqaro tomonidan ochiq portaldan mustaqil anketa yuborish',
  })
  createPublic(@Body() createSurveyDto: CreateSurveyDto) {
    return this.surveysService.createPublic(createSurveyDto);
  }

  @Post()
  @Roles(UserRole.MAHALLA_OPERATOR, UserRole.SUPER_ADMIN, UserRole.DISTRICT_ADMIN)
  @ApiOperation({
    summary: 'Yangi so\'rovnoma (anketa) yuborish (Mahalla operatori yoki Admin)',
  })
  create(
    @Body() createSurveyDto: CreateSurveyDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.surveysService.create(createSurveyDto, user);
  }

  @Get()
  @Roles(
    UserRole.MAHALLA_OPERATOR,
    UserRole.SUPER_ADMIN,
    UserRole.DISTRICT_ADMIN,
    UserRole.DATA_REVIEWER,
  )
  @ApiOperation({
    summary: 'So\'rovnomalar ro\'yxati (Operator faqat o\'z mahallasini ko\'radi)',
  })
  findAll(
    @Query() filterDto: FilterSurveyDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.surveysService.findAll(filterDto, user);
  }

  @Get(':id')
  @Roles(
    UserRole.MAHALLA_OPERATOR,
    UserRole.SUPER_ADMIN,
    UserRole.DISTRICT_ADMIN,
    UserRole.DATA_REVIEWER,
  )
  @ApiOperation({ summary: 'So\'rovnoma haqida to\'liq ma\'lumot' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.surveysService.findOne(id, user);
  }
}
