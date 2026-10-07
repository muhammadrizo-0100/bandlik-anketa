import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum ReviewAction {
  APPROVE_UPDATE = 'APPROVE_UPDATE', // Yangi anketadagi ma'lumotlarni qabul qilish va fuqaroni yangilash
  REJECT = 'REJECT',                 // Yangi anketani rad etish (asossiz/xato deb topish)
}

export class ResolveSurveyDto {
  @ApiProperty({
    enum: ReviewAction,
    example: ReviewAction.APPROVE_UPDATE,
    description: 'Qabul qilingan qaror: Yangilashni tasdiqlash yoki Rad etish',
  })
  @IsEnum(ReviewAction, { message: 'Yaroqli tekshiruv qarorini tanlang' })
  @IsNotEmpty({ message: 'Qaror tanlanishi shart' })
  action: ReviewAction;

  @ApiPropertyOptional({
    example: 'Maʼlumotlar toʻgʻriligi tekshirildi va tasdiqlandi.',
    description: 'Tekshiruvchi xulosasi va izohi (ixtiyoriy)',
  })
  @IsOptional()
  @IsString()
  reviewerNote?: string;
}
