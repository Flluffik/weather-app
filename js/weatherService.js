// API ключ OpenWeatherMap
const API_KEY = '23d3bc4ed6207e95a39c8bc270d678ea';
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEOCODING_API_URL = 'https://api.openweathermap.org/geo/1.0';

// Список городов для автодополнения
const CITIES_LIST = [
    "Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань",
    "Нижний Новгород", "Челябинск", "Самара", "Омск", "Ростов-на-Дону",
    "Уфа", "Красноярск", "Воронеж", "Пермь", "Волгоград",
    "Лондон", "Париж", "Берлин", "Мадрид", "Рим",
    "Нью-Йорк", "Лос-Анджелес", "Чикаго", "Торонто", "Сидней",
    "Токио", "Пекин", "Сеул", "Дели", "Стамбул",
    "Киев", "Минск", "Астана", "Ереван", "Тбилиси",
    "Сочи", "Владивосток", "Калининград", "Мурманск", "Якутск",
    "Амстердам", "Прага", "Вена", "Будапешт", "Варшава",
    "Дубай", "Бангкок", "Сингапур", "Гонконг", "Шанхай"
];

// Функция для поиска городов по введенному тексту
function searchCities(query) {
    if (!query || query.trim().length < 2) {
        return [];
    }
    
    const searchTerm = query.toLowerCase().trim();
    return CITIES_LIST.filter(city => 
        city.toLowerCase().includes(searchTerm)
    ).slice(0, 10);
}

// Функция для проверки существования города
function isValidCity(cityName) {
    return CITIES_LIST.some(city => 
        city.toLowerCase() === cityName.toLowerCase().trim()
    );
}

// Получение координат по названию города
async function getCityCoordinates(cityName) {
    try {
        console.log('Запрос координат для города:', cityName);
        const response = await fetch(
            `${GEOCODING_API_URL}/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${API_KEY}`
        );
        
        console.log('Статус ответа координат:', response.status);
        
        if (!response.ok) {
            throw new Error('Ошибка получения координат города');
        }
        
        const data = await response.json();
        console.log('Данные координат:', data);
        
        if (data.length === 0) {
            throw new Error('Город не найден');
        }
        
        // ВАЖНО: Сохраняем то название, которое вернул API
        const apiCityName = data[0].name;
        const localizedName = getLocalizedName(cityName, apiCityName);
        
        return {
            lat: data[0].lat,
            lon: data[0].lon,
            name: localizedName, // Используем локализованное название
            apiName: apiCityName, // Сохраняем оригинальное название из API
            country: data[0].country
        };
    } catch (error) {
        console.error('Ошибка при получении координат:', error);
        throw error;
    }
}

// Функция для получения локализованного названия
function getLocalizedName(userInput, apiName) {
    // Сопоставление английских названий с русскими
    const cityMap = {
        'moscow': 'Москва',
        'saint petersburg': 'Санкт-Петербург',
        'novosibirsk': 'Новосибирск',
        'yekaterinburg': 'Екатеринбург',
        'kazan': 'Казань',
        'nizhny novgorod': 'Нижний Новгород',
        'chelyabinsk': 'Челябинск',
        'samara': 'Самара',
        'omsk': 'Омск',
        'rostov-on-don': 'Ростов-на-Дону',
        'ufa': 'Уфа',
        'krasnoyarsk': 'Красноярск',
        'voronezh': 'Воронеж',
        'perm': 'Пермь',
        'volgograd': 'Волгоград',
        'london': 'Лондон',
        'paris': 'Париж',
        'berlin': 'Берлин',
        'madrid': 'Мадрид',
        'rome': 'Рим',
        'new york': 'Нью-Йорк',
        'los angeles': 'Лос-Анджелес',
        'chicago': 'Чикаго',
        'toronto': 'Торонто',
        'sydney': 'Сидней',
        'tokyo': 'Токио',
        'beijing': 'Пекин',
        'seoul': 'Сеул',
        'delhi': 'Дели',
        'istanbul': 'Стамбул',
        'kyiv': 'Киев',
        'minsk': 'Минск',
        'astana': 'Астана',
        'yerevan': 'Ереван',
        'tbilisi': 'Тбилиси',
        'sochi': 'Сочи',
        'vladivostok': 'Владивосток',
        'kaliningrad': 'Калининград',
        'murmansk': 'Мурманск',
        'yakutsk': 'Якутск',
        'amsterdam': 'Амстердам',
        'prague': 'Прага',
        'vienna': 'Вена',
        'budapest': 'Будапешт',
        'warsaw': 'Варшава',
        'dubai': 'Дубай',
        'bangkok': 'Бангкок',
        'singapore': 'Сингапур',
        'hong kong': 'Гонконг',
        'shanghai': 'Шанхай'
    };
    
    const apiNameLower = apiName.toLowerCase();
    
    // Если нашли в маппинге - используем русское название
    if (cityMap[apiNameLower]) {
        return cityMap[apiNameLower];
    }
    
    // Иначе используем то, что ввел пользователь (но нормализованное)
    return userInput.trim();
}

// Получение прогноза погоды
async function getWeatherForecast(lat, lon, cityName) {
    try {
        console.log('Запрос погоды для координат:', lat, lon, 'для города:', cityName);
        const url = `${API_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ru`;
        console.log('URL запроса:', url);
        
        const response = await fetch(url);
        
        console.log('Статус ответа погоды:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Ошибка API:', errorText);
            throw new Error('Ошибка получения прогноза погоды');
        }
        
        const data = await response.json();
        console.log('Данные погоды получены, город из API:', data.city.name);
        
        // Группируем данные по дням
        const dailyForecasts = groupForecastsByDay(data.list);
        
        return {
            city: cityName, // Используем переданное название города
            apiCityName: data.city.name, // Сохраняем название из API
            country: data.city.country,
            forecasts: dailyForecasts.slice(0, 3)
        };
    } catch (error) {
        console.error('Ошибка при получении погоды:', error);
        throw error;
    }
}

// Группировка прогнозов по дням
function groupForecastsByDay(forecastList) {
    const grouped = {};
    
    forecastList.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const dateKey = date.toLocaleDateString('ru-RU', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
        
        if (!grouped[dateKey]) {
            grouped[dateKey] = {
                date: dateKey,
                fullDate: date,
                forecasts: [],
                temp_min: forecast.main.temp_min,
                temp_max: forecast.main.temp_max,
                description: forecast.weather[0].description,
                icon: forecast.weather[0].icon,
                humidity: forecast.main.humidity,
                pressure: forecast.main.pressure,
                wind_speed: forecast.wind.speed,
                wind_deg: forecast.wind.deg,
                precipitation: forecast.pop * 100
            };
        } else {
            grouped[dateKey].forecasts.push(forecast);
            grouped[dateKey].temp_min = Math.min(grouped[dateKey].temp_min, forecast.main.temp_min);
            grouped[dateKey].temp_max = Math.max(grouped[dateKey].temp_max, forecast.main.temp_max);
        }
    });
    
    return Object.values(grouped);
}

// Получение погоды по геолокации
async function getWeatherByGeolocation(coords) {
    const weather = await getWeatherForecast(coords.latitude, coords.longitude, 'Текущее местоположение');
    return {
        ...weather,
        city: 'Текущее местоположение'
    };
}

// Получение погоды по названию города
async function getWeatherByCityName(cityName) {
    const coords = await getCityCoordinates(cityName);
    const weather = await getWeatherForecast(coords.lat, coords.lon, coords.name);
    return {
        ...weather,
        originalName: cityName // Сохраняем оригинальное название для удаления
    };
}

// Получение иконки погоды
function getWeatherIconUrl(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}