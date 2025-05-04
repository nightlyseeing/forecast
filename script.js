// JS přesunutý ze <script> v HTML
<script>
// === Přepínání tématu ===
function toggleTheme() {
  document.body.classList.toggle("dark-mode");
}

// === Globální proměnné ===
let sunriseTimes = {}, sunsetTimes = {};
let selectedCity = null;

// === Získání názvu dne ===
function getDayName(dateString) {
  const days = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
  return days[new Date(dateString).getDay()];
}

// === Přepínání jednotlivých dnů ===
function toggleDay(cell, group) {
  const rows = document.querySelectorAll(.group-${group});
  rows.forEach(row => row.classList.toggle('hidden-row'));
  cell.innerHTML = cell.innerHTML.includes('▶️') ?
    cell.innerHTML.replace('▶️', '▼') :
    cell.innerHTML.replace('▼', '▶️');
}

// === Emoji den/noc ===
function getSimpleTimeEmoji(hour, dateStr) {
  const sunrise = sunriseTimes[dateStr]?.split(':')[0];
  const sunset = sunsetTimes[dateStr]?.split(':')[0];
  if (!sunrise || !sunset) return '⏳';
  return (hour >= +sunrise && hour < +sunset) ? '🌞' : '🌙';
}

// === Fáze Měsíce ===
function getMoonPhase(date) {
  const lp = 2551443;
  const now = new Date(date);
  const new_moon = new Date(2001,0,24,13,35);
  const phase = ((now.getTime() - new_moon.getTime()) / 1000) % lp;
  const age = Math.floor(phase / (24*3600));
  if (age < 1 || age >= 29) return ['🌑', 'Nov'];
  else if (age < 7) return ['🌒', 'Dorůstající srpek'];
  else if (age < 10) return ['🌓', 'První čtvrť'];
  else if (age < 14) return ['🌔', 'Dorůstající Měsíc'];
  else if (age < 17) return ['🌕', 'Úplněk'];
  else if (age < 21) return ['🌖', 'Couvající Měsíc'];
  else if (age < 25) return ['🌗', 'Poslední čtvrť'];
  else return ['🌘', 'Ubývající srpek'];
}

// === Načíst předpověď ===
async function fetchForecast(lat, lon) {
  try {
    document.getElementById('loading-spinner').style.display = 'block';
    const response = await fetch(https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,cloudcover,precipitation,windspeed_10m&daily=sunrise,sunset&timezone=Europe/Prague);
    if (!response.ok) throw new Error('HTTP chyba: ' + response.status);
    const data = await response.json();

    sunriseTimes = {}, sunsetTimes = {};
    (data.daily.sunrise || []).forEach(s => { const [d, t] = s.split('T'); sunriseTimes[d] = t; });
    (data.daily.sunset || []).forEach(s => { const [d, t] = s.split('T'); sunsetTimes[d] = t; });

    const { time = [], temperature_2m = [], cloudcover = [], precipitation = [], windspeed_10m = [] } = data.hourly || {};
    const tbody = document.querySelector('#forecast tbody');
    tbody.innerHTML = '';

    let currentDay = '';
    let group = 0;

    for (let i = 0; i < Math.min(time.length, 168); i++) {
      const [datePart, timePart] = time[i]?.split('T') || ['',''];
      const dayName = getDayName(datePart);
      const hour = parseInt(timePart?.split(':')[0], 10);
      const emoji = getSimpleTimeEmoji(hour, datePart);

      if (dayName !== currentDay) {
        currentDay = dayName;
        group++;

        const [moonEmoji, moonLabel] = getMoonPhase(datePart);
        const sunrise = sunriseTimes[datePart] || 'N/A';
        const sunset = sunsetTimes[datePart] || 'N/A';

        let dayLength = '';
        if (sunrise !== 'N/A' && sunset !== 'N/A') {
          const [srH, srM] = sunrise.split(':').map(Number);
          const [ssH, ssM] = sunset.split(':').map(Number);
          const totalMin = (ssH * 60 + ssM) - (srH * 60 + srM);
          const h = Math.floor(totalMin / 60), m = totalMin % 60;
          dayLength = ${h} h ${m} min;
        }

        const dayRow = document.createElement('tr');
        dayRow.className = 'day-row';
        dayRow.innerHTML = 
          <td class="day-cell" onclick="toggleDay(this, ${group})" style="text-align: left; white-space: nowrap;">
          ▶️ 📅 ${dayName}<br>(${datePart})
          </td>
          <td colspan="5" style="text-align: left;">
         <div style="display: flex; gap: 30px;">
           <div>
             ☀️ Východ: ${sunrise} / Západ: ${sunset}<br>
             🌕 Fáze Měsíce: ${moonEmoji} ${moonLabel}<br>
             🕰️ Délka dne: ${dayLength}
           </div>
          </div>
         </td>;
        tbody.appendChild(dayRow);

        const headerRow = document.createElement('tr');
        headerRow.innerHTML = 
          <th>🕒 Čas</th>
          <th>🌗 Den/Noc</th>
          <th>🌡️ Teplota (°C)</th>
          <th>☁️ Oblačnost (%)</th>
          <th>🌧️ Srážky (mm)</th>
          <th>💨 Vítr (km/h)</th>
        ;
        tbody.appendChild(headerRow);
      }

      let cloudClass = '';
      if (cloudcover[i] <= 30) cloudClass = 'low-cloud';
      else if (cloudcover[i] <= 70) cloudClass = 'medium-cloud';
      else cloudClass = 'high-cloud';

      const row = document.createElement('tr');
      row.className = ${cloudClass.trim()} group-${group};
      row.innerHTML = 
        <td>${timePart}</td>
        <td>${emoji}</td>
        <td>${temperature_2m[i] ?? 'N/A'}</td>
        <td>${cloudcover[i] ?? 'N/A'}</td>
        <td>${precipitation[i] ?? 'N/A'}</td>
        <td>${windspeed_10m[i] ?? 'N/A'}</td>
      ;
      tbody.appendChild(row);
    }
  } catch (err) {
    console.error('Chyba:', err);
    alert('Nepodařilo se načíst data.');
  } finally {
    document.getElementById('loading-spinner').style.display = 'none';
  }
}

// === Vyhledávání měst ===
async function autocompleteCities() {
  const input = document.getElementById('cityInput').value.trim();
  const suggestions = document.getElementById('suggestions');
  const clearBtn = document.getElementById('clearButton');

  if (input.length < 2) {
    suggestions.style.display = 'none';
    clearBtn.style.display = 'none';
    return;
  }
  clearBtn.style.display = 'block';
  try {
    const res = await fetch(https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(input)}&count=5&language=cs&format=json);
    const data = await res.json();
    const cities = data.results || [];

    suggestions.innerHTML = '';
    cities.forEach(city => {
      const li = document.createElement('li');
      li.textContent = ${city.name}, ${city.country};
      li.onclick = () => {
        selectedCity = city;
        document.getElementById('cityInput').value = ${city.name}, ${city.country};
        document.getElementById('suggestions').style.display = 'none';
        document.getElementById('cityDisplay').textContent = ${city.name}, ${city.country};
      };
      suggestions.appendChild(li);
    });

    suggestions.style.display = 'block';
  } catch (e) {
    console.error('Chyba autocomplete:', e);
    suggestions.style.display = 'none';
  }
}

function handleSuggestionKeys(event) {
  const suggestions = Array.from(document.querySelectorAll('#suggestions li'));
  let index = suggestions.findIndex(el => el.classList.contains('active'));
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    if (index < suggestions.length - 1) {
      if (index >= 0) suggestions[index].classList.remove('active');
      suggestions[++index].classList.add('active');
    }
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    if (index > 0) {
      suggestions[index].classList.remove('active');
      suggestions[--index].classList.add('active');
    }
  } else if (event.key === 'Enter') {
    event.preventDefault();
    if (index >= 0) suggestions[index].click();
  }
}

function clearInput() {
  document.getElementById('cityInput').value = '';
  document.getElementById('clearButton').style.display = 'none';
  document.getElementById('suggestions').style.display = 'none';
  selectedCity = null;
}

function manualSearch() {
  if (!selectedCity) {
    alert("Prosím vyberte město ze seznamu.");
    return;
  }
  fetchForecast(selectedCity.latitude, selectedCity.longitude);
}

function getLocation() {
  if (!navigator.geolocation) {
    alert('Geolokace není podporována tímto prohlížečem.');
    return;
  }
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    document.getElementById('cityDisplay').textContent = Vaše poloha (${latitude.toFixed(2)}, ${longitude.toFixed(2)});
    fetchForecast(latitude, longitude);
  }, () => {
    alert('Nepodařilo se získat polohu.');
  });
}
</script>
// ... sem přijde celý JavaScript ...
