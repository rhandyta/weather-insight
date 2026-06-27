"use client";

import {
  useState,
  useCallback,
  useEffect,
  useTransition,
} from "react";
import Select, { StylesConfig } from "react-select";

// ─── Types ───────────────────────────────────────────────────────

interface WilayahItem {
  code: string;
  name: string;
}

interface WilayahResponse {
  data: WilayahItem[];
  meta: { administrative_area_level: number; updated_at: string };
}

interface WeatherEntry {
  datetime: string;
  t: number;
  tcc: number;
  tp: number;
  weather: number;
  weather_desc: string;
  weather_desc_en: string;
  wd_deg: number;
  wd: string;
  wd_to: string;
  ws: number;
  hu: number;
  vs: number;
  vs_text: string;
  time_index: string;
  analysis_date: string;
  image: string;
  utc_datetime: string;
  local_datetime: string;
}

interface LocationData {
  adm1: string;
  adm2: string;
  adm3: string;
  adm4: string;
  provinsi: string;
  kotkab: string;
  kecamatan: string;
  desa: string;
  lon: number;
  lat: number;
  timezone: string;
  type?: string;
}

interface WeatherData {
  lokasi: LocationData;
  data: Array<{ lokasi: LocationData; cuaca: WeatherEntry[][] }>;
}

// ─── Env-driven constants ────────────────────────────────────────

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "CuacaKini";
const SITE_TAGLINE = process.env.NEXT_PUBLIC_SITE_TAGLINE ?? "Prakiraan Cuaca Indonesia";

// ─── Helpers ─────────────────────────────────────────────────────

function formatLocalTime(dateStr: string): string {
  const d = new Date(dateStr.replace(" ", "T"));
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatLocalDate(dateStr: string): string {
  const d = new Date(dateStr.replace(" ", "T"));
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr.replace(" ", "T"));
  return d.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function getWindDirection(wd: string): string {
  const map: Record<string, string> = {
    N: "Utara", NE: "Timur Laut", E: "Timur", SE: "Tenggara",
    S: "Selatan", SW: "Barat Daya", W: "Barat", NW: "Barat Laut",
  };
  return map[wd] ?? wd;
}

function groupByDay(entries: WeatherEntry[]): Map<string, WeatherEntry[]> {
  const groups = new Map<string, WeatherEntry[]>();
  for (const e of entries) {
    const key = e.local_datetime.split(" ")[0];
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }
  return groups;
}

function findCurrentWeather(entries: WeatherEntry[]): WeatherEntry {
  const now = new Date();
  let closest = entries[0];
  let minDiff = Infinity;
  for (const e of entries) {
    const diff = Math.abs(now.getTime() - new Date(e.local_datetime.replace(" ", "T")).getTime());
    if (diff < minDiff) { minDiff = diff; closest = e; }
  }
  return closest;
}

// ─── React Select Styles ───────────────────────────────────────────────

const customSelectStyles: StylesConfig<any, false> = {
  control: (base, state) => ({
    ...base,
    background: "rgba(255, 255, 255, 0.05)",
    borderColor: state.isFocused ? "#38bdf8" : "rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    minHeight: "46px",
    boxShadow: state.isFocused ? "0 0 0 1px #38bdf8" : "none",
    "&:hover": {
      borderColor: "#38bdf8",
      background: "rgba(255, 255, 255, 0.08)",
    },
    cursor: "pointer",
  }),
  menu: (base) => ({
    ...base,
    background: "#141e30",
    border: "1px solid rgba(56, 189, 248, 0.2)",
    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.5)",
    zIndex: 100,
    borderRadius: "8px",
  }),
  option: (base, state) => ({
    ...base,
    background: state.isSelected
      ? "rgba(56, 189, 248, 0.15)"
      : state.isFocused
      ? "rgba(255, 255, 255, 0.08)"
      : "transparent",
    color: state.isSelected ? "#38bdf8" : "#9ca3af",
    cursor: "pointer",
    "&:hover": {
      background: "rgba(255, 255, 255, 0.08)",
      color: "#f3f4f6",
    },
  }),
  singleValue: (base) => ({
    ...base,
    color: "#f3f4f6",
    fontSize: "0.875rem",
    fontWeight: 500,
  }),
  input: (base) => ({
    ...base,
    color: "#f3f4f6",
  }),
  placeholder: (base) => ({
    ...base,
    color: "#9ca3af",
    fontSize: "0.85rem",
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "#9ca3af",
    "&:hover": {
      color: "#f3f4f6",
    },
  }),
};

// ─── Main Component ───────────────────────────────────────────────

export default function WeatherApp() {
  // Wilayah selection state
  const [provinces, setProvinces] = useState<WilayahItem[]>([]);
  const [regencies, setRegencies] = useState<WilayahItem[]>([]);
  const [districts, setDistricts] = useState<WilayahItem[]>([]);
  const [villages, setVillages] = useState<WilayahItem[]>([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedRegency, setSelectedRegency] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("");

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingRegencies, setLoadingRegencies] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // Weather state
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState(0);

  const [, startTransition] = useTransition();

  // Fetch provinces on mount
  useEffect(() => {
    setLoadingProvinces(true);
    fetch("/api/wilayah?level=provinces")
      .then((r) => r.json())
      .then((d: WilayahResponse) => setProvinces(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingProvinces(false));
  }, []);

  // Fetch regencies when province changes
  const handleProvinceChange = useCallback((code: string) => {
    setSelectedProvince(code);
    setSelectedRegency("");
    setSelectedDistrict("");
    setSelectedVillage("");
    setRegencies([]);
    setDistricts([]);
    setVillages([]);
    setWeatherData(null);
    setError(null);

    if (!code) return;
    setLoadingRegencies(true);
    fetch(`/api/wilayah?level=regencies&code=${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((d: WilayahResponse) => setRegencies(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingRegencies(false));
  }, []);

  // Fetch districts when regency changes
  const handleRegencyChange = useCallback((code: string) => {
    setSelectedRegency(code);
    setSelectedDistrict("");
    setSelectedVillage("");
    setDistricts([]);
    setVillages([]);
    setWeatherData(null);
    setError(null);

    if (!code) return;
    setLoadingDistricts(true);
    fetch(`/api/wilayah?level=districts&code=${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((d: WilayahResponse) => setDistricts(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingDistricts(false));
  }, []);

  // Fetch villages when district changes
  const handleDistrictChange = useCallback((code: string) => {
    setSelectedDistrict(code);
    setSelectedVillage("");
    setVillages([]);
    setWeatherData(null);
    setError(null);

    if (!code) return;
    setLoadingVillages(true);
    fetch(`/api/wilayah?level=villages&code=${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((d: WilayahResponse) => setVillages(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingVillages(false));
  }, []);

  // Fetch weather when village selected
  const handleVillageChange = useCallback((code: string) => {
    setSelectedVillage(code);
    setWeatherData(null);
    setError(null);

    if (!code) return;

    setLoadingWeather(true);
    startTransition(() => {
      fetch(`/api/weather?adm4=${encodeURIComponent(code)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else if (!data.data || data.data.length === 0) {
            setError("Data cuaca tidak tersedia untuk lokasi ini.");
          } else {
            setWeatherData(data);
            setActiveDay(0);
            announce(`Data cuaca berhasil dimuat`);
          }
        })
        .catch(() => setError("Koneksi gagal. Periksa jaringan internet Anda."))
        .finally(() => setLoadingWeather(false));
    });
  }, []);

  function announce(msg: string) {
    const el = document.getElementById("sr-announcement");
    if (el) { el.textContent = ""; setTimeout(() => { el.textContent = msg; }, 50); }
  }

  // Derived weather data
  const allEntries = weatherData?.data[0]?.cuaca?.flat() ?? [];
  const dayGroups = groupByDay(allEntries);
  const dayKeys = Array.from(dayGroups.keys());
  const currentDayEntries = dayKeys[activeDay] ? dayGroups.get(dayKeys[activeDay]) ?? [] : [];
  const currentWeather = allEntries.length > 0 ? findCurrentWeather(allEntries) : null;

  const isReadyToSearch = !!selectedVillage;
  const mapOptions = (items: WilayahItem[]) => items.map(i => ({ value: i.code, label: i.name }));

  return (
    <>
      <div id="sr-announcement" aria-live="polite" aria-atomic="true" className="sr-only" />

      {/* Header */}
      <header className="header" role="banner">
        <div className="container">
          <div className="header-inner">
            <div className="header-brand">
              <div className="header-logo" aria-hidden="true">🌤️</div>
              <span className="header-title">{SITE_NAME}</span>
            </div>
            <div className="header-badge" aria-label="Data real-time dari BMKG">
              <span className="header-badge-dot" aria-hidden="true" />
              <span>Data BMKG</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main id="main-content" role="main" className="container">

        {/* Hero */}
        <section className="hero" aria-label="Pencarian cuaca">
          <h1 className="hero-title">{SITE_TAGLINE}</h1>
          <p className="hero-subtitle">
            Data cuaca terkini dari{" "}
            <abbr title="Badan Meteorologi, Klimatologi, dan Geofisika">BMKG</abbr>{" "}
            untuk seluruh kelurahan dan desa di Indonesia. Pilih lokasi Anda untuk melihat
            prakiraan 3 hari.
          </p>
        </section>

        {/* Location Selector */}
        <section
          className="location-selector"
          aria-label="Pilih lokasi"
        >

          {/* Dropdowns Grid */}
          <div className="ls-grid">
            <div className="ws-container">
              <label htmlFor="select-province" className="ws-label">Provinsi</label>
              <Select
                instanceId="select-province"
                inputId="select-province"
                options={mapOptions(provinces)}
                value={mapOptions(provinces).find(o => o.value === selectedProvince) || null}
                onChange={(option) => handleProvinceChange(option?.value || "")}
                isLoading={loadingProvinces}
                placeholder="Pilih provinsi..."
                styles={customSelectStyles}
                noOptionsMessage={() => "Tidak ditemukan"}
              />
            </div>
            
            <div className="ws-container">
              <label htmlFor="select-regency" className="ws-label">Kabupaten / Kota</label>
              <Select
                instanceId="select-regency"
                inputId="select-regency"
                options={mapOptions(regencies)}
                value={mapOptions(regencies).find(o => o.value === selectedRegency) || null}
                onChange={(option) => handleRegencyChange(option?.value || "")}
                isDisabled={!selectedProvince}
                isLoading={loadingRegencies}
                placeholder={!selectedProvince ? "Pilih provinsi dulu" : "Pilih kab/kota..."}
                styles={customSelectStyles}
                noOptionsMessage={() => "Tidak ditemukan"}
              />
            </div>

            <div className="ws-container">
              <label htmlFor="select-district" className="ws-label">Kecamatan</label>
              <Select
                instanceId="select-district"
                inputId="select-district"
                options={mapOptions(districts)}
                value={mapOptions(districts).find(o => o.value === selectedDistrict) || null}
                onChange={(option) => handleDistrictChange(option?.value || "")}
                isDisabled={!selectedRegency}
                isLoading={loadingDistricts}
                placeholder={!selectedRegency ? "Pilih kab/kota dulu" : "Pilih kecamatan..."}
                styles={customSelectStyles}
                noOptionsMessage={() => "Tidak ditemukan"}
              />
            </div>

            <div className="ws-container">
              <label htmlFor="select-village" className="ws-label">Desa / Kelurahan</label>
              <Select
                instanceId="select-village"
                inputId="select-village"
                options={mapOptions(villages)}
                value={mapOptions(villages).find(o => o.value === selectedVillage) || null}
                onChange={(option) => { 
                  handleVillageChange(option?.value || ""); 
                  if (option) announce(`Memuat cuaca ${option.label}`); 
                }}
                isDisabled={!selectedDistrict}
                isLoading={loadingVillages}
                placeholder={!selectedDistrict ? "Pilih kecamatan dulu" : "Pilih desa/kel..."}
                styles={customSelectStyles}
                noOptionsMessage={() => "Tidak ditemukan"}
              />
            </div>
          </div>

          {/* Ready indicator */}
          {isReadyToSearch && !loadingWeather && !weatherData && !error && (
            <p className="ls-hint" role="status">
              ✅ Lokasi dipilih — data cuaca akan dimuat otomatis
            </p>
          )}
        </section>

        {/* Loading Weather */}
        {loadingWeather && (
          <section aria-label="Memuat data cuaca" aria-busy="true">
            <div className="skeleton skeleton-current" role="progressbar" aria-label="Memuat cuaca saat ini" />
            <div className="skeleton skeleton-title" />
            <div className="skeleton-cards" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton skeleton-card" />
              ))}
            </div>
          </section>
        )}

        {/* Error */}
        {error && !loadingWeather && (
          <div className="error-container" role="alert">
            <div className="error-icon" aria-hidden="true">⚠️</div>
            <h2 className="error-title">Gagal Memuat Data</h2>
            <p className="error-message">{error}</p>
            <button
              className="error-retry-btn"
              onClick={() => selectedVillage && handleVillageChange(selectedVillage)}
              type="button"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loadingWeather && !error && !weatherData && (
          <section className="empty-state" aria-label="Belum ada data">
            <div className="empty-icon" aria-hidden="true">🌏</div>
            <h2 className="empty-title">Pilih Lokasi Anda</h2>
            <p className="empty-desc">
              Gunakan dropdown di atas untuk memilih provinsi, kabupaten/kota,
              kecamatan, dan desa/kelurahan. Data cuaca akan tampil secara otomatis.
            </p>
          </section>
        )}

        {/* Weather Results */}
        {!loadingWeather && weatherData && currentWeather && (
          <div className="animate-fadeIn">
            {/* Current Weather Card */}
            <section
              className="current-weather"
              aria-label={`Cuaca saat ini di ${weatherData.lokasi.desa}`}
            >
              <div className="current-weather-grid">
                <div className="cw-main">
                  <div className="cw-location">
                    <span className="cw-location-icon" aria-hidden="true">📍</span>
                    <h2 className="cw-location-name">{weatherData.lokasi.desa}</h2>
                  </div>
                  <p className="cw-location-detail">
                    {weatherData.lokasi.kecamatan}, {weatherData.lokasi.kotkab},{" "}
                    {weatherData.lokasi.provinsi}
                  </p>
                  <div className="cw-temp-row">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="cw-icon"
                      src={currentWeather.image}
                      alt={currentWeather.weather_desc}
                      width={80}
                      height={80}
                      loading="eager"
                    />
                    <div>
                      <div className="cw-temp" aria-label={`Suhu ${currentWeather.t} derajat Celsius`}>
                        {currentWeather.t}<sup>°C</sup>
                      </div>
                    </div>
                  </div>
                  <p className="cw-desc">{currentWeather.weather_desc}</p>
                </div>

                <div className="cw-details" role="list" aria-label="Detail cuaca">
                  {[
                    { icon: "💧", label: "Kelembapan", value: `${currentWeather.hu}%` },
                    { icon: "💨", label: "Angin", value: `${currentWeather.ws} km/j` },
                    { icon: "🧭", label: "Arah Angin", value: getWindDirection(currentWeather.wd) },
                    { icon: "👁️", label: "Jarak Pandang", value: currentWeather.vs_text },
                    { icon: "☁️", label: "Tutupan Awan", value: `${currentWeather.tcc}%` },
                    { icon: "🕐", label: "Diperbarui", value: formatLocalTime(currentWeather.local_datetime) },
                  ].map((d) => (
                    <div key={d.label} className="cw-detail-item" role="listitem">
                      <span className="cw-detail-icon" aria-hidden="true">{d.icon}</span>
                      <div className="cw-detail-info">
                        <span className="cw-detail-label">{d.label}</span>
                        <span className="cw-detail-value">{d.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Day Tabs */}
            <h2 className="section-title">
              <span className="section-title-icon" aria-hidden="true">📅</span>
              Prakiraan 3 Hari
            </h2>
            <div className="day-tabs" role="tablist" aria-label="Pilih hari">
              {dayKeys.map((dateKey, idx) => {
                const dayEntries = dayGroups.get(dateKey)!;
                const label = idx === 0 ? "Hari Ini" : formatShortDate(dayEntries[0].local_datetime);
                return (
                  <button
                    key={dateKey}
                    role="tab"
                    aria-selected={activeDay === idx}
                    aria-controls={`day-panel-${idx}`}
                    id={`day-tab-${idx}`}
                    className={`day-tab ${activeDay === idx ? "active" : ""}`}
                    onClick={() => setActiveDay(idx)}
                    type="button"
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Hourly Forecast Scroll */}
            <div
              className="forecast-scroll"
              role="tabpanel"
              id={`day-panel-${activeDay}`}
              aria-labelledby={`day-tab-${activeDay}`}
            >
              {currentDayEntries.map((entry, idx) => (
                <article
                  key={idx}
                  className={`forecast-card ${entry === currentWeather ? "active" : ""}`}
                  aria-label={`${formatLocalTime(entry.local_datetime)} — ${entry.t}°C, ${entry.weather_desc}`}
                >
                  <time className="fc-time" dateTime={entry.datetime}>
                    {formatLocalTime(entry.local_datetime)}
                  </time>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="fc-icon" src={entry.image} alt={entry.weather_desc} width={42} height={42} loading="lazy" />
                  <div className="fc-temp">{entry.t}°</div>
                  <div className="fc-desc">{entry.weather_desc}</div>
                </article>
              ))}
            </div>

            {/* Detail Grid */}
            <h2 className="section-title">
              <span className="section-title-icon" aria-hidden="true">📊</span>
              Detail {activeDay === 0 ? "Hari Ini" : formatLocalDate(currentDayEntries[0]?.local_datetime ?? "")}
            </h2>
            <div className="daily-grid" role="list" aria-label="Detail prakiraan per jam">
              {currentDayEntries.map((entry, idx) => (
                <article
                  key={idx}
                  className="daily-card animate-slideIn"
                  style={{ animationDelay: `${idx * 60}ms` }}
                  role="listitem"
                >
                  <div className="dc-header">
                    <time className="dc-time" dateTime={entry.datetime}>
                      {formatLocalTime(entry.local_datetime)}
                    </time>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="dc-icon" src={entry.image} alt={entry.weather_desc} width={40} height={40} loading="lazy" />
                  </div>
                  <div className="dc-temp">{entry.t}°C</div>
                  <div className="dc-desc">{entry.weather_desc}</div>
                  <div className="dc-stats">
                    {[
                      ["Kelembapan", `${entry.hu}%`],
                      ["Angin", `${entry.ws} km/j ${getWindDirection(entry.wd)}`],
                      ["Awan", `${entry.tcc}%`],
                      ["Jarak Pandang", entry.vs_text],
                    ].map(([label, value]) => (
                      <div key={label} className="dc-stat">
                        <span className="dc-stat-label">{label}</span>
                        <span className="dc-stat-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer" role="contentinfo">
        <div className="container">
          <div className="footer-content">
            <div className="footer-source">
              <span>Sumber data:</span>
              <a href="https://www.bmkg.go.id" target="_blank" rel="noopener noreferrer">
                BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)
              </a>
              <span>·</span>
              <a href="https://wilayah.id" target="_blank" rel="noopener noreferrer">
                Wilayah.id
              </a>
            </div>
            <p className="footer-copy">
              © {new Date().getFullYear()} {SITE_NAME}. Data disediakan oleh BMKG.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
