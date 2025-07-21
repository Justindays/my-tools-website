document.addEventListener('DOMContentLoaded', () => {
    // 獲取主要的貨幣輸入框元素
    const TWD_input = document.getElementById('TWD');
    const USD_input = document.getElementById('USD');
    const JPY_input = document.getElementById('JPY');
    const CNY_input = document.getElementById('CNY');
    const lastUpdatedSpan = document.getElementById('last-updated');
    const dataSourceInfoSpan = document.getElementById('data-source-info'); // 資料來源顯示元素

    // 匯率設定輸入框 - 現在它們是「1 [貨幣] = X 台幣」
    const rateUSD_to_TWD_input = document.getElementById('rate-USD-to-TWD');
    const rateJPY_to_TWD_input = document.getElementById('rate-JPY-to-TWD');
    const rateCNY_to_TWD_input = document.getElementById('rate-CNY-to-TWD');

    // 更新匯率按鈕
    const updateRatesButton = document.getElementById('update-rates-btn');

    // 儲存當前匯率的物件，定義為：1 [貨幣] = X TWD
    let exchangeRates = {
        USD_to_TWD: 0, // 1 美金 = X 台幣
        JPY_to_TWD: 0, // 1 日幣 = X 台幣
        CNY_to_TWD: 0  // 1 人民幣 = X 台幣
    };

    // 函數：從匯率設定輸入框讀取並更新 exchangeRates 物件
    function initializeExchangeRatesFromInputs() {
        exchangeRates.USD_to_TWD = parseFloat(rateUSD_to_TWD_input.value) || 0;
        exchangeRates.JPY_to_TWD = parseFloat(rateJPY_to_TWD_input.value) || 0;
        exchangeRates.CNY_to_TWD = parseFloat(rateCNY_to_TWD_input.value) || 0;
    }

    // 函數：更新最後更新時間的顯示
    function updateLastUpdatedTime() {
        const now = new Date();
        const options = {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
            hour12: false // 使用24小時制
        };
        const formattedTime = now.toLocaleString('zh-TW', options) + ' CST';
        lastUpdatedSpan.textContent = `資料更新時間：${formattedTime}`;
    }

    // 函數：將數字格式化為小數點後兩位
    function formatCurrency(amount) {
        if (isNaN(amount) || !isFinite(amount)) {
            return ''; // 如果不是有效數字，返回空字串
        }
        return amount.toFixed(2);
    }

    // 函數：根據任何貨幣的輸入值，計算並更新所有其他貨幣的顯示
    function convertCurrency(inputElementId) {
        const inputElement = document.getElementById(inputElementId);
        let inputValue = parseFloat(inputElement.value);

        // 如果輸入為空或非數字，則清空所有貨幣輸入框
        if (isNaN(inputValue) || inputElement.value.trim() === '') {
            TWD_input.value = '';
            USD_input.value = '';
            JPY_input.value = '';
            CNY_input.value = '';
            return;
        }

        let twd_amount_calculated = 0; // 以台幣為中間基準進行換算

        // 檢查匯率是否有效，避免除以零或無窮大
        const checkRate = (rate, currencyName) => {
            if (rate === 0 || !isFinite(rate)) {
                console.warn(`Warning: Exchange rate for ${currencyName} is zero or invalid.`);
                return false;
            }
            return true;
        };

        switch (inputElementId) {
            case 'TWD':
                twd_amount_calculated = inputValue;
                if (checkRate(exchangeRates.USD_to_TWD, 'USD')) USD_input.value = formatCurrency(twd_amount_calculated / exchangeRates.USD_to_TWD);
                if (checkRate(exchangeRates.JPY_to_TWD, 'JPY')) JPY_input.value = formatCurrency(twd_amount_calculated / exchangeRates.JPY_to_TWD);
                if (checkRate(exchangeRates.CNY_to_TWD, 'CNY')) CNY_input.value = formatCurrency(twd_amount_calculated / exchangeRates.CNY_to_TWD);
                break;
            case 'USD':
                if (!checkRate(exchangeRates.USD_to_TWD, 'USD')) return;
                twd_amount_calculated = inputValue * exchangeRates.USD_to_TWD;
                TWD_input.value = formatCurrency(twd_amount_calculated);
                if (checkRate(exchangeRates.JPY_to_TWD, 'JPY')) JPY_input.value = formatCurrency(twd_amount_calculated / exchangeRates.JPY_to_TWD);
                if (checkRate(exchangeRates.CNY_to_TWD, 'CNY')) CNY_input.value = formatCurrency(twd_amount_calculated / exchangeRates.CNY_to_TWD);
                break;
            case 'JPY':
                if (!checkRate(exchangeRates.JPY_to_TWD, 'JPY')) return;
                twd_amount_calculated = inputValue * exchangeRates.JPY_to_TWD;
                TWD_input.value = formatCurrency(twd_amount_calculated);
                if (checkRate(exchangeRates.USD_to_TWD, 'USD')) USD_input.value = formatCurrency(twd_amount_calculated / exchangeRates.USD_to_TWD);
                if (checkRate(exchangeRates.CNY_to_TWD, 'CNY')) CNY_input.value = formatCurrency(twd_amount_calculated / exchangeRates.CNY_to_TWD);
                break;
            case 'CNY':
                if (!checkRate(exchangeRates.CNY_to_TWD, 'CNY')) return;
                twd_amount_calculated = inputValue * exchangeRates.CNY_to_TWD;
                TWD_input.value = formatCurrency(twd_amount_calculated);
                if (checkRate(exchangeRates.USD_to_TWD, 'USD')) USD_input.value = formatCurrency(twd_amount_calculated / exchangeRates.USD_to_TWD);
                if (checkRate(exchangeRates.JPY_to_TWD, 'JPY')) JPY_input.value = formatCurrency(twd_amount_calculated / exchangeRates.JPY_to_TWD);
                break;
        }
    }

    // 函數：根據當前有值的輸入框，以它為基準重新換算所有貨幣
    function recalculateAllCurrenciesBasedOnCurrentInput() {
        if (TWD_input.value !== '') {
            convertCurrency('TWD');
        } else if (USD_input.value !== '') {
            convertCurrency('USD');
        } else if (JPY_input.value !== '') {
            convertCurrency('JPY');
        } else if (CNY_input.value !== '') {
            convertCurrency('CNY');
        } else {
            // 如果所有輸入框都為空，則清空所有貨幣輸入框
            TWD_input.value = '';
            USD_input.value = '';
            JPY_input.value = '';
            CNY_input.value = '';
        }
    }

    // 函數：從 exchangerate.host 獲取匯率
    async function fetchExchangeRates() {
        const API_BASE_URL = 'https://api.exchangerate.host/latest';
        const baseCurrency = 'TWD';
        const targetCurrencies = ['USD', 'JPY', 'CNY'];
        const API_URL = `${API_BASE_URL}?base=${baseCurrency}&symbols=${targetCurrencies.join(',')}`;

        try {
            updateRatesButton.disabled = true;
            updateRatesButton.textContent = '更新中...';

            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.rates) {
                throw new Error("API response is missing 'rates' data.");
            }

            // exchangerate.host 返回的是「1 TWD = ? 其他貨幣」
            // 我們需要「1 USD = X TWD」，所以要對應反轉
            let updatedCount = 0;
            if (data.rates.USD) {
                rateUSD_to_TWD_input.value = (1 / data.rates.USD).toFixed(4);
                updatedCount++;
            } else {
                console.warn("exchangerate.host did not return USD rate for TWD base.");
            }
            if (data.rates.JPY) {
                rateJPY_to_TWD_input.value = (1 / data.rates.JPY).toFixed(4);
                updatedCount++;
            } else {
                console.warn("exchangerate.host did not return JPY rate for TWD base.");
            }
            if (data.rates.CNY) {
                rateCNY_to_TWD_input.value = (1 / data.rates.CNY).toFixed(4);
                updatedCount++;
            } else {
                console.warn("exchangerate.host did not return CNY rate for TWD base.");
            }

            if (updatedCount > 0) {
                dataSourceInfoSpan.textContent = 'exchangerate.host';
                updateLastUpdatedTime();
                initializeExchangeRatesFromInputs();
                recalculateAllCurrenciesBasedOnCurrentInput();
                console.log('匯率更新成功！', data);
                alert('匯率更新成功！');
            } else {
                throw new Error("API returned no usable rates.");
            }

        } catch (error) {
            console.error('更新匯率失敗:', error);
            alert('更新匯率失敗，請檢查網路或稍後再試。\n錯誤訊息: ' + error.message);
            dataSourceInfoSpan.textContent = '手動輸入 (更新失敗)';
        } finally {
            updateRatesButton.disabled = false;
            updateRatesButton.textContent = '從網站更新匯率';
        }
    }

    // 事件監聽器：監聽匯率設定輸入框的變化 (手動調整匯率時)
    rateUSD_to_TWD_input.addEventListener('input', () => {
        initializeExchangeRatesFromInputs();
        recalculateAllCurrenciesBasedOnCurrentInput();
        updateLastUpdatedTime(); // 手動修改後也更新時間戳
        dataSourceInfoSpan.textContent = '手動輸入'; // 手動調整後，來源改回手動
    });
    rateJPY_to_TWD_input.addEventListener('input', () => {
        initializeExchangeRatesFromInputs();
        recalculateAllCurrenciesBasedOnCurrentInput();
        updateLastUpdatedTime();
        dataSourceInfoSpan.textContent = '手動輸入';
    });
    rateCNY_to_TWD_input.addEventListener('input', () => {
        initializeExchangeRatesFromInputs();
        recalculateAllCurrenciesBasedOnCurrentInput();
        updateLastUpdatedTime();
        dataSourceInfoSpan.textContent = '手動輸入';
    });

    // 事件監聽器：監聽貨幣輸入框的變化 (實時換算)
    TWD_input.addEventListener('input', () => convertCurrency('TWD'));
    USD_input.addEventListener('input', () => convertCurrency('USD'));
    JPY_input.addEventListener('input', () => convertCurrency('JPY'));
    CNY_input.addEventListener('input', () => convertCurrency('CNY'));

    // 新增事件監聽器：監聽「更新匯率」按鈕點擊事件
    updateRatesButton.addEventListener('click', fetchExchangeRates);

    // 頁面完全載入時，執行初始化動作
    initializeExchangeRatesFromInputs(); // 根據 HTML 中設定的預設值初始化匯率
    recalculateAllCurrenciesBasedOnCurrentInput(); // 根據初始匯率和輸入框的預設值（如果有的話）進行一次換算
    updateLastUpdatedTime(); // 初始載入時先更新時間
});