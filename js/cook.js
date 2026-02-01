// Система для поваров и курьеров

class CookSystem {
    constructor() {
        this.currentEmployee = null;
        this.allOrders = [];
        this.ordersData = [];
        this.employeePhones = {
            'chef': '9235260196', // Шеф-повар
            'courier': '9236721222' // Курьер
        };
        this.employeeRoles = {
            '9235260196': {
                role: 'Шеф-повар',
                permissions: ['view', 'cook', 'ready', 'cancel']
            },
            '9236721222': {
                role: 'Курьер',
                permissions: ['view', 'deliver', 'complete', 'report']
            }
        };
        this.tempSMSCode = null;
        this.tempPhone = null;
    }

    // Инициализация системы
    init() {
        this.checkEmployeeAuth();
        this.bindEvents();
        this.loadOrders();
        this.startAutoRefresh();
    }

    // Проверка авторизации сотрудника
    checkEmployeeAuth() {
        const employeeData = localStorage.getItem('employeeData');
        
        if (employeeData) {
            try {
                this.currentEmployee = JSON.parse(employeeData);
                this.showDashboard();
                this.updateEmployeeInfo();
            } catch (error) {
                console.error('Ошибка загрузки данных сотрудника:', error);
                this.showAuthScreen();
            }
        } else {
            this.showAuthScreen();
        }
    }

    // Показать экран авторизации
    showAuthScreen() {
        document.getElementById('cook-auth-required').style.display = 'block';
        document.getElementById('cook-dashboard').style.display = 'none';
        
        // Показываем первый шаг
        const stepPhone = document.getElementById('cook-step-phone');
        const stepCode = document.getElementById('cook-step-code');
        if (stepPhone) stepPhone.style.display = 'block';
        if (stepCode) stepCode.style.display = 'none';
    }

    // Показать панель управления
    showDashboard() {
        document.getElementById('cook-auth-required').style.display = 'none';
        document.getElementById('cook-dashboard').style.display = 'block';
        
        // Скрываем вкладку доставки для повара
        const isCourier = this.currentEmployee.role === 'Курьер';
        const deliveryTab = document.getElementById('delivery-tab');
        const deliveringContent = document.getElementById('delivering-content');
        
        if (!isCourier) {
            if (deliveryTab) deliveryTab.style.display = 'none';
            if (deliveringContent) deliveringContent.style.display = 'none';
        } else {
            if (deliveryTab) deliveryTab.style.display = 'block';
            if (deliveringContent) deliveringContent.style.display = 'block';
            this.checkCurrentDelivery();
        }
        
        // Загружаем начальные данные
        this.loadNewOrders();
    }

    // Обновление информации о сотруднике
    updateEmployeeInfo() {
        const roleElement = document.getElementById('employee-role');
        if (roleElement) {
            roleElement.textContent = this.currentEmployee.role;
        }
    }

    // Привязка событий
    bindEvents() {
        // Авторизация - отправка SMS
        document.getElementById('cook-login-btn')?.addEventListener('click', () => this.sendSMSCode());
        document.getElementById('cook-phone-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendSMSCode();
        });

        // Авторизация - подтверждение кода
        document.getElementById('verify-cook-code')?.addEventListener('click', () => this.verifySMSCode());
        document.getElementById('resend-cook-code')?.addEventListener('click', () => this.resendSMSCode());

        // Выход
        document.getElementById('logout-cook')?.addEventListener('click', () => this.logoutEmployee());

        // Табы
        document.querySelectorAll('.cook-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Проблемы с доставкой
        document.getElementById('report-problem')?.addEventListener('click', () => this.openProblemModal());
        document.getElementById('close-problem-modal')?.addEventListener('click', () => this.closeProblemModal());
        document.getElementById('cancel-problem')?.addEventListener('click', () => this.closeProblemModal());
        document.getElementById('submit-problem')?.addEventListener('click', () => this.submitProblem());

        // Отметить как доставлено
        document.getElementById('mark-delivered')?.addEventListener('click', () => this.markAsDelivered());

        // Настройка ввода SMS кода
        this.setupCodeInput();
    }

    // Отправка SMS кода для сотрудника
    sendSMSCode() {
        const phoneInput = document.getElementById('cook-phone-input');
        if (!phoneInput) return;

        const phone = phoneInput.value.replace(/\D/g, '');
        
        if (!phone || phone.length !== 10) {
            this.showNotification('Введите 10 цифр номера телефона', 'error');
            return;
        }

        // Проверяем, является ли номер рабочим
        if (!this.employeeRoles[phone]) {
            this.showNotification('Доступ запрещен. Используйте рабочий телефон.', 'error');
            return;
        }

        // Сохраняем номер
        this.tempPhone = phone;
        
        // Генерируем случайный 4-значный код
        this.tempSMSCode = Math.floor(1000 + Math.random() * 9000).toString();
        
        // Показываем загрузку
        const sendBtn = document.getElementById('cook-login-btn');
        if (sendBtn) {
            sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
            sendBtn.disabled = true;
        }

        // Имитируем отправку SMS (демо-режим)
        setTimeout(() => {
            // Сохраняем код для верификации
            localStorage.setItem('employeeTempSMSCode', this.tempSMSCode);
            localStorage.setItem('employeeTempPhone', phone);
            
            // Переключаем на шаг ввода кода
            this.showAuthStep('step-code');
            
            // Обновляем отображение номера
            const phoneDisplay = document.getElementById('employee-phone-display');
            if (phoneDisplay) {
                phoneDisplay.textContent = this.formatPhone(phone);
            }
            
            // Запускаем таймер
            this.startTimer();
            
            // Для тестирования - показываем код
            console.log(`Код для ${phone}: ${this.tempSMSCode}`);
            this.showNotification(`Демо-режим. Код: ${this.tempSMSCode}`, 'info');
            
            // Восстанавливаем кнопку
            if (sendBtn) {
                sendBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Получить код';
                sendBtn.disabled = false;
            }
            
            // Фокус на первое поле кода
            setTimeout(() => {
                const firstCodeInput = document.querySelector('.cook-code-digit');
                if (firstCodeInput) firstCodeInput.focus();
            }, 300);
            
        }, 1000);
    }

    // Показать шаг авторизации
    showAuthStep(step) {
        // Скрываем все шаги
        document.querySelectorAll('.cook-auth-step').forEach(stepElement => {
            stepElement.style.display = 'none';
        });
        
        // Показываем нужный шаг
        const stepElement = document.getElementById(`cook-${step}`);
        if (stepElement) {
            stepElement.style.display = 'block';
        }
    }

    // Верификация SMS кода
    verifySMSCode() {
        const codeDigits = document.querySelectorAll('.cook-code-digit');
        const enteredCode = Array.from(codeDigits).map(input => input.value).join('');
        
        // В демо-режиме проверяем сохраненный код
        let isValid = false;
        
        if (enteredCode.length === 4) {
            const savedCode = localStorage.getItem('employeeTempSMSCode') || this.tempSMSCode;
            const savedPhone = localStorage.getItem('employeeTempPhone') || this.tempPhone;
            
            if (enteredCode === savedCode && savedPhone) {
                isValid = true;
            }
            
            // Также принимаем 1234 для тестирования
            if (enteredCode === '1234') {
                isValid = true;
            }
        }
        
        if (!isValid) {
            this.showNotification('Неверный код. Введите 4 цифры', 'error');
            return;
        }
        
        // Код верный - авторизуем сотрудника
        this.clearTimer();
        
        const phone = localStorage.getItem('employeeTempPhone') || this.tempPhone;
        this.completeEmployeeLogin(phone);
    }

    // Завершение авторизации сотрудника
    completeEmployeeLogin(phone) {
        if (!this.employeeRoles[phone]) {
            this.showNotification('Ошибка авторизации', 'error');
            return;
        }

        const employeeData = {
            phone: phone,
            role: this.employeeRoles[phone].role,
            permissions: this.employeeRoles[phone].permissions,
            name: phone === '9235260196' ? 'Шеф-повар' : 'Курьер',
            loginTime: new Date().toISOString()
        };

        this.currentEmployee = employeeData;
        localStorage.setItem('employeeData', JSON.stringify(employeeData));
        
        // Очищаем временные данные
        localStorage.removeItem('employeeTempSMSCode');
        localStorage.removeItem('employeeTempPhone');
        this.tempSMSCode = null;
        this.tempPhone = null;
        
        this.showDashboard();
        this.updateEmployeeInfo();
        this.showNotification(`Добро пожаловать, ${employeeData.role}!`, 'success');
    }

    // Повторная отправка кода
    resendCode() {
        if (this.tempPhone) {
            this.sendSMSCode();
        }
    }

    // Выход сотрудника
    logoutEmployee() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            localStorage.removeItem('employeeData');
            this.currentEmployee = null;
            this.showAuthScreen();
            this.showNotification('Вы вышли из системы', 'info');
        }
    }

    // Запуск таймера для повторной отправки кода
    startTimer() {
        this.clearTimer();
        let timerSeconds = 60;
        
        const timerElement = document.getElementById('cook-timer-seconds');
        const resendBtn = document.getElementById('resend-cook-code');
        
        if (timerElement) timerElement.textContent = timerSeconds;
        if (resendBtn) {
            resendBtn.disabled = true;
            resendBtn.style.opacity = '0.5';
        }
        
        const timerInterval = setInterval(() => {
            timerSeconds--;
            
            if (timerElement) timerElement.textContent = timerSeconds;
            
            if (timerSeconds <= 0) {
                clearInterval(timerInterval);
                if (resendBtn) {
                    resendBtn.disabled = false;
                    resendBtn.style.opacity = '1';
                }
            }
        }, 1000);
        
        this.timerInterval = timerInterval;
    }

    // Очистка таймера
    clearTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    // Настройка ввода SMS кода
    setupCodeInput() {
        const codeInputs = document.querySelectorAll('.cook-code-digit');
        
        codeInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                // Очищаем значение, если это не цифра
                if (!/^\d$/.test(e.target.value)) {
                    e.target.value = '';
                    return;
                }
                
                // Автоматическая проверка кода при заполнении всех полей
                if (index === codeInputs.length - 1) {
                    const allFilled = Array.from(codeInputs).every(inp => inp.value.length === 1);
                    if (allFilled) {
                        setTimeout(() => {
                            this.verifySMSCode();
                        }, 300);
                    }
                }
                
                // Переходим к следующему полю
                if (index < codeInputs.length - 1) {
                    codeInputs[index + 1].focus();
                }
            });
            
            input.addEventListener('keydown', (e) => {
                // Обработка Backspace
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    codeInputs[index - 1].focus();
                }
                
                // Обработка стрелок
                if (e.key === 'ArrowLeft' && index > 0) {
                    codeInputs[index - 1].focus();
                    e.preventDefault();
                }
                
                if (e.key === 'ArrowRight' && index < codeInputs.length - 1) {
                    codeInputs[index + 1].focus();
                    e.preventDefault();
                }
            });
        });
    }

    // Переключение вкладок
    switchTab(tabId) {
        // Скрываем все вкладки
        document.querySelectorAll('.cook-tab-content').forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });

        // Убираем активный класс у всех табов
        document.querySelectorAll('.cook-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Показываем выбранную вкладку
        const selectedContent = document.getElementById(`${tabId}-content`);
        const selectedTab = document.querySelector(`.cook-tab[data-tab="${tabId}"]`);
        
        if (selectedContent) {
            selectedContent.classList.add('active');
            selectedContent.style.display = 'block';
        }
        
        if (selectedTab) {
            selectedTab.classList.add('active');
        }

        // Загружаем данные для вкладки
        switch(tabId) {
            case 'new-orders':
                this.loadNewOrders();
                break;
            case 'cooking':
                this.loadCookingOrders();
                break;
            case 'ready':
                this.loadReadyOrders();
                break;
            case 'delivering':
                this.loadDeliveryOrders();
                break;
            case 'statistics':
                this.loadStatistics();
                break;
        }
    }

    // Загрузка всех заказов (ИСПРАВЛЕННАЯ ВЕРСИЯ)
    loadOrders() {
        try {
            // Получаем всех пользователей
            const users = JSON.parse(localStorage.getItem('ksushi_users')) || [];
            this.allOrders = [];

            users.forEach(user => {
                if (user.orders && user.orders.length > 0) {
                    user.orders.forEach(order => {
                        // Добавляем информацию о пользователе в заказ
                        const orderWithUser = {
                            ...order,
                            userPhone: user.phone,
                            userName: user.name || 'Клиент',
                            userAddresses: user.addresses || []
                        };
                        this.allOrders.push(orderWithUser);
                    });
                }
            });

            // Сортируем по дате (новые сначала)
            this.allOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            console.log(`Загружено заказов: ${this.allOrders.length}`);
            this.allOrders.forEach(order => {
                console.log(`Заказ ${order.id}: статус=${order.status}, пользователь=${order.userName}`);
            });
            
            // Сохраняем для быстрого доступа
            this.ordersData = this.allOrders;
            
            // Загружаем начальные данные
            if (this.currentEmployee) {
                this.loadNewOrders();
            }

        } catch (error) {
            console.error('Ошибка загрузки заказов:', error);
        }
    }

    // Загрузка новых заказов
    loadNewOrders() {
        const newOrders = this.allOrders.filter(order => 
            order.status === 'new' || order.status === 'processing'
        );
        
        console.log(`Новых заказов: ${newOrders.length}`);
        
        const container = document.getElementById('new-orders-list');
        const countElement = document.getElementById('new-orders-count');
        
        if (countElement) {
            countElement.textContent = newOrders.length;
        }
        
        this.renderOrders(newOrders, container, ['cooking', 'cancel']);
    }

    // Загрузка заказов в готовке
    loadCookingOrders() {
        const cookingOrders = this.allOrders.filter(order => 
            order.status === 'cooking'
        );
        
        console.log(`Заказов в готовке: ${cookingOrders.length}`);
        
        const container = document.getElementById('cooking-orders-list');
        this.renderOrders(cookingOrders, container, ['ready', 'cancel']);
    }

    // Загрузка готовых заказов
    loadReadyOrders() {
        const readyOrders = this.allOrders.filter(order => 
            order.status === 'ready'
        );
        
        console.log(`Готовых заказов: ${readyOrders.length}`);
        
        const container = document.getElementById('ready-orders-list');
        
        // Повар может отменить, курьер может взять на доставку
        const actions = this.currentEmployee.role === 'Курьер' 
            ? ['delivering', 'cancel'] 
            : ['cancel'];
            
        this.renderOrders(readyOrders, container, actions);
    }

    // Загрузка заказов на доставке
    loadDeliveryOrders() {
        const deliveryOrders = this.allOrders.filter(order => 
            order.status === 'delivering'
        );
        
        console.log(`Заказов на доставке: ${deliveryOrders.length}`);
        
        const container = document.getElementById('delivery-history');
        this.renderOrders(deliveryOrders, container, []);
        
        // Проверяем текущую доставку для курьера
        this.checkCurrentDelivery();
    }

    // Рендеринг заказов
    renderOrders(orders, container, allowedActions) {
        if (!container) return;
        
        if (orders.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px;">
                    <i class="fas fa-clipboard-list" style="font-size: 64px; color: #666; margin-bottom: 20px;"></i>
                    <h3 style="color: #ccc; margin-bottom: 15px;">Нет заказов</h3>
                    <p style="color: #666;">${this.getEmptyMessage(container.id)}</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = orders.map(order => this.createOrderCard(order, allowedActions)).join('');
        
        // Добавляем обработчики кнопок
        this.addOrderEventListeners();
    }

    // Создание карточки заказа
    createOrderCard(order, allowedActions) {
        const statusText = this.getStatusText(order.status);
        const statusClass = this.getStatusClass(order.status);
        const formattedDate = this.formatDate(order.date);
        const totalAmount = order.total || this.calculateOrderTotal(order);
        
        // Получаем адрес доставки
        const address = order.address || this.getUserAddress(order);
        
        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-header">
                    <div>
                        <div class="order-number">${order.id || 'Заказ #N/A'}</div>
                        <div class="order-time">${formattedDate}</div>
                    </div>
                    <div class="order-status ${statusClass}">${statusText}</div>
                </div>
                
                <div class="order-items">
                    <h4><i class="fas fa-utensils"></i> Состав заказа:</h4>
                    ${this.renderOrderItems(order.items)}
                </div>
                
                <div class="order-details">
                    <div class="order-address">
                        <h5><i class="fas fa-user"></i> Клиент:</h5>
                        <p>${order.userName || 'Не указано'}</p>
                        <p>${this.formatPhone(order.userPhone)}</p>
                    </div>
                    
                    <div class="order-address">
                        <h5><i class="fas fa-map-marker-alt"></i> Адрес доставки:</h5>
                        <p>${address.fullAddress || 'Адрес не указан'}</p>
                        ${address.apartment ? `<p>Кв. ${address.apartment}</p>` : ''}
                        ${address.comment ? `<p><i>${address.comment}</i></p>` : ''}
                    </div>
                </div>
                
                <div class="order-total">
                    <div>
                        <div style="color: #999; font-size: 12px;">Сумма заказа:</div>
                        <div class="total-amount">${totalAmount}₽</div>
                    </div>
                </div>
                
                ${allowedActions.length > 0 ? this.renderOrderActions(order, allowedActions) : ''}
            </div>
        `;
    }

    // Рендеринг товаров в заказе
    renderOrderItems(items) {
        if (!items || items.length === 0) return '<p style="color: #999; font-style: italic;">Товары не указаны</p>';
        
        return items.map(item => `
            <div class="order-item">
                <span class="item-name">${item.name}</span>
                <span class="item-quantity">× ${item.quantity || 1}</span>
                <span class="item-price">${(item.price || 0) * (item.quantity || 1)}₽</span>
            </div>
        `).join('');
    }

    // Рендеринг действий для заказа
    renderOrderActions(order, allowedActions) {
        const actionsMap = {
            'cooking': { text: 'Взять в готовку', icon: 'fa-utensils', class: 'btn-cook' },
            'ready': { text: 'Готово', icon: 'fa-check', class: 'btn-ready' },
            'delivering': { text: 'Взять на доставку', icon: 'fa-motorcycle', class: 'btn-deliver' },
            'cancel': { text: 'Отменить', icon: 'fa-times', class: 'btn-cancel' }
        };
        
        // Фильтруем действия по роли сотрудника
        const availableActions = allowedActions.filter(action => {
            if (action === 'delivering') {
                return this.currentEmployee.role === 'Курьер';
            }
            return true;
        });
        
        if (availableActions.length === 0) return '';
        
        return `
            <div class="order-actions">
                ${availableActions.map(action => `
                    <button class="btn-status ${actionsMap[action].class}" 
                            data-action="${action}" 
                            data-order-id="${order.id}">
                        <i class="fas ${actionsMap[action].icon}"></i> ${actionsMap[action].text}
                    </button>
                `).join('')}
            </div>
        `;
    }

    // Добавление обработчиков событий для кнопок заказов
    addOrderEventListeners() {
        document.querySelectorAll('.btn-status').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                const orderId = e.currentTarget.dataset.orderId;
                console.log(`Нажата кнопка: ${action} для заказа ${orderId}`);
                this.updateOrderStatus(orderId, action);
            });
        });
    }

    // Обновление статуса заказа (ИСПРАВЛЕННАЯ ВЕРСИЯ)
    updateOrderStatus(orderId, action) {
        console.log(`Обновление статуса: заказ ${orderId}, действие ${action}`);
        
        const orderIndex = this.allOrders.findIndex(o => o.id === orderId);
        if (orderIndex === -1) {
            this.showNotification('Заказ не найден в текущем списке', 'error');
            
            // Попробуем перезагрузить заказы
            this.loadOrders();
            setTimeout(() => {
                const order = this.allOrders.find(o => o.id === orderId);
                if (order) {
                    this.processOrderUpdate(order, action);
                } else {
                    this.showNotification('Заказ не найден после перезагрузки', 'error');
                }
            }, 500);
            return;s
        }
        
        const order = this.allOrders[orderIndex];
        this.processOrderUpdate(order, action);
    }

    // Обработка обновления заказа
    processOrderUpdate(order, action) {
        const statusMap = {
            'cooking': 'cooking',
            'ready': 'ready',
            'delivering': 'delivering',
            'cancel': 'cancelled',
            'complete': 'delivered'
        };
        
        const newStatusValue = statusMap[action];
        if (!newStatusValue) {
            this.showNotification('Неизвестное действие', 'error');
            return;
        }

        // Подтверждение для критичных действий
        if (action === 'cancel') {
            if (!confirm('Вы уверены, что хотите отменить этот заказ?')) {
                return;
            }
        }

        if (action === 'delivering') {
            if (!confirm('Вы берете этот заказ на доставку?')) {
                return;
            }
        }

        // Обновляем статус в локальном массиве
        order.status = newStatusValue;
        
        // Если курьер берет заказ на доставку, сохраняем это
        if (action === 'delivering' && this.currentEmployee.role === 'Курьер') {
            order.courier = this.currentEmployee.phone;
            order.deliveryStartTime = new Date().toISOString();
            
            // Сохраняем текущую доставку
            localStorage.setItem('currentDelivery', JSON.stringify(order));
        }

        // Обновляем данные в localStorage
        const success = this.saveUpdatedOrder(order);

        if (success) {
            // Показываем уведомление
            this.showNotification(`Статус заказа изменен на "${this.getStatusText(newStatusValue)}"`, 'success');

            // Обновляем отображение
            setTimeout(() => {
                this.loadOrders();
                this.switchTab(this.getCurrentTab());
                
                // Если курьер взял заказ на доставку, показываем его
                if (action === 'delivering' && this.currentEmployee.role === 'Курьер') {
                    this.switchTab('delivering');
                    this.checkCurrentDelivery();
                }
            }, 500);
        } else {
            this.showNotification('Ошибка сохранения заказа', 'error');
        }
    }

    // Сохранение обновленного заказа (ИСПРАВЛЕННАЯ ВЕРСИЯ)
    saveUpdatedOrder(updatedOrder) {
        try {
            const users = JSON.parse(localStorage.getItem('ksushi_users')) || [];
            
            let updated = false;
            
            for (let i = 0; i < users.length; i++) {
                const user = users[i];
                if (user.phone === updatedOrder.userPhone && user.orders) {
                    const orderIndex = user.orders.findIndex(o => o.id === updatedOrder.id);
                    if (orderIndex !== -1) {
                        console.log(`Обновляю заказ ${updatedOrder.id} у пользователя ${user.phone}`);
                        
                        user.orders[orderIndex] = {
                            ...user.orders[orderIndex],
                            status: updatedOrder.status,
                            courier: updatedOrder.courier,
                            deliveryStartTime: updatedOrder.deliveryStartTime
                        };
                        updated = true;
                        break;
                    }
                }
            }
            
            if (updated) {
                localStorage.setItem('ksushi_users', JSON.stringify(users));
                console.log('Заказ успешно сохранен в localStorage');
                return true;
            } else {
                console.error('Заказ не найден для обновления');
                return false;
            }
            
        } catch (error) {
            console.error('Ошибка сохранения заказа:', error);
            return false;
        }
    }

    // Проверка текущей доставки для курьера
    checkCurrentDelivery() {
        if (this.currentEmployee.role !== 'Курьер') return;
        
        const currentDelivery = JSON.parse(localStorage.getItem('currentDelivery')) || null;
        const currentDeliveryElement = document.getElementById('current-delivery');
        const noDeliveryElement = document.getElementById('no-delivery');
        
        // Проверяем, соответствует ли текущая доставка текущему курьеру
        if (currentDelivery && 
            currentDelivery.status === 'delivering' && 
            currentDelivery.courier === this.currentEmployee.phone) {
            
            // Показываем информацию о текущей доставке
            if (currentDeliveryElement) currentDeliveryElement.style.display = 'block';
            if (noDeliveryElement) noDeliveryElement.style.display = 'none';
            
            this.displayDeliveryInfo(currentDelivery);
        } else {
            // Нет активной доставки
            if (currentDeliveryElement) currentDeliveryElement.style.display = 'none';
            if (noDeliveryElement) noDeliveryElement.style.display = 'block';
        }
    }

    // Отображение информации о доставке
    displayDeliveryInfo(order) {
        const address = order.address || this.getUserAddress(order);
        
        // Адрес доставки
        const addressElement = document.getElementById('delivery-address');
        const apartmentElement = document.getElementById('delivery-apartment');
        const commentElement = document.getElementById('delivery-comment');
        
        if (addressElement) addressElement.textContent = address.fullAddress || 'Адрес не указан';
        if (apartmentElement) apartmentElement.textContent = address.apartment ? `Квартира: ${address.apartment}` : '';
        if (commentElement) commentElement.textContent = address.comment || '';
        
        // Информация о клиенте
        document.getElementById('client-name').textContent = order.userName || 'Не указано';
        document.getElementById('client-phone').textContent = this.formatPhone(order.userPhone);
        
        // Состав заказа
        const itemsContainer = document.getElementById('delivery-items');
        if (itemsContainer) {
            itemsContainer.innerHTML = this.renderOrderItems(order.items);
        }
        
        // Сумма оплаты
        const totalAmount = order.total || this.calculateOrderTotal(order);
        document.getElementById('delivery-total').textContent = `${totalAmount}₽`;
        
        // Способ оплаты
        document.getElementById('payment-method').textContent = order.paymentMethod || 'Наличные';
    }

    // Отметить как доставлено
    markAsDelivered() {
        const currentDelivery = JSON.parse(localStorage.getItem('currentDelivery'));
        if (!currentDelivery) {
            this.showNotification('Нет активной доставки', 'error');
            return;
        }
        
        if (!confirm('Подтвердите, что заказ был доставлен клиенту?')) {
            return;
        }
        
        this.updateOrderStatus(currentDelivery.id, 'complete');
        
        // Очищаем текущую доставку
        localStorage.removeItem('currentDelivery');
        
        // Показываем уведомление
        this.showNotification('Заказ отмечен как доставленный!', 'success');
        
        // Обновляем отображение
        setTimeout(() => {
            this.checkCurrentDelivery();
            this.loadDeliveryOrders();
        }, 500);
    }

    // Открытие модального окна для проблем
    openProblemModal() {
        document.getElementById('problem-modal').style.display = 'flex';
    }

    // Закрытие модального окна
    closeProblemModal() {
        document.getElementById('problem-modal').style.display = 'none';
        // Сбрасываем форму
        document.getElementById('problem-type').value = '';
        document.getElementById('problem-description').value = '';
        document.getElementById('next-action').value = '';
    }

    // Отправка отчета о проблеме
    submitProblem() {
        const problemType = document.getElementById('problem-type').value;
        const description = document.getElementById('problem-description').value;
        const nextAction = document.getElementById('next-action').value;
        
        if (!problemType || !description || !nextAction) {
            this.showNotification('Заполните все поля', 'error');
            return;
        }
        
        const currentDelivery = JSON.parse(localStorage.getItem('currentDelivery'));
        if (!currentDelivery) {
            this.showNotification('Нет активной доставки', 'error');
            return;
        }
        
        // Создаем отчет о проблеме
        const problemReport = {
            orderId: currentDelivery.id,
            courier: this.currentEmployee.phone,
            problemType: problemType,
            description: description,
            recommendedAction: nextAction,
            timestamp: new Date().toISOString(),
            status: 'reported'
        };
        
        // Сохраняем отчет
        this.saveProblemReport(problemReport);
        
        // Закрываем модалку
        this.closeProblemModal();
        
        this.showNotification('Отчет о проблеме отправлен менеджеру', 'success');
        
        // Если выбрано действие "Отменить заказ", отменяем его
        if (nextAction === 'cancel') {
            setTimeout(() => {
                this.updateOrderStatus(currentDelivery.id, 'cancel');
            }, 1000);
        }
    }

    // Сохранение отчета о проблеме
    saveProblemReport(report) {
        try {
            let reports = JSON.parse(localStorage.getItem('deliveryProblems')) || [];
            reports.push(report);
            localStorage.setItem('deliveryProblems', JSON.stringify(reports));
        } catch (error) {
            console.error('Ошибка сохранения отчета:', error);
        }
    }

    // Загрузка статистики
    loadStatistics() {
        const today = new Date().toDateString();
        const todayOrders = this.allOrders.filter(order => 
            new Date(order.date).toDateString() === today
        );
        
        // Общая статистика
        document.getElementById('stats-total-orders').textContent = todayOrders.length;
        
        const completedOrders = todayOrders.filter(order => 
            order.status === 'delivered' || order.status === 'completed'
        );
        document.getElementById('stats-completed').textContent = completedOrders.length;
        
        const totalRevenue = completedOrders.reduce((sum, order) => 
            sum + (order.total || this.calculateOrderTotal(order)), 0
        );
        document.getElementById('stats-revenue').textContent = `${totalRevenue}₽`;
        
        // Популярные позиции
        this.loadPopularItems(todayOrders);
    }

    // Загрузка популярных позиций
    loadPopularItems(orders) {
        const itemCounts = {};
        
        orders.forEach(order => {
            if (order.items) {
                order.items.forEach(item => {
                    const itemName = item.name;
                    itemCounts[itemName] = (itemCounts[itemName] || 0) + (item.quantity || 1);
                });
            }
        });
        
        // Сортируем по количеству
        const popularItems = Object.entries(itemCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        const container = document.getElementById('popular-items');
        if (container) {
            if (popularItems.length === 0) {
                container.innerHTML = '<p style="color: #666; text-align: center;">Нет данных</p>';
                return;
            }
            
            container.innerHTML = popularItems.map(([name, count], index) => `
                <div style="
                    background: rgba(51, 51, 51, 0.5);
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span style="
                            background: #ff0000;
                            color: white;
                            width: 30px;
                            height: 30px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-weight: 900;
                        ">${index + 1}</span>
                        <span style="color: white; font-weight: 600;">${name}</span>
                    </div>
                    <span style="color: #ff0000; font-weight: 900; font-size: 18px;">${count}</span>
                </div>
            `).join('');
        }
    }

    // Вспомогательные методы

    getUserAddress(order) {
        if (order.address) return order.address;
        
        if (order.userAddresses && order.userAddresses.length > 0) {
            const defaultAddress = order.userAddresses.find(addr => addr.isDefault);
            return defaultAddress || order.userAddresses[0];
        }
        
        return { fullAddress: 'Адрес не указан' };
    }

    calculateOrderTotal(order) {
        if (order.total) return order.total;
        
        if (order.items && order.items.length > 0) {
            return order.items.reduce((sum, item) => 
                sum + (item.price || 0) * (item.quantity || 1), 0
            );
        }
        
        return 0;
    }

    getEmptyMessage(containerId) {
        const messages = {
            'new-orders-list': 'Нет новых заказов',
            'cooking-orders-list': 'Нет заказов в готовке',
            'ready-orders-list': 'Нет готовых заказов',
            'delivery-history': 'Нет истории доставок'
        };
        
        return messages[containerId] || 'Нет данных';
    }

    getCurrentTab() {
        const activeTab = document.querySelector('.cook-tab.active');
        return activeTab ? activeTab.dataset.tab : 'new-orders';
    }

    getStatusText(status) {
        const statusMap = {
            'new': 'Новый',
            'processing': 'В обработке',
            'cooking': 'Готовится',
            'ready': 'Готово',
            'delivering': 'В пути',
            'delivered': 'Доставлен',
            'completed': 'Завершен',
            'cancelled': 'Отменен'
        };
        return statusMap[status] || status;
    }

    getStatusClass(status) {
        const classMap = {
            'new': 'status-new',
            'processing': 'status-new',
            'cooking': 'status-cooking',
            'ready': 'status-ready',
            'delivering': 'status-delivering',
            'delivered': 'status-delivered',
            'completed': 'status-delivered',
            'cancelled': 'status-cancelled'
        };
        return classMap[status] || 'status-new';
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString || 'Дата не указана';
        }
    }

    formatPhone(phone) {
        if (!phone) return 'Не указан';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length !== 10) return phone;
        
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{2})(\d{2})$/);
        if (!match) return phone;
        
        return `+7 (${match[1]}) ${match[2]}-${match[3]}-${match[4]}`;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                               type === 'error' ? 'exclamation-circle' : 
                               'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Автоматическое обновление данных
    startAutoRefresh() {
        setInterval(() => {
            if (this.currentEmployee) {
                this.loadOrders();
                
                // Обновляем текущую вкладку
                const currentTab = this.getCurrentTab();
                switch(currentTab) {
                    case 'new-orders':
                        this.loadNewOrders();
                        break;
                    case 'cooking':
                        this.loadCookingOrders();
                        break;
                    case 'ready':
                        this.loadReadyOrders();
                        break;
                    case 'delivering':
                        this.loadDeliveryOrders();
                        break;
                    case 'statistics':
                        this.loadStatistics();
                        break;
                }
            }
        }, 10000); // Обновляем каждые 10 секунд
    }
}

// Инициализация системы при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const cookSystem = new CookSystem();
    cookSystem.init();
    window.cookSystem = cookSystem;
});