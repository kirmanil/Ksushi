import { 
    auth, db, RecaptchaVerifier, signInWithPhoneNumber,
    collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs 
} from './firebase-config.js';

class SMSAuth {
    constructor() {
        this.currentPhone = null;
        this.confirmationResult = null;
        this.recaptchaVerifier = null;
    }

    // Обновите метод sendSMSCode
    async sendSMSCode() {
        const phoneInput = document.getElementById('phone-input');
        if (!phoneInput) return;
        
        const phone = phoneInput.value.replace(/\D/g, '');
        
        if (!phone || phone.length !== 10) {
            this.showNotification('Введите корректный номер телефона (10 цифр)', 'error');
            phoneInput.focus();
            return;
        }
        
        this.currentPhone = phone;
        const formattedPhone = `+7${phone}`;
        
        try {
            const sendBtn = document.getElementById('send-sms-btn');
            if (sendBtn) {
                sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
                sendBtn.disabled = true;
            }
            
            // Настройка reCAPTCHA
            if (!this.recaptchaVerifier) {
                this.recaptchaVerifier = new RecaptchaVerifier('send-sms-btn', {
                    'size': 'invisible',
                    'callback': (response) => {
                        // reCAPTCHA решена, можно отправлять SMS
                    }
                }, auth);
            }
            
            // Отправка SMS через Firebase
            this.confirmationResult = await signInWithPhoneNumber(
                auth, 
                formattedPhone, 
                this.recaptchaVerifier
            );
            
            if (sendBtn) {
                sendBtn.textContent = 'Получить код';
                sendBtn.disabled = false;
            }
            
            this.showStep('step-code');
            
            const phoneDisplay = document.getElementById('phone-display');
            if (phoneDisplay) {
                phoneDisplay.textContent = this.formatPhoneDisplay(phone);
            }
            
            this.startTimer();
            
            setTimeout(() => {
                const firstCodeInput = document.querySelector('.code-digit');
                if (firstCodeInput) firstCodeInput.focus();
            }, 300);
            
        } catch (error) {
            console.error('Ошибка отправки SMS:', error);
            
            if (sendBtn) {
                sendBtn.textContent = 'Получить код';
                sendBtn.disabled = false;
            }
            
            let errorMessage = 'Ошибка отправки SMS';
            if (error.code === 'auth/invalid-phone-number') {
                errorMessage = 'Неверный номер телефона';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Слишком много запросов. Попробуйте позже';
            }
            
            this.showNotification(errorMessage, 'error');
        }
    }

    // Обновите метод verifyCode
    async verifyCode() {
        const codeDigits = document.querySelectorAll('.code-digit');
        const enteredCode = Array.from(codeDigits).map(input => input.value).join('');
        
        if (enteredCode.length !== 6) {
            this.showNotification('Введите все 6 цифр кода', 'error');
            return;
        }
        
        try {
            // Подтверждаем код
            const result = await this.confirmationResult.confirm(enteredCode);
            const user = result.user;
            
            this.clearTimer();
            
            // Проверяем, есть ли пользователь в Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            
            if (userDoc.exists()) {
                // Пользователь существует
                const userData = userDoc.data();
                await this.loginUser(user.uid, userData);
            } else {
                // Новый пользователь
                this.showStep('step-name');
                setTimeout(() => {
                    const nameInput = document.getElementById('user-name-input');
                    if (nameInput) nameInput.focus();
                }, 300);
            }
            
        } catch (error) {
            console.error('Ошибка верификации кода:', error);
            this.showNotification('Неверный код', 'error');
        }
    }

    // Обновите метод saveUserName
    async saveUserName() {
        const nameInput = document.getElementById('user-name-input');
        if (!nameInput) return;
        
        const name = nameInput.value.trim();
        
        if (!name || name.length < 2) {
            this.showNotification('Имя должно содержать минимум 2 символа', 'error');
            nameInput.focus();
            return;
        }
        
        const currentUser = auth.currentUser;
        if (!currentUser) {
            this.showNotification('Ошибка авторизации', 'error');
            return;
        }
        
        try {
            // Создаем нового пользователя в Firestore
            const newUser = {
                id: currentUser.uid,
                phone: this.currentPhone,
                name: name,
                email: null,
                addresses: [],
                orders: [],
                bonuses: 0,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                welcomeBonusGiven: false
            };
            
            await setDoc(doc(db, 'users', currentUser.uid), newUser);
            
            await this.loginUser(currentUser.uid, newUser);
            
        } catch (error) {
            console.error('Ошибка создания пользователя:', error);
            this.showNotification('Ошибка создания профиля', 'error');
        }
    }

    // Обновите метод loginUser
    async loginUser(userId, userData) {
        // Обновляем время последнего входа
        await updateDoc(doc(db, 'users', userId), {
            lastLogin: new Date().toISOString()
        });
        
        // Сохраняем в localStorage
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('userId', userId);
        
        this.closeModal();
        
        this.updateAuthButtonOnMainPage(localStorage.getItem('userData'));
        this.updateCartAddress(localStorage.getItem('userData'));
        
        this.showNotification(`Добро пожаловать, ${userData.name}!`, 'success');
        
        if (window.location.pathname.includes('profile.html')) {
            setTimeout(() => window.location.reload(), 500);
        }
    }
}

    // Обновление адреса в корзине
    updateCartAddress(userData) {
        const addressElement = document.getElementById('cart-delivery-address');
        if (!addressElement) return;
        
        if (userData) {
            try {
                const user = JSON.parse(userData);
                
                if (user.addresses && user.addresses.length > 0) {
                    const defaultAddress = user.addresses.find(addr => addr.isDefault);
                    if (defaultAddress) {
                        addressElement.innerHTML = `
                            <strong>${defaultAddress.title}</strong><br>
                            ${defaultAddress.fullAddress}
                        `;
                        addressElement.classList.remove('address-notice');
                        return;
                    }
                }
                
                // Если нет адреса, показываем ссылку на профиль
                addressElement.innerHTML = '<a href="profile.html">Добавить адрес доставки</a>';
                addressElement.classList.add('address-notice');
                
            } catch (e) {
                console.error('Ошибка загрузки адреса:', e);
                addressElement.innerHTML = '<a href="profile.html">Добавить адрес доставки</a>';
                addressElement.classList.add('address-notice');
            }
        } else {
            // Пользователь не авторизован
            addressElement.innerHTML = '<a href="#" id="open-auth-from-cart">Войдите для выбора адреса</a>';
            addressElement.classList.add('address-notice');
            
            // Добавляем обработчик для кнопки входа
            const loginLink = document.getElementById('open-auth-from-cart');
            if (loginLink) {
                loginLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.openAuthModal();
                });
            }
        }
    }

    // Привязка событий
    bindEvents() {
        // Открытие модалки авторизации (главная страница)
        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'open-auth') {
                e.preventDefault();
                this.openAuthModal();
            }
            
            if (e.target && e.target.closest('#open-auth')) {
                e.preventDefault();
                this.openAuthModal();
            }
        });

        // Открытие модалки авторизации из корзины
        const openAuthFromCart = document.getElementById('open-auth-from-cart');
        if (openAuthFromCart) {
            openAuthFromCart.addEventListener('click', (e) => {
                e.preventDefault();
                this.openAuthModal();
            });
        }

        // Кнопка отправки SMS
        const sendSmsBtn = document.getElementById('send-sms-btn');
        if (sendSmsBtn) {
            sendSmsBtn.addEventListener('click', () => {
                this.sendSMSCode();
            });
        }

        // Кнопка подтверждения кода
        const verifyCodeBtn = document.getElementById('verify-code-btn');
        if (verifyCodeBtn) {
            verifyCodeBtn.addEventListener('click', () => {
                this.verifyCode();
            });
        }

        // Кнопка повторной отправки кода
        const resendCodeBtn = document.getElementById('resend-code-btn');
        if (resendCodeBtn) {
            resendCodeBtn.addEventListener('click', () => {
                this.resendCode();
            });
        }

        // Кнопка сохранения имени
        const saveNameBtn = document.getElementById('save-name-btn');
        if (saveNameBtn) {
            saveNameBtn.addEventListener('click', () => {
                this.saveUserName();
            });
        }

        // Закрытие модалки
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal();
            });
        });

        // Автопереход между полями кода
        this.setupCodeInput();
        
        // Enter в поле телефона
        const phoneInput = document.getElementById('phone-input');
        if (phoneInput) {
            phoneInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendSMSCode();
                }
            });
        }
        
        // Enter в поле имени
        const nameInput = document.getElementById('user-name-input');
        if (nameInput) {
            nameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.saveUserName();
                }
            });
        }
    }

    // Открытие модального окна авторизации
    openAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (!modal) return;
        
        modal.classList.add('active');
        this.showStep('step-phone');
        
        // Сброс формы
        const phoneInput = document.getElementById('phone-input');
        if (phoneInput) phoneInput.value = '';
        
        document.querySelectorAll('.code-digit').forEach(input => input.value = '');
        
        const nameInput = document.getElementById('user-name-input');
        if (nameInput) nameInput.value = '';
        
        // Фокус на поле телефона
        setTimeout(() => {
            if (phoneInput) phoneInput.focus();
        }, 300);
    }

    // Закрытие модального окна
    closeModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.classList.remove('active');
        }
        this.clearTimer();
    }

    // Переключение шагов
    showStep(stepId) {
        document.querySelectorAll('.auth-step').forEach(step => {
            step.classList.remove('active');
            step.style.display = 'none';
        });
        
        const step = document.getElementById(stepId);
        if (step) {
            step.classList.add('active');
            step.style.display = 'block';
        }
    }

    // Отправка SMS кода
    async sendSMSCode() {
        const phoneInput = document.getElementById('phone-input');
        if (!phoneInput) return;
        
        const phone = phoneInput.value.replace(/\D/g, '');
        
        // Валидация номера
        if (!phone || phone.length !== 10) {
            this.showNotification('Введите корректный номер телефона (10 цифр)', 'error');
            phoneInput.focus();
            return;
        }
        
        // Сохраняем номер
        this.currentPhone = phone;
        const formattedPhone = `+7${phone}`;
        localStorage.setItem('userData', JSON.stringify(userData));

// Обновляем UI на главной странице
if (window.updateAuthUI) {
    window.updateAuthUI();
}

// Также обновляем корзину
if (window.updateCartAddressUI) {
    window.updateCartAddressUI();
}

// Закрываем модалку
closeAuthModal();
        
        // Генерируем случайный 4-значный код
        this.code = Math.floor(1000 + Math.random() * 9000).toString();
        
        try {
            // Показываем загрузку
            const sendBtn = document.getElementById('send-sms-btn');
            if (sendBtn) {
                const originalText = sendBtn.textContent;
                sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
                sendBtn.disabled = true;
            }
            
            // Отправка SMS (демо-режим)
            await this.sendSMS(formattedPhone, `Код подтверждения: ${this.code}`);
            
            // Восстанавливаем кнопку
            if (sendBtn) {
                sendBtn.textContent = 'Получить код';
                sendBtn.disabled = false;
            }
            
            // Сохраняем код для верификации
            localStorage.setItem('tempSMSCode', this.code);
            localStorage.setItem('tempPhone', phone);
            
            // Переходим к шагу ввода кода
            this.showStep('step-code');
            
            // Обновляем отображение номера
            const phoneDisplay = document.getElementById('phone-display');
            if (phoneDisplay) {
                phoneDisplay.textContent = this.formatPhoneDisplay(phone);
            }
            
            // Запускаем таймер
            this.startTimer();
            
            // Фокус на первое поле кода
            setTimeout(() => {
                const firstCodeInput = document.querySelector('.code-digit');
                if (firstCodeInput) firstCodeInput.focus();
            }, 300);
            
            // Для тестирования - показываем код
            console.log(`Демо-режим. Код для ${formattedPhone}: ${this.code}`);
            
        } catch (error) {
            console.error('Ошибка отправки SMS:', error);
            
            // В демо-режиме все равно переходим к вводу кода
            localStorage.setItem('tempSMSCode', '1234');
            localStorage.setItem('tempPhone', phone);
            
            this.showStep('step-code');
            
            const phoneDisplay = document.getElementById('phone-display');
            if (phoneDisplay) {
                phoneDisplay.textContent = this.formatPhoneDisplay(phone);
            }
            
            this.startTimer();
            
            // Восстанавливаем кнопку при ошибке
            const sendBtn = document.getElementById('send-sms-btn');
            if (sendBtn) {
                sendBtn.textContent = 'Получить код';
                sendBtn.disabled = false;
            }
        }
    }

    // Отправка SMS (упрощенная версия для демо)
    async sendSMS(phone, message) {
        // Демо-режим - имитируем отправку
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Всегда успешно в демо-режиме
        return {
            status: 'OK',
            sms_id: 'demo_' + Date.now()
        };
    }

    // Верификация кода
    verifyCode() {
        const codeDigits = document.querySelectorAll('.code-digit');
        const enteredCode = Array.from(codeDigits).map(input => input.value).join('');
        
        // В демо-режиме принимаем любой 4-значный код или 1234
        let isValid = false;
        
        if (enteredCode.length === 4) {
            // В демо-режиме проверяем сохраненный код или 1234
            const savedCode = localStorage.getItem('tempSMSCode') || '1234';
            if (enteredCode === savedCode || enteredCode === '1234') {
                isValid = true;
            }
        }
        
        if (!isValid) {
            this.showNotification('Введите все 4 цифры кода', 'error');
            return;
        }
        
        // Код верный
        this.clearTimer();
        
        // Проверяем, есть ли пользователь в системе
        const phone = localStorage.getItem('tempPhone');
        const existingUser = this.getUserByPhone(phone);
        
        if (existingUser) {
            // Пользователь существует - входим
            this.loginUser(existingUser);
        } else {
            // Новый пользователь - запрашиваем имя
            this.showStep('step-name');
            setTimeout(() => {
                const nameInput = document.getElementById('user-name-input');
                if (nameInput) nameInput.focus();
            }, 300);
        }
    }

    // Повторная отправка кода
    resendCode() {
        const resendBtn = document.getElementById('resend-code-btn');
        if (resendBtn && resendBtn.disabled) return;
        
        this.sendSMSCode();
    }

    // Сохранение имени пользователя
    saveUserName() {
        const nameInput = document.getElementById('user-name-input');
        if (!nameInput) return;
        
        const name = nameInput.value.trim();
        
        if (!name) {
            this.showNotification('Введите ваше имя', 'error');
            nameInput.focus();
            return;
        }
        
        if (name.length < 2) {
            this.showNotification('Имя должно содержать минимум 2 символа', 'error');
            nameInput.focus();
            return;
        }
        
        const phone = localStorage.getItem('tempPhone');
        
        // Создаем нового пользователя
        const newUser = {
            id: Date.now(),
            phone: phone,
            name: name,
            email: null,
            addresses: [],
            orders: [],
            bonuses: 0, // Начинаем с 0 бонусов
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            welcomeBonusGiven: false
        };
        
        // Сохраняем пользователя
        this.saveUser(newUser);
        
        // Входим под новым пользователем
        this.loginUser(newUser);
    }

    // Получение пользователя по телефону
    getUserByPhone(phone) {
        try {
            const users = JSON.parse(localStorage.getItem('ksushi_users')) || [];
            return users.find(user => user.phone === phone);
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    // Сохранение пользователя
    saveUser(user) {
        try {
            let users = JSON.parse(localStorage.getItem('ksushi_users')) || [];
            
            // Удаляем старую запись, если есть
            users = users.filter(u => u.phone !== user.phone);
            
            // Добавляем нового пользователя
            users.push(user);
            
            // Сохраняем
            localStorage.setItem('ksushi_users', JSON.stringify(users));
            
        } catch (error) {
            console.error('Error saving user:', error);
        }
    }

    // Вход пользователя
    loginUser(user) {
        // Обновляем время последнего входа
        user.lastLogin = new Date().toISOString();
        this.saveUser(user);
        
        // Сохраняем текущего пользователя
        localStorage.setItem('userData', JSON.stringify(user));
        
        // Очищаем временные данные
        localStorage.removeItem('tempSMSCode');
        localStorage.removeItem('tempPhone');
        
        // Закрываем модалку
        this.closeModal();
        
        // Обновляем интерфейс на главной странице
        this.updateAuthButtonOnMainPage(localStorage.getItem('userData'));
        
        // Обновляем адрес в корзине
        this.updateCartAddress(localStorage.getItem('userData'));
        
        // Показываем приветствие
        this.showNotification(`Добро пожаловать, ${user.name}!`, 'success');
        
        // Если мы на странице профиля, перезагружаем ее
        if (window.location.pathname.includes('profile.html')) {
            setTimeout(() => window.location.reload(), 500);
        }
    }

    // Выход из системы
    logout() {
        localStorage.removeItem('userData');
        
        // Обновляем кнопку на главной странице
        this.updateAuthButtonOnMainPage(null);
        
        // Сбрасываем адрес в корзине
        this.updateCartAddress(null);
        
        this.showNotification('Вы вышли из системы', 'info');
        
        // Если на странице профиля - перезагружаем
        if (window.location.pathname.includes('profile.html')) {
            setTimeout(() => window.location.reload(), 500);
        }
    }

    // Запуск таймера для повторной отправки кода
    startTimer() {
        this.clearTimer();
        this.timerSeconds = 60;
        
        const timerElement = document.getElementById('timer-seconds');
        const resendBtn = document.getElementById('resend-code-btn');
        
        if (timerElement) timerElement.textContent = this.timerSeconds;
        if (resendBtn) {
            resendBtn.disabled = true;
            resendBtn.style.opacity = '0.5';
            resendBtn.style.cursor = 'not-allowed';
        }
        
        this.timerInterval = setInterval(() => {
            this.timerSeconds--;
            
            if (timerElement) timerElement.textContent = this.timerSeconds;
            
            if (this.timerSeconds <= 0) {
                this.clearTimer();
                if (resendBtn) {
                    resendBtn.disabled = false;
                    resendBtn.style.opacity = '1';
                    resendBtn.style.cursor = 'pointer';
                }
            }
        }, 1000);
    }

    // Очистка таймера
    clearTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    // Настройка автоматического перехода между полями кода
    setupCodeInput() {
        const codeInputs = document.querySelectorAll('.code-digit');
        
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
                            this.verifyCode();
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

    // Вспомогательные методы
    formatPhoneDisplay(phone) {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length !== 10) return phone;
        
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{2})(\d{2})$/);
        if (!match) return phone;
        
        return `+7 (${match[1]}) ${match[2]}-${match[3]}-${match[4]}`;
    }

    showNotification(message, type = 'info') {
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                               type === 'error' ? 'exclamation-circle' : 
                               'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Удаляем через 3 секунды
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const smsAuth = new SMSAuth();
    smsAuth.init();
    window.smsAuth = smsAuth;
});