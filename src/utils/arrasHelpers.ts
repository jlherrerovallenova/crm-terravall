import { formatNameWithHonorific } from '@/lib/utils';
import type { ArrasData, PersonParty, SignerInfo } from '@/types/arras.types';

export const getSellersListFromData = (data: ArrasData): PersonParty[] => {
  if (data.sellers && data.sellers.length > 0) {
    return data.sellers;
  }
  const list: PersonParty[] = [
    {
      id: 'seller-1',
      name: data.seller1Name,
      dni: data.seller1Dni,
      civilStatus: data.seller1CivilStatus,
      matrimonialRegime: data.seller1MatrimonialRegime,
      address: data.seller1Address,
      street: data.seller1Street,
      number: data.seller1Number,
      floorLetter: data.seller1FloorLetter,
      city: data.seller1City,
      province: data.seller1Province,
      zipcode: data.seller1Zipcode,
    }
  ];
  if (data.hasSeller2 && data.seller2Name) {
    list.push({
      id: 'seller-2',
      name: data.seller2Name,
      dni: data.seller2Dni,
      civilStatus: data.seller2CivilStatus,
      matrimonialRegime: data.seller2MatrimonialRegime,
      address: data.seller2Address || data.seller1Address,
      street: data.seller2Street,
      number: data.seller2Number,
      floorLetter: data.seller2FloorLetter,
      city: data.seller2City,
      province: data.seller2Province,
      zipcode: data.seller2Zipcode,
      sameAddressAsFirst: data.seller2SameAddress !== false,
    });
  }
  return list;
};

export const getBuyersListFromData = (data: ArrasData): PersonParty[] => {
  if (data.buyers && data.buyers.length > 0) {
    return data.buyers;
  }
  const list: PersonParty[] = [
    {
      id: 'buyer-1',
      name: data.buyer1Name,
      dni: data.buyer1Dni,
      civilStatus: data.buyer1CivilStatus,
      matrimonialRegime: data.buyer1MatrimonialRegime,
      address: data.buyer1Address,
      street: data.buyer1Street,
      number: data.buyer1Number,
      floorLetter: data.buyer1FloorLetter,
      city: data.buyer1City,
      province: data.buyer1Province,
      zipcode: data.buyer1Zipcode,
    }
  ];
  if (data.hasBuyer2 && data.buyer2Name) {
    list.push({
      id: 'buyer-2',
      name: data.buyer2Name,
      dni: data.buyer2Dni,
      civilStatus: data.buyer2CivilStatus,
      matrimonialRegime: data.buyer2MatrimonialRegime,
      address: data.buyer2Address || data.buyer1Address,
      street: data.buyer2Street,
      number: data.buyer2Number,
      floorLetter: data.buyer2FloorLetter,
      city: data.buyer2City,
      province: data.buyer2Province,
      zipcode: data.buyer2Zipcode,
      sameAddressAsFirst: data.buyer2SameAddress !== false,
    });
  }
  return list;
};

export const getSellerSignersFromData = (data: ArrasData): SignerInfo[] => {
  const sellers = getSellersListFromData(data);
  const activeReps = (data.representatives || []).filter(
    (r) => r.name && r.representedPartyIds && r.representedPartyIds.length > 0
  );

  const representedSellerIds = new Set(
    activeReps.flatMap((r) => r.representedPartyIds.filter((pId) => sellers.some((s) => s.id === pId)))
  );

  const signers: SignerInfo[] = [];

  // Apoderados que representan a vendedores
  activeReps.forEach((rep) => {
    const repSellers = sellers.filter((s) => rep.representedPartyIds.includes(s.id));
    if (repSellers.length > 0) {
      const names = repSellers.map((s) => formatNameWithHonorific(s.name) || s.name).join(', ');
      signers.push({
        id: rep.id,
        name: formatNameWithHonorific(rep.name) || 'Apoderado/a',
        roleDescription: `Apoderado/a (en rep. de ${names || 'la parte vendedora'})`,
        signatureUrl: data.signatures?.[rep.id],
      });
    }
  });

  // Vendedores no representados
  sellers.forEach((seller, idx) => {
    if (!representedSellerIds.has(seller.id)) {
      const legacySig = idx === 0 ? data.signatures?.seller1 : idx === 1 ? data.signatures?.seller2 : undefined;
      signers.push({
        id: seller.id,
        name: formatNameWithHonorific(seller.name) || `Vendedor ${idx + 1}`,
        roleDescription: 'Parte Vendedora (Propietario)',
        signatureUrl: data.signatures?.[seller.id] || legacySig,
      });
    }
  });

  return signers;
};

export const getBuyerSignersFromData = (data: ArrasData): SignerInfo[] => {
  const buyers = getBuyersListFromData(data);
  const activeReps = (data.representatives || []).filter(
    (r) => r.name && r.representedPartyIds && r.representedPartyIds.length > 0
  );

  const representedBuyerIds = new Set(
    activeReps.flatMap((r) => r.representedPartyIds.filter((pId) => buyers.some((b) => b.id === pId)))
  );

  const signers: SignerInfo[] = [];

  // Apoderados que representan a compradores
  activeReps.forEach((rep) => {
    const repBuyers = buyers.filter((b) => rep.representedPartyIds.includes(b.id));
    if (repBuyers.length > 0) {
      const names = repBuyers.map((b) => formatNameWithHonorific(b.name) || b.name).join(', ');
      signers.push({
        id: rep.id,
        name: formatNameWithHonorific(rep.name) || 'Apoderado/a',
        roleDescription: `Apoderado/a (en rep. de ${names || 'la parte compradora'})`,
        signatureUrl: data.signatures?.[rep.id],
      });
    }
  });

  // Compradores no representados
  buyers.forEach((buyer, idx) => {
    if (!representedBuyerIds.has(buyer.id)) {
      const legacySig = idx === 0 ? data.signatures?.buyer1 : idx === 1 ? data.signatures?.buyer2 : undefined;
      signers.push({
        id: buyer.id,
        name: formatNameWithHonorific(buyer.name) || `Comprador ${idx + 1}`,
        roleDescription: 'Parte Compradora',
        signatureUrl: data.signatures?.[buyer.id] || legacySig,
      });
    }
  });

  return signers;
};
