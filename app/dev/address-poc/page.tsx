"use client";

import { useState } from "react";
import {
  getProvinces,
  getRegenciesByBpsProvinceCode,
  getDistrictsByBpsRegencyCode,
  getVillagesByBpsDistrictCode,
} from "kode-wilayah-id";

export default function AddressPocPage() {
  const provinces = getProvinces().sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedRegency, setSelectedRegency] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedVillage, setSelectedVillage] = useState<string>("");

  const regencies = selectedProvince
    ? getRegenciesByBpsProvinceCode(selectedProvince).sort((a, b) =>
        a.name.localeCompare(b.name),
      )
    : [];

  const districts = selectedRegency
    ? getDistrictsByBpsRegencyCode(selectedRegency).sort((a, b) =>
        a.name.localeCompare(b.name),
      )
    : [];

  const villages = selectedDistrict
    ? getVillagesByBpsDistrictCode(selectedDistrict).sort((a, b) =>
        a.name.localeCompare(b.name),
      )
    : [];

  const selectedVillageData = selectedVillage
    ? getVillagesByBpsDistrictCode(selectedDistrict).find(
        (v) => v.bps_code === selectedVillage || v.kemendagri_code === selectedVillage,
      )
    : null;

  function handleProvinceChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedProvince(e.target.value);
    setSelectedRegency("");
    setSelectedDistrict("");
    setSelectedVillage("");
  }

  function handleRegencyChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedRegency(e.target.value);
    setSelectedDistrict("");
    setSelectedVillage("");
  }

  function handleDistrictChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedDistrict(e.target.value);
    setSelectedVillage("");
  }

  function handleVillageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedVillage(e.target.value);
  }

  return (
    <div style={{ padding: "24px", fontFamily: "monospace", maxWidth: "600px" }}>
      <h1>Address PoC — kode-wilayah-id</h1>
      <p style={{ color: "#666", fontSize: "14px", marginBottom: "24px" }}>
        Zero network requests. Data loaded from npm package.
      </p>

      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
          Provinsi
        </label>
        <select
          value={selectedProvince}
          onChange={handleProvinceChange}
          style={{ width: "100%", padding: "8px" }}
        >
          <option value="">-- Pilih Provinsi --</option>
          {provinces.map((p) => (
            <option key={p.bps_code} value={p.bps_code}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
          Kabupaten/Kota
        </label>
        <select
          value={selectedRegency}
          onChange={handleRegencyChange}
          disabled={!selectedProvince}
          style={{ width: "100%", padding: "8px" }}
        >
          <option value="">-- Pilih Kabupaten/Kota --</option>
          {regencies.map((r) => (
            <option key={r.bps_code} value={r.bps_code}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
          Kecamatan
        </label>
        <select
          value={selectedDistrict}
          onChange={handleDistrictChange}
          disabled={!selectedRegency}
          style={{ width: "100%", padding: "8px" }}
        >
          <option value="">-- Pilih Kecamatan --</option>
          {districts.map((d) => (
            <option key={d.bps_code} value={d.bps_code}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
          Desa/Kelurahan
        </label>
        <select
          value={selectedVillage}
          onChange={handleVillageChange}
          disabled={!selectedDistrict}
          style={{ width: "100%", padding: "8px" }}
        >
          <option value="">-- Pilih Desa/Kelurahan --</option>
          {villages.map((v) => (
            <option key={v.bps_code} value={v.bps_code}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
          Kode Pos
        </label>
        <input
          type="text"
          value={selectedVillageData?.postal_code ?? ""}
          readOnly
          placeholder="Kode Pos (otomatis)"
          style={{ width: "100%", padding: "8px", background: "#f5f5f5" }}
        />
      </div>

      {selectedVillageData && (
        <div
          style={{
            marginTop: "24px",
            padding: "16px",
            background: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: "8px",
            fontSize: "14px",
          }}
        >
          <strong>Alamat Lengkap:</strong>
          <p style={{ margin: "8px 0 0 0" }}>
            {selectedVillageData.name},{" "}
            {districts.find((d) => d.bps_code === selectedDistrict)?.name},{" "}
            {regencies.find((r) => r.bps_code === selectedRegency)?.name},{" "}
            {provinces.find((p) => p.bps_code === selectedProvince)?.name}{" "}
            {selectedVillageData.postal_code ?? ""}
          </p>
        </div>
      )}
    </div>
  );
}
