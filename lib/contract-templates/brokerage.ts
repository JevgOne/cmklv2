import {
  type ContractData,
  type ContractContent,
  formatCzechPrice,
  formatCzechDate,
} from "./index";

export function generateBrokerageContract(data: ContractData): ContractContent {
  const { seller, broker, vehicle, price, commission } = data;
  const formattedPrice = formatCzechPrice(price);
  const formattedCommission = formatCzechPrice(commission);
  const formattedDate = formatCzechDate(data.date);

  return {
    title: "Zprostředkovatelská smlouva",
    contractNumber: data.contractNumber,
    date: formattedDate,
    sections: [
      {
        heading: "I. Smluvní strany",
        content: `
Zprostředkovatel:
Carmakler s.r.o.
zastoupený makléřem: ${broker.name}
${broker.email ? `Email: ${broker.email}` : ""}
${broker.phone ? `Tel: ${broker.phone}` : ""}
(dále jen "Zprostředkovatel")

Prodejce:
${seller.name}
${seller.address ? `Adresa: ${seller.address}` : ""}
${seller.idNumber ? `Rodné číslo: ${seller.idNumber}` : ""}
${seller.idCard ? `Číslo OP: ${seller.idCard}` : ""}
Tel: ${seller.phone}
${seller.email ? `Email: ${seller.email}` : ""}
${seller.bankAccount ? `Bankovní účet: ${seller.bankAccount}` : ""}
(dále jen "Prodejce")
        `.trim(),
      },
      {
        heading: "II. Předmět smlouvy",
        content: `
Prodejce tímto pověřuje Zprostředkovatele zprostředkováním prodeje následujícího motorového vozidla:

Značka a model: ${vehicle.brand} ${vehicle.model}${vehicle.variant ? ` ${vehicle.variant}` : ""}
VIN: ${vehicle.vin}
Rok výroby: ${vehicle.year}
Stav tachometru: ${new Intl.NumberFormat("cs-CZ").format(vehicle.mileage)} km
Stav vozidla: ${translateCondition(vehicle.condition)}
${vehicle.color ? `Barva: ${vehicle.color}` : ""}
Palivo: ${translateFuelType(vehicle.fuelType)}
Převodovka: ${translateTransmission(vehicle.transmission)}
${vehicle.enginePower ? `Výkon: ${vehicle.enginePower} kW` : ""}
        `.trim(),
      },
      {
        heading: "III. Cena a provize",
        content: `
Požadovaná prodejní cena vozidla: ${formattedPrice}
Provize zprostředkovatele: ${formattedCommission}

Provize je splatná při úspěšném zprostředkování prodeje vozidla. Prodejce se zavazuje uhradit provizi na bankovní účet Zprostředkovatele do 5 pracovních dnů od uzavření kupní smlouvy s kupujícím.
        `.trim(),
      },
      {
        heading: "IV. Práva a povinnosti",
        content: `
1. Zprostředkovatel se zavazuje:
   a) Aktivně vyhledávat potenciální kupce vozidla
   b) Prezentovat vozidlo na příslušných prodejních kanálech
   c) Zajistit prohlídky vozidla s potenciálními kupci
   d) Informovat Prodejce o průběhu zprostředkování

2. Prodejce se zavazuje:
   a) Poskytnout pravdivé a úplné informace o vozidle
   b) Umožnit prohlídky vozidla potenciálním kupcům
   c) Neprodávat vozidlo mimo tuto smlouvu po dobu její platnosti
   d) Uhradit sjednanou provizi při úspěšném prodeji
        `.trim(),
      },
      {
        heading: "V. Doba platnosti",
        content: `
Tato smlouva se uzavírá na dobu určitou 3 měsíce od data podpisu. Smlouvu lze ukončit písemnou dohodou obou stran nebo písemnou výpovědí s 14denní výpovědní lhůtou.
        `.trim(),
      },
      {
        heading: "VI. Závěrečná ustanovení",
        content: `
1. Tato smlouva je vyhotovena elektronicky a nabývá platnosti podpisem obou smluvních stran.
2. Smlouva se řídí právním řádem České republiky.
3. Veškeré změny smlouvy musí být provedeny písemně.
4. Smluvní strany prohlašují, že si smlouvu přečetly, souhlasí s jejím obsahem a na důkaz toho připojují své podpisy.

V _________________, dne ${formattedDate}
        `.trim(),
      },
    ],
  };
}

function translateCondition(condition: string): string {
  const map: Record<string, string> = {
    NEW: "Nové",
    LIKE_NEW: "Jako nové",
    EXCELLENT: "Výborný",
    GOOD: "Dobrý",
    FAIR: "Uspokojivý",
    DAMAGED: "Poškozené",
  };
  return map[condition] || condition;
}

function translateFuelType(fuelType: string): string {
  const map: Record<string, string> = {
    PETROL: "Benzín",
    DIESEL: "Diesel",
    ELECTRIC: "Elektro",
    HYBRID: "Hybrid",
    PLUGIN_HYBRID: "Plug-in Hybrid",
    LPG: "LPG",
    CNG: "CNG",
  };
  return map[fuelType] || fuelType;
}

function translateTransmission(transmission: string): string {
  const map: Record<string, string> = {
    MANUAL: "Manuální",
    AUTOMATIC: "Automatická",
    DSG: "DSG",
    CVT: "CVT",
  };
  return map[transmission] || transmission;
}
