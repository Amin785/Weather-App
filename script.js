const API_KEY = '7b5556232029dcafe20f1189e875ed75';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct';

const $ = selector => document.querySelector(selector);

const searchForm = $('#searchForm');
const cityInput = $('#cityInput');
const suggestions = $('#suggestions');
const result = $('#result');
const message = $('#message');

const locationName = $('#locationName');
const localTime = $('#localTime');
const weatherIcon = $('#weatherIcon');
const descriptionEl = $('#description');
const tempValue = $('#tempValue');
const tempUnit = $('#tempUnit');
const feelsLike = $('#feelsLike');
const humidity = $('#humidity');
const wind = $('#wind');
const pressure = $('#pressure');

function showMessage(txt, isError = true) {
  message.textContent = txt;
  message.style.color = isError ? '#ffb4b4' : '#bfffb4';
  setTimeout(() => { message.textContent = ''; }, 4000);
}

function formatLocalTime(dtSec, tzOffsetSec) {
  const local = new Date((dtSec + tzOffsetSec) * 1000);
  return local.toLocaleString(undefined, { weekday: 'short', hour:'2-digit', minute:'2-digit', day:'numeric', month:'short' });
}

async function fetchWeather(city, units) {
  try {
    const url = `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('City not found');
    const data = await res.json();

    const tempK = data.main.temp;
    const feelsK = data.main.feels_like;
    const temp = units === 'metric' ? (tempK - 273.15).toFixed(1) : ((tempK - 273.15) * 9/5 + 32).toFixed(1);
    const feels = units === 'metric' ? (feelsK - 273.15).toFixed(1) : ((feelsK - 273.15) * 9/5 + 32).toFixed(1);
    const windSpeed = units === 'metric' ? data.wind.speed.toFixed(1) : (data.wind.speed * 2.23694).toFixed(1);

    locationName.textContent = `${data.name}${data.sys.country ? ', ' + data.sys.country : ''}`;
    localTime.textContent = formatLocalTime(data.dt, data.timezone);
    descriptionEl.textContent = data.weather[0].description;
    tempValue.textContent = temp;
    tempUnit.textContent = units === 'metric' ? '°C' : '°F';
    feelsLike.textContent = `${feels}${units === 'metric' ? '°C' : '°F'}`;
    humidity.textContent = data.main.humidity;
    wind.textContent = windSpeed + (units === 'metric' ? ' m/s' : ' mph');
    pressure.textContent = data.main.pressure;

    const iconCode = data.weather[0].icon;
    weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    weatherIcon.alt = data.weather[0].description;

    result.classList.remove('hidden');
  } catch(err) {
    result.classList.add('hidden');
    showMessage(err.message || 'An error occurred');
    console.error(err);
  }
}

async function fetchSuggestions(query) {
  if (!query) { suggestions.classList.add('hidden'); return; }
  try {
    const url = `${GEO_URL}?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch suggestions');
    const data = await res.json();

    suggestions.innerHTML = '';
    if (data.length === 0) { suggestions.classList.add('hidden'); return; }

    data.forEach(place => {
      const li = document.createElement('li');
      li.textContent = `${place.name}${place.state ? ', ' + place.state : ''}, ${place.country}`;
      li.addEventListener('click', () => {
        cityInput.value = li.textContent;
        suggestions.classList.add('hidden');
      });
      suggestions.appendChild(li);
    });
    suggestions.classList.remove('hidden');
  } catch(err) {
    console.error(err);
  }
}

cityInput.addEventListener('input', e => fetchSuggestions(e.target.value.trim()));

searchForm.addEventListener('submit', e => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return showMessage('Please enter a city.');
  const units = document.querySelector('input[name="units"]:checked').value;
  fetchWeather(city, units);
});

(function() {
  const last = localStorage.getItem('lastCity');
  if (last) { cityInput.value = last; }
  searchForm.addEventListener('submit', () => {
    localStorage.setItem('lastCity', cityInput.value.trim());
  });
})();
