const DEFAULT_PRODUCTS = {
    "agua-500": {
        id: "agua-500",
        name: "Agua mineral 500 ml",
        category: "aguas",
        description: "Agua mineral sin gas",
        image: "img/agua_500.jpg"
    },
    "agua-gas-500": {
        id: "agua-gas-500",
        name: "Agua con gas 500 ml",
        category: "aguas",
        description: "Agua mineral con gas",
        image: "img/aguacongas_500.jpg"
    },
    "agua-15": {
        id: "agua-15",
        name: "Agua mineral 1.5 L",
        category: "aguas",
        description: "Ideal para llevar",
        image: "img/agua_15.jpg",
    },
    "agua-225": {
        id: "agua-225",
        name: "Agua mineral 2.25 L",
        category: "aguas",
        description: "Presentación familiar",
        image: "img/agua_225.jpg"
    },
    "cocacola-225": {
        id: "cocacola-225",
        name: "Coca-Cola 2.25 L",
        category: "gaseosas",
        description: "Presentación familiar",
        image: "img/cocacola_225.jpg"
    },
    "cocacola-3l": {
        id: "cocacola-3l",
        name: "Coca-Cola 3 L",
        category: "gaseosas",
        description: "Presentación familiar",
        image: "img/cocacola_3l.jpg",
    },
    "cocacola-zero-225": {
        id: "cocacola-zero-225",
        name: "Coca-Cola Zero 2.25 L",
        category: "gaseosas",
        description: "Sin azúcar",
        image: "img/cocacola_zero225.jpg"
    },
    "pepsi-225": {
        id: "pepsi-225",
        name: "Pepsi 2.25 L",
        category: "gaseosas",
        description: "Presentación familiar",
        image: "img/pepsi_225.jpg"
    },
    "sprite-225": {
        id: "sprite-225",
        name: "Sprite 2.25 L",
        category: "gaseosas",
        description: "Sabor lima-limón",
        image: "img/sprite_225.jpg"
    },
    "fanta-225": {
        id: "fanta-225",
        name: "Fanta 2.25 L",
        category: "gaseosas",
        description: "Sabor naranja",
        image: "img/fanta_225.jpg"
    },
    "quilmes-473": {
        id: "quilmes-473",
        name: "Quilmes lata 473 ml",
        category: "cervezas",
        description: "Lata 473 ml",
        image: "img/quilmes_473.jpg",
    },
    "brahma-473": {
        id: "brahma-473",
        name: "Brahma lata 473 ml",
        category: "cervezas",
        description: "Lata 473 ml",
        image: "img/brahma_473.png"
    },
    "stella-473": {
        id: "stella-473",
        name: "Stella Artois lata 473 ml",
        category: "cervezas",
        description: "Lata 473 ml",
        image: "img/stella_473.jpg"
    },
    "heineken-710": {
        id: "heineken-710",
        name: "Heineken lata 710 ml",
        category: "cervezas",
        description: "Lata 710 ml",
        image: "img/heineken_710.jpg"
    },
    "stella-negra-1l": {
        id: "stella-negra-1l",
        name: "Stella Artois Negra botella 1 L",
        category: "cervezas",
        description: "Botella 1 L",
        image: "img/stella_1l.jpg"
    },
    "smirnoff-1l": {
        id: "smirnoff-1l",
        name: "Smirnoff 1 L",
        category: "vodkas",
        description: "Botella 1 L",
        image: "img/smirnoff_1l.jpg"
    },
    "fernet-750": {
        id: "fernet-750",
        name: "Fernet 750 ml",
        category: "fernet",
        description: "Botella 750 ml",
        image: "img/fernet_750.jpg"
    },
    "baggio-1l": {
        id: "baggio-1l",
        name: "Baggio Multifruta 1 L",
        category: "jugos",
        description: "Jugo multifruta",
        image: "img/baggiomulti_1l.jpg",
    },
    "cepita-1l": {
        id: "cepita-1l",
        name: "Cepita 1 L",
        category: "jugos",
        description: "Jugo listo para tomar",
        image: "img/cepita_1l.png"
    }
};

const PRODUCT_STORAGE_KEY = "distribuidora-demo-productos";
let PRODUCTS = (() => {
    try {
        const saved = JSON.parse(localStorage.getItem(PRODUCT_STORAGE_KEY));
        if (Array.isArray(saved)) {
            return Object.fromEntries(saved.filter(p => p && p.id && p.active !== false).map(p => [p.id, p]));
        }
    } catch (error) { console.warn("No se pudo cargar el catálogo guardado", error); }
    return DEFAULT_PRODUCTS;
})();

const WHATSAPP_NUMBER = "5493804507584";
const STORAGE_KEY = "distribuidora-demo-carrito";

let cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
let activeCategory = "todos";

const cartPanel = document.getElementById("cartPanel");
const cartOverlay = document.getElementById("cartOverlay");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const checkoutWhatsApp = document.getElementById("checkoutWhatsApp");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const productosGrid = document.getElementById("productosGrid");

function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

function getCartEntries() {
    return Object.values(cart).filter(item => item.quantity > 0);
}

function getCartCount() {
    return getCartEntries().reduce((total, item) => total + item.quantity, 0);
}

function addToCart(productId, quantity = 1, shouldOpen = false, unitMultiplier = 1) {
    const product = PRODUCTS[productId];

    if (!product) { alert('Este producto no está disponible en el catálogo.'); return; }
    const requestedUnits = quantity * unitMultiplier;
    if (product.stock_enabled && requestedUnits > Number(product.stock_quantity ?? product.stock ?? 0)) { alert('No hay stock suficiente de ' + product.name + '.'); return; }
    if (cart[productId]) {
        cart[productId].quantity += quantity;
    } else {
        cart[productId] = {
            ...product,
            quantity,
            unitMultiplier
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

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "\'":"&#39;"}[char]));
}

function renderProducts() {
    const products = Object.values(PRODUCTS).filter(product => {
        return activeCategory === "todos" || product.category === activeCategory;
    });

    if (products.length === 0) {
        productosGrid.innerHTML = `<p class="no-products">No hay productos en esta categoría.</p>`;
        return;
    }

    productosGrid.innerHTML = products.map(product => `
        <article class="producto">
            <div class="producto-image">
                <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" loading="lazy">
            </div>
            <div class="producto-info">
                <span class="product-category">${escapeHTML(getCategoryLabel(product.category))}</span>
                <h3>${escapeHTML(product.name)}</h3>
                <p>${escapeHTML(product.description || product.shortDescription || "")}</p>
                ${product.stock_enabled ? `<small class="stock-label">${Number(product.stock_quantity||0)>0 ? (Number(product.stock_quantity)<=5?'Pocas unidades':'Disponible') : 'Sin stock'}</small>` : ''}
                <div class="producto-bottom">
                    ${product.sell_individual !== false ? `<button class="add-cart" data-id="${product.id}" ${product.stock_enabled && Number(product.stock_quantity||0)<1?'disabled':''}>Agregar unidad</button>` : ''}
                    ${product.sell_packs === true && Number(product.pack_units)>=2 ? `<button class="add-cart add-pack" data-id="${product.id}" data-pack="${Number(product.pack_units)}" ${product.stock_enabled && Number(product.stock_quantity||0)<Number(product.pack_units)?'disabled':''}>Agregar pack x${Number(product.pack_units)}</button>` : ''}
                </div>
            </div>
        </article>
    `).join("");
}

function getCategoryLabel(category) {
    const labels = {
        aguas: "Aguas",
        gaseosas: "Gaseosas",
        cervezas: "Cervezas",
        vodkas: "Vodkas",
        fernet: "Fernet",
        jugos: "Jugos",
        otros: "Otros"
    };

    return labels[category] || "Bebidas";
}

function renderCart() {
    const entries = getCartEntries();
    const count = getCartCount();

    cartCount.textContent = count;

    if (entries.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <h3>Tu selección está vacía</h3>
                <p>Agregá algunos productos para comenzar tu pedido.</p>
            </div>
        `;

        checkoutWhatsApp.classList.add("disabled");
        checkoutWhatsApp.href = "#";
        return;
    }

    cartItems.innerHTML = entries.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                <img src="${escapeHTML(item.image || PRODUCTS[item.id]?.image || "")}" alt="${escapeHTML(item.name)}">
            </div>

            <div class="cart-item-main">
                <div class="cart-item-title">${escapeHTML(item.name)}${item.unitMultiplier>1?` · Pack x${item.unitMultiplier}`:''}</div>
                <div class="cart-item-actions">
                    <div>
                        <div class="quantity-control">
                            <button type="button" data-action="decrease" data-id="${item.id}" aria-label="Disminuir cantidad">−</button>
                            <span>${item.quantity}</span>
                            <button type="button" data-action="increase" data-id="${item.id}" aria-label="Aumentar cantidad">+</button>
                        </div>
                        <button class="remove-item" type="button" data-action="remove" data-id="${item.id}">Eliminar</button>
                    </div>
                </div>
            </div>
        </div>
    `).join("");

    checkoutWhatsApp.classList.remove("disabled");
    checkoutWhatsApp.href = buildWhatsAppLink();
}

function buildWhatsAppLink() {
    const entries = getCartEntries();
    let message = "Hola! Quisiera consultar disponibilidad y precio de los siguientes productos:\n\n";

    entries.forEach(item => {
        message += `• ${item.name} x${item.quantity}${item.unitMultiplier>1?` (pack de ${item.unitMultiplier} unidades)`:''}\n`;
    });

    message += "\n¿Me podrían informar el importe y las promociones disponibles?\n\n¡Muchas gracias!";

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

function resolvePromoProduct(productId) {
    if (PRODUCTS[productId]) return productId;
    const aliases = {
        "cocacola-3l": p => /coca.?cola/i.test(p.name) && /3\s*l/i.test(p.name),
        "quilmes-473": p => /quilmes/i.test(p.name) && /473/i.test(p.name),
        "fernet-750": p => /fernet/i.test(p.name) && /750/i.test(p.name)
    };
    const matcher = aliases[productId];
    return matcher ? Object.values(PRODUCTS).find(matcher)?.id : null;
}

function addPromoProduct(productId) {
    const resolved = resolvePromoProduct(productId);
    if (!resolved) { alert('Uno de los productos de esta promoción no está disponible en el catálogo.'); return; }
    addToCart(resolved, 1, true);
}

function addPromoCombo() {
    const fernet = resolvePromoProduct("fernet-750");
    const cola = resolvePromoProduct("cocacola-3l");
    if (!fernet || !cola) { alert('No se puede armar el combo porque falta uno de sus productos en el catálogo.'); return; }
    addToCart(fernet, 1, false);
    addToCart(cola, 1, false);
    renderCart();
    openCart();
}

document.addEventListener("click", event => {
    const addButton = event.target.closest(".add-cart");
    if (addButton) {
        const pack = Number(addButton.dataset.pack || 1);
        addToCart(addButton.dataset.id, 1, false, pack);
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

    if (action === "increase") {
        const item=cart[id]; const product=PRODUCTS[id];
        if(product?.stock_enabled && (item.quantity+1)*(item.unitMultiplier||1)>Number(product.stock_quantity||0)){alert('No hay stock suficiente para aumentar esta cantidad.');return;}
        changeQuantity(id, 1);
    }
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


// Sincronización del catálogo público con Supabase.
// Si la consulta online todavía no tiene productos, se conserva el catálogo de muestra.
async function refreshCatalogFromSupabase() {
    if (!window.supabaseClient) return;
    try {
        const { data, error } = await window.supabaseClient
            .from("products")
            .select("id,name,category,description,image_url,active,stock_enabled,stock_quantity,sell_individual,sell_packs,pack_units")
            .eq("active", true)
            .order("created_at", { ascending: true });
        if (error) throw error;
        if (Array.isArray(data) && data.length) {
            PRODUCTS = Object.fromEntries(data.map(row => [row.id, {
                id: row.id,
                name: row.name,
                category: row.category,
                description: row.description || "",
                image: row.image_url || "",
                stock_enabled: row.stock_enabled === true,
                stock_quantity: Number(row.stock_quantity || 0),
                sell_individual: row.sell_individual !== false,
                sell_packs: row.sell_packs === true,
                pack_units: Number(row.pack_units || 0)
            }]));
            // Quitar del carrito productos que ya no están publicados.
            Object.keys(cart).forEach(id => { if (!PRODUCTS[id]) delete cart[id]; });
            saveCart();
            renderProducts();
            renderCart();
        }
    } catch (error) {
        console.warn("No se pudo actualizar el catálogo online; se conserva la vista disponible.", error);
    }
}
refreshCatalogFromSupabase();
window.setInterval(refreshCatalogFromSupabase, 30000);
