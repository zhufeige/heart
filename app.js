const API_KEY = '281c60d660192df7d674ffac176f127a';
const CURRENT_WEATHER_API = 'https://restapi.amap.com/v3/weather/weatherInfo';

// 初始化事件监听
document.getElementById('searchBtn').addEventListener('click', searchWeather);
document.getElementById('cityInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchWeather();
});

function searchWeather() {
    const city = document.getElementById('cityInput').value.trim();
    if (!city) {
        alert('请输入城市名称');
        return;
    }

    getWeatherData(city)
        .then(data => updateUI(data))
        .catch(error => {
            console.error('获取天气数据失败:', error);
            alert('查询失败，请检查城市名称或网络连接');
        });
}

async function getWeatherData(city) {
    try {
        // 获取实时天气
        const currentRes = await fetch(
            `${CURRENT_WEATHER_API}?city=${encodeURIComponent(city)}&key=${API_KEY}&extensions=base`
        );
        const currentData = await currentRes.json();
        if (currentData.infocode !== '10000') throw new Error(currentData.info);

        // 获取未来3天预报
        const forecastRes = await fetch(
            `${CURRENT_WEATHER_API}?city=${encodeURIComponent(city)}&key=${API_KEY}&extensions=all`
        );
        const forecastData = await forecastRes.json();
        if (forecastData.infocode !== '10000') throw new Error(forecastData.info);

        return {
            current: currentData.lives[0],
            forecast: forecastData.forecasts[0].casts
        };
    } catch (error) {
        throw error;
    }
}

function updateUI(data) {
    // 更新当前天气
    const currentWeatherCard = document.getElementById('currentWeather');
    document.getElementById('city').textContent = data.current.city;
    const weatherType = data.current.weather;
    document.getElementById('weather').textContent = weatherType;
    document.getElementById('temperature').textContent = data.current.temperature;
    document.getElementById('humidity').textContent = data.current.humidity;
    document.getElementById('windPower').textContent = data.current.windpower;
    // 添加当前天气卡片悬停随机偏移效果
    currentWeatherCard.addEventListener('mouseover', () => {
        const randomX = (Math.random() - 0.5) * 10; // -5px到5px
        const randomY = (Math.random() - 0.5) * 10;
        currentWeatherCard.style.transform = `translate(${randomX}px, ${randomY}px)`;
    });
    currentWeatherCard.addEventListener('mouseout', () => {
        currentWeatherCard.style.transform = 'none';
    });
    // 定义天气类型与CSS类的映射
function getWeatherClass(weatherType) {
    const weatherMap = {
        '晴': 'sunny',
        '多云': 'cloudy',
        '阴': 'overcast',
        '小雨': 'light-rain',
        '中雨': 'moderate-rain',
        '大雨': 'heavy-rain',
        '雪': 'snowy'
    };
    return weatherMap[weatherType] || 'default';
}

// 应用天气背景特效
const effectsContainer = document.getElementById('weather-effects');
 effectsContainer.className = `weather-effects ${getWeatherClass(weatherType)}`;

    // 清空旧预报数据
    const forecastContainer = document.getElementById('forecastWeather');
    forecastContainer.innerHTML = '';

    // 生成未来预报卡片
    data.forecast.forEach(day => {
        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <div class="forecast-date">${day.date} ${day.week}</div>
            <div class="weather-icon">${day.dayweather}</div>
            <div class="forecast-temp">${day.nighttemp}℃ ~ ${day.daytemp}℃</div>
            <div class="forecast-wind">${day.daywind} ${day.daypower}级</div>
        `;
        // 添加悬停随机偏移效果
        card.addEventListener('mouseover', () => {
            const randomX = (Math.random() - 0.5) * 10; // -5px到5px
            const randomY = (Math.random() - 0.5) * 10;
            card.style.transform = `translate(${randomX}px, ${randomY}px)`;
        });
        card.addEventListener('mouseout', () => {
            card.style.transform = 'none';
        });
        forecastContainer.appendChild(card);
    });
}