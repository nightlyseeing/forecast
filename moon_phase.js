// moon_phase.js

const moonIcons = {
  "New Moon": "🌑",
  "Waxing Crescent": "🌒",
  "First Quarter": "🌓",
  "Waxing Gibbous": "🌔",
  "Full Moon": "🌕",
  "Waning Gibbous": "🌖",
  "Last Quarter": "🌗",
  "Waning Crescent": "🌘"
};

const moonNamesCZ = {
  "New Moon": "Nov",
  "Waxing Crescent": "Dorůstající srpek",
  "First Quarter": "První čtvrť",
  "Waxing Gibbous": "Dorůstající měsíc",
  "Full Moon": "Úplněk",
  "Waning Gibbous": "Couvající měsíc",
  "Last Quarter": "Poslední čtvrť",
  "Waning Crescent": "Couvající srpek"
};

async function fetchMoonPhase(lat, lon) {
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/astronomy?latitude=${lat}&longitude=${lon}&timezone=Europe%2FPrague`);
    const data = await res.json();
    const phase = data.moon_phase[0];
    const moonrise = data.moonrise[0]?.split("T")[1] || "-";
    const moonset = data.moonset[0]?.split("T")[1] || "-";

    const icon = moonIcons[phase] || "🌚";
    const name = moonNamesCZ[phase] || phase;

    const container = document.getElementById("locationInfoBox");

    const moonInfo = document.createElement("div");
    moonInfo.className = "moon-dynamic";
    moonInfo.innerHTML = `
      <div><strong>Fáze Měsíce:</strong> ${icon} ${name}</div>
      <div><strong>Východ:</strong> ${moonrise}</div>
      <div><strong>Západ:</strong> ${moonset}</div>
    `;

    const old = container.querySelector('.moon-dynamic');
    if (old) old.remove();
    container.appendChild(moonInfo);
  } catch (err) {
    console.error("Chyba při načítání fáze měsíce:", err);
  }
}
