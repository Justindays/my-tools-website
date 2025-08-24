// 全域變數
let exchangeRates = {
    TWD: 1,      // 台幣作為基準
    USD: 0.032,  // 1 TWD = 0.032 USD (約31 TWD = 1 USD)
    JPY: 4.67,   // 1 TWD = 4.67 JPY
    CNY: 0.23    // 1 TWD = 0.23 CNY
};

// API URLs (多個備用源)
const exchangeRateAPIs = [
    {
        name: 'ExchangeRate-API',
        url: 'https://api.exchangerate-api.com/v4/latest/TWD',
        parseFunction: parseExchangeRateAPI
    },
    {
        name: 'Fawaz Exchange API',
        url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/twd.json',
        parseFunction: parseFawazAPI
    }
];

let lastUpdateTime = null;
let isUpdating = false;

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 初始化應用程式
function initializeApp() {
    try {
        // 初始化交期計算器
        initializeDeliveryCalculator();
        
        // 初始化匯率換算器
        initializeCurrencyConverter();
        
        // 更新匯率更新時間（顯示預設匯率）
        updateRateUpdateTime(false);
        
        // 自動獲取即時匯率（延遲執行避免阻塞UI）
        setTimeout(() => {
            updateExchangeRates();
        }, 2000);
    } catch (error) {
        console.error('初始化錯誤:', error);
    }
}

// 頁面切換功能
function showPage(pageId) {
    try {
        // 隱藏所有頁面
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => page.classList.remove('active'));
        
        // 顯示目標頁面
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // 如果切換到交期計算頁面，重新設定今天日期
        if (pageId === 'delivery-calculator') {
            initializeDeliveryCalculator();
        }
    } catch (error) {
        console.error('頁面切換錯誤:', error);
    }
}

// === 交期計算功能 ===

// 初始化交期計算器
function initializeDeliveryCalculator() {
    try {
        const today = new Date();
        const todayString = formatDateForInput(today);
        
        // 設定今天日期
        const todayInput = document.getElementById('today-date');
        const deliveryInput = document.getElementById('delivery-date');
        const daysInput = document.getElementById('days-diff');
        
        if (todayInput) todayInput.value = todayString;
        if (deliveryInput) deliveryInput.value = todayString;
        if (daysInput) daysInput.value = '';
        
        // 計算初始值
        calculateDaysFromDates();
    } catch (error) {
        console.error('交期計算器初始化錯誤:', error);
    }
}

// 將Date物件格式化為input[type="date"]所需的格式
function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

// 從日期計算天數差異
function calculateDaysFromDates() {
    try {
        const todayInput = document.getElementById('today-date');
        const deliveryInput = document.getElementById('delivery-date');
        const daysInput = document.getElementById('days-diff');
        
        if (!todayInput || !deliveryInput || !daysInput) return;
        
        const todayValue = todayInput.value;
        const deliveryValue = deliveryInput.value;
        
        if (!todayValue || !deliveryValue) return;
        
        const todayDate = new Date(todayValue);
        const deliveryDate = new Date(deliveryValue);
        
        // 計算毫秒差異並轉換為天數
        const timeDiff = deliveryDate.getTime() - todayDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        // 更新相隔天數輸入框
        daysInput.value = daysDiff;
        
        // 更新工作天數顯示
        updateWorkDaysDisplay(daysDiff);
    } catch (error) {
        console.error('計算日期差異錯誤:', error);
    }
}

// 從天數計算交期日期
function calculateDeliveryFromDays() {
    try {
        const todayInput = document.getElementById('today-date');
        const deliveryInput = document.getElementById('delivery-date');
        const daysInput = document.getElementById('days-diff');
        
        if (!todayInput || !deliveryInput || !daysInput) return;
        
        const todayValue = todayInput.value;
        const daysValue = daysInput.value;
        
        if (!todayValue || !daysValue) return;
        
        const todayDate = new Date(todayValue);
        const days = parseInt(daysValue);
        
        // 計算新的交期日期
        const deliveryDate = new Date(todayDate);
        deliveryDate.setDate(deliveryDate.getDate() + days);
        
        // 更新交期日期輸入框
        deliveryInput.value = formatDateForInput(deliveryDate);
        
        // 更新工作天數顯示
        updateWorkDaysDisplay(days);
    } catch (error) {
        console.error('從天數計算交期錯誤:', error);
    }
}

// 當今天日期改變時重新計算
function calculateDelivery() {
    try {
        const daysInput = document.getElementById('days-diff');
        if (daysInput && daysInput.value) {
            calculateDeliveryFromDays();
        } else {
            calculateDaysFromDates();
        }
    } catch (error) {
        console.error('計算交期錯誤:', error);
    }
}

// 更新工作天數顯示
function updateWorkDaysDisplay(totalDays) {
    try {
        const workDaysElement = document.getElementById('work-days');
        if (workDaysElement) {
            const workDays = calculateWorkDays(totalDays);
            workDaysElement.textContent = workDays + ' 天';
        }
    } catch (error) {
        console.error('更新工作天數顯示錯誤:', error);
    }
}

// 計算工作天數（排除週末）
function calculateWorkDays(totalDays) {
    if (totalDays <= 0) return 0;
    
    // 簡化計算：5天工作日/7天 * 總天數
    const weeks = Math.floor(totalDays / 7);
    const remainingDays = totalDays % 7;
    
    let workDays = weeks * 5;
    
    // 處理剩餘天數
    if (remainingDays > 0) {
        workDays += Math.min(remainingDays, 5);
    }
    
    return workDays;
}

// === 匯率換算功能 ===

// 初始化匯率換算器
function initializeCurrencyConverter() {
    try {
        // 清空所有輸入框
        const currencies = ['twd', 'usd', 'jpy', 'cny'];
        currencies.forEach(currency => {
            const input = document.getElementById(currency);
            if (input) {
                input.value = '';
            }
        });
        
        // 初始化匯率顯示
        updateRateDisplay();
    } catch (error) {
        console.error('匯率換算器初始化錯誤:', error);
    }
}

// 貨幣換算
function convertCurrency(sourceCurrency) {
    try {
        const sourceInput = document.getElementById(sourceCurrency);
        if (!sourceInput) return;
        
        const sourceValue = parseFloat(sourceInput.value);
        
        // 如果輸入為空或無效，清空其他輸入框
        if (isNaN(sourceValue) || sourceValue === '') {
            clearOtherCurrencies(sourceCurrency);
            return;
        }
        
        // 轉換為台幣基準值
        let twdValue;
        switch(sourceCurrency) {
            case 'twd':
                twdValue = sourceValue;
                break;
            case 'usd':
                twdValue = sourceValue / exchangeRates.USD;
                break;
            case 'jpy':
                twdValue = sourceValue / exchangeRates.JPY;
                break;
            case 'cny':
                twdValue = sourceValue / exchangeRates.CNY;
                break;
        }
        
        // 更新其他貨幣的值
        const currencies = ['twd', 'usd', 'jpy', 'cny'];
        currencies.forEach(currency => {
            if (currency !== sourceCurrency) {
                const input = document.getElementById(currency);
                if (input) {
                    let convertedValue;
                    switch(currency) {
                        case 'twd':
                            convertedValue = twdValue;
                            break;
                        case 'usd':
                            convertedValue = twdValue * exchangeRates.USD;
                            break;
                        case 'jpy':
                            convertedValue = twdValue * exchangeRates.JPY;
                            break;
                        case 'cny':
                            convertedValue = twdValue * exchangeRates.CNY;
                            break;
                    }
                    
                    // 根據貨幣類型決定小數位數
                    let decimalPlaces = (currency === 'jpy') ? 0 : 2;
                    input.value = convertedValue.toFixed(decimalPlaces);
                }
            }
        });
    } catch (error) {
        console.error('貨幣換算錯誤:', error);
    }
}

// 清空除了指定貨幣外的其他輸入框
function clearOtherCurrencies(exceptCurrency) {
    try {
        const currencies = ['twd', 'usd', 'jpy', 'cny'];
        currencies.forEach(currency => {
            if (currency !== exceptCurrency) {
                const input = document.getElementById(currency);
                if (input) {
                    input.value = '';
                }
            }
        });
    } catch (error) {
        console.error('清空貨幣錯誤:', error);
    }
}

// 更新匯率顯示
function updateRateDisplay() {
    try {
        const currencies = [
            { id: 'twd', name: '台幣 (TWD)', rate: exchangeRates.TWD, symbol: '基準' },
            { id: 'usd', name: '美金 (USD)', rate: exchangeRates.USD, symbol: '$' },
            { id: 'jpy', name: '日幣 (JPY)', rate: exchangeRates.JPY, symbol: '¥' },
            { id: 'cny', name: '人民幣 (CNY)', rate: exchangeRates.CNY, symbol: '¥' }
        ];
        
        currencies.forEach(currency => {
            const label = document.querySelector(`label[for="${currency.id}"]`);
            if (label) {
                if (currency.id === 'twd') {
                    label.innerHTML = `${currency.name} <span class="rate-display base">基準貨幣</span>`;
                } else {
                    const rateValue = currency.id === 'jpy' ? 
                        currency.rate.toFixed(2) : 
                        currency.rate.toFixed(4);
                    label.innerHTML = `${currency.name} <span class="rate-display">1 TWD = ${rateValue} ${currency.symbol}</span>`;
                }
            }
        });
    } catch (error) {
        console.error('更新匯率顯示錯誤:', error);
    }
}

// 更新匯率（使用真實API）
async function updateExchangeRates() {
    if (isUpdating) return;
    
    try {
        const refreshBtn = document.querySelector('.refresh-btn');
        const refreshIcon = document.querySelector('.refresh-icon');
        
        if (!refreshBtn || !refreshIcon) return;
        
        // 顯示載入狀態
        isUpdating = true;
        refreshBtn.disabled = true;
        refreshIcon.style.animation = 'spin 1s linear infinite';
        refreshBtn.innerHTML = '<span class="refresh-icon">🔄</span>更新中...';
        
        let success = false;
        
        // 嘗試多個API源
        for (const api of exchangeRateAPIs) {
            try {
                console.log(`嘗試使用 ${api.name} 獲取匯率...`);
                
                const response = await fetch(api.url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    },
                    // 添加超時處理
                    signal: AbortSignal.timeout(10000) // 10秒超時
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                const newRates = api.parseFunction(data);
                
                if (newRates) {
                    exchangeRates = { ...exchangeRates, ...newRates };
                    success = true;
                    console.log(`成功使用 ${api.name} 更新匯率:`, newRates);
                    break;
                }
                
            } catch (error) {
                console.warn(`${api.name} 失敗:`, error.message);
                continue;
            }
        }
        
        // 更新UI
        setTimeout(() => {
            try {
                if (success) {
                    // 重新計算當前顯示的值
                    recalculateDisplayedCurrencies();
                    
                    // 更新時間
                    lastUpdateTime = new Date();
                    updateRateUpdateTime();
                    
                    // 更新匯率顯示
                    updateRateDisplay();
                    
                    // 顯示成功訊息
                    showUpdateMessage('匯率更新成功！', 'success');
                } else {
                    // 顯示失敗訊息
                    showUpdateMessage('匯率更新失敗，使用預設匯率', 'error');
                    
                    // 仍然更新時間顯示，但標註為預設匯率
                    updateRateUpdateTime(false);
                    
                    // 更新匯率顯示
                    updateRateDisplay();
                }
                
                // 恢復按鈕狀態
                isUpdating = false;
                refreshBtn.disabled = false;
                refreshIcon.style.animation = '';
                refreshBtn.innerHTML = '<span class="refresh-icon">🔄</span>更新匯率';
            } catch (error) {
                console.error('UI更新錯誤:', error);
            }
            
        }, 1000); // 給用戶一點時間看到載入狀態
        
    } catch (error) {
        console.error('更新匯率錯誤:', error);
        isUpdating = false;
    }
}

// 解析 ExchangeRate-API 的回應
function parseExchangeRateAPI(data) {
    try {
        if (data.rates && data.base === 'TWD') {
            return {
                TWD: 1,
                USD: data.rates.USD || exchangeRates.USD,
                JPY: data.rates.JPY || exchangeRates.JPY,
                CNY: data.rates.CNY || exchangeRates.CNY
            };
        }
    } catch (error) {
        console.error('解析 ExchangeRate-API 數據失敗:', error);
    }
    return null;
}

// 解析 Fawaz API 的回應
function parseFawazAPI(data) {
    try {
        if (data.twd) {
            return {
                TWD: 1,
                USD: data.twd.usd || exchangeRates.USD,
                JPY: data.twd.jpy || exchangeRates.JPY,
                CNY: data.twd.cny || exchangeRates.CNY
            };
        }
    } catch (error) {
        console.error('解析 Fawaz API 數據失敗:', error);
    }
    return null;
}

// 重新計算當前顯示的貨幣
function recalculateDisplayedCurrencies() {
    try {
        const currencies = ['twd', 'usd', 'jpy', 'cny'];
        let sourceCurrency = null;
        let sourceValue = null;
        
        // 找到有值的輸入框
        currencies.forEach(currency => {
            const input = document.getElementById(currency);
            if (input) {
                const value = input.value;
                if (value && !isNaN(parseFloat(value)) && parseFloat(value) > 0) {
                    sourceCurrency = currency;
                    sourceValue = parseFloat(value);
                }
            }
        });
        
        // 如果有輸入值，重新計算
        if (sourceCurrency && sourceValue) {
            convertCurrency(sourceCurrency);
        }
    } catch (error) {
        console.error('重新計算顯示貨幣錯誤:', error);
    }
}

// 顯示更新訊息
function showUpdateMessage(message, type) {
    try {
        // 創建訊息元素
        const messageDiv = document.createElement('div');
        messageDiv.className = `update-message ${type}`;
        messageDiv.textContent = message;
        
        // 添加樣式
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideDown 0.3s ease;
            ${type === 'success' ? 'background: #10b981;' : 'background: #ef4444;'}
        `;
        
        document.body.appendChild(messageDiv);
        
        // 3秒後自動移除
        setTimeout(() => {
            try {
                messageDiv.style.animation = 'slideUp 0.3s ease';
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.parentNode.removeChild(messageDiv);
                    }
                }, 300);
            } catch (error) {
                console.error('移除訊息錯誤:', error);
            }
        }, 3000);
    } catch (error) {
        console.error('顯示更新訊息錯誤:', error);
    }
}

// 更新匯率更新時間
function updateRateUpdateTime(isRealData = true) {
    try {
        const now = new Date();
        const timeString = now.toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const statusText = isRealData ? '即時匯率' : '預設匯率';
        const timeElement = document.getElementById('rate-update-time');
        if (timeElement) {
            timeElement.textContent = `${timeString} (${statusText})`;
        }
    } catch (error) {
        console.error('更新匯率時間錯誤:', error);
    }
}

// CSS動畫
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 防止輸入負數
document.addEventListener('input', function(e) {
    try {
        if (e.target.type === 'number' && e.target.value < 0) {
            e.target.value = '';
        }
    } catch (error) {
        console.error('輸入驗證錯誤:', error);
    }
});

// 觸控設備優化
if ('ontouchstart' in window) {
    try {
        document.body.style.cursor = 'default';
        
        // 防止雙擊縮放
        document.addEventListener('touchstart', function(e) {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        });
        
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(e) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    } catch (error) {
        console.error('觸控設備優化錯誤:', error);
    }
}