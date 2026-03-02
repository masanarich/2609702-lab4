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

/**
 * Pick the "best" country from a list based on the user's query.
 * This prevents weird results like Cook Islands for "iran".
 */
function pickBestMatch(list, query) {
    const q = (query || "").trim().toLowerCase();
    if (!Array.isArray(list) || list.length === 0) return null;

    // 1) Exact match: common name
    let best = list.find(c => c?.name?.common?.toLowerCase() === q);
    if (best) return best;

    // 2) Exact match: official name
    best = list.find(c => c?.name?.official?.toLowerCase() === q);
    if (best) return best;

    // 3) Starts-with match on common name
    best = list.find(c => c?.name?.common?.toLowerCase().startsWith(q));
    if (best) return best;

    // 4) Contains match on common name
    best = list.find(c => c?.name?.common?.toLowerCase().includes(q));
    if (best) return best;

    // 5) Fallback: shortest common name usually most "main"
    return list
        .slice()
        .sort((a, b) => (a?.name?.common?.length ?? 999) - (b?.name?.common?.length ?? 999))[0];
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
    // Inject heading above the border cards
    bordersEl.insertAdjacentHTML(
        "beforebegin",
        `<div class="border-heading" id="border-heading">Bordering Countries</div>`
    );
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
        throw new Error(`Request failed with status ${response.status}`);
    }
    return response.json();
}

async function fetchBorderCountries(borderCodes) {
    const promises = borderCodes.map((code) =>
        fetchJson(`${CODE_ENDPOINT}${encodeURIComponent(code)}`)
    );
    const results = await Promise.all(promises);

    return results
        .map((arr) => (Array.isArray(arr) ? arr[0] : null))
        .filter(Boolean);
}

// Required structure: async + try/catch + finally
async function searchCountry(countryName) {
    clearError();
    hide(countryInfoEl);
    hide(bordersEl);
    removeBordersHeadingIfExists();

    const trimmed = (countryName || "").trim();
    if (!trimmed) {
        setError("Please enter a country name.");
        return;
    }

    show(spinnerEl);

    try {
        let data;

        // 1) Try exact/fullText match first (best accuracy)
        try {
            data = await fetchJson(`${NAME_ENDPOINT}${encodeURIComponent(trimmed)}?fullText=true`);
        } catch (e) {
            // 2) Fallback to normal search (for partial names)
            data = await fetchJson(`${NAME_ENDPOINT}${encodeURIComponent(trimmed)}`);
        }

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("No country data found.");
        }

        // Pick best match instead of data[0]
        const bestRaw = pickBestMatch(data, trimmed);
        if (!bestRaw) throw new Error("No country data found.");

        const country = normalizeCountryFromApi(bestRaw);

        // Update DOM
        renderCountryInfo(country);

        // Borders
        if (!country.borders || country.borders.length === 0) {
            renderNoBorders(country.commonName);
            return;
        }

        const borderCountries = await fetchBorderCountries(country.borders);
        if (borderCountries.length === 0) {
            renderNoBorders(country.commonName);
            return;
        }

        renderBorderCards(borderCountries);

    } catch (error) {
        const msg = String(error?.message || "");
        if (msg.includes("404")) {
            setError(`No results found for "${trimmed}". Try a different spelling.`);
        } else {
            setError("Something went wrong while fetching data. Please try again.");
        }
        console.error(error);
    } finally {
        hide(spinnerEl);
    }
}

// Event listeners (Required)
btnEl.addEventListener("click", () => {
    const country = inputEl.value;
    searchCountry(country);
});

// Search on Enter key press (Required)
inputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        searchCountry(inputEl.value);
    }
});


// searchCountry("South Africa");