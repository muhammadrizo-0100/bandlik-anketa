import { Injectable, OnApplicationBootstrap, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RoleEntity } from './entities/role.entity';
import { DistrictEntity } from './entities/district.entity';
import { MahallaEntity } from './entities/mahalla.entity';
import { UserEntity } from './entities/user.entity';
import { UserRole } from './enums';

@Injectable()
export class SeedService implements OnModuleInit, OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);
  private hasInitialized = false;

  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(DistrictEntity)
    private readonly districtRepository: Repository<DistrictEntity>,
    @InjectRepository(MahallaEntity)
    private readonly mahallaRepository: Repository<MahallaEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async onModuleInit() {
    await this.initSeed();
  }

  async onApplicationBootstrap() {
    await this.initSeed();
  }

  private async initSeed() {
    if (
      process.env.SEED_ENABLED === 'false' ||
      process.env.NODE_ENV === 'production'
    )
      return;
    if (this.hasInitialized) return;
    this.hasInitialized = true;

    try {
      await this.upgradeEnumTypes();
      await this.seedRoles();
      const districts = await this.seedDistricts();
      await this.seedAllMahallas(districts);
      const davlatobod = districts.find(d => d.name === 'Davlatobod tumani');
      if (davlatobod) {
        await this.seedStaffUsers(davlatobod);
      }
      await this.seedSuperAdmin();
    } catch (error: any) {
      this.logger.warn(`Seed jarayonida ogohlantirish: ${error.message}`);
    }
  }

  /**
   * PostgreSQL ENUM turlariga SELF_EMPLOYED va MIGRANT qiymatlarini xavfsiz qo'shish
   */
  private async upgradeEnumTypes() {
    const enumTypes = [
      'citizens_currentcategory_enum',
      'surveys_maincategory_enum',
      'employment_history_newcategory_enum',
      'employment_history_previouscategory_enum',
    ];
    for (const enumType of enumTypes) {
      try {
        await this.roleRepository.query(`
          DO $$ BEGIN
            ALTER TYPE public."${enumType}" ADD VALUE IF NOT EXISTS 'SELF_EMPLOYED';
            ALTER TYPE public."${enumType}" ADD VALUE IF NOT EXISTS 'MIGRANT';
          EXCEPTION WHEN duplicate_object THEN null;
          WHEN undefined_object THEN null;
          WHEN others THEN null;
          END $$;
        `);
      } catch {
        // Ignored if type does not exist or already contains values
      }
    }
  }

  /**
   * 1. Qat'iy RBAC rollarini yaratish
   */
  private async seedRoles() {
    const rolesData = [
      {
        code: UserRole.SUPER_ADMIN,
        name: 'Super Administrator',
        description: 'Tizim sozlamalari, tumanlar, mahallalar, rollar va boshqaruv',
      },
      {
        code: UserRole.DISTRICT_ADMIN,
        name: 'Tuman administratori',
        description: 'Tuman bo\'yicha barcha statistika, anketalar, mahallalar va hisobotlar',
      },
      {
        code: UserRole.MAHALLA_OPERATOR,
        name: 'Mahalla yetakchisi (Operator)',
        description: 'O\'z mahallasidagi yoshlarni o\'rganish va so\'rovnomalarni kiritish',
      },
      {
        code: UserRole.DATA_REVIEWER,
        name: 'Ma\'lumotlar tekshiruvchisi (Reviewer)',
        description: 'Noma\'lum, dublikat va ziddiyatli holatlarga tushgan anketalarni tekshirib tasdiqlash',
      },
    ];

    for (const item of rolesData) {
      const exists = await this.roleRepository.findOne({ where: { code: item.code } });
      if (!exists) {
        const role = this.roleRepository.create(item);
        await this.roleRepository.save(role);
      }
    }
    // Agar eski READ_ONLY_MANAGER qolib ketgan bo'lsa tozalash
    await this.roleRepository.delete({ code: 'READ_ONLY_MANAGER' as any }).catch(() => {});
    this.logger.log('✅ RBAC 4 ta qat\'iy roli tayyorlandi');
  }

  /**
   * 2. Boshlang'ich tumanlar - Namangan viloyatining barcha 14 ta tuman va shahri
   */
  private async seedDistricts(): Promise<DistrictEntity[]> {
    const districtsList = [
      { name: 'Namangan shahri', code: 'NSH' },
      { name: 'Davlatobod tumani', code: 'DAV' },
      { name: 'Yangi Namangan tumani', code: 'YN2' },
      { name: 'Chortoq tumani', code: 'CHO' },
      { name: 'Chust tumani', code: 'CHU' },
      { name: 'Kosonsoy tumani', code: 'KOS' },
      { name: 'Mingbuloq tumani', code: 'MIN' },
      { name: 'Namangan tumani', code: 'NAM' },
      { name: 'Norin tumani', code: 'NOR' },
      { name: 'Pop tumani', code: 'POP' },
      { name: 'To\'raqo\'rg\'on tumani', code: 'TOR' },
      { name: 'Uychi tumani', code: 'UYI' },
      { name: 'Uchqo\'rg\'on tumani', code: 'UCH' },
      { name: 'Yangiqo\'rg\'on tumani', code: 'YAQ' },
    ];

    const savedDistricts: DistrictEntity[] = [];

    for (const item of districtsList) {
      let district = await this.districtRepository.findOne({
        where: { name: item.name },
      });

      if (!district) {
        district = this.districtRepository.create({
          name: item.name,
          region: 'Namangan viloyati',
          code: item.code,
          isActive: true,
        });
        district = await this.districtRepository.save(district);
        this.logger.log(`✅ ${item.name} yaratildi`);
      }
      savedDistricts.push(district);
    }

    return savedDistricts;
  }

  /**
   * 3. Barcha 14 ta tuman va shaharning 171 ta mahallalari
   */
  private async seedAllMahallas(districts: DistrictEntity[]) {
    const data: Record<string, string[]> = {
      'Namangan shahri': [
        'Goʻzal', 'Bobur', 'Chorsu', 'Lolazor', 'Shodlik', 'Guliston', 'Gʻalaba', 'Istiqlol',
        'Yangi hayot', 'Nodirabegim', 'Navroʻz', 'Zarafshon', 'Toʻqimachi', 'Qoradaryo',
        'Mehnatobod', 'Yuksalish', 'Bunyodkor', 'Doʻstlik', 'Mustaqillik', 'Navbahor', 'Orzu', 'Mashrab'
      ],
      'Davlatobod tumani': [
        'Guliston', 'Yuksalish', 'Barkamol', 'Yangi tong', 'Navbahor', 'Orzu', 'Elxona',
        'Damariq', 'Porloq', 'Quyi Gʻirvon', 'Yuqori Gʻirvon', 'Madaniy yer', 'Porloq tong',
        'Shifokor', 'Yoshlik'
      ],
      'Yangi Namangan tumani': [
        'Sihatgoh', 'Orzu', 'Mingchinor', 'Goʻzal', 'Ishonch', 'Shomahalla', 'Qahramon',
        'Gulshan', 'Maʼrifat', 'Oydin', 'Mustaqillik', 'Sherbuloq'
      ],
      'Chortoq tumani': [
        'Alisher Navoiy', 'Bogʻiston', 'Chortoq', 'Guliston', 'Hazrati Shoh', 'Mustaqillik',
        'Namuna', 'Oromgoh', 'Pastki Bogʻ', 'Tinchlik', 'Yuqori Chortoq', 'Sohil', 'Beshkapa'
      ],
      'Chust tumani': [
        'Chust', 'Bibiona', 'Bogʻishamol', 'Varzik', 'Gʻova', 'Doʻstlik', 'Kamarsada',
        'Karkidon', 'Olmos', 'Qoʻgʻay', 'Sadacha', 'Chustiy', 'Baymoq', 'Yorqishloq'
      ],
      'Kosonsoy tumani': [
        'Koson', 'Bogʻbon', 'Gulbogʻ', 'Kasan', 'Ozod', 'Soyboʻyi', 'Tergachi',
        'Chindovul', 'Yangiyoʻl', 'Qoraqoʻrgʻon', 'Qorasuv', 'Oʻzbekiston'
      ],
      'Mingbuloq tumani': [
        'Jumabozor', 'Doʻstlik', 'Goʻzal', 'Qiziltepa', 'Mehnatobod', 'Momoxon',
        'Yangihayot', 'Oltinkoʻl', 'Gulbogʻ', 'Qoʻgʻayguzar'
      ],
      'Namangan tumani': [
        'Toshbuloq', 'Mirishkor', 'Qumqoʻrgʻon', 'Xonobod', 'Shurqoʻrgʻon', 'Bogʻishamol',
        'Shoʻrbuloq', 'Yangiqishloq', 'Irvadan', 'Tepaqoʻrgʻon'
      ],
      'Norin tumani': [
        'Haqqulobod', 'Shoʻrariq', 'Boʻston', 'Qoraxitoy', 'Toʻlqin', 'Norinkapa',
        'Uchtepa', 'Qoratepa', 'Oʻzbekiston', 'Pastki Choʻja'
      ],
      'Pop tumani': [
        'Pop', 'Chorkesar', 'Uygʻursoy', 'Chustobod', 'Sang', 'Qandgʻon',
        'Oltinkon', 'Xalqobod', 'Vodiy', 'Gʻurrum', 'Navbahor'
      ],
      'Toʻraqoʻrgʻon tumani': [
        'Toʻraqoʻrgʻon', 'Islohot', 'Shahand', 'Mozorkoʻhna', 'Oqtosh', 'Yandama',
        'Buramatut', 'Saroy', 'Kumidon', 'Sayram', 'Qatagʻon'
      ],
      'Uychi tumani': [
        'Uychi', 'Jiydakapa', 'Churtuk', 'Fayziobod', 'Qumtepa', 'Birlik',
        'Mashad', 'Boygʻon', 'Ziyokor', 'Kizilravot'
      ],
      'Uchqoʻrgʻon tumani': [
        'Uchqoʻrgʻon', 'Qoʻgʻay', 'Yangiobod', 'Mashrab', 'Yoshlik', 'Qayqi',
        'Paxtachi', 'Madaniyat', 'Doʻstlik', 'Dehqonobod'
      ],
      'Yangiqoʻrgʻon tumani': [
        'Yangiqoʻrgʻon', 'Bekobod', 'Nanay', 'Poramon', 'Zarkent', 'Qizil yoz',
        'Birlashgan', 'Navroʻz', 'Gʻovazon', 'Rovot'
      ]
    };

    for (const district of districts) {
      const mahallasList = data[district.name] || [];
      for (const name of mahallasList) {
        const exists = await this.mahallaRepository.findOne({
          where: { name, districtId: district.id },
        });
        if (!exists) {
          const mahalla = this.mahallaRepository.create({
            name,
            district,
            districtId: district.id,
            region: 'Namangan viloyati',
          });
          await this.mahallaRepository.save(mahalla);
        }
      }
    }
  }

  /**
   * 4. Super Admin yaratish yoki parolini yangilash
   * Login: superadmin | Parol: superadmin123
   */
  private async seedSuperAdmin() {
    const superAdminRole = await this.roleRepository.findOne({
      where: { code: UserRole.SUPER_ADMIN },
    });

    if (!superAdminRole) {
      this.logger.error('Super Admin roli topilmadi!');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('superadmin123', salt);

    let superadmin = await this.userRepository.findOne({ where: { username: 'superadmin' } });
    if (!superadmin) {
      superadmin = this.userRepository.create({
        username: 'superadmin',
        email: 'superadmin@bandlik.uz',
        fullName: 'Super Administrator',
        phone: '+998901112244',
        passwordHash,
        role: superAdminRole,
        roleId: superAdminRole.id,
        roleCode: UserRole.SUPER_ADMIN,
        isActive: true,
      });
      await this.userRepository.save(superadmin);
      this.logger.log('🎉 Super Admin muvaffaqiyatli yaratildi: Login: superadmin | Parol: superadmin123');
    } else {
      superadmin.passwordHash = passwordHash;
      superadmin.role = superAdminRole;
      superadmin.roleId = superAdminRole.id;
      superadmin.roleCode = UserRole.SUPER_ADMIN;
      superadmin.isActive = true;
      await this.userRepository.save(superadmin);
      this.logger.log('🔄 Super Admin paroli yangilandi: superadmin123');
    }
  }

  /**
   * 5. Demo kabinet foydalanuvchilari (Tuman Admin, Mahalla Yetakchisi, Reviewer)
   */
  private async seedStaffUsers(district: DistrictEntity) {
    const salt = await bcrypt.genSalt(10);

    const districtAdminRole = await this.roleRepository.findOne({ where: { code: UserRole.DISTRICT_ADMIN } });
    const operatorRole = await this.roleRepository.findOne({ where: { code: UserRole.MAHALLA_OPERATOR } });
    const reviewerRole = await this.roleRepository.findOne({ where: { code: UserRole.DATA_REVIEWER } });

    const gulistonMahalla = await this.mahallaRepository.findOne({
      where: { name: 'Guliston', districtId: district.id },
    });

    // 1. Tuman Admini (login: davlatobod_admin / parol: admin123)
    if (districtAdminRole) {
      let dAdmin = await this.userRepository.findOne({ where: { username: 'davlatobod_admin' } });
      const dAdminPasswordHash = await bcrypt.hash('admin123', salt);
      if (!dAdmin) {
        await this.userRepository.save(
          this.userRepository.create({
            username: 'davlatobod_admin',
            email: 'admin.davlatobod@bandlik.uz',
            passwordHash: dAdminPasswordHash,
            fullName: 'Davlatobod Tuman Admini',
            phone: '+998912345678',
            role: districtAdminRole,
            roleId: districtAdminRole.id,
            roleCode: UserRole.DISTRICT_ADMIN,
            district,
            districtId: district.id,
            isActive: true,
          }),
        );
      } else {
        dAdmin.passwordHash = dAdminPasswordHash;
        dAdmin.phone = dAdmin.phone || '+998912345678';
        dAdmin.district = district;
        dAdmin.districtId = district.id;
        await this.userRepository.save(dAdmin);
      }
    }

    // 2. Mahalla Yetakchisi (login: operator_guliston / parol: operator123)
    if (operatorRole && gulistonMahalla) {
      let operator = await this.userRepository.findOne({ where: { username: 'operator_guliston' } });
      const opPasswordHash = await bcrypt.hash('operator123', salt);
      if (!operator) {
        await this.userRepository.save(
          this.userRepository.create({
            username: 'operator_guliston',
            email: 'operator.guliston@bandlik.uz',
            passwordHash: opPasswordHash,
            fullName: 'Sardor Qodirov (Guliston MFY)',
            phone: '+998935557788',
            role: operatorRole,
            roleId: operatorRole.id,
            roleCode: UserRole.MAHALLA_OPERATOR,
            district,
            districtId: district.id,
            mahalla: gulistonMahalla,
            mahallaId: gulistonMahalla.id,
            isActive: true,
          }),
        );
      } else {
        operator.passwordHash = opPasswordHash;
        operator.phone = operator.phone || '+998935557788';
        operator.district = district;
        operator.districtId = district.id;
        operator.mahalla = gulistonMahalla;
        operator.mahallaId = gulistonMahalla.id;
        await this.userRepository.save(operator);
      }
    }

    // 3. Data Reviewer (login: reviewer / parol: reviewer123)
    if (reviewerRole) {
      let reviewer = await this.userRepository.findOne({
        where: [{ username: 'reviewer' }, { email: 'reviewer@bandlik.uz' }],
      });
      const revPasswordHash = await bcrypt.hash('reviewer123', salt);
      if (!reviewer) {
        await this.userRepository.save(
          this.userRepository.create({
            username: 'reviewer',
            email: 'reviewer@bandlik.uz',
            passwordHash: revPasswordHash,
            fullName: 'Malika Karimova (Data Reviewer)',
            phone: '+998971112233',
            role: reviewerRole,
            roleId: reviewerRole.id,
            roleCode: UserRole.DATA_REVIEWER,
            isActive: true,
          }),
        );
      } else {
        reviewer.passwordHash = revPasswordHash;
        reviewer.phone = reviewer.phone || '+998971112233';
        await this.userRepository.save(reviewer);
      }
    }
  }
}
