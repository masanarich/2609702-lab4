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

function renderCountryInfo(country) {
    countryInfoEl.innerHTML = `
        <div class="country-top">
            <div class="country-title">
                <h2>${country.commonName}</h2>
                <p><strong>Official name:</strong> ${country.officialName}</p>
                <p><strong>Capital:</strong> ${country.capital}</p>
                <p><strong>Population:</strong> ${country.population.toLocaleString()}</p>
                <p><strong>Region:</strong> ${country.region}</p>
            </div>
            ${country.flagSvg
            ? `<img class="flag" src="${country.flagSvg}" alt="${country.flagAlt}">`
            : `<p class="note">Flag not available.</p>`
        }
        </div>
    `;
    show(countryInfoEl);
}



function renderBordersHeading(hasBorders) {
    // We’ll inject a heading above the border cards for clarity
    if (hasBorders) {
        bordersEl.insertAdjacentHTML("beforebegin", `<div class="border-heading" id="border-heading">Bordering Countries</div>`);
    } else {
        bordersEl.insertAdjacentHTML("beforebegin", `<div class="border-heading" id="border-heading">Bordering Countries</div>`);
    }
}

function removeBordersHeadingIfExists() {
    const existing = document.getElementById("border-heading");
    if (existing) existing.remove();
}


function renderNoBorders(countryName) {
    removeBordersHeadingIfExists();
    renderBordersHeading(false);
    bordersEl.innerHTML = `
        <div class="country-card" style="grid-column: 1 / -1;">
            <p class="note">${countryName} has no bordering countries (likely an island nation).</p>
        </div>
    `;
    show(bordersEl);
}

function renderBorderCards(borderCountries) {
    removeBordersHeadingIfExists();
    renderBordersHeading(true);

    bordersEl.innerHTML = borderCountries.map((c) => {
        const name = c?.name?.common ?? "Unknown";
        const flag = c?.flags?.svg ?? "";
        return `
            <div class="border-card">
                ${flag ? `<img class="border-flag" src="${flag}" alt="${name} flag">` : ""}
                <div class="border-name">${name}</div>
            </div>
        `;
    }).join("");

    show(bordersEl);
}


async function fetchJson(url) {
    const response = await fetch(url); // Required: uses fetch()
    if (!response.ok) {
        // REST Countries returns 404 for unknown names
        throw new Error(`Request failed with status ${response.status}`);
    }
    return response.json();
}

async function fetchBorderCountries(borderCodes) {
    // Fetch all neighboring countries in parallel
    const promises = borderCodes.map((code) => fetchJson(`${CODE_ENDPOINT}${encodeURIComponent(code)}`));
    const results = await Promise.all(promises);

    // alpha/{code} returns an array with one country object
    return results
        .map((arr) => (Array.isArray(arr) ? arr[0] : null))
        .filter(Boolean);
}