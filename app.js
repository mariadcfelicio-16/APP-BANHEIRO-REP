const SUPABASE_URL="https://xdswybtzbmtxzxcnytqn.supabase.co";
const SUPABASE_KEY="sb_publishable_2Q8BxVITxZri3doBrLep3Q_tKT_JsVG";
const sb=supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});

const rooms=["Quarto 5","Quarto 6","Quarto 7","Quarto 8","Quarto 9"];
const schedule=[["2026-08-01","Quarto 9"],["2026-08-08","Quarto 5"],["2026-08-15","Quarto 6"],["2026-08-22","Quarto 7"],["2026-08-29","Quarto 8"],["2026-09-05","Quarto 9"],["2026-09-12","Quarto 5"],["2026-09-19","Quarto 6"],["2026-09-26","Quarto 7"],["2026-10-03","Quarto 8"],["2026-10-10","Quarto 9"],["2026-10-17","Quarto 5"],["2026-10-24","Quarto 6"],["2026-10-31","Quarto 7"],["2026-11-07","Quarto 8"],["2026-11-14","Quarto 9"],["2026-11-21","Quarto 5"],["2026-11-28","Quarto 6"],["2026-12-05","Quarto 7"],["2026-12-12","Quarto 8"],["2026-12-19","Quarto 9"],["2026-12-26","Quarto 5"]].map(([date,room])=>({date,room}));
let me=null,profiles=[],cleaning=[],trash=[],calMonth=new Date().getMonth(),calYear=new Date().getFullYear(),pendingTrash=null;
let avatarSeq=0;
let profileView="appearance";

const skinColors={porcelain:"#f9ddcf",light:"#f6d0b1",medium_light:"#dfa67f",medium:"#bd7f58",medium_dark:"#8c593d",dark:"#5d3928",deep:"#39241c"};
const hairColors={jet_black:"#111016",soft_black:"#272129",dark_brown:"#3a241b",chocolate:"#5a3628",brown:"#744c37",auburn:"#8b3f2e",copper:"#b65b38",blonde:"#caaa68",platinum:"#e5dcc8",pink:"#c85d8d",purple:"#70439a",blue:"#435f95"};
const eyeColors={black:"#17131b",dark_brown:"#3b241f",brown:"#6a4634",hazel:"#8a7447",green:"#55775d",blue:"#557ea8",gray:"#767c88"};
const hairNames={curls_short:"Cacheado curto",curls_medium:"Cacheado médio",curls_long:"Cacheado longo",curls_bangs:"Cacheado com franja",curls_volume:"Cacheado volumoso",curls_side:"Cacheado lateral",curly_ponytail:"Rabo de cavalo cacheado",afro:"Afro",afro_big:"Black power",wavy_long:"Ondulado longo",wavy_bangs:"Ondulado com franja",straight_middle:"Liso partido ao meio",straight_long:"Liso longo",bob:"Chanel / Bob",ponytail:"Rabo de cavalo",high_bun:"Coque alto",double_buns:"Dois coques",braids:"Tranças",side_braid:"Trança lateral",box_braids:"Box braids",locs_long:"Locs longos"};
const accessoryNames={none:"Sem acessório",round_glasses:"Óculos redondo",cat_glasses:"Óculos gatinho",hoops:"Argolas",pearl_earrings:"Pérolas",choker:"Choker",necklace:"Colar",hair_clip:"Presilha",bow:"Laço"};
const shirtNames={purple:"Roxa",pink:"Rosa",green:"Verde",blue:"Azul",black:"Preta",white:"Branca",rainbow:"LGBT+",lesbian:"Lésbica",bi:"Bissexual",trans:"Trans",pan:"Pan",nb:"Não-binária"};

const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const br=d=>new Date(d+"T12:00:00").toLocaleDateString("pt-BR");
const today=()=>new Date().toISOString().slice(0,10);

function openAuth(mode){$("landing").classList.add("hidden");$("auth").classList.remove("hidden");$("authError").classList.add("hidden");const login=mode==="login";$("loginForm").classList.toggle("hidden",!login);$("signupForm").classList.toggle("hidden",login);$("authTitle").textContent=login?"Bem-vinda de volta!":"Crie sua conta";$("authSubtitle").textContent=login?"Faça login para continuar":"Entre para organizar tudo com a república";}
function backToLanding(){$("auth").classList.add("hidden");$("landing").classList.remove("hidden");}
function showError(e){$("authError").textContent=e?.message||e;$("authError").classList.remove("hidden");}
async function signIn(){const email=$("loginEmail").value.trim(),password=$("loginPassword").value;if($("rememberUser").checked)localStorage.setItem("banheiro_email",email);else localStorage.removeItem("banheiro_email");const {error}=await sb.auth.signInWithPassword({email,password});if(error)return showError(error);await loadApp();}
async function signUp(){const name=$("signupName").value.trim(),email=$("signupEmail").value.trim(),password=$("signupPassword").value,room=$("signupRoom").value;const {data,error}=await sb.auth.signUp({email,password,options:{data:{name,room}}});if(error)return showError(error);localStorage.setItem("banheiro_email",email);if(!data.session)return showError("Conta criada. Confirme o e-mail, se solicitado, e depois entre.");await loadApp();}
async function logout(){await sb.auth.signOut();location.reload();}

async function loadApp(){const {data:{user}}=await sb.auth.getUser();if(!user)return;let {data:p}=await sb.from("profiles").select("*").eq("id",user.id).maybeSingle();if(!p){const {error}=await sb.from("profiles").insert({id:user.id,name:user.user_metadata?.name||user.email.split("@")[0],room:user.user_metadata?.room||"Quarto 5"});if(error)return alert(error.message);({data:p}=await sb.from("profiles").select("*").eq("id",user.id).single());}me=p;$("landing").classList.add("hidden");$("auth").classList.add("hidden");$("app").classList.remove("hidden");$("who").textContent=`${me.name} • ${me.room}`;await refresh();if(new URLSearchParams(location.search).get("quick")==="trash")setTimeout(openQuickTrash,250);}
async function refresh(){const [p,c,t]=await Promise.all([sb.from("profiles").select("*"),sb.from("cleaning_records").select("*").order("cleaning_date"),sb.from("trash_records").select("*").order("trash_date",{ascending:false})]);profiles=p.data||[];cleaning=c.data||[];trash=t.data||[];me=profiles.find(x=>x.id===me.id)||me;renderAll();}
function showTab(tab){
  ["dash","agenda","trash","rank","profile","history"].forEach(id=>$(id).classList.toggle("hidden",id!==tab));
  const map={dash:"navDash",agenda:"navAgenda",trash:"navTrash",rank:"navRank",profile:"navProfile"};
  Object.values(map).forEach(id=>$(id)?.classList.remove("active"));
  if(map[tab])$(map[tab]).classList.add("active");
  const titles={dash:"Painel",agenda:"Limpeza",trash:"Registro de lixo",rank:"Ranking",profile:"Meu perfil",history:"Histórico"};
  if($("pageTitle")) $("pageTitle").textContent=titles[tab]||"Banheiro Apto 101";
}
const pname=id=>profiles.find(p=>p.id===id)?.name||"Morador";
const proom=id=>profiles.find(p=>p.id===id)?.room||"";
const crec=d=>cleaning.find(x=>x.cleaning_date===d);
function nextCleaning(){const d=today();return schedule.find(x=>!crec(x.date)&&x.date>=d)||schedule.find(x=>!crec(x.date));}
function myFuture(){const d=today();return schedule.filter(x=>x.room===me.room&&x.date>=d);}
async function markCleaning(date,status){const item=schedule.find(x=>x.date===date),{error}=await sb.from("cleaning_records").insert({cleaning_date:date,assigned_room:item.room,status,recorded_by:me.id});if(error)alert(error.message);else refresh();}
async function addTrash(date){const {error}=await sb.from("trash_records").insert({trash_date:date,recorded_by:me.id});if(error)alert(error.message);else refresh();}
async function delTrash(id){const {error}=await sb.from("trash_records").delete().eq("id",id);if(error)alert(error.message);else refresh();}
function countMap(){const m={};trash.forEach(x=>m[x.recorded_by]=(m[x.recorded_by]||0)+1);return m;}
const ranking=()=>Object.entries(countMap()).sort((a,b)=>b[1]-a[1]);
function myRank(){const r=ranking(),i=r.findIndex(([id])=>id===me.id);return{rank:i<0?"-":i+1,count:trash.filter(x=>x.recorded_by===me.id).length};}

function mixHex(hex,target="#ffffff",amount=.25){
  const clean=x=>x.replace("#","");
  const a=clean(hex),b=clean(target);
  if(a.length!==6||b.length!==6)return hex;
  const ar=parseInt(a.slice(0,2),16),ag=parseInt(a.slice(2,4),16),ab=parseInt(a.slice(4,6),16);
  const br=parseInt(b.slice(0,2),16),bg=parseInt(b.slice(2,4),16),bb=parseInt(b.slice(4,6),16);
  const m=(x,y)=>Math.round(x+(y-x)*amount).toString(16).padStart(2,"0");
  return `#${m(ar,br)}${m(ag,bg)}${m(ab,bb)}`;
}

function curlHighlights(color){
  const hi=mixHex(color,"#ffffff",.26);
  return `<g fill="none" stroke="${hi}" stroke-width="2.2" stroke-linecap="round" opacity=".38">
    <path d="M45 35 q10-12 20-1 q8 10-3 17"/>
    <path d="M83 24 q13-7 20 4 q4 10-8 15"/>
    <path d="M112 42 q13-5 17 8 q2 10-10 13"/>
    <path d="M39 79 q11-9 20 0 q7 9-4 16"/>
    <path d="M112 83 q12-7 20 3 q4 10-8 15"/>
    <path d="M59 114 q12-8 20 2 q5 9-6 14"/>
  </g>`;
}

function curlsMediumBase(c,dark){
  return `<g>
    <path d="M27 132 Q13 67 39 33 Q57 8 91 9 Q129 9 149 38 Q169 72 151 142 Q136 165 119 149 Q103 170 87 150 Q70 171 55 149 Q37 166 27 132Z" fill="${dark}"/>
    <g fill="${c}"><circle cx="36" cy="62" r="27"/><circle cx="52" cy="34" r="29"/><circle cx="83" cy="26" r="31"/><circle cx="116" cy="30" r="30"/><circle cx="142" cy="54" r="27"/><circle cx="35" cy="96" r="28"/><circle cx="145" cy="94" r="29"/><circle cx="47" cy="129" r="28"/><circle cx="132" cy="130" r="29"/><circle cx="76" cy="145" r="27"/><circle cx="105" cy="145" r="27"/></g>
    ${curlHighlights(c)}
  </g>`;
}

function backHair(s,c,c2){
  const cB=c2||c, dark=mixHex(c,"#000000",.24), hi=mixHex(c,"#ffffff",.18);
  const medium=curlsMediumBase(c,dark);
  const m={
    curls_short:`<g><ellipse cx="90" cy="65" rx="62" ry="55" fill="${dark}"/><g fill="${c}"><circle cx="43" cy="58" r="24"/><circle cx="61" cy="35" r="27"/><circle cx="90" cy="28" r="30"/><circle cx="120" cy="36" r="27"/><circle cx="138" cy="60" r="23"/><circle cx="49" cy="86" r="23"/><circle cx="131" cy="87" r="23"/></g>${curlHighlights(c)}</g>`,
    curls_medium:medium,
    curls_long:`<g><path d="M22 183 Q13 79 35 38 Q53 6 90 7 Q129 7 149 39 Q171 79 158 188 Q137 204 120 185 Q104 207 88 187 Q69 208 54 185 Q35 205 22 183Z" fill="${dark}"/><g fill="${c}"><circle cx="36" cy="58" r="28"/><circle cx="55" cy="29" r="29"/><circle cx="88" cy="22" r="32"/><circle cx="121" cy="30" r="30"/><circle cx="145" cy="58" r="28"/><circle cx="30" cy="96" r="29"/><circle cx="151" cy="96" r="29"/><circle cx="31" cy="137" r="29"/><circle cx="149" cy="139" r="29"/><circle cx="45" cy="176" r="28"/><circle cx="134" cy="177" r="28"/></g>${curlHighlights(c)}</g>`,
    curls_bangs:`<g>${medium}<g fill="${c}"><circle cx="56" cy="49" r="18"/><circle cx="73" cy="43" r="19"/><circle cx="91" cy="42" r="19"/><circle cx="109" cy="45" r="18"/><circle cx="124" cy="53" r="16"/></g></g>`,
    curls_volume:`<g><ellipse cx="90" cy="94" rx="84" ry="91" fill="${dark}"/><g fill="${c}"><circle cx="20" cy="73" r="33"/><circle cx="35" cy="38" r="34"/><circle cx="65" cy="20" r="35"/><circle cx="99" cy="18" r="36"/><circle cx="133" cy="33" r="35"/><circle cx="157" cy="66" r="34"/><circle cx="16" cy="111" r="34"/><circle cx="164" cy="109" r="35"/><circle cx="30" cy="150" r="35"/><circle cx="150" cy="150" r="35"/><circle cx="59" cy="180" r="34"/><circle cx="120" cy="179" r="34"/></g>${curlHighlights(c)}</g>`,
    curls_side:`<g>${medium}<g fill="${c}"><circle cx="145" cy="123" r="33"/><circle cx="148" cy="157" r="31"/></g></g>`,
    afro:`<g><circle cx="90" cy="84" r="76" fill="${dark}"/><g fill="${c}"><circle cx="31" cy="48" r="34"/><circle cx="57" cy="22" r="34"/><circle cx="91" cy="18" r="37"/><circle cx="126" cy="25" r="34"/><circle cx="151" cy="53" r="33"/><circle cx="21" cy="86" r="34"/><circle cx="160" cy="89" r="34"/><circle cx="35" cy="125" r="34"/><circle cx="145" cy="127" r="34"/><circle cx="68" cy="145" r="35"/><circle cx="112" cy="145" r="35"/></g>${curlHighlights(c)}</g>`,
    afro_big:`<g><circle cx="90" cy="92" r="89" fill="${dark}"/><g fill="${c}"><circle cx="17" cy="54" r="39"/><circle cx="47" cy="20" r="39"/><circle cx="88" cy="10" r="42"/><circle cx="132" cy="22" r="40"/><circle cx="165" cy="57" r="39"/><circle cx="7" cy="101" r="40"/><circle cx="173" cy="102" r="40"/><circle cx="24" cy="148" r="40"/><circle cx="157" cy="149" r="40"/><circle cx="63" cy="181" r="39"/><circle cx="120" cy="181" r="39"/></g>${curlHighlights(c)}</g>`,
    straight_middle:`<g><path d="M35 194 Q24 22 89 11 Q155 22 145 194 L120 208 L101 89 L90 42 L79 89 L59 208Z" fill="${dark}"/><path d="M42 190 Q33 28 89 18 Q146 28 138 190 L119 198 L99 83 L90 39 L81 83 L61 198Z" fill="${c}"/><path d="M55 55 Q69 27 88 33 M125 56 Q110 27 92 33" fill="none" stroke="${hi}" stroke-width="4" opacity=".38"/></g>`,
    straight_long:`<g><path d="M31 205 Q22 19 90 10 Q158 19 149 205 L121 214 L107 90 Q99 43 90 37 Q81 43 73 90 L59 214Z" fill="${dark}"/><path d="M38 201 Q30 27 90 17 Q150 27 142 201 L124 207 L109 88 Q100 43 90 36 Q80 43 71 88 L56 207Z" fill="${c}"/><path d="M48 66 Q58 31 84 27 M132 67 Q121 31 96 27" fill="none" stroke="${hi}" stroke-width="4" opacity=".35"/></g>`,
    curly_ponytail:`<g>${medium}<g fill="${dark}"><circle cx="151" cy="104" r="30"/><circle cx="157" cy="135" r="29"/><circle cx="151" cy="165" r="27"/></g><g fill="${c}"><circle cx="151" cy="100" r="25"/><circle cx="157" cy="132" r="24"/><circle cx="151" cy="161" r="22"/></g></g>`,
    wavy_long:`<g><path d="M30 207 Q22 35 90 13 Q158 35 150 207 Q134 216 121 201 Q109 218 96 202 Q82 220 69 202 Q54 217 39 202Z" fill="${dark}"/><path d="M38 202 Q31 41 90 20 Q149 41 142 202 Q129 210 118 195 Q106 211 95 196 Q82 213 70 196 Q56 210 45 196Z" fill="${c}"/><path d="M47 84 Q62 67 75 84 T103 84 T133 84 M45 126 Q60 109 74 126 T103 126 T137 126 M48 166 Q62 149 77 166 T106 166 T135 166" fill="none" stroke="${hi}" stroke-width="4" opacity=".32"/></g>`,
    wavy_bangs:`<g><path d="M30 205 Q23 34 90 13 Q157 34 150 205 Q133 216 119 199 Q105 218 91 200 Q76 218 63 199 Q48 215 35 200Z" fill="${dark}"/><path d="M38 201 Q31 42 90 20 Q149 42 142 201 Q127 209 116 194 Q103 211 91 195 Q78 212 66 195 Q53 208 43 195Z" fill="${c}"/></g>`,
    bob:`<g><path d="M39 151 Q31 28 90 17 Q149 28 141 151 Q124 169 112 148 L107 91 Q99 48 90 39 Q81 48 73 91 L68 148 Q55 169 39 151Z" fill="${dark}"/><path d="M46 146 Q39 36 90 24 Q141 36 134 146 Q121 157 113 143 L107 87 Q99 47 90 40 Q81 47 73 87 L67 143 Q59 157 46 146Z" fill="${c}"/></g>`,
    ponytail:`<g><path d="M40 128 Q31 30 90 17 Q149 30 140 128 L116 142 L106 88 Q99 48 90 39 Q81 48 74 88 L64 142Z" fill="${dark}"/><path d="M134 59 Q170 67 157 160 Q150 196 126 203 Q145 159 128 100Z" fill="${c}"/><path d="M47 124 Q39 37 90 24 Q141 37 133 124 L115 135 L107 86 Q99 47 90 40 Q81 47 73 86 L65 135Z" fill="${c}"/></g>`,
    high_bun:`<g><circle cx="90" cy="19" r="34" fill="${dark}"/><circle cx="90" cy="17" r="28" fill="${c}"/><path d="M39 124 Q33 31 90 23 Q147 31 141 124 L117 143 L106 87 Q99 48 90 40 Q81 48 74 87 L63 143Z" fill="${dark}"/><path d="M46 121 Q40 38 90 29 Q140 38 134 121 L116 135 L107 84 Q99 48 90 41 Q81 48 73 84 L64 135Z" fill="${c}"/></g>`,
    double_buns:`<g><circle cx="46" cy="27" r="27" fill="${dark}"/><circle cx="134" cy="27" r="27" fill="${dark}"/><circle cx="46" cy="26" r="22" fill="${c}"/><circle cx="134" cy="26" r="22" fill="${c}"/><ellipse cx="90" cy="66" rx="58" ry="52" fill="${dark}"/><ellipse cx="90" cy="63" rx="51" ry="46" fill="${c}"/></g>`,
    side_braid:`<g><ellipse cx="90" cy="48" rx="53" ry="42" fill="${dark}"/><path d="M128 57 Q155 94 139 128 Q126 154 145 180 Q155 196 140 212" stroke="${c}" stroke-width="17" fill="none" stroke-linecap="round"/><path d="M132 69 q-15 10 0 20 q15 10 0 20 q-15 10 0 20 q15 10 0 20 q-15 10 0 20 q15 10 0 20" stroke="${cB}" stroke-width="6" fill="none" opacity=".85"/></g>`,
    locs_long:`<g><ellipse cx="90" cy="50" rx="55" ry="44" fill="${dark}"/><g fill="none" stroke-linecap="round"><path d="M42 58 Q27 120 35 210 M54 59 Q42 125 50 215 M66 58 Q57 130 62 214 M114 58 Q123 130 118 214 M126 59 Q138 125 130 215 M138 58 Q153 120 145 210" stroke="${c}" stroke-width="9"/></g></g>`,
    braids:`<g><ellipse cx="90" cy="48" rx="53" ry="42" fill="${dark}"/><path d="M44 53 Q26 104 35 200" stroke="${c}" stroke-width="14" fill="none" stroke-linecap="round"/><path d="M57 55 Q43 116 51 207" stroke="${cB}" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M123 55 Q137 116 129 207" stroke="${c}" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M136 53 Q154 104 145 200" stroke="${cB}" stroke-width="14" fill="none" stroke-linecap="round"/><g fill="none" stroke="${hi}" stroke-width="2.2" opacity=".42"><path d="M40 68 q12 10 1 19 q-9 8 1 18 q10 9 0 18 q-9 8 0 18"/><path d="M139 68 q-12 10-1 19 q9 8-1 18 q-10 9 0 18 q9 8 0 18"/></g></g>`,
    box_braids:`<g><ellipse cx="90" cy="47" rx="52" ry="41" fill="${dark}"/><g stroke-linecap="round" fill="none"><path d="M42 56 L28 207 M56 58 L48 213" stroke="${c}" stroke-width="10"/><path d="M124 58 L132 213 M138 56 L152 207" stroke="${cB}" stroke-width="10"/></g><g stroke="${hi}" stroke-width="1.7" opacity=".45"><path d="M42 74 L31 195 M56 75 L50 201 M124 75 L130 201 M138 74 L149 195"/></g></g>`
  };
  return m[s]||m.curls_medium;
}

function frontHair(s,c){
  const dark=mixHex(c,"#000000",.22), hi=mixHex(c,"#ffffff",.24);
  const m={
    curls_short:`<g fill="${c}"><circle cx="60" cy="51" r="18"/><circle cx="82" cy="43" r="20"/><circle cx="106" cy="48" r="19"/></g>`,
    curls_medium:`<g fill="${c}"><circle cx="57" cy="49" r="18"/><circle cx="79" cy="42" r="20"/><circle cx="103" cy="46" r="20"/><circle cx="122" cy="57" r="16"/></g>`,
    curls_long:`<g fill="${c}"><circle cx="56" cy="48" r="18"/><circle cx="79" cy="41" r="20"/><circle cx="103" cy="45" r="20"/><circle cx="123" cy="57" r="17"/></g>`,
    curls_bangs:`<g fill="${c}"><circle cx="52" cy="54" r="17"/><circle cx="70" cy="48" r="18"/><circle cx="89" cy="45" r="18"/><circle cx="108" cy="49" r="18"/><circle cx="125" cy="57" r="16"/></g>`,
    curls_volume:`<g fill="${c}"><circle cx="49" cy="51" r="20"/><circle cx="72" cy="41" r="21"/><circle cx="96" cy="40" r="21"/><circle cx="119" cy="48" r="20"/><circle cx="134" cy="63" r="17"/></g>`,
    curls_side:`<g fill="${c}"><circle cx="55" cy="50" r="18"/><circle cx="79" cy="42" r="20"/><path d="M92 35 Q124 37 130 64 Q109 52 98 84 Q87 60 92 35Z"/></g>`,
    afro:`<g fill="${c}"><circle cx="55" cy="48" r="19"/><circle cx="78" cy="39" r="21"/><circle cx="103" cy="41" r="21"/><circle cx="125" cy="53" r="18"/></g>`,
    afro_big:`<g fill="${c}"><circle cx="49" cy="49" r="21"/><circle cx="73" cy="38" r="22"/><circle cx="99" cy="38" r="22"/><circle cx="125" cy="49" r="21"/></g>`,
    straight_middle:`<g><path d="M42 67 Q48 27 86 31 L90 44 Q73 42 59 72Z" fill="${c}"/><path d="M138 67 Q132 27 94 31 L90 44 Q107 42 121 72Z" fill="${c}"/><path d="M54 58 Q66 38 83 37 M126 58 Q114 38 97 37" fill="none" stroke="${hi}" stroke-width="3" opacity=".4"/></g>`,
    straight_long:`<path d="M43 69 Q50 25 91 29 Q130 27 137 69 Q120 51 103 75 Q92 56 90 38 Q86 58 76 76 Q61 52 43 69Z" fill="${c}"/>`,
    curly_ponytail:`<g fill="${c}"><circle cx="57" cy="49" r="18"/><circle cx="79" cy="42" r="20"/><circle cx="103" cy="46" r="20"/><circle cx="122" cy="57" r="16"/></g>`,
    wavy_long:`<path d="M43 69 Q50 25 91 29 Q130 27 137 69 Q120 51 103 75 Q92 56 90 38 Q86 58 76 76 Q61 52 43 69Z" fill="${c}"/>`,
    wavy_bangs:`<g fill="${c}"><path d="M42 68 Q48 28 90 29 Q132 28 138 68 Q121 49 105 71 Q94 53 90 39 Q85 54 75 72 Q59 50 42 68Z"/><path d="M53 51 Q67 38 80 55 Q89 66 96 48 Q107 35 126 54 Q112 35 90 34 Q67 34 53 51Z"/></g>`,
    bob:`<path d="M43 68 Q49 27 90 29 Q131 27 137 68 Q120 50 104 73 Q95 55 90 39 Q84 56 75 73 Q60 51 43 68Z" fill="${c}"/>`,
    ponytail:`<path d="M43 68 Q49 27 90 29 Q131 27 137 68 Q120 50 104 73 Q95 55 90 39 Q84 56 75 73 Q60 51 43 68Z" fill="${c}"/>`,
    high_bun:`<path d="M43 68 Q49 29 90 30 Q131 29 137 68 Q119 51 104 72 Q95 55 90 40 Q84 56 75 72 Q60 52 43 68Z" fill="${c}"/>`,
    double_buns:`<path d="M43 68 Q49 29 90 30 Q131 29 137 68 Q119 51 104 72 Q95 55 90 40 Q84 56 75 72 Q60 52 43 68Z" fill="${c}"/>`,
    side_braid:`<g fill="${c}"><path d="M44 60 Q53 29 84 31 Q68 44 62 72Z"/><path d="M136 60 Q127 29 96 31 Q112 44 118 72Z"/></g><path d="M90 31 L90 59" stroke="${dark}" stroke-width="2"/>`,
    locs_long:`<g fill="${c}"><path d="M44 60 Q53 29 84 31 Q68 44 62 72Z"/><path d="M136 60 Q127 29 96 31 Q112 44 118 72Z"/></g><path d="M90 31 L90 59" stroke="${dark}" stroke-width="2"/>`,
    braids:`<g fill="${c}"><path d="M44 60 Q53 29 84 31 Q68 44 62 72Z"/><path d="M136 60 Q127 29 96 31 Q112 44 118 72Z"/></g><path d="M90 31 L90 59" stroke="${dark}" stroke-width="2"/>`,
    box_braids:`<g fill="${c}"><path d="M43 61 Q52 28 84 31 Q67 45 61 72Z"/><path d="M137 61 Q128 28 96 31 Q113 45 119 72Z"/></g><path d="M90 31 L90 59" stroke="${dark}" stroke-width="2"/>`
  };
  return m[s]||"";
}

function shirtColor(t){return({purple:"#7b44dc",pink:"#ed72a5",green:"#5aad67",blue:"#4f7ccf",black:"#25232a",white:"#f4f4f4"})[t]||"#fff";}
function shirtPattern(t){const b={rainbow:["#e40303","#ff8c00","#ffed00","#008026","#004dff","#750787"],lesbian:["#d52d00","#ef7627","#fff","#d162a4","#a30262"],bi:["#d60270","#d60270","#9b4f96","#0038a8","#0038a8"],trans:["#5bcffb","#f5abb9","#fff","#f5abb9","#5bcffb"],pan:["#ff218c","#ffd800","#21b1ff"],nb:["#fff430","#fff","#9c59d1","#000"]};if(!b[t])return"";const a=b[t],h=44/a.length;return a.map((c,i)=>`<rect x="50" y="166" width="80" height="${h+1}" transform="translate(0 ${i*h})" fill="${c}"/>`).join("");}

function accessory(t){
  return({
    none:"",
    round_glasses:`<g fill="none" stroke="#a96950" stroke-width="2.8"><circle cx="69" cy="102" r="24"/><circle cx="111" cy="102" r="24"/><path d="M93 99 Q90 96 87 99"/></g>`,
    cat_glasses:`<g fill="none" stroke="#6f35d4" stroke-width="3"><path d="M43 91 L48 78 L91 87 L89 112 Q60 124 47 108Z"/><path d="M137 91 L132 78 L89 87 L91 112 Q120 124 133 108Z"/></g>`,
    hoops:`<g fill="none" stroke="#d2a52f" stroke-width="3.5"><circle cx="43" cy="126" r="12"/><circle cx="137" cy="126" r="12"/></g>`,
    pearl_earrings:`<g fill="#fffdf7" stroke="#c9c3bb"><circle cx="44" cy="124" r="6"/><circle cx="136" cy="124" r="6"/></g>`,
    choker:`<rect x="69" y="156" width="42" height="6" rx="3" fill="#201c25"/><circle cx="90" cy="161" r="2.6" fill="#d9b35e"/>`,
    necklace:`<path d="M65 158 Q90 185 115 158" fill="none" stroke="#d0aa45" stroke-width="2.4"/><circle cx="90" cy="181" r="4" fill="#d0aa45"/>`,
    hair_clip:`<g transform="rotate(18 132 59)"><rect x="120" y="55" width="24" height="7" rx="3.5" fill="#ef7cac"/><circle cx="126" cy="58.5" r="2" fill="#fff7"/></g>`,
    bow:`<g fill="#e75f9d"><path d="M124 45 Q104 32 111 58Z"/><path d="M137 45 Q157 32 150 58Z"/><circle cx="131" cy="47" r="7"/></g>`
  })[t]||"";
}

function avatar(p={}){
  const uid=`av${++avatarSeq}`;
  const skin=skinColors[p.avatar_skin]||skinColors.medium;
  const skinHi=mixHex(skin,"#ffffff",.22), skinShadow=mixHex(skin,"#9b5947",.15);
  const hair=hairColors[p.avatar_hair_color]||hairColors.dark_brown;
  const hair2=hairColors[p.avatar_hair_color_2]||hair;
  const eye=eyeColors[p.avatar_eyes]||eyeColors.dark_brown;
  const irisHi=mixHex(eye,"#ffffff",.32), irisDark=mixHex(eye,"#000000",.36);
  const style=p.avatar_hair||"curls_medium", shirt=p.avatar_shirt||"purple";
  let details="";
  if(p.avatar_freckles)details+=`<g fill="#8f5a48" opacity=".55"><circle cx="72" cy="127" r="1.3"/><circle cx="77" cy="129" r="1.1"/><circle cx="103" cy="127" r="1.3"/><circle cx="108" cy="129" r="1.1"/></g>`;
  if(p.avatar_beauty_mark)details+=`<circle cx="116" cy="139" r="2" fill="#4b2a26"/>`;

  return `<svg class="dollify-chibi" viewBox="0 0 180 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Caricatura de ${esc(p.name||'usuário')}">
    <defs>
      <radialGradient id="${uid}Face" cx="40%" cy="28%" r="74%"><stop offset="0" stop-color="${skinHi}"/><stop offset=".62" stop-color="${skin}"/><stop offset="1" stop-color="${skinShadow}"/></radialGradient>
      <radialGradient id="${uid}Iris" cx="34%" cy="28%" r="72%"><stop offset="0" stop-color="${irisHi}"/><stop offset=".58" stop-color="${eye}"/><stop offset="1" stop-color="${irisDark}"/></radialGradient>
      <filter id="${uid}Shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#3b214d" flood-opacity=".18"/></filter>
      <filter id="${uid}Soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2"/></filter>
      <clipPath id="${uid}Shirt"><path d="M47 220 Q48 166 90 160 Q132 166 133 220Z"/></clipPath>
    </defs>

    <g filter="url(#${uid}Shadow)">${backHair(style,hair,hair2)}</g>

    <path d="M47 220 Q48 166 90 160 Q132 166 133 220Z" fill="${shirtColor(shirt)}"/>
    <g clip-path="url(#${uid}Shirt)">${shirtPattern(shirt)}</g>
    <path d="M64 181 Q90 171 116 181" fill="none" stroke="#ffffff" stroke-opacity=".32" stroke-width="3"/>

    <rect x="80" y="145" width="20" height="25" rx="9" fill="${skin}"/>
    <ellipse cx="46" cy="112" rx="9" ry="13" fill="${skin}"/>
    <ellipse cx="134" cy="112" rx="9" ry="13" fill="${skin}"/>
    <ellipse cx="90" cy="105" rx="48" ry="58" fill="url(#${uid}Face)"/>

    <ellipse cx="67" cy="105" rx="18.5" ry="22" fill="#fffdfd" stroke="#4c3030" stroke-opacity=".18"/>
    <ellipse cx="113" cy="105" rx="18.5" ry="22" fill="#fffdfd" stroke="#4c3030" stroke-opacity=".18"/>
    <circle cx="68" cy="108" r="12.2" fill="url(#${uid}Iris)"/>
    <circle cx="112" cy="108" r="12.2" fill="url(#${uid}Iris)"/>
    <circle cx="68" cy="109" r="6.1" fill="#19131a"/>
    <circle cx="112" cy="109" r="6.1" fill="#19131a"/>
    <circle cx="63.5" cy="102" r="4.1" fill="#fff"/>
    <circle cx="107.5" cy="102" r="4.1" fill="#fff"/>
    <circle cx="71" cy="113" r="1.7" fill="#fff" opacity=".75"/>
    <circle cx="115" cy="113" r="1.7" fill="#fff" opacity=".75"/>

    <path d="M49 98 Q58 85 79 92" fill="none" stroke="#2e1d22" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M101 92 Q122 85 131 98" fill="none" stroke="#2e1d22" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M49 99 l-7 -4 M50 94 l-5 -7 M131 99 l7 -4 M130 94 l5 -7" stroke="#2e1d22" stroke-width="2.2" stroke-linecap="round"/>

    <path d="M54 77 Q66 69 79 75" fill="none" stroke="${mixHex(hair,'#000000',.20)}" stroke-width="4.2" stroke-linecap="round"/>
    <path d="M101 75 Q114 69 126 77" fill="none" stroke="${mixHex(hair,'#000000',.20)}" stroke-width="4.2" stroke-linecap="round"/>

    <ellipse cx="57" cy="133" rx="12" ry="7" fill="#ef8995" opacity=".22" filter="url(#${uid}Soft)"/>
    <ellipse cx="123" cy="133" rx="12" ry="7" fill="#ef8995" opacity=".22" filter="url(#${uid}Soft)"/>
    <path d="M86 126 Q90 130 94 126" fill="none" stroke="#9d5d52" stroke-width="1.7" stroke-linecap="round"/>
    <path d="M78 142 Q90 151 102 142 Q97 155 90 156 Q83 155 78 142Z" fill="#c95e6d"/>
    <path d="M82 145 Q90 149 98 145" fill="none" stroke="#f6a2aa" stroke-width="1.4" opacity=".72"/>

    ${details}
    ${frontHair(style,hair)}
    ${accessory(p.avatar_accessory||"none")}
  </svg>`;
}

function renderDashboard(){const n=nextCleaning(),m=myRank(),top=ranking().slice(0,4),slots=[["💎🏆","first","⭐"],["🥇","second",""],["🥈","third",""],["🥉","fourth","⚠️"]];const cards=slots.map((s,i)=>{const r=top[i];if(!r)return`<div class="rank-card ${s[1]==="first"?"first":""}"><div class="rank-trophy">${s[0]}</div><div class="rank-name ${s[1]}">Sem usuário</div><div class="rank-count">0</div></div>`;const p=profiles.find(x=>x.id===r[0])||{};return`<div class="rank-card ${s[1]==="first"?"first":""}"><div class="rank-trophy">${s[0]}</div><div class="rank-person"><div class="rank-avatar">${avatar(p)}</div><div><div class="rank-name ${s[1]}">${esc(p.name)} ${s[2]}</div><small>${esc(p.room)}</small></div></div><div class="rank-count">${r[1]} <small>retiradas</small></div></div>`}).join("");$("dash").innerHTML=`<h2>Olá, ${esc(me.name)}! 👋</h2><div class="stats"><div class="stat"><b>${cleaning.filter(x=>x.status==="done").length}</b><small>Limpezas feitas</small></div><div class="stat"><b>${cleaning.filter(x=>x.status==="late").length}</b><small>Atrasos</small></div><div class="stat"><b>${m.count}</b><small>Lixos registrados</small></div><div class="stat"><b>${m.rank}</b><small>Sua posição</small></div></div><div class="next"><small>PRÓXIMA LIMPEZA</small>${n?`<b>${n.room}</b><span>📅 ${br(n.date)}</span>`:`<b>Tudo concluído!</b>`}</div><h3>🏆 Ranking do lixo</h3><div class="rank-grid">${cards}</div><button class="btn green wide" onclick="openQuickTrash()">🗑️ Registrar lixo rápido</button>`;}
function renderAgenda(){$("agenda").innerHTML=`<h2>🧹 Rodízio de limpeza</h2>`+schedule.map(x=>{const r=crec(x.date);return`<div class="card"><div class="row"><div><b>${x.room}</b><small>${br(x.date)}</small></div><span class="badge ${r?.status==="done"?"ok":r?.status==="late"?"late":""}">${r?.status==="done"?"✓ FEITO":r?.status==="late"?"⚠ ATRASADO":"PENDENTE"}</span></div>${!r?`<div class="actions"><button class="small-btn done" onclick="markCleaning('${x.date}','done')">✓ Marcar feito</button><button class="small-btn danger" onclick="markCleaning('${x.date}','late')">⚠ Atraso</button></div>`:`<small>Por ${esc(pname(r.recorded_by))} • ${new Date(r.recorded_at).toLocaleString("pt-BR")}</small>`}</div>`}).join("");}
function renderTrash(){const first=new Date(calYear,calMonth,1),last=new Date(calYear,calMonth+1,0),start=(first.getDay()+6)%7,d0=today();let days="";for(let i=0;i<start;i++)days+=`<div class="cal-day empty"></div>`;for(let d=1;d<=last.getDate();d++){const ds=`${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`,rs=trash.filter(x=>x.trash_date===ds);days+=`<div class="cal-day ${rs.length?"registered":""} ${ds===d0?"today":""}"><span class="num">${d}</span>${rs.map(x=>`<span class="mark">● ${esc(pname(x.recorded_by))}</span>`).join("")}<button onclick="addTrash('${ds}')">+ registrar</button></div>`}$("trash").innerHTML=`<h2>🗑️ Registro do lixo</h2><div class="card calendar-card"><div class="cal-toolbar"><button onclick="changeMonth(-1)">‹</button><b>${first.toLocaleString("pt-BR",{month:"long",year:"numeric"})}</b><button onclick="changeMonth(1)">›</button></div><div class="cal-week"><span>SEG</span><span>TER</span><span>QUA</span><span>QUI</span><span>SEX</span><span>SÁB</span><span>DOM</span></div><div class="cal-grid">${days}</div><div class="legend"><span><i class="dot" style="background:#20b65d"></i>Lixo registrado</span><span><i class="dot" style="background:#7137d8"></i>Hoje</span></div></div><button class="btn green wide" onclick="openQuickTrash()">＋ Registrar lixo hoje</button><div class="card"><h3>Registros recentes</h3>${trash.slice(0,30).map(x=>`<div class="recent row"><span>${br(x.trash_date)} — <b>${esc(pname(x.recorded_by))}</b> ${proom(x.recorded_by)?`(${esc(proom(x.recorded_by))})`:""}</span>${x.recorded_by===me.id?`<button class="small-btn" onclick="delTrash(${x.id})">✕</button>`:""}</div>`).join("")||"<small>Nenhum registro ainda.</small>"}</div>`;}
function changeMonth(n){calMonth+=n;if(calMonth<0){calMonth=11;calYear--}if(calMonth>11){calMonth=0;calYear++}renderTrash();}
function renderRank(){$("rank").innerHTML=`<h2>🏆 Ranking completo</h2><div class="card"><table><thead><tr><th>#</th><th>Pessoa</th><th>Quarto</th><th>Lixo</th></tr></thead><tbody>${ranking().map(([id,c],i)=>`<tr><td>${i+1}</td><td><b>${esc(pname(id))}</b></td><td>${esc(proom(id))}</td><td>${c}</td></tr>`).join("")}</tbody></table></div>`;}
function setProfileView(view){profileView=view;renderProfile();}
async function upd(f,v){const {error}=await sb.from("profiles").update({[f]:v}).eq("id",me.id);if(error)return alert(error.message);me[f]=v;renderProfile();renderDashboard();}
async function saveProfile(){const name=$("profileName").value.trim(),room=$("profileRoom").value,{error}=await sb.from("profiles").update({name,room}).eq("id",me.id);if(error)return alert(error.message);await refresh();$("who").textContent=`${me.name} • ${me.room}`;}
function hairPreview(style){return avatar({...me,avatar_hair:style});}
function renderProfile(){
  const m=myRank(), future=myFuture(), braid=["braids","side_braid","box_braids"].includes(me.avatar_hair||"");
  let customization="";
  if(profileView==="appearance"){
    customization=`
      <div class="avatar-section"><h4>Tom de pele</h4><div class="colors">${Object.entries(skinColors).map(([k,c])=>`<button class="color ${me.avatar_skin===k?"active":""}" style="background:${c}" onclick="upd('avatar_skin','${k}')" aria-label="Tom ${k}"></button>`).join("")}</div></div>
      <div class="avatar-section"><h4>Cabelo</h4><div class="hair-grid">${Object.entries(hairNames).map(([k,l])=>`<button class="hair-choice ${me.avatar_hair===k?"active":""}" onclick="upd('avatar_hair','${k}')" title="${l}"><div class="mini-avatar">${hairPreview(k)}</div><span>${l}</span></button>`).join("")}</div></div>
      <div class="avatar-section"><h4>Cor do cabelo</h4><div class="colors">${Object.entries(hairColors).map(([k,c])=>`<button class="color ${me.avatar_hair_color===k?"active":""}" style="background:${c}" onclick="upd('avatar_hair_color','${k}')" aria-label="Cor ${k}"></button>`).join("")}</div></div>
      ${braid?`<div class="avatar-section"><h4>Segunda cor das tranças</h4><div class="colors">${Object.entries(hairColors).map(([k,c])=>`<button class="color ${me.avatar_hair_color_2===k?"active":""}" style="background:${c}" onclick="upd('avatar_hair_color_2','${k}')" aria-label="Segunda cor ${k}"></button>`).join("")}</div></div>`:""}
      <div class="avatar-section"><h4>Cor dos olhos</h4><div class="colors eye-colors">${Object.entries(eyeColors).map(([k,c])=>`<button class="color eye-dot ${me.avatar_eyes===k?"active":""}" style="--eye:${c}" onclick="upd('avatar_eyes','${k}')" aria-label="Olhos ${k}"></button>`).join("")}</div></div>`;
  }else if(profileView==="clothes"){
    customization=`<div class="avatar-section"><h4>Escolha a blusa</h4><div class="options">${Object.entries(shirtNames).map(([k,l])=>`<button class="option ${me.avatar_shirt===k?"active":""}" onclick="upd('avatar_shirt','${k}')">${l}</button>`).join("")}</div></div>`;
  }else{
    customization=`<div class="avatar-section"><h4>Acessórios</h4><div class="options">${Object.entries(accessoryNames).map(([k,l])=>`<button class="option ${(me.avatar_accessory||"none")===k?"active":""}" onclick="upd('avatar_accessory','${k}')">${l}</button>`).join("")}</div></div><div class="avatar-section"><h4>Detalhes do rosto</h4><div class="options"><button class="option ${me.avatar_freckles?"active":""}" onclick="upd('avatar_freckles',${!me.avatar_freckles})">Sardas</button><button class="option ${me.avatar_beauty_mark?"active":""}" onclick="upd('avatar_beauty_mark',${!me.avatar_beauty_mark})">Pintinha</button></div></div>`;
  }
  $("profile").innerHTML=`
    <div class="profile-hero"><div class="avatar-big">${avatar(me)}</div><div class="profile-name">${esc(me.name)}</div><small>${esc(me.room)}</small></div>
    <div class="profile-tabs"><button class="${profileView==="appearance"?"active":""}" onclick="setProfileView('appearance')">Aparência</button><button class="${profileView==="clothes"?"active":""}" onclick="setProfileView('clothes')">Roupas</button><button class="${profileView==="accessories"?"active":""}" onclick="setProfileView('accessories')">Acessórios</button></div>
    ${customization}
    <div class="card profile-edit-data"><h3>Dados do perfil</h3><div class="editor"><div class="field"><label>Nome</label><input id="profileName" value="${esc(me.name)}"></div><div class="field"><label>Quarto</label><select id="profileRoom">${rooms.map(r=>`<option ${r===me.room?"selected":""}>${r}</option>`).join("")}</select></div></div><button class="btn primary wide" onclick="saveProfile()">Salvar perfil</button><button class="btn light wide" onclick="logout()">Sair da conta</button></div>
    <div class="stats two-stats"><div class="stat"><b>${m.count}</b><small>vezes que tirou lixo</small></div><div class="stat"><b>${m.rank}</b><small>posição no ranking</small></div></div>
    <div class="card"><h3>🧹 Próximas limpezas</h3>${future.map(x=>`<div class="recent"><b>${br(x.date)}</b> • ${x.room}</div>`).join("")||"<small>Nenhuma data futura.</small>"}<div class="actions"><button class="btn primary" onclick="downloadICS()">📥 Baixar calendário</button><button class="btn light" onclick="googleNext()">📅 Google Agenda</button></div></div>`;
}

function renderHistory(){const items=[];cleaning.forEach(x=>items.push({a:x.recorded_at,h:`🧹 ${br(x.cleaning_date)} — <b>${x.assigned_room}</b> — ${x.status==="done"?"feito":"atrasado"} — ${esc(pname(x.recorded_by))}`}));trash.forEach(x=>items.push({a:x.recorded_at,h:`🗑️ ${br(x.trash_date)} — <b>${esc(pname(x.recorded_by))}</b> tirou o lixo`}));items.sort((a,b)=>new Date(b.a)-new Date(a.a));$("history").innerHTML=`<h2>📜 Histórico</h2>${items.slice(0,100).map(x=>`<div class="card">${x.h}</div>`).join("")}`;}
function renderAll(){
  const renders=[["dash",renderDashboard],["agenda",renderAgenda],["trash",renderTrash],["rank",renderRank],["profile",renderProfile],["history",renderHistory]];
  renders.forEach(([id,fn])=>{try{fn()}catch(e){console.error(`Erro em ${id}:`,e);const el=$(id);if(el)el.innerHTML=`<div class="card error-card"><b>Não foi possível carregar esta tela.</b><small>${esc(e.message||e)}</small></div>`;}});
}
function openQuickTrash(){pendingTrash=today();$("quickTrashText").innerHTML=`Registrar que <b>${esc(me?.name||"você")}</b> tirou o lixo hoje, <b>${br(pendingTrash)}</b>?`;$("quickTrashModal").classList.remove("hidden");}
function closeQuickTrash(){$("quickTrashModal").classList.add("hidden");pendingTrash=null;}
async function confirmQuickTrash(){const d=pendingTrash;closeQuickTrash();if(d)await addTrash(d);}
function icsDate(date,h){const [y,m,d]=date.split("-");return `${y}${m}${d}T${String(h).padStart(2,"0")}0000`;}
function downloadICS(){const ev=myFuture();if(!ev.length)return alert("Sem datas futuras.");const l=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Banheiro Apto 101//PT-BR","CALSCALE:GREGORIAN"];ev.forEach(x=>l.push("BEGIN:VEVENT",`UID:${x.date}-${me.room.replace(/\s/g,"")}@banheiro-apto101`,`DTSTART;TZID=America/Sao_Paulo:${icsDate(x.date,9)}`,`DTEND;TZID=America/Sao_Paulo:${icsDate(x.date,10)}`,"SUMMARY:🧹 Lavar o banheiro",`DESCRIPTION:Responsável: ${me.room}`,"BEGIN:VALARM","TRIGGER:-P1D","ACTION:DISPLAY","DESCRIPTION:Amanhã é seu dia de lavar o banheiro","END:VALARM","BEGIN:VALARM","TRIGGER:-PT2H","ACTION:DISPLAY","DESCRIPTION:Hoje é seu dia de lavar o banheiro","END:VALARM","END:VEVENT"));l.push("END:VCALENDAR");const blob=new Blob([l.join("\r\n")],{type:"text/calendar;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="limpeza-banheiro-apto-101.ics";a.click();}
function googleNext(){const x=myFuture()[0];if(!x)return alert("Sem próxima data.");window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("🧹 Lavar o banheiro")}&dates=${icsDate(x.date,9)}/${icsDate(x.date,10)}&ctz=America%2FSao_Paulo&details=${encodeURIComponent("Responsável: "+me.room)}`,"_blank");}
const remembered=localStorage.getItem("banheiro_email");if(remembered)$("loginEmail").value=remembered;sb.auth.getSession().then(({data})=>{if(data.session)loadApp();});
