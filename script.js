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