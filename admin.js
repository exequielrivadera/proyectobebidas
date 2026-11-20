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
}
function addSessionControls(){
 const actions=document.querySelector('.top-actions'); if(!actions||$('logoutButton'))return;
 const who=document.createElement('span');who.className='session-user';who.textContent=currentProfile.username||'Usuario';
 const out=document.createElement('button');out.id='logoutButton';out.className='logout-button';out.textContent='Cerrar sesión';
 out.onclick=async()=>{await getSupabaseClient().auth.signOut();location.reload();};
 actions.append(who,out);
}
function mapRow(row){return {id:row.id,name:row.name,category:row.category,description:row.description||'',shortDescription:row.description||'',image:row.image_url||'',active:row.active!==false,barcode:row.barcode||'',stockEnabled:row.stock_enabled===true,stock: Number(row.stock_quantity||0),sellIndividual:row.sell_individual!==false,sellPacks:row.sell_packs===true,packUnits:Number(row.pack_units||0)};}
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
 if(!products.length) notify('No hay productos guardados para esta distribuidora.');
}
function refresh(){const active=products.filter(p=>p.active!==false);$('statProducts').textContent=active.length;$('statCategories').textContent=new Set(active.map(p=>p.category)).size;$('statImages').textContent=active.filter(p=>p.image).length;renderTable();}
function renderTable(){const q=$('filterProducts').value.trim().toLowerCase(),cat=$('filterCategory').value;const list=products.filter(p=>(cat==='todos'||p.category===cat)&&(!q||`${p.name} ${p.description||''}`.toLowerCase().includes(q)));$('productsTable').innerHTML=list.map(p=>`<tr><td><div class="product-cell"><img src="${escapeHTML(p.image||'')}" alt=""><div><strong>${escapeHTML(p.name)}</strong><small>${escapeHTML(p.description||'')}</small></div></div></td><td><span class="category-tag">${categoryName(p.category)}</span></td><td>${p.image?'Asignada':'Pendiente'}</td><td>${p.stockEnabled?`${p.stock} u.`:'Sin control'}</td><td>${p.sellPacks?`Pack x${p.packUnits}`:(p.sellIndividual?'Individual':'Sin modalidad')}</td><td><span class="status">${p.active===false?'Inactivo':'● Activo'}</span></td><td><div class="row-actions"><button data-edit="${escapeHTML(p.id)}">Editar</button><button class="delete" data-delete="${escapeHTML(p.id)}">Eliminar</button></div></td></tr>`).join('');$('emptyState').hidden=list.length>0;}
function openModal(product){$('productForm').reset();$('formError').textContent='';selectedImage=product?.image||'';selectedSource=product?'Imagen guardada':'';$('productId').value=product?.id||'';$('productName').value=product?.name||'';$('productCategory').value=product?.category||'gaseosas';$('productDescription').value=product?.description||'';$('productShortDescription').value=product?.shortDescription||'';$('stockEnabled').checked=product?.stockEnabled||false;$('productStock').value=product?.stock??0;$('sellIndividual').checked=product?.sellIndividual!==false;$('sellPacks').checked=product?.sellPacks||false;$('packUnits').value=product?.packUnits||6;$('imageQuery').value=product?.name||'';$('imageUrl').value='';$('imageResults').innerHTML='<div class="search-placeholder">Buscá un producto para ver imágenes disponibles.</div>';setTab('search');showSelected();$('modalTitle').textContent=product?'Editar producto':'Agregar producto';$('productModal').classList.add('open');$('productModal').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
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
 e.preventDefault();const name=$('productName').value.trim();if(!name){$('formError').textContent='El nombre es obligatorio.';return}if(!selectedImage){$('formError').textContent='Tenés que seleccionar o subir una imagen antes de guardar.';return}
 const btn=$('saveProduct');btn.disabled=true;btn.textContent='Guardando…';
 try{
  const image_url=await uploadImageIfNeeded(selectedImage);
  const stockEnabled=$('stockEnabled').checked, sellPacks=$('sellPacks').checked, packUnits=Math.floor(Number($('packUnits').value));if(sellPacks&&(!Number.isInteger(packUnits)||packUnits<2)){throw new Error('Indicá cuántas unidades contiene cada pack (mínimo 2).');}const payload={tenant_id:currentProfile.tenant_id,name,category:$('productCategory').value,description:$('productDescription').value.trim()||$('productShortDescription').value.trim(),image_url,active:true,stock_enabled:stockEnabled,stock_quantity:Math.max(0,Math.floor(Number($('productStock').value)||0)),sell_individual:$('sellIndividual').checked,sell_packs:sellPacks,pack_units:sellPacks?packUnits:null,updated_at:new Date().toISOString()};
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
 $('productForm').onsubmit=saveProduct;
 $('productsTable').addEventListener('click',e=>{const edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-delete]');if(edit){const p=products.find(x=>x.id===edit.dataset.edit);if(p)openModal(p);}if(del)deleteProduct(del.dataset.delete);});
 $('productModal').addEventListener('click',e=>{if(e.target===$('productModal'))closeModal();});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
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
