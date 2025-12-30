class UI {
    constructor() {
        this.elements = {
            loading: document.getElementById('loading'),
            error: document.getElementById('error'),
            errorMessage: document.getElementById('errorMessage'),
            weatherContainer: document.getElementById('weatherContainer'),
            weatherScrollLayout: document.getElementById('weatherScrollLayout'),
            currentLocationSection: document.getElementById('currentLocationSection'),
            currentLocationCard: document.getElementById('currentLocationCard'),
            additionalCitiesSection: document.getElementById('additionalCitiesSection'),
            additionalCitiesWrapper: document.getElementById('additionalCitiesWrapper'),
            scrollIndicator: document.getElementById('scrollIndicator'),
            scrollLeftBtn: document.getElementById('scrollLeftBtn'),
            scrollRightBtn: document.getElementById('scrollRightBtn'),
            addCityModal: document.getElementById('addCityModal'),
            cityInput: document.getElementById('cityInput'),
            cityDropdown: document.getElementById('cityDropdown'),
            cityError: document.getElementById('cityError'),
            addCityBtn: document.getElementById('addCityBtn'),
            closeModalBtn: document.getElementById('closeModalBtn'),
            cancelBtn: document.getElementById('cancelBtn'),
            saveCityBtn: document.getElementById('saveCityBtn'),
            refreshBtn: document.getElementById('refreshBtn'),
            retryBtn: document.getElementById('retryBtn'),
            mainContent: document.getElementById('mainContent')
        };

        this.initEventListeners();
        this.initScrollListeners();
    }

    initEventListeners() {
        // Открытие модального окна
        this.elements.addCityBtn.addEventListener('click', () => this.showAddCityModal());
        
        // Закрытие модального окна
        this.elements.closeModalBtn.addEventListener('click', () => this.hideAddCityModal());
        this.elements.cancelBtn.addEventListener('click', () => this.hideAddCityModal());
        
        // Клик вне модального окна
        this.elements.addCityModal.addEventListener('click', (e) => {
            if (e.target === this.elements.addCityModal) {
                this.hideAddCityModal();
            }
        });
        
        // Ввод в поле города
        this.elements.cityInput.addEventListener('input', (e) => this.handleCityInput(e.target.value));
        
        // Сохранение города
        this.elements.saveCityBtn.addEventListener('click', () => this.handleSaveCity());
        
        // Нажатие Enter в поле ввода
        this.elements.cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSaveCity();
            }
        });
        
        // Повторная попытка при ошибке
        this.elements.retryBtn.addEventListener('click', () => {
            if (typeof this.retryCallback === 'function') {
                this.retryCallback();
            }
        });
    }

    initScrollListeners() {
        // Кнопки скролла
        if (this.elements.scrollLeftBtn) {
            this.elements.scrollLeftBtn.addEventListener('click', () => {
                this.scrollCities(-400);
            });
        }
        
        if (this.elements.scrollRightBtn) {
            this.elements.scrollRightBtn.addEventListener('click', () => {
                this.scrollCities(400);
            });
        }
        
        // Скрытие кнопок скролла при достижении границ
        if (this.elements.additionalCitiesWrapper) {
            this.elements.additionalCitiesWrapper.addEventListener('scroll', () => {
                this.updateScrollButtons();
            });
        }
        
        // Обновление видимости кнопок при изменении размера окна
        window.addEventListener('resize', () => {
            setTimeout(() => this.updateScrollButtons(), 100);
        });
    }

    scrollCities(amount) {
        if (this.elements.additionalCitiesWrapper) {
            this.elements.additionalCitiesWrapper.scrollBy({
                left: amount,
                behavior: 'smooth'
            });
        }
    }

    updateScrollButtons() {
        const wrapper = this.elements.additionalCitiesWrapper;
        if (!wrapper) return;
        
        const scrollLeft = wrapper.scrollLeft;
        const scrollWidth = wrapper.scrollWidth;
        const clientWidth = wrapper.clientWidth;
        
        // Показываем/скрываем кнопки в зависимости от положения скролла
        if (this.elements.scrollLeftBtn) {
            this.elements.scrollLeftBtn.classList.toggle('hidden', scrollLeft === 0);
        }
        
        if (this.elements.scrollRightBtn) {
            this.elements.scrollRightBtn.classList.toggle('hidden', scrollLeft + clientWidth >= scrollWidth - 10);
        }
    }

    // Показать состояние загрузки
    showLoading() {
        this.elements.loading.classList.remove('hidden');
        this.elements.error.classList.add('hidden');
        this.elements.weatherContainer.classList.add('hidden');
        this.elements.weatherScrollLayout.classList.add('hidden');
    }

    // Скрыть состояние загрузки
    hideLoading() {
        this.elements.loading.classList.add('hidden');
    }

    // Показать ошибку
    showError(message, retryCallback = null) {
        this.elements.errorMessage.textContent = message;
        this.elements.error.classList.remove('hidden');
        this.elements.loading.classList.add('hidden');
        this.elements.weatherContainer.classList.add('hidden');
        this.elements.weatherScrollLayout.classList.add('hidden');
        
        this.retryCallback = retryCallback;
    }

    // Скрыть ошибку
    hideError() {
        this.elements.error.classList.add('hidden');
    }

    // Отображение карточек погоды
    displayWeatherCards(weatherDataList) {
        console.log('Отображение карточек погоды:', weatherDataList);
        
        // Разделяем локации на текущую и дополнительные города
        const currentLocation = weatherDataList.find(loc => loc.type === 'current');
        const additionalCities = weatherDataList.filter(loc => loc.type !== 'current');
        
        console.log('Текущая локация:', currentLocation);
        console.log('Дополнительные города:', additionalCities);
        
        // Если есть и текущая локация, и дополнительные города - используем скролл
        if (currentLocation && additionalCities.length > 0) {
            this.displayWithScroll(currentLocation, additionalCities);
        } else {
            // Иначе используем обычную сетку
            this.displayInGrid(weatherDataList);
        }
    }

    // Отображение в обычной сетке
    displayInGrid(weatherDataList) {
        this.elements.weatherContainer.innerHTML = '';
        this.elements.weatherScrollLayout.classList.add('hidden');
        this.elements.weatherContainer.classList.remove('hidden');
        
        weatherDataList.forEach((weatherData) => {
            const card = this.createCityCard(weatherData, weatherData.type === 'current');
            this.elements.weatherContainer.appendChild(card);
        });
        
        this.showWeather();
    }

    // Отображение со скроллом
    displayWithScroll(currentLocation, additionalCities) {
        console.log('Отображение со скроллом');
        
        // Очищаем контейнеры
        this.elements.currentLocationCard.innerHTML = '';
        this.elements.additionalCitiesWrapper.innerHTML = '';
        
        // Скрываем обычный контейнер, показываем скролл-контейнер
        this.elements.weatherContainer.classList.add('hidden');
        this.elements.weatherScrollLayout.classList.remove('hidden');
        
        // Отображаем текущую локацию
        if (currentLocation) {
            this.createCurrentLocationCard(currentLocation);
            this.elements.currentLocationSection.classList.remove('hidden');
        } else {
            this.elements.currentLocationSection.classList.add('hidden');
        }
        
        // Отображаем дополнительные города
        if (additionalCities.length > 0) {
            additionalCities.forEach(city => {
                const cityCard = this.createCityCard(city, false);
                this.elements.additionalCitiesWrapper.appendChild(cityCard);
            });
            
            this.elements.additionalCitiesSection.classList.remove('hidden');
            
            // Показываем индикатор скролла, если городов больше 3
            if (additionalCities.length > 3) {
                this.elements.scrollIndicator.classList.remove('hidden');
            } else {
                this.elements.scrollIndicator.classList.add('hidden');
            }
            
            // Обновляем кнопки скролла
            setTimeout(() => this.updateScrollButtons(), 100);
        } else {
            this.elements.additionalCitiesSection.classList.add('hidden');
        }
        
        this.showWeather();
    }

        // Создание карточки текущего местоположения
    createCurrentLocationCard(weatherData) {
        const container = this.elements.currentLocationCard;
    
        // Создаем заголовок
        const header = document.createElement('div');
        header.className = 'current-location-header';
    
        const title = document.createElement('h3');
        title.textContent = weatherData.displayName || weatherData.city;
    
        // Добавляем значок восстановления если нужно
        if (weatherData.restored) {
            const restoredIcon = document.createElement('span');
            restoredIcon.innerHTML = ' <i class="fas fa-history" title="Восстановлено из сохраненных данных"></i>';
            restoredIcon.style.color = '#4CAF50';
            restoredIcon.style.fontSize = '0.8em';
            title.appendChild(restoredIcon);
        }
    
        if (weatherData.country) {
            const countrySpan = document.createElement('span');
            countrySpan.className = 'country';
            countrySpan.textContent = ` (${weatherData.country})`;
            countrySpan.style.fontSize = '0.9em';
            countrySpan.style.color = '#666';
            title.appendChild(countrySpan);
        }
    
        header.appendChild(title);
        container.appendChild(header);
        
        // Создаем контейнер для дней
        const daysContainer = document.createElement('div');
        daysContainer.className = 'current-location-days-grid';
        
        // Добавляем прогноз на каждый день
        if (weatherData.forecasts && weatherData.forecasts.length > 0) {
            weatherData.forecasts.forEach((forecast, dayIndex) => {
                const dayCard = this.createCurrentLocationDayCard(forecast, dayIndex === 0);
                daysContainer.appendChild(dayCard);
            });
        } else {
            const noData = document.createElement('p');
            noData.textContent = 'Нет данных о погоде';
            noData.style.textAlign = 'center';
            noData.style.color = '#999';
            noData.style.padding = '40px';
            container.appendChild(noData);
        }
        
        container.appendChild(daysContainer);
    }

    // Создание карточки дня для текущего местоположения
    createCurrentLocationDayCard(forecast, isToday = false) {
        const dayCard = document.createElement('div');
        dayCard.className = `day-card ${isToday ? 'current-day' : ''}`;
        
        // Заголовок дня
        const header = document.createElement('div');
        header.className = 'day-header';
        
        const date = document.createElement('h4');
        date.textContent = isToday ? 'Сегодня' : forecast.date;
        
        const icon = document.createElement('img');
        icon.className = 'weather-icon';
        icon.src = getWeatherIconUrl(forecast.icon);
        icon.alt = forecast.description;
        
        header.appendChild(date);
        header.appendChild(icon);
        dayCard.appendChild(header);
        
        // Детали погоды
        const details = document.createElement('div');
        details.className = 'weather-details-grid';
        
        const detailsHtml = `
            <div class="detail-item">
                <span>Макс. температура:</span>
                <span class="temp">${Math.round(forecast.temp_max)}°C</span>
            </div>
            <div class="detail-item">
                <span>Мин. температура:</span>
                <span class="temp">${Math.round(forecast.temp_min)}°C</span>
            </div>
            <div class="detail-item">
                <span>Погода:</span>
                <span>${forecast.description}</span>
            </div>
            <div class="detail-item">
                <span>Влажность:</span>
                <span>${forecast.humidity}%</span>
            </div>
            <div class="detail-item">
                <span>Давление:</span>
                <span>${Math.round(forecast.pressure * 0.750064)} мм рт.ст.</span>
            </div>
            <div class="detail-item">
                <span>Ветер:</span>
                <span>${forecast.wind_speed} м/с</span>
            </div>
        `;
        
        details.innerHTML = detailsHtml;
        dayCard.appendChild(details);
        
        return dayCard;
    }

    // Создание карточки города
    createCityCard(weatherData, isCurrentLocation = false) {
        const card = document.createElement('div');
        card.className = 'city-card';
        
        const header = document.createElement('div');
        header.className = 'city-header';
        
        const title = document.createElement('h3');
        title.textContent = weatherData.displayName || weatherData.city;
        if (weatherData.country) {
            const countrySpan = document.createElement('span');
            countrySpan.className = 'country';
            countrySpan.textContent = ` (${weatherData.country})`;
            countrySpan.style.fontSize = '0.9em';
            countrySpan.style.color = '#666';
            title.appendChild(countrySpan);
        }
        
        header.appendChild(title);
        
        // Кнопка удаления для добавленных городов
        if (!isCurrentLocation) {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-city';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.title = 'Удалить город';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                // Передаем originalName для удаления, если он есть, иначе displayName
                const cityToRemove = weatherData.originalName || weatherData.city || weatherData.displayName;
                console.log('Кликнули удалить город:', cityToRemove);
                this.handleRemoveCity(cityToRemove);
            });
            header.appendChild(removeBtn);
        }
        
        card.appendChild(header);
        
        // Добавляем прогноз на каждый день
        if (weatherData.forecasts && weatherData.forecasts.length > 0) {
            weatherData.forecasts.forEach((forecast, dayIndex) => {
                const dayCard = this.createCityDayCard(forecast, dayIndex === 0);
                card.appendChild(dayCard);
            });
        } else {
            const noData = document.createElement('p');
            noData.textContent = 'Нет данных о погоде';
            noData.style.textAlign = 'center';
            noData.style.color = '#999';
            noData.style.padding = '20px';
            card.appendChild(noData);
        }
        
        return card;
    }

    // Создание карточки дня для города
    createCityDayCard(forecast, isToday = false) {
        const dayCard = document.createElement('div');
        dayCard.className = `city-day-card ${isToday ? 'current-day' : ''}`;
        
        const header = document.createElement('div');
        header.className = 'city-day-header';
        
        const date = document.createElement('h4');
        date.textContent = isToday ? 'Сегодня' : forecast.date;
        
        const icon = document.createElement('img');
        icon.className = 'weather-icon';
        icon.src = getWeatherIconUrl(forecast.icon);
        icon.alt = forecast.description;
        icon.style.width = '40px';
        icon.style.height = '40px';
        
        header.appendChild(date);
        header.appendChild(icon);
        dayCard.appendChild(header);
        
        // Детали погоды
        const details = document.createElement('div');
        details.className = 'city-weather-details';
        
        const detailsHtml = `
            <div class="detail">
                <span>Температура:</span>
                <span class="temp">${Math.round(forecast.temp_max)}°C / ${Math.round(forecast.temp_min)}°C</span>
            </div>
            <div class="detail">
                <span>Погода:</span>
                <span>${forecast.description}</span>
            </div>
            <div class="detail">
                <span>Влажность:</span>
                <span>${forecast.humidity}%</span>
            </div>
            <div class="detail">
                <span>Давление:</span>
                <span>${Math.round(forecast.pressure * 0.750064)} мм рт.ст.</span>
            </div>
            <div class="detail">
                <span>Ветер:</span>
                <span>${forecast.wind_speed} м/с</span>
            </div>
            <div class="detail">
                <span>Осадки:</span>
                <span>${Math.round(forecast.precipitation)}%</span>
            </div>
        `;
        
        details.innerHTML = detailsHtml;
        dayCard.appendChild(details);
        
        return dayCard;
    }

    // Показать контейнер с погодой
    showWeather() {
        this.elements.loading.classList.add('hidden');
        this.elements.error.classList.add('hidden');
    }

    // Показать модальное окно добавления города
    showAddCityModal() {
        this.elements.addCityModal.classList.remove('hidden');
        this.elements.cityInput.value = '';
        this.elements.cityError.classList.add('hidden');
        this.elements.cityInput.focus();
    }

    // Скрыть модальное окно добавления города
    hideAddCityModal() {
        this.elements.addCityModal.classList.add('hidden');
        this.elements.cityDropdown.classList.add('hidden');
        this.elements.cityError.classList.add('hidden');
    }

    // Обработка ввода города
    handleCityInput(value) {
        if (value.length < 2) {
            this.elements.cityDropdown.classList.add('hidden');
            return;
        }
        
        const results = searchCities(value);
        
        if (results.length > 0) {
            this.showCityDropdown(results);
        } else {
            this.elements.cityDropdown.classList.add('hidden');
        }
    }

    // Показать выпадающий список городов
    showCityDropdown(cities) {
        this.elements.cityDropdown.innerHTML = '';
        
        cities.forEach(city => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.textContent = city;
            item.addEventListener('click', () => {
                this.elements.cityInput.value = city;
                this.elements.cityDropdown.classList.add('hidden');
            });
            this.elements.cityDropdown.appendChild(item);
        });
        
        this.elements.cityDropdown.classList.remove('hidden');
    }

    // Обработка сохранения города
    async handleSaveCity() {
        const cityName = this.elements.cityInput.value.trim();
        
        if (!cityName) {
            this.showCityError('Введите название города');
            return;
        }
        
        if (!isValidCity(cityName)) {
            this.showCityError('Город не найден. Выберите город из списка');
            return;
        }
        
        // Проверяем, не добавлен ли уже город - ОБНОВЛЕННАЯ ПРОВЕРКА
        const locations = getAllLocations();
        console.log('Проверка существования города:', cityName);
        console.log('Текущие локации:', locations);
        
        const cityExists = locations.some(location => 
            location.name && location.name.toLowerCase().trim() === cityName.toLowerCase().trim()
        );
        
        if (cityExists) {
            this.showCityError('Этот город уже добавлен');
            return;
        }
        
        // Пытаемся добавить город
        try {
            this.showCityError('');
            this.elements.saveCityBtn.disabled = true;
            
            // Проверяем, существует ли город в API
            const coords = await getCityCoordinates(cityName);
            console.log('Координаты города получены:', coords);
            
            // Добавляем город в хранилище
            const added = addCity(cityName);
            console.log('Результат добавления города:', added);
            
            if (added) {
                this.hideAddCityModal();
                
                // Запускаем обновление данных
                if (typeof this.onCityAdded === 'function') {
                    console.log('Вызываем колбэк onCityAdded');
                    this.onCityAdded();
                } else {
                    console.error('Колбэк onCityAdded не установлен!');
                    // Перезагружаем страницу если колбэк не работает
                    location.reload();
                }
            } else {
                this.showCityError('Не удалось добавить город');
            }
            
        } catch (error) {
            console.error('Ошибка при добавлении города:', error);
            this.showCityError('Ошибка при добавлении города: ' + error.message);
        } finally {
            this.elements.saveCityBtn.disabled = false;
        }
    }

    // Обработка удаления города - ОБНОВЛЕННАЯ ВЕРСИЯ
    handleRemoveCity(cityName) {
        console.log('=== НАЧАЛО УДАЛЕНИЯ ГОРОДА ===');
        console.log('Получено название города для удаления:', cityName);
        console.log('Тип cityName:', typeof cityName);
        
        // Проверяем что cityName не undefined
        if (!cityName) {
            console.error('Ошибка: cityName is undefined!');
            alert('Ошибка: не удалось определить город для удаления');
            return;
        }
        
        const cityNameStr = String(cityName).trim();
        console.log('Обработанное название города:', cityNameStr);
        
        if (confirm(`Удалить город "${cityNameStr}" из списка?`)) {
            console.log('Пользователь подтвердил удаление');
            
            // Удаляем город из хранилища
            const success = removeCity(cityNameStr);
            console.log('Результат удаления из хранилища:', success);
            
            if (success) {
                console.log('Город успешно удален из хранилища');
                // Немедленно обновляем интерфейс
                this.immediateRefresh();
            } else {
                console.error('Не удалось удалить город из хранилища');
                alert('Не удалось удалить город. Возможно он уже был удален.');
            }
        } else {
            console.log('Пользователь отменил удаление');
        }
        
        console.log('=== КОНЕЦ УДАЛЕНИЯ ГОРОДА ===');
    }

    // Немедленное обновление интерфейса после удаления
    immediateRefresh() {
        console.log('Немедленное обновление интерфейса');
        
        // Получаем актуальные данные
        const locations = getAllLocations();
        console.log('Актуальные локации после удаления:', locations);
        
        if (locations.length === 0) {
            // Если нет городов, показываем сообщение
            this.elements.weatherScrollLayout.classList.add('hidden');
            this.elements.weatherContainer.classList.remove('hidden');
            this.elements.weatherContainer.innerHTML = 
                '<p style="text-align: center; padding: 50px;">Нет добавленных городов. Добавьте город для отображения погоды.</p>';
        } else if (typeof this.onCityRemoved === 'function') {
            // Используем колбэк для полного обновления
            console.log('Вызываем колбэк onCityRemoved для обновления данных');
            this.onCityRemoved();
        } else {
            // Перезагружаем страницу как запасной вариант
            console.log('Колбэк не установлен, перезагружаем страницу');
            location.reload();
        }
    }

    // Показать ошибку в форме
    showCityError(message) {
        this.elements.cityError.textContent = message;
        
        if (message) {
            this.elements.cityError.classList.remove('hidden');
        } else {
            this.elements.cityError.classList.add('hidden');
        }
    }

    // Установить колбэк для обновления данных
    setRefreshCallback(callback) {
        this.elements.refreshBtn.addEventListener('click', callback);
    }

    // Установить колбэк при добавлении города
    setCityAddedCallback(callback) {
        this.onCityAdded = callback;
    }

    // Установить колбэк при удалении города
    setCityRemovedCallback(callback) {
        this.onCityRemoved = callback;
    }
}