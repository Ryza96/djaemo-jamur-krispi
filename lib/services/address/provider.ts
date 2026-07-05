import { cache } from "react";
import {
  getProvinces as getKodeWilayahProvinces,
  getRegenciesByBpsProvinceCode,
  getDistrictsByBpsRegencyCode,
  getVillagesByBpsDistrictCode,
} from "kode-wilayah-id";

export interface ProvinceItem {
  id: string;
  name: string;
}

export interface RegencyItem {
  id: string;
  provinceId: string;
  name: string;
}

export interface DistrictItem {
  id: string;
  regencyId: string;
  name: string;
}

export interface VillageItem {
  id: string;
  districtId: string;
  name: string;
  postalCode: string | null;
}

export const getProvinces = cache((): ProvinceItem[] => {
  return getKodeWilayahProvinces()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p) => ({ id: p.bps_code, name: p.name }));
});

export const getRegencies = cache(
  (provinceId: string): RegencyItem[] => {
    return getRegenciesByBpsProvinceCode(provinceId)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((r) => ({
        id: r.bps_code,
        provinceId: r.bps_province_code,
        name: r.name,
      }));
  },
);

export const getDistricts = cache(
  (regencyId: string): DistrictItem[] => {
    return getDistrictsByBpsRegencyCode(regencyId)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((d) => ({
        id: d.bps_code,
        regencyId: d.bps_regency_code,
        name: d.name,
      }));
  },
);

export const getVillages = cache(
  (districtId: string): VillageItem[] => {
    return getVillagesByBpsDistrictCode(districtId)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((v) => ({
        id: v.bps_code,
        districtId: v.bps_district_code,
        name: v.name,
        postalCode: v.postal_code ?? null,
      }));
  },
);
