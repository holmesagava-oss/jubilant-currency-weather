// --- Настройки API ---
const API_KEY = 'cca4af4ffcmsh2dabdd893b35ec8p1520cbjsn6665dc734ad8';
const API_HOST = 'binance43.p.rapidapi.com';
const API_URL = 'https://binance43.p.rapidapi.com/ticker/24hr';
// --- Состояние приложения ---
let allCurrencies = []; 
let pinnedCurrencies = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT']; 

// DOM Элементы
const selectEl = document.getElementById('currency-select');
const widgetsContainer = document.getElementById('widgets-container');
const errorMsg = document.getElementById('error-message');
const pinForm = document.getElementById('pin-form');
const searchInput = document.getElementById('search');
const sortSelect = document.getElementById('sort');

async function init() {
  await fetchCurrencies();
  populateSelect();
  renderWidgets();
}

async function fetchCurrencies() {
  widgetsContainer.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div>';
  
  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': API_HOST
      }
    });

    if (!response.ok) throw new Error('Ошибка сети при запросе к Binance API');
    const result = await response.json();
    
    // Проверяем, что пришел массив данных
    if (!Array.isArray(result)) throw new Error('Неверный формат ответа API');

    allCurrencies = result.map(pair => {
      const changePercent = parseFloat(pair.priceChangePercent || 0);
      return {
        code: pair.symbol, 
        name: `Крипто-пара ${pair.symbol}`,
        rate: parseFloat(pair.lastPrice), 
        trend: changePercent >= 0 ? 'up' : 'down'
      };
    });

  } catch (error) {
    console.error(error);
    errorMsg.style.display = 'block';
    errorMsg.textContent = 'API недоступен. Загружены локальные тест-данные.';
    
    allCurrencies = [
      { code: 'BTCUSDT', name: 'Крипто-пара BTCUSDT', rate: 64500.00, trend: 'up' },
      { code: 'ETHUSDT', name: 'Крипто-пара ETHUSDT', rate: 3450.00, trend: 'down' },
      { code: 'BNBUSDT', name: 'Крипто-пара BNBUSDT', rate: 580.00, trend: 'up' }
    ];
  }
}

function populateSelect() {
  selectEl.innerHTML = '<option value="" disabled selected>Выберите пару...</option>';
  allCurrencies.forEach(curr => {
    const option = document.createElement('option');
    option.value = curr.code;
    option.textContent = curr.code;
    selectEl.appendChild(option);
  });
}

pinForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const selectedCode = selectEl.value;
  if (selectedCode && !pinnedCurrencies.includes(selectedCode)) {
    pinnedCurrencies.push(selectedCode);
    renderWidgets();
  }
  selectEl.value = '';
});

function renderWidgets() {
  widgetsContainer.innerHTML = '';
  
  let displayData = allCurrencies.filter(curr => pinnedCurrencies.includes(curr.code));

  const query = searchInput.value.toLowerCase().replace(/[<>/\\$;"']/g, '');
  if (query) {
    displayData = displayData.filter(curr => 
      curr.code.toLowerCase().includes(query)
    );
  }

  const sortType = sortSelect.value;
  displayData.sort((a, b) => {
    if (sortType === 'code') return a.code.localeCompare(b.code);
    if (sortType === 'rate') return a.rate - b.rate;
    if (sortType === 'rate-desc') return b.rate - a.rate;
  });

  if (displayData.length === 0) {
    widgetsContainer.innerHTML = '<p>Нет валют для отображения</p>';
    return;
  }

  displayData.forEach(curr => {
    const card = document.createElement('div');
    card.className = `widget-card ${curr.trend}`; 
    const formattedRate = curr.rate > 1 ? curr.rate.toFixed(2) : curr.rate.toFixed(6);

    card.innerHTML = `
      <h3>${curr.code}</h3>
      <div style="font-size: 13px; opacity: 0.8; margin-bottom: 5px;">${curr.name}</div>
      <div class="rate">${formattedRate}</div>
      <div style="font-size: 14px; opacity: 0.8; margin-top: 8px;">
        ${curr.trend === 'up' ? '☀️ Растет (24ч)' : '🌧️ Падает (24ч)'}
      </div>
      <button class="remove-btn" onclick="removePinned('${curr.code}')">✕</button>
    `;
    widgetsContainer.appendChild(card);
  });
}

window.removePinned = function(code) {
  pinnedCurrencies = pinnedCurrencies.filter(c => c !== code);
  renderWidgets();
}

searchInput.addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/[<>/\\$;"']/g, '');
  renderWidgets();
});

const recipientInput = document.getElementById('recipient-email');
if (recipientInput) {
  recipientInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^a-zA-Z0-9@.]/g, '');
  });
}

init();

// --- Логика работы с модальным окном и отправкой отчетов ---
const modal = document.getElementById('preview-modal');
const previewBtn = document.getElementById('preview-email-btn');
const closeCross = document.getElementById('close-modal-cross');
const closeBtn = document.getElementById('close-modal-btn');
const confirmSendBtn = document.getElementById('confirm-send-btn');
const previewBody = document.getElementById('email-preview-body');
const emailStatus = document.getElementById('email-status');

// Функция генерации красивой HTML-таблицы
function generateReportHTML(currenciesToReport) {
  let rows = '';
  currenciesToReport.forEach(curr => {
    const isUp = curr.trend === 'up';
    const trendText = isUp ? '☀️ Растет' : '🌧️ Падает';
    const trendColor = isUp ? '#2e7d32' : '#d32f2f';
    const rowBg = isUp ? '#f0fff4' : '#fff5f5';

    rows += `
      <tr style="background-color: ${rowBg}; border-bottom: 1px solid #dddddd;">
        <td style="padding: 12px; border: 1px solid #dddddd; font-weight: bold; text-align: center;">${curr.code}</td>
        <td style="padding: 12px; border: 1px solid #dddddd;">${curr.name || 'Валюта'}</td>
        <td style="padding: 12px; border: 1px solid #dddddd; text-align: right; font-weight: bold;">${curr.rate}</td>
        <td style="padding: 12px; border: 1px solid #dddddd; text-align: center; color: ${trendColor}; font-weight: bold;">${trendText}</td>
      </tr>
    `;
  });

  return `
    <div style="font-family: Arial, sans-serif; color: #333; padding: 10px;">
      <h3 style="color: #007bff; margin-bottom: 5px;">Валютный отчет CurrWeather</h3>
      <p style="font-size: 14px; margin-bottom: 15px;">Данные по вашим закрепленным виджетам на текущий момент:</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; min-width: 400px;">
        <thead>
          <tr style="background-color: #007bff; color: white;">
            <th style="padding: 12px; border: 1px solid #dddddd;">Код</th>
            <th style="padding: 12px; border: 1px solid #dddddd; text-align: left;">Название</th>
            <th style="padding: 12px; border: 1px solid #dddddd; text-align: right;">Текущий курс</th>
            <th style="padding: 12px; border: 1px solid #dddddd;">Тренд</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <p style="font-size: 12px; color: #666; margin-top: 15px; border-top: 1px dashed #ccc; padding-top: 10px;">
        Отчет сгенерирован автоматически приложением CurrWeather.
      </p>
    </div>
  `;
}

// Открытие модального окна превью
previewBtn.addEventListener('click', () => {
  const email = recipientInput.value.trim();
  if (!email) {
    alert('Пожалуйста, введите корректный Email адрес.');
    return;
  }

  const activeCurrencies = allCurrencies.filter(curr => pinnedCurrencies.includes(curr.code));
  
  if (activeCurrencies.length === 0) {
    alert('Список закрепленных валют пуст. Добавьте хотя бы одну валюту для отчета.');
    return;
  }

  previewBody.innerHTML = generateReportHTML(activeCurrencies);
  modal.classList.add('show');
});

const closeModal = () => modal.classList.remove('show');
closeCross.addEventListener('click', closeModal);
closeBtn.addEventListener('click', closeModal);

// Отправка данных на бэкенд Flask
confirmSendBtn.addEventListener('click', async () => {
  closeModal();
  
  const email = recipientInput.value.trim();
  const activeCurrencies = allCurrencies.filter(curr => pinnedCurrencies.includes(curr.code));

  emailStatus.className = 'status-text';
  emailStatus.style.display = 'block';
  emailStatus.textContent = '⏳ Отправка отчета...';

  try {
    const response = await fetch('http://127.0.0.1:5000/api/send_email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        currencies: activeCurrencies
      })
    });

    const result = await response.json();

    if (response.ok && result.status === 'success') {
      emailStatus.classList.add('status-success');
      emailStatus.textContent = '✅ Письмо успешно отправлено!';
    } else {
      throw new Error(result.message || 'Ошибка сервера при отправке');
    }
  } catch (error) {
    emailStatus.classList.add('status-error');
    emailStatus.textContent = `❌ Ошибка отправки: ${error.message}`;
  }
});

recipientInput.addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/[^a-zA-Z0-9@.]/g, '');
});

searchInput.addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/[<>/\\$;"']/g, '');
  renderWidgets();
});

previewBtn.addEventListener('click', () => {
  const email = recipientInput.value.trim();
  if (!email || !email.includes('@') || !email.includes('.')) {
    alert('Пожалуйста, введите корректный Email адрес (например: user@mail.com).');
    return;
  }
  const activeCurrencies = allCurrencies.filter(curr => pinnedCurrencies.includes(curr.code));
  if (activeCurrencies.length === 0) {
    alert('Список закрепленных валют пуст. Добавьте хотя бы одну валюту для отчета.');
    return;
  }
  previewBody.innerHTML = generateReportHTML(activeCurrencies);
  modal.classList.add('show');
});