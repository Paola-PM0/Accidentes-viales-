 // Mostrar/Ocultar Panel
    const toggleBtn = document.getElementById('toggleDashboardBtn');
    const dashboard = document.getElementById('dashboardPanel');

    toggleBtn.addEventListener('click', () => {
    const visible = dashboard.style.display !== 'none';
    dashboard.style.display = visible ? 'none' : 'flex';
    toggleBtn.textContent = visible ? 'Mostrar Panel' : 'Ocultar Panel';
    });

    // Función de gráficos de ejemplo (sin librerías)
    const ctx1 = document.getElementById('tipoAccidenteChart').getContext('2d');
    const ctx2 = document.getElementById('accidentesDiaChart').getContext('2d');

    function drawBarChart(ctx, labels, data) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const max = Math.max(...data);
    const barWidth = width / data.length;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#2980b9';

    data.forEach((value, i) => {
        const barHeight = (value / max) * (height - 20);
        ctx.fillRect(i * barWidth + 10, height - barHeight, barWidth - 20, barHeight);
        ctx.fillStyle = '#34495e';
        ctx.fillText(labels[i], i * barWidth + 10, height - 5);
        ctx.fillStyle = '#2980b9';
    });
    }

    function drawPieChart(ctx, data, colors, labels) {
    const total = data.reduce((a, b) => a + b, 0);
    let startAngle = 0;

    data.forEach((value, i) => {
        const sliceAngle = (value / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(100, 75);
        ctx.arc(100, 75, 70, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = colors[i];
        ctx.fill();
        startAngle += sliceAngle;
    });

      // Leyenda
    ctx.fillStyle = "#000";
    labels.forEach((label, i) => {
        ctx.fillRect(180, 20 + i * 20, 10, 10);
        ctx.fillText(label, 195, 30 + i * 20);
    });
    }

    drawBarChart(ctx2, ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'], [12, 19, 7, 14, 10, 5, 8]);
    drawPieChart(ctx1, [10, 5, 8], ['#e74c3c', '#f1c40f', '#2ecc71'], ['Choque', 'Atropello', 'Volcadura']);