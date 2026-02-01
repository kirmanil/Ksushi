// ОПТИМИЗИРОВАННЫЙ ПРОФИЛЬ ДЛЯ МОБИЛЬНЫХ

// Глобальные переменные
let avatarOptionsOpen = false;

// Основная функция инициализации
document.addEventListener('DOMContentLoaded', function() {
    checkAuthAndLoadProfile();
    setupProfileEvents();
    loadCartCount();
    startOrdersAutoRefresh();
    setupAvatarUpload();
});

// Проверка авторизации и загрузка профиля
function checkAuthAndLoadProfile() {
    const userData = localStorage.getItem('userData');
    
    if (userData) {
        showProfileContent();
        loadProfileData(userData);
    } else {
        showAuthRequired();
    }
}

// Показать контент профиля
function showProfileContent() {
    const authRequired = document.getElementById('auth-required');
    const profileContent = document.getElementById('profile-content');
    
    if (authRequired) authRequired.style.display = 'none';
    if (profileContent) profileContent.style.display = 'block';
}

// Показать приглашение авторизации
function showAuthRequired() {
    const authRequired = document.getElementById('auth-required');
    const profileContent = document.getElementById('profile-content');
    
    if (authRequired) authRequired.style.display = 'block';
    if (profileContent) profileContent.style.display = 'none';
}

// Загрузка данных профиля
function loadProfileData(userDataString) {
    try {
        const user = JSON.parse(userDataString);
        
        // Основная информация
        setElementText('profile-name', user.name || 'Гость');
        setElementText('profile-phone', user.phone ? formatPhone(user.phone) : 'Не указан');
        
        // Статистика
        const ordersCount = user.orders ? user.orders.length : 0;
        const totalSpent = user.orders ? user.orders.reduce((sum, order) => sum + (order.total || 0), 0) : 0;
        const bonusPoints = user.bonuses || 0;
        
        setElementText('orders-count', ordersCount);
        setElementText('bonus-points', bonusPoints);
        
        // Личные данные
        setElementText('view-name', user.name || 'Не указано');
        setElementText('view-email', user.email || 'Не указан');
        setElementText('view-birthday', user.birthday || 'Не указана');
        
        // Бонусы
        setElementText('bonus-balance', bonusPoints);
        updateBonusProgress(bonusPoints);
        
        // Адреса
        loadAddresses(user.addresses || []);
        
        // Заказы
        loadOrders(user.orders || []);
        
        // Настройки уведомлений
        loadNotificationSettings(user.notificationSettings || {});
        
        // Аватар
        loadAvatar(user.avatar);
        
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        showAuthRequired();
    }
}

// Загрузка аватара
function loadAvatar(avatarData) {
    const avatarImg = document.getElementById('profile-avatar-img');
    if (!avatarImg) return;
    
    if (avatarData) {
        // Если аватар - base64 строка
        if (avatarData.startsWith('data:image')) {
            avatarImg.src = avatarData;
        } 
        // Если аватар - URL
        else if (avatarData.startsWith('http')) {
            avatarImg.src = avatarData;
        }
        // Если это имя файла
        else {
            avatarImg.src = `images/avatars/${avatarData}`;
        }
    } else {
        avatarImg.src = 'images/profile-avatar.png';
    }
}

// Настройка загрузки аватара
function setupAvatarUpload() {
    const changeAvatarBtn = document.getElementById('change-avatar-btn');
    const avatarOptions = document.getElementById('avatar-options');
    const uploadAvatarBtn = document.getElementById('upload-avatar-btn');
    const removeAvatarBtn = document.getElementById('remove-avatar-btn');
    const avatarUploadInput = document.getElementById('avatar-upload');
    
    if (!changeAvatarBtn || !avatarOptions) return;
    
    // Открытие/закрытие меню аватара
    changeAvatarBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        avatarOptionsOpen = !avatarOptionsOpen;
        avatarOptions.classList.toggle('active', avatarOptionsOpen);
    });
    
    // Закрытие меню при клике вне его
    document.addEventListener('click', function(e) {
        if (avatarOptionsOpen && !avatarOptions.contains(e.target) && !changeAvatarBtn.contains(e.target)) {
            avatarOptionsOpen = false;
            avatarOptions.classList.remove('active');
        }
    });
    
    // Загрузка нового аватара
    if (uploadAvatarBtn && avatarUploadInput) {
        uploadAvatarBtn.addEventListener('click', function() {
            avatarUploadInput.click();
        });
        
        avatarUploadInput.addEventListener('change', handleAvatarUpload);
    }
    
    // Удаление аватара
    if (removeAvatarBtn) {
        removeAvatarBtn.addEventListener('click', removeAvatar);
    }
}

// Обработка загрузки аватара
function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
        showNotification('Пожалуйста, выберите изображение', 'error');
        return;
    }
    
    // Проверка размера файла (максимум 2MB)
    if (file.size > 2 * 1024 * 1024) {
        showNotification('Размер изображения не должен превышать 2MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const imageData = e.target.result;
        
        // Создаем изображение для проверки и оптимизации
        const img = new Image();
        img.onload = function() {
            // Создаем canvas для оптимизации
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Максимальные размеры для мобильных
            const maxWidth = 400;
            const maxHeight = 400;
            let width = img.width;
            let height = img.height;
            
            // Изменяем размер если нужно
            if (width > maxWidth || height > maxHeight) {
                if (width > height) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                } else {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // Конвертируем в base64 с качеством 0.8 (80%)
            const optimizedImage = canvas.toDataURL('image/jpeg', 0.8);
            
            // Сохраняем аватар
            saveAvatar(optimizedImage);
            
            // Закрываем меню
            avatarOptionsOpen = false;
            document.getElementById('avatar-options').classList.remove('active');
        };
        
        img.onerror = function() {
            showNotification('Ошибка загрузки изображения', 'error');
        };
        
        img.src = e.target.result;
    };
    
    reader.onerror = function() {
        showNotification('Ошибка чтения файла', 'error');
    };
    
    reader.readAsDataURL(file);
}

// Сохранение аватара
function saveAvatar(imageData) {
    const userData = localStorage.getItem('userData');
    if (!userData) return;
    
    try {
        const user = JSON.parse(userData);
        user.avatar = imageData;
        
        // Сохраняем обновленные данные
        localStorage.setItem('userData', JSON.stringify(user));
        
        // Обновляем глобальный список
        updateGlobalUsers(user);
        
        // Обновляем отображение
        loadAvatar(imageData);
        
        showNotification('Аватар успешно обновлен!', 'success');
        
    } catch (error) {
        console.error('Ошибка сохранения аватара:', error);
        showNotification('Ошибка сохранения аватара', 'error');
    }
}

// Удаление аватара
function removeAvatar() {
    if (!confirm('Удалить текущий аватар?')) return;
    
    const userData = localStorage.getItem('userData');
    if (!userData) return;
    
    try {
        const user = JSON.parse(userData);
        delete user.avatar;
        
        // Сохраняем обновленные данные
        localStorage.setItem('userData', JSON.stringify(user));
        
        // Обновляем глобальный список
        updateGlobalUsers(user);
        
        // Возвращаем стандартный аватар
        document.getElementById('profile-avatar-img').src = 'images/profile-avatar.png';
        
        // Закрываем меню
        avatarOptionsOpen = false;
        document.getElementById('avatar-options').classList.remove('active');
        
        showNotification('Аватар удален', 'success');
        
    } catch (error) {
        console.error('Ошибка удаления аватара:', error);
        showNotification('Ошибка удаления аватара', 'error');
    }
}

// Обновление прогресса бонусов
function updateBonusProgress(bonusPoints) {
    const progressBar = document.getElementById('bonus-progress');
    if (!progressBar) return;
    
    const progressPercent = Math.min((bonusPoints / 1000) * 100, 100);
    progressBar.style.width = progressPercent + '%';
    
    const nextLevelElement = progressBar.closest('.bonus-card').querySelector('.bonus-next-level span');
    if (nextLevelElement) {
        const remaining = Math.max(0, 1000 - bonusPoints);
        nextLevelElement.textContent = remaining + '₽';
    }
}

// Вспомогательная функция для установки текста
function setElementText(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
    }
}

// Форматирование телефона
function formatPhone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) return phone;
    
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{2})(\d{2})$/);
    if (!match) return phone;
    
    return `+7 (${match[1]}) ${match[2]}-${match[3]}-${match[4]}`;
}

// Загрузка адресов
function loadAddresses(addresses) {
    const addressesList = document.getElementById('addresses-list');
    
    if (!addressesList) return;
    
    if (!addresses || addresses.length === 0) {
        addressesList.innerHTML = '<p class="no-addresses">У вас нет сохраненных адресов</p>';
        return;
    }
    
    addressesList.innerHTML = addresses.map(address => {
        let displayAddress = '';
        if (address.city) displayAddress += address.city;
        if (address.street) displayAddress += displayAddress ? `, ${address.street}` : address.street;
        if (address.house) displayAddress += displayAddress ? `, д. ${address.house}` : `д. ${address.house}`;
        if (address.apartment) displayAddress += `, кв. ${address.apartment}`;
        
        return `
            <div class="address-item ${address.isDefault ? 'active' : ''}" data-id="${address.id}">
                <div class="address-title">
                    <span>${address.title || 'Без названия'}</span>
                    <div class="address-actions">
                        ${address.isDefault ? 
                            '<span class="default-badge">Основной</span>' : 
                            `<button class="set-default-btn" title="Сделать основным" data-id="${address.id}">
                                <i class="fas fa-star"></i>
                            </button>`
                        }
                        <button class="delete-address-btn" title="Удалить" data-id="${address.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="address-details">${displayAddress || address.fullAddress || 'Адрес не указан'}</div>
                ${address.comment ? `<div class="address-comment">${address.comment}</div>` : ''}
            </div>
        `;
    }).join('');
    
    setupAddressButtons();
}

// Настройка обработчиков адресов
function setupAddressButtons() {
    // Установка основного адреса
    document.querySelectorAll('.set-default-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            const addressId = parseInt(this.dataset.id);
            setDefaultAddress(addressId);
        });
    });
    
    // Удаление адреса
    document.querySelectorAll('.delete-address-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            const addressId = parseInt(this.dataset.id);
            deleteAddress(addressId);
        });
    });
}

// Загрузка заказов
function loadOrders(orders) {
    const activeOrdersList = document.getElementById('active-orders-list');
    const activeOrdersCount = document.getElementById('active-orders-count');
    const lastOrderSection = document.getElementById('last-order-section');
    const lastOrderCard = document.getElementById('last-order-card');
    const historyOrdersList = document.getElementById('history-orders-list');
    
    if (!orders || orders.length === 0) {
        if (activeOrdersList) {
            activeOrdersList.innerHTML = `
                <div style="text-align: center; padding: 30px; color: #666;">
                    <i class="fas fa-shopping-bag" style="font-size: 48px; margin-bottom: 15px;"></i>
                    <p>У вас пока нет заказов</p>
                </div>
            `;
        }
        if (lastOrderSection) lastOrderSection.style.display = 'none';
        if (historyOrdersList) {
            historyOrdersList.innerHTML = `
                <div class="no-orders">
                    <i class="fas fa-history"></i>
                    <p>История заказов пуста</p>
                </div>
            `;
        }
        if (activeOrdersCount) activeOrdersCount.textContent = '0';
        return;
    }
    
    // Сортируем по дате
    const sortedOrders = [...orders].sort((a, b) => 
        new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
    );

    // Разделяем активные и завершенные заказы
    const activeStatuses = ['new', 'processing', 'cooking', 'delivering'];
    const completedStatuses = ['delivered', 'completed', 'cancelled'];
    
    const activeOrders = sortedOrders.filter(o => activeStatuses.includes(o.status));
    const completedOrders = sortedOrders.filter(o => completedStatuses.includes(o.status));
    
    // 1. Активные заказы
    if (activeOrdersList && activeOrdersCount) {
        if (activeOrders.length > 0) {
            activeOrdersCount.textContent = activeOrders.length;
            
            // Показываем только первые 2 активных заказа на мобильных
            const ordersToShow = activeOrders.slice(0, 2);
            
            activeOrdersList.innerHTML = ordersToShow.map(order => `
                <div class="active-order-card" data-order-id="${order.id}" role="button" tabindex="0">
                    <div class="active-order-header">
                        <span class="active-order-title">Заказ #${order.id?.substring(0, 8) || '...'}</span>
                        <span class="active-order-status ${getStatusClass(order.status)}">
                            ${getStatusText(order.status)}
                        </span>
                    </div>
                    <div class="active-order-items">
                        ${order.items ? order.items.slice(0, 2).map(item => 
                            `<div>${item.name} × ${item.quantity}</div>`
                        ).join('') : 'Детали загружаются...'}
                        ${order.items && order.items.length > 2 ? 
                            `<div style="color: #666; font-size: 12px;">+ ещё ${order.items.length - 2} позиций</div>` : ''}
                    </div>
                    <div class="active-order-footer">
                        <span>Сумма: ${order.total || 0}₽</span>
                        <span>${formatDate(order.date || order.createdAt)}</span>
                    </div>
                </div>
            `).join('');
            
            // Если есть больше 2 активных заказов, показываем сообщение
            if (activeOrders.length > 2) {
                activeOrdersList.innerHTML += `
                    <div style="
                        text-align: center;
                        padding: 15px;
                        color: #666;
                        font-size: 14px;
                        border-top: 1px solid #333;
                        margin-top: 15px;
                    ">
                        <i class="fas fa-ellipsis-h"></i>
                        И ещё ${activeOrders.length - 2} активных заказа
                    </div>
                `;
            }
        } else {
            activeOrdersList.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #666;">
                    <i class="fas fa-check-circle" style="font-size: 36px; margin-bottom: 10px;"></i>
                    <p>Нет активных заказов</p>
                </div>
            `;
            activeOrdersCount.textContent = '0';
        }
    }
    
    // 2. Последний завершенный заказ
    if (lastOrderSection && lastOrderCard && completedOrders.length > 0) {
        const lastOrder = completedOrders[0];
        lastOrderSection.style.display = 'block';
        
        lastOrderCard.innerHTML = `
            <div class="active-order-card" data-order-id="${lastOrder.id}" role="button" tabindex="0">
                <div class="active-order-header">
                    <span class="active-order-title">Заказ #${lastOrder.id?.substring(0, 8) || 'N/A'}</span>
                    <span class="active-order-status ${getStatusClass(lastOrder.status)}">
                        ${getStatusText(lastOrder.status)}
                    </span>
                </div>
                <div class="active-order-items">
                    ${lastOrder.items ? lastOrder.items.slice(0, 2).map(item => 
                        `${item.name} × ${item.quantity}`
                    ).join(', ') : 'Детали заказа недоступны'}
                    ${lastOrder.items && lastOrder.items.length > 2 ? 
                        `, + ещё ${lastOrder.items.length - 2}` : ''}
                </div>
                <div class="active-order-footer">
                    <span>Сумма: ${lastOrder.total || 0}₽</span>
                    <span>${formatDate(lastOrder.date || lastOrder.createdAt)}</span>
                </div>
            </div>
        `;
    } else if (lastOrderSection) {
        lastOrderSection.style.display = 'none';
    }
    
    // 3. История заказов (для модального окна)
    if (historyOrdersList) {
        if (completedOrders.length === 0) {
            historyOrdersList.innerHTML = `
                <div class="no-orders">
                    <i class="fas fa-history"></i>
                    <p>История заказов пуста</p>
                </div>
            `;
        } else {
            historyOrdersList.innerHTML = completedOrders.map(order => `
                <div class="active-order-card" data-order-id="${order.id}" role="button" tabindex="0">
                    <div class="active-order-header">
                        <span class="active-order-title">Заказ #${order.id?.substring(0, 8) || 'N/A'}</span>
                        <span class="active-order-status ${getStatusClass(order.status)}">
                            ${getStatusText(order.status)}
                        </span>
                    </div>
                    <div class="active-order-items">
                        ${order.items ? order.items.slice(0, 2).map(item => 
                            `${item.name} × ${item.quantity}`
                        ).join(', ') : 'Детали заказа недоступны'}
                        ${order.items && order.items.length > 2 ? 
                            `, + ещё ${order.items.length - 2}` : ''}
                    </div>
                    <div class="active-order-footer">
                        <span>Сумма: ${order.total || 0}₽</span>
                        <span>${formatDate(order.date || order.createdAt)}</span>
                    </div>
                </div>
            `).join('');
        }
    }
    
    // Добавляем обработчики для клика по заказам
    addOrdersClickHandlers();
}

// Добавление обработчиков клика по заказам
function addOrdersClickHandlers() {
    const handleOrderClick = function(e) {
        // Проверяем, что клик не по кнопке внутри карточки
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
            return;
        }
        
        const orderId = this.dataset.orderId;
        if (orderId) {
            showOrderDetails(orderId);
        }
    };
    
    // Обработчики для карточек заказов
    document.querySelectorAll('.active-order-card[data-order-id]').forEach(card => {
        // Удаляем старые обработчики
        card.removeEventListener('click', handleOrderClick);
        // Добавляем новые
        card.addEventListener('click', handleOrderClick);
        
        // Также добавляем обработку клавиатуры для доступности
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const orderId = this.dataset.orderId;
                if (orderId) {
                    showOrderDetails(orderId);
                }
            }
        });
    });
}

// Форматирование даты
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return 'Дата не указана';
    }
}

// Получение класса статуса
function getStatusClass(status) {
    const statusMap = {
        'new': 'status-new',
        'processing': 'status-processing',
        'cooking': 'status-processing',
        'delivering': 'status-delivering',
        'delivered': 'status-delivered',
        'completed': 'status-delivered',
        'cancelled': 'status-cancelled'
    };
    return statusMap[status] || 'status-processing';
}

// Получение текста статуса
function getStatusText(status) {
    const statusMap = {
        'new': 'Новый',
        'processing': 'В обработке',
        'cooking': 'Готовится',
        'delivering': 'В пути',
        'delivered': 'Доставлен',
        'completed': 'Завершен',
        'cancelled': 'Отменен'
    };
    return statusMap[status] || status;
}

// Загрузка настроек уведомлений
function loadNotificationSettings(settings) {
    const defaultSettings = {
        notifySMS: true,
        notifyEmail: false,
        notifyPromo: true,
        notifyOrderUpdates: true
    };
    
    const finalSettings = { ...defaultSettings, ...settings };
    
    const smsCheckbox = document.getElementById('notify-sms');
    const emailCheckbox = document.getElementById('notify-email');
    const promoCheckbox = document.getElementById('notify-promo');
    const updatesCheckbox = document.getElementById('notify-order-updates');
    
    if (smsCheckbox) smsCheckbox.checked = finalSettings.notifySMS;
    if (emailCheckbox) emailCheckbox.checked = finalSettings.notifyEmail;
    if (promoCheckbox) promoCheckbox.checked = finalSettings.notifyPromo;
    if (updatesCheckbox) updatesCheckbox.checked = finalSettings.notifyOrderUpdates;
}

// Настройка обработчиков событий
function setupProfileEvents() {
    // Кнопки авторизации
    document.getElementById('login-with-phone')?.addEventListener('click', openAuthModal);
    document.getElementById('register-new')?.addEventListener('click', openAuthModal);
    
    // Выход из системы
    document.getElementById('logout-btn')?.addEventListener('click', logout);
    
    // Редактирование личных данных
    setupPersonalDataEditing();
    
    // Адреса доставки
    setupAddressManagement();
    
    // Настройки уведомлений
    document.getElementById('save-notifications')?.addEventListener('click', saveNotificationSettings);
    
    // История заказов
    const openHistoryBtn = document.getElementById('open-history-btn');
    const closeHistoryBtn = document.getElementById('close-history-modal');
    const historyModal = document.getElementById('history-modal');
    
    if (openHistoryBtn && historyModal) {
        openHistoryBtn.addEventListener('click', function() {
            historyModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (closeHistoryBtn && historyModal) {
        closeHistoryBtn.addEventListener('click', function() {
            historyModal.style.display = 'none';
            document.body.style.overflow = '';
        });
    }
    
    if (historyModal) {
        historyModal.addEventListener('click', function(e) {
            if (e.target === historyModal) {
                historyModal.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }
    
    // Детали заказа
    document.getElementById('close-order-details')?.addEventListener('click', closeOrderDetailsModal);
    
    // Мобильная оптимизация: скрываем клавиатуру при клике вне полей ввода
    document.addEventListener('click', function(e) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            document.activeElement.blur();
        }
    });
    
    // Предотвращаем зум на мобильных при двойном тапе
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

// Автообновление заказов
function startOrdersAutoRefresh() {
    setInterval(() => {
        try {
            const currentUserDataStr = localStorage.getItem('userData');
            if (!currentUserDataStr) return;
            
            const currentUser = JSON.parse(currentUserDataStr);
            const userPhone = currentUser.phone;
            
            const globalUsersStr = localStorage.getItem('ksushi_users');
            if (!globalUsersStr) return;
            
            const globalUsers = JSON.parse(globalUsersStr);
            const updatedUser = globalUsers.find(user => user.phone === userPhone);
            
            if (updatedUser && updatedUser.orders) {
                // Обновляем только если есть изменения
                if (JSON.stringify(currentUser.orders) !== JSON.stringify(updatedUser.orders)) {
                    currentUser.orders = updatedUser.orders;
                    if (updatedUser.bonuses !== undefined) {
                        currentUser.bonuses = updatedUser.bonuses;
                    }
                    localStorage.setItem('userData', JSON.stringify(currentUser));
                    
                    // Обновляем статистику
                    const ordersCount = updatedUser.orders.length;
                    const bonusPoints = updatedUser.bonuses || 0;
                    
                    setElementText('orders-count', ordersCount);
                    setElementText('bonus-points', bonusPoints);
                    setElementText('bonus-balance', bonusPoints);
                    updateBonusProgress(bonusPoints);
                    
                    // Обновляем заказы
                    loadOrders(updatedUser.orders);
                }
            }
        } catch (error) {
            console.error('Ошибка автообновления заказов:', error);
        }
    }, 30000); // 30 секунд
}

// Установка основного адреса
function setDefaultAddress(addressId) {
    const userData = localStorage.getItem('userData');
    if (!userData) return;
    
    try {
        const user = JSON.parse(userData);
        
        user.addresses = (user.addresses || []).map(addr => ({
            ...addr,
            isDefault: addr.id === addressId
        }));
        
        localStorage.setItem('userData', JSON.stringify(user));
        updateGlobalUsers(user);
        loadAddresses(user.addresses);
        
        if (window.smsAuth) {
            window.smsAuth.updateCartAddress(localStorage.getItem('userData'));
        }
        
        showNotification('Основной адрес изменен', 'success');
        
    } catch (error) {
        console.error('Ошибка установки основного адреса:', error);
        showNotification('Ошибка изменения адреса', 'error');
    }
}

// Удаление адреса
function deleteAddress(addressId) {
    if (!confirm('Вы уверены, что хотите удалить этот адрес?')) return;
    
    const userData = localStorage.getItem('userData');
    if (!userData) return;
    
    try {
        const user = JSON.parse(userData);
        const addressToDelete = user.addresses.find(addr => addr.id === addressId);
        if (!addressToDelete) return;
        
        if (addressToDelete.isDefault && user.addresses.length > 1) {
            showNotification('Нельзя удалить основной адрес. Сначала сделайте основной другой адрес.', 'error');
            return;
        }
        
        user.addresses = user.addresses.filter(addr => addr.id !== addressId);
        
        if (user.addresses.length > 0 && !user.addresses.some(addr => addr.isDefault)) {
            user.addresses[0].isDefault = true;
        }
        
        localStorage.setItem('userData', JSON.stringify(user));
        updateGlobalUsers(user);
        loadAddresses(user.addresses);
        
        if (window.smsAuth) {
            window.smsAuth.updateCartAddress(localStorage.getItem('userData'));
        }
        
        showNotification('Адрес удален', 'success');
        
    } catch (error) {
        console.error('Ошибка удаления адреса:', error);
        showNotification('Ошибка удаления адреса', 'error');
    }
}

// Обновление глобального списка пользователей
function updateGlobalUsers(updatedUser) {
    try {
        let users = JSON.parse(localStorage.getItem('ksushi_users')) || [];
        const userIndex = users.findIndex(u => u.phone === updatedUser.phone);
        
        if (userIndex !== -1) {
            users[userIndex] = updatedUser;
        } else {
            users.push(updatedUser);
        }
        
        localStorage.setItem('ksushi_users', JSON.stringify(users));
    } catch (error) {
        console.error('Ошибка обновления списка пользователей:', error);
    }
}

// Открытие модального окна авторизации
function openAuthModal() {
    if (window.smsAuth) {
        window.smsAuth.openAuthModal();
    }
}

// Выход из системы
function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        if (window.smsAuth) {
            window.smsAuth.logout();
        } else {
            localStorage.removeItem('userData');
            window.location.reload();
        }
    }
}

// Настройка редактирования личных данных
function setupPersonalDataEditing() {
    const editToggle = document.querySelector('.edit-toggle[data-section="personal"]');
    const cancelEdit = document.querySelector('.cancel-edit[data-section="personal"]');
    const saveEdit = document.querySelector('.save-edit[data-section="personal"]');
    
    if (editToggle) {
        editToggle.addEventListener('click', function() {
            toggleEditMode('personal', true);
        });
    }
    
    if (cancelEdit) {
        cancelEdit.addEventListener('click', function() {
            toggleEditMode('personal', false);
        });
    }
    
    if (saveEdit) {
        saveEdit.addEventListener('click', savePersonalData);
    }
}

// Переключение режима редактирования
function toggleEditMode(section, showEdit = true) {
    const viewMode = document.querySelector(`#${section}-data .view-mode`);
    const editMode = document.querySelector(`#${section}-data .edit-mode`);
    
    if (viewMode && editMode) {
        if (showEdit) {
            viewMode.style.display = 'none';
            editMode.style.display = 'block';
            
            const userData = localStorage.getItem('userData');
            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    document.getElementById('edit-name').value = user.name || '';
                    document.getElementById('edit-email').value = user.email || '';
                    document.getElementById('edit-birthday').value = user.birthday || '';
                } catch (error) {
                    console.error('Ошибка загрузки данных:', error);
                }
            }
        } else {
            viewMode.style.display = 'block';
            editMode.style.display = 'none';
        }
    }
}

// Сохранение личных данных
function savePersonalData() {
    const name = document.getElementById('edit-name').value.trim();
    const email = document.getElementById('edit-email').value.trim();
    const birthday = document.getElementById('edit-birthday').value;
    
    if (!name) {
        showNotification('Введите ваше имя', 'error');
        return;
    }
    
    const userData = localStorage.getItem('userData');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            user.name = name;
            user.email = email || null;
            user.birthday = birthday || null;
            
            localStorage.setItem('userData', JSON.stringify(user));
            updateGlobalUsers(user);
            
            document.getElementById('view-name').textContent = name;
            document.getElementById('view-email').textContent = email || 'Не указан';
            document.getElementById('view-birthday').textContent = birthday || 'Не указана';
            document.getElementById('profile-name').textContent = name;
            
            toggleEditMode('personal', false);
            
            if (window.smsAuth) {
                window.smsAuth.updateAuthButtonOnMainPage(localStorage.getItem('userData'));
            }
            
            showNotification('Данные успешно сохранены!', 'success');
            
        } catch (error) {
            console.error('Ошибка сохранения данных:', error);
            showNotification('Ошибка сохранения данных', 'error');
        }
    }
}

// Настройка управления адресами
function setupAddressManagement() {
    const addAddressBtn = document.getElementById('add-new-address');
    const cancelAddressBtn = document.getElementById('cancel-new-address');
    const saveAddressBtn = document.getElementById('save-new-address');
    
    if (addAddressBtn) {
        addAddressBtn.addEventListener('click', function() {
            const form = document.getElementById('new-address-form');
            if (form) {
                form.style.display = 'block';
                this.style.display = 'none';
                
                const cityInput = document.getElementById('address-city');
                if (cityInput) cityInput.value = 'Гурьевск';
            }
        });
    }
    
    if (cancelAddressBtn) {
        cancelAddressBtn.addEventListener('click', function() {
            const form = document.getElementById('new-address-form');
            const addButton = document.getElementById('add-new-address');
            
            if (form && addButton) {
                form.style.display = 'none';
                addButton.style.display = 'block';
                resetAddressForm();
            }
        });
    }
    
    if (saveAddressBtn) {
        saveAddressBtn.addEventListener('click', saveNewAddress);
    }
}

// Сохранение нового адреса
function saveNewAddress() {
    const title = document.getElementById('address-title').value.trim();
    const city = 'Гурьевск';
    const street = document.getElementById('address-street').value.trim();
    const house = document.getElementById('address-house').value.trim();
    
    if (!title) {
        showNotification('Введите название адреса', 'error');
        document.getElementById('address-title').focus();
        return;
    }
    
    if (!street) {
        showNotification('Введите улицу', 'error');
        document.getElementById('address-street').focus();
        return;
    }
    
    if (!house) {
        showNotification('Введите номер дома', 'error');
        document.getElementById('address-house').focus();
        return;
    }
    
    const userData = localStorage.getItem('userData');
    if (!userData) {
        showNotification('Ошибка: пользователь не авторизован', 'error');
        return;
    }
    
    try {
        const user = JSON.parse(userData);
        
        const apartment = document.getElementById('address-apartment').value.trim();
        let fullAddress = `${city}, ${street}, д. ${house}`;
        if (apartment) {
            fullAddress += `, кв. ${apartment}`;
        }
        
        const newAddress = {
            id: Date.now(),
            title: title,
            fullAddress: fullAddress,
            city: city,
            street: street,
            house: house,
            apartment: apartment || null,
            entrance: document.getElementById('address-entrance').value.trim() || null,
            floor: document.getElementById('address-floor').value.trim() || null,
            intercom: document.getElementById('address-intercom').value.trim() || null,
            comment: document.getElementById('address-comment').value.trim() || null,
            isDefault: !user.addresses || user.addresses.length === 0,
            createdAt: new Date().toISOString()
        };
        
        user.addresses = user.addresses || [];
        user.addresses.push(newAddress);
        
        localStorage.setItem('userData', JSON.stringify(user));
        updateGlobalUsers(user);
        loadAddresses(user.addresses);
        
        if (window.smsAuth) {
            window.smsAuth.updateCartAddress(localStorage.getItem('userData'));
        }
        
        const form = document.getElementById('new-address-form');
        const addButton = document.getElementById('add-new-address');
        
        if (form && addButton) {
            form.style.display = 'none';
            addButton.style.display = 'block';
        }
        
        resetAddressForm();
        showNotification('Адрес успешно сохранен!', 'success');
        
    } catch (error) {
        console.error('Ошибка сохранения адреса:', error);
        showNotification('Ошибка сохранения адреса', 'error');
    }
}

// Сброс формы адреса
function resetAddressForm() {
    const fields = [
        'address-title',
        'address-street',
        'address-house',
        'address-apartment',
        'address-entrance',
        'address-floor',
        'address-intercom',
        'address-comment'
    ];
    
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) field.value = '';
    });
    
    const cityInput = document.getElementById('address-city');
    if (cityInput) cityInput.value = 'Гурьевск';
}

// Сохранение настроек уведомлений
function saveNotificationSettings() {
    const settings = {
        notifySMS: document.getElementById('notify-sms').checked,
        notifyEmail: document.getElementById('notify-email').checked,
        notifyPromo: document.getElementById('notify-promo').checked,
        notifyOrderUpdates: document.getElementById('notify-order-updates').checked
    };
    
    const userData = localStorage.getItem('userData');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            user.notificationSettings = settings;
            localStorage.setItem('userData', JSON.stringify(user));
            updateGlobalUsers(user);
            showNotification('Настройки уведомлений сохранены!', 'success');
        } catch (error) {
            console.error('Ошибка сохранения настроек:', error);
            showNotification('Ошибка сохранения настроек', 'error');
        }
    }
}

// Показать детали заказа
function showOrderDetails(orderId) {
    const modal = document.getElementById('order-details-modal');
    const content = document.getElementById('order-details-content');
    
    if (!modal || !content) return;
    
    const userData = localStorage.getItem('userData');
    if (!userData) return;
    
    try {
        const user = JSON.parse(userData);
        const order = user.orders?.find(o => o.id === orderId);
        
        if (!order) {
            content.innerHTML = '<p style="padding: 20px; text-align: center; color: #ccc;">Заказ не найден</p>';
        } else {
            content.innerHTML = `
                <div class="order-details-section">
                    <h4>Заказ #${order.id?.substring(0, 8) || 'N/A'}</h4>
                    <p style="color: #ccc; margin: 10px 0;">${formatDate(order.date || order.createdAt)}</p>
                    <p style="color: #ff0000; font-weight: bold;">${getStatusText(order.status)}</p>
                </div>
                
                <div class="order-details-section">
                    <h4>Состав заказа</h4>
                    <div style="margin-top: 10px;">
                        ${order.items ? order.items.map(item => `
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #333;">
                                <div>
                                    <div style="color: white;">${item.name}</div>
                                    ${item.variant ? `<div style="color: #666; font-size: 12px;">${item.variant}</div>` : ''}
                                </div>
                                <div style="text-align: right;">
                                    <div style="color: white;">${item.quantity} × ${item.price}₽</div>
                                    <div style="color: #ff0000; font-weight: bold;">${item.quantity * item.price}₽</div>
                                </div>
                            </div>
                        `).join('') : '<p style="color: #ccc;">Информация о товарах недоступна</p>'}
                    </div>
                </div>
                
                <div class="order-details-section">
                    <h4>Итого</h4>
                    <div style="display: flex; justify-content: space-between; margin-top: 15px;">
                        <span style="color: #ccc;">Общая сумма:</span>
                        <span style="color: white; font-weight: bold; font-size: 18px;">${order.total || 0}₽</span>
                    </div>
                </div>
                
                ${order.address ? `
                    <div class="order-details-section">
                        <h4>Адрес доставки</h4>
                        <p style="color: #ccc; margin-top: 10px;">${order.address}</p>
                    </div>
                ` : ''}
                
                ${order.comment ? `
                    <div class="order-details-section">
                        <h4>Комментарий к заказу</h4>
                        <p style="color: #ccc; margin-top: 10px; font-style: italic;">${order.comment}</p>
                    </div>
                ` : ''}
            `;
        }
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Ошибка загрузки деталей заказа:', error);
        content.innerHTML = '<p style="padding: 20px; text-align: center; color: #ff0000;">Ошибка загрузки информации</p>';
    }
}

// Закрыть детали заказа
function closeOrderDetailsModal() {
    const modal = document.getElementById('order-details-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Загрузка количества товаров в корзине
function loadCartCount() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const count = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const cartCountElement = document.querySelector('.cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = count;
        }
    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
    }
}

// Показать уведомление
function showNotification(message, type = 'info') {
    // Удаляем предыдущее уведомление если есть
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                           type === 'error' ? 'exclamation-circle' : 
                           'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Стили для уведомления
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        left: 20px;
        background: ${type === 'success' ? 'rgba(0, 255, 0, 0.1)' : 
                     type === 'error' ? 'rgba(255, 0, 0, 0.1)' : 
                     'rgba(0, 150, 255, 0.1)'};
        border: 1px solid ${type === 'success' ? '#00ff00' : 
                           type === 'error' ? '#ff0000' : 
                           '#0096ff'};
        color: white;
        padding: 15px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 9999;
        backdrop-filter: blur(10px);
        animation: slideIn 0.3s ease;
        font-size: 14px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Добавляем CSS для анимаций уведомлений
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateY(-100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateY(0);
                opacity: 1;
            }
            to {
                transform: translateY(-100%);
                opacity: 0;
            }
        }
        
        .notification i {
            font-size: 18px;
        }
        
        .notification-success i {
            color: #00ff00;
        }
        
        .notification-error i {
            color: #ff0000;
        }
        
        .notification-info i {
            color: #0096ff;
        }
    `;
    document.head.appendChild(style);
}