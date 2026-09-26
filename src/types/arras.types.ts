export type CivilStatus = 'soltero' | 'casado' | 'pareja_de_hecho' | 'divorciado' | 'separado' | 'viudo';
export type MatrimonialRegime = 'gananciales' | 'separacion_bienes' | 'participacion';
export type RelationshipType = 'ninguna' | 'casados_entre_si' | 'pareja_hecho_entre_si';

export interface PersonParty {
  id: string;
  name: string;
  dni: string;
  civilStatus: CivilStatus;
  matrimonialRegime?: MatrimonialRegime;
  address: string;
  street?: string;
  number?: string;
  floorLetter?: string;
  city?: string;
  province?: string;
  zipcode?: string;
  sameAddressAsFirst?: boolean;
}

export interface RepresentativeItem {
  id: string;
  name: string;
  dni: string;
  address?: string;
  street?: string;
  number?: string;
  floorLetter?: string;
  city?: string;
  province?: string;
  zipcode?: string;
  notaryName: string;
  notaryCity: string;
  powerDate: string;
  protocolNumber: string;
  representedPartyIds: string[];
}

export interface FincaItem {
  id: string;
  title: string;
  registryNumber: string;
  registryCity: string;
  registryOfficeNumber?: string;
  cru?: string;
  cadastralReference?: string;
  propertyAddress: string;
  street?: string;
  number?: string;
  floorLetter?: string;
  city?: string;
  province?: string;
  zipcode?: string;
  propertyDescription: string;
  priceAmount?: number;
  priceFormatted?: string;
}

export interface ArrasSignatures {
  seller1?: string;
  seller2?: string;
  buyer1?: string;
  buyer2?: string;
  signedAt?: string;
  [key: string]: string | undefined;
}

export interface ArrasData {
  city: string;
  dateStr: string;
  signatures?: ArrasSignatures;
  
  // Soporte dinámico para múltiples Vendedores, Compradores y Apoderados
  sellers?: PersonParty[];
  buyers?: PersonParty[];
  representatives?: RepresentativeItem[];
  
  // Vendedores (campos compatibles / sincronizados)
  seller1Name: string;
  seller1Dni: string;
  seller1CivilStatus: CivilStatus;
  seller1MatrimonialRegime?: MatrimonialRegime;
  seller1Address: string;
  seller1Street?: string;
  seller1Number?: string;
  seller1FloorLetter?: string;
  seller1City?: string;
  seller1Province?: string;
  seller1Zipcode?: string;
  hasSeller2: boolean;
  seller2Name: string;
  seller2Dni: string;
  seller2CivilStatus: CivilStatus;
  seller2MatrimonialRegime?: MatrimonialRegime;
  sellersRelationship: RelationshipType;
  seller2SameAddress?: boolean;
  seller2Address?: string;
  seller2Street?: string;
  seller2Number?: string;
  seller2FloorLetter?: string;
  seller2City?: string;
  seller2Province?: string;
  seller2Zipcode?: string;
  
  // Compradores (campos compatibles / sincronizados)
  buyer1Name: string;
  buyer1Dni: string;
  buyer1CivilStatus: CivilStatus;
  buyer1MatrimonialRegime?: MatrimonialRegime;
  buyer1Address: string;
  buyer1Street?: string;
  buyer1Number?: string;
  buyer1FloorLetter?: string;
  buyer1City?: string;
  buyer1Province?: string;
  buyer1Zipcode?: string;
  hasBuyer2: boolean;
  buyer2Name: string;
  buyer2Dni: string;
  buyer2CivilStatus: CivilStatus;
  buyer2MatrimonialRegime?: MatrimonialRegime;
  buyersRelationship: RelationshipType;
  buyer2SameAddress?: boolean;
  buyer2Address?: string;
  buyer2Street?: string;
  buyer2Number?: string;
  buyer2FloorLetter?: string;
  buyer2City?: string;
  buyer2Province?: string;
  buyer2Zipcode?: string;
  
  // Fincas (1 o varias)
  fincas: FincaItem[];
  registryNumber?: string;
  registryCity?: string;
  propertyAddress?: string;
  propertyDescription?: string;
  
  // Cargas
  chargesOption: '1' | '2' | '3';
  retentionAmount: string;
  returnDays: string;
  managementMonths: string;
  
  // Cláusulas especiales
  includeKitchenClause: boolean;
  includeFurnitureClause: boolean;
  furnitureDescription: string;
  includePhotoReportClause: boolean;
  selectedPhotos?: { id: string; url: string; title?: string }[];
  includeMortgageSuspensiveClause?: boolean;
  mortgageDays?: string;
  mortgageAmount?: string;
  
  // Economía
  totalPrice: string;
  arrasAmount: string;
  remainingAmount: string;
  totalPriceNum?: number;
  arrasAmountNum?: number;
  remainingAmountNum?: number;
  sellerIban: string;
  
  // Escritura y Fuero
  notaryDeadline: string;
  jurisdictionCity: string;
}

export interface SignerInfo {
  id: string;
  name: string;
  roleDescription: string;
  signatureUrl?: string;
}
