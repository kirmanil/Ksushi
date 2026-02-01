let products = {};
let promoCodes = {};
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let activePromo = localStorage.getItem('activePromo') || null;
let usedBonuses = parseInt(localStorage.getItem('usedBonuses')) || 0;
let deliveryPrice = 0;

// Функция для открытия авторизации
function openAuthModal() {
    if (window.openAuthModal) {
        // Используем функцию из main.js
        window.openAuthModal();
    } else if (window.smsAuth && window.smsAuth.openAuthModal) {
        window.smsAuth.openAuthModal();
    } else {
        // Fallback
        showNotification('Авторизация временно недоступна', 'error');
    }
}

// Инициализация
// Инициализация
document.addEventListener('DOMContentLoaded', async function() {
    // Загружаем данные из базы
    await loadDataFromDatabase();
    
    initBannerSlider();
    loadProducts();
    updateCartCount();
    setupCart();
    setupOrderButtons();
    
    // Загрузка сохраненного адреса
    loadSavedAddress();
    
    // Обновляем кнопку входа/профиля
    updateAuthButton();
    
    // Обновляем адрес в корзине из профиля
    updateCartAddressFromProfile();
    
    // Инициализация промокодов и бонусов
    updateAvailableBonuses();
    updateActivePromoDisplay();
    updatePricing();
    
    // Загрузка сохраненных промокодов и бонусов
    loadSavedPromoAndBonuses();
    
    // Установка обработчиков событий
    setupPromoHandlers();
    setupBonusesHandlers();
    
    // Настраиваем обработчики для кнопок входа
    setupAuthButtons();
    
    // Показываем подсказку о промокоде
    setTimeout(showPromoHint, 1000);
});
// Настройка кнопок авторизации
function setupAuthButtons() {
    // Кнопка входа в шапке
    const authBtn = document.getElementById('open-auth');
    if (authBtn) {
        authBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openAuthModal();
        });
    }
    
    // Кнопка входа из корзины (если пользователь не авторизован)
    const openAuthFromCart = document.getElementById('open-auth-from-cart');
    if (openAuthFromCart) {
        openAuthFromCart.addEventListener('click', function(e) {
            e.preventDefault();
            openAuthModal();
        });
    }
    
    // Кнопки входа на других страницах
    document.querySelectorAll('.auth-btn, .login-btn, [data-action="login"]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            openAuthModal();
        });
    });
}

// Загрузка данных из базы
async function loadDataFromDatabase() {
    try {
        if (window.database) {
            console.log('Database: Загрузка данных из облачной базы...');
            
            // Загружаем всю базу данных
            const dbData = await database.loadDatabase();
            
            // Загружаем продукты
            if (dbData.products && dbData.products.length > 0) {
                // Преобразуем массив продуктов в объект по категориям
                products = {};
                dbData.products.forEach(product => {
                    if (!products[product.category]) {
                        products[product.category] = [];
                    }
                    products[product.category].push(product);
                });
                console.log('Database: Продукты загружены из облака');
            } else {
                // Используем локальные продукты как fallback
                loadLocalProducts();
            }
            
            // Загружаем промокоды
            if (dbData.promocodes && dbData.promocodes.length > 0) {
                // Преобразуем массив промокодов в объект
                promoCodes = {};
                dbData.promocodes.forEach(promo => {
                    promoCodes[promo.code] = promo;
                });
                console.log('Database: Промокоды загружены из облака');
            } else {
                // Используем локальные промокоды как fallback
                loadLocalPromoCodes();
            }
            
            console.log('Database: Данные успешно загружены');
        } else {
            console.log('Database: Используем локальные данные');
            loadLocalProducts();
            loadLocalPromoCodes();
        }
    } catch (error) {
        console.error('Ошибка загрузки данных из базы:', error);
        loadLocalProducts();
        loadLocalPromoCodes();
    }
}

// Загрузка локальных продуктов
function loadLocalProducts() {
    products = {
        new: [
        {
            id: 1,
            name: "Суши бургер",
            description: "Креветка, оругец, икра тобико, кунжут, соус терияки",
            price: 420,
            rating: 4.9,
            image: "images/products/burger.png",
            category: "rolls",
            isNew: true
        },
        {
            id: 2,
            name: "Красный Дракон",
            description: "Угорь, креветка, соус унаги, красная икра",
            price: 380,
            rating: 4.8,
            image: "images/products/red-dragon.png",
            category: "rolls",
            isNew: true
        },
        {
            id: 3,
            name: "Черный Самурай",
            description: "Тунец, авокадо, черный кунжут, острый соус",
            price: 560,
            rating: 4.7,
            image: "images/products/black-samurai.png",
            category: "sets",
            isNew: true
        }
    ],
    
    rolls: [
        { id: 4, name: "Филадельфия", description: "Сливочный сыр, огурец, лосось", price: 440, rating: 4.9, image: "images/products/filadelfia.png", category: "rolls" },
        { id: 5, name: "Калифорния", description: "Им. снежного краба, авокадо, сливочный сыр, икра тобико", price: 380, rating: 4.8, image: "images/products/california.png", category: "rolls" },
        { id: 6, name: "Лава Эби", description: "Креветка, соус лава, сливочный сыр", price: 420, rating: 4.9, image: "images/products/lava.png", category: "rolls" },
        { id: 7, name: "Маки", description: "Лосось, Огурец,", price: 320, rating: 4.7, image: "images/products/maki.png", category: "rolls" },
        { id: 22, name: "Эби темпура", description: "Огурец,сливочный сыр,креветка,спайси соус", price: 340, rating: 4.9, image: "images/products/ebitem.png", category: "rolls" },
        { id: 23, name: "Унаги темпура", description: "сыр креметте, угорь, огурец, соус унаги, кунжут.", price: 410, rating: 4.9, image: "images/products/ytem.png", category: "rolls" }
    ],
    
    sushi: [
        { id: 8, name: "сяке", description: "Лосось", price: 80, rating: 4.7, image: "images/products/ci.png", category: "sushi" },
        { id: 9, name: "Унаги", description: "Угорь", price: 90, rating: 4.8, image: "images/products/yn.png", category: "sushi" },
        { id: 10, name: "Эби", description: "Креветка", price: 100, rating: 4.9, image: "images/products/eb.png", category: "sushi" }
    ],
    
    onigiri: [
        { id: 11, name: "Онигири Лосось", description: "лосось", price: 150, rating: 4.5, image: "images/products/on.png", category: "onigiri" },
        { id: 12, name: "Онигири Креветка", description: "креветка", price: 180, rating: 4.6, image: "images/products/on.png", category: "onigiri" }
    ],
    
    sets: [
        { id: 13, name: "Набор печь", description: "40 шт: запеченные роллы", price: 2200, rating: 4.8, image: "images/products/temp.png", category: "sets" },
        { id: 14, name: "Набор темпура", description: "24 шт: темпура роллы", price: 1499, rating: 4.9, image: "images/products/temp1.png", category: "sets" },
        { id: 15, name: "Набор Классика", description: "32 шт: классические роллы", price: 1000, rating: 4.6, image: "images/products/class.png", category: "sets" }
    ],
    
    drinks: [
        { 
            id: 16, 
            name: "Coca-Cola Black", 
            description: "Газированный напиток", 
            basePrice: 120, 
            price: 120,
            rating: 4.8, 
            image: "images/products/coca.png", 
            category: "drinks",
            variants: [
                { volume: "0.5 л", price: 120 },
                { volume: "1 л", price: 200 },
                { volume: "1.5 л", price: 250 }
            ],
            currentVariant: 0
        },
        { 
            id: 17, 
            name: "Sprite", 
            description: "Газированный напиток", 
            basePrice: 120, 
            price: 120,
            rating: 4.5, 
            image: "images/products/sprite.png", 
            category: "drinks",
            variants: [
                { volume: "0.5 л", price: 120 },
                { volume: "1 л", price: 200 },
                { volume: "1.5 л", price: 250 }
            ],
            currentVariant: 0
        },
        { 
            id: 18, 
            name: "Милк-шейк", 
            description: "Молочный коктель со вкусом карамели", 
            basePrice: 250, 
            price: 250,
            rating: 4.9, 
            image: "images/products/mikls.png", 
            category: "drinks",
            variants: [
                { volume: "300 мл", price: 250 },
                { volume: "500 мл", price: 350 },
                { volume: "750 мл", price: 450 }
            ],
            currentVariant: 0
        }
    ],
    
    fastfood: [
        { 
            id: 19, 
            name: "Картофель Фри", 
            description: "Хрустящий картофель фри", 
            basePrice: 150, 
            price: 150,
            rating: 4.7, 
            image: "images/products/free.png", 
            category: "fastfood",
            variants: [
                { weight: "150 г", price: 150 },
                { weight: "250 г", price: 200 },
                { weight: "350 г", price: 250 }
            ],
            currentVariant: 0
        },
        { 
            id: 20, 
            name: "Наггетсы Куриные", 
            description: "Куриные наггетсы", 
            basePrice: 180, 
            price: 180,
            rating: 4.7, 
            image: "images/products/nagg.png", 
            category: "fastfood",
            variants: [
                { weight: "150 г", price: 180 },
                { weight: "250 г", price: 250 },
                { weight: "350 г", price: 300 }
            ],
            currentVariant: 0
        },
        { 
            id: 21, 
            name: "Луковые кольца", 
            description: "Хрустящие луковые кольца", 
            basePrice: 120, 
            price: 120,
            rating: 4.5, 
            image: "images/products/luk.png", 
            category: "fastfood",
            variants: [
                { weight: "150 г", price: 120 },
                { weight: "250 г", price: 180 },
                { weight: "350 г", price: 230 }
            ],
            currentVariant: 0
        }
    ]
};
}

// Загрузка локальных промокодов
function loadLocalPromoCodes() {
    promoCodes = {
        'KSUSHI20': { 
            code: 'KSUSHI20',
            discount: 20, 
            type: 'percent', 
            minOrder: 0, 
            name: "Скидка 20% на первый заказ",
            description: "Действует только для первого заказа каждого пользователя",
            oneTime: true 
        },
        'FREEDELIVERY': { 
            code: 'FREEDELIVERY',
            discount: 100, 
            type: 'fixed', 
            minOrder: 1500, 
            name: "Бесплатная доставка",
            description: "Скидка 100₽ на доставку (эквивалент бесплатной доставки)",
            oneTime: false 
        },
        'WELCOME10': { 
            code: 'WELCOME10',
            discount: 10, 
            type: 'percent', 
            minOrder: 500, 
            name: "Приветственная скидка 10%",
            description: "Для новых пользователей",
            oneTime: true 
        },
        'HAPPY2026': { 
            code: 'HAPPY2026',
            discount: 15, 
            type: 'percent', 
            minOrder: 1000, 
            name: "Скидка 15% к 2026 году",
            description: "Праздничная скидка",
            oneTime: false 
        },
        'SUMMER25': { 
            code: 'SUMMER25',
            discount: 25, 
            type: 'percent', 
            minOrder: 2000, 
            name: "Летняя скидка 25%",
            description: "Специальное летнее предложение",
            oneTime: false 
        }
    };
}

// Оформление заказа с сохранением в облако
async function processCheckout() {
    try {
        // Проверяем авторизацию
        const userData = localStorage.getItem('userData');
        if (!userData) {
            showNotification('Для оформления заказа войдите в систему', 'info');
            openCart();
            if (window.smsAuth && window.smsAuth.openAuthModal) {
                window.smsAuth.openAuthModal();
            }
            return;
        }
        
        // Проверяем, что корзина не пуста
        if (cart.length === 0) {
            showNotification('Корзина пуста', 'error');
            return;
        }
        
        const user = JSON.parse(userData);
        
        // Получаем свежие данные пользователя из базы данных
        let freshUser;
        if (window.database) {
            freshUser = await database.getUserByPhone(user.phone);
        }
        
        // Если не нашли в базе, ищем в localStorage
        if (!freshUser) {
            const users = JSON.parse(localStorage.getItem('ksushi_users') || '[]');
            const userIndex = users.findIndex(u => u.id === user.id || u.phone === user.phone);
            freshUser = users[userIndex];
        }
        
        if (!freshUser) {
            showNotification('Пользователь не найден', 'error');
            return;
        }
        
        // Проверяем адрес доставки
        if (!freshUser.addresses || freshUser.addresses.length === 0) {
            showNotification('Добавьте адрес доставки в профиле', 'error');
            return;
        }
        
        const defaultAddress = freshUser.addresses.find(addr => addr.isDefault);
        if (!defaultAddress) {
            showNotification('Выберите основной адрес доставки в профиле', 'error');
            return;
        }
        
        // Рассчитываем финальную сумму
        const subtotal = calculateSubtotal();
        let total = subtotal + deliveryPrice;
        
        // Применяем скидку по промокоду
        let promoDiscount = 0;
        if (activePromo) {
            const promo = promoCodes[activePromo];
            if (promo) {
                if (promo.type === 'percent') {
                    promoDiscount = Math.round(subtotal * (promo.discount / 100));
                } else {
                    promoDiscount = promo.discount;
                }
                total -= promoDiscount;
            }
        }
        
        // Вычитаем использованные бонусы
        total -= usedBonuses;
        if (total < 0) total = 0;
        
        // Создаем заказ
        const order = {
            userId: freshUser.id,
            date: new Date().toISOString(),
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image,
                variantLabel: item.variantLabel || null
            })),
            subtotal: subtotal,
            delivery: deliveryPrice,
            promoDiscount: promoDiscount,
            bonusesUsed: usedBonuses,
            total: total,
            address: {
                ...defaultAddress,
                title: defaultAddress.title || 'Основной адрес'
            },
            status: 'new',
            paymentMethod: 'cash',
            userName: freshUser.name,
            userPhone: freshUser.phone,
            promoCode: activePromo,
            createdAt: new Date().toISOString(),
            id: 'ORD' + Date.now() + Math.floor(Math.random() * 1000)
        };
        
        // Если использовался промокод, отмечаем его как использованный
        if (activePromo) {
            const promo = promoCodes[activePromo];
            if (promo && promo.oneTime) {
                const usedPromos = JSON.parse(localStorage.getItem('usedPromos') || '{}');
                if (!usedPromos[freshUser.phone]) {
                    usedPromos[freshUser.phone] = [];
                }
                if (!usedPromos[freshUser.phone].includes(activePromo)) {
                    usedPromos[freshUser.phone].push(activePromo);
                    localStorage.setItem('usedPromos', JSON.stringify(usedPromos));
                }
            }
        }
        
        // Рассчитываем новые бонусы
        const earnedBonuses = Math.floor(total * 0.05);
        const newBonuses = (freshUser.bonuses || 0) - usedBonuses + earnedBonuses;
        
        // Обновляем пользователя
        freshUser.bonuses = newBonuses;
        freshUser.lastOrder = new Date().toISOString();
        freshUser.orders = freshUser.orders || [];
        freshUser.orders.unshift(order.id);
        freshUser.updatedAt = new Date().toISOString();
        
        // Показываем уведомление о начале оформления
        showNotification('Оформляем заказ...', 'info');
        
        // Сохраняем пользователя в базу данных
        let userSaveSuccess = false;
        if (window.database) {
            userSaveSuccess = await database.saveUser(freshUser);
            console.log('Database: Пользователь сохранен в облако');
        } else {
            // Резервное сохранение в localStorage
            const users = JSON.parse(localStorage.getItem('ksushi_users') || '[]');
            const userIndex = users.findIndex(u => u.phone === freshUser.phone);
            if (userIndex !== -1) {
                users[userIndex] = freshUser;
            } else {
                users.push(freshUser);
            }
            localStorage.setItem('ksushi_users', JSON.stringify(users));
            userSaveSuccess = true;
        }
        
        if (!userSaveSuccess) {
            showNotification('Ошибка сохранения данных пользователя', 'error');
            return;
        }
        
        // Сохраняем заказ в базу данных
        let orderSaveSuccess = false;
        if (window.database) {
            orderSaveSuccess = await database.saveOrder(order);
            console.log('Database: Заказ сохранен в облако');
        } else {
            // Резервное сохранение в localStorage
            const orders = JSON.parse(localStorage.getItem('ksushi_orders') || '[]');
            orders.push(order);
            localStorage.setItem('ksushi_orders', JSON.stringify(orders));
            orderSaveSuccess = true;
        }
        
        if (!orderSaveSuccess) {
            showNotification('Ошибка сохранения заказа в базу данных', 'error');
            return;
        }
        
        // Обновляем localStorage текущего пользователя
        localStorage.setItem('userData', JSON.stringify(freshUser));
        
        // Обновляем глобальный список пользователей
        updateGlobalUsers(freshUser);
        
        // Показываем подтверждение заказа - ПЕРЕД очисткой корзины!
        showOrderConfirmation(order, defaultAddress, earnedBonuses);
        
        // Очищаем корзину ТОЛЬКО ПОСЛЕ успешного показа подтверждения
        cart = [];
        activePromo = null;
        usedBonuses = 0;
        
        // Обновляем UI корзины
        updateCartCount();
        updateCartDisplay();
        updateLocalStorage();
        updateAuthButton();
        
        // Закрываем корзину - УБИРАЕМ этот вызов отсюда!
        // closeCart(); // УДАЛИТЬ ЭТУ СТРОКУ!
        
        console.log('Заказ успешно оформлен:', order.id);
        
    } catch (error) {
        console.error('Ошибка оформления заказа:', error);
        showNotification('Ошибка оформления заказа', 'error');
    }
}

// Проверка возможности использования промокода
function canUsePromoCode(promoCode, userPhone) {
    const promo = promoCodes[promoCode];
    if (!promo) return false;
    
    // Для KSUSHI20 проверяем, использовал ли пользователь его уже
    if (promoCode === 'KSUSHI20') {
        if (!userPhone) return false; // Требуется авторизация
        
        const usedPromos = JSON.parse(localStorage.getItem('usedPromos') || '{}');
        return !usedPromos[userPhone]?.includes('KSUSHI20');
    }
    
    // Для WELCOME10 проверяем, есть ли у пользователя заказы
    if (promoCode === 'WELCOME10' && userPhone) {
        const users = JSON.parse(localStorage.getItem('ksushi_users') || '[]');
        const user = users.find(u => u.phone === userPhone);
        if (user) {
            const ordersCount = user.orders ? user.orders.length : 0;
            return ordersCount === 0; // Только для первого заказа
        }
    }
    
    return true;
}

// Отметить промокод как использованный
function markPromoAsUsed(userPhone, promoCode) {
    try {
        const usedPromos = JSON.parse(localStorage.getItem('usedPromos') || '{}');
        
        if (!usedPromos[userPhone]) {
            usedPromos[userPhone] = [];
        }
        
        if (!usedPromos[userPhone].includes(promoCode)) {
            usedPromos[userPhone].push(promoCode);
        }
        
        localStorage.setItem('usedPromos', JSON.stringify(usedPromos));
        
    } catch (error) {
        console.error('Ошибка сохранения использованных промокодов:', error);
    }
}

// Показать подсказку о промокоде
function showPromoHint() {
    const userData = localStorage.getItem('userData');
    if (!userData) return;
    
    try {
        const user = JSON.parse(userData);
        const usedPromos = JSON.parse(localStorage.getItem('usedPromos') || '{}');
        
        // Проверяем, использовал ли пользователь KSUSHI20
        if (!usedPromos[user.phone]?.includes('KSUSHI20')) {
            // Показываем подсказку один раз за сессию
            const shownHint = sessionStorage.getItem('ksushi20_hint_shown');
            if (!shownHint) {
                setTimeout(() => {
                    showNotification('🎉 Используйте промокод KSUSHI20 для 20% скидки на первый заказ!', 'info');
                    sessionStorage.setItem('ksushi20_hint_shown', 'true');
                }, 2000);
            }
        }
    } catch (e) {
        console.error('Ошибка показа подсказки:', e);
    }
}

// Баннер слайдер
function initBannerSlider() {
    const banners = document.querySelectorAll('.banner');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    if (!banners.length || !dots.length) return;
    
    let currentSlide = 0;
    
    function showSlide(index) {
        banners.forEach(banner => banner.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        banners[index].classList.add('active');
        dots[index].classList.add('active');
        currentSlide = index;
    }
    
    function nextSlide() {
        let nextIndex = (currentSlide + 1) % banners.length;
        showSlide(nextIndex);
    }
    
    // Автопрокрутка
    let slideInterval = setInterval(nextSlide, 15000);
    
    // Ручное управление
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            clearInterval(slideInterval);
            let prevIndex = (currentSlide - 1 + banners.length) % banners.length;
            showSlide(prevIndex);
            slideInterval = setInterval(nextSlide, 15000);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            clearInterval(slideInterval);
            nextSlide();
            slideInterval = setInterval(nextSlide, 15000);
        });
    }
    
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            clearInterval(slideInterval);
            showSlide(index);
            slideInterval = setInterval(nextSlide, 15000);
        });
    });
}

// Загрузка продуктов
function loadProducts() {
    // Новинки
    const newProductsGrid = document.getElementById('new-products');
    if (newProductsGrid) {
        if (products.new) {
            products.new.forEach(product => {
                newProductsGrid.appendChild(createProductCard(product));
            });
        }
    }
    
    // Загрузка по категориям
    ['rolls', 'sushi', 'onigiri', 'sets', 'drinks', 'fastfood'].forEach(category => {
        const grid = document.getElementById(category);
        if (grid && products[category]) {
            products[category].forEach(product => {
                grid.appendChild(createProductCard(product));
            });
        }
    });
}

// Создание карточки продукта
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    if (product.isNew) card.classList.add('new');
    
    const hasVariants = (product.variants && product.variants.length > 0);
    
    card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-img">
        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <p class="product-desc">${product.description}</p>
            
            ${hasVariants ? `
                <div class="variant-buttons-container" data-id="${product.id}">
                    <div class="variant-buttons">
                        ${product.variants.map((variant, index) => `
                            <button class="variant-btn ${index === product.currentVariant ? 'active' : ''}" 
                                    data-index="${index}"
                                    data-price="${variant.price}">
                                ${variant.volume ? variant.volume : variant.weight}
                            </button>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="product-rating">
                ${getRatingStars(product.rating)}
                <span>${product.rating}</span>
            </div>
            <div class="product-bottom">
                <div class="product-price">${product.price}₽</div>
                <button class="add-to-cart" data-id="${product.id}">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        </div>
    `;
    
    // Добавляем обработчики для кнопок вариантов
    if (hasVariants) {
        const variantButtons = card.querySelectorAll('.variant-btn');
        const productId = parseInt(card.querySelector('.variant-buttons-container').dataset.id);
        const productData = findProductById(productId);
        const priceElement = card.querySelector('.product-price');
        
        variantButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const selectedIndex = parseInt(this.dataset.index);
                const selectedPrice = parseInt(this.dataset.price);
                
                // Удаляем активный класс у всех кнопок
                variantButtons.forEach(b => b.classList.remove('active'));
                
                // Добавляем активный класс выбранной кнопке
                this.classList.add('active');
                
                if (productData) {
                    productData.currentVariant = selectedIndex;
                    productData.price = selectedPrice;
                    
                    // Обновляем цену в product-bottom
                    priceElement.textContent = selectedPrice + '₽';
                }
            });
        });
    }
    
    // Добавление в корзину
    card.querySelector('.add-to-cart').addEventListener('click', () => {
        addToCart(product);
        showAddToCartAnimation(card);
    });
    
    return card;
}

// Вспомогательная функция для поиска продукта по ID
function findProductById(id) {
    for (const category in products) {
        if (Array.isArray(products[category])) {
            const product = products[category].find(p => p.id === id);
            if (product) return product;
        }
    }
    return null;
}

// Анимация добавления в корзину
function showAddToCartAnimation(card) {
    const cartIcon = document.querySelector('.cart');
    if (!cartIcon) return;
    
    const rect = card.getBoundingClientRect();
    const cartRect = cartIcon.getBoundingClientRect();
    
    // Создаем летающий элемент
    const flyingItem = document.createElement('div');
    flyingItem.innerHTML = '<i class="fas fa-shopping-cart"></i>';
    flyingItem.style.cssText = `
        position: fixed;
        left: ${rect.left + rect.width / 2}px;
        top: ${rect.top + rect.height / 2}px;
        color: #ff0000;
        font-size: 24px;
        z-index: 10000;
        transition: all 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55);
        pointer-events: none;
    `;
    
    document.body.appendChild(flyingItem);
    
    // Анимация полета к корзине
    setTimeout(() => {
        flyingItem.style.left = `${cartRect.left + cartRect.width / 2}px`;
        flyingItem.style.top = `${cartRect.top + cartRect.height / 2}px`;
        flyingItem.style.transform = 'scale(0.5)';
        flyingItem.style.opacity = '0.5';
    }, 10);
    
    // Удаление после анимации
    setTimeout(() => {
        flyingItem.remove();
    }, 800);
    
    // Анимация корзины
    cartIcon.style.transform = 'scale(1.3)';
    setTimeout(() => {
        cartIcon.style.transform = 'scale(1)';
    }, 300);
}

// Звезды рейтинга
function getRatingStars(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

// Настройка корзины
function setupCart() {
    const cartIcon = document.querySelector('.cart');
    const cartSidebar = document.querySelector('.cart-sidebar');
    const cartOverlay = document.querySelector('.cart-overlay');
    const closeCart = document.querySelector('.close-cart');
    
    if (!cartIcon || !cartSidebar || !cartOverlay || !closeCart) return;
    
    cartIcon.addEventListener('click', openCart);
    cartOverlay.addEventListener('click', closeCartFunc);
    closeCart.addEventListener('click', closeCartFunc);
    
    function openCart() {
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
        updateCartDisplay();
        updateAvailableBonuses();
        checkKsushi20Availability();
    }
    
    function closeCartFunc() {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
    }
}
function closeCart() {
    const cartSidebar = document.querySelector('.cart-sidebar');
    const cartOverlay = document.querySelector('.cart-overlay');
    
    if (cartSidebar) {
        cartSidebar.classList.remove('active');
    }
    if (cartOverlay) {
        cartOverlay.classList.remove('active');
    }
}

// Проверка доступности KSUSHI20
function checkKsushi20Availability() {
    const promoInput = document.getElementById('promo-code-input');
    if (!promoInput) return;
    
    // Если промокод KSUSHI20 уже введен, проверяем его
    if (promoInput.value.toUpperCase() === 'KSUSHI20') {
        const userData = localStorage.getItem('userData');
        if (!userData) {
            showNotification('Для использования KSUSHI20 необходимо войти в систему', 'info');
            return;
        }
        
        try {
            const user = JSON.parse(userData);
            const usedPromos = JSON.parse(localStorage.getItem('usedPromos') || '{}');
            
            if (usedPromos[user.phone]?.includes('KSUSHI20')) {
                showNotification('Вы уже использовали промокод KSUSHI20 ранее', 'info');
            }
        } catch (e) {
            console.error('Ошибка проверки промокода:', e);
        }
    }
}

// Добавление в корзину
function addToCart(product) {
    // Клонируем продукт, чтобы не изменять исходный объект
    const productToAdd = { ...product };
    
    // Если у продукта есть варианты, сохраняем выбранный вариант
    if (productToAdd.variants && productToAdd.variants.length > 0) {
        const selectedVariant = productToAdd.variants[productToAdd.currentVariant];
        productToAdd.selectedVariant = {
            ...selectedVariant,
            index: productToAdd.currentVariant
        };
        productToAdd.price = selectedVariant.price;
        
        // Добавляем метку для отображения в корзине
        productToAdd.variantLabel = selectedVariant.volume ? 
            selectedVariant.volume : selectedVariant.weight;
    }
    
    // Удаляем лишние свойства для корзины
    delete productToAdd.variants;
    delete productToAdd.currentVariant;
    
    const existingItem = cart.find(item => {
        if (item.id !== productToAdd.id) return false;
        
        // Если оба продукта имеют варианты, сравниваем их
        if (item.selectedVariant && productToAdd.selectedVariant) {
            return item.selectedVariant.index === productToAdd.selectedVariant.index;
        }
        
        // Если вариантов нет у одного из продуктов
        return !item.selectedVariant && !productToAdd.selectedVariant;
    });
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...productToAdd,
            quantity: 1
        });
    }
    
    updateCartCount();
    updateCartDisplay();
    updateLocalStorage();
    
    showNotification(`"${product.name}" добавлен в корзину`, 'success');
}

// Обновление количества товаров в корзине
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = count;
    }
}

// Обновление отображения корзины
function updateCartDisplay() {
    const cartItems = document.querySelector('.cart-items');
    
    if (!cartItems) return;
    
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart" style="font-size: 48px; color: #666; margin-bottom: 20px;"></i>
                <p style="color: #666; text-align: center;">Корзина пуста</p>
            </div>
        `;
        resetPricing();
    } else {
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <div class="cart-item-main">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.name}</div>
                        ${item.variantLabel ? `
                            <div class="variant-label">${item.variantLabel}</div>
                        ` : ''}
                        <div class="cart-item-price">${item.price}₽</div>
                    </div>
                    <div class="cart-item-controls">
                        <div class="quantity-controls">
                            <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                            <span class="cart-item-quantity">${item.quantity}</span>
                            <button class="quantity-btn increase" data-id="${item.id}">+</button>
                        </div>
                        <button class="btn-remove" data-id="${item.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="cart-item-total">${item.price * item.quantity}₽</div>
            `;
            
            cartItems.appendChild(itemElement);
        });
        
        updatePricing();
    }
    
    // Обработчики для кнопок в корзине
    document.querySelectorAll('.quantity-btn.decrease').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.closest('button').dataset.id);
            updateCartItemQuantity(id, -1);
        });
    });
    
    document.querySelectorAll('.quantity-btn.increase').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.closest('button').dataset.id);
            updateCartItemQuantity(id, 1);
        });
    });
    
    document.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.closest('button').dataset.id);
            removeFromCart(id);
        });
    });
}

// Обновление количества товара в корзине
function updateCartItemQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += change;
        
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            updateCartCount();
            updateCartDisplay();
            updateLocalStorage();
        }
    }
}

// Удаление товара из корзины
function removeFromCart(id) {
    const item = cart.find(item => item.id === id);
    if (item) {
        cart = cart.filter(item => item.id !== id);
        updateCartCount();
        updateCartDisplay();
        updateLocalStorage();
        showNotification(`"${item.name}" удален из корзины`, 'info');
    }
}

// Обновление локального хранилища
function updateLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('activePromo', activePromo || '');
    localStorage.setItem('usedBonuses', usedBonuses.toString());
}

// Загрузка сохраненных промокодов и бонусов
function loadSavedPromoAndBonuses() {
    const savedPromo = localStorage.getItem('activePromo');
    const savedBonuses = localStorage.getItem('usedBonuses');
    
    if (savedPromo && savedPromo !== 'null' && savedPromo !== 'undefined') {
        activePromo = savedPromo;
    }
    
    if (savedBonuses) {
        usedBonuses = parseInt(savedBonuses) || 0;
    }
    
    updateActivePromoDisplay();
    
    // Устанавливаем состояние переключателя бонусов
    if (usedBonuses > 0) {
        const toggle = document.getElementById('use-bonuses-toggle');
        if (toggle) {
            toggle.checked = true;
            updateBonusesToggle();
        }
    }
}

// Расчет общей суммы заказа
function calculateSubtotal() {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// Обновление цен и расчетов
function updatePricing() {
    const subtotal = calculateSubtotal();
    const subtotalElem = document.getElementById('subtotal-price');
    const promoDiscountElem = document.getElementById('promo-discount');
    const usedBonusesElem = document.getElementById('used-bonuses');
    const deliveryPriceElem = document.getElementById('delivery-price');
    const finalPriceElem = document.getElementById('final-price');
    const bonusesToEarnElem = document.getElementById('bonuses-to-earn');
    const bonusesEarnedContainer = document.querySelector('.bonuses-earned');
    const discountRow = document.querySelector('.discount-row');
    const bonusesRow = document.querySelector('.bonuses-row');
    
    // Обновляем сумму заказа
    subtotalElem.textContent = `${subtotal}₽`;
    
    // Рассчитываем стоимость доставки (бесплатно от 1500₽)
    deliveryPrice = subtotal >= 1500 ? 0 : 200;
    deliveryPriceElem.textContent = deliveryPrice === 0 ? 'Бесплатно' : `${deliveryPrice}₽`;
    
    // Рассчитываем скидку по промокоду
    let promoDiscount = 0;
    if (activePromo && promoCodes[activePromo]) {
        const promo = promoCodes[activePromo];
        
        // Проверяем минимальную сумму заказа
        if (subtotal >= promo.minOrder) {
            if (promo.type === 'percent') {
                promoDiscount = Math.round(subtotal * (promo.discount / 100));
            } else {
                promoDiscount = promo.discount;
            }
            
            // Показываем строку скидки
            promoDiscountElem.textContent = `-${promoDiscount}₽`;
            discountRow.style.display = 'flex';
        } else {
            // Промокод не действует из-за минимальной суммы
            activePromo = null;
            updateActivePromoDisplay();
            showNotification(`Минимальная сумма заказа для этого промокода: ${promo.minOrder}₽`, 'error');
        }
    } else {
        discountRow.style.display = 'none';
    }
    
    // Проверяем и корректируем использованные бонусы
    const maxAvailableBonuses = getAvailableBonuses();
    const maxBonusesToUse = Math.min(maxAvailableBonuses, subtotal - promoDiscount);
    
    if (usedBonuses > maxBonusesToUse) {
        usedBonuses = maxBonusesToUse;
        const bonusesAmountInput = document.getElementById('bonuses-amount');
        if (bonusesAmountInput) {
            bonusesAmountInput.value = usedBonuses;
        }
    }
    
    // Показываем/скрываем строку бонусов
    if (usedBonuses > 0) {
        usedBonusesElem.textContent = `-${usedBonuses}₽`;
        bonusesRow.style.display = 'flex';
    } else {
        bonusesRow.style.display = 'none';
    }
    
    // Рассчитываем итоговую сумму
    let total = subtotal + deliveryPrice - promoDiscount - usedBonuses;
    if (total < 0) total = 0;
    finalPriceElem.textContent = `${total}₽`;
    
    // Показываем сколько бонусов будет начислено (5% от итоговой суммы)
    const bonusesEarned = Math.floor(total * 0.05);
    if (bonusesEarned > 0 && total > 0) {
        bonusesToEarnElem.textContent = bonusesEarned;
        bonusesEarnedContainer.style.display = 'flex';
    } else {
        bonusesEarnedContainer.style.display = 'none';
    }
    
    // Обновляем максимальное значение для ввода бонусов
    const bonusesAmountInput = document.getElementById('bonuses-amount');
    if (bonusesAmountInput) {
        bonusesAmountInput.max = maxBonusesToUse;
        bonusesAmountInput.placeholder = `Максимум: ${maxBonusesToUse} баллов`;
    }
}

// Сброс цен
function resetPricing() {
    const elements = [
        'subtotal-price',
        'promo-discount',
        'used-bonuses',
        'delivery-price',
        'final-price'
    ];
    
    elements.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.textContent = '0₽';
    });
    
    document.querySelector('.discount-row').style.display = 'none';
    document.querySelector('.bonuses-row').style.display = 'none';
    document.querySelector('.bonuses-earned').style.display = 'none';
    
    activePromo = null;
    usedBonuses = 0;
    updateActivePromoDisplay();
    updateBonusesToggle();
}

// Применение промокода
function applyPromoCode(code) {
    const promoCode = code.toUpperCase().trim();
    
    if (!promoCodes[promoCode]) {
        showNotification('Промокод не найден', 'error');
        return false;
    }
    
    // Проверяем, может ли пользователь использовать промокод
    const userData = localStorage.getItem('userData');
    let userPhone = null;
    if (userData) {
        try {
            const user = JSON.parse(userData);
            userPhone = user.phone;
        } catch (e) {
            console.error('Ошибка загрузки данных пользователя:', e);
        }
    }
    
    // Для KSUSHI20 требуется авторизация
    if (promoCode === 'KSUSHI20' && !userPhone) {
        showNotification('Для использования этого промокода необходимо войти в систему', 'error');
        return false;
    }
    
    if (!canUsePromoCode(promoCode, userPhone)) {
        if (promoCode === 'KSUSHI20') {
            showNotification('Этот промокод уже был использован вами ранее', 'error');
        } else if (promoCode === 'WELCOME10') {
            showNotification('Этот промокод доступен только для первого заказа', 'error');
        } else {
            showNotification('Этот промокод недоступен', 'error');
        }
        return false;
    }
    
    const promo = promoCodes[promoCode];
    const subtotal = calculateSubtotal();
    
    if (subtotal < promo.minOrder) {
        showNotification(`Минимальная сумма заказа для этого промокода: ${promo.minOrder}₽`, 'error');
        return false;
    }
    
    if (activePromo === promoCode) {
        showNotification('Этот промокод уже применен', 'info');
        return true;
    }
    
    activePromo = promoCode;
    updateActivePromoDisplay();
    updatePricing();
    updateLocalStorage();
    
    let discountText = '';
    if (promo.type === 'percent') {
        discountText = `${promo.discount}%`;
    } else {
        discountText = `${promo.discount}₽`;
    }
    
    showNotification(`Промокод "${promoCode}" применен! Скидка: ${discountText}`, 'success');
    return true;
}

// Обновление отображения активного промокода
function updateActivePromoDisplay() {
    const activePromoContainer = document.getElementById('active-promo-container');
    const activePromoText = document.getElementById('active-promo-text');
    const promoInput = document.getElementById('promo-code-input');
    
    if (activePromo && promoCodes[activePromo]) {
        const promo = promoCodes[activePromo];
        let discountText = '';
        
        if (promo.type === 'percent') {
            discountText = `${promo.discount}% скидка`;
        } else {
            discountText = `${promo.discount}₽ скидка`;
        }
        
        // Добавляем информацию об ограничениях
        let restrictionsText = '';
        if (promo.oneTime) {
            restrictionsText = ' (одноразовый)';
        }
        
        activePromoText.textContent = `${activePromo} - ${promo.name} (${discountText}${restrictionsText})`;
        activePromoContainer.style.display = 'block';
        if (promoInput) promoInput.value = '';
    } else {
        activePromoContainer.style.display = 'none';
        activePromo = null;
    }
}

// Удаление промокода
function removePromoCode() {
    activePromo = null;
    updateActivePromoDisplay();
    updatePricing();
    updateLocalStorage();
    showNotification('Промокод удален', 'info');
}

// Получение доступных бонусов пользователя
function getAvailableBonuses() {
    const userData = localStorage.getItem('userData');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            return user.bonuses || 0;
        } catch (e) {
            console.error('Ошибка загрузки бонусов:', e);
        }
    }
    return 0;
}

// Обновление доступных бонусов
function updateAvailableBonuses() {
    const availableBonusesElem = document.getElementById('available-bonuses');
    const useBonusesToggle = document.getElementById('use-bonuses-toggle');
    
    const bonuses = getAvailableBonuses();
    availableBonusesElem.textContent = bonuses;
    
    // Включаем переключатель только если есть бонусы
    if (bonuses > 0) {
        useBonusesToggle.disabled = false;
    } else {
        useBonusesToggle.disabled = true;
        useBonusesToggle.checked = false;
        updateBonusesToggle();
    }
}

// Обновление переключателя бонусов
function updateBonusesToggle() {
    const useBonusesToggle = document.getElementById('use-bonuses-toggle');
    const bonusesInputContainer = document.getElementById('bonuses-input-container');
    const bonusesAmountInput = document.getElementById('bonuses-amount');
    
    if (useBonusesToggle.checked) {
        bonusesInputContainer.style.display = 'flex';
        
        // Устанавливаем максимальное значение
        const subtotal = calculateSubtotal();
        const promoDiscount = activePromo ? (promoCodes[activePromo] ? 
            (promoCodes[activePromo].type === 'percent' ? 
                Math.round(subtotal * (promoCodes[activePromo].discount / 100)) : 
                promoCodes[activePromo].discount) : 0) : 0;
        const maxAvailableBonuses = getAvailableBonuses();
        const maxToUse = Math.min(maxAvailableBonuses, subtotal - promoDiscount);
        
        bonusesAmountInput.max = maxToUse;
        bonusesAmountInput.placeholder = `Максимум: ${maxToUse} баллов`;
        
        // Устанавливаем текущее значение
        if (usedBonuses === 0 && maxToUse > 0) {
            usedBonuses = maxToUse;
            bonusesAmountInput.value = maxToUse;
        } else {
            bonusesAmountInput.value = usedBonuses || 0;
        }
        
        updatePricing();
    } else {
        bonusesInputContainer.style.display = 'none';
        usedBonuses = 0;
        updatePricing();
    }
    
    updateLocalStorage();
}

// Использование максимального количества бонусов
function useMaxBonuses() {
    const subtotal = calculateSubtotal();
    const promoDiscount = activePromo ? (promoCodes[activePromo] ? 
        (promoCodes[activePromo].type === 'percent' ? 
            Math.round(subtotal * (promoCodes[activePromo].discount / 100)) : 
            promoCodes[activePromo].discount) : 0) : 0;
    const maxAvailableBonuses = getAvailableBonuses();
    const maxToUse = Math.min(maxAvailableBonuses, subtotal - promoDiscount);
    
    usedBonuses = maxToUse;
    
    const bonusesAmountInput = document.getElementById('bonuses-amount');
    if (bonusesAmountInput) {
        bonusesAmountInput.value = maxToUse;
    }
    
    updatePricing();
    updateLocalStorage();
    showNotification(`Использовано максимальное количество бонусов: ${maxToUse}`, 'success');
}

// Настройка обработчиков для промокодов
function setupPromoHandlers() {
    const applyPromoBtn = document.getElementById('apply-promo-btn');
    const promoInput = document.getElementById('promo-code-input');
    const removePromoBtn = document.getElementById('remove-promo-btn');
    
    if (applyPromoBtn) {
        applyPromoBtn.addEventListener('click', function() {
            if (promoInput.value.trim()) {
                applyPromoCode(promoInput.value);
            }
        });
    }
    
    if (promoInput) {
        promoInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                if (promoInput.value.trim()) {
                    applyPromoCode(promoInput.value);
                }
            }
        });
    }
    
    if (removePromoBtn) {
        removePromoBtn.addEventListener('click', removePromoCode);
    }
}

// Настройка обработчиков для бонусов
function setupBonusesHandlers() {
    const useBonusesToggle = document.getElementById('use-bonuses-toggle');
    const bonusesAmountInput = document.getElementById('bonuses-amount');
    const useMaxBonusesBtn = document.getElementById('use-max-bonuses');
    
    if (useBonusesToggle) {
        useBonusesToggle.addEventListener('change', updateBonusesToggle);
    }
    
    if (bonusesAmountInput) {
        bonusesAmountInput.addEventListener('input', function() {
            const value = parseInt(this.value) || 0;
            const subtotal = calculateSubtotal();
            const promoDiscount = activePromo ? (promoCodes[activePromo] ? 
                (promoCodes[activePromo].type === 'percent' ? 
                    Math.round(subtotal * (promoCodes[activePromo].discount / 100)) : 
                    promoCodes[activePromo].discount) : 0) : 0;
            const maxAvailableBonuses = getAvailableBonuses();
            const maxToUse = Math.min(maxAvailableBonuses, subtotal - promoDiscount);
            
            if (value > maxToUse) {
                this.value = maxToUse;
                usedBonuses = maxToUse;
            } else if (value < 0) {
                this.value = 0;
                usedBonuses = 0;
            } else {
                usedBonuses = value;
            }
            
            updatePricing();
            updateLocalStorage();
        });
        
        bonusesAmountInput.addEventListener('blur', function() {
            if (!this.value) {
                this.value = 0;
                usedBonuses = 0;
                updatePricing();
                updateLocalStorage();
            }
        });
    }
    
    if (useMaxBonusesBtn) {
        useMaxBonusesBtn.addEventListener('click', useMaxBonuses);
    }
}

// Оформление заказа
function setupOrderButtons() {
    // Кнопки "Заказать сейчас" в баннерах
    document.querySelectorAll('.btn-order-now').forEach(btn => {
        btn.addEventListener('click', function() {
            const cartSidebar = document.querySelector('.cart-sidebar');
            const cartOverlay = document.querySelector('.cart-overlay');
            if (cartSidebar && cartOverlay) {
                cartSidebar.classList.add('active');
                cartOverlay.classList.add('active');
                updateCartDisplay();
                updateAvailableBonuses();
            }
        });
    });
    
    // Кнопка оформления заказа в корзине
    const orderBtn = document.querySelector('.btn-order');
    if (orderBtn) {
        orderBtn.addEventListener('click', function() {
            processCheckout();
        });
    }
}

// Обновление списка пользователей
function updateGlobalUsers(updatedUser) {
    try {
        let users = JSON.parse(localStorage.getItem('ksushi_users')) || [];
        const userIndex = users.findIndex(u => u.phone === updatedUser.phone);
        
        if (userIndex !== -1) {
            // Сохраняем все данные пользователя
            users[userIndex] = {
                ...users[userIndex],
                orders: updatedUser.orders || users[userIndex].orders,
                bonuses: updatedUser.bonuses !== undefined ? updatedUser.bonuses : users[userIndex].bonuses,
                addresses: updatedUser.addresses || users[userIndex].addresses,
                name: updatedUser.name || users[userIndex].name
            };
        } else {
            users.push(updatedUser);
        }
        
        localStorage.setItem('ksushi_users', JSON.stringify(users));
        
    } catch (error) {
        console.error('Ошибка обновления списка пользователей:', error);
    }
}

// Показать подтверждение заказа
// Показать подтверждение заказа - обновленная версия
function showOrderConfirmation(order, address, bonusEarned) {
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.className = 'order-confirmation-modal';
    
    // Создаем контент модального окна
    const modalContent = document.createElement('div');
    modalContent.className = 'confirmation-content';
    modalContent.innerHTML = `
        <div style="margin-bottom: 30px;">
            <div style="
                width: 80px;
                height: 80px;
                background: #ff0000;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
                font-size: 36px;
                color: white;
            ">
                <i class="fas fa-check"></i>
            </div>
            <h2 style="color: #ff0000; margin-bottom: 10px; font-size: 28px;">
                Заказ оформлен!
            </h2>
            <p style="color: #ccc; margin-bottom: 5px;">Номер заказа: ${order.id}</p>
        </div>
        
        <div style="
            background: rgba(51, 51, 51, 0.5);
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 25px;
            text-align: left;
        ">
            <h3 style="color: white; margin-bottom: 15px; font-size: 18px;">
                <i class="fas fa-map-marker-alt" style="color: #ff0000; margin-right: 10px;"></i>
                Адрес доставки
            </h3>
            <p style="color: white; margin-bottom: 8px; font-weight: 600;">${address.title}</p>
            <p style="color: #ccc; font-size: 15px; line-height: 1.5;">${address.fullAddress}</p>
            ${address.apartment ? `<p style="color: #999; font-size: 14px;">Квартира: ${address.apartment}</p>` : ''}
        </div>
        
        <div style="
            display: flex;
            justify-content: space-between;
            margin-bottom: 25px;
            padding: 15px;
            background: rgba(255, 0, 0, 0.1);
            border-radius: 12px;
        ">
            <div style="text-align: left;">
                <p style="color: #ccc; font-size: 14px; margin-bottom: 5px;">Сумма заказа</p>
                <p style="color: white; font-size: 24px; font-weight: 900;">${order.total}₽</p>
            </div>
            <div style="text-align: right;">
                <p style="color: #ccc; font-size: 14px; margin-bottom: 5px;">Получено бонусов</p>
                <p style="color: #00ff00; font-size: 24px; font-weight: 900;">+${bonusEarned}</p>
            </div>
        </div>
        
        <p style="color: #ccc; margin-bottom: 25px; font-size: 16px; line-height: 1.5;">
            <i class="fas fa-clock" style="color: #ff0000; margin-right: 8px;"></i>
            Ожидайте доставку в течение 60 минут!
        </p>
        
        <button id="close-confirmation" class="btn-red" style="
            padding: 15px 40px;
            font-size: 18px;
            font-weight: 700;
            border-radius: 12px;
            width: 100%;
            cursor: pointer;
            border: none;
            outline: none;
            background: #ff0000;
            color: white;
            transition: background 0.3s;
        ">
            Отлично!
        </button>
    `;
    
    // Стили для модального окна
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10002;
        padding: 20px;
    `;
    
    modalContent.style.cssText = `
        background: rgba(0, 0, 0, 0.95);
        border: 3px solid #ff0000;
        border-radius: 20px;
        padding: 40px;
        max-width: 500px;
        width: 100%;
        text-align: center;
        box-shadow: 0 20px 60px rgba(255, 0, 0, 0.3);
        animation: fadeIn 0.3s ease;
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Обработчик для кнопки "Отлично!"
    setTimeout(() => {
        const closeButton = document.getElementById('close-confirmation');
        if (closeButton) {
            closeButton.addEventListener('click', function closeModalHandler() {
                // Закрываем модальное окно
                modal.remove();
                
                // Закрываем корзину после подтверждения
                closeCart();
                
                // Показываем финальное уведомление
                showNotification('Спасибо за заказ! Мы уже готовим его для вас.', 'success');
            });
        }
    }, 100);
    
    // Закрытие по клику вне модалки
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
            closeCart();
        }
    });
    
    // Закрытие по нажатию Esc
    const closeOnEsc = function(e) {
        if (e.key === 'Escape') {
            modal.remove();
            closeCart();
            document.removeEventListener('keydown', closeOnEsc);
        }
    };
    
    document.addEventListener('keydown', closeOnEsc);
}
// Обновление кнопки авторизации
// Обновление кнопки авторизации
function updateAuthButton() {
    const userData = localStorage.getItem('userData');
    const authBtn = document.getElementById('open-auth');
    const profileLink = document.getElementById('profile-link');
    
    if (!authBtn || !profileLink) return;
    
    if (userData) {
        try {
            const user = JSON.parse(userData);
            
            // Обновляем имя в кнопке профиля
            const profileName = document.getElementById('profile-name');
            if (profileName && user.name) {
                profileName.textContent = user.name;
            }
            
            // Обновляем бейдж с бонусами
            const profileBadge = document.getElementById('profile-badge');
            if (profileBadge) {
                if (user.bonuses && user.bonuses > 0) {
                    profileBadge.textContent = user.bonuses;
                    profileBadge.style.display = 'flex';
                } else {
                    profileBadge.style.display = 'none';
                }
            }
            
            // Показываем кнопку профиля и скрываем кнопку входа
            profileLink.style.display = 'flex';
            authBtn.style.display = 'none';
            
            // Обновляем title для подсказки
            profileLink.title = `Профиль: ${user.name || 'Пользователь'}`;
            
            // Проверяем, нужно ли сбросить промокод KSUSHI20
            if (activePromo === 'KSUSHI20') {
                const usedPromos = JSON.parse(localStorage.getItem('usedPromos') || '{}');
                if (usedPromos[user.phone]?.includes('KSUSHI20')) {
                    // Пользователь уже использовал этот промокод
                    activePromo = null;
                    updateActivePromoDisplay();
                    updatePricing();
                    updateLocalStorage();
                    showNotification('Вы уже использовали промокод KSUSHI20', 'info');
                }
            }
            
        } catch (e) {
            console.error('Ошибка парсинга userData:', e);
            // Если ошибка, показываем кнопку входа
            profileLink.style.display = 'none';
            authBtn.style.display = 'flex';
        }
    } else {
        // Пользователь не авторизован
        profileLink.style.display = 'none';
        authBtn.style.display = 'flex';
    }
}

// Обновление адреса в корзине из профиля
// Обновление адреса в корзине из профиля
function updateCartAddressFromProfile() {
    const userData = localStorage.getItem('userData');
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
    }
}

// Загрузка сохраненного адреса
function loadSavedAddress() {
    const savedAddress = localStorage.getItem('deliveryAddress');
    if (savedAddress) {
        try {
            const address = JSON.parse(savedAddress);
            // Можно использовать для чего-то еще
        } catch (e) {
            console.error('Ошибка при загрузке адреса:', e);
        }
    }
}

// Показать уведомление
function showNotification(message, type = 'info') {
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                           type === 'error' ? 'exclamation-circle' : 
                           type === 'info' ? 'info-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Удаляем через 3 секунды
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Функция для сброса использованных промокодов (для тестирования)
function resetUsedPromos() {
    localStorage.removeItem('usedPromos');
    showNotification('Использованные промокоды сброшены', 'success');
}

// Добавляем стили для уведомлений
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: scale(0.9);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
    
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10001;
        animation: slideIn 0.3s ease;
        max-width: 400px;
    }
    
    .notification-success {
        background: rgba(0, 255, 0, 0.1);
        color: #00ff00;
        border: 1px solid #00ff00;
    }
    
    .notification-error {
        background: rgba(255, 0, 0, 0.1);
        color: #ff0000;
        border: 1px solid #ff0000;
    }
    
    .notification-info {
        background: rgba(0, 150, 255, 0.1);
        color: #0096ff;
        border: 1px solid #0096ff;
    }
`;
document.head.appendChild(style);

if (!window.smsAuth) {
    console.warn('smsAuth не загружен, создаем заглушку');
    window.smsAuth = {
        openAuthModal: function() {
            showNotification('Модуль авторизации временно недоступен', 'error');
            // Простая заглушка для авторизации
            const phone = prompt('Введите номер телефона для входа (только цифры):');
            if (phone && phone.replace(/\D/g, '').length === 10) {
                const mockUser = {
                    id: Date.now(),
                    phone: phone,
                    name: 'Пользователь',
                    bonuses: 100,
                    addresses: [],
                    orders: [],
                    createdAt: new Date().toISOString()
                };
                localStorage.setItem('userData', JSON.stringify(mockUser));
                
                // Обновляем глобальный список
                updateGlobalUsers(mockUser);
                
                // Обновляем интерфейс
                updateAuthButton();
                updateCartAddressFromProfile();
                updateAvailableBonuses();
                
                showNotification('Вход выполнен успешно!', 'success');
            }
        },
        
        logout: function() {
            localStorage.removeItem('userData');
            updateAuthButton();
            updateCartAddressFromProfile();
            updateAvailableBonuses();
            showNotification('Вы вышли из системы', 'info');
        },
        
        updateCartAddress: function(userDataStr) {
            // Обновляем адрес в корзине
            updateCartAddressFromProfile();
        },
        
        updateAuthButtonOnMainPage: function(userDataStr) {
            // Обновляем кнопку авторизации
            updateAuthButton();
        }
    };
}

// Экспортируем функции для использования в других файлах
window.processCheckout = processCheckout;
window.resetUsedPromos = resetUsedPromos;
window.applyPromoCode = applyPromoCode;
window.removePromoCode = removePromoCode;
window.openAuthModal = openAuthModal; // Экспортируем функцию открытия авторизации
