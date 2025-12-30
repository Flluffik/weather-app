class WeatherApp {
    constructor() {
        console.log('=== ИНИЦИАЛИЗАЦИЯ WEATHERAPP ===');
        
        this.ui = new UI();
        this.isLoading = false;
        
        // Устанавливаем колбэки
        this.ui.setRefreshCallback(() => this.refreshWeather());
        this.ui.setCityAddedCallback(() => this.refreshWeather());
        this.ui.setCityRemovedCallback(() => this.refreshWeather());
        
        this.init();
    }

    async init() {
        try {
            this.ui.showLoading();
            
            // Получаем ВСЕ локации (включая возможно восстановленную текущую)
            const allLocations = getAllLocations();
            console.log('Все локации при инициализации:', allLocations);
            
            // Проверяем особые случаи
            const hasCurrentLocation = allLocations.some(loc => loc.type === 'current');
            const hasCities = allLocations.some(loc => loc.type === 'city');
            const hasRestoredLocation = allLocations.some(loc => loc.restored);
            
            console.log('Состояние:', {
                hasCurrentLocation,
                hasCities,
                hasRestoredLocation,
                totalLocations: allLocations.length
            });
            
            // Случай 1: Есть и текущая локация, и города
            if (hasCurrentLocation && hasCities) {
                console.log('Случай 1: Есть текущая локация и города');
                if (hasRestoredLocation) {
                    this.showRestoredLocationMessage(allLocations.find(loc => loc.restored));
                }
                await this.loadWeatherForLocations(allLocations);
            }
            // Случай 2: Только текущая локация (восстановленная или новая)
            else if (hasCurrentLocation && !hasCities) {
                console.log('Случай 2: Только текущая локация');
                if (hasRestoredLocation) {
                    this.showRestoredLocationMessage(allLocations[0]);
                }
                await this.loadWeatherForLocations(allLocations);
            }
            // Случай 3: Только города, нет текущей локации
            else if (!hasCurrentLocation && hasCities) {
                console.log('Случай 3: Только города, нет текущей локации');
                // Есть ли сохраненные координаты для восстановления?
                if (hasSavedCoordinates()) {
                    console.log('Есть сохраненные координаты, предлагаем восстановить');
                    this.showRestoreLocationPrompt();
                } else {
                    // Нет сохраненных координат, просим разрешить геолокацию
                    console.log('Нет сохраненных координат, запрашиваем геолокацию');
                    await this.requestGeolocation();
                }
            }
            // Случай 4: Ничего нет
            else {
                console.log('Случай 4: Нет ничего, запрашиваем геолокацию');
                await this.requestGeolocation();
            }
            
        } catch (error) {
            console.error('Ошибка инициализации:', error);
            this.ui.showError('Не удалось загрузить данные о погоде. ' + error.message, () => this.init());
        }
    }

    // Показываем предложение восстановить местоположение
    showRestoreLocationPrompt() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        
        modal.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 10px;
                max-width: 500px;
                width: 90%;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            ">
                <h2 style="margin-top: 0; color: #333;">
                    <i class="fas fa-history"></i> Восстановить местоположение?
                </h2>
                <p style="color: #666; margin-bottom: 25px; line-height: 1.5;">
                    У вас есть сохраненные координаты местоположения.<br>
                    Хотите использовать их для отображения погоды?
                </p>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button id="restoreBtn" style="
                        background: #3498db;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        flex: 1;
                    ">
                        <i class="fas fa-check"></i> Восстановить
                    </button>
                    <button id="newGeoBtn" style="
                        background: #2ecc71;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        flex: 1;
                    ">
                        <i class="fas fa-location-crosshairs"></i> Новое местоположение
                    </button>
                </div>
                <div style="margin-top: 20px;">
                    <button id="skipBtn" style="
                        background: none;
                        border: none;
                        color: #999;
                        cursor: pointer;
                        font-size: 14px;
                        text-decoration: underline;
                    ">
                        Продолжить без текущего местоположения
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Кнопка восстановления
        document.getElementById('restoreBtn').addEventListener('click', async () => {
            modal.remove();
            // Восстанавливаем текущую локацию
            tryRestoreCurrentLocation();
            // Загружаем погоду для всех локаций
            await this.refreshWeather();
        });
        
        // Кнопка нового местоположения
        document.getElementById('newGeoBtn').addEventListener('click', () => {
            modal.remove();
            this.requestGeolocation();
        });
        
        // Кнопка пропуска
        document.getElementById('skipBtn').addEventListener('click', async () => {
            modal.remove();
            // Загружаем только города
            const cities = getCitiesOnly();
            if (cities.length > 0) {
                await this.loadWeatherForLocations(cities);
            } else {
                this.ui.showError('Нет данных для отображения');
            }
        });
        
        // Закрытие по клику вне модального окна
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                // При закрытии загружаем только города
                this.loadCitiesOnly();
            }
        });
    }

    // Загрузка только городов
    async loadCitiesOnly() {
        const cities = getCitiesOnly();
        if (cities.length > 0) {
            await this.loadWeatherForLocations(cities);
        } else {
            this.ui.showError('Нет данных для отображения');
        }
    }

    // Показываем сообщение о восстановленной локации
    showRestoredLocationMessage(location) {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 10000;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            max-width: 300px;
            animation: slideIn 0.5s ease;
        `;
        
        message.innerHTML = `
            <strong><i class="fas fa-history"></i> Восстановлено</strong>
            <p style="margin: 5px 0; font-size: 0.9em;">
                Используются сохраненные координаты местоположения
            </p>
            <button id="rejectRestored" style="
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                color: white;
                padding: 5px 10px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 0.8em;
                margin-top: 5px;
            ">
                Запросить новое
            </button>
        `;
        
        document.body.appendChild(message);
        
        // Анимация
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        // Обработчик кнопки
        document.getElementById('rejectRestored').addEventListener('click', async () => {
            message.remove();
            clearCurrentLocation();
            // Если есть города, загружаем их, иначе запрашиваем геолокацию
            const cities = getCitiesOnly();
            if (cities.length > 0) {
                await this.loadWeatherForLocations(cities);
            } else {
                await this.requestGeolocation();
            }
        });
        
        // Автоматически скрываем
        setTimeout(() => {
            if (message.parentNode) {
                message.style.opacity = '0';
                message.style.transition = 'opacity 0.5s';
                setTimeout(() => {
                    if (message.parentNode) {
                        message.remove();
                    }
                }, 500);
            }
        }, 10000);
    }

    // Запрос геолокации
    async requestGeolocation() {
        if (!navigator.geolocation) {
            this.ui.showError('Геолокация не поддерживается вашим браузером');
            return;
        }
        
        console.log('Запрос геолокации...');
        
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 60000
                });
            });
            
            console.log('Геолокация получена:', position.coords);
            
            // Сохраняем текущую локацию
            setCurrentLocation({
                coords: {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                },
                timestamp: position.timestamp
            });
            
            // Загружаем погоду для всех локаций
            await this.refreshWeather();
            
        } catch (error) {
            console.error('Ошибка геолокации:', error);
            
            if (error.code === 1) {
                // Пользователь отказал в доступе
                const cities = getCitiesOnly();
                if (cities.length > 0) {
                    // Есть города - показываем их
                    await this.loadWeatherForLocations(cities);
                    this.ui.showError('Доступ к геолокации отклонен. Используются добавленные города.');
                } else {
                    // Нет городов - показываем форму добавления
                    this.ui.showError('Для работы приложения разрешите доступ к геолокации или добавьте город вручную');
                    setTimeout(() => {
                        this.ui.showAddCityModal();
                    }, 1000);
                }
            } else {
                this.ui.showError('Не удалось определить ваше местоположение: ' + error.message);
            }
        }
    }

    // Загрузка погоды для списка локаций
    async loadWeatherForLocations(locations) {
        if (this.isLoading) return;
        
        console.log('Загрузка погоды для локаций:', locations);
        this.isLoading = true;
        this.ui.showLoading();
        
        try {
            const weatherPromises = locations.map(async (location) => {
                console.log('Загрузка погоды для:', location.displayName || location.name);
                try {
                    let weatherData;
                    
                    if (location.type === 'current') {
                        weatherData = await getWeatherByGeolocation(location.coords);
                    } else {
                        weatherData = await getWeatherByCityName(location.name);
                    }
                    
                    return {
                        ...weatherData,
                        displayName: location.displayName || location.name,
                        originalName: location.originalName || location.displayName || location.name,
                        type: location.type,
                        restored: location.restored || false
                    };
                    
                } catch (error) {
                    console.error(`Ошибка загрузки погоды для ${location.displayName || location.name}:`, error);
                    
                    if (location.type === 'current') {
                        clearCurrentLocation();
                    }
                    
                    return null;
                }
            });
            
            const weatherResults = await Promise.all(weatherPromises);
            const validResults = weatherResults.filter(result => result !== null);
            
            if (validResults.length === 0) {
                throw new Error('Не удалось загрузить погоду ни для одной локации');
            }
            
            this.ui.displayWeatherCards(validResults);
            
        } catch (error) {
            console.error('Ошибка загрузки погоды:', error);
            this.ui.showError(error.message, () => this.refreshWeather());
            
        } finally {
            this.isLoading = false;
        }
    }

    // Обновление погоды
    async refreshWeather() {
        console.log('Обновление погоды...');
        const locations = getAllLocations();
        
        if (locations.length === 0) {
            await this.requestGeolocation();
        } else {
            await this.loadWeatherForLocations(locations);
        }
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, запускаем приложение...');
    
    // Отладочные функции
    window.debugWeatherApp = function() {
        console.log('=== ДЕБАГ ПРИЛОЖЕНИЯ ===');
        debugStorage();
        console.log('=== КОНЕЦ ДЕБАГА ===');
    };
    
    // Тестовая функция для симуляции восстановления
    window.testRestoration = function() {
        console.log('=== ТЕСТ ВОССТАНОВЛЕНИЯ ===');
        
        // Сохраняем тестовые координаты
        localStorage.setItem('weather_app_coords', JSON.stringify({
            latitude: 55.7558,
            longitude: 37.6173,
            savedAt: new Date().toISOString()
        }));
        
        // Добавляем тестовый город
        const data = {
            currentLocation: null,
            cities: [{
                displayName: 'Париж',
                apiName: 'Paris',
                addedAt: new Date().toISOString()
            }],
            lastUpdate: null
        };
        localStorage.setItem('weather_app_data', JSON.stringify(data));
        
        console.log('Тестовые данные сохранены. Перезагрузите страницу.');
        alert('Тестовые данные сохранены. Перезагрузите страницу для проверки восстановления.');
    };
    
    new WeatherApp();
});
