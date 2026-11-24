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
let COMMON_COMBOS = [];

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
    if (product.stock_enabled && requestedUnits > (Number(product.stock_quantity ?? product.stock ?? 0)-Number(product.stock_reserved||0))) { alert('No hay stock suficiente de ' + product.name + '.'); return; }
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
                ${product.stock_enabled ? `<small class="stock-label">${Math.max(0,Number(product.stock_quantity||0)-Number(product.stock_reserved||0))>0 ? (Math.max(0,Number(product.stock_quantity||0)-Number(product.stock_reserved||0))<=Number(product.stock_minimum||5)?'Pocas unidades':'Disponible') : 'Sin stock'}</small>` : ''}
                <div class="producto-bottom">
                    ${product.sell_individual !== false ? `<button class="add-cart" data-id="${product.id}" ${product.stock_enabled && (Number(product.stock_quantity||0)-Number(product.stock_reserved||0))<1?'disabled':''}>Agregar unidad</button>` : ''}
                    ${product.sell_packs === true && Number(product.pack_units)>=2 ? `<button class="add-cart add-pack" data-id="${product.id}" data-pack="${Number(product.pack_units)}" ${product.stock_enabled && (Number(product.stock_quantity||0)-Number(product.stock_reserved||0))<Number(product.pack_units)?'disabled':''}>Agregar pack x${Number(product.pack_units)}</button>` : ''}
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
                <div class="cart-item-title">${escapeHTML(item.name)}${item.unitMultiplier>1?` · Pack x${item.unitMultiplier}`:''}</div>${(item.comboNames||[]).length?`<small class="cart-combo-label">Combo: ${escapeHTML([...new Set(item.comboNames)].join(', '))}</small>`:''}
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

async function createOrderAndOpenWhatsApp(){
 const entries=getCartEntries();if(!entries.length)return;
 if(!window.supabaseClient){alert('No se pudo conectar con el sistema de pedidos.');return;}
 const popup=window.open('about:blank','_blank');
 try{
  const payload=entries.map(item=>({product_id:item.id,quantity:item.quantity,unit_multiplier:item.unitMultiplier||1}));
  const {data,error}=await window.supabaseClient.rpc('create_reserved_order',{p_tenant_slug:'distribuidora',p_customer_name:'Pedido web',p_customer_phone:'',p_items:payload,p_notes:null});
  if(error)throw error;
  const orderLabel=String(data||'').slice(0,8).toUpperCase();
  let message=`Hola! Envié el pedido #${orderLabel}. ¿Me confirman disponibilidad y precio?\n\n`;
  entries.forEach(item=>{const combo=(item.comboNames||[]).length?` [Combo: ${[...new Set(item.comboNames)].join(', ')}]`:'';message+=`• ${item.name} x${item.quantity}${item.unitMultiplier>1?` (pack de ${item.unitMultiplier} unidades)`:''}${combo}\n`;});
  message+='\nQuedo atento/a a la confirmación. ¡Gracias!';
  if(popup)popup.location.href=`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;else location.href=`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  clearCart();
 }catch(err){if(popup)popup.close();alert(err.message||'No se pudo reservar el pedido. Revisá el stock e intentá nuevamente.');}
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

function renderCommonCombos(){
 const grid=document.getElementById('promoGrid');if(!grid)return;
 if(!COMMON_COMBOS.length){grid.innerHTML='<p class="no-products">Por el momento no hay combos disponibles.</p>';return;}
 grid.innerHTML=COMMON_COMBOS.map(combo=>{const items=(combo.items||[]).map(i=>{const p=PRODUCTS[i.product_id];return p?`${escapeHTML(p.name)} × ${Number(i.quantity)||1}`:null}).filter(Boolean);return `<article class="promo-card promo-card-dark"><div class="promo-badge">COMBO</div><span class="promo-small">Combinación clásica</span><h3>${escapeHTML(combo.name)}</h3><p>${escapeHTML(combo.description||items.join(' + '))}</p><p class="promo-combo-items">${items.join(' · ')}</p><button class="promo-link promo-link-light" data-common-combo="${combo.id}">Agregar combo al carrito →</button></article>`}).join('');
}
function addCommonCombo(comboId){
 const combo=COMMON_COMBOS.find(c=>c.id===comboId);if(!combo)return;
 const components=(combo.items||[]).map(i=>({id:i.product_id,quantity:Number(i.quantity)||1,product:PRODUCTS[i.product_id]}));
 if(components.some(x=>!x.product)){alert('Este combo tiene productos que ya no están disponibles. Avisá a la distribuidora.');return;}
 const required={};components.forEach(x=>required[x.id]=(required[x.id]||0)+x.quantity);
 for(const [id,qty] of Object.entries(required)){const p=PRODUCTS[id];const inCart=cart[id]?.quantity||0;const available=Number(p.stock_quantity??p.stock??0)-Number(p.stock_reserved||0);if(p.stock_enabled&&qty+inCart>available){alert(`No hay stock suficiente de ${p.name} para completar el combo.`);return;}}
 components.forEach(x=>{if(cart[x.id]){cart[x.id].quantity+=x.quantity;cart[x.id].comboNames=[...(cart[x.id].comboNames||[]),combo.name];}else{cart[x.id]={...x.product,quantity:x.quantity,unitMultiplier:1,comboNames:[combo.name]};}});
 saveCart();renderCart();openCart();
}
async function loadCommonCombos(){
 if(!window.supabaseClient)return;
 try{const {data,error}=await window.supabaseClient.from('common_combos').select('id,name,description,items,active').eq('active',true).order('created_at',{ascending:false});if(error)throw error;COMMON_COMBOS=data||[];renderCommonCombos();}catch(error){console.warn('No se pudieron cargar los combos:',error.message);const grid=document.getElementById('promoGrid');if(grid)grid.innerHTML='<p class="no-products">No fue posible cargar los combos. Consultá por WhatsApp.</p>';}
}

document.addEventListener("click", event => {
    const addButton = event.target.closest(".add-cart");
    if (addButton) {
        const pack = Number(addButton.dataset.pack || 1);
        addToCart(addButton.dataset.id, 1, false, pack);
        return;
    }

    const commonCombo = event.target.closest("[data-common-combo]");
    if (commonCombo) addCommonCombo(commonCombo.dataset.commonCombo);
});

cartItems.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const { action, id } = button.dataset;

    if (action === "increase") {
        const item=cart[id]; const product=PRODUCTS[id];
        if(product?.stock_enabled && (item.quantity+1)*(item.unitMultiplier||1)>(Number(product.stock_quantity||0)-Number(product.stock_reserved||0))){alert('No hay stock suficiente para aumentar esta cantidad.');return;}
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

checkoutWhatsApp.addEventListener("click", event=>{event.preventDefault();if(!checkoutWhatsApp.classList.contains("disabled"))createOrderAndOpenWhatsApp();});
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
            .select("id,name,category,description,image_url,active,stock_enabled,stock_quantity,stock_reserved,stock_minimum,sell_individual,sell_packs,pack_units")
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
                stock_reserved: Number(row.stock_reserved || 0),
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
        await loadCommonCombos();
    } catch (error) {
        console.warn("No se pudo actualizar el catálogo online; se conserva la vista disponible.", error);
    }
}
refreshCatalogFromSupabase();
loadCommonCombos();
window.setInterval(refreshCatalogFromSupabase, 30000);
