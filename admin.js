const DEFAULT_PRODUCTS = [
 ['Agua mineral 500 ml','aguas','Agua mineral sin gas','img/agua_500.jpg'],
 ['Agua con gas 500 ml','aguas','Agua mineral con gas','img/aguacongas_500.jpg'],
 ['Agua mineral 1.5 L','aguas','Ideal para llevar','img/agua_15.jpg'],
 ['Agua mineral 2.25 L','aguas','Presentación familiar','img/agua_225.jpg'],
 ['Coca-Cola 2.25 L','gaseosas','Presentación familiar','img/cocacola_225.jpg'],
 ['Coca-Cola 3 L','gaseosas','Presentación familiar','img/cocacola_3l.jpg'],
 ['Coca-Cola Zero 2.25 L','gaseosas','Sin azúcar','img/cocacola_zero225.jpg'],
 ['Pepsi 2.25 L','gaseosas','Presentación familiar','img/pepsi_225.jpg'],
 ['Sprite 2.25 L','gaseosas','Sabor lima-limón','img/sprite_225.jpg'],
 ['Fanta 2.25 L','gaseosas','Sabor naranja','img/fanta_225.jpg'],
 ['Quilmes lata 473 ml','cervezas','Lata 473 ml','img/quilmes_473.jpg'],
 ['Brahma lata 473 ml','cervezas','Lata 473 ml','img/brahma_473.png'],
 ['Stella Artois lata 473 ml','cervezas','Lata 473 ml','img/stella_473.jpg'],
 ['Heineken lata 710 ml','cervezas','Lata 710 ml','img/heineken_710.jpg'],
 ['Stella Artois Negra botella 1 L','cervezas','Botella 1 L','img/stella_1l.jpg'],
 ['Smirnoff 1 L','vodkas','Botella 1 L','img/smirnoff_1l.jpg'],
 ['Fernet 750 ml','fernet','Botella 750 ml','img/fernet_750.jpg'],
 ['Baggio Multifruta 1 L','jugos','Jugo multifruta','img/baggiomulti_1l.jpg'],
 ['Cepita 1 L','jugos','Jugo listo para tomar','img/cepita_1l.png']
];
let products = [];
let selectedImage = '', selectedSource = '', toastTimer, currentProfile = null;
const $ = id => document.getElementById(id);
const getSupabaseClient = () => window.supabaseClient;
function escapeHTML(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function categoryName(key){return ({aguas:'Aguas',gaseosas:'Gaseosas',cervezas:'Cervezas',vodkas:'Vodkas',fernet:'Fernet',jugos:'Jugos',otros:'Otros'})[key]||'Otros'}
function notify(msg){$('toast').textContent=msg;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2800);}
function showLogin(){
  let gate=$('loginGate');
  if (!gate) {
    gate=document.createElement('div'); gate.id='loginGate'; gate.className='login-gate';
    gate.innerHTML=`<form class="login-card" id="loginForm"><div class="login-brand">D</div><p class="eyebrow">PANEL PRIVADO</p><h1>Administración</h1><p class="login-copy">Ingresá con tu cuenta para gestionar el catálogo.</p><label>Usuario<input id="loginEmail" type="text" autocomplete="username" required placeholder="Ingresá tu usuario"></label><label>Contraseña<input id="loginPassword" type="password" autocomplete="current-password" required placeholder="Tu contraseña"></label><p class="login-error" id="loginError" role="alert"></p><button class="primary login-submit" type="submit" id="loginSubmit">Ingresar</button><small>Acceso exclusivo para usuarios autorizados.</small></form>`;
    document.body.appendChild(gate);
  }
  const form=$('loginForm');
  if (form && !form.dataset.bound) { form.addEventListener('submit',login); form.dataset.bound='1'; }
}
async function login(e){
 e.preventDefault(); const btn=$('loginSubmit'), err=$('loginError');
 if (!getSupabaseClient()) { err.textContent='No se pudo conectar con Supabase. Revisá tu conexión.'; return; }
 btn.disabled=true;btn.textContent='Ingresando…';err.textContent='';
 try {
   const enteredUser=$('loginEmail').value.trim();
   // Alias sencillo para la cuenta de prueba de la clienta.
   const email=enteredUser.toLowerCase()==='cliente' ? 'cliente@cuentas.pulsodigital.test' : enteredUser;
   const {data,error}=await getSupabaseClient().auth.signInWithPassword({email,password:$('loginPassword').value});
   if(error) throw error;
   await loadProfile(data.user);
 } catch(error) {
   console.error('Error de inicio de sesión:',error);
   err.textContent=error?.message||'No se pudo iniciar sesión. Revisá el usuario y la contraseña.';
 } finally { if($('loginSubmit')) { $('loginSubmit').disabled=false; $('loginSubmit').textContent='Ingresar'; } }
}
async function loadProfile(user){
 const {data,error}=await getSupabaseClient().from('profiles').select('user_id,tenant_id,role,username').eq('user_id',user.id).maybeSingle();
 if(error||!data||!['platform_admin','tenant_admin'].includes(data.role)){
   await getSupabaseClient().auth.signOut();
   const loginError=$('loginError');
   if(loginError) loginError.textContent=error?.message||'La cuenta no tiene un perfil administrativo habilitado.';
   return;
 }
 currentProfile=data;
 $('loginGate')?.remove();
 $('layout')?.classList.add('admin-ready');
 addSessionControls();
 await loadProducts();
 startReminderMonitor();
}
function addSessionControls(){
 const actions=document.querySelector('.top-actions'); if(!actions||$('logoutButton'))return;
 const who=document.createElement('span');who.className='session-user';who.textContent=currentProfile.username||'Usuario';
 const out=document.createElement('button');out.id='logoutButton';out.className='logout-button';out.textContent='Cerrar sesión';
 out.onclick=async()=>{await getSupabaseClient().auth.signOut();location.reload();};
 actions.append(who,out);
}
function mapRow(row){return {id:row.id,name:row.name,category:row.category,description:row.description||'',shortDescription:row.description||'',image:row.image_url||'',active:row.active!==false,inactiveReason:row.inactive_reason||'',barcode:row.barcode||'',stockEnabled:row.stock_enabled===true,stock: Number(row.stock_quantity||0),stockMinimum:Number(row.stock_minimum??5),sellIndividual:row.sell_individual!==false,sellPacks:row.sell_packs===true,packUnits:Number(row.pack_units||0)};}
async function loadProducts(){
 if(!currentProfile?.tenant_id){notify('La cuenta no tiene una distribuidora asignada.');return;}
 // Limitar la consulta explícitamente al tenant de la sesión evita mezclar
 // catálogos y permite detectar inconsistencias entre perfil y productos.
 const {data,error}=await getSupabaseClient()
   .from('products')
   .select('*')
   .eq('tenant_id',currentProfile.tenant_id)
   .order('created_at',{ascending:true});
 if(error){
   console.error('Error al recuperar productos del tenant:',error);
   notify('No se pudo cargar el catálogo online: '+error.message);
   return;
 }
 products=(data||[]).map(mapRow);
 refresh();
 await loadStock();
 await loadOrders();
 await loadCombos();
 if(!products.length) notify('No hay productos guardados para esta distribuidora.');
}
function refresh(){const active=products.filter(p=>p.active!==false);$('statProducts').textContent=active.length;$('statCategories').textContent=new Set(active.map(p=>p.category)).size;$('statImages').textContent=active.filter(p=>p.image).length;renderTable();}
let inventoryRows=[], orderRows=[];
let reminderTimer=null, activeReminderId=null, reminderBusy=false;
function stockStatus(p){const available=Math.max(0,Number(p.stock_quantity||0)-Number(p.stock_reserved||0));const min=Number(p.stock_minimum??5);return available<=0?'Sin stock':available<=min?'Stock bajo':'Disponible';}
async function loadStock(){
 const {data,error}=await getSupabaseClient().from('products').select('id,name,category,active,stock_enabled,stock_quantity,stock_reserved,stock_minimum').eq('tenant_id',currentProfile.tenant_id).eq('stock_enabled',true).order('name');
 if(error){notify('No se pudo cargar el inventario: '+error.message);return;}
 inventoryRows=data||[];renderStock();
 const {data:moves,error:moveError}=await getSupabaseClient().from('stock_movements').select('id,product_id,movement_type,quantity,reason,supplier,created_at').eq('tenant_id',currentProfile.tenant_id).order('created_at',{ascending:false}).limit(30);
 if(!moveError){$('movementTable').innerHTML=(moves||[]).map(m=>{const p=products.find(x=>x.id===m.product_id);return `<tr><td>${new Date(m.created_at).toLocaleString('es-AR')}</td><td>${escapeHTML(p?.name||'Producto')}</td><td>${escapeHTML(m.movement_type)}</td><td>${m.quantity}</td><td>${escapeHTML([m.reason,m.supplier].filter(Boolean).join(' · ')||'—')}</td></tr>`}).join('');}
}
function renderStock(){const q=($('stockSearch')?.value||'').toLowerCase(),f=$('stockFilter')?.value||'all';const list=inventoryRows.filter(p=>{const a=Math.max(0,p.stock_quantity-p.stock_reserved),status=stockStatus(p);return (!q||p.name.toLowerCase().includes(q))&&(f==='all'||(f==='low'&&status==='Stock bajo')||(f==='empty'&&status==='Sin stock')||(f==='reserved'&&p.stock_reserved>0));});
 const available=inventoryRows.reduce((n,p)=>n+Math.max(0,p.stock_quantity-p.stock_reserved),0);$('stockAvailable').textContent=available;$('stockLow').textContent=inventoryRows.filter(p=>stockStatus(p)==='Stock bajo').length;$('stockEmpty').textContent=inventoryRows.filter(p=>stockStatus(p)==='Sin stock').length;
 $('stockTable').innerHTML=list.map(p=>{const a=Math.max(0,p.stock_quantity-p.stock_reserved);return `<tr><td><strong>${escapeHTML(p.name)}</strong></td><td>${p.stock_quantity}</td><td>${p.stock_reserved}</td><td><strong>${a}</strong></td><td>${p.stock_minimum}</td><td>${stockStatus(p)}</td><td><button data-restock="${p.id}">＋ Reponer</button></td></tr>`}).join('');$('stockEmptyState').hidden=list.length>0;
}
function openRestockModal(id){
 const product=inventoryRows.find(p=>p.id===id);if(!product)return;
 $('restockProductId').value=product.id;$('restockProductName').textContent=product.name;
 $('restockCurrentStock').textContent=`Stock físico: ${product.stock_quantity} · Reservado: ${product.stock_reserved} · Disponible: ${Math.max(0,product.stock_quantity-product.stock_reserved)}`;
 const image=$('restockProductImage'),fallback=$('restockNoImage'),catalogProduct=products.find(p=>p.id===id);
 if(catalogProduct?.image){image.src=catalogProduct.image;image.hidden=false;fallback.hidden=true;image.onerror=()=>{image.hidden=true;fallback.hidden=false;};}else{image.removeAttribute('src');image.hidden=true;fallback.hidden=false;}
 $('restockForm').reset();$('restockProductId').value=product.id;$('restockProductName').textContent=product.name;$('restockCurrentStock').textContent=`Stock físico: ${product.stock_quantity} · Reservado: ${product.stock_reserved} · Disponible: ${Math.max(0,product.stock_quantity-product.stock_reserved)}`;$('restockError').textContent='';
 $('restockModal').classList.add('open');$('restockModal').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';$('restockQuantity').focus();
}
function closeRestockModal(){ $('restockModal').classList.remove('open');$('restockModal').setAttribute('aria-hidden','true');document.body.style.overflow=''; }
async function submitRestock(e){
 e.preventDefault();const id=$('restockProductId').value,qty=Number($('restockQuantity').value),reason=$('restockReason').value;
 if(!Number.isInteger(qty)||qty<=0){$('restockError').textContent='Ingresá una cantidad entera mayor que cero.';return;}
 if(!reason){$('restockError').textContent='Seleccioná el motivo del ingreso.';return;}
 const btn=$('saveRestock');btn.disabled=true;btn.textContent='Registrando…';$('restockError').textContent='';
 try{const {error}=await getSupabaseClient().rpc('restock_product',{p_product_id:id,p_quantity:qty,p_movement_type:'restock',p_reason:reason,p_supplier:$('restockSupplier').value.trim()||null,p_reference:null,p_notes:$('restockNotes').value.trim()||null});if(error)throw error;closeRestockModal();await loadProducts();notify(`Se registró el ingreso de ${qty} unidades.`);}
 catch(error){$('restockError').textContent='No se pudo reponer: '+(error.message||'Error inesperado');}
 finally{btn.disabled=false;btn.textContent='＋ Registrar ingreso';}
}
async function loadOrders(){const {data,error}=await getSupabaseClient().from('orders').select('id,order_number,status,reservation_expires_at,reminder_count,created_at,confirmed_at,order_items(product_name,quantity,unit_multiplier,units)').eq('tenant_id',currentProfile.tenant_id).order('created_at',{ascending:false}).limit(150);if(error){console.warn('Pedidos:',error.message);$('ordersTable').innerHTML='';return;}orderRows=data||[];renderOrders();checkOrderReminder();}
function checkOrderReminder(){
 if(!currentProfile||reminderBusy)return;
 const now=Date.now();
 if(activeReminderId){const current=orderRows.find(o=>o.id===activeReminderId);if(!current||current.status!=='pending'||new Date(current.reservation_expires_at).getTime()>now+60000){closeOrderReminder();}else{return;}}
 const due=orderRows.filter(o=>o.status==='pending' && new Date(o.reservation_expires_at).getTime()<=now+60000 && new Date(o.reservation_expires_at).getTime()>now).sort((a,b)=>new Date(a.reservation_expires_at)-new Date(b.reservation_expires_at));
 if(due.length)showOrderReminder(due[0]);
}
function showOrderReminder(order){
 activeReminderId=order.id;
 const second=Number(order.reminder_count||0)>=1;
 $('reminderTitle').textContent=second?'¡Pedido todavía sin resolver!':'¿Se concretó este pedido?';
 $('reminderBadge').textContent=second?'SEGUNDO AVISO':'PRIMER AVISO';
 $('reminderOrderNumber').textContent=`Pedido #${order.order_number}`;
 $('reminderCustomer').textContent=order.customer_name||'Cliente';
 $('reminderPhone').textContent=order.customer_phone||'No informado';
 $('reminderItems').innerHTML=(order.order_items||[]).map(i=>`<li>${escapeHTML(i.product_name)} × ${i.quantity}${i.unit_multiplier>1?` (pack x${i.unit_multiplier})`:''}</li>`).join('')||'<li>Detalle no disponible</li>';
 $('reminderCount').textContent=second?`Segundo aviso · ${order.reminder_count} extensión(es) utilizada(s)`:'La reserva está por vencer. Elegí una opción para mantener actualizado el inventario.';
 $('reminderCancel').hidden=!second;
 $('orderReminderModal').classList.add('open');$('orderReminderModal').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
}
function closeOrderReminder(){ $('orderReminderModal').classList.remove('open');$('orderReminderModal').setAttribute('aria-hidden','true');document.body.style.overflow='';activeReminderId=null; }
async function handleReminder(action){
 if(!activeReminderId||reminderBusy)return;reminderBusy=true;
 const id=activeReminderId;['reminderConfirm','reminderExtend','reminderCancel'].forEach(x=>$(x).disabled=true);
 try{
  if(action==='confirmed'||action==='cancelled'){
   const {error}=await getSupabaseClient().rpc('set_order_status',{p_order_id:id,p_status:action});if(error)throw error;
   notify(action==='confirmed'?'Venta confirmada y stock actualizado.':'Pedido cancelado y stock liberado.');
  }else{
   const {error}=await getSupabaseClient().rpc('extend_order_reservation',{p_order_id:id});if(error)throw error;
   notify('Reserva extendida por 5 minutos.');
  }
  closeOrderReminder();await loadOrders();await loadProducts();
 }catch(e){notify('No se pudo actualizar el pedido: '+(e.message||'Error'));closeOrderReminder();await loadOrders();}
 finally{reminderBusy=false;['reminderConfirm','reminderExtend','reminderCancel'].forEach(x=>$(x).disabled=false);}
}
function startReminderMonitor(){if(reminderTimer)clearInterval(reminderTimer);reminderTimer=setInterval(async()=>{if(!currentProfile||document.hidden)return;await loadOrders();},5000);}
function renderOrders(){const q=($('orderSearch')?.value||'').toLowerCase(),f=$('orderFilter')?.value||'all';const rows=orderRows.filter(o=>(f==='all'||o.status===f)&&(!q||String(o.order_number).includes(q)));const labels={pending:'Pendiente',confirmed:'Confirmado',cancelled:'Cancelado',expired:'Vencido'};$('ordersTable').innerHTML=rows.map(o=>{const detail=(o.order_items||[]).map(i=>`${escapeHTML(i.product_name)} × ${i.quantity}${i.unit_multiplier>1?` (pack x${i.unit_multiplier})`:''}`).join('<br>');const actions=o.status==='pending'?`<button data-order-confirm="${o.id}">Confirmar</button> <button class="delete" data-order-cancel="${o.id}">Cancelar</button>`:o.status==='confirmed'?`<button class="remito-button" data-remito="${o.id}">↓ Descargar remito PDF</button>`:'—';return `<tr><td>#${o.order_number}</td><td>${new Date(o.created_at).toLocaleString('es-AR')}</td><td>${detail}</td><td>${labels[o.status]||o.status}</td><td>${o.status==='pending'?new Date(o.reservation_expires_at).toLocaleTimeString('es-AR'):'—'}</td><td>${actions}</td></tr>`}).join('');$('ordersEmpty').hidden=rows.length>0;}
function downloadOrderRemito(orderId){
 const order=orderRows.find(o=>o.id===orderId);
 if(!order||order.status!=='confirmed'){notify('El remito solo está disponible para ventas confirmadas.');return;}
 if(!window.jspdf?.jsPDF){notify('No se pudo cargar el generador de PDF. Revisá la conexión e intentá nuevamente.');return;}
 const {jsPDF}=window.jspdf;const doc=new jsPDF({unit:'mm',format:'a4'});const pageWidth=doc.internal.pageSize.getWidth();const margin=18;let y=22;
 const line=(label,value)=>{doc.setFont('helvetica','bold');doc.text(label,margin,y);doc.setFont('helvetica','normal');doc.text(String(value),margin+42,y);y+=7;};
 doc.setFont('helvetica','bold');doc.setFontSize(18);doc.text('DISTRIBUIDORA',margin,y);y+=9;
 doc.setFontSize(13);doc.text('REMITO INTERNO DE VENTA',margin,y);y+=6;
 doc.setFontSize(9);doc.setFont('helvetica','bold');doc.text('COMPROBANTE INTERNO - NO FISCAL',margin,y);y+=11;
 doc.setDrawColor(40);doc.line(margin,y,pageWidth-margin,y);y+=9;
 doc.setFontSize(11);line('Número de pedido:',`#${order.order_number}`);line('Fecha del pedido:',new Date(order.created_at).toLocaleString('es-AR'));
 line('Venta confirmada:',order.confirmed_at?new Date(order.confirmed_at).toLocaleString('es-AR'):'Fecha no disponible');
 y+=3;doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text('DETALLE DE PRODUCTOS',margin,y);y+=8;
 doc.setFontSize(10);doc.setFont('helvetica','bold');doc.text('Producto',margin,y);doc.text('Cantidad',pageWidth-margin,y,{align:'right'});y+=3;doc.line(margin,y,pageWidth-margin,y);y+=7;doc.setFont('helvetica','normal');
 const items=order.order_items||[];
 for(const item of items){
  const presentation=Number(item.unit_multiplier||1)>1?` (pack x${item.unit_multiplier})`:'';
  const productLines=doc.splitTextToSize(`${item.product_name}${presentation}`,pageWidth-margin*2-35);
  const rowHeight=Math.max(7,productLines.length*5);
  if(y+rowHeight>275){doc.addPage();y=20;}
  doc.text(productLines,margin,y);doc.text(String(item.quantity),pageWidth-margin,y,{align:'right'});y+=rowHeight;
 }
 if(!items.length){doc.text('No hay productos registrados en el detalle del pedido.',margin,y);y+=7;}
 y+=7;doc.setDrawColor(40);doc.line(margin,y,pageWidth-margin,y);y+=9;
 doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text('Documento generado para control interno de la distribuidora.',margin,y);y+=6;doc.setFont('helvetica','normal');doc.text('No reemplaza factura ni comprobante fiscal.',margin,y);
 doc.setFontSize(8);doc.setTextColor(100);doc.text(`Remito asociado al pedido #${order.order_number}`,margin,287);doc.text('Pulso Digital',pageWidth-margin,287,{align:'right'});
 const number=String(order.order_number).padStart(6,'0');doc.save(`remito-pedido-${number}.pdf`);
}
async function setOrderStatus(id,status){const action=status==='confirmed'?'confirmar la venta':'cancelar el pedido y liberar la reserva';if(!confirm(`¿Querés ${action}?`))return;const {error}=await getSupabaseClient().rpc('set_order_status',{p_order_id:id,p_status:status});if(error){notify('No se pudo actualizar el pedido: '+error.message);return;}await loadOrders();await loadProducts();notify(status==='confirmed'?'Venta confirmada y stock actualizado.':'Pedido cancelado y reserva liberada.');}

let comboRows=[];
function comboProductOptions(selected=''){
 const opts=products.filter(p=>p.active!==false).map(p=>`<option value="${escapeHTML(p.id)}" ${p.id===selected?'selected':''}>${escapeHTML(p.name)}</option>`).join('');
 return `<option value="">Seleccionar producto</option>${opts}`;
}
async function loadCombos(){
 const {data,error}=await getSupabaseClient().from('common_combos').select('*').eq('tenant_id',currentProfile.tenant_id).order('created_at',{ascending:false});
 if(error){console.warn('Combos:',error.message);notify('No se pudieron cargar los combos: '+error.message);return;}
 comboRows=data||[];renderCombos();
}
function renderCombos(){
 $('combosTable').innerHTML=comboRows.map(c=>{const names=(c.items||[]).map(i=>{const p=products.find(x=>x.id===i.product_id);return `${escapeHTML(p?.name||'Producto')} × ${Number(i.quantity)||1}`}).join('<br>');return `<tr><td><strong>${escapeHTML(c.name)}</strong><small>${escapeHTML(c.description||'')}</small></td><td>${names}</td><td>${c.active?'● Activo':'Inactivo'}</td><td><div class="row-actions"><button data-combo-edit="${c.id}">Editar</button><button class="delete" data-combo-toggle="${c.id}">${c.active?'Desactivar':'Activar'}</button></div></td></tr>`}).join('');
 $('combosEmpty').hidden=comboRows.length>0;
}
function openComboModal(combo=null){
 $('comboForm').reset();$('comboError').textContent='';$('comboId').value=combo?.id||'';$('comboName').value=combo?.name||'';$('comboDescription').value=combo?.description||'';$('comboActive').checked=combo?.active!==false;
 const items=combo?.items||[];$('comboProduct1').innerHTML=comboProductOptions(items[0]?.product_id||'');$('comboProduct2').innerHTML=comboProductOptions(items[1]?.product_id||'');$('comboQty1').value=items[0]?.quantity||1;$('comboQty2').value=items[1]?.quantity||1;$('comboModalTitle').textContent=combo?'Editar combo':'Crear combo';$('comboModal').classList.add('open');$('comboModal').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
}
function closeComboModal(){$('comboModal').classList.remove('open');$('comboModal').setAttribute('aria-hidden','true');document.body.style.overflow='';}
async function saveCombo(e){e.preventDefault();const id=$('comboId').value,p1=$('comboProduct1').value,p2=$('comboProduct2').value,q1=Number($('comboQty1').value),q2=Number($('comboQty2').value);if(!p1||!p2||p1===p2){$('comboError').textContent='Elegí dos productos diferentes.';return;}if(!Number.isInteger(q1)||q1<1||!Number.isInteger(q2)||q2<1){$('comboError').textContent='Las cantidades deben ser números enteros mayores que cero.';return;}
 const payload={tenant_id:currentProfile.tenant_id,name:$('comboName').value.trim(),description:$('comboDescription').value.trim(),items:[{product_id:p1,quantity:q1},{product_id:p2,quantity:q2}],active:$('comboActive').checked,updated_at:new Date().toISOString()};const btn=$('saveCombo');btn.disabled=true;try{let result=id?await getSupabaseClient().from('common_combos').update(payload).eq('id',id).eq('tenant_id',currentProfile.tenant_id):await getSupabaseClient().from('common_combos').insert(payload);if(result.error)throw result.error;closeComboModal();await loadCombos();notify(id?'Combo actualizado':'Combo creado');}catch(err){$('comboError').textContent='No se pudo guardar: '+err.message;}finally{btn.disabled=false;}}
async function toggleCombo(id){const c=comboRows.find(x=>x.id===id);if(!c)return;const {error}=await getSupabaseClient().from('common_combos').update({active:!c.active,updated_at:new Date().toISOString()}).eq('id',id).eq('tenant_id',currentProfile.tenant_id);if(error){notify('No se pudo actualizar el combo: '+error.message);return;}await loadCombos();}

function renderTable(){const q=$('filterProducts').value.trim().toLowerCase(),cat=$('filterCategory').value;const list=products.filter(p=>(cat==='todos'||p.category===cat)&&(!q||`${p.name} ${p.description||''}`.toLowerCase().includes(q)));$('productsTable').innerHTML=list.map(p=>`<tr><td><div class="product-cell"><img src="${escapeHTML(p.image||'')}" alt=""><div><strong>${escapeHTML(p.name)}</strong><small>${escapeHTML(p.description||'')}</small></div></div></td><td><span class="category-tag">${categoryName(p.category)}</span></td><td>${p.image?'Asignada':'Pendiente'}</td><td>${p.stockEnabled?`${p.stock} u.`:'Sin control'}</td><td>${p.sellPacks?`Pack x${p.packUnits}`:(p.sellIndividual?'Individual':'Sin modalidad')}</td><td><span class="status">${p.active===false?'Inactivo':'● Activo'}</span>${p.active===false&&p.inactiveReason?`<small class="inactive-reason">${escapeHTML(reasonLabel(p.inactiveReason))}</small>`:''}</td><td><div class="row-actions"><button data-edit="${escapeHTML(p.id)}">Editar</button><button class="delete" data-delete="${escapeHTML(p.id)}">Eliminar</button></div></td></tr>`).join('');$('emptyState').hidden=list.length>0;}
function reasonLabel(value){return ({sin_stock:'Sin stock',no_se_vende:'Ya no se vende',temporal:'Desactivación temporal',otro:'Otro motivo'})[value]||'Sin motivo indicado';}
function syncInactiveReason(){const inactive=!$('productActive').checked;$('inactiveReasonWrap').hidden=!inactive;$('inactiveReason').required=inactive;if(!inactive)$('inactiveReason').value='';}
function openModal(product){$('productForm').reset();$('formError').textContent='';selectedImage=product?.image||'';selectedSource=product?'Imagen guardada':'';$('productId').value=product?.id||'';$('productActive').checked=product?.active!==false;$('inactiveReason').value=product?.inactiveReason||'';syncInactiveReason();$('productName').value=product?.name||'';$('productCategory').value=product?.category||'gaseosas';$('productDescription').value=product?.description||'';$('productShortDescription').value=product?.shortDescription||'';$('stockEnabled').checked=product?.stockEnabled||false;$('productStock').value=product?.stock??0;$('stockMinimum').value=product?.stockMinimum??5;$('sellIndividual').checked=product?.sellIndividual!==false;$('sellPacks').checked=product?.sellPacks||false;$('packUnits').value=product?.packUnits||6;$('imageQuery').value=product?.name||'';$('imageUrl').value='';$('imageResults').innerHTML='<div class="search-placeholder">Buscá un producto para ver imágenes disponibles.</div>';setTab('search');showSelected();$('modalTitle').textContent=product?'Editar producto':'Agregar producto';$('productModal').classList.add('open');$('productModal').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
function closeModal(){$('productModal').classList.remove('open');$('productModal').setAttribute('aria-hidden','true');document.body.style.overflow='';}
function setTab(name){document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));document.querySelectorAll('.image-pane').forEach(p=>p.classList.toggle('active',p.id===`pane-${name}`));}
function showSelected(){const box=$('selectedImageBox'),preview=$('selectedImagePreview'),placeholder=$('selectedImagePlaceholder');box.hidden=!selectedImage;if(selectedImage){preview.hidden=false;placeholder.hidden=true;preview.onload=()=>{preview.hidden=false;placeholder.hidden=true};preview.onerror=()=>{preview.hidden=true;placeholder.hidden=false};preview.src=selectedImage;$('selectedImageSource').textContent=selectedSource||'Imagen lista para guardar';}else{preview.removeAttribute('src');preview.hidden=true;placeholder.hidden=true;}}
async function searchImages(){const term=$('imageQuery').value.trim()||$('productName').value.trim();if(!term){$('formError').textContent='Escribí el nombre del producto para buscar.';return}$('formError').textContent='';$('imageResults').innerHTML='<div class="search-placeholder">Buscando coincidencias en Open Food Facts…</div>';$('searchImages').disabled=true;try{const url=`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(term)}&search_simple=1&action=process&json=1&page_size=16`;const response=await fetch(url,{headers:{Accept:'application/json'}});if(!response.ok)throw new Error();const data=await response.json();const matches=(data.products||[]).filter(p=>p.image_front_url||p.image_url).slice(0,12);if(!matches.length){$('imageResults').innerHTML='<div class="search-placeholder">No encontramos imágenes. Probá con marca + sabor + tamaño o subí una imagen propia.</div>';return}$('imageResults').innerHTML=matches.map(p=>{const img=p.image_front_url||p.image_url,title=p.product_name||p.product_name_es||'Producto sin nombre';return `<button type="button" class="image-result" data-image="${escapeHTML(img)}" data-title="${escapeHTML(title)}"><img src="${escapeHTML(img)}" alt=""><strong>${escapeHTML(title)}</strong><small>${escapeHTML(p.brands||'Open Food Facts')}</small></button>`}).join('');}catch{$('imageResults').innerHTML='<div class="search-placeholder">No fue posible conectar con Open Food Facts. Podés subir una imagen propia.</div>';}finally{$('searchImages').disabled=false;}}
async function fileToDataURL(file){if(!file.type.startsWith('image/'))throw new Error('Seleccioná un archivo de imagen.');const raw=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)});const img=await new Promise((resolve,reject)=>{const el=new Image();el.onload=()=>resolve(el);el.onerror=reject;el.src=raw});const max=900,scale=Math.min(1,max/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',.82);}
async function uploadImageIfNeeded(value){
 if(!value.startsWith('data:'))return value;
 const blob=await (await fetch(value)).blob();
 const path=`${currentProfile.tenant_id}/${crypto.randomUUID()}.jpg`;
 const {error}=await getSupabaseClient().storage.from('product-images').upload(path,blob,{contentType:'image/jpeg',upsert:false});
 if(error)throw error;
 const {data}=getSupabaseClient().storage.from('product-images').getPublicUrl(path);
 return data.publicUrl;
}
async function saveProduct(e){
 e.preventDefault();const name=$('productName').value.trim();if(!name){$('formError').textContent='El nombre es obligatorio.';return}if(!selectedImage){$('formError').textContent='Tenés que seleccionar o subir una imagen antes de guardar.';return}if(!$('productActive').checked&&!$('inactiveReason').value){$('formError').textContent='Seleccioná por qué se desactiva el producto.';return}
 const btn=$('saveProduct');btn.disabled=true;btn.textContent='Guardando…';
 try{
  const image_url=await uploadImageIfNeeded(selectedImage);
  const stockEnabled=$('stockEnabled').checked, sellPacks=$('sellPacks').checked, packUnits=Math.floor(Number($('packUnits').value));if(sellPacks&&(!Number.isInteger(packUnits)||packUnits<2)){throw new Error('Indicá cuántas unidades contiene cada pack (mínimo 2).');}const payload={tenant_id:currentProfile.tenant_id,name,category:$('productCategory').value,description:$('productDescription').value.trim()||$('productShortDescription').value.trim(),image_url,active:$('productActive').checked,inactive_reason:$('productActive').checked?null:$('inactiveReason').value,stock_enabled:stockEnabled,stock_quantity:Math.max(0,Math.floor(Number($('productStock').value)||0)),stock_minimum:Math.max(0,Math.floor(Number($('stockMinimum').value)||0)),sell_individual:$('sellIndividual').checked,sell_packs:sellPacks,pack_units:sellPacks?packUnits:null,updated_at:new Date().toISOString()};
  const id=$('productId').value;let result;
  if(id)result=await getSupabaseClient().from('products').update(payload).eq('id',id).eq('tenant_id',currentProfile.tenant_id).select().single();
  else result=await getSupabaseClient().from('products').insert(payload).select().single();
  if(result.error)throw result.error;
  const row=mapRow(result.data);if(id){const i=products.findIndex(p=>p.id===id);if(i>=0)products[i]=row;}else products.unshift(row);
  refresh();closeModal();notify(id?'Producto actualizado online':'Producto agregado online');
 }catch(err){$('formError').textContent='No se pudo guardar: '+(err.message||'Error de conexión');}
 finally{btn.disabled=false;btn.textContent='Guardar producto';}
}
function confirmDeleteProduct(product){
 return new Promise(resolve=>{
  const backdrop=$('deleteConfirm');
  $('deleteConfirmMessage').textContent=`¿Estás seguro de que querés eliminar “${product.name}”? Esta acción no se puede deshacer.`;
  backdrop.classList.add('open');backdrop.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
  const finish=value=>{backdrop.classList.remove('open');backdrop.setAttribute('aria-hidden','true');document.body.style.overflow='';$('cancelDelete').removeEventListener('click',cancel);$('acceptDelete').removeEventListener('click',accept);backdrop.removeEventListener('click',outside);document.removeEventListener('keydown',onKey);resolve(value);};
  const cancel=()=>finish(false),accept=()=>finish(true),outside=e=>{if(e.target===backdrop)cancel();},onKey=e=>{if(e.key==='Escape')cancel();};
  $('cancelDelete').addEventListener('click',cancel);$('acceptDelete').addEventListener('click',accept);backdrop.addEventListener('click',outside);document.addEventListener('keydown',onKey);$('cancelDelete').focus();
 });
}
async function deleteProduct(id){
 const p=products.find(x=>x.id===id);if(!p||!await confirmDeleteProduct(p))return;
 const {error}=await getSupabaseClient().from('products').delete().eq('id',id).eq('tenant_id',currentProfile.tenant_id);
 if(error){notify('No se pudo eliminar: '+error.message);return;}
 products=products.filter(x=>x.id!==id);refresh();notify('Producto eliminado online');
}
function bindUI(){
 $('newProduct').onclick=$('newProductTop').onclick=()=>openModal();$('closeModal').onclick=$('cancelForm').onclick=closeModal;$('filterProducts').oninput=renderTable;$('filterCategory').onchange=renderTable;
 document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));$('searchImages').onclick=searchImages;$('imageQuery').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();searchImages();}});
 $('imageResults').addEventListener('click',e=>{const btn=e.target.closest('[data-image]');if(!btn)return;selectedImage=btn.dataset.image;selectedSource=`Open Food Facts · ${btn.dataset.title}`;document.querySelectorAll('.image-result').forEach(x=>x.classList.toggle('selected',x===btn));showSelected();});
 $('useImageUrl').onclick=()=>{const value=$('imageUrl').value.trim();try{const url=new URL(value);if(!['http:','https:'].includes(url.protocol))throw 0;selectedImage=url.href;selectedSource='URL externa';showSelected();$('formError').textContent='';}catch{$('formError').textContent='Ingresá una URL válida que comience con https://';}};
 $('imageFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{selectedImage=await fileToDataURL(file);selectedSource='Imagen optimizada · se guardará online';showSelected();$('formError').textContent='';}catch(err){$('formError').textContent=err.message||'No se pudo procesar la imagen.';}};
 $('removeImage').onclick=()=>{selectedImage='';selectedSource='';showSelected();};
 $('productForm').onsubmit=saveProduct;$('productActive').addEventListener('change',syncInactiveReason);
 $('restockForm').onsubmit=submitRestock;$('closeRestock').onclick=$('cancelRestock').onclick=closeRestockModal;$('restockModal').addEventListener('click',e=>{if(e.target===$('restockModal'))closeRestockModal();});$('stockSearch').oninput=renderStock;$('stockFilter').onchange=renderStock;$('refreshStock').onclick=async()=>{const b=$('refreshStock');b.disabled=true;b.textContent='Actualizando…';try{await loadStock();notify('Vista de stock actualizada.');}finally{b.disabled=false;b.textContent='↻ Recargar vista';}};$('refreshOrders').onclick=loadOrders;$('reminderConfirm').onclick=()=>handleReminder('confirmed');$('reminderExtend').onclick=()=>handleReminder('extend');$('reminderCancel').onclick=()=>handleReminder('cancelled');$('orderSearch').oninput=renderOrders;$('orderFilter').onchange=renderOrders;$('stockTable').addEventListener('click',e=>{const b=e.target.closest('[data-restock]');if(b)openRestockModal(b.dataset.restock);});$('ordersTable').addEventListener('click',e=>{const c=e.target.closest('[data-order-confirm]'),x=e.target.closest('[data-order-cancel]'),r=e.target.closest('[data-remito]');if(c)setOrderStatus(c.dataset.orderConfirm,'confirmed');if(x)setOrderStatus(x.dataset.orderCancel,'cancelled');if(r)downloadOrderRemito(r.dataset.remito);});
 $('productsTable').addEventListener('click',e=>{const edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-delete]');if(edit){const p=products.find(x=>x.id===edit.dataset.edit);if(p)openModal(p);}if(del)deleteProduct(del.dataset.delete);});
 $('productModal').addEventListener('click',e=>{if(e.target===$('productModal'))closeModal();});$('newCombo').onclick=()=>openComboModal();$('closeComboModal').onclick=$('cancelCombo').onclick=closeComboModal;$('comboForm').onsubmit=saveCombo;$('comboModal').addEventListener('click',e=>{if(e.target===$('comboModal'))closeComboModal();});$('combosTable').addEventListener('click',e=>{const edit=e.target.closest('[data-combo-edit]'),toggle=e.target.closest('[data-combo-toggle]');if(edit)openComboModal(comboRows.find(c=>c.id===edit.dataset.comboEdit));if(toggle)toggleCombo(toggle.dataset.comboToggle);});document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeRestockModal();closeComboModal();}});
}
(async function init(){
 showLogin();
 try {
   bindUI();
   if(!getSupabaseClient()){
     $('loginError').textContent='No se pudo conectar con Supabase. Revisá la configuración y la conexión a internet.';
     return;
   }
   const {data,error}=await getSupabaseClient().auth.getSession();
   if(error) throw error;
   if(data?.session?.user) await loadProfile(data.session.user);
   getSupabaseClient().auth.onAuthStateChange((event)=>{
     if(event==='SIGNED_OUT'){
       currentProfile=null;products=[];
       $('layout')?.classList.remove('admin-ready');
       showLogin();
     }
   });
 } catch(error) {
   console.error('Error al iniciar el panel administrativo:', error);
   const message=$('loginError');
   if(message) message.textContent='No se pudo iniciar el panel: '+(error?.message||'error inesperado');
 }
})();
