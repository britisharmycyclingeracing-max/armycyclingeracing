// ACeRS public data API configuration.
// Paste the /exec URL from the ACeRS Google Apps Script deployment below.
// Leave blank to use the bundled 2025/26 static archive as a fallback.
const ACERS_API_BASE = "https://script.google.com/macros/s/AKfycbzmKwGENM10Gh0uQ0Mye_PzD1RWsrztspxdLUlAk0XDhSSE9dOVvwUWkbu0rEhqNfoyyg/exec";

// Static fallback keeps the archive usable if the API is unavailable.
const ACERS_STATIC_FALLBACK = "./data/autumn-2025.json";
