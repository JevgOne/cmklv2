import { formatCzechDate } from "./index";

export interface BrokerAgreementData {
  brokerName: string;
  brokerIco: string;
  brokerAddress?: string;
  brokerEmail: string;
  brokerPhone: string;
  date: string | Date;
}

export interface BrokerAgreementContent {
  title: string;
  date: string;
  sections: { heading: string; content: string }[];
}

export function generateBrokerAgreement(
  data: BrokerAgreementData
): BrokerAgreementContent {
  const formattedDate = formatCzechDate(data.date);

  return {
    title: "Smlouva o spolupráci",
    date: formattedDate,
    sections: [
      {
        heading: "I. Smluvní strany",
        content: `
Carmakler s.r.o.
IČO: 12345678
se sídlem: Praha 1, Národní 10
(dále jen "Carmakler")

a

${data.brokerName}
IČO: ${data.brokerIco}
Email: ${data.brokerEmail}
Tel: ${data.brokerPhone}
(dále jen "Makléř")`.trim(),
      },
      {
        heading: "II. Předmět smlouvy",
        content: `
Předmětem této smlouvy je úprava podmínek spolupráce mezi Carmakler a Makléřem při zprostředkování prodeje motorových vozidel. Makléř bude jako nezávislý spolupracovník vyhledávat prodejce vozidel, uzavírat s nimi zprostředkovatelské smlouvy jménem Carmakler a zajišťovat kompletní servis spojený s prodejem vozidla.`.trim(),
      },
      {
        heading: "III. Práva a povinnosti Makléře",
        content: `
1. Makléř se zavazuje jednat v souladu s pokyny a standardy Carmakler.
2. Makléř bude pořizovat kvalitní fotodokumentaci vozidel (min. 12 fotografií).
3. Makléř provede základní kontrolu technického stavu vozidla.
4. Makléř zajistí podpis zprostředkovatelské smlouvy s prodejcem.
5. Makléř nesmí jednat v rozporu se zájmy Carmakler ani prodejce.
6. Makléř je povinen dodržovat GDPR a zachovávat mlčenlivost o údajích klientů.
7. Makléř nese odpovědnost za správnost údajů uvedených v inzerátu.`.trim(),
      },
      {
        heading: "IV. Provize",
        content: `
1. Makléř má nárok na provizi ve výši 5 % z prodejní ceny vozidla, minimálně však 25 000 Kč.
2. Provize je splatná do 14 dnů od úspěšného prodeje vozidla.
3. Provize bude vyplacena na bankovní účet Makléře uvedený v systému Carmakler.
4. V případě zrušení prodeje nemá Makléř na provizi nárok.`.trim(),
      },
      {
        heading: "V. Trvání a ukončení smlouvy",
        content: `
1. Tato smlouva se uzavírá na dobu neurčitou.
2. Každá smluvní strana může smlouvu vypovědět s výpovědní lhůtou 30 dní.
3. Carmakler může smlouvu okamžitě ukončit v případě závažného porušení povinností Makléřem.
4. Ukončením smlouvy nezanikají nároky na dosud nevyplacené provize za realizované prodeje.`.trim(),
      },
      {
        heading: "VI. Závěrečná ustanovení",
        content: `
1. Tato smlouva nabývá platnosti dnem podpisu oběma smluvními stranami.
2. Smlouva je vyhotovena elektronicky a podepsána digitálním podpisem.
3. Vztahy neupravené touto smlouvou se řídí příslušnými ustanoveními občanského zákoníku.

V Praze dne ${formattedDate}`.trim(),
      },
    ],
  };
}
