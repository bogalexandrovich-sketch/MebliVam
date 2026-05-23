document.addEventListener('DOMContentLoaded', () => {
    const calcBtn = document.getElementById('calc-submit-btn');
    const priceOutput = document.getElementById('calc-price-output');

    // Змінна для зберігання поточної категорії (за замовчуванням "Кухня")
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
        worktop_mp: { std28: 1500, std38: 2200, h2o38: 3200, hpl38: 6500, compact12: 11000 },
        baseCostPerMeter: 10500
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

    // Логіка перемикання кнопок та оновлення категорії
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('calc-cat-btn')) {
            document.querySelectorAll('.calc-cat-btn').forEach(b => {
                b.classList.remove('bg-amber-500', 'text-slate-950');
                b.classList.add('bg-slate-950/60', 'text-slate-400');
            });
            e.target.classList.add('bg-amber-500', 'text-slate-950');
            e.target.classList.remove('bg-slate-950/60', 'text-slate-400');

            // Оновлюємо змінну
            activeCategory = e.target.innerText;
        }
    });

    calcBtn.addEventListener('click', () => {
        const settings = categorySettings[activeCategory] || categorySettings['Кухня'];

        const brand = document.getElementById('calc-hardware')?.value;
        const length = parseFloat(document.getElementById('calc-length')?.value) || 0;
        const facadeType = document.getElementById('calc-facade')?.value;
        const worktopType = document.getElementById('calc-worktop')?.value || 'std28';
        const countDrawers = parseInt(document.getElementById('calc-drawers')?.value) || 0;
        const facadeHeight = parseFloat(document.getElementById('calc-facade-height')?.value) || 0;
        const facadeWidth = parseFloat(document.getElementById('calc-facade-width')?.value) || 0;
        const doorsCount = parseInt(document.getElementById('calc-doors')?.value) || 0;

        // 1. Фурнітура
        const totalHinges = doorsCount * calculateHinges(facadeHeight, facadeWidth);
        const totalHardware = (totalHinges * prices.hardware[brand].loop) +
        (countDrawers * prices.hardware[brand].runner);

        // 2. Фасади
        const totalFacade = (length * 2.5) * (prices.facade_sqm[facadeType] || 0);

        // 3. Стільниця (тільки якщо в налаштуваннях категорії hasWorktop: true)
        const totalWorktop = settings.hasWorktop ? (length * (prices.worktop_mp[worktopType] || 0)) : 0;

        // 4. База корпусу (множимо на baseMultiplier категорії)
        const totalBase = length * prices.baseCostPerMeter * settings.baseMultiplier;

        const total = totalHardware + totalFacade + totalWorktop + totalBase;

        priceOutput.innerText = `${Math.round(total).toLocaleString('uk-UA')} грн`;
    });
});
