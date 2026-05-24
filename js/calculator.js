document.addEventListener('DOMContentLoaded', () => {
    const calcBtn = document.getElementById('calc-submit-btn');
    const priceOutput = document.getElementById('calc-price-output');

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
        worktop_mp: {
            'dsp28': 1200,
            'dsp38': 1200,
            'compact12': 4400,
            'fenix': 18400
        },
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
        const settings = categorySettings[activeCategory] || categorySettings['Кухня'];

        // Отримання значень
        const brand = document.getElementById('calc-hardware')?.value || 'giff';
        const length = parseFloat(document.getElementById('calc-length')?.value) || 0;
        const facadeType = document.getElementById('calc-facade')?.value || 'dsp';

        const upperCount = parseInt(document.getElementById('calc-upper-cabinets')?.value) || 0;
        const lowerCount = parseInt(document.getElementById('calc-lower-cabinets')?.value) || 0;
        const countertopLengthMm = parseFloat(document.getElementById('calc-countertop')?.value) || 0;
        const worktopType = document.getElementById('calc-countertop-material')?.value || 'dsp28';

        const countDrawers = parseInt(document.getElementById('calc-drawers')?.value) || 0;
        const doorsCount = parseInt(document.getElementById('calc-doors')?.value) || 0;

        // Висота фасадів (мм)
        const facadeHeightLow = parseFloat(document.getElementById('calc-facade-height')?.value) || 0;
        const facadeHeightHigh = parseFloat(document.getElementById('calc-facade-width')?.value) || 0;

        // 1. Фурнітура
        const hardwarePrices = prices.hardware[brand] || prices.hardware.giff;
        // Беремо за ширину фасаду стандартно 500мм для розрахунку петель
        const totalHinges = doorsCount * calculateHinges(facadeHeightLow > 0 ? facadeHeightLow : 700, 500);
        const totalHardware = (totalHinges * hardwarePrices.loop) + (countDrawers * hardwarePrices.runner);

        // 2. Фасади (Розрахунок площі в м²)
        // Нижні (ширину беремо 600мм), Верхні (ширину беремо 400мм)
        const areaLower = lowerCount * (facadeHeightLow * 600) / 1000000;
        const areaUpper = upperCount * (facadeHeightHigh * 400) / 1000000;
        const totalFacade = (areaLower + areaUpper) * (prices.facade_sqm[facadeType] || 0);

        // 3. Стільниця
        const totalWorktop = settings.hasWorktop ? (countertopLengthMm / 1000) * (prices.worktop_mp[worktopType] || 0) : 0;

        // 4. База корпусу + Тумби
        const totalBase = (length * prices.baseCostPerMeter * settings.baseMultiplier) +
        ((upperCount + lowerCount) * prices.cabinetPrice);

        // 5. Фінальний розрахунок з коефіцієнтом
        let total = totalHardware + totalFacade + totalWorktop + totalBase;
        const coefficient = 1.8;
        total = total * coefficient;

        priceOutput.innerText = `${Math.round(total).toLocaleString('uk-UA')} грн`;
    });
});
