"use client";

import { useCallback, useState } from "react";
import { useCheckout } from "@/components/checkout/CheckoutProvider";
import { AreaSelect } from "@/components/checkout/AreaSelect";
import { shippingAddressSchema } from "@/lib/validation/checkout";
import { getDestinationCoords } from "@/lib/services/shipping/getRates";
import type { ShippingAddressInput } from "@/lib/validation/checkout";

interface AreaOption {
  name: string;
  postalCode?: string;
  areaId?: string;
}

interface AddressItem {
  id: string;
  name: string;
  postalCode?: string | null;
}

const inputClass =
  "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary";

const labelClass = "mb-2 block text-sm font-medium text-muted";

async function fetchJson(url: string): Promise<AddressItem[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gagal mengambil data: ${url}`);
  return res.json();
}

export function ShippingAddress() {
  const { state, dispatch } = useCheckout();
  const { shippingAddress } = state;
  const [errors, setErrors] = useState<
    Partial<Record<keyof ShippingAddressInput, string>>
  >({});

  const [provinceId, setProvinceId] = useState("");
  const [regencyId, setRegencyId] = useState("");
  const [districtId, setDistrictId] = useState("");

  function validate(field: keyof ShippingAddressInput) {
    const result = shippingAddressSchema.safeParse(shippingAddress);
    if (!result.success) {
      const fieldError = result.error.issues.find((e) =>
        e.path.includes(field),
      );
      setErrors((prev) => ({
        ...prev,
        [field]: fieldError?.message ?? "",
      }));
    } else {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  }

  function update(field: keyof ShippingAddressInput, value: string | number) {
    dispatch({
      type: "SET_SHIPPING_ADDRESS",
      payload: { [field]: value },
    });
  }

  function resetShipping() {
    dispatch({ type: "SET_SHIPPING_COURIER", payload: "" });
    dispatch({ type: "SET_SHIPPING_SERVICE", payload: "" });
    dispatch({ type: "SET_SHIPPING_FEE", payload: 0 });
  }

  const fetchProvinces = useCallback(async (): Promise<AreaOption[]> => {
    const data = await fetchJson("/api/address/provinces");
    return data.map((p) => ({ name: p.name, areaId: p.id }));
  }, []);

  const fetchCities = useCallback(
    async (): Promise<AreaOption[]> => {
      if (!provinceId) return [];
      const data = await fetchJson(
        `/api/address/regencies?provinceId=${provinceId}`,
      );
      return data.map((r) => ({ name: r.name, areaId: r.id }));
    },
    [provinceId],
  );

  const fetchDistricts = useCallback(
    async (): Promise<AreaOption[]> => {
      if (!regencyId) return [];
      const data = await fetchJson(
        `/api/address/districts?regencyId=${regencyId}`,
      );
      return data.map((d) => ({ name: d.name, areaId: d.id }));
    },
    [regencyId],
  );

  const fetchVillages = useCallback(
    async (): Promise<AreaOption[]> => {
      if (!districtId) return [];
      const data = await fetchJson(
        `/api/address/villages?districtId=${districtId}`,
      );
      return data.map((v) => ({
        name: v.name,
        areaId: v.id,
        postalCode: v.postalCode ?? undefined,
      }));
    },
    [districtId],
  );

  function handleProvinceSelect(_value: string, option?: AreaOption) {
    if (option) {
      const pid = option.areaId || "";
      dispatch({
        type: "SET_SHIPPING_ADDRESS",
        payload: {
          province: option.name,
          city: "",
          kecamatan: "",
          kelurahan: "",
          districtName: "",
          postalCode: "",
          areaId: "",
          latitude: 0,
          longitude: 0,
        },
      });
      setProvinceId(pid);
      setRegencyId("");
      setDistrictId("");
      resetShipping();
    }
  }

  function handleCitySelect(_value: string, option?: AreaOption) {
    if (option) {
      const rid = option.areaId || "";
      const coords = getDestinationCoords(option.name);
      dispatch({
        type: "SET_SHIPPING_ADDRESS",
        payload: {
          city: option.name,
          kecamatan: "",
          kelurahan: "",
          districtName: "",
          postalCode: "",
          areaId: "",
          latitude: coords?.lat ?? 0,
          longitude: coords?.lng ?? 0,
        },
      });
      setRegencyId(rid);
      setDistrictId("");
      resetShipping();
    }
  }

  function handleDistrictSelect(_value: string, option?: AreaOption) {
    if (option) {
      const did = option.areaId || "";
      const coords = getDestinationCoords(shippingAddress.city);
      dispatch({
        type: "SET_SHIPPING_ADDRESS",
        payload: {
          kecamatan: option.name,
          kelurahan: "",
          districtName: option.name,
          postalCode: "",
          areaId: "",
          latitude: coords?.lat ?? shippingAddress.latitude,
          longitude: coords?.lng ?? shippingAddress.longitude,
        },
      });
      setDistrictId(did);
      resetShipping();
    }
  }

  function handleVillageSelect(_value: string, option?: AreaOption) {
    if (option) {
      dispatch({
        type: "SET_SHIPPING_ADDRESS",
        payload: {
          kelurahan: option.name,
          postalCode: option.postalCode || "",
        },
      });
    }
  }

  const noPostalCode =
    shippingAddress.kelurahan && !shippingAddress.postalCode;

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="address-street" className={labelClass}>
          Alamat Jalan <span className="text-red-500">*</span>
        </label>
        <textarea
          id="address-street"
          value={shippingAddress.street}
          onChange={(e) => update("street", e.target.value)}
          onBlur={() => validate("street")}
          placeholder="Nama jalan, gedung, nomor rumah"
          rows={2}
          className={`${inputClass} min-h-[60px] resize-none`}
          aria-invalid={!!errors.street}
          aria-describedby={errors.street ? "address-street-error" : undefined}
        />
        {errors.street && (
          <p id="address-street-error" className="mt-1 text-xs text-red-500">
            {errors.street}
          </p>
        )}
      </div>

      <AreaSelect
        key={`province-${shippingAddress.province}`}
        label="Provinsi"
        value={shippingAddress.province}
        onChange={handleProvinceSelect}
        fetchOptions={fetchProvinces}
        placeholder="Ketik minimal 3 huruf (contoh: Jaw, Ace)"
        error={errors.province}
      />

      <AreaSelect
        key={`city-${shippingAddress.province}`}
        label="Kota"
        value={shippingAddress.city}
        onChange={handleCitySelect}
        fetchOptions={fetchCities}
        placeholder={
          shippingAddress.province
            ? "Ketik minimal 3 huruf"
            : "Pilih provinsi terlebih dahulu"
        }
        disabled={!shippingAddress.province}
        error={errors.city}
      />

      <AreaSelect
        key={`district-${shippingAddress.city}`}
        label="Kecamatan"
        value={shippingAddress.kecamatan}
        onChange={handleDistrictSelect}
        fetchOptions={fetchDistricts}
        placeholder={
          shippingAddress.city
            ? "Ketik minimal 3 huruf"
            : "Pilih kota terlebih dahulu"
        }
        disabled={!shippingAddress.city}
        error={errors.kecamatan}
      />

      <AreaSelect
        key={`village-${shippingAddress.kecamatan}`}
        label="Kelurahan"
        value={shippingAddress.kelurahan}
        onChange={handleVillageSelect}
        fetchOptions={fetchVillages}
        placeholder={
          shippingAddress.kecamatan
            ? "Ketik minimal 3 huruf"
            : "Pilih kecamatan terlebih dahulu"
        }
        disabled={!shippingAddress.kecamatan}
        error={errors.kelurahan}
      />

      <div>
        <label htmlFor="address-postal-code" className={labelClass}>
          Kode Pos <span className="text-red-500">*</span>
        </label>
        <input
          id="address-postal-code"
          type="text"
          value={shippingAddress.postalCode}
          onChange={(e) => update("postalCode", e.target.value)}
          onBlur={() => validate("postalCode")}
          placeholder="Terisi otomatis"
          maxLength={5}
          className={`${inputClass} max-w-[200px]`}
          aria-invalid={!!errors.postalCode}
          aria-describedby={
            errors.postalCode ? "address-postal-code-error" : undefined
          }
        />
        {noPostalCode && (
          <p className="mt-1 text-xs text-muted">Tidak tersedia</p>
        )}
        {errors.postalCode && (
          <p id="address-postal-code-error" className="mt-1 text-xs text-red-500">
            {errors.postalCode}
          </p>
        )}
      </div>
    </div>
  );
}
