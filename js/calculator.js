document.addEventListener('DOMContentLoaded', () => {
    const calcBtn = document.getElementById('calc-submit-btn');
    const sendCalcBtn = document.getElementById('send-detailed-calc');
    const priceOutput = document.getElementById('calc-price-output');

    // Елементи нового модального вікна
    const modal = document.getElementById('sketch-modal');
    const modalSendBtn = document.getElementById('modal-send-btn');
    const modalSkipBtn = document.getElementById('modal-skip-btn');
    const modalFileInput = document.getElementById('modal-file-input');
    const modalFileLabel = document.getElementById('modal-file-label');

    let activeCategory = 'Кухня';

    const prices = {
        hardware: {
            giff: { loop: 180, runner: 1600 },
            muller: { loop: 350, runner: 2400 },
            blum: { loop: 850, runner: 5200 }
        },
        facade_sqm: {
            'dsp': 1600, 'dsp-pur': 2200, 'mdf-film': 3800,
            'mdf-paint': 6800, 'mdf-milled': 8800, 'mdf-veneer': 13500
        },
        worktopSheetPrice: 4200,
        worktopSheetLength: 4.2,
        baseCostPerMeter: 10500,
        cabinetPrice: 1500
    };

    const categorySettings = {
        'Кухня': { baseMultiplier: 1.0, hasWorktop: true },
        'Шафа': { baseMultiplier: 0.7, hasWorktop: false },
        'Вітальня': { baseMultiplier: 0.8, hasWorktop: false },
        'Дитяча': { baseMultiplier: 0.75, hasWorktop: false },
        'Передпокій': { baseMultiplier: 0.6, hasWorktop: false },
        'Спальня': { baseMultiplier: 0.7, hasWorktop: false },
        'Сан. Вузол': { baseMultiplier: 0.9, hasWorktop: true },
        'Гардеробна': { baseMultiplier: 0.5, hasWorktop: false }
    };

    function calculateHinges(height, width) {
        let count = 2;
        if (height >= 1000 && height < 1600) count = 3;
        if (height >= 1600) count = 4;
        if (width > 500) count++;
        return count;
    }

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('calc-cat-btn')) {
            document.querySelectorAll('.calc-cat-btn').forEach(b => {
                b.classList.remove('bg-amber-500', 'text-slate-950');
                b.classList.add('bg-slate-950/60', 'text-slate-400');
            });
            e.target.classList.add('bg-amber-500', 'text-slate-950');
            e.target.classList.remove('bg-slate-950/60', 'text-slate-400');
            activeCategory = e.target.innerText;
        }
    });

    calcBtn.addEventListener('click', () => {
        sendCalcBtn.classList.add('hidden');
        const settings = categorySettings[activeCategory] || categorySettings['Кухня'];

        const brand = document.getElementById('calc-hardware')?.value || 'giff';
        const length = parseFloat(document.getElementById('calc-length')?.value) || 0;
        const facadeType = document.getElementById('calc-facade')?.value || 'dsp';
        const upperCount = parseInt(document.getElementById('calc-upper-cabinets')?.value) || 0;
        const lowerCount = parseInt(document.getElementById('calc-lower-cabinets')?.value) || 0;
        const countertopLengthM = parseFloat(document.getElementById('calc-countertop')?.value) / 1000 || 0;
        const countDrawers = parseInt(document.getElementById('calc-drawers')?.value) || 0;
        const doorsCount = parseInt(document.getElementById('calc-doors')?.value) || 0;
        const facadeHeightLow = parseFloat(document.getElementById('calc-facade-height')?.value) || 0;
        const facadeHeightHigh = parseFloat(document.getElementById('calc-facade-width')?.value) || 0;

        const hardwarePrices = prices.hardware[brand] || prices.hardware.giff;
        const totalHinges = doorsCount * calculateHinges(facadeHeightLow > 0 ? facadeHeightLow : 700, 500);
        const totalHardware = (totalHinges * hardwarePrices.loop) + (countDrawers * hardwarePrices.runner);

        const areaLower = lowerCount * (facadeHeightLow * 600) / 1000000;
        const areaUpper = upperCount * (facadeHeightHigh * 400) / 1000000;
        const totalFacade = (areaLower + areaUpper) * (prices.facade_sqm[facadeType] || 0);

        const totalWorktop = settings.hasWorktop ? Math.ceil(countertopLengthM / prices.worktopSheetLength) * prices.worktopSheetPrice : 0;
        const totalBase = (length * prices.baseCostPerMeter * settings.baseMultiplier) + ((upperCount + lowerCount) * prices.cabinetPrice);

        let total = (totalHardware + totalFacade + totalWorktop + totalBase) * 1.8;

        priceOutput.innerText = `${Math.round(total).toLocaleString('uk-UA')} грн`;
        sendCalcBtn.classList.remove('hidden');
    });

    // Зміна тексту шпильки при виборі файлу
    modalFileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            modalFileLabel.innerText = `📎 ${file.name}`;
        } else {
            modalFileLabel.innerText = "Натисніть, щоб прикріпити файл";
        }
    });

    // Клік на основну кнопку — відкриває вікно
    sendCalcBtn.addEventListener('click', () => {
        const savedData = localStorage.getItem('currentUserData');
        const userData = savedData ? JSON.parse(savedData) : null;

        if (!userData || !userData.email) {
            alert("Будь ласка, увійдіть у систему на сторінці відгуків!");
            window.location.href = "/відгуки.html";
            return;
        }

        // Скидаємо вибір файлу з минулого разу та відкриваємо модалку
        modalFileInput.value = "";
        modalFileLabel.innerText = "Натисніть, щоб прикріпити файл";
        modal.classList.remove('hidden');
    });

    // Функція генерації та відправки запиту
    function executeDataSend(fileData = null, fileName = null) {
        const savedData = localStorage.getItem('currentUserData');
        const userData = JSON.parse(savedData);

        const payload = {
            type: "calc",
            name: userData.name,
            email: userData.email,
            category: activeCategory,
            price: priceOutput.innerText,
            length: document.getElementById('calc-length')?.value || "0",
                          upperCount: document.getElementById('calc-upper-cabinets')?.value || "0",
                          lowerCount: document.getElementById('calc-lower-cabinets')?.value || "0",
                          worktopMaterial: document.getElementById('calc-countertop-material')?.value || "Не обрано",
                          facade: document.getElementById('calc-facade')?.value || "Не обрано"
        };

        if (fileData && fileName) {
            payload.fileData = fileData;
            payload.fileName = fileName;
        }

        modalSendBtn.innerText = "Відправляємо...";
        modalSendBtn.disabled = true;
        modalSkipBtn.disabled = true;

        fetch('https://script.google.com/macros/s/AKfycbwPA9DNIUfzVXmaf6AeCXQiSfllENLXGojQgOvXeJbkhQGF2nR3XBs5kr9qT9aD2aPh/exec', {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        })
        .then(() => {
            alert("Дякуємо! Прорахунок успішно надіслано адміну.");
            modal.classList.add('hidden');
            sendCalcBtn.innerText = "Надіслано";
            sendCalcBtn.disabled = true;
            modalSendBtn.disabled = false;
            modalSkipBtn.disabled = false;
            modalSendBtn.innerText = "Надіслати";
        })
        .catch(err => {
            console.error(err);
            alert("Помилка відправки.");
            modalSendBtn.disabled = false;
            modalSkipBtn.disabled = false;
            modalSendBtn.innerText = "Надіслати";
        });
    }

    // Клінічні сценарії кнопок модалки
    modalSendBtn?.addEventListener('click', () => {
        const file = modalFileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const base64Data = event.target.result.split(',')[1];
                executeDataSend(base64Data, file.name);
            };
            reader.readAsDataURL(file);
        } else {
            executeDataSend(); // Надсилаємо порожнім, якщо файлу немає, але натиснули Надіслати
        }
    });

    modalSkipBtn?.addEventListener('click', () => {
        executeDataSend(); // Пропустити — надсилаємо сухі дані
    });
});
