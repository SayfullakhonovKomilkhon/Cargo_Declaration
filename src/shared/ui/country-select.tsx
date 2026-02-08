'use client';

import * as React from 'react';
import { Check, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Country {
  code: string;
  numCode: string;
  nameRu: string;
}

interface CountrySelectProps {
  value?: string;
  onChange: (value: string, numericCode?: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  compact?: boolean;
  showNumericCode?: boolean; // Показывать цифровой код вместо буквенного
  showFullName?: boolean; // Показывать полное название страны
}

// Полный классификатор стран мира (251 страна)
const COUNTRIES: Country[] = [
  { code: 'AU', numCode: '036', nameRu: 'АВСТРАЛИЯ' },
  { code: 'AT', numCode: '040', nameRu: 'АВСТРИЯ' },
  { code: 'AZ', numCode: '031', nameRu: 'АЗЕРБАЙДЖАН' },
  { code: 'AX', numCode: '248', nameRu: 'АЛАНДСКИЕ ОСТРОВА' },
  { code: 'AL', numCode: '008', nameRu: 'АЛБАНИЯ' },
  { code: 'DZ', numCode: '012', nameRu: 'АЛЖИР' },
  { code: 'AS', numCode: '016', nameRu: 'АМЕРИКАНСКОЕ САМОА' },
  { code: 'AI', numCode: '660', nameRu: 'АНГИЛЬЯ' },
  { code: 'AO', numCode: '024', nameRu: 'АНГОЛА' },
  { code: 'AD', numCode: '020', nameRu: 'АНДОРРА' },
  { code: 'AQ', numCode: '010', nameRu: 'АНТАРКТИДА' },
  { code: 'AG', numCode: '028', nameRu: 'АНТИГУА И БАРБУДА' },
  { code: 'AR', numCode: '032', nameRu: 'АРГЕНТИНА' },
  { code: 'AM', numCode: '051', nameRu: 'АРМЕНИЯ' },
  { code: 'AW', numCode: '533', nameRu: 'АРУБА' },
  { code: 'AF', numCode: '004', nameRu: 'АФГАНИСТАН' },
  { code: 'BS', numCode: '044', nameRu: 'БАГАМСКИЕ ОСТРОВА' },
  { code: 'BD', numCode: '050', nameRu: 'БАНГЛАДЕШ' },
  { code: 'BB', numCode: '052', nameRu: 'БАРБАДОС' },
  { code: 'BH', numCode: '048', nameRu: 'БАХРЕЙН' },
  { code: 'BY', numCode: '112', nameRu: 'БЕЛАРУСЬ' },
  { code: 'BZ', numCode: '084', nameRu: 'БЕЛИЗ' },
  { code: 'BE', numCode: '056', nameRu: 'БЕЛЬГИЯ' },
  { code: 'BJ', numCode: '204', nameRu: 'БЕНИН' },
  { code: 'BM', numCode: '060', nameRu: 'БЕРМУДСКИЕ ОСТРОВА' },
  { code: 'BG', numCode: '100', nameRu: 'БОЛГАРИЯ' },
  { code: 'BO', numCode: '068', nameRu: 'БОЛИВИЯ' },
  { code: 'BQ', numCode: '535', nameRu: 'БОНЭЙР, СИНТ-ЭСТАТИУС И САБА' },
  { code: 'BA', numCode: '070', nameRu: 'БОСНИЯ И ГЕРЦЕГОВИНА' },
  { code: 'BW', numCode: '072', nameRu: 'БОТСВАНА' },
  { code: 'BR', numCode: '076', nameRu: 'БРАЗИЛИЯ' },
  { code: 'IO', numCode: '086', nameRu: 'БРИТАНСКАЯ ТЕРРИТОРИЯ В ИНДИЙСКОМ ОКЕАНЕ' },
  { code: 'BN', numCode: '096', nameRu: 'БРУНЕЙ-ДАРУССАЛАМ' },
  { code: 'BV', numCode: '074', nameRu: 'ОСТРОВ БУВЕ' },
  { code: 'BF', numCode: '854', nameRu: 'БУРКИНА-ФАСО' },
  { code: 'BI', numCode: '108', nameRu: 'БУРУНДИ' },
  { code: 'BT', numCode: '064', nameRu: 'БУТАН' },
  { code: 'VU', numCode: '548', nameRu: 'ВАНУАТУ' },
  { code: 'VA', numCode: '336', nameRu: 'ВАТИКАН' },
  { code: 'HU', numCode: '348', nameRu: 'ВЕНГРИЯ' },
  { code: 'VE', numCode: '862', nameRu: 'ВЕНЕСУЭЛА' },
  { code: 'VI', numCode: '850', nameRu: 'ВИРГИНСКИЕ ОСТРОВА (США)' },
  { code: 'VG', numCode: '092', nameRu: 'БРИТАНСКИЕ ВИРГИНСКИЕ ОСТРОВА' },
  { code: 'VN', numCode: '704', nameRu: 'ВЬЕТНАМ' },
  { code: 'GA', numCode: '266', nameRu: 'ГАБОН' },
  { code: 'HT', numCode: '332', nameRu: 'ГАИТИ' },
  { code: 'GY', numCode: '328', nameRu: 'ГАЙАНА' },
  { code: 'GM', numCode: '270', nameRu: 'ГАМБИЯ' },
  { code: 'GH', numCode: '288', nameRu: 'ГАНА' },
  { code: 'GP', numCode: '312', nameRu: 'ГВАДЕЛУПА' },
  { code: 'GT', numCode: '320', nameRu: 'ГВАТЕМАЛА' },
  { code: 'GN', numCode: '324', nameRu: 'ГВИНЕЯ' },
  { code: 'GW', numCode: '624', nameRu: 'ГВИНЕЯ-БИСАУ' },
  { code: 'DE', numCode: '276', nameRu: 'ГЕРМАНИЯ' },
  { code: 'GG', numCode: '831', nameRu: 'ГЕРНСИ' },
  { code: 'GI', numCode: '292', nameRu: 'ГИБРАЛТАР' },
  { code: 'HN', numCode: '340', nameRu: 'ГОНДУРАС' },
  { code: 'HK', numCode: '344', nameRu: 'ГОНКОНГ' },
  { code: 'GD', numCode: '308', nameRu: 'ГРЕНАДА' },
  { code: 'GL', numCode: '304', nameRu: 'ГРЕНЛАНДИЯ' },
  { code: 'GR', numCode: '300', nameRu: 'ГРЕЦИЯ' },
  { code: 'GE', numCode: '268', nameRu: 'ГРУЗИЯ' },
  { code: 'GU', numCode: '316', nameRu: 'ГУАМ' },
  { code: 'DK', numCode: '208', nameRu: 'ДАНИЯ' },
  { code: 'JE', numCode: '832', nameRu: 'ДЖЕРСИ' },
  { code: 'DJ', numCode: '262', nameRu: 'ДЖИБУТИ' },
  { code: 'DM', numCode: '212', nameRu: 'ДОМИНИКА' },
  { code: 'DO', numCode: '214', nameRu: 'ДОМИНИКАНСКАЯ РЕСПУБЛИКА' },
  { code: 'EG', numCode: '818', nameRu: 'ЕГИПЕТ' },
  { code: 'ZM', numCode: '894', nameRu: 'ЗАМБИЯ' },
  { code: 'EH', numCode: '732', nameRu: 'ЗАПАДНАЯ САХАРА' },
  { code: 'ZW', numCode: '716', nameRu: 'ЗИМБАБВЕ' },
  { code: 'IL', numCode: '376', nameRu: 'ИЗРАИЛЬ' },
  { code: 'IN', numCode: '356', nameRu: 'ИНДИЯ' },
  { code: 'ID', numCode: '360', nameRu: 'ИНДОНЕЗИЯ' },
  { code: 'JO', numCode: '400', nameRu: 'ИОРДАНИЯ' },
  { code: 'IQ', numCode: '368', nameRu: 'ИРАК' },
  { code: 'IR', numCode: '364', nameRu: 'ИРАН' },
  { code: 'IE', numCode: '372', nameRu: 'ИРЛАНДИЯ' },
  { code: 'IS', numCode: '352', nameRu: 'ИСЛАНДИЯ' },
  { code: 'ES', numCode: '724', nameRu: 'ИСПАНИЯ' },
  { code: 'IT', numCode: '380', nameRu: 'ИТАЛИЯ' },
  { code: 'YE', numCode: '887', nameRu: 'ЙЕМЕН' },
  { code: 'CV', numCode: '132', nameRu: 'КАБО-ВЕРДЕ' },
  { code: 'KZ', numCode: '398', nameRu: 'КАЗАХСТАН' },
  { code: 'KY', numCode: '136', nameRu: 'ОСТРОВА КАЙМАН' },
  { code: 'KH', numCode: '116', nameRu: 'КАМБОДЖА' },
  { code: 'CM', numCode: '120', nameRu: 'КАМЕРУН' },
  { code: 'CA', numCode: '124', nameRu: 'КАНАДА' },
  { code: 'QA', numCode: '634', nameRu: 'КАТАР' },
  { code: 'KE', numCode: '404', nameRu: 'КЕНИЯ' },
  { code: 'CY', numCode: '196', nameRu: 'КИПР' },
  { code: 'KI', numCode: '296', nameRu: 'КИРИБАТИ' },
  { code: 'CN', numCode: '156', nameRu: 'КИТАЙ' },
  { code: 'CC', numCode: '166', nameRu: 'КОКОСОВЫЕ ОСТРОВА' },
  { code: 'CO', numCode: '170', nameRu: 'КОЛУМБИЯ' },
  { code: 'KM', numCode: '174', nameRu: 'КОМОРСКИЕ ОСТРОВА' },
  { code: 'CG', numCode: '178', nameRu: 'КОНГО' },
  { code: 'CD', numCode: '180', nameRu: 'КОНГО (ДРК)' },
  { code: 'KR', numCode: '410', nameRu: 'КОРЕЯ' },
  { code: 'KP', numCode: '408', nameRu: 'КОРЕЯ (КНДР)' },
  { code: 'CR', numCode: '188', nameRu: 'КОСТА-РИКА' },
  { code: 'CI', numCode: '384', nameRu: 'КОТ Д\'ИВУАР' },
  { code: 'CU', numCode: '192', nameRu: 'КУБА' },
  { code: 'KW', numCode: '414', nameRu: 'КУВЕЙТ' },
  { code: 'KG', numCode: '417', nameRu: 'КЫРГЫЗСТАН' },
  { code: 'CW', numCode: '531', nameRu: 'КЮРАСАО' },
  { code: 'LA', numCode: '418', nameRu: 'ЛАОС' },
  { code: 'LV', numCode: '428', nameRu: 'ЛАТВИЯ' },
  { code: 'LS', numCode: '426', nameRu: 'ЛЕСОТО' },
  { code: 'LR', numCode: '430', nameRu: 'ЛИБЕРИЯ' },
  { code: 'LB', numCode: '422', nameRu: 'ЛИВАН' },
  { code: 'LY', numCode: '434', nameRu: 'ЛИВИЯ' },
  { code: 'LT', numCode: '440', nameRu: 'ЛИТВА' },
  { code: 'LI', numCode: '438', nameRu: 'ЛИХТЕНШТЕЙН' },
  { code: 'LU', numCode: '442', nameRu: 'ЛЮКСЕМБУРГ' },
  { code: 'MU', numCode: '480', nameRu: 'МАВРИКИЙ' },
  { code: 'MR', numCode: '478', nameRu: 'МАВРИТАНИЯ' },
  { code: 'MG', numCode: '450', nameRu: 'МАДАГАСКАР' },
  { code: 'YT', numCode: '175', nameRu: 'МАЙОТТА' },
  { code: 'MO', numCode: '446', nameRu: 'МАКАО' },
  { code: 'MK', numCode: '807', nameRu: 'СЕВЕРНАЯ МАКЕДОНИЯ' },
  { code: 'MW', numCode: '454', nameRu: 'МАЛАВИ' },
  { code: 'MY', numCode: '458', nameRu: 'МАЛАЙЗИЯ' },
  { code: 'ML', numCode: '466', nameRu: 'МАЛИ' },
  { code: 'UM', numCode: '581', nameRu: 'МАЛЫЕ ТИХООКЕАНСКИЕ ОСТРОВА (США)' },
  { code: 'MV', numCode: '462', nameRu: 'МАЛЬДИВЫ' },
  { code: 'MT', numCode: '470', nameRu: 'МАЛЬТА' },
  { code: 'MP', numCode: '580', nameRu: 'МАРИАНСКИЕ ОСТРОВА' },
  { code: 'MA', numCode: '504', nameRu: 'МАРОККО' },
  { code: 'MQ', numCode: '474', nameRu: 'МАРТИНИКА' },
  { code: 'MH', numCode: '584', nameRu: 'МАРШАЛЛОВЫ ОСТРОВА' },
  { code: 'MX', numCode: '484', nameRu: 'МЕКСИКА' },
  { code: 'FM', numCode: '583', nameRu: 'МИКРОНЕЗИЯ' },
  { code: 'MZ', numCode: '508', nameRu: 'МОЗАМБИК' },
  { code: 'MD', numCode: '498', nameRu: 'МОЛДОВА' },
  { code: 'MC', numCode: '492', nameRu: 'МОНАКО' },
  { code: 'MN', numCode: '496', nameRu: 'МОНГОЛИЯ' },
  { code: 'MS', numCode: '500', nameRu: 'МОНТСЕРРАТ' },
  { code: 'MM', numCode: '104', nameRu: 'МЬЯНМА' },
  { code: 'NA', numCode: '516', nameRu: 'НАМИБИЯ' },
  { code: 'NR', numCode: '520', nameRu: 'НАУРУ' },
  { code: 'NP', numCode: '524', nameRu: 'НЕПАЛ' },
  { code: 'NE', numCode: '562', nameRu: 'НИГЕР' },
  { code: 'NG', numCode: '566', nameRu: 'НИГЕРИЯ' },
  { code: 'AN', numCode: '530', nameRu: 'НИДЕРЛАНДСКИЕ АНТИЛЫ' },
  { code: 'NL', numCode: '528', nameRu: 'НИДЕРЛАНДЫ' },
  { code: 'NI', numCode: '558', nameRu: 'НИКАРАГУА' },
  { code: 'NU', numCode: '570', nameRu: 'НИУЭ' },
  { code: 'NZ', numCode: '554', nameRu: 'НОВАЯ ЗЕЛАНДИЯ' },
  { code: 'NC', numCode: '540', nameRu: 'НОВАЯ КАЛЕДОНИЯ' },
  { code: 'NO', numCode: '578', nameRu: 'НОРВЕГИЯ' },
  { code: 'AE', numCode: '784', nameRu: 'ОБЪЕДИНЕННЫЕ АРАБСКИЕ ЭМИРАТЫ' },
  { code: 'IM', numCode: '833', nameRu: 'ОСТРОВ МЭН' },
  { code: 'CX', numCode: '162', nameRu: 'ОСТРОВ РОЖДЕСТВА' },
  { code: 'CK', numCode: '184', nameRu: 'ОСТРОВА КУКА' },
  { code: 'OM', numCode: '512', nameRu: 'ОМАН' },
  { code: 'PK', numCode: '586', nameRu: 'ПАКИСТАН' },
  { code: 'PW', numCode: '585', nameRu: 'ПАЛАУ' },
  { code: 'PS', numCode: '275', nameRu: 'ПАЛЕСТИНА' },
  { code: 'PA', numCode: '591', nameRu: 'ПАНАМА' },
  { code: 'PG', numCode: '598', nameRu: 'ПАПУА — НОВАЯ ГВИНЕЯ' },
  { code: 'PY', numCode: '600', nameRu: 'ПАРАГВАЙ' },
  { code: 'PE', numCode: '604', nameRu: 'ПЕРУ' },
  { code: 'PN', numCode: '612', nameRu: 'ПИТКЭРН' },
  { code: 'PL', numCode: '616', nameRu: 'ПОЛЬША' },
  { code: 'PT', numCode: '620', nameRu: 'ПОРТУГАЛИЯ' },
  { code: 'PR', numCode: '630', nameRu: 'ПУЭРТО-РИКО' },
  { code: 'RE', numCode: '638', nameRu: 'РЕЮНЬОН' },
  { code: 'RU', numCode: '643', nameRu: 'РОССИЯ' },
  { code: 'RW', numCode: '646', nameRu: 'РУАНДА' },
  { code: 'RO', numCode: '642', nameRu: 'РУМЫНИЯ' },
  { code: 'SV', numCode: '222', nameRu: 'САЛЬВАДОР' },
  { code: 'WS', numCode: '882', nameRu: 'САМОА' },
  { code: 'SM', numCode: '674', nameRu: 'САН-МАРИНО' },
  { code: 'ST', numCode: '678', nameRu: 'САН-ТОМЕ И ПРИНСИПИ' },
  { code: 'SA', numCode: '682', nameRu: 'САУДОВСКАЯ АРАВИЯ' },
  { code: 'SZ', numCode: '748', nameRu: 'ЭСВАТИНИ' },
  { code: 'SH', numCode: '654', nameRu: 'ОСТРОВ СВЯТОЙ ЕЛЕНЫ' },
  { code: 'SC', numCode: '690', nameRu: 'СЕЙШЕЛЫ' },
  { code: 'BL', numCode: '652', nameRu: 'СЕН-БАРТЕЛЕМИ' },
  { code: 'MF', numCode: '663', nameRu: 'СЕН-МАРТЕН' },
  { code: 'PM', numCode: '666', nameRu: 'СЕН-ПЬЕР И МИКЕЛОН' },
  { code: 'SN', numCode: '686', nameRu: 'СЕНЕГАЛ' },
  { code: 'VC', numCode: '670', nameRu: 'СЕНТ-ВИНСЕНТ И ГРЕНАДИНЫ' },
  { code: 'KN', numCode: '659', nameRu: 'СЕНТ-КИТС И НЕВИС' },
  { code: 'LC', numCode: '662', nameRu: 'СЕНТ-ЛЮСИЯ' },
  { code: 'RS', numCode: '688', nameRu: 'СЕРБИЯ' },
  { code: 'SG', numCode: '702', nameRu: 'СИНГАПУР' },
  { code: 'SY', numCode: '760', nameRu: 'СИРИЯ' },
  { code: 'SK', numCode: '703', nameRu: 'СЛОВАКИЯ' },
  { code: 'SI', numCode: '705', nameRu: 'СЛОВЕНИЯ' },
  { code: 'GB', numCode: '826', nameRu: 'ВЕЛИКОБРИТАНИЯ' },
  { code: 'SB', numCode: '090', nameRu: 'СОЛОМОНОВЫ ОСТРОВА' },
  { code: 'SO', numCode: '706', nameRu: 'СОМАЛИ' },
  { code: 'SD', numCode: '736', nameRu: 'СУДАН' },
  { code: 'SR', numCode: '740', nameRu: 'СУРИНАМ' },
  { code: 'US', numCode: '840', nameRu: 'США' },
  { code: 'SL', numCode: '694', nameRu: 'СЬЕРРА-ЛЕОНЕ' },
  { code: 'TJ', numCode: '762', nameRu: 'ТАДЖИКИСТАН' },
  { code: 'TH', numCode: '764', nameRu: 'ТАИЛАНД' },
  { code: 'TW', numCode: '158', nameRu: 'ТАЙВАНЬ' },
  { code: 'TZ', numCode: '834', nameRu: 'ТАНЗАНИЯ' },
  { code: 'TC', numCode: '796', nameRu: 'ТЁРКС И КАЙКОС' },
  { code: 'TL', numCode: '626', nameRu: 'ТИМОР-ЛЕСТЕ' },
  { code: 'TG', numCode: '768', nameRu: 'ТОГО' },
  { code: 'TK', numCode: '772', nameRu: 'ТОКЕЛАУ' },
  { code: 'TO', numCode: '776', nameRu: 'ТОНГА' },
  { code: 'TT', numCode: '780', nameRu: 'ТРИНИДАД И ТОБАГО' },
  { code: 'TV', numCode: '798', nameRu: 'ТУВАЛУ' },
  { code: 'TN', numCode: '788', nameRu: 'ТУНИС' },
  { code: 'TM', numCode: '795', nameRu: 'ТУРКМЕНИСТАН' },
  { code: 'TR', numCode: '792', nameRu: 'ТУРЦИЯ' },
  { code: 'UG', numCode: '800', nameRu: 'УГАНДА' },
  { code: 'UZ', numCode: '860', nameRu: 'УЗБЕКИСТАН' },
  { code: 'UA', numCode: '804', nameRu: 'УКРАИНА' },
  { code: 'WF', numCode: '876', nameRu: 'УОЛЛИС И ФУТУНА' },
  { code: 'UY', numCode: '858', nameRu: 'УРУГВАЙ' },
  { code: 'FO', numCode: '234', nameRu: 'ФАРЕРСКИЕ ОСТРОВА' },
  { code: 'FJ', numCode: '242', nameRu: 'ФИДЖИ' },
  { code: 'PH', numCode: '608', nameRu: 'ФИЛИППИНЫ' },
  { code: 'FI', numCode: '246', nameRu: 'ФИНЛЯНДИЯ' },
  { code: 'FK', numCode: '238', nameRu: 'ФОЛКЛЕНДСКИЕ ОСТРОВА' },
  { code: 'FR', numCode: '250', nameRu: 'ФРАНЦИЯ' },
  { code: 'GF', numCode: '254', nameRu: 'ФРАНЦУЗСКАЯ ГВИАНА' },
  { code: 'PF', numCode: '258', nameRu: 'ФРАНЦУЗСКАЯ ПОЛИНЕЗИЯ' },
  { code: 'TF', numCode: '260', nameRu: 'ФРАНЦУЗСКИЕ ЮЖНЫЕ ТЕРРИТОРИИ' },
  { code: 'HM', numCode: '334', nameRu: 'ОСТРОВ ХЕРД И ОСТРОВА МАКДОНАЛЬД' },
  { code: 'HR', numCode: '191', nameRu: 'ХОРВАТИЯ' },
  { code: 'CF', numCode: '140', nameRu: 'ЦЕНТРАЛЬНОАФРИКАНСКАЯ РЕСПУБЛИКА' },
  { code: 'TD', numCode: '148', nameRu: 'ЧАД' },
  { code: 'ME', numCode: '499', nameRu: 'ЧЕРНОГОРИЯ' },
  { code: 'CZ', numCode: '203', nameRu: 'ЧЕХИЯ' },
  { code: 'CL', numCode: '152', nameRu: 'ЧИЛИ' },
  { code: 'CH', numCode: '756', nameRu: 'ШВЕЙЦАРИЯ' },
  { code: 'SE', numCode: '752', nameRu: 'ШВЕЦИЯ' },
  { code: 'SJ', numCode: '744', nameRu: 'ШПИЦБЕРГЕН И ЯН-МАЙЕН' },
  { code: 'LK', numCode: '144', nameRu: 'ШРИ-ЛАНКА' },
  { code: 'EC', numCode: '218', nameRu: 'ЭКВАДОР' },
  { code: 'GQ', numCode: '226', nameRu: 'ЭКВАТОРИАЛЬНАЯ ГВИНЕЯ' },
  { code: 'ER', numCode: '232', nameRu: 'ЭРИТРЕЯ' },
  { code: 'EE', numCode: '233', nameRu: 'ЭСТОНИЯ' },
  { code: 'ET', numCode: '231', nameRu: 'ЭФИОПИЯ' },
  { code: 'ZA', numCode: '710', nameRu: 'ЮЖНАЯ АФРИКА' },
  { code: 'SS', numCode: '728', nameRu: 'ЮЖНЫЙ СУДАН' },
  { code: 'GS', numCode: '239', nameRu: 'ЮЖНАЯ ДЖОРДЖИЯ И ЮЖНЫЕ САНДВИЧЕВЫ ОСТРОВА' },
  { code: 'JM', numCode: '388', nameRu: 'ЯМАЙКА' },
  { code: 'JP', numCode: '392', nameRu: 'ЯПОНИЯ' },
];

export function CountrySelect({
  value,
  onChange,
  placeholder = 'Выберите страну',
  disabled = false,
  className,
  error,
  compact = false,
  showNumericCode = false,
  showFullName = false,
}: CountrySelectProps) {
  const [open, setOpen] = React.useState(false);

  // Находим страну по буквенному или числовому коду
  const selectedCountry = React.useMemo(
    () => COUNTRIES.find((c) => c.code === value || c.numCode === value),
    [value]
  );

  // Определяем что показывать
  const getDisplayValue = () => {
    if (!selectedCountry) {
      return compact || showNumericCode ? '...' : placeholder;
    }
    
    // Полное название страны
    if (showFullName) {
      return selectedCountry.nameRu;
    }
    
    if (showNumericCode) {
      return selectedCountry.numCode;
    }
    
    if (compact) {
      return selectedCountry.code;
    }
    
    return selectedCountry.code;
  };

  return (
    <>
      {/* Текст-триггер: зелёный для выбора, чёрный после выбора (если showFullName) */}
      <button
        type="button"
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        className={cn(
          'hover:underline cursor-pointer font-medium text-left truncate',
          // Если выбрано и показываем полное имя - чёрный текст, иначе зелёный
          selectedCountry && showFullName ? 'text-black hover:text-gray-700' : 'text-green-600 hover:text-green-700',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'text-red-500',
          !value && 'text-green-400',
          className
        )}
      >
        {getDisplayValue()}
      </button>

      {/* Модальное окно для выбора */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Выберите страну</DialogTitle>
          </DialogHeader>
          <Command className="border rounded-lg">
            <CommandInput placeholder="Поиск страны..." />
            <CommandList className="max-h-[400px]">
              <CommandEmpty>Страна не найдена</CommandEmpty>
              <CommandGroup>
                {COUNTRIES.map((country) => (
                  <CommandItem
                    key={country.code}
                    value={`${country.code} ${country.numCode} ${country.nameRu}`}
                    onSelect={() => {
                      onChange(country.code, country.numCode);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === country.code ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="font-medium mr-2">{country.code}</span>
                    <span className="text-muted-foreground mr-2">({country.numCode})</span>
                    <span className="truncate">{country.nameRu}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Экспорт списка стран для использования в других компонентах
export { COUNTRIES };
