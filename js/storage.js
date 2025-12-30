const STORAGE_KEY = 'weather_app_data';
const COORDS_KEY = 'weather_app_coords';

// Сохранение данных приложения
function saveAppData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Ошибка при сохранении данных:', error);
        return false;
    }
}

// Сохранение координат отдельно
function saveCoordinates(coords) {
    try {
        localStorage.setItem(COORDS_KEY, JSON.stringify({
            latitude: coords.latitude,
            longitude: coords.longitude,
            savedAt: new Date().toISOString()
        }));
        console.log('Координаты сохранены:', coords);
        return true;
    } catch (error) {
        console.error('Ошибка при сохранении координат:', error);
        return false;
    }
}

// Загрузка сохраненных координат
function loadCoordinates() {
    try {
        const data = localStorage.getItem(COORDS_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            // Проверяем, что координаты были сохранены не слишком давно
            const savedAt = new Date(parsed.savedAt);
            const now = new Date();
            const daysDiff = (now - savedAt) / (1000 * 60 * 60 * 24);
            
            if (daysDiff < 7) {
                console.log('Восстановлены координаты из кэша:', parsed);
                return {
                    latitude: parsed.latitude,
                    longitude: parsed.longitude
                };
            }
        }
    } catch (error) {
        console.error('Ошибка при загрузке координат:', error);
    }
    return null;
}

// Загрузка данных приложения
function loadAppData() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            // Обеспечиваем обратную совместимость
            if (parsed.cities && Array.isArray(parsed.cities) && parsed.cities.length > 0) {
                if (typeof parsed.cities[0] === 'string') {
                    parsed.cities = parsed.cities.map(city => ({
                        displayName: city,
                        apiName: city,
                        addedAt: new Date().toISOString()
                    }));
                    console.log('Преобразованы старые данные городов в новый формат');
                }
            }
            return parsed;
        }
        return {
            currentLocation: null,
            cities: [],
            lastUpdate: null
        };
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        return {
            currentLocation: null,
            cities: [],
            lastUpdate: null
        };
    }
}

// Добавление города
function addCity(cityName, apiName = null) {
    console.log('Добавление города:', {cityName, apiName});
    
    const data = loadAppData();
    
    // Создаем объект города
    const cityObj = {
        displayName: cityName.trim(),
        apiName: (apiName || cityName).trim(),
        addedAt: new Date().toISOString()
    };
    
    // Проверяем, не добавлен ли уже город
    const cityExists = data.cities.some(city => {
        const displayMatch = city.displayName && 
            city.displayName.toLowerCase().trim() === cityName.toLowerCase().trim();
        const apiMatch = city.apiName && 
            city.apiName.toLowerCase().trim() === (apiName || cityName).toLowerCase().trim();
        return displayMatch || apiMatch;
    });
    
    if (!cityExists) {
        data.cities.push(cityObj);
        return saveAppData(data);
    }
    
    return false;
}

// Удаление города
function removeCity(cityName) {
    console.log('Попытка удалить город:', cityName);
    
    const data = loadAppData();
    
    const cityNameNormalized = cityName.toLowerCase().trim();
    
    const index = data.cities.findIndex(city => 
        (city.displayName && city.displayName.toLowerCase().trim() === cityNameNormalized) ||
        (city.apiName && city.apiName.toLowerCase().trim() === cityNameNormalized)
    );
    
    if (index !== -1) {
        data.cities.splice(index, 1);
        return saveAppData(data);
    }
    
    return false;
}

// Установка текущей локации
function setCurrentLocation(locationData) {
    const data = loadAppData();
    data.currentLocation = {
        coords: {
            latitude: locationData.coords.latitude,
            longitude: locationData.coords.longitude
        },
        timestamp: locationData.timestamp,
        savedAt: new Date().toISOString()
    };
    data.lastUpdate = new Date().toISOString();
    
    // Сохраняем координаты отдельно
    saveCoordinates(locationData.coords);
    
    return saveAppData(data);
}

// Восстановление текущей локации (только если ее нет)
function tryRestoreCurrentLocation() {
    const data = loadAppData();
    
    // Если уже есть текущая локация - ничего не делаем
    if (data.currentLocation) {
        console.log('Текущая локация уже существует, восстановление не требуется');
        return false;
    }
    
    // Пробуем загрузить сохраненные координаты
    const savedCoords = loadCoordinates();
    if (savedCoords) {
        data.currentLocation = {
            coords: savedCoords,
            timestamp: Date.now(),
            savedAt: new Date().toISOString(),
            restored: true
        };
        data.lastUpdate = new Date().toISOString();
        const saved = saveAppData(data);
        console.log('Текущая локация восстановлена из сохраненных координат:', saved);
        return saved;
    }
    
    return false;
}

// Очистка текущей локации
function clearCurrentLocation() {
    const data = loadAppData();
    data.currentLocation = null;
    return saveAppData(data);
}

// Получение списка всех локаций (текущая + города)
function getAllLocations() {
    const data = loadAppData();
    const locations = [];
    
    // Пытаемся восстановить текущую локацию если ее нет
    if (!data.currentLocation) {
        tryRestoreCurrentLocation();
        // Перезагружаем данные после возможного восстановления
        return getAllLocations();
    }
    
    // Добавляем текущую локацию если она есть
    if (data.currentLocation && data.currentLocation.coords) {
        locations.push({
            name: 'Текущее местоположение',
            type: 'current',
            coords: data.currentLocation.coords,
            displayName: 'Текущее местоположение',
            restored: data.currentLocation.restored || false
        });
    }
    
    // Добавляем все города
    data.cities.forEach(city => {
        locations.push({
            name: city.apiName || city.displayName,
            displayName: city.displayName,
            originalName: city.displayName,
            type: 'city'
        });
    });
    
    return locations;
}

// Получение только городов (без текущей локации)
function getCitiesOnly() {
    const data = loadAppData();
    const cities = [];
    
    data.cities.forEach(city => {
        cities.push({
            name: city.apiName || city.displayName,
            displayName: city.displayName,
            originalName: city.displayName,
            type: 'city'
        });
    });
    
    return cities;
}

// Проверка, есть ли сохраненные координаты
function hasSavedCoordinates() {
    return loadCoordinates() !== null;
}

// Получение отладочной информации
function debugStorage() {
    const data = loadAppData();
    const coords = loadCoordinates();
    console.log('=== DEBUG STORAGE ===');
    console.log('Все данные:', data);
    console.log('Сохраненные координаты:', coords);
    console.log('Городы:', data.cities);
    console.log('Количество городов:', data.cities.length);
    console.log('=== END DEBUG ===');
    return { data, coords };
}

// Функция для миграции старых данных
function migrateOldData() {
    const data = loadAppData();
    let migrated = false;
    
    if (data.cities && Array.isArray(data.cities) && data.cities.length > 0) {
        if (typeof data.cities[0] === 'string') {
            data.cities = data.cities.map(city => ({
                displayName: city,
                apiName: city,
                addedAt: new Date().toISOString()
            }));
            migrated = true;
            saveAppData(data);
            console.log('Данные мигрированы в новый формат');
        }
    }
    
    return migrated;
}

migrateOldData();