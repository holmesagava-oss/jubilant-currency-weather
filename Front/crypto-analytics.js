// --- Настройки API ---
const API_KEY = 'cca4af4ffcmsh2dabdd893b35ec8p1520cbjsn6665dc734ad8';
const API_HOST = 'binance43.p.rapidapi.com';
const API_URL = 'https://binance43.p.rapidapi.com/ticker/24hr';
let selectedPair = 'BTCUSDT';
let priceHistory = []; 
const maxPoints = 40;

// DOM Элементы
const pairSelector = document.getElementById('pair-selector');
const pairTitle = document.getElementById('current-pair-title');
const priceDisplay = document.getElementById('current-price-display');
const canvas = document.getElementById('liveChart');
const ctx = canvas.getContext('2d');

// Элементы боковой статистики
const statChange = document.getElementById('stat-change');
const statHigh = document.getElementById('stat-high');
const statLow = document.getElementById('stat-low');
const statVolume = document.getElementById('stat-volume');
const statCount = document.getElementById('stat-count');

async function updateMarketData() {
  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': API_HOST
      }
    });
    
    if (!response.ok) throw new Error('Превышен лимит или ошибка сети');
    const data = await response.json();
    if (!Array.isArray(data)) return;

    const pairData = data.find(p => p.symbol === selectedPair);
    if (pairData) {
      updateUI(pairData);
    }
  } catch (err) {
    console.warn("API недоступен (лимит). Включена безопасная живая симуляция рынка.");
    generateMockUpdate();
  }
}

function updateUI(data) {
  const lastPrice = parseFloat(data.lastPrice);
  const changePercent = parseFloat(data.priceChangePercent);

  pairTitle.textContent = data.symbol;
  priceDisplay.textContent = lastPrice > 1 ? lastPrice.toFixed(2) : lastPrice.toFixed(5);
  
  if (changePercent >= 0) {
    priceDisplay.style.color = '#00c076';
    statChange.style.color = '#00c076';
    statChange.textContent = `+${changePercent.toFixed(2)}%`;
  } else {
    priceDisplay.style.color = '#ff3b30';
    statChange.style.color = '#ff3b30';
    statChange.textContent = `${changePercent.toFixed(2)}%`;
  }

  statHigh.textContent = parseFloat(data.highPrice).toLocaleString();
  statLow.textContent = parseFloat(data.lowPrice).toLocaleString();
  statVolume.textContent = Math.round(parseFloat(data.volume)).toLocaleString();
  statCount.textContent = parseInt(data.count || 0).toLocaleString();

  addPriceToHistory(lastPrice);
}

function addPriceToHistory(price) {
  priceHistory.push(price);
  if (priceHistory.length > maxPoints) {
    priceHistory.shift();
  }
  drawChart();
}

function drawChart() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (priceHistory.length < 2) return;

  const minPrice = Math.min(...priceHistory) * 0.9995;
  const maxPrice = Math.max(...priceHistory) * 1.0005;
  const priceRange = maxPrice - minPrice;
  const stepX = canvas.width / (maxPoints - 1);

  // Отрисовка горизонтальной сетки
  ctx.strokeStyle = '#23282e';
  ctx.lineWidth = 1;
  for (let i = 1; i < 5; i++) {
    let y = (canvas.height / 5) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Настройка линии тренда
  ctx.beginPath();
  ctx.lineWidth = 3;
  const isUp = priceHistory[priceHistory.length - 1] >= priceHistory[priceHistory.length - 2];
  ctx.strokeStyle = isUp ? '#00c076' : '#ff3b30';

  priceHistory.forEach((price, index) => {
    const x = index * stepX;
    const y = canvas.height - ((price - minPrice) / priceRange) * canvas.height;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Градиентная подложка
  ctx.lineTo((priceHistory.length - 1) * stepX, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();
  
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, isUp ? 'rgba(0, 192, 118, 0.15)' : 'rgba(255, 59, 48, 0.15)');
  gradient.addColorStop(1, 'rgba(22, 26, 30, 0)');
  ctx.fillStyle = gradient;
  ctx.fill();
}

function generateMockUpdate() {
  let basePrice = priceHistory[priceHistory.length - 1] || (selectedPair.includes('BTC') ? 64500 : 3450);
  const change = basePrice * (Math.random() - 0.5) * 0.001; 
  const newPrice = basePrice + change;

  const mockData = {
    symbol: selectedPair,
    lastPrice: newPrice,
    priceChangePercent: ((newPrice - (selectedPair.includes('BTC') ? 64000 : 3400)) / newPrice) * 100,
    highPrice: basePrice * 1.01,
    lowPrice: basePrice * 0.99,
    volume: 18450,
    count: 84310
  };
  updateUI(mockData);
}

pairSelector.addEventListener('change', (e) => {
  selectedPair = e.target.value;
  priceHistory = [];
  updateMarketData();
});

updateMarketData();
setInterval(updateMarketData, 3000);