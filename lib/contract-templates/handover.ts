import {
  type ContractData,
  type ContractContent,
  formatCzechPrice,
  formatCzechDate,
} from "./index";

export function generateHandoverProtocol(data: ContractData): ContractContent {
  const { seller, broker, vehicle, price } = data;
  const formattedPrice = formatCzechPrice(price);
  const formattedDate = formatCzechDate(data.date);

  return {
    title: "Předávací protokol",
    contractNumber: data.contractNumber,
    date: formattedDate,
    sections: [
      {
        heading: "I. Smluvní strany",
        content: `
Přebírající strana:
Carmakler s.r.o.
zastoupený makléřem: ${broker.name}
${broker.email ? `Email: ${broker.email}` : ""}
${broker.phone ? `Tel: ${broker.phone}` : ""}

Předávající strana:
${seller.name}
${seller.address ? `Adresa: ${seller.address}` : ""}
${seller.idNumber ? `Rodné číslo: ${seller.idNumber}` : ""}
${seller.idCard ? `Číslo OP: ${seller.idCard}` : ""}
Tel: ${seller.phone}
${seller.email ? `Email: ${seller.email}` : ""}
        `.trim(),
      },
      {
        heading: "II. Předmět předání",
        content: `
Předmětem tohoto protokolu je předání následujícího motorového vozidla:

Značka a model: ${vehicle.brand} ${vehicle.model}${vehicle.variant ? ` ${vehicle.variant}` : ""}
VIN: ${vehicle.vin}
Rok výroby: ${vehicle.year}
Stav tachometru při předání: ${new Intl.NumberFormat("cs-CZ").format(vehicle.mileage)} km
Stav vozidla: ${translateCondition(vehicle.condition)}
${vehicle.color ? `Barva: ${vehicle.color}` : ""}
Palivo: ${translateFuelType(vehicle.fuelType)}
Převodovka: ${translateTransmission(vehicle.transmission)}
${vehicle.enginePower ? `Výkon: ${vehicle.enginePower} kW` : ""}

Dohodnutá cena: ${formattedPrice}
        `.trim(),
      },
      {
        heading: "III. Stav vozidla při předání",
        content: `
Vnější stav karoserie: _______________
Interiér: _______________
Pneumatiky (stav/hloubka dezénu): _______________
Funkčnost osvětlení: ANO / NE
Funkčnost klimatizace: ANO / NE
Funkčnost rádia/navigace: ANO / NE
Viditelná poškození: _______________
        `.trim(),
      },
      {
        heading: "IV. Předané příslušenství a doklady",
        content: `
[ ] Klíče od vozidla (počet: ___)
[ ] Velký technický průkaz
[ ] Malý technický průkaz (OTP)
[ ] Servisní knížka
[ ] Návod k obsluze
[ ] Povinná výbava
[ ] Lékárnička
[ ] Výstražný trojúhelník
[ ] Náhradní kolo / sada na opravu
[ ] Další: _______________
        `.trim(),
      },
      {
        heading: "V. Prohlášení",
        content: `
Předávající prohlašuje, že:
1. Je oprávněným vlastníkem vozidla
2. Na vozidle neváznou žádné zástavy ani jiná práva třetích osob
3. Údaje uvedené v tomto protokolu jsou pravdivé a úplné

Přebírající potvrzuje, že:
1. Převzal vozidlo ve stavu popsaném výše
2. Převzal všechny uvedené doklady a příslušenství
3. Byl seznámen se stavem vozidla

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
