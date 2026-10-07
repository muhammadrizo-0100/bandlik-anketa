import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  ValidateIf,
} from 'class-validator';
import {
  SurveyMethod,
  EmploymentCategory,
  NoWishReason,
  UnemployedDirection,
} from '../../../database/enums';

export class CreateSurveyDto {
  // ========================================================
  // I. SO'ROVNOMA VA HUDUD MA'LUMOTLARI
  // ========================================================
  @ApiPropertyOptional({
    description: 'Tuman ID',
  })
  @IsOptional()
  @IsUUID('4')
  districtId?: string;

  @ApiPropertyOptional({
    description: 'Mahalla ID (Operator uchun avtomatik to\'ldiriladi)',
  })
  @IsOptional()
  @IsUUID('4')
  mahallaId?: string;

  @ApiPropertyOptional({
    description: 'Mahalla ro\'yxatda bo\'lmasa, qo\'lda kiritilgan nomi',
  })
  @IsOptional()
  @IsString()
  customMahallaName?: string;

  @ApiProperty({
    enum: SurveyMethod,
    example: SurveyMethod.HOME_VISIT,
    description: 'O\'rganish shakli: Uyma-uy, Telefon, Qabulda',
  })
  @IsEnum(SurveyMethod, { message: 'Yaroqli o\'rganish shaklini tanlang' })
  @IsNotEmpty({ message: 'O\'rganish shakli majburiy' })
  surveyMethod: SurveyMethod;

  @ApiProperty({ example: '2026-10-03', description: 'So\'rovnoma sanasi' })
  @IsDateString({}, { message: 'Sana yaroqli formatda bo\'lishi kerak (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'So\'rovnoma sanasi majburiy' })
  surveyDate: string;

  // ========================================================
  // II. FUQARONING SHAXSIY MA'LUMOTLARI
  // ========================================================
  @ApiProperty({ example: 'Rustamov Jasur Anvar o\'g\'li', description: 'F.I.Sh.' })
  @IsString()
  @IsNotEmpty({ message: 'F.I.Sh. kiritilishi majburiy' })
  @Matches(/^[a-zA-Zа-яА-ЯёЁўЎқҚғҒҳҲʻʼ'\s-]+$/, {
    message: 'F.I.Sh. faqat harflardan iborat bo\'lishi shart (raqamlar kiritish taqiqlangan)',
  })
  fullName: string;

  @ApiProperty({ example: '2002-05-14', description: 'Tug\'ilgan sana' })
  @IsDateString({}, { message: 'Tug\'ilgan sana yaroqli formatda bo\'lishi kerak (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'Tug\'ilgan sana majburiy' })
  birthDate: string;

  @ApiProperty({
    example: '31405021234567',
    description: 'JSHSHIR (Qat\'iy 14 ta raqam, 3-6 bilan boshlanadi)',
  })
  @IsString()
  @IsNotEmpty({ message: 'JSHSHIR kiritilishi majburiy' })
  @Matches(/^[3-6]\d{13}$/, {
    message: 'JSHSHIR qat\'iy 14 ta raqamdan iborat bo\'lishi va 3, 4, 5 yoki 6 bilan boshlanishi shart',
  })
  pinfl: string;

  @ApiProperty({ example: 'Davlatobod tumani, Guliston MFY, Shodlik ko\'chasi 12-uy' })
  @IsString()
  @IsNotEmpty({ message: 'Yashash manzili kiritilishi majburiy' })
  @Matches(/[a-zA-Zа-яА-ЯёЁўЎқҚғҒҳҲ]/, {
    message: 'Yashash manzili faqat raqamlardan iborat bo\'lishi mumkin emas. Ko\'cha va uy nomini yozing',
  })
  address: string;

  @ApiProperty({ example: 'Namangan Davlat Universiteti (Bakalavr)' })
  @IsString()
  @IsNotEmpty({ message: 'Qaysi ta\'lim muassasasini tugatganligi majburiy' })
  @Matches(/[a-zA-Zа-яА-ЯёЁўЎқҚғҒҳҲ]/, {
    message: 'Ta\'lim muassasasi nomi faqat raqamlardan iborat bo\'lishi mumkin emas',
  })
  education: string;

  @ApiPropertyOptional({ example: '+998901234567', description: 'Fuqaroning telefoni' })
  @IsOptional()
  @IsString()
  @Matches(/^(\+998\s?\(?\d{2}\)?\s?\d{3}[-\s]?\d{2}[-\s]?\d{2}|\+998\d{9})$/, {
    message: 'Telefon raqami O\'zbekiston formatida (+998 XX XXX-XX-XX) bo\'lishi shart',
  })
  phone?: string;

  @ApiPropertyOptional({ example: '+998912345678', description: 'Ota-onasi yoki vasiysi telefoni' })
  @IsOptional()
  @IsString()
  @Matches(/^(\+998\s?\(?\d{2}\)?\s?\d{3}[-\s]?\d{2}[-\s]?\d{2}|\+998\d{9})$/, {
    message: 'Ota-ona telefon raqami O\'zbekiston formatida (+998 XX XXX-XX-XX) bo\'lishi shart',
  })
  parentPhone?: string;

  @ApiPropertyOptional({ example: 'Dasturiy injiniring', description: 'Mutaxassisligi' })
  @IsOptional()
  @IsString()
  specialty?: string;

  // ========================================================
  // III. BANDLIK HOLATI (2.1 - 2.5 QAT'IY BITTA KATEGORIYA)
  // ========================================================
  @ApiProperty({
    enum: EmploymentCategory,
    example: EmploymentCategory.OFFICIALLY_EMPLOYED,
    description: '2.1 - 2.5 asosiy bandlik toifasi',
  })
  @IsEnum(EmploymentCategory, { message: 'Yaroqli bandlik kategoriyasini tanlang' })
  @IsNotEmpty({ message: 'Bandlik toifasi tanlanishi shart' })
  mainCategory: EmploymentCategory;

  // --- 2.1. Rasmiy band bo'lsa -> Ish joyi va lavozimi (Majburiy) ---
  @ApiPropertyOptional({
    example: 'IT Park rezident korxonasi, Backend dasturchi',
    description: '2.1. Ish joyi va lavozimi',
  })
  @ValidateIf((o) => o.mainCategory === EmploymentCategory.OFFICIALLY_EMPLOYED)
  @IsNotEmpty({
    message: 'Rasmiy band holatida "Ish joyi va lavozimi" kiritilishi shart',
  })
  @Matches(/[a-zA-Zа-яА-ЯёЁўЎқҚғҒҳҲ]/, {
    message: 'Ish joyi va lavozimi faqat raqamlardan iborat bo\'lishi mumkin emas',
  })
  @IsString()
  officialWorkplace?: string;

  // --- 2.2. O'zini o'zi band qilgan bo'lsa -> Faoliyat turi va soliq ro'yxati ---
  @ApiPropertyOptional({
    example: 'Hunarmandchilik / Repetitorlik / Taksi',
    description: '2.2. O\'zini o\'zi band qilganlik faoliyat turi',
  })
  @ValidateIf((o) => o.mainCategory === EmploymentCategory.SELF_EMPLOYED)
  @IsNotEmpty({
    message: 'O\'zini o\'zi band qilgan toifasida "Faoliyat yo\'nalishi" kiritilishi shart',
  })
  @IsString()
  selfEmployedActivity?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Soliq organlaridan o\'zini o\'zi band qilgan sifatida ro\'yxatdan o\'tganmi',
  })
  @IsOptional()
  @IsBoolean()
  selfEmployedRegistered?: boolean;

  // --- 2.3. Norasmiy band bo'lsa -> Faoliyat turi (Majburiy) ---
  @ApiPropertyOptional({
    example: 'Mavsumiy qurilish ishlari / Frilanserlik',
    description: '2.3. Faoliyat turi',
  })
  @ValidateIf((o) => o.mainCategory === EmploymentCategory.UNOFFICIALLY_EMPLOYED)
  @IsNotEmpty({
    message: 'Norasmiy band holatida "Faoliyat turi" kiritilishi shart',
  })
  @Matches(/[a-zA-Zа-яА-ЯёЁўЎқҚғҒҳҲ]/, {
    message: 'Norasmiy faoliyat turi faqat raqamlardan iborat bo\'lishi mumkin emas',
  })
  @IsString()
  unofficialActivityType?: string;

  // --- 2.4. Migrant bo'lsa -> Qaysi davlat va muddati ---
  @ApiPropertyOptional({
    example: 'Rossiya',
    description: '2.4. Migratsiyadagi davlat nomi',
  })
  @ValidateIf((o) => o.mainCategory === EmploymentCategory.MIGRANT)
  @IsNotEmpty({
    message: 'Migrant toifasida davlat nomi kiritilishi shart',
  })
  @IsString()
  migrantCountry?: string;

  @ApiPropertyOptional({
    example: 'Mavsumiy',
    description: 'Ketgan muddati yoki rejasi',
  })
  @IsOptional()
  @IsString()
  migrantDuration?: string;

  // --- 2.3. Ishlash istagi yo'q bo'lsa -> Sababi (Majburiy) ---
  @ApiPropertyOptional({
    enum: NoWishReason,
    example: NoWishReason.CHILD_CARE,
    description: '2.3. Ishlash istagi yo\'qligi sababi',
  })
  @ValidateIf((o) => o.mainCategory === EmploymentCategory.NO_WISH_TO_WORK)
  @IsNotEmpty({
    message: 'Ishlash istagi yo\'qligi tanlanganda sabab ko\'rsatilishi shart',
  })
  @IsEnum(NoWishReason, { message: 'Yaroqli sababni tanlang' })
  noWishReason?: NoWishReason;

  // --- 2.4. Ishsiz yosh bo'lsa -> Talab qilinadigan yo'nalishlar (Majburiy array) ---
  @ApiPropertyOptional({
    type: [String],
    enum: UnemployedDirection,
    example: [UnemployedDirection.PERMANENT_JOB, UnemployedDirection.VOCATIONAL_TRAINING],
    description: '2.4. Talab qilinadigan yo\'nalishlar ro\'yxati',
  })
  @ValidateIf((o) => o.mainCategory === EmploymentCategory.UNEMPLOYED)
  @IsArray({ message: 'Ishsiz holatida yo\'nalishlar ro\'yxat shaklida bo\'lishi kerak' })
  @IsNotEmpty({ message: 'Ishsiz holatida kamida bitta yo\'nalish tanlanishi shart' })
  unemployedDirections?: UnemployedDirection[];

  @ApiPropertyOptional({
    example: 'Qo\'shimcha ingliz tili kurslariga yo\'llanma',
    description: '2.4. Qo\'shimcha yo\'nalish yoki izoh',
  })
  @IsOptional()
  @IsString()
  unemployedAdditionalNote?: string;

  // --- 2.5. Boshqa bo'lsa -> Izoh (Majburiy) ---
  @ApiPropertyOptional({
    example: 'Harbiy xizmatda / Davolanishda',
    description: '2.5. Boshqa sabab izohi',
  })
  @ValidateIf((o) => o.mainCategory === EmploymentCategory.OTHER)
  @IsNotEmpty({ message: 'Boshqa holati tanlanganda izoh yozilishi shart' })
  @IsString()
  otherReasonNote?: string;

  // ========================================================
  // IV. IMZOLAR VA TASDIQ
  // ========================================================
  @ApiPropertyOptional({ default: true, description: 'Fuqaro imzosi borligi' })
  @IsOptional()
  @IsBoolean()
  citizenSigned?: boolean;

  @ApiPropertyOptional({ default: true, description: 'Yetakchi imzosi borligi' })
  @IsOptional()
  @IsBoolean()
  operatorSigned?: boolean;
}
