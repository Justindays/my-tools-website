document.addEventListener('DOMContentLoaded', () => {
    // 獲取主要的貨幣輸入框元素
    const TWD_input = document.getElementById('TWD');
    const USD_input = document.getElementById('USD');
    const JPY_input = document.getElementById('JPY');
    const CNY_input = document.getElementById('CNY');
    const lastUpdatedSpan = document.getElementById('last-updated');

    // 匯率設定輸入框 - 現在它們是「1 [貨幣] = X 台幣」
    const rateUSD_to_TWD_input = document.getElementById('rate-USD-to-TWD');
    const rateJPY_to_TWD_input = document.getElementById('rate-JPY-to-TWD');
    const rateCNY_to_TWD_input = document.getElementById('rate-CNY-to-TWD');

    // 儲存當前匯率的物件，定義為：1 [貨幣] = X TWD
    let exchangeRates = {
        USD_to_TWD: 0, // 1 美金 = X 台幣
        JPY_to_TWD: 0, // 1 日幣 = X 台幣
        CNY_to_TWD: 0  // 1 人民幣 = X 台幣
    };

    // 函數：從匯率設定輸入框讀取並更新 exchangeRates 物件
    function initializeExchangeRates() {
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

        switch (inputElementId) {
            case 'TWD':
                twd_amount_calculated = inputValue;
                // 台幣換美金：台幣 / (1 美金 = X 台幣)
                USD_input.value = formatCurrency(twd_amount_calculated / exchangeRates.USD_to_TWD);
                // 台幣換日幣：台幣 / (1 日幣 = X 台幣)
                JPY_input.value = formatCurrency(twd_amount_calculated / exchangeRates.JPY_to_TWD);
                // 台幣換人民幣：台幣 / (1 人民幣 = X 台幣)
                CNY_input.value = formatCurrency(twd_amount_calculated / exchangeRates.CNY_to_TWD);
                break;
            case 'USD':
                // 美金換台幣：美金 * (1 美金 = X 台幣)
                twd_amount_calculated = inputValue * exchangeRates.USD_to_TWD;
                TWD_input.value = formatCurrency(twd_amount_calculated);
                // 美金換日幣 (透過台幣)：(美金 * USD_to_TWD) / JPY_to_TWD
                JPY_input.value = formatCurrency(twd_amount_calculated / exchangeRates.JPY_to_TWD);
                // 美金換人民幣 (透過台幣)：(美金 * USD_to_TWD) / CNY_to_TWD
                CNY_input.value = formatCurrency(twd_amount_calculated / exchangeRates.CNY_to_TWD);
                break;
            case 'JPY':
                // 日幣換台幣：日幣 * (1 日幣 = X 台幣)
                twd_amount_calculated = inputValue * exchangeRates.JPY_to_TWD;
                TWD_input.value = formatCurrency(twd_amount_calculated);
                // 日幣換美金 (透過台幣)：(日幣 * JPY_to_TWD) / USD_to_TWD
                USD_input.value = formatCurrency(twd_amount_calculated / exchangeRates.USD_to_TWD);
                // 日幣換人民幣 (透過台幣)：(日幣 * JPY_to_TWD) / CNY_to_TWD
                CNY_input.value = formatCurrency(twd_amount_calculated / exchangeRates.CNY_to_TWD);
                break;
            case 'CNY':
                // 人民幣換台幣：人民幣 * (1 人民幣 = X 台幣)
                twd_amount_calculated = inputValue * exchangeRates.CNY_to_TWD;
                TWD_input.value = formatCurrency(twd_amount_calculated);
                // 人民幣換美金 (透過台幣)：(人民幣 * CNY_to_TWD) / USD_to_TWD
                USD_input.value = formatCurrency(twd_amount_calculated / exchangeRates.USD_to_TWD);
                // 人民幣換日幣 (透過台幣)：(人民幣 * CNY_to_TWD) / JPY_to_TWD
                JPY_input.value = formatCurrency(twd_amount_calculated / exchangeRates.JPY_to_TWD);
                break;
        }
    }

    // 函數：當匯率設定改變時，更新匯率並重新計算所有貨幣
    function updateExchangeRatesAndRecalculate() {
        initializeExchangeRates(); // 重新從輸入框讀取最新匯率

        // 根據目前有值的輸入框，以它為基準重新換算
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
        updateLastUpdatedTime(); // 匯率更新後，也更新時間戳
    }

    // 事件監聽器：監聽匯率設定輸入框的變化
    rateUSD_to_TWD_input.addEventListener('input', updateExchangeRatesAndRecalculate);
    rateJPY_to_TWD_input.addEventListener('input', updateExchangeRatesAndRecalculate);
    rateCNY_to_TWD_input.addEventListener('input', updateExchangeRatesAndRecalculate);

    // 事件監聽器：監聽貨幣輸入框的變化 (實時換算)
    TWD_input.addEventListener('input', () => convertCurrency('TWD'));
    USD_input.addEventListener('input', () => convertCurrency('USD'));
    JPY_input.addEventListener('input', () => convertCurrency('JPY'));
    CNY_input.addEventListener('input', () => convertCurrency('CNY'));

    // 頁面完全載入時，執行初始化動作
    updateLastUpdatedTime(); // 初始載入時先更新時間
    initializeExchangeRates(); // 根據 HTML 中設定的預設值初始化匯率
    updateExchangeRatesAndRecalculate(); // 根據初始匯率和輸入框的預設值（如果有的話）進行一次換算
});