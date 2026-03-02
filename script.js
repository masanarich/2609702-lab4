// REST Countries endpoints
const NAME_ENDPOINT = "https://restcountries.com/v3.1/name/";
const CODE_ENDPOINT = "https://restcountries.com/v3.1/alpha/";

// DOM elements (Required: getElementById or querySelector usage)
const inputEl = document.getElementById("country-input");
const btnEl = document.getElementById("search-btn");
const spinnerEl = document.getElementById("loading-spinner");
const countryInfoEl = document.getElementById("country-info");
const bordersEl = document.getElementById("bordering-countries");
const errorEl = document.getElementById("error-message");

function show(el) {
    el.classList.remove("hidden");
}

function hide(el) {
    el.classList.add("hidden");
}

function setError(message) {
    errorEl.textContent = message;
    show(errorEl);
}

function clearError() {
    errorEl.textContent = "";
    hide(errorEl);
}

function safeFirst(arr, fallback = "N/A") {
    return Array.isArray(arr) && arr.length > 0 ? arr[0] : fallback;
}

function normalizeCountryFromApi(country) {
    // Some fields can be missing depending on API response
    return {
        commonName: country?.name?.common ?? "Unknown",
        officialName: country?.name?.official ?? "Unknown",
        capital: safeFirst(country?.capital, "N/A"),
        population: typeof country?.population === "number" ? country.population : 0,
        region: country?.region ?? "N/A",
        borders: Array.isArray(country?.borders) ? country.borders : [],
        flagSvg: country?.flags?.svg ?? "",
        flagAlt: `${country?.name?.common ?? "Country"} flag`
    };
}


