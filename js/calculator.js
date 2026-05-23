document.addEventListener('DOMContentLoaded', () => {
    const calcBtn = document.getElementById('calc-submit-btn');
    const priceOutput = document.getElementById('calc-price-output');

    const prices = {
        // Ціна за 1 штуку (фурнітура)
        hardware: {
            giff: { loop: 180, runner: 1600 },
            muller: { loop: 350, runner: 2400 },
            blum: { loop: 850, runner: 5200 }
        },
        // Ціна за 1 м.кв. фасаду (вже з урахуванням матеріалу + обробки)
        facade_sqm: {
            'dsp': 1600,
            'dsp-pur': 2200,
            'mdf-film': 3800,
            'mdf-paint': 6800,
            'mdf-milled': 8800,
            'mdf-veneer': 13500
        },
        // Ціна за 1 м.п. стільниці
        worktop_mp: { std28: 1500, std38: 2200, h2o38: 3200, hpl38: 6500, compact12: 11000 },
        // Базова вартість корпусу (матеріал + розпил + кромка + збірка + монтаж) за м.п.
        baseCostPerMeter: 10500
    };

    function calculateHinges(height, width) {
        let count = 2;
        if (height >= 1000 && height < 1600) count = 3;
        if (height >= 1600) count = 4;
        if (width > 500) count++;
        return count;
    }

    calcBtn.addEventListener('click', () => {
        const brand = document.getElementById('calc-hardware')?.value;
        const length = parseFloat(document.getElementById('calc-length')?.value) || 0;
        const facadeType = document.getElementById('calc-facade')?.value;
        const worktopType = document.getElementById('calc-worktop')?.value;
        const countDrawers = parseInt(document.getElementById('calc-drawers')?.value) || 0;

        const facadeHeight = parseFloat(document.getElementById('calc-facade-height')?.value) || 0;
        const facadeWidth = parseFloat(document.getElementById('calc-facade-width')?.value) || 0;
        const doorsCount = parseInt(document.getElementById('calc-doors')?.value) || 0;

        // 1. Фурнітура: петлі (авто-розрахунок) + шухляди
        const totalHinges = doorsCount * calculateHinges(facadeHeight, facadeWidth);
        const totalHardware = (totalHinges * prices.hardware[brand].loop) +
        (countDrawers * prices.hardware[brand].runner);

        // 2. Фасади: (довжина * 2.5 коефіцієнт м.кв на м.п.)
        const totalFacade = (length * 2.5) * (prices.facade_sqm[facadeType] || 0);

        // 3. Стільниця
        const totalWorktop = length * (prices.worktop_mp[worktopType] || 0);

        // 4. База корпусу
        const totalBase = length * prices.baseCostPerMeter;

        const total = totalHardware + totalFacade + totalWorktop + totalBase;

        priceOutput.innerText = `${Math.round(total).toLocaleString('uk-UA')} грн`;
    });
});
