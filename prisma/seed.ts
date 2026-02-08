import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ==========================================
  // COUNTRIES (Страны)
  // ==========================================
  console.log('📍 Seeding countries...');
  
  const countries = [
    { code: 'UZ', nameEn: 'Uzbekistan', nameRu: 'Узбекистан', nameUz: "O'zbekiston" },
    { code: 'RU', nameEn: 'Russia', nameRu: 'Россия', nameUz: 'Rossiya' },
    { code: 'CN', nameEn: 'China', nameRu: 'Китай', nameUz: 'Xitoy' },
    { code: 'US', nameEn: 'United States', nameRu: 'США', nameUz: 'AQSH' },
    { code: 'DE', nameEn: 'Germany', nameRu: 'Германия', nameUz: 'Germaniya' },
    { code: 'TR', nameEn: 'Turkey', nameRu: 'Турция', nameUz: 'Turkiya' },
    { code: 'KZ', nameEn: 'Kazakhstan', nameRu: 'Казахстан', nameUz: "Qozog'iston" },
    { code: 'KR', nameEn: 'South Korea', nameRu: 'Южная Корея', nameUz: 'Janubiy Koreya' },
    { code: 'JP', nameEn: 'Japan', nameRu: 'Япония', nameUz: 'Yaponiya' },
    { code: 'IN', nameEn: 'India', nameRu: 'Индия', nameUz: 'Hindiston' },
    { code: 'AE', nameEn: 'United Arab Emirates', nameRu: 'ОАЭ', nameUz: 'BAA' },
    { code: 'IT', nameEn: 'Italy', nameRu: 'Италия', nameUz: 'Italiya' },
    { code: 'FR', nameEn: 'France', nameRu: 'Франция', nameUz: 'Fransiya' },
    { code: 'GB', nameEn: 'United Kingdom', nameRu: 'Великобритания', nameUz: 'Buyuk Britaniya' },
    { code: 'PL', nameEn: 'Poland', nameRu: 'Польша', nameUz: 'Polsha' },
    { code: 'UA', nameEn: 'Ukraine', nameRu: 'Украина', nameUz: 'Ukraina' },
    { code: 'BY', nameEn: 'Belarus', nameRu: 'Беларусь', nameUz: 'Belarus' },
    { code: 'KG', nameEn: 'Kyrgyzstan', nameRu: 'Кыргызстан', nameUz: "Qirg'iziston" },
    { code: 'TJ', nameEn: 'Tajikistan', nameRu: 'Таджикистан', nameUz: 'Tojikiston' },
    { code: 'TM', nameEn: 'Turkmenistan', nameRu: 'Туркменистан', nameUz: 'Turkmaniston' },
    { code: 'AF', nameEn: 'Afghanistan', nameRu: 'Афганистан', nameUz: "Afg'oniston" },
    { code: 'PK', nameEn: 'Pakistan', nameRu: 'Пакистан', nameUz: 'Pokiston' },
    { code: 'IR', nameEn: 'Iran', nameRu: 'Иран', nameUz: 'Eron' },
    { code: 'SA', nameEn: 'Saudi Arabia', nameRu: 'Саудовская Аравия', nameUz: 'Saudiya Arabistoni' },
    { code: 'NL', nameEn: 'Netherlands', nameRu: 'Нидерланды', nameUz: 'Niderlandiya' },
  ];

  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: country,
      create: country,
    });
  }
  console.log(`✅ Created ${countries.length} countries`);

  // ==========================================
  // CURRENCIES (Валюты)
  // ==========================================
  console.log('💰 Seeding currencies...');
  
  const currencies = [
    { code: 'UZS', name: 'Uzbek Sum', symbol: "so'm" },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸' },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  ];

  for (const currency of currencies) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: currency,
      create: currency,
    });
  }
  console.log(`✅ Created ${currencies.length} currencies`);

  // ==========================================
  // TRANSPORT MODES (Виды транспорта)
  // ==========================================
  console.log('🚛 Seeding transport modes...');
  
  const transportModes = [
    { code: '10', name: 'Sea transport', nameUz: 'Dengiz transporti' },
    { code: '20', name: 'Rail transport', nameUz: 'Temir yoʻl transporti' },
    { code: '30', name: 'Road transport', nameUz: 'Avtomobil transporti' },
    { code: '40', name: 'Air transport', nameUz: 'Havo transporti' },
    { code: '50', name: 'Mail', nameUz: 'Pochta' },
    { code: '70', name: 'Pipeline transport', nameUz: 'Quvur transporti' },
    { code: '80', name: 'Inland waterway transport', nameUz: 'Ichki suv transporti' },
    { code: '90', name: 'Own propulsion', nameUz: 'Oʻz yurishi' },
  ];

  for (const mode of transportModes) {
    await prisma.transportMode.upsert({
      where: { code: mode.code },
      update: mode,
      create: mode,
    });
  }
  console.log(`✅ Created ${transportModes.length} transport modes`);

  // ==========================================
  // DELIVERY TERMS (Инкотермс)
  // ==========================================
  console.log('📦 Seeding delivery terms (Incoterms)...');
  
  const deliveryTerms = [
    { code: 'EXW', name: 'Ex Works', description: 'Франко завод' },
    { code: 'FCA', name: 'Free Carrier', description: 'Франко перевозчик' },
    { code: 'CPT', name: 'Carriage Paid To', description: 'Перевозка оплачена до' },
    { code: 'CIP', name: 'Carriage and Insurance Paid To', description: 'Перевозка и страхование оплачены до' },
    { code: 'DAP', name: 'Delivered at Place', description: 'Поставка в месте назначения' },
    { code: 'DPU', name: 'Delivered at Place Unloaded', description: 'Поставка в месте выгрузки' },
    { code: 'DDP', name: 'Delivered Duty Paid', description: 'Поставка с оплатой пошлины' },
    { code: 'FAS', name: 'Free Alongside Ship', description: 'Свободно вдоль борта судна' },
    { code: 'FOB', name: 'Free on Board', description: 'Свободно на борту' },
    { code: 'CFR', name: 'Cost and Freight', description: 'Стоимость и фрахт' },
    { code: 'CIF', name: 'Cost, Insurance and Freight', description: 'Стоимость, страхование и фрахт' },
  ];

  for (const term of deliveryTerms) {
    await prisma.deliveryTerm.upsert({
      where: { code: term.code },
      update: term,
      create: term,
    });
  }
  console.log(`✅ Created ${deliveryTerms.length} delivery terms`);

  // ==========================================
  // CUSTOMS PROCEDURES (Таможенные процедуры)
  // ==========================================
  console.log('📋 Seeding customs procedures...');
  
  const customsProcedures = [
    { code: '4000', name: 'Release for free circulation', nameUz: 'Erkin muomalaga chiqarish' },
    { code: '4010', name: 'Release for free circulation (with previous procedure)', nameUz: 'Erkin muomalaga chiqarish (oldingi tartib bilan)' },
    { code: '1000', name: 'Export', nameUz: 'Eksport' },
    { code: '2100', name: 'Temporary import with partial relief', nameUz: 'Vaqtinchalik import (qisman imtiyoz)' },
    { code: '2300', name: 'Temporary import with full relief', nameUz: 'Vaqtinchalik import (toʻliq imtiyoz)' },
    { code: '3100', name: 'Re-export', nameUz: 'Reeksport' },
    { code: '5100', name: 'Inward processing', nameUz: 'Ichki qayta ishlash' },
    { code: '5300', name: 'Temporary export', nameUz: 'Vaqtinchalik eksport' },
    { code: '7100', name: 'Customs warehouse', nameUz: 'Bojxona ombori' },
    { code: '8000', name: 'Transit', nameUz: 'Tranzit' },
    { code: '9100', name: 'Free zone', nameUz: 'Erkin zona' },
  ];

  for (const procedure of customsProcedures) {
    await prisma.customsProcedure.upsert({
      where: { code: procedure.code },
      update: procedure,
      create: procedure,
    });
  }
  console.log(`✅ Created ${customsProcedures.length} customs procedures`);

  // ==========================================
  // UNITS OF MEASURE (Единицы измерения)
  // ==========================================
  console.log('📏 Seeding units of measure...');
  
  const units = [
    { code: 'KGM', name: 'Kilogram', nameUz: 'Kilogramm', symbol: 'кг' },
    { code: 'GRM', name: 'Gram', nameUz: 'Gramm', symbol: 'г' },
    { code: 'TNE', name: 'Metric ton', nameUz: 'Tonna', symbol: 'т' },
    { code: 'MTR', name: 'Meter', nameUz: 'Metr', symbol: 'м' },
    { code: 'MTK', name: 'Square meter', nameUz: 'Kvadrat metr', symbol: 'м²' },
    { code: 'MTQ', name: 'Cubic meter', nameUz: 'Kub metr', symbol: 'м³' },
    { code: 'LTR', name: 'Liter', nameUz: 'Litr', symbol: 'л' },
    { code: 'PCE', name: 'Piece', nameUz: 'Dona', symbol: 'шт' },
    { code: 'SET', name: 'Set', nameUz: 'Toʻplam', symbol: 'набор' },
    { code: 'PR', name: 'Pair', nameUz: 'Juft', symbol: 'пар' },
    { code: 'KWH', name: 'Kilowatt-hour', nameUz: 'Kilovatt-soat', symbol: 'кВт·ч' },
    { code: 'CTM', name: 'Carat', nameUz: 'Karat', symbol: 'кар' },
  ];

  for (const unit of units) {
    await prisma.unitOfMeasure.upsert({
      where: { code: unit.code },
      update: unit,
      create: unit,
    });
  }
  console.log(`✅ Created ${units.length} units of measure`);

  // ==========================================
  // CUSTOMS OFFICES (Таможенные посты)
  // ==========================================
  console.log('🏛️ Seeding customs offices...');
  
  const customsOffices = [
    { code: '00110100', name: 'Tashkent Main Customs', nameUz: 'Toshkent bosh bojxonasi', regionCode: '01' },
    { code: '00110200', name: 'Tashkent City Customs', nameUz: 'Toshkent shahar bojxonasi', regionCode: '01' },
    { code: '00120100', name: 'Samarkand Regional Customs', nameUz: 'Samarqand viloyat bojxonasi', regionCode: '02' },
    { code: '00130100', name: 'Bukhara Regional Customs', nameUz: 'Buxoro viloyat bojxonasi', regionCode: '03' },
    { code: '00140100', name: 'Andijan Regional Customs', nameUz: 'Andijon viloyat bojxonasi', regionCode: '04' },
    { code: '00150100', name: 'Fergana Regional Customs', nameUz: "Farg'ona viloyat bojxonasi", regionCode: '05' },
    { code: '00160100', name: 'Namangan Regional Customs', nameUz: 'Namangan viloyat bojxonasi', regionCode: '06' },
    { code: '00170100', name: 'Khorezm Regional Customs', nameUz: 'Xorazm viloyat bojxonasi', regionCode: '07' },
    { code: '00180100', name: 'Navoi Regional Customs', nameUz: 'Navoiy viloyat bojxonasi', regionCode: '08' },
    { code: '00190100', name: 'Kashkadarya Regional Customs', nameUz: 'Qashqadaryo viloyat bojxonasi', regionCode: '09' },
    { code: '00200100', name: 'Surkhandarya Regional Customs', nameUz: 'Surxondaryo viloyat bojxonasi', regionCode: '10' },
    { code: '00210100', name: 'Jizzakh Regional Customs', nameUz: 'Jizzax viloyat bojxonasi', regionCode: '11' },
    { code: '00220100', name: 'Syrdarya Regional Customs', nameUz: 'Sirdaryo viloyat bojxonasi', regionCode: '12' },
    { code: '00230100', name: 'Karakalpakstan Customs', nameUz: "Qoraqalpog'iston bojxonasi", regionCode: '13' },
  ];

  for (const office of customsOffices) {
    await prisma.customsOffice.upsert({
      where: { code: office.code },
      update: office,
      create: office,
    });
  }
  console.log(`✅ Created ${customsOffices.length} customs offices`);

  // ==========================================
  // SAMPLE HS CODES (Примеры кодов ТН ВЭД)
  // ==========================================
  console.log('📊 Seeding sample HS codes...');
  
  const hsCodes = [
    // Electronics
    { code: '8471300000', description: 'Portable computers weighing not more than 10 kg', descriptionUz: 'Portativ kompyuterlar (10 kg dan oshmaydigan)', unit: 'PCE', dutyRate: 0, vatRate: 12 },
    { code: '8471410000', description: 'Data processing machines', descriptionUz: "Ma'lumotlarni qayta ishlash mashinalari", unit: 'PCE', dutyRate: 0, vatRate: 12 },
    { code: '8517120000', description: 'Telephones for cellular networks or for other wireless networks', descriptionUz: 'Uyali telefonlar', unit: 'PCE', dutyRate: 0, vatRate: 12 },
    { code: '8517620000', description: 'Machines for reception, conversion and transmission', descriptionUz: "Qabul qilish va uzatish qurilmalari", unit: 'PCE', dutyRate: 0, vatRate: 12 },
    { code: '8528720000', description: 'Television receivers', descriptionUz: 'Televizorlar', unit: 'PCE', dutyRate: 15, vatRate: 12 },
    { code: '8528520000', description: 'Monitors', descriptionUz: 'Monitorlar', unit: 'PCE', dutyRate: 0, vatRate: 12 },
    { code: '8443320000', description: 'Printers, copying machines', descriptionUz: 'Printerlar, nusxa olish mashinalari', unit: 'PCE', dutyRate: 0, vatRate: 12 },
    
    // Vehicles
    { code: '8703210000', description: 'Motor cars with spark-ignition engine (not more than 1000 cc)', descriptionUz: 'Yengil avtomobillar (1000 cc gacha)', unit: 'PCE', dutyRate: 20, vatRate: 12 },
    { code: '8703220000', description: 'Motor cars with spark-ignition engine (1000-1500 cc)', descriptionUz: 'Yengil avtomobillar (1000-1500 cc)', unit: 'PCE', dutyRate: 25, vatRate: 12 },
    { code: '8703230000', description: 'Motor cars with spark-ignition engine (1500-3000 cc)', descriptionUz: 'Yengil avtomobillar (1500-3000 cc)', unit: 'PCE', dutyRate: 30, vatRate: 12 },
    { code: '8703240000', description: 'Motor cars with spark-ignition engine (more than 3000 cc)', descriptionUz: 'Yengil avtomobillar (3000 cc dan ortiq)', unit: 'PCE', dutyRate: 50, vatRate: 12 },
    { code: '8704210000', description: 'Motor vehicles for transport of goods (GVW not more than 5 tonnes)', descriptionUz: 'Yuk avtomobillari (5 tonnagacha)', unit: 'PCE', dutyRate: 15, vatRate: 12 },
    
    // Textiles
    { code: '6110200000', description: 'Jerseys, pullovers of cotton', descriptionUz: 'Paxtadan trikotaj kiyimlar', unit: 'PCE', dutyRate: 20, vatRate: 12 },
    { code: '6109100000', description: 'T-shirts of cotton', descriptionUz: 'Paxtadan futbolkalar', unit: 'PCE', dutyRate: 20, vatRate: 12 },
    { code: '6203420000', description: 'Mens trousers of cotton', descriptionUz: "Erkaklar shimlar (paxtadan)", unit: 'PCE', dutyRate: 20, vatRate: 12 },
    { code: '6204620000', description: 'Womens trousers of cotton', descriptionUz: 'Ayollar shimlar (paxtadan)', unit: 'PCE', dutyRate: 20, vatRate: 12 },
    { code: '6402910000', description: 'Footwear with rubber soles', descriptionUz: 'Rezina taglikli poyabzallar', unit: 'PR', dutyRate: 20, vatRate: 12 },
    
    // Food
    { code: '0201100000', description: 'Carcasses and half-carcasses of bovine animals, fresh or chilled', descriptionUz: "Mol go'shti (yangi)", unit: 'KGM', dutyRate: 10, vatRate: 12 },
    { code: '0207140000', description: 'Frozen cuts of chicken', descriptionUz: "Tovuq go'shti (muzlatilgan)", unit: 'KGM', dutyRate: 15, vatRate: 12 },
    { code: '0402210000', description: 'Milk powder', descriptionUz: 'Quruq sut', unit: 'KGM', dutyRate: 10, vatRate: 12 },
    { code: '0805100000', description: 'Oranges', descriptionUz: 'Apelsinlar', unit: 'KGM', dutyRate: 5, vatRate: 12 },
    { code: '1001190000', description: 'Durum wheat (other than seed)', descriptionUz: "Bug'doy", unit: 'KGM', dutyRate: 0, vatRate: 0 },
    { code: '1005900000', description: 'Maize (other than seed)', descriptionUz: "Makkajo'xori", unit: 'KGM', dutyRate: 0, vatRate: 0 },
    { code: '1701130000', description: 'Cane sugar', descriptionUz: 'Shakar', unit: 'KGM', dutyRate: 15, vatRate: 12 },
    
    // Industrial
    { code: '2710121000', description: 'Light oils - motor spirit (gasoline)', descriptionUz: 'Benzin', unit: 'LTR', dutyRate: 5, vatRate: 12, exciseRate: 10 },
    { code: '2710192100', description: 'Diesel fuel', descriptionUz: 'Dizel yoqilgʻisi', unit: 'LTR', dutyRate: 5, vatRate: 12, exciseRate: 5 },
    { code: '7210410000', description: 'Flat-rolled iron or non-alloy steel, corrugated', descriptionUz: "Po'lat qatlamlar", unit: 'KGM', dutyRate: 5, vatRate: 12 },
    { code: '7214200000', description: 'Bars and rods of iron or steel', descriptionUz: "Po'lat armatura", unit: 'KGM', dutyRate: 5, vatRate: 12 },
    { code: '7308900000', description: 'Structures of iron or steel', descriptionUz: "Po'lat konstruktsiyalar", unit: 'KGM', dutyRate: 5, vatRate: 12 },
    { code: '2523290000', description: 'Portland cement', descriptionUz: 'Sement', unit: 'KGM', dutyRate: 10, vatRate: 12 },
    
    // Medical
    { code: '3004900000', description: 'Other medicaments', descriptionUz: 'Dori-darmonlar (boshqa)', unit: 'KGM', dutyRate: 0, vatRate: 0 },
    { code: '3004320000', description: 'Medicaments containing corticosteroid hormones', descriptionUz: 'Kortikosteroid dorilar', unit: 'KGM', dutyRate: 0, vatRate: 0 },
    { code: '9018310000', description: 'Syringes', descriptionUz: 'Shpritslar', unit: 'PCE', dutyRate: 0, vatRate: 0 },
    { code: '9018390000', description: 'Other medical needles and catheters', descriptionUz: 'Tibbiy ignalar va kateterlar', unit: 'PCE', dutyRate: 0, vatRate: 0 },
    
    // Agriculture
    { code: '5201000000', description: 'Cotton (not carded or combed)', descriptionUz: 'Paxta tolasi', unit: 'KGM', dutyRate: 0, vatRate: 0 },
    { code: '3102100000', description: 'Urea', descriptionUz: 'Karbamid', unit: 'KGM', dutyRate: 0, vatRate: 12 },
    { code: '8432210000', description: 'Disc harrows', descriptionUz: 'Diskli boronalar', unit: 'PCE', dutyRate: 0, vatRate: 12 },
    { code: '8433510000', description: 'Combine harvester-threshers', descriptionUz: 'Kombaynlar', unit: 'PCE', dutyRate: 0, vatRate: 12 },
    
    // Furniture
    { code: '9401610000', description: 'Upholstered seats with wooden frames', descriptionUz: "Yog'och ramkali oʻrindiqlar", unit: 'PCE', dutyRate: 20, vatRate: 12 },
    { code: '9403300000', description: 'Wooden office furniture', descriptionUz: "Yog'och ofis mebeli", unit: 'PCE', dutyRate: 20, vatRate: 12 },
    { code: '9404210000', description: 'Mattresses of cellular rubber or plastics', descriptionUz: 'Matraslar', unit: 'PCE', dutyRate: 20, vatRate: 12 },
  ];

  for (const hsCode of hsCodes) {
    await prisma.hSCode.upsert({
      where: { code: hsCode.code },
      update: {
        description: hsCode.description,
        descriptionUz: hsCode.descriptionUz,
        unit: hsCode.unit,
        dutyRate: hsCode.dutyRate,
        vatRate: hsCode.vatRate,
        exciseRate: hsCode.exciseRate ?? null,
      },
      create: {
        code: hsCode.code,
        description: hsCode.description,
        descriptionUz: hsCode.descriptionUz,
        unit: hsCode.unit,
        dutyRate: hsCode.dutyRate,
        vatRate: hsCode.vatRate,
        exciseRate: hsCode.exciseRate ?? null,
      },
    });
  }
  console.log(`✅ Created ${hsCodes.length} HS codes`);

  // ==========================================
  // TEST ORGANIZATION
  // ==========================================
  console.log('🏢 Creating test organization...');
  
  const organization = await prisma.organization.upsert({
    where: { inn: '123456789' },
    update: {},
    create: {
      name: 'Test Company LLC',
      inn: '123456789',
      address: 'Tashkent, Uzbekistan',
    },
  });
  console.log(`✅ Created organization: ${organization.name}`);

  // ==========================================
  // ADMIN USER
  // ==========================================
  console.log('👤 Creating admin user...');
  
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@gtd.uz' },
    update: {},
    create: {
      email: 'admin@gtd.uz',
      passwordHash: hashedPassword,
      name: 'Administrator',
      role: UserRole.ADMIN,
      organizationId: organization.id,
    },
  });
  console.log(`✅ Created admin user: ${adminUser.email}`);

  // ==========================================
  // SAMPLE EXCHANGE RATES
  // ==========================================
  console.log('💱 Creating sample exchange rates...');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const exchangeRates = [
    { currencyCode: 'USD', rate: 12750.00, date: today },
    { currencyCode: 'EUR', rate: 13850.00, date: today },
    { currencyCode: 'RUB', rate: 127.50, date: today },
    { currencyCode: 'CNY', rate: 1750.00, date: today },
    { currencyCode: 'GBP', rate: 16200.00, date: today },
    { currencyCode: 'KZT', rate: 25.50, date: today },
  ];

  for (const rate of exchangeRates) {
    await prisma.exchangeRate.upsert({
      where: {
        currencyCode_date: {
          currencyCode: rate.currencyCode,
          date: rate.date,
        },
      },
      update: { rate: rate.rate },
      create: rate,
    });
  }
  console.log(`✅ Created ${exchangeRates.length} exchange rates`);

  console.log('\n✨ Seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
