const PRODUCTS = {
    "agua-500": {
        id: "agua-500",
        name: "Agua mineral 500 ml",
        category: "aguas",
        description: "Agua mineral sin gas",
        price: 900,
        image: "img/agua_500.jpg"
    },
    "agua-gas-500": {
        id: "agua-gas-500",
        name: "Agua con gas 500 ml",
        category: "aguas",
        description: "Agua mineral con gas",
        price: 950,
        image: "img/aguacongas_500.jpg"
    },
    "agua-15": {
        id: "agua-15",
        name: "Agua mineral 1.5 L",
        category: "aguas",
        description: "Ideal para llevar",
        price: 1300,
        image: "img/agua_15.jpg",
        quantityPromo: { min: 6, percent: 10, label: "10% OFF llevando 6" }
    },
    "agua-225": {
        id: "agua-225",
        name: "Agua mineral 2.25 L",
        category: "aguas",
        description: "Presentación familiar",
        price: 1600,
        image: "img/agua_225.jpg"
    },
    "cocacola-225": {
        id: "cocacola-225",
        name: "Coca-Cola 2.25 L",
        category: "gaseosas",
        description: "Presentación familiar",
        price: 3500,
        image: "img/cocacola_225.jpg"
    },
    "cocacola-3l": {
        id: "cocacola-3l",
        name: "Coca-Cola 3 L",
        category: "gaseosas",
        description: "Presentación familiar",
        price: 4200,
        image: "img/cocacola_3l.jpg",
        quantityPromo: { min: 6, percent: 10, label: "10% OFF llevando 6" }
    },
    "cocacola-zero-225": {
        id: "cocacola-zero-225",
        name: "Coca-Cola Zero 2.25 L",
        category: "gaseosas",
        description: "Sin azúcar",
        price: 3700,
        image: "img/cocacola_zero225.jpg"
    },
    "pepsi-225": {
        id: "pepsi-225",
        name: "Pepsi 2.25 L",
        category: "gaseosas",
        description: "Presentación familiar",
        price: 3000,
        image: "img/pepsi_225.jpg"
    },
    "sprite-225": {
        id: "sprite-225",
        name: "Sprite 2.25 L",
        category: "gaseosas",
        description: "Sabor lima-limón",
        price: 3300,
        image: "img/sprite_225.jpg"
    },
    "fanta-225": {
        id: "fanta-225",
        name: "Fanta 2.25 L",
        category: "gaseosas",
        description: "Sabor naranja",
        price: 3300,
        image: "img/fanta_225.jpg"
    },
    "quilmes-473": {
        id: "quilmes-473",
        name: "Quilmes lata 473 ml",
        category: "cervezas",
        description: "Lata 473 ml",
        price: 2000,
        image: "img/quilmes_473.jpg",
        quantityPromo: { min: 6, percent: 8, label: "8% OFF llevando 6" }
    },
    "brahma-473": {
        id: "brahma-473",
        name: "Brahma lata 473 ml",
        category: "cervezas",
        description: "Lata 473 ml",
        price: 1800,
        image: "img/brahma_473.png"
    },
    "stella-473": {
        id: "stella-473",
        name: "Stella Artois lata 473 ml",
        category: "cervezas",
        description: "Lata 473 ml",
        price: 2500,
        image: "img/stella_473.jpg"
    },
    "heineken-710": {
        id: "heineken-710",
        name: "Heineken lata 710 ml",
        category: "cervezas",
        description: "Lata 710 ml",
        price: 3200,
        image: "img/heineken_710.jpg"
    },
    "stella-negra-1l": {
        id: "stella-negra-1l",
        name: "Stella Artois Negra botella 1 L",
        category: "cervezas",
        description: "Botella 1 L",
        price: 4500,
        image: "img/stella_1l.jpg"
    },
    "smirnoff-1l": {
        id: "smirnoff-1l",
        name: "Smirnoff 1 L",
        category: "vodkas",
        description: "Botella 1 L",
        price: 9500,
        image: "img/smirnoff_1l.jpg"
    },
    "fernet-750": {
        id: "fernet-750",
        name: "Fernet 750 ml",
        category: "fernet",
        description: "Botella 750 ml",
        price: 10500,
        image: "img/fernet_750.jpg"
    },
    "baggio-1l": {
        id: "baggio-1l",
        name: "Baggio Multifruta 1 L",
        category: "jugos",
        description: "Jugo multifruta",
        price: 2400,
        image: "img/baggiomulti_1l.jpg",
        quantityPromo: { min: 3, percent: 5, label: "5% OFF llevando 3" }
    },
    "cepita-1l": {
        id: "cepita-1l",
        name: "Cepita 1 L",
        category: "jugos",
        description: "Jugo listo para tomar",
        price: 2200,
        image: "img/cepita_1l.png"
    }
};

const WHATSAPP_NUMBER = "5493804507584";
const STORAGE_KEY = "distribuidora-demo-carrito";

const COMBO = {
    id: "fernet-coca",
    fernetId: "fernet-750",
    cocaId: "cocacola-3l",
    comboPrice: 12900,
    normalPrice: PRODUCTS["fernet-750"].price + PRODUCTS["cocacola-3l"].price,
    label: "Combo Fernet + Coca-Cola 3 L"
};

let cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
let activeCategory = "todos";

const cartPanel = document.getElementById("cartPanel");
const cartOverlay = document.getElementById("cartOverlay");
const cartItems = document.getElementById("cartItems");
const cartSubtotal = document.getElementById("cartSubtotal");
const cartDiscount = document.getElementById("cartDiscount");
const discountRow = document.getElementById("discountRow");
const cartTotal = document.getElementById("cartTotal");
const cartCount = document.getElementById("cartCount");
const checkoutWhatsApp = document.getElementById("checkoutWhatsApp");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const productosGrid = document.getElementById("productosGrid");

function formatPrice(value) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0
    }).format(value);
}

function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

function getCartEntries() {
    return Object.values(cart).filter(item => item.quantity > 0);
}

function getCartCount() {
    return getCartEntries().reduce((total, item) => total + item.quantity, 0);
}

function addToCart(productId, quantity = 1, shouldOpen = true) {
    const product = PRODUCTS[productId];

    if (!product) return;

    if (cart[productId]) {
        cart[productId].quantity += quantity;
    } else {
        cart[productId] = {
            ...product,
            quantity
        };
    }

    saveCart();
    renderCart();

    if (shouldOpen) {
        openCart();
    }
}

function changeQuantity(productId, amount) {
    if (!cart[productId]) return;

    cart[productId].quantity += amount;

    if (cart[productId].quantity <= 0) {
        delete cart[productId];
    }

    saveCart();
    renderCart();
}

function removeFromCart(productId) {
    delete cart[productId];
    saveCart();
    renderCart();
}

function clearCart() {
    cart = {};
    saveCart();
    renderCart();
}

function calculateTotals() {
    const entries = getCartEntries();
    const subtotal = entries.reduce((total, item) => total + item.price * item.quantity, 0);

    let discount = 0;
    const details = {};

    entries.forEach(item => {
        details[item.id] = {
            quantity: item.quantity,
            quantityDiscount: 0,
            comboDiscount: 0,
            comboUnits: 0
        };
    });

    // Primero aplicamos el combo para que no se duplique el descuento de Coca-Cola 3 L.
    const fernetQuantity = cart[COMBO.fernetId]?.quantity || 0;
    const cocaQuantity = cart[COMBO.cocaId]?.quantity || 0;
    const comboUnits = Math.min(fernetQuantity, cocaQuantity);

    if (comboUnits > 0) {
        const comboSavingPerUnit = COMBO.normalPrice - COMBO.comboPrice;
        const comboDiscount = comboUnits * comboSavingPerUnit;
        discount += comboDiscount;

        details[COMBO.fernetId].comboUnits = comboUnits;
        details[COMBO.cocaId].comboUnits = comboUnits;
        // Mostramos el ahorro del combo sobre la línea de Coca-Cola para
        // evitar descontar el mismo importe dos veces en la vista del carrito.
        details[COMBO.cocaId].comboDiscount = comboDiscount;
    }

    // Promociones por cantidad. Se aplican sobre unidades que no fueron usadas en el combo.
    entries.forEach(item => {
        if (!item.quantityPromo) return;

        const unitsUsedInCombo = item.id === COMBO.fernetId || item.id === COMBO.cocaId
            ? details[item.id].comboUnits
            : 0;
        const eligibleQuantity = item.quantity - unitsUsedInCombo;

        if (eligibleQuantity >= item.quantityPromo.min) {
            const quantityDiscount = item.price * eligibleQuantity * (item.quantityPromo.percent / 100);
            discount += quantityDiscount;
            details[item.id].quantityDiscount = quantityDiscount;
        }
    });

    return {
        subtotal,
        discount,
        total: subtotal - discount,
        details,
        comboUnits
    };
}

function getProductPromoText(product) {
    if (product.id === COMBO.fernetId || product.id === COMBO.cocaId) {
        return "Combo con Fernet + Coca-Cola 3 L";
    }

    if (product.quantityPromo) {
        return product.quantityPromo.label;
    }

    return "";
}

function renderProducts() {
    const products = Object.values(PRODUCTS).filter(product => {
        return activeCategory === "todos" || product.category === activeCategory;
    });

    if (products.length === 0) {
        productosGrid.innerHTML = `<p class="no-products">No hay productos en esta categoría.</p>`;
        return;
    }

    productosGrid.innerHTML = products.map(product => {
        const promoText = getProductPromoText(product);
        const isComboProduct = product.id === COMBO.fernetId || product.id === COMBO.cocaId;

        return `
            <article class="producto">
                <div class="producto-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                    ${product.quantityPromo || isComboProduct ? `<span class="product-tag">${isComboProduct ? "COMBO" : "PROMO"}</span>` : ""}
                </div>
                <div class="producto-info">
                    <span class="product-category">${getCategoryLabel(product.category)}</span>
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <div class="producto-bottom">
                        <strong>${formatPrice(product.price)}</strong>
                        <button class="add-cart" data-id="${product.id}">Agregar</button>
                    </div>
                    ${promoText ? `<div class="product-promo">${promoText}</div>` : ""}
                </div>
            </article>
        `;
    }).join("");
}

function getCategoryLabel(category) {
    const labels = {
        aguas: "Aguas",
        gaseosas: "Gaseosas",
        cervezas: "Cervezas",
        vodkas: "Vodkas",
        fernet: "Fernet",
        jugos: "Jugos"
    };

    return labels[category] || "Bebidas";
}

function renderCart() {
    const entries = getCartEntries();
    const count = getCartCount();
    const totals = calculateTotals();

    cartCount.textContent = count;
    cartSubtotal.textContent = formatPrice(totals.subtotal);
    cartDiscount.textContent = `-${formatPrice(totals.discount).replace("-", "")}`;
    cartTotal.textContent = formatPrice(totals.total);
    discountRow.classList.toggle("visible", totals.discount > 0);

    if (entries.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <h3>Tu carrito está vacío</h3>
                <p>Agregá algunos productos para comenzar tu pedido.</p>
            </div>
        `;

        checkoutWhatsApp.classList.add("disabled");
        checkoutWhatsApp.href = "#";
        return;
    }

    cartItems.innerHTML = entries.map(item => {
        const detail = totals.details[item.id];
        const itemSubtotal = item.price * item.quantity;
        const itemDiscount = detail.quantityDiscount + (detail.comboDiscount || 0);
        const itemFinal = itemSubtotal - itemDiscount;
        const comboUnits = detail.comboUnits || 0;

        let promoHtml = "";

        if (comboUnits > 0) {
            promoHtml += `<div class="cart-promo">${comboUnits} combo(s) aplicado(s)</div>`;
        }

        if (detail.quantityDiscount > 0) {
            promoHtml += `<div class="cart-promo">-${formatPrice(detail.quantityDiscount)} por cantidad</div>`;
        }

        return `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>

                <div class="cart-item-main">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">${formatPrice(item.price)} por unidad</div>

                    ${promoHtml}

                    <div class="cart-item-actions">
                        <div>
                            <div class="quantity-control">
                                <button type="button" data-action="decrease" data-id="${item.id}" aria-label="Disminuir cantidad">−</button>
                                <span>${item.quantity}</span>
                                <button type="button" data-action="increase" data-id="${item.id}" aria-label="Aumentar cantidad">+</button>
                            </div>

                            <button class="remove-item" type="button" data-action="remove" data-id="${item.id}">Eliminar</button>
                        </div>

                        <div class="item-prices">
                            ${itemDiscount > 0 ? `<span class="item-original">${formatPrice(itemSubtotal)}</span>` : ""}
                            <span class="item-subtotal">${formatPrice(itemFinal)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join("");

    checkoutWhatsApp.classList.remove("disabled");
    checkoutWhatsApp.href = buildWhatsAppLink(totals);
}

function buildWhatsAppLink(totals = calculateTotals()) {
    const entries = getCartEntries();
    let message = "Hola! Quiero hacer el siguiente pedido:\n\n";

    entries.forEach(item => {
        const detail = totals.details[item.id];
        const itemSubtotal = item.price * item.quantity;
        const itemDiscount = detail.quantityDiscount + (detail.comboDiscount || 0);
        const finalItemTotal = itemSubtotal - itemDiscount;

        message += `• ${item.name} x${item.quantity} - ${formatPrice(finalItemTotal)}`;

        if (detail.comboUnits > 0) {
            message += ` (incluye ${detail.comboUnits} combo)`;
        }

        if (detail.quantityDiscount > 0) {
            message += ` (promo cantidad aplicada)`;
        }

        message += "\n";
    });

    message += `\nSubtotal: ${formatPrice(totals.subtotal)}\n`;
    message += `Descuentos: -${formatPrice(totals.discount)}\n`;
    message += `TOTAL: ${formatPrice(totals.total)}`;

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function openCart() {
    cartPanel.classList.add("active");
    cartOverlay.classList.add("active");
    cartPanel.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

function closeCart() {
    cartPanel.classList.remove("active");
    cartOverlay.classList.remove("active");
    cartPanel.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

function addPromoProduct(productId) {
    addToCart(productId, 1, true);
}

function addPromoCombo() {
    addToCart(COMBO.fernetId, 1, false);
    addToCart(COMBO.cocaId, 1, false);
    renderCart();
    openCart();
}

document.addEventListener("click", event => {
    const addButton = event.target.closest(".add-cart");
    if (addButton) {
        addToCart(addButton.dataset.id);
        return;
    }

    const promoProduct = event.target.closest("[data-promo-product]");
    if (promoProduct) {
        addPromoProduct(promoProduct.dataset.promoProduct);
        return;
    }

    const promoCombo = event.target.closest("[data-promo-combo]");
    if (promoCombo) {
        addPromoCombo();
    }
});

cartItems.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const { action, id } = button.dataset;

    if (action === "increase") changeQuantity(id, 1);
    if (action === "decrease") changeQuantity(id, -1);
    if (action === "remove") removeFromCart(id);
});

document.querySelectorAll(".category-btn").forEach(button => {
    button.addEventListener("click", () => {
        activeCategory = button.dataset.category;

        document.querySelectorAll(".category-btn").forEach(categoryButton => {
            categoryButton.classList.toggle("active", categoryButton === button);
        });

        renderProducts();
    });
});

document.getElementById("openCart").addEventListener("click", openCart);
document.getElementById("closeCart").addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);

document.getElementById("clearCart").addEventListener("click", () => {
    if (getCartEntries().length === 0) return;
    clearCart();
});

menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("active");
    menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
});

navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
    });
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeCart();
        navLinks.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
    }
});

renderProducts();
renderCart();
