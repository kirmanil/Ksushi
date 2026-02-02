class Database {
    constructor() {
        // Конфигурация JSONbin
        this.JSONBIN_BIN_ID = '697f2cebae596e708f08e3b7';
        this.JSONBIN_API_KEY = '$2a$10$8Pu9gRH62M9oksa/VtIqGO4sEgigoXfK0LV.R8NGJiYTdYJ7Vgre6';
        this.JSONBIN_URL = `https://api.jsonbin.io/v3/b/${this.JSONBIN_BIN_ID}`;
        this.JSONBIN_LATEST = `https://api.jsonbin.io/v3/b/${this.JSONBIN_BIN_ID}/latest`;
        
        // Кэш данных
        this.cache = {
            products: [],
            promocodes: [],
            employees: {},
            users: [],
            orders: [],
            restaurant_info: {},
            banners: [],
            settings: {},
            deliveryProblems: [],
            lastSync: null,
            version: '1.0'
        };
        
        // Флаг синхронизации
        this.isSyncing = false;
        this.syncQueue = [];
        
        console.log('Database: Инициализирована облачная база данных');
    }

    // ========== БАЗОВЫЕ МЕТОДЫ JSONBIN ==========

    // Получение заголовков для запросов
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'X-Master-Key': this.JSONBIN_API_KEY,
            'X-Bin-Meta': false
        };
    }

    // Загрузка всей базы данных из облака
    async loadDatabase() {
        try {
            console.log('Database: Загрузка данных из JSONbin...');
            
            const response = await fetch(this.JSONBIN_LATEST, {
                headers: this.getHeaders(),
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Обрабатываем разные форматы ответа JSONbin
            let parsedData;
            if (data.record) {
                // Формат v3
                parsedData = data.record;
            } else if (data.data) {
                // Другой возможный формат
                parsedData = data.data;
            } else {
                // Прямые данные
                parsedData = data;
            }

            // Обновляем кэш
            this.cache.products = parsedData.products || [];
            this.cache.promocodes = parsedData.promocodes || [];
            this.cache.employees = parsedData.employees || {};
            this.cache.users = parsedData.users || [];
            this.cache.orders = parsedData.orders || [];
            this.cache.restaurant_info = parsedData.restaurant_info || {};
            this.cache.banners = parsedData.banners || [];
            this.cache.settings = parsedData.settings || {};
            this.cache.deliveryProblems = parsedData.deliveryProblems || [];
            this.cache.lastSync = new Date();
            this.cache.version = parsedData.version || '1.0';

            console.log('Database: Данные успешно загружены из облака');
            console.log(`- Пользователей: ${this.cache.users.length}`);
            console.log(`- Заказов: ${this.cache.orders.length}`);
            console.log(`- Продуктов: ${this.cache.products.length}`);
            
            // Синхронизируем с localStorage
            await this.syncWithLocalStorage();
            
            return this.cache;
        } catch (error) {
            console.error('Database: Ошибка загрузки из облака:', error);
            
            // Пробуем загрузить из localStorage как резерв
            return await this.loadFromLocalStorage();
        }
    }

    // Сохранение всей базы данных в облако
    async saveDatabase(customData = null) {
        try {
            console.log('Database: Сохранение данных в облако...');
            
            const dataToSave = customData || {
                products: this.cache.products,
                promocodes: this.cache.promocodes,
                employees: this.cache.employees,
                users: this.cache.users,
                orders: this.cache.orders,
                restaurant_info: this.cache.restaurant_info,
                banners: this.cache.banners,
                settings: this.cache.settings,
                deliveryProblems: this.cache.deliveryProblems,
                version: '1.0',
                lastUpdated: new Date().toISOString()
            };

            const response = await fetch(this.JSONBIN_URL, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(dataToSave)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Database: Данные успешно сохранены в облако');
            console.log('Database: Metadata:', result.metadata);
            
            // Обновляем время последней синхронизации
            this.cache.lastSync = new Date();
            
            return true;
        } catch (error) {
            console.error('Database: Ошибка сохранения в облако:', error);
            
            // Сохраняем в localStorage как резерв
            await this.saveToLocalStorage();
            return false;
        }
    }

    // Загрузка из localStorage (резерв)
    async loadFromLocalStorage() {
        try {
            console.log('Database: Загрузка из localStorage (резерв)...');
            
            // Продукты
            if (window.products) {
                this.cache.products = window.products;
            } else {
                const products = JSON.parse(localStorage.getItem('ksushi_products') || '[]');
                this.cache.products = products;
            }
            
            // Промокоды
            if (window.promoCodes) {
                this.cache.promocodes = window.promoCodes;
            } else {
                const promocodes = JSON.parse(localStorage.getItem('ksushi_promocodes') || '[]');
                this.cache.promocodes = promocodes;
            }
            
            // Пользователи
            const users = JSON.parse(localStorage.getItem('ksushi_users') || '[]');
            this.cache.users = users;
            
            // Заказы
            const orders = JSON.parse(localStorage.getItem('ksushi_orders') || '[]');
            this.cache.orders = orders;
            
            // Сотрудники
            const employees = JSON.parse(localStorage.getItem('ksushi_employees') || '{}');
            this.cache.employees = employees;
            
            // Настройки ресторана
            const restaurantInfo = JSON.parse(localStorage.getItem('ksushi_restaurant_info') || '{}');
            this.cache.restaurant_info = restaurantInfo;
            
            // Баннеры
            const banners = JSON.parse(localStorage.getItem('ksushi_banners') || '[]');
            this.cache.banners = banners;
            
            // Настройки
            const settings = JSON.parse(localStorage.getItem('ksushi_settings') || '{}');
            this.cache.settings = settings;
            
            // Проблемы с доставкой
            const deliveryProblems = JSON.parse(localStorage.getItem('ksushi_delivery_problems') || '[]');
            this.cache.deliveryProblems = deliveryProblems;
            
            this.cache.lastSync = new Date();
            
            console.log('Database: Данные загружены из localStorage');
            console.log(`- Пользователей: ${this.cache.users.length}`);
            console.log(`- Заказов: ${this.cache.orders.length}`);
            
            return this.cache;
        } catch (error) {
            console.error('Database: Ошибка загрузки из localStorage:', error);
            
            // Возвращаем пустой кэш
            this.cache.lastSync = new Date();
            return this.cache;
        }
    }

    // Сохранение в localStorage (резерв)
    async saveToLocalStorage() {
        try {
            console.log('Database: Сохранение в localStorage (резерв)...');
            
            localStorage.setItem('ksushi_products', JSON.stringify(this.cache.products));
            localStorage.setItem('ksushi_promocodes', JSON.stringify(this.cache.promocodes));
            localStorage.setItem('ksushi_users', JSON.stringify(this.cache.users));
            localStorage.setItem('ksushi_orders', JSON.stringify(this.cache.orders));
            localStorage.setItem('ksushi_employees', JSON.stringify(this.cache.employees));
            localStorage.setItem('ksushi_restaurant_info', JSON.stringify(this.cache.restaurant_info));
            localStorage.setItem('ksushi_banners', JSON.stringify(this.cache.banners));
            localStorage.setItem('ksushi_settings', JSON.stringify(this.cache.settings));
            localStorage.setItem('ksushi_delivery_problems', JSON.stringify(this.cache.deliveryProblems));
            
            console.log('Database: Данные сохранены в localStorage');
            return true;
        } catch (error) {
            console.error('Database: Ошибка сохранения в localStorage:', error);
            return false;
        }
    }

    // Синхронизация с localStorage
    async syncWithLocalStorage() {
        try {
            console.log('Database: Синхронизация с localStorage...');
            
            // Заказы из localStorage (объединяем)
            const localOrders = JSON.parse(localStorage.getItem('ksushi_orders') || '[]');
            if (localOrders.length > 0) {
                // Объединяем заказы, отдавая приоритет облачным данным
                const cloudOrderIds = new Set(this.cache.orders.map(o => o.id));
                const newOrders = localOrders.filter(order => !cloudOrderIds.has(order.id));
                
                if (newOrders.length > 0) {
                    this.cache.orders = [...this.cache.orders, ...newOrders];
                    console.log(`Database: Добавлено ${newOrders.length} заказов из localStorage`);
                }
            }
            
            // Пользователи из localStorage (объединяем)
            const localUsers = JSON.parse(localStorage.getItem('ksushi_users') || '[]');
            if (localUsers.length > 0) {
                const cloudUserPhones = new Set(this.cache.users.map(u => u.phone));
                const newUsers = localUsers.filter(user => !cloudUserPhones.has(user.phone));
                
                if (newUsers.length > 0) {
                    this.cache.users = [...this.cache.users, ...newUsers];
                    console.log(`Database: Добавлено ${newUsers.length} пользователей из localStorage`);
                }
            }
            
            // Сохраняем обратно в localStorage обновленные данные
            await this.saveToLocalStorage();
            
            // Сохраняем в облако, если есть изменения
            if (localOrders.length > 0 || localUsers.length > 0) {
                await this.saveDatabase();
            }
            
            return true;
        } catch (error) {
            console.error('Database: Ошибка синхронизации:', error);
            return false;
        }
    }

    // Синхронизация при необходимости
    async syncIfNeeded() {
        if (!this.cache.lastSync || Date.now() - this.cache.lastSync > 30000) {
            await this.loadDatabase();
        }
    }

    // ========== ОБЩИЕ МЕТОДЫ ДОСТУПА К ДАННЫМ ==========

    // Получение всех данных
    async getAllData() {
        await this.syncIfNeeded();
        return this.cache;
    }

    // Получение версии данных
    async getDataVersion() {
        return {
            version: this.cache.version,
            lastSync: this.cache.lastSync,
            counts: {
                users: this.cache.users.length,
                orders: this.cache.orders.length,
                products: this.cache.products.length
            }
        };
    }

    // Принудительная синхронизация
    async forceSync() {
        console.log('Database: Принудительная синхронизация...');
        await this.loadDatabase();
        return this.cache;
    }

    // ========== МЕТОДЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ ==========

    async getUsers() {
        await this.syncIfNeeded();
        return this.cache.users;
    }

    async getUserByPhone(phone) {
        await this.syncIfNeeded();
        return this.cache.users.find(user => user.phone === phone);
    }

    async getUserById(userId) {
        await this.syncIfNeeded();
        return this.cache.users.find(user => user.id === userId);
    }

    async saveUser(userData) {
        await this.syncIfNeeded();
        
        const index = this.cache.users.findIndex(u => u.phone === userData.phone);
        
        if (index !== -1) {
            // Обновляем существующего пользователя
            this.cache.users[index] = {
                ...this.cache.users[index],
                ...userData,
                updatedAt: new Date().toISOString()
            };
            console.log(`Database: Пользователь ${userData.phone} обновлен`);
        } else {
            // Добавляем нового пользователя
            const newUser = {
                ...userData,
                id: this.generateId(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.cache.users.push(newUser);
            console.log(`Database: Пользователь ${userData.phone} добавлен`);
        }
        
        // Сохраняем в localStorage для быстрого доступа
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // Асинхронно сохраняем в облако
        this.queueSave();
        
        return true;
    }

    async updateUserOrders(userPhone, orderId) {
        await this.syncIfNeeded();
        
        const user = this.cache.users.find(u => u.phone === userPhone);
        if (user) {
            user.orders = user.orders || [];
            if (!user.orders.includes(orderId)) {
                user.orders.push(orderId);
                user.updatedAt = new Date().toISOString();
                
                // Асинхронно сохраняем в облако
                this.queueSave();
                
                console.log(`Database: Заказ ${orderId} добавлен пользователю ${userPhone}`);
                return true;
            }
        }
        
        return false;
    }

    // ========== МЕТОДЫ ДЛЯ ЗАКАЗОВ ==========

    async getOrders() {
        await this.syncIfNeeded();
        return this.cache.orders;
    }

    async getOrderById(orderId) {
        await this.syncIfNeeded();
        return this.cache.orders.find(order => order.id === orderId);
    }

    async getOrdersByUser(userPhone) {
        await this.syncIfNeeded();
        return this.cache.orders.filter(order => order.userPhone === userPhone);
    }

    async getOrdersByStatus(status) {
        await this.syncIfNeeded();
        return this.cache.orders.filter(order => order.status === status);
    }

    async saveOrder(orderData) {
        await this.syncIfNeeded();
        
        const orderIndex = this.cache.orders.findIndex(o => o.id === orderData.id);
        
        if (orderIndex !== -1) {
            // Обновляем существующий заказ
            this.cache.orders[orderIndex] = {
                ...this.cache.orders[orderIndex],
                ...orderData,
                updatedAt: new Date().toISOString()
            };
            console.log(`Database: Заказ ${orderData.id} обновлен`);
        } else {
            // Добавляем новый заказ
            const newOrder = {
                ...orderData,
                id: orderData.id || this.generateId(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.cache.orders.push(newOrder);
            console.log(`Database: Заказ ${newOrder.id} добавлен`);
            
            // Добавляем заказ пользователю
            if (newOrder.userPhone) {
                await this.updateUserOrders(newOrder.userPhone, newOrder.id);
            }
        }
        
        // Асинхронно сохраняем в облако
        this.queueSave();
        
        return true;
    }

    async updateOrderStatus(orderId, status, additionalData = {}) {
        await this.syncIfNeeded();
        
        const orderIndex = this.cache.orders.findIndex(o => o.id === orderId);
        if (orderIndex === -1) {
            console.error(`Database: Заказ ${orderId} не найден`);
            return false;
        }
        
        this.cache.orders[orderIndex] = {
            ...this.cache.orders[orderIndex],
            status: status,
            ...additionalData,
            updatedAt: new Date().toISOString()
        };
        
        console.log(`Database: Статус заказа ${orderId} изменен на ${status}`);
        
        // Асинхронно сохраняем в облако
        this.queueSave();
        
        return true;
    }

    // ========== МЕТОДЫ ДЛЯ ПРОДУКТОВ ==========

    async getProducts() {
        await this.syncIfNeeded();
        return this.cache.products;
    }

    async getProductById(productId) {
        await this.syncIfNeeded();
        
        // Ищем продукт во всех категориях
        for (const category in this.cache.products) {
            if (Array.isArray(this.cache.products[category])) {
                const product = this.cache.products[category].find(p => p.id === productId);
                if (product) return product;
            }
        }
        
        return null;
    }

    async saveProduct(productData) {
        await this.syncIfNeeded();
        
        const category = productData.category || 'other';
        if (!this.cache.products[category]) {
            this.cache.products[category] = [];
        }
        
        const productIndex = this.cache.products[category].findIndex(p => p.id === productData.id);
        
        if (productIndex !== -1) {
            // Обновляем существующий продукт
            this.cache.products[category][productIndex] = {
                ...this.cache.products[category][productIndex],
                ...productData,
                updatedAt: new Date().toISOString()
            };
            console.log(`Database: Продукт ${productData.id} обновлен`);
        } else {
            // Добавляем новый продукт
            const newProduct = {
                ...productData,
                id: productData.id || this.generateId(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.cache.products[category].push(newProduct);
            console.log(`Database: Продукт ${newProduct.id} добавлен`);
        }
        
        // Асинхронно сохраняем в облако
        this.queueSave();
        
        return true;
    }

    // ========== МЕТОДЫ ДЛЯ ПРОМОКОДОВ ==========

    async getPromocodes() {
        await this.syncIfNeeded();
        return this.cache.promocodes;
    }

    async getPromocodeByCode(code) {
        await this.syncIfNeeded();
        return this.cache.promocodes.find(promo => promo.code === code);
    }

    async savePromocode(promocodeData) {
        await this.syncIfNeeded();
        
        const promoIndex = this.cache.promocodes.findIndex(p => p.code === promocodeData.code);
        
        if (promoIndex !== -1) {
            // Обновляем существующий промокод
            this.cache.promocodes[promoIndex] = {
                ...this.cache.promocodes[promoIndex],
                ...promocodeData,
                updatedAt: new Date().toISOString()
            };
            console.log(`Database: Промокод ${promocodeData.code} обновлен`);
        } else {
            // Добавляем новый промокод
            const newPromocode = {
                ...promocodeData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.cache.promocodes.push(newPromocode);
            console.log(`Database: Промокод ${newPromocode.code} добавлен`);
        }
        
        // Асинхронно сохраняем в облако
        this.queueSave();
        
        return true;
    }

    // ========== МЕТОДЫ ДЛЯ СОТРУДНИКОВ ==========

    async getEmployees() {
        await this.syncIfNeeded();
        return this.cache.employees;
    }

    async getEmployeeByPhone(phone) {
        await this.syncIfNeeded();
        return this.cache.employees[phone];
    }

    async saveEmployee(phone, employeeData) {
        await this.syncIfNeeded();
        
        this.cache.employees[phone] = {
            ...(this.cache.employees[phone] || {}),
            ...employeeData,
            updatedAt: new Date().toISOString()
        };
        
        console.log(`Database: Данные сотрудника ${phone} обновлены`);
        
        // Асинхронно сохраняем в облако
        this.queueSave();
        
        return true;
    }

    // ========== МЕТОДЫ ДЛЯ ПРОБЛЕМ С ДОСТАВКОЙ ==========

    async getDeliveryProblems() {
        await this.syncIfNeeded();
        return this.cache.deliveryProblems;
    }

    async saveDeliveryProblem(problemData) {
        await this.syncIfNeeded();
        
        const newProblem = {
            ...problemData,
            id: this.generateId(),
            createdAt: new Date().toISOString(),
            status: 'reported'
        };
        
        this.cache.deliveryProblems.push(newProblem);
        console.log(`Database: Проблема доставки ${newProblem.id} добавлена`);
        
        // Асинхронно сохраняем в облако
        this.queueSave();
        
        return newProblem.id;
    }

    // ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==========

    // Генерация уникального ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Очередь сохранения (дебаунс)
    queueSave() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        
        this.saveTimeout = setTimeout(async () => {
            await this.saveDatabase();
        }, 2000); // Сохраняем через 2 секунды после последнего изменения
    }

    // Очистка старых данных (опционально)
    async cleanupOldData(daysToKeep = 30) {
        await this.syncIfNeeded();
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        
        // Очищаем старые завершенные заказы
        const oldOrders = this.cache.orders.filter(order => {
            const orderDate = new Date(order.createdAt || order.date);
            return orderDate < cutoffDate && 
                   (order.status === 'delivered' || order.status === 'completed' || order.status === 'cancelled');
        });
        
        if (oldOrders.length > 0) {
            console.log(`Database: Удаление ${oldOrders.length} старых заказов`);
            this.cache.orders = this.cache.orders.filter(order => !oldOrders.includes(order));
            
            // Сохраняем изменения
            await this.saveDatabase();
        }
        
        return oldOrders.length;
    }

    // Резервное копирование данных
    async createBackup() {
        const backup = {
            ...this.cache,
            backupCreated: new Date().toISOString()
        };
        
        const backupKey = `ksushi_backup_${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify(backup));
        
        console.log(`Database: Создана резервная копия ${backupKey}`);
        return backupKey;
    }

    // Восстановление из резервной копии
    async restoreFromBackup(backupKey) {
        try {
            const backupData = JSON.parse(localStorage.getItem(backupKey));
            if (!backupData) {
                throw new Error('Резервная копия не найдена');
            }
            
            this.cache = backupData;
            await this.saveDatabase();
            
            console.log(`Database: Восстановлено из резервной копии ${backupKey}`);
            return true;
        } catch (error) {
            console.error('Database: Ошибка восстановления из резервной копии:', error);
            return false;
        }
    }

    // ========== ИНИЦИАЛИЗАЦИЯ ==========

    async init() {
        console.log('Database: Инициализация...');
        
        try {
            // Загружаем данные из облака
            await this.loadDatabase();
            
            // Настраиваем автосинхронизацию
            setInterval(() => this.syncIfNeeded(), 60000); // Каждую минуту
            
            // Настраиваем автоматическую очистку старых данных (раз в день)
            setInterval(() => this.cleanupOldData(30), 24 * 60 * 60 * 1000);
            
            console.log('Database: Инициализация завершена');
            return this;
        } catch (error) {
            console.error('Database: Ошибка инициализации:', error);
            
            // Пробуем загрузить из localStorage
            await this.loadFromLocalStorage();
            return this;
        }
    }
}

// Создаем и экспортируем глобальный экземпляр
const database = new Database();

// Метод для прямой работы с JSONbin (если нужно)
database.directJSONbin = {
    async get() {
        const response = await fetch(database.JSONBIN_LATEST, {
            headers: database.getHeaders()
        });
        return response.json();
    },
    
    async update(data) {
        const response = await fetch(database.JSONBIN_URL, {
            method: 'PUT',
            headers: database.getHeaders(),
            body: JSON.stringify(data)
        });
        return response.json();
    }
};

// Делаем доступным глобально
window.database = database;

// Автоматическая инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing database...');
    
    // Не ждем инициализации, чтобы не блокировать загрузку страницы
    database.init().then(() => {
        console.log('Database: Готов к работе');
        
        // Отправляем событие, что база данных готова
        const event = new CustomEvent('databaseReady');
        document.dispatchEvent(event);
    }).catch(error => {
        console.error('Database: Ошибка при инициализации:', error);
    });
});

// Экспорт для модульных систем (если используется)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = database;
}