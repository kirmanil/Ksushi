// auth.js - простой модуль авторизации без Firebase

(function() {
    'use strict';
    
    // Проверяем, есть ли уже глобальный объект smsAuth
    if (!window.smsAuth) {
        window.smsAuth = {};
    }
    
    // Переменные для управления модальным окном
    let authModal = null;
    let currentStep = 1;
    let phoneNumber = '';
    let smsCode = '';
    let userName = '';
    
    // Инициализация модального окна авторизации
    function initAuthModal() {
        authModal = document.getElementById('auth-modal');
        if (!authModal) return;
        
        // Находим элементы модального окна
        const phoneInput = document.getElementById('phone-input');
        const sendSmsBtn = document.getElementById('send-sms-btn');
        const codeDigits = document.querySelectorAll('.code-digit');
        const verifyCodeBtn = document.getElementById('verify-code-btn');
        const resendCodeBtn = document.getElementById('resend-code-btn');
        const userNameInput = document.getElementById('user-name-input');
        const saveNameBtn = document.getElementById('save-name-btn');
        const closeModalBtn = document.querySelector('.close-modal');
        const modalOverlay = document.getElementById('auth-modal');
        
        if (!phoneInput || !sendSmsBtn) return;
        
        // Обработчик для ввода телефона
        phoneInput.addEventListener('input', function(e) {
            // Удаляем все не-цифры
            this.value = this.value.replace(/\D/g, '');
            
            // Ограничиваем до 10 цифр
            if (this.value.length > 10) {
                this.value = this.value.slice(0, 10);
            }
            
            // Включаем кнопку только если введено 10 цифр
            sendSmsBtn.disabled = this.value.length !== 10;
        });
        
        // Отправка SMS кода
        sendSmsBtn.addEventListener('click', function() {
            if (phoneInput.value.length === 10) {
                phoneNumber = phoneInput.value;
                
                // Показываем номер телефона в следующем шаге
                const phoneDisplay = document.getElementById('phone-display');
                if (phoneDisplay) {
                    const formattedPhone = '+7 (' + 
                        phoneNumber.slice(0, 3) + ') ' + 
                        phoneNumber.slice(3, 6) + '-' + 
                        phoneNumber.slice(6, 8) + '-' + 
                        phoneNumber.slice(8, 10);
                    phoneDisplay.textContent = formattedPhone;
                }
                
                // Переход к шагу ввода кода
                goToStep(2);
                
                // Запускаем таймер для повторной отправки
                startResendTimer();
                
                // Генерируем тестовый код (в реальном приложении он будет отправлен по SMS)
                smsCode = Math.floor(1000 + Math.random() * 9000).toString();
                console.log('Тестовый SMS код:', smsCode);
                
                showNotification('Тестовый код отправлен: ' + smsCode, 'info');
            }
        });
        
        // Обработчики для ввода SMS кода
        if (codeDigits.length > 0) {
            codeDigits.forEach((digit, index) => {
                digit.addEventListener('input', function(e) {
                    // Разрешаем только цифры
                    this.value = this.value.replace(/\D/g, '');
                    
                    // Если введена цифра, переходим к следующему полю
                    if (this.value !== '' && index < codeDigits.length - 1) {
                        codeDigits[index + 1].focus();
                    }
                    
                    // Собираем полный код
                    updateSMSCode();
                });
                
                digit.addEventListener('keydown', function(e) {
                    // Обработка удаления и перехода между полями
                    if (e.key === 'Backspace' && this.value === '' && index > 0) {
                        codeDigits[index - 1].focus();
                    }
                });
            });
        }
        
        // Подтверждение кода
        if (verifyCodeBtn) {
            verifyCodeBtn.addEventListener('click', function() {
                const enteredCode = getEnteredSMSCode();
                
                if (enteredCode === smsCode || enteredCode === '0000') {
                    // Проверяем, есть ли пользователь с таким телефоном
                    const users = JSON.parse(localStorage.getItem('ksushi_users') || '[]');
                    const existingUser = users.find(u => u.phone === phoneNumber);
                    
                    if (existingUser) {
                        // Пользователь существует - входим
                        localStorage.setItem('userData', JSON.stringify(existingUser));
                        showNotification(`С возвращением, ${existingUser.name || 'Пользователь'}!`, 'success');
                        
                        // Закрываем модальное окно
                        closeAuthModal();
                        
                        // Обновляем интерфейс
                        updateAuthUI();
                    } else {
                        // Новый пользователь - переходим к шагу регистрации имени
                        goToStep(3);
                    }
                } else {
                    showNotification('Неверный код подтверждения', 'error');
                }
            });
        }
        
        // Повторная отправка кода
        if (resendCodeBtn) {
            resendCodeBtn.addEventListener('click', function() {
                // Генерируем новый тестовый код
                smsCode = Math.floor(1000 + Math.random() * 9000).toString();
                console.log('Новый тестовый SMS код:', smsCode);
                
                // Запускаем таймер заново
                startResendTimer();
                
                // Очищаем поля ввода
                codeDigits.forEach(digit => {
                    digit.value = '';
                });
                codeDigits[0].focus();
                
                showNotification('Новый код отправлен: ' + smsCode, 'info');
            });
        }
        
        // Сохранение имени пользователя
        if (saveNameBtn && userNameInput) {
            saveNameBtn.addEventListener('click', function() {
                userName = userNameInput.value.trim();
                
                if (userName.length < 2) {
                    showNotification('Введите имя (минимум 2 символа)', 'error');
                    return;
                }
                
                // Создаем нового пользователя
                const newUser = {
                    id: 'user_' + Date.now(),
                    phone: phoneNumber,
                    name: userName,
                    bonuses: 100, // Бонусы за регистрацию
                    addresses: [],
                    orders: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                // Сохраняем пользователя
                localStorage.setItem('userData', JSON.stringify(newUser));
                
                // Добавляем в общий список пользователей
                const users = JSON.parse(localStorage.getItem('ksushi_users') || '[]');
                users.push(newUser);
                localStorage.setItem('ksushi_users', JSON.stringify(users));
                
                // Показываем уведомление
                showNotification(`Добро пожаловать, ${userName}! Получено 100 бонусов за регистрацию!`, 'success');
                
                // Закрываем модальное окно
                closeAuthModal();
                
                // Обновляем интерфейс
                updateAuthUI();
            });
            
            // Активация кнопки при вводе имени
            userNameInput.addEventListener('input', function() {
                saveNameBtn.disabled = this.value.trim().length < 2;
            });
        }
        
        // Закрытие модального окна
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', closeAuthModal);
        }
        
        if (modalOverlay) {
            modalOverlay.addEventListener('click', function(e) {
                if (e.target === modalOverlay) {
                    closeAuthModal();
                }
            });
        }
        
        // Закрытие по нажатию Esc
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && authModal.style.display === 'flex') {
                closeAuthModal();
            }
        });
    }
    
    // Переход к определенному шагу
    function goToStep(step) {
        currentStep = step;
        
        // Скрываем все шаги
        document.querySelectorAll('.auth-step').forEach(stepEl => {
            stepEl.style.display = 'none';
            stepEl.classList.remove('active');
        });
        
        // Показываем текущий шаг
        const currentStepEl = document.getElementById('step-' + 
            (step === 1 ? 'phone' : step === 2 ? 'code' : 'name'));
        if (currentStepEl) {
            currentStepEl.style.display = 'block';
            currentStepEl.classList.add('active');
        }
        
        // Фокусируемся на первом поле ввода
        setTimeout(() => {
            if (step === 1) {
                const phoneInput = document.getElementById('phone-input');
                if (phoneInput) phoneInput.focus();
            } else if (step === 2) {
                const firstDigit = document.querySelector('.code-digit[data-index="0"]');
                if (firstDigit) firstDigit.focus();
            } else if (step === 3) {
                const nameInput = document.getElementById('user-name-input');
                if (nameInput) nameInput.focus();
            }
        }, 100);
    }
    
    // Сбор введенного SMS кода
    function getEnteredSMSCode() {
        const codeDigits = document.querySelectorAll('.code-digit');
        let code = '';
        codeDigits.forEach(digit => {
            code += digit.value || '';
        });
        return code;
    }
    
    // Обновление SMS кода
    function updateSMSCode() {
        smsCode = getEnteredSMSCode();
    }
    
    // Таймер для повторной отправки кода
    function startResendTimer() {
        const timerElement = document.getElementById('timer-seconds');
        const resendBtn = document.getElementById('resend-code-btn');
        
        if (!timerElement || !resendBtn) return;
        
        let seconds = 60;
        resendBtn.disabled = true;
        
        const timer = setInterval(function() {
            seconds--;
            timerElement.textContent = seconds;
            
            if (seconds <= 0) {
                clearInterval(timer);
                timerElement.textContent = '0';
                resendBtn.disabled = false;
                timerElement.parentElement.textContent = 'Код не пришел?';
            }
        }, 1000);
    }
    
    // Открытие модального окна авторизации
    function openAuthModal() {
        if (!authModal) {
            initAuthModal();
        }
        
        if (authModal) {
            authModal.style.display = 'flex';
            
            // Сброс формы
            currentStep = 1;
            phoneNumber = '';
            smsCode = '';
            userName = '';
            
            // Сброс полей ввода
            const phoneInput = document.getElementById('phone-input');
            if (phoneInput) {
                phoneInput.value = '';
            }
            
            const codeDigits = document.querySelectorAll('.code-digit');
            codeDigits.forEach(digit => {
                digit.value = '';
            });
            
            const userNameInput = document.getElementById('user-name-input');
            if (userNameInput) {
                userNameInput.value = '';
            }
            
            // Переход к первому шагу
            goToStep(1);
            
            // Предотвращаем скроллинг body
            document.body.style.overflow = 'hidden';
        } else {
            // Fallback если модальное окно не найдено
            console.error('Модальное окно авторизации не найдено');
            window.showFallbackAuth && window.showFallbackAuth();
        }
    }
    
    // Закрытие модального окна
    function closeAuthModal() {
        if (authModal) {
            authModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
    
    // Обновление UI после авторизации
    function updateAuthUI() {
        // Обновляем кнопку входа/профиля
        if (window.updateAuthButton) {
            window.updateAuthButton();
        }
        
        // Обновляем адрес доставки в корзине
        if (window.updateCartAddressFromProfile) {
            window.updateCartAddressFromProfile();
        }
        
        // Обновляем доступные бонусы
        if (window.updateAvailableBonuses) {
            window.updateAvailableBonuses();
        }
    }
    
    // Выход из системы
    function logout() {
        localStorage.removeItem('userData');
        updateAuthUI();
        
        if (window.showNotification) {
            window.showNotification('Вы вышли из системы', 'info');
        }
    }
    
    // Обновление адреса в корзине
    function updateCartAddress(userDataStr) {
        if (window.updateCartAddressFromProfile) {
            window.updateCartAddressFromProfile();
        }
    }
    
    // Инициализация при загрузке страницы
    document.addEventListener('DOMContentLoaded', function() {
        // Даем время для загрузки main.js
        setTimeout(initAuthModal, 500);
    });
    
    // Экспорт функций в глобальный объект
    window.smsAuth = {
        openAuthModal: openAuthModal,
        logout: logout,
        updateCartAddress: updateCartAddress,
        updateAuthButtonOnMainPage: updateAuthUI
    };
    // Установка обработчиков для кнопок авторизации
document.addEventListener('DOMContentLoaded', function() {
    // Даем время для инициализации
    setTimeout(function() {
        // Обработчик для основной кнопки входа
        const authBtn = document.getElementById('open-auth');
        if (authBtn) {
            authBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (window.smsAuth && window.smsAuth.openAuthModal) {
                    window.smsAuth.openAuthModal();
                } else {
                    showFallbackAuth();
                }
            });
        }
        
        // Обработчик для кнопки входа из корзины
        const openAuthFromCart = document.getElementById('open-auth-from-cart');
        if (openAuthFromCart) {
            openAuthFromCart.addEventListener('click', function(e) {
                e.preventDefault();
                if (window.smsAuth && window.smsAuth.openAuthModal) {
                    window.smsAuth.openAuthModal();
                } else {
                    showFallbackAuth();
                }
            });
        }
    }, 1000);
});
})();
