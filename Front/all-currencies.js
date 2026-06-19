// --- Настройки API ---
const API_KEY = 'cca4af4ffcmsh2dabdd893b35ec8p1520cbjsn6665dc734ad8';
const API_HOST = 'binance43.p.rapidapi.com';
const API_URL = 'https://binance43.p.rapidapi.com/ticker/24hr';

let allCurrencies = [];

const widgetsContainer = document.getElementById('widgets-container');
const errorMsg = document.getElementById('error-message');
const searchInput = document.getElementById('search');
const sortSelect = document.getElementById('sort');

async function init() {
  await fetchCurrencies();
  renderWidgets();
}

async function fetchAllPairs() {
  if (tableBody) tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">⏳ Загрузка списка всех крипто-пар...</td></tr>';
  
  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': API_HOST
      }
    });

    if (!response.ok) throw new Error('Не удалось загрузить данные рынка');
    const result = await response.json();
    
    if (!Array.isArray(result)) throw new Error('Неверный формат ответа API');

    allCryptoPairs = result.map(pair => ({
      symbol: pair.symbol,
      lastPrice: parseFloat(pair.lastPrice || 0),
      priceChangePercent: parseFloat(pair.priceChangePercent || 0),
      highPrice: parseFloat(pair.highPrice || 0),
      lowPrice: parseFloat(pair.lowPrice || 0),
      volume: parseFloat(pair.volume || 0)
    }));

  } catch (error) {
    console.error(error);
    if (errorMessage) {
      errorMessage.style.display = 'block';
      errorMessage.textContent = 'Ошибка загрузки данных. Проверьте лимиты API.';
    }
  }
}

function renderTable() {
  if (!tableBody) return;
  tableBody.innerHTML = '';

  let displayData = [...allCryptoPairs];

  const query = searchInput ? searchInput.value.toLowerCase().replace(/[<>/\\$;"']/g, '') : '';
  if (query) {
    displayData = displayData.filter(pair => 
      pair.symbol.toLowerCase().includes(query)
    );
  }

  const sortType = sortSelect ? sortSelect.value : 'code';
  displayData.sort((a, b) => {
    if (sortType === 'code') return a.symbol.localeCompare(b.symbol);
    if (sortType === 'rate') return a.lastPrice - b.lastPrice;
    if (sortType === 'rate-desc') return b.lastPrice - a.lastPrice;
    if (sortType === 'change-desc') return b.priceChangePercent - a.priceChangePercent;
  });

  const limitData = displayData.slice(0, 100);

  if (limitData.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Ничего не найдено</td></tr>';
    return;
  }

  limitData.forEach(pair => {
    const isUp = pair.priceChangePercent >= 0;
    const changeClass = isUp ? 'trend-up' : 'trend-down';
    const changeSign = isUp ? '+' : '';
    

    const priceDisplay = pair.lastPrice > 1 ? pair.lastPrice.toFixed(2) : pair.lastPrice.toFixed(6);
    const highDisplay = pair.highPrice > 1 ? pair.highPrice.toFixed(2) : pair.highPrice.toFixed(6);
    const lowDisplay = pair.lowPrice > 1 ? pair.lowPrice.toFixed(2) : pair.lowPrice.toFixed(6);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="font-weight: bold; color: #007bff;">${pair.symbol}</td>
      <td style="font-weight: bold; text-align: right;">${priceDisplay}</td>
      <td class="${changeClass}" style="text-align: center; font-weight: bold; color: ${isUp ? '#2e7d32' : '#d32f2f'};">
        ${changeSign}${pair.priceChangePercent.toFixed(2)}%
      </td>
      <td style="text-align: right; color: #555;">${highDisplay}</td>
      <td style="text-align: right; color: #555;">${lowDisplay}</td>
      <td style="text-align: right; color: #777;">${Math.round(pair.volume).toLocaleString()}</td>
    `;
    tableBody.appendChild(row);
  });
}

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[<>/\\$;"']/g, ''); // Очистка
    renderTable();
  });
}

if (sortSelect) {
  sortSelect.addEventListener('change', renderTable);
}

document.addEventListener('DOMContentLoaded', initAllCurrencies);

function renderWidgets() {
  widgetsContainer.innerHTML = '';
  
  let displayData = [...allCurrencies];

  const query = searchInput.value.toLowerCase();
  if (query) {
    displayData = displayData.filter(curr => 
      curr.code.toLowerCase().includes(query) || 
      curr.name.toLowerCase().includes(query)
    );
  }

  const sortType = sortSelect.value;
  displayData.sort((a, b) => {
    if (sortType === 'code') return a.code.localeCompare(b.code);
    if (sortType === 'rate') return a.rate - b.rate;
    if (sortType === 'rate-desc') return b.rate - a.rate;
  });

  if (displayData.length === 0) {
    widgetsContainer.innerHTML = '<p>По вашему запросу валют не найдено.</p>';
    return;
  }

  displayData.forEach(curr => {
    const card = document.createElement('div');
    card.className = `widget-card ${curr.trend}`; 
    card.innerHTML = `
      <h3>${curr.code}</h3>
      <div style="font-size: 14px; opacity: 0.9;">${curr.name}</div>
      <div class="rate">${curr.rate}</div>
      <div style="font-size: 14px; opacity: 0.8; margin-top: 8px;">
        ${curr.trend === 'up' ? '☀️ Растет' : '🌧️ Падает'}
      </div>
    `;
    widgetsContainer.appendChild(card);
  });
}

searchInput.addEventListener('input', renderWidgets);
sortSelect.addEventListener('change', renderWidgets);

init();