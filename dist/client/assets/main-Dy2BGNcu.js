(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const u of document.querySelectorAll('link[rel="modulepreload"]'))d(u);new MutationObserver(u=>{for(const e of u)if(e.type==="childList")for(const c of e.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&d(c)}).observe(document,{childList:!0,subtree:!0});function i(u){const e={};return u.integrity&&(e.integrity=u.integrity),u.referrerPolicy&&(e.referrerPolicy=u.referrerPolicy),u.crossOrigin==="use-credentials"?e.credentials="include":u.crossOrigin==="anonymous"?e.credentials="omit":e.credentials="same-origin",e}function d(u){if(u.ep)return;u.ep=!0;const e=i(u);fetch(u.href,e)}})();const Fe="tascorr-offline",Ue=1,Y="pending_ops";let le=null;function oe(){return le?Promise.resolve(le):new Promise((t,s)=>{const i=indexedDB.open(Fe,Ue);i.onupgradeneeded=d=>{const u=d.target.result;u.objectStoreNames.contains(Y)||u.createObjectStore(Y,{keyPath:"id",autoIncrement:!0}).createIndex("timestamp","timestamp",{unique:!1})},i.onsuccess=d=>{le=d.target.result,t(le)},i.onerror=d=>{console.error("[OfflineDB] Failed to open IndexedDB:",d.target.error),s(d.target.error)}})}async function Ce(t){const s=await oe();return new Promise((i,d)=>{const e=s.transaction(Y,"readwrite").objectStore(Y),c={method:t.method,path:t.path,body:t.body,timestamp:Date.now(),retries:0},n=e.add(c);n.onsuccess=()=>i(n.result),n.onerror=()=>d(n.error)})}async function qe(){const t=await oe();return new Promise((s,i)=>{const c=t.transaction(Y,"readonly").objectStore(Y).index("timestamp").getAll();c.onsuccess=()=>s(c.result),c.onerror=()=>i(c.error)})}async function Oe(){const t=await oe();return new Promise((s,i)=>{const e=t.transaction(Y,"readonly").objectStore(Y).count();e.onsuccess=()=>s(e.result),e.onerror=()=>i(e.error)})}async function xe(t){const s=await oe();return new Promise((i,d)=>{const c=s.transaction(Y,"readwrite").objectStore(Y).delete(t);c.onsuccess=()=>i(),c.onerror=()=>d(c.error)})}const Ve={};class ve extends Error{constructor(s,i,d=null){super(i),this.name="ApiError",this.status=s,this.details=d}}class fe extends Error{constructor(){super("You are currently offline. Showing cached data where available."),this.name="OfflineError"}}async function ue(){try{const t=await Oe(),s=document.getElementById("pending-sync-badge");if(!s)return;t>0?(s.textContent=`${t} pending`,s.style.display="inline-flex"):s.style.display="none"}catch{}}async function L(t,s,i=null){const d=typeof import.meta<"u"&&Ve?"/tascorr/".replace(/\/$/,""):"",u=s.startsWith("/api")?s:`/api${s}`,e=`${window.location.origin}${d}${u}`,c={Accept:"application/json"};i instanceof FormData||(c["Content-Type"]="application/json");const n=localStorage.getItem("tascorr_token");n&&(c.Authorization=`Bearer ${n}`);const v={method:t,headers:c};i&&(v.body=i instanceof FormData?i:JSON.stringify(i));const r=["POST","PATCH","PUT","DELETE"].includes(t.toUpperCase());if(r&&!navigator.onLine){try{await Ce({method:t,path:u,body:i}),await ue(),console.log(`[Offline Queue] Queued ${t} ${u}`)}catch(g){console.error("[Offline Queue] Failed to enqueue operation:",g)}return{queued:!0,message:"Saved locally. Will sync when back online."}}try{const g=await fetch(e,v);if(g.status===401){localStorage.removeItem("tascorr_token"),localStorage.removeItem("tascorr_user");const a=window.location.hash;a&&a!=="#landing"&&a!=="#login"&&a!=="#signup"&&(window.location.hash="login")}if(g.status===503&&t==="GET")throw new fe;let o;const p=g.headers.get("content-type");if(p&&p.includes("application/json")?o=await g.json():o={message:await g.text()},!g.ok)throw new ve(g.status,o.error||o.message||"API request failed.",o);return o}catch(g){if(g instanceof ve||g instanceof fe)throw g;if(r&&!navigator.onLine){try{await Ce({method:t,path:u,body:i}),await ue()}catch{}return{queued:!0,message:"Saved locally. Will sync when back online."}}throw navigator.onLine?new ve(500,g.message||"Network communication error. Please check your connection."):new fe}}class Ge{constructor(){this.currentUser=null,this.isAuthenticated=!1,this.initialized=!1;const s=localStorage.getItem("tascorr_user");if(s)try{this.currentUser=JSON.parse(s),this.isAuthenticated=!0}catch{localStorage.removeItem("tascorr_user")}}async login(s,i){const d=await L("POST","/auth/login",{email:s,password:i});return d.token&&localStorage.setItem("tascorr_token",d.token),this.currentUser=d.user,this.isAuthenticated=!0,localStorage.setItem("tascorr_user",JSON.stringify(d.user)),d}async signup(s,i,d){return await L("POST","/auth/signup",{name:s,adminEmail:i,adminPassword:d})}async logout(){try{await L("POST","/auth/logout")}catch(s){console.warn("Network error during logout",s)}this.currentUser=null,this.isAuthenticated=!1,localStorage.removeItem("tascorr_token"),localStorage.removeItem("tascorr_user"),window.location.hash="landing"}async checkSession(){if(!localStorage.getItem("tascorr_token"))return this.currentUser=null,this.isAuthenticated=!1,null;try{const s=await L("GET","/auth/session");return this.currentUser=s.user,this.isAuthenticated=!0,localStorage.setItem("tascorr_user",JSON.stringify(s.user)),s.user}catch{return this.currentUser=null,this.isAuthenticated=!1,localStorage.removeItem("tascorr_token"),localStorage.removeItem("tascorr_user"),null}finally{this.initialized=!0}}isAdmin(){return this.isAuthenticated&&this.currentUser&&this.currentUser.rankLevel===0}isExecutive(){return this.isAuthenticated&&this.currentUser&&this.currentUser.rankLevel<=1}isDeptHead(){return this.isAuthenticated&&this.currentUser&&this.currentUser.rankLevel<=2}isManager(){return this.isAuthenticated&&this.currentUser&&this.currentUser.rankLevel<=3}isSuperadmin(){return this.isAuthenticated&&this.currentUser&&this.currentUser.email==="superadmin@tascorr.com"}}const $=new Ge;function E(t){return typeof t!="string"?t==null?"":String(t):t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function We(){return`
    <div style="display: flex; flex-direction: column; gap: 32px; max-width: 1600px; margin: 0 auto;">
      <!-- Page Title -->
      <div>
        <h1 class="page-title">Executive Dashboard</h1>
        <p class="body-text" style="margin-top: 8px;">Real-time organizational health assessment at a glance.</p>
      </div>

      <!-- Loading skeleton -->
      <div id="dashboard-loading" style="display: flex; flex-direction: column; gap: 24px;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px;">
          ${Array(4).fill(0).map(()=>`
            <div class="widget-card" style="height: 120px; background-color: var(--bg-primary); display: flex; flex-direction: column; gap: 12px;">
              <div style="width: 40%; height: 16px; background-color: var(--bg-tertiary); border-radius: var(--radius-sm);"></div>
              <div style="width: 25%; height: 32px; background-color: var(--bg-tertiary); border-radius: var(--radius-sm);"></div>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- Live Dashboard Content Container -->
      <div id="dashboard-content" style="display: none; flex-direction: column; gap: 32px;">
        
        <!-- ============================================== -->
        <!-- DESKTOP DASHBOARD (Hidden on mobile)           -->
        <!-- ============================================== -->
        <div class="desktop-only" style="display: flex; flex-direction: column; gap: 32px; width: 100%;">
          <!-- TOP ROW: Summary Metrics -->
          <div class="dashboard-grid" id="dashboard-metrics-grid">
            <!-- Populated dynamically -->
          </div>

          <!-- SECOND ROW: Analytics & Activity -->
          <div class="dashboard-grid">
            <!-- Team Workload Allocation -->
            <div class="grid-col-6 widget-card" style="display: flex; flex-direction: column;">
              <h3 class="card-title" style="margin-bottom: 16px; display: flex; align-items: center;">Team Workload Allocation<div class="tooltip-container"><span class="help-icon">?</span><span class="tooltip-text">A real-time overview of active and blocked tasks assigned to each team member.</span></div></h3>
              <div id="workload-list" style="display: flex; flex-direction: column; gap: 16px; flex: 1;">
              </div>
            </div>

            <!-- Departmental Activity -->
            <div class="grid-col-6 widget-card">
              <h3 class="card-title" style="margin-bottom: 16px; display: flex; align-items: center;">Departmental Productivity Index<div class="tooltip-container"><span class="help-icon">?</span><span class="tooltip-text">Task completion rates and efficiency metrics grouped by department.</span></div></h3>
              <div id="departmental-list" style="display: flex; flex-direction: column; gap: 12px;">
              </div>
            </div>
          </div>

          <!-- THIRD ROW: Recent Logs & Notifications -->
          <div class="dashboard-grid">
            <!-- Recent Task Activity Log -->
            <div class="grid-col-8 widget-card">
              <h3 class="card-title" style="margin-bottom: 16px; display: flex; align-items: center;">Recent Organizational Activity<div class="tooltip-container"><span class="help-icon">?</span><span class="tooltip-text">Chronological history of recent task actions and updates.</span></div></h3>
              <div id="activity-log-list" style="display: flex; flex-direction: column; gap: 12px; max-height: 300px; overflow-y: auto;">
              </div>
            </div>

            <!-- Notification Matrix -->
            <div class="grid-col-4 widget-card">
              <h3 class="card-title" style="margin-bottom: 16px; display: flex; align-items: center;">Notification Matrix<div class="tooltip-container"><span class="help-icon">?</span><span class="tooltip-text">Important alerts and updates requiring your attention.</span></div></h3>
              <div id="notifications-list" style="display: flex; flex-direction: column; gap: 12px;">
              </div>
            </div>
          </div>
        </div>

        <!-- ============================================== -->
        <!-- MOBILE DASHBOARD (Hidden on desktop)           -->
        <!-- ============================================== -->
        <div class="mobile-only" style="flex-direction: column; gap: 24px; width: 100%;">
          <!-- Hero Card: Weekly Progress -->
          <div style="background-color: #111827; color: white; border-radius: 24px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); position: relative; overflow: hidden;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 14px; font-weight: 500; color: #E5E7EB;">Weekly progress</span>
              <span id="mobile-hero-trend" style="background-color: rgba(255,255,255,0.15); color: #fff; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;">📈 +0%</span>
            </div>
            <h2 id="mobile-hero-pct" style="font-size: 48px; font-weight: 700; line-height: 1; margin-bottom: 24px; color: inherit;">0%</h2>
            <div style="width: 100%; height: 8px; background-color: rgba(255,255,255,0.2); border-radius: 4px; overflow: hidden; margin-bottom: 12px;">
              <div id="mobile-hero-bar" style="height: 100%; width: 0%; background-color: #fff; border-radius: 4px;"></div>
            </div>
            <p id="mobile-hero-subtitle" style="font-size: 12px; color: #9CA3AF; margin: 0;">0 of 0 tasks completed this week</p>
          </div>

          <!-- Stat Cards -->
          <div style="display: flex; gap: 12px; justify-content: space-between;">
            <div style="flex: 1; background: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: 16px; padding: 16px 8px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
              <div id="mobile-stat-in-progress" style="font-size: 24px; font-weight: 700; color: var(--text-primary);">0</div>
              <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">In progress</div>
            </div>
            <div style="flex: 1; background: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: 16px; padding: 16px 8px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
              <div id="mobile-stat-due-today" style="font-size: 24px; font-weight: 700; color: var(--text-primary);">0</div>
              <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">Due today</div>
            </div>
            <div style="flex: 1; background: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: 16px; padding: 16px 8px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
              <div id="mobile-stat-completed" style="font-size: 24px; font-weight: 700; color: var(--text-primary);">0</div>
              <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">Completed</div>
            </div>
          </div>

          <!-- Due Today Tasks List -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px;">
              <h3 style="font-size: 18px; font-weight: 700; color: var(--text-primary);">Due today</h3>
              <span id="mobile-due-today-count" style="font-size: 13px; color: var(--text-secondary);">0 tasks</span>
            </div>
            <div id="mobile-due-today-list" style="display: flex; flex-direction: column; gap: 16px;">
              <!-- Populated dynamically -->
            </div>
          </div>

          <!-- Team Workload Allocation -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px;">
              <h3 style="font-size: 18px; font-weight: 700; color: var(--text-primary);">Team Workload</h3>
            </div>
            <div id="mobile-workload-list" style="display: flex; flex-direction: column; gap: 16px;">
              <!-- Populated dynamically -->
            </div>
          </div>
        </div>
      </div>
    </div>
  `}async function Me(){const t=document.getElementById("dashboard-loading"),s=document.getElementById("dashboard-content");if(s)try{const[i,d,u,e,c]=await Promise.all([L("GET","/tasks"),L("GET","/tasks/workload").catch(()=>({workload:{}})),L("GET","/users"),L("GET","/departments"),L("GET","/notifications").catch(()=>({notifications:[]}))]),n=i.tasks||[],v=d.workload||{},r=(u.users||[]).filter(C=>{var A;return((A=C.rank)==null?void 0:A.level)!==0}),g=e.departments||[],o=c.notifications||[],p=new Date;p.setHours(0,0,0,0);const a=n.filter(C=>C.status==="Blocked"||C.status==="Under Review"),m=n.filter(C=>C.status!=="Completed"&&new Date(C.dueDate)<p),b=n.filter(C=>C.status==="Under Review"),y=new Date;y.setDate(y.getDate()-7);const l=n.filter(C=>C.status==="Completed"&&new Date(C.updatedAt)>=y),x=document.getElementById("dashboard-metrics-grid");x&&(x.innerHTML=`
        <div class="grid-col-3 widget-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <span class="small-text" style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center;">Attention Required<div class="tooltip-container"><span class="help-icon">?</span><span class="tooltip-text">Tasks that are blocked or under review.</span></div></span>
            <div class="pill-badge ${a.length>0?"status-danger":"status-success"}">
              <span class="badge-dot"></span>${a.length>0?"Action Needed":"Healthy"}
            </div>
          </div>
          <div class="page-title" style="font-size: 36px; line-height: 1.1;">${a.length}</div>
          <p class="small-text" style="margin-top: 8px;">Blocked or Under Review task items</p>
        </div>

        <div class="grid-col-3 widget-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <span class="small-text" style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center;">Overdue Tasks<div class="tooltip-container"><span class="help-icon">?</span><span class="tooltip-text">Active tasks that have passed their target due date.</span></div></span>
            <div class="pill-badge ${m.length>0?"status-danger":"status-success"}">
              <span class="badge-dot"></span>${m.length>0?"Overdue":"On Track"}
            </div>
          </div>
          <div class="page-title" style="font-size: 36px; line-height: 1.1;">${m.length}</div>
          <p class="small-text" style="margin-top: 8px;">Active tasks past target due dates</p>
        </div>

        <div class="grid-col-3 widget-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <span class="small-text" style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center;">Pending Approvals<div class="tooltip-container"><span class="help-icon">?</span><span class="tooltip-text">Tasks awaiting managerial authorization.</span></div></span>
            <div class="pill-badge ${b.length>0?"status-warning":"status-success"}">
              <span class="badge-dot"></span>${b.length>0?"Awaiting Action":"Clear"}
            </div>
          </div>
          <div class="page-title" style="font-size: 36px; line-height: 1.1;">${b.length}</div>
          <p class="small-text" style="margin-top: 8px;">Tasks awaiting manager authorization</p>
        </div>

        <div class="grid-col-3 widget-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <span class="small-text" style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center;">Completed (WTD)<div class="tooltip-container"><span class="help-icon">?</span><span class="tooltip-text">Tasks successfully closed within the last 7 days.</span></div></span>
            <div class="pill-badge status-success">
              <span class="badge-dot"></span>Completed
            </div>
          </div>
          <div class="page-title" style="font-size: 36px; line-height: 1.1;">${l.length}</div>
          <p class="small-text" style="margin-top: 8px;">Work closed within the last 7 days</p>
        </div>
      `);const k=document.getElementById("workload-list");if(k)if(r.length===0)k.innerHTML='<p class="small-text" style="padding: 16px 0; text-align: center;">No team members registered.</p>';else{const C={};r.forEach(D=>{const N=v[D.id]||{count:0,blocked:0};C[D.id]={user:D,count:N.count,blocked:N.blocked}});const A=Object.values(C);k.innerHTML=A.slice(0,5).map(D=>{var ie;const N=D.user,J=Math.min(D.count/10*100,100),K=D.count>=10,W=K?"var(--status-danger)":"var(--accent-navy-primary)";return`
            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span class="data-number" style="font-size: 13px;">${N.firstName} ${N.lastName} (${((ie=N.rank)==null?void 0:ie.title)||"Employee"})</span>
                <span class="small-text">${D.count} active, ${D.blocked} blocked ${K?'<span style="color: var(--status-danger); font-weight: 600;">(Overloaded)</span>':""}</span>
              </div>
              <div style="height: 6px; background-color: var(--bg-tertiary); border-radius: var(--radius-sm); overflow: hidden;">
                <div style="width: ${J}%; height: 100%; background-color: ${W}; border-radius: var(--radius-sm); transition: width 0.3s ease;"></div>
              </div>
            </div>
          `}).join("")}const h=document.getElementById("mobile-workload-list");if(h&&r.length>0){const C={};r.forEach(D=>{const N=v[D.id]||{count:0,blocked:0};C[D.id]={user:D,count:N.count,blocked:N.blocked}});const A=Object.values(C);h.innerHTML=A.slice(0,5).map(D=>{const N=D.user,J=Math.min(D.count/10*100,100),K=D.count>=10,W=K?"var(--status-danger)":"var(--accent-navy-primary)";return`
          <div style="background: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: 16px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span class="data-number" style="font-size: 14px; color: var(--text-primary); font-weight: 600;">${N.firstName} ${N.lastName}</span>
              <span class="small-text" style="font-size: 12px; color: var(--text-secondary);">${D.count} active, ${D.blocked} blocked ${K?'<span style="color: var(--status-danger); font-weight: 600;">(Overloaded)</span>':""}</span>
            </div>
            <div style="height: 8px; background-color: var(--bg-tertiary); border-radius: var(--radius-md); overflow: hidden;">
              <div style="width: ${J}%; height: 100%; background-color: ${W}; border-radius: var(--radius-md); transition: width 0.3s ease;"></div>
            </div>
          </div>
        `}).join("")}else h&&(h.innerHTML='<p class="small-text" style="padding: 16px 0; text-align: center;">No team members registered.</p>');const w=document.getElementById("departmental-list");w&&(g.length===0?w.innerHTML='<p class="small-text" style="padding: 16px 0; text-align: center;">No department nodes configured.</p>':w.innerHTML=g.map(C=>{const A=n.filter(W=>W.departmentId===C.id),D=A.filter(W=>W.status==="Completed").length,N=A.length>0?Math.round(D/A.length*100):100,K=N<80?"status-warning":"status-success";return`
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-neutral);">
              <span class="data-number" style="font-size: 13px;">${C.name}</span>
              <span class="pill-badge ${K}"><span class="badge-dot"></span>${N}% SLA score</span>
            </div>
          `}).join(""));const f=document.getElementById("activity-log-list");if(f){const C=[];n.forEach(A=>{var D;C.push({type:"INFO",label:"CREATION",text:`Task <strong>${E(A.title)}</strong> was created.`,time:new Date(A.createdAt),badge:"status-info"}),(D=A.blockers)==null||D.forEach(N=>{C.push({type:"DANGER",label:"BLOCK",text:`Task <strong>${E(A.title)}</strong> flagged as <strong>Blocked</strong>.`,time:new Date(N.createdAt),badge:"status-danger"}),N.resolvedAt&&C.push({type:"SUCCESS",label:"RESOLVED",text:`Blocker on Task <strong>${E(A.title)}</strong> resolved.`,time:new Date(N.resolvedAt),badge:"status-success"})})}),C.sort((A,D)=>D.time.getTime()-A.time.getTime()),C.length===0?f.innerHTML='<p class="small-text" style="padding: 16px 0; text-align: center;">No activity recorded yet.</p>':f.innerHTML=C.slice(0,10).map(A=>{const D=Math.round((new Date().getTime()-A.time.getTime())/6e4),N=D<60?`${D} mins ago`:`${Math.round(D/60)} hours ago`;return`
            <div style="display: flex; gap: 12px; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid var(--border-neutral);">
              <div class="pill-badge ${A.badge}" style="padding: 2px 6px; font-size: 10px;">${A.label}</div>
              <div>
                <p class="body-text" style="color: var(--text-primary); font-size: 13px;">${A.text}</p>
                <span class="small-text">${N}</span>
              </div>
            </div>
          `}).join("")}const I=document.getElementById("notifications-list");if(I){const C=o.filter(A=>!A.isRead);C.length===0?I.innerHTML=`
          <div style="padding: 16px; background-color: var(--bg-secondary); border-radius: var(--radius-md); text-align: center; border: 1px dashed var(--border-neutral);">
            <p class="small-text">No pending notifications in your queue.</p>
          </div>
        `:(I.innerHTML=C.slice(0,3).map(A=>`
          <div style="padding: 10px; background-color: var(--bg-tertiary); border-radius: var(--radius-md); border-left: 3px solid var(--status-info); position: relative;">
            <p class="small-text" style="font-weight: 600; color: var(--text-primary);">${A.title}</p>
            <p class="small-text" style="margin-top: 4px;">${A.message}</p>
            <button class="mark-read-btn" data-id="${A.id}" style="background: none; border: none; font-size: 10px; color: var(--accent-navy-primary); cursor: pointer; margin-top: 6px; padding: 0;">Mark as Read</button>
          </div>
        `).join(""),I.querySelectorAll(".mark-read-btn").forEach(A=>{A.addEventListener("click",async()=>{const D=Number(A.dataset.id);try{await L("PATCH",`/notifications/${D}/read`),Me()}catch(N){console.error(N)}})}))}const S=n.filter(C=>C.status==="In Progress"||C.status==="Pending").length,M=m.length+n.filter(C=>new Date(C.dueDate).toDateString()===p.toDateString()).length,P=l.length,H=document.getElementById("mobile-hero-pct"),j=document.getElementById("mobile-hero-bar"),B=document.getElementById("mobile-hero-subtitle"),q=document.getElementById("mobile-hero-trend");if(H){const C=n.filter(N=>new Date(N.updatedAt)>=y||new Date(N.createdAt)>=y),A=C.filter(N=>N.status==="Completed").length,D=C.length>0?Math.round(A/C.length*100):0;H.innerText=`${D}%`,j&&(j.style.width=`${D}%`),B&&(B.innerText=`${A} of ${C.length} tasks completed this week`),q&&(q.innerText=`📈 +${Math.round(D/2+2)}%`)}const z=document.getElementById("mobile-stat-in-progress"),R=document.getElementById("mobile-stat-due-today"),O=document.getElementById("mobile-stat-completed");z&&(z.innerText=S),R&&(R.innerText=M),O&&(O.innerText=P);const Z=document.getElementById("mobile-due-today-list"),F=document.getElementById("mobile-due-today-count");if(Z){const C=n.filter(A=>A.status!=="Completed"&&new Date(A.dueDate).getTime()<=p.getTime()+864e5);F&&(F.innerText=`${C.length} tasks`),C.length===0?Z.innerHTML='<div style="text-align: center; color: var(--text-secondary); font-size: 13px; padding: 20px;">No tasks due today.</div>':Z.innerHTML=C.map(A=>{var Ie,Be,Ae,Le;const D=((Ie=A.assignments)==null?void 0:Ie.length)>0?`${A.assignments[0].user.firstName} ${A.assignments[0].user.lastName}`:"Unassigned",N=((Be=A.assignments)==null?void 0:Be.length)>0?A.assignments[0].userId:null,J=D!=="Unassigned"?D[0]:"?",W={High:"#DC2626",Critical:"#DC2626",Medium:"#D97706",Low:"#10B981"}[A.priority]||"#3B82F6",ie=((Ae=A.subtasks)==null?void 0:Ae.length)||2,Te=((Le=A.subtasks)==null?void 0:Le.filter(Re=>Re.status==="Completed").length)||1,$e=Math.round(Te/Math.max(1,ie)*100);return`
            <div style="background: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: 20px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="display: flex; gap: 8px; align-items: center;">
                  <span style="color: ${W}; background: ${W}15; padding: 4px 8px; border-radius: 8px; font-size: 10px; font-weight: 700;">${A.priority}</span>
                  <span style="color: var(--text-secondary); font-size: 12px; font-weight: 500;">General</span>
                </div>
                <div style="background: #F3F4F6; padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; color: #4B5563; display: flex; align-items: center; gap: 4px;">
                  <span style="display: block; width: 6px; height: 6px; border-radius: 50%; background: #EF4444;"></span> ${A.status}
                </div>
              </div>
              <h4 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 16px;">${A.title}</h4>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-secondary);">
                  <input type="radio" checked style="accent-color: #111827; pointer-events: none;" /> ${Te}/${ie} subtasks
                </div>
                <span style="font-size: 11px; color: var(--text-secondary);">${$e}%</span>
              </div>
              <div style="width: 100%; height: 4px; background: #E5E7EB; border-radius: 2px; margin-bottom: 16px; overflow: hidden;">
                <div style="height: 100%; width: ${$e}%; background: #111827; border-radius: 2px;"></div>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  ${N?`<img src="/avatars/user-${N}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;" />`:""}
                  <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--sidebar-bg); color: var(--text-primary); display: ${N?"none":"flex"}; align-items: center; justify-content: center; font-size: 10px; font-weight: 700;">${J}</div>
                  <span style="font-size: 12px; font-weight: 500; color: var(--text-primary);">${D}</span>
                </div>
                <span style="font-size: 12px; font-weight: 600; color: var(--text-primary);">Today</span>
              </div>
            </div>
          `}).join("")}t&&(t.style.display="none"),s.style.display="flex"}catch(i){console.error(i),t&&(t.innerHTML=`
        <div style="padding: 32px; background-color: rgba(220, 38, 38, 0.05); border-radius: var(--radius-lg); text-align: center; border: 1px dashed var(--status-danger);">
          <p class="body-text" style="color: var(--status-danger); font-weight: 600;">Failed to load live dashboard statistics.</p>
          <p class="small-text" style="margin-top: 8px;">Error: ${i.message||"Server connection issue."}</p>
        </div>
      `)}}function _e(){Me()}class Ye{constructor(){this.container=null,this.initContainer()}initContainer(){this.container||(this.container=document.createElement("div"),this.container.id="toast-container",this.container.style.cssText=`
      position: fixed;
      top: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: 9999;
      max-width: 380px;
      width: calc(100vw - 48px);
      pointer-events: none;
    `,document.body.appendChild(this.container))}show(s,i,d,u=4e3){this.initContainer();const e=document.createElement("div");e.className=`toast-item toast-${s}`,e.style.cssText=`
      background-color: var(--bg-primary);
      border: 1px solid var(--border-neutral);
      border-radius: var(--radius-lg);
      padding: 16px 20px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      gap: 4px;
      pointer-events: auto;
      transform: translateX(120%);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
      position: relative;
      overflow: hidden;
    `;const n={success:"var(--status-success)",warning:"var(--status-warning)",danger:"var(--status-danger)",info:"var(--status-info)"}[s]||"var(--text-secondary)",v=document.createElement("div");v.style.cssText=`
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background-color: ${n};
    `,e.appendChild(v);const r=document.createElement("button");r.innerHTML="&times;",r.style.cssText=`
      position: absolute;
      right: 12px;
      top: 12px;
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: var(--text-secondary);
      line-height: 1;
      padding: 4px;
    `,r.addEventListener("click",()=>this.dismiss(e)),e.appendChild(r);const g=document.createElement("strong");g.className="data-number",g.style.cssText=`
      font-size: 14px;
      color: var(--text-primary);
      padding-right: 16px;
    `,g.innerText=i,e.appendChild(g);const o=document.createElement("p");o.className="small-text",o.style.cssText=`
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.4;
    `,o.innerText=d,e.appendChild(o),this.container.appendChild(e),requestAnimationFrame(()=>{e.style.transform="translateX(0)"}),u>0&&setTimeout(()=>this.dismiss(e),u)}success(s,i,d){this.show("success",s,i,d)}warning(s,i,d){this.show("warning",s,i,d)}error(s,i,d){this.show("danger",s,i,d)}info(s,i,d){this.show("info",s,i,d)}dismiss(s){s.style.transform="translateX(120%)",s.style.opacity="0",setTimeout(()=>{s.parentNode&&s.parentNode.removeChild(s)},300)}}const T=new Ye;class Ne{constructor(s){this.onSuccess=s,this.drawerEl=null,this.overlayEl=null,this.users=[],this.departments=[],this.subtasks=[]}async render(){this.subtasks=[];try{const e=await L("GET","/users?assignableOnly=true");this.users=e.users||[];const c=new Map;this.users.forEach(n=>{n.departmentId&&n.department&&c.set(n.departmentId,n.department.name)}),this.departments=Array.from(c.entries()).map(([n,v])=>({id:n,name:v}))}catch(e){console.error(e),T.error("Data Loading Failed","Could not load assignees list.")}this.overlayEl||(this.overlayEl=document.createElement("div"),this.overlayEl.id="drawer-overlay",this.overlayEl.style.cssText=`
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(17, 24, 39, 0.4);
        backdrop-filter: blur(4px);
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.2s ease;
        pointer-events: none;
      `,this.overlayEl.addEventListener("click",()=>this.close()),document.body.appendChild(this.overlayEl)),this.drawerEl||(this.drawerEl=document.createElement("div"),this.drawerEl.id="task-create-drawer",document.body.appendChild(this.drawerEl));const s=this.users,i=s.map(e=>{var c;return`<option value="${e.id}">${E(e.firstName)} ${E(e.lastName)} (${E(((c=e.rank)==null?void 0:c.title)||"Employee")})</option>`}).join(""),d=this.departments.map(e=>`<option value="${e.id}">${E(e.name)}</option>`).join("");window.innerWidth<=768?this.drawerEl.innerHTML=`
        <div style="display:flex; flex-direction:column; height:100%; width: 100%; background: inherit; padding: 20px; padding-bottom: 0; position: relative;">
          <!-- Drag Handle -->
          <div style="width: 48px; height: 5px; background: var(--border-neutral); border-radius: 3px; margin: 0 auto 16px auto; flex-shrink: 0; opacity: 0.5;"></div>
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-shrink: 0;">
            <h2 style="font-size: 20px; font-weight: 700; color: var(--text-primary);">New Task</h2>
            <button id="close-drawer-btn" style="background: var(--sidebar-bg); border: none; width: 32px; height: 32px; min-width: 32px; min-height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-secondary); flex-shrink: 0;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div id="drawer-error-alert" style="display: none; padding: 12px; background-color: rgba(220, 38, 38, 0.1); color: var(--status-danger); font-size: 13px; font-weight: 500; border-radius: var(--radius-md); margin-bottom: 16px;"></div>

          <form id="drawer-task-form" style="display: flex; flex-direction: column; gap: 16px; flex: 1; overflow-y: auto; padding-bottom: 100px;">
            <!-- Task Title -->
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label class="small-text" style="font-size: 10px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.05em; text-transform: uppercase;">Task Title</label>
              <input type="text" id="task-title" required maxlength="100" placeholder="What needs to be done?" style="padding: 12px 16px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-size: 15px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none; font-weight: 500; box-sizing: border-box;" />
            </div>

            <!-- Description -->
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label class="small-text" style="font-size: 10px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.05em; text-transform: uppercase;">Description</label>
              <textarea id="task-desc" required maxlength="2000" placeholder="Add detailed notes..." style="padding: 12px 16px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-size: 14px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none; resize: none; height: 70px; box-sizing: border-box;"></textarea>
            </div>

            <!-- Due Date & Priority Grid -->
            <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 16px; flex-shrink: 0;">
              <!-- Due Date -->
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label class="small-text" style="font-size: 10px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.05em; text-transform: uppercase;">Due Date</label>
                <div style="display: flex; gap: 6px; margin-bottom: 6px;">
                  <div class="mobile-due-opt active" data-offset="0" style="padding: 6px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; background: #E0E7FF; color: #4338CA; cursor: pointer; flex: 1; text-align: center;">Today</div>
                  <div class="mobile-due-opt" data-offset="1" style="padding: 6px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; background: var(--sidebar-bg); color: var(--text-secondary); cursor: pointer; flex: 1; text-align: center;">Tmrw</div>
                </div>
                <input type="date" id="task-due" value="${new Date().toISOString().split("T")[0]}" required style="padding: 10px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none; width: 100%; box-sizing: border-box;" />
              </div>

              <!-- Priority -->
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label class="small-text" style="font-size: 10px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.05em; text-transform: uppercase;">Priority</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; width: 100%;">
                  <div class="mobile-priority-opt" data-val="Low" style="padding: 6px 4px; text-align: center; border-radius: 10px; font-size: 11px; font-weight: 600; background: var(--sidebar-bg); color: var(--text-secondary); cursor: pointer;">Low</div>
                  <div class="mobile-priority-opt active" data-val="Medium" style="padding: 6px 4px; text-align: center; border-radius: 10px; font-size: 11px; font-weight: 600; background: #E0E7FF; color: #4338CA; cursor: pointer;">Med</div>
                  <div class="mobile-priority-opt" data-val="High" style="padding: 6px 4px; text-align: center; border-radius: 10px; font-size: 11px; font-weight: 600; background: var(--sidebar-bg); color: var(--text-secondary); cursor: pointer;">High</div>
                  <div class="mobile-priority-opt" data-val="Critical" style="padding: 6px 4px; text-align: center; border-radius: 10px; font-size: 11px; font-weight: 600; background: var(--sidebar-bg); color: var(--text-secondary); cursor: pointer;">Crit</div>
                </div>
                <input type="hidden" id="task-priority" value="Medium" />
              </div>
            </div>

            <!-- Assign To -->
            <div style="display: flex; flex-direction: column; gap: 8px; flex-shrink: 0;">
              <label class="small-text" style="font-size: 10px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.05em; text-transform: uppercase;">Assign To</label>
              <div style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: none; -ms-overflow-style: none;">
                ${s.map(e=>`
                  <div class="mobile-assignee-opt" data-id="${e.id}" style="display: flex; align-items: center; gap: 8px; cursor: pointer; flex-shrink: 0; padding: 6px 12px; background: var(--bg-secondary); border: 1px solid var(--border-neutral); border-radius: 20px; transition: all 0.2s;">
                    <div style="width: 26px; height: 26px; border-radius: 50%; border: 1.5px solid transparent; transition: all 0.2s; flex-shrink: 0;">
                      <img src="/avatars/user-${e.id}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block;" />
                      <div style="width: 100%; height: 100%; border-radius: 50%; background: var(--sidebar-bg); color: var(--text-primary); display: none; align-items: center; justify-content: center; font-size: 11px; font-weight: 700;">
                        ${E(e.firstName[0])}
                      </div>
                    </div>
                    <span style="font-size: 12px; font-weight: 600; color: var(--text-primary);">${E(e.firstName)}</span>
                  </div>
                `).join("")}
              </div>
              <input type="hidden" id="task-assignee" required />
            </div>

            <!-- Subtasks Checklist -->
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <label class="small-text" style="font-size: 10px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.05em; text-transform: uppercase;">Subtasks Checklist</label>
              <div id="mobile-subtasks-list" style="display: flex; flex-direction: column; gap: 6px; max-height: 120px; overflow-y: auto;"></div>
              <div style="display: flex; gap: 8px; margin-top: 4px;">
                <input type="text" id="mobile-new-subtask" placeholder="Add a subtask..." style="flex: 1; padding: 10px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none; box-sizing: border-box;" />
                <button type="button" id="mobile-add-subtask-btn" style="background: var(--bg-secondary); border: 1px solid var(--border-neutral); border-radius: var(--radius-md); padding: 0 16px; font-weight: 600; color: var(--text-primary); cursor: pointer; font-size: 13px;">Add</button>
              </div>
            </div>

            <input type="hidden" id="task-dept" value="" />
            <input type="checkbox" id="task-recurring" style="display: none;" />
          </form>

          <!-- Fixed Bottom Button -->
          <div class="mobile-drawer-bottom" style="position: absolute; bottom: 0; left: 0; width: 100%; padding: 16px 20px; border-radius: 0 0 32px 32px; box-sizing: border-box;">
            <button id="submit-task-btn" style="width: 100%; background: #3B82F6; color: white; padding: 14px; border: none; border-radius: 100px; font-size: 16px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(59,130,246,0.3);">
              Create & Assign
            </button>
          </div>
        </div>
      `:this.drawerEl.innerHTML=`
        <!-- Header -->
        <div style="padding: 24px; border-bottom: 1px solid var(--border-neutral); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
          <div>
            <h3 class="card-title" style="font-size: 20px;">Create New Task</h3>
            <p class="small-text">Publish and assign a new workforce task item</p>
          </div>
          <button id="close-drawer-btn" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary);">&times;</button>
        </div>

        <!-- Content Scroll Wells -->
        <div style="flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px;">
          <div id="drawer-error-alert" style="display: none; padding: 12px; background-color: rgba(220, 38, 38, 0.1); color: var(--status-danger); font-size: 13px; font-weight: 500; border-radius: var(--radius-md);"></div>

          <form id="drawer-task-form" style="display: flex; flex-direction: column; gap: 16px;">
            <!-- Task Title -->
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="task-title" class="small-text" style="font-weight: 600; color: var(--text-primary); display: flex; align-items: center;">
                Task Title
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">A concise, descriptive title for this task.</span>
                </div>
              </label>
              <input type="text" id="task-title" required maxlength="100" placeholder="Consolidated Financial Review" style="padding: 10px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none;" />
            </div>

            <!-- Description -->
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="task-desc" class="small-text" style="font-weight: 600; color: var(--text-primary); display: flex; align-items: center;">
                Description
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">Detailed instructions or context required to complete the task.</span>
                </div>
              </label>
              <textarea id="task-desc" required maxlength="2000" placeholder="Provide clear contextual description parameters..." rows="4" style="padding: 10px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none; resize: vertical;"></textarea>
            </div>

            <!-- Subtasks Checklist -->
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label class="small-text" style="font-weight: 600; color: var(--text-primary); display: flex; align-items: center;">
                Subtasks Checklist
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">Add smaller actionable items required to complete this task.</span>
                </div>
              </label>
              <div id="desktop-subtasks-list" style="display: flex; flex-direction: column; gap: 6px;"></div>
              <div style="display: flex; gap: 8px;">
                <input type="text" id="desktop-new-subtask" placeholder="e.g., Review quarter 1 metrics..." style="flex: 1; padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none;" />
                <button type="button" id="desktop-add-subtask-btn" class="btn btn-secondary" style="padding: 8px 16px; font-size: 12px;">Add Subtask</button>
              </div>
            </div>

            <!-- Due Date & Priority Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label for="task-due" class="small-text" style="font-weight: 600; color: var(--text-primary); display: flex; align-items: center;">
                  Due Date
                  <div class="tooltip-container">
                    <span class="help-icon">?</span>
                    <span class="tooltip-text">The target deadline for task completion.</span>
                  </div>
                </label>
                <input type="date" id="task-due" required style="padding: 10px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none;" />
              </div>

              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label for="task-priority" class="small-text" style="font-weight: 600; color: var(--text-primary); display: flex; align-items: center;">
                  Priority
                  <div class="tooltip-container">
                    <span class="help-icon">?</span>
                    <span class="tooltip-text">The urgency level. High priority tasks are flagged for immediate attention.</span>
                  </div>
                </label>
                <select id="task-priority" style="padding: 10px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none;">
                  <option value="Low">Low Priority</option>
                  <option value="Medium" selected>Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Critical">Critical Priority</option>
                </select>
              </div>
            </div>

            <!-- Department Scoping -->
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="task-dept" class="small-text" style="font-weight: 600; color: var(--text-primary); display: flex; align-items: center;">
                Department Scoping
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">Restrict visibility and assignment to a specific department.</span>
                </div>
              </label>
              <select id="task-dept" style="padding: 10px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none;">
                <option value="">General / Tenant Scope</option>
                ${d}
              </select>
            </div>

            <!-- Recurring Task Options -->
            <div style="display: flex; flex-direction: column; gap: 10px; padding: 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); background-color: var(--bg-secondary);">
              <div style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" id="task-recurring" style="cursor: pointer; width: 16px; height: 16px;" />
                <label for="task-recurring" class="small-text" style="font-weight: 600; color: var(--text-primary); cursor: pointer; display: flex; align-items: center;">
                  Enable Task Recurrence
                  <div class="tooltip-container">
                    <span class="help-icon">?</span>
                    <span class="tooltip-text">Automatically generate a new copy of this task when it is completed.</span>
                  </div>
                </label>
              </div>
              
              <div id="recurring-interval-wrapper" style="display: none; flex-direction: column; gap: 6px;">
                <label for="task-interval" class="small-text" style="font-weight: 600; color: var(--text-primary); display: flex; align-items: center;">
                  Recurrence Interval
                  <div class="tooltip-container">
                    <span class="help-icon">?</span>
                    <span class="tooltip-text">How frequently the task should repeat (e.g., Daily, Weekly).</span>
                  </div>
                </label>
                <select id="task-interval" style="padding: 10px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-primary); color: var(--text-primary); outline: none;">
                  <option value="Daily">Daily</option>
                  <option value="Weekly" selected>Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
            </div>

            <!-- Assignee & Workload Awareness Banner -->
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="task-assignee" class="small-text" style="font-weight: 600; color: var(--text-primary); display: flex; align-items: center;">
                Assignee
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">The team member responsible for executing this task.</span>
                </div>
              </label>
              <select id="task-assignee" required style="padding: 10px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none;">
                <option value="" disabled selected>Select an assignee...</option>
                ${i}
              </select>

              <!-- Dynamic Workload Info Block -->
              <div id="workload-banner" style="display: none; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-neutral); margin-top: 6px; font-size: 12px;">
                <!-- Populate dynamically -->
              </div>
            </div>
          </form>
        </div>

        <!-- Action Footer -->
        <div style="padding: 16px 24px; border-top: 1px solid var(--border-neutral); background-color: var(--bg-secondary); display: flex; gap: 12px; flex-shrink: 0;">
          <button id="submit-task-btn" type="button" class="btn btn-primary" style="flex: 1; justify-content: center; padding: 10px; border: none; font-weight: 600; font-size: 13px;">
            Create Task
          </button>
          <button id="cancel-drawer-btn" type="button" style="flex: 1; padding: 10px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; color: var(--text-primary); background-color: var(--bg-primary); cursor: pointer; text-align: center;">
            Cancel
          </button>
        </div>
      `,this.initListeners()}initListeners(){const s=document.getElementById("drawer-task-form"),i=document.getElementById("close-drawer-btn"),d=document.getElementById("cancel-drawer-btn"),u=document.getElementById("submit-task-btn"),e=document.getElementById("task-assignee"),c=document.getElementById("workload-banner"),n=document.getElementById("task-recurring"),v=document.getElementById("recurring-interval-wrapper");i==null||i.addEventListener("click",()=>this.close()),d==null||d.addEventListener("click",()=>this.close()),n&&v&&n.addEventListener("change",()=>{v.style.display=n.checked?"flex":"none"}),e&&c&&e.addEventListener("change",()=>{var y;const m=Number(e.value),b=this.users.find(l=>l.id===m);if(b){const l=((y=b.rank)==null?void 0:y.title)||"Employee";c.style.display="block",c.style.backgroundColor="rgba(37, 99, 235, 0.05)",c.style.borderColor="rgba(37, 99, 235, 0.2)",c.innerHTML=`
            <strong style="color: var(--text-primary);">Workload awareness:</strong> 
            Assigned to <strong>${b.firstName}</strong> (${l}). 
            Verify availability before assigning critical operations.
          `}});const r=window.innerWidth<=768;if(r){const m=document.getElementById("task-priority");document.querySelectorAll(".mobile-priority-opt").forEach(l=>{l.addEventListener("click",()=>{document.querySelectorAll(".mobile-priority-opt").forEach(x=>{x.classList.remove("active"),x.style.background="var(--sidebar-bg)",x.style.color="var(--text-secondary)"}),l.classList.add("active"),l.style.background="#E0E7FF",l.style.color="#4338CA",m&&(m.value=l.dataset.val)})});const b=document.getElementById("task-due");document.querySelectorAll(".mobile-due-opt").forEach(l=>{l.addEventListener("click",()=>{if(document.querySelectorAll(".mobile-due-opt").forEach(x=>{x.classList.remove("active"),x.style.background="var(--sidebar-bg)",x.style.color="var(--text-secondary)"}),l.classList.add("active"),l.style.background="#E0E7FF",l.style.color="#4338CA",b){const x=parseInt(l.dataset.offset,10),k=new Date;k.setDate(k.getDate()+x),b.value=k.toISOString().split("T")[0]}})}),b&&b.addEventListener("change",()=>{document.querySelectorAll(".mobile-due-opt").forEach(l=>{l.classList.remove("active"),l.style.background="var(--sidebar-bg)",l.style.color="var(--text-secondary)"})});const y=document.getElementById("task-assignee");document.querySelectorAll(".mobile-assignee-opt").forEach(l=>{l.addEventListener("click",()=>{document.querySelectorAll(".mobile-assignee-opt > div").forEach(x=>{x.style.border="2px solid transparent"}),l.firstElementChild.style.border="2px solid #3B82F6",y&&(y.value=l.dataset.id)})})}const g=()=>{const m=r?document.getElementById("mobile-subtasks-list"):document.getElementById("desktop-subtasks-list");m&&(m.innerHTML=this.subtasks.map((b,y)=>`
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: var(--radius-md);">
          <span style="font-size: 13px; color: var(--text-primary);">${E(b)}</span>
          <button type="button" data-index="${y}" class="remove-subtask-btn" style="background: none; border: none; color: var(--status-danger); cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">&times;</button>
        </div>
      `).join(""),m.querySelectorAll(".remove-subtask-btn").forEach(b=>{b.addEventListener("click",y=>{const l=Number(y.currentTarget.dataset.index);this.subtasks.splice(l,1),g()})}))},o=r?document.getElementById("mobile-add-subtask-btn"):document.getElementById("desktop-add-subtask-btn"),p=r?document.getElementById("mobile-new-subtask"):document.getElementById("desktop-new-subtask");o&&p&&(o.addEventListener("click",()=>{const m=p.value.trim();m&&(this.subtasks.push(m),p.value="",g())}),p.addEventListener("keypress",m=>{m.key==="Enter"&&(m.preventDefault(),o.click())})),g(),u==null||u.addEventListener("click",()=>{if(r){const m=document.getElementById("task-assignee");if(!m||!m.value){const b=document.getElementById("drawer-error-alert");b&&(b.innerText="Please assign someone by tapping an avatar.",b.style.display="block");return}}s==null||s.dispatchEvent(new Event("submit",{cancelable:!0}))}),s==null||s.addEventListener("submit",async m=>{m.preventDefault();const b=document.getElementById("task-title").value.trim(),y=document.getElementById("task-desc").value.trim(),l=document.getElementById("task-due").value,x=document.getElementById("task-priority").value,k=document.getElementById("task-dept").value,h=document.getElementById("task-assignee").value,w=n?n.checked:!1,f=w&&document.getElementById("task-interval")?document.getElementById("task-interval").value:null,S=window.innerWidth<=768?document.getElementById("mobile-new-subtask"):document.getElementById("desktop-new-subtask");S&&S.value.trim()&&(this.subtasks.push(S.value.trim()),S.value="");const M=document.getElementById("drawer-error-alert");if(M&&(M.style.display="none",M.innerText=""),!b||!y||!l||!h){a("Please populate all mandatory fields.");return}if(b.length>100){a("Task title cannot exceed 100 characters.");return}if(y.length>2e3){a("Description cannot exceed 2000 characters.");return}const P=new Date(l),H=new Date;if(H.setHours(0,0,0,0),P<H){a("Due date cannot be set in the past.");return}const j=new Date;if(j.setFullYear(H.getFullYear()+10),P>j){a("Due date cannot be set further than 10 years in the future.");return}try{u&&(u.disabled=!0,u.innerText="Creating..."),await L("POST","/tasks",{title:b,description:y,dueDate:l,priority:x,departmentId:k?Number(k):null,assigneeIds:[Number(h)],isRecurring:w,recurrenceInterval:f,subtasks:this.subtasks}),T.success("Task Created","Task assigned successfully."),this.close(),this.onSuccess&&this.onSuccess()}catch(B){console.error(B),a(B.message||"Task creation failed."),T.error("Task Creation Failed",B.message||"Check parameters."),u&&(u.disabled=!1,u.innerText="Create Task")}});function a(m){const b=document.getElementById("drawer-error-alert");b&&(b.innerText=m,b.style.display="block",b.scrollIntoView({behavior:"smooth",block:"start"}))}}open(){this.render().then(()=>{this.overlayEl.style.pointerEvents="auto",this.overlayEl.style.opacity="1",this.drawerEl.classList.add("open")})}close(){this.overlayEl&&(this.overlayEl.style.opacity="0",this.overlayEl.style.pointerEvents="none"),this.drawerEl&&this.drawerEl.classList.remove("open")}}let Pe=[],me=null,Se=null,je=[],V=localStorage.getItem("tascorr_task_tab")||"assigned",ge=localStorage.getItem("tascorr_show_completed")==="true";function Ze(){return`
    <div id="tasks-page-wrapper" style="display: flex; flex-direction: column; gap: 24px; height: calc(100vh - var(--header-height) - 64px); overflow: hidden;">
      <!-- Title & Toolbar -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
        <div>
          <h1 class="page-title" style="font-size: 28px;">Tasks</h1>
        </div>
        <div style="display: flex; gap: 12px;">
          <button id="workspace-toggle-filters-btn" class="menu-item" style="padding: 10px 18px; border-radius: var(--radius-md); border: 1px solid var(--border-neutral); background: var(--bg-primary); font-weight: 600; display: flex; align-items: center; gap: 8px; color: var(--text-primary); cursor: pointer;">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 16px; height: 16px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
            Filters
          </button>
          <button id="workspace-create-task-btn" class="btn btn-primary" style="padding: 10px 18px; border-radius: var(--radius-md); border: none; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 16px; height: 16px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Task
          </button>
        </div>
      </div>

      <!-- High-Density Split Workspace Engine -->
      <div id="tasks-workspace-container" style="display: flex; gap: 24px; flex: 1; overflow: hidden; min-height: 0;">
        <!-- Left Side: Task List Master Pane -->
        <div id="tasks-master-pane" style="flex: 1; background-color: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: var(--radius-lg); display: flex; flex-direction: column; overflow: hidden;">
          <!-- Segmented Control Tabs & Show Completed Toggle -->
          <div style="padding: 16px 16px 0 16px; flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
            <div style="display: flex; background-color: var(--bg-secondary); border-radius: var(--radius-lg); padding: 4px; border: 1px solid var(--border-neutral); flex: 1; min-width: 200px;">
              <button id="tab-assigned" class="task-tab-btn ${V==="assigned"?"active":""}" style="flex: 1; padding: 10px; border: none; border-radius: var(--radius-md); font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s; background: ${V==="assigned"?"var(--bg-primary)":"transparent"}; color: ${V==="assigned"?"var(--text-primary)":"var(--text-secondary)"}; box-shadow: ${V==="assigned"?"0 2px 4px rgba(0,0,0,0.05)":"none"};">My Tasks</button>
              <button id="tab-delegated" class="task-tab-btn ${V==="delegated"?"active":""}" style="flex: 1; padding: 10px; border: none; border-radius: var(--radius-md); font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s; background: ${V==="delegated"?"var(--bg-primary)":"transparent"}; color: ${V==="delegated"?"var(--text-primary)":"var(--text-secondary)"}; box-shadow: ${V==="delegated"?"0 2px 4px rgba(0,0,0,0.05)":"none"};">Delegated</button>
            </div>
            <label style="display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: var(--radius-md); border: 1px solid var(--border-neutral); background: var(--bg-secondary); cursor: pointer; font-size: 13px; font-weight: 600; color: var(--text-primary); user-select: none; transition: all 0.2s; margin-bottom: 0;">
              <input type="checkbox" id="task-show-completed" ${ge?"checked":""} style="width: 16px; height: 16px; accent-color: var(--accent-navy-primary); cursor: pointer;" />
              <span>Show Completed</span>
            </label>
          </div>

          <!-- Search & Filter Controls -->
          <div id="tasks-filter-bar" style="padding: 16px; border-bottom: 1px solid var(--border-neutral); display: none; gap: 12px; flex-shrink: 0; flex-wrap: wrap; background-color: var(--bg-primary);">
            <input type="text" id="task-search-input" placeholder="Search tasks, descriptions..." style="flex: 1; min-width: 150px; padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary);" />
            <select id="task-status-filter" style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary);">
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Blocked">Blocked</option>
              <option value="Under Review">Under Review</option>
              <option value="Completed">Completed</option>
            </select>
            <select id="task-priority-filter" style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary);">
              <option value="ALL">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <!-- Task List Items -->
          <div id="task-items-container" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; padding: 16px;">
            <div style="padding: 24px; text-align: center; color: var(--text-secondary);">Loading tasks...</div>
          </div>
        </div>

        <!-- Right Side: Task Detail Action Pane -->
        <div id="task-details-container" style="width: 480px; background-color: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: var(--radius-lg); display: flex; flex-direction: column; overflow: hidden; flex-shrink: 0;">
          <div style="padding: 32px; text-align: center; color: var(--text-secondary); margin: auto;">
            Select a task item to view full operational details.
          </div>
        </div>
      </div>
    </div>
  `}async function Je(){if(!document.getElementById("task-items-container"))return;try{je=(await L("GET","/users")).users||[]}catch(o){console.error(o)}Se=new Ne(()=>{Q()});const s=document.getElementById("workspace-create-task-btn"),i=document.getElementById("workspace-toggle-filters-btn"),d=document.getElementById("tasks-filter-bar"),u=document.getElementById("tab-assigned"),e=document.getElementById("tab-delegated"),c=document.getElementById("task-show-completed"),n=o=>{V=o,localStorage.setItem("tascorr_task_tab",o),[u,e].forEach(a=>{a&&(a.style.background="transparent",a.style.color="var(--text-secondary)",a.style.boxShadow="none",a.classList.remove("active"))});const p=o==="assigned"?u:e;p&&(p.style.background="var(--bg-primary)",p.style.color="var(--text-primary)",p.style.boxShadow="0 2px 4px rgba(0,0,0,0.05)",p.classList.add("active")),se()};u==null||u.addEventListener("click",()=>n("assigned")),e==null||e.addEventListener("click",()=>n("delegated")),c==null||c.addEventListener("change",o=>{ge=o.target.checked,localStorage.setItem("tascorr_show_completed",ge),se()}),s==null||s.addEventListener("click",()=>{Se.open()}),i==null||i.addEventListener("click",()=>{d&&(d.style.display==="none"?(d.style.display="flex",i.classList.add("active"),i.style.color="var(--accent-navy-primary)"):(d.style.display="none",i.classList.remove("active"),i.style.color="var(--text-primary)"))});const v=document.getElementById("task-search-input"),r=document.getElementById("task-status-filter"),g=document.getElementById("task-priority-filter");[v,r,g].forEach(o=>{o==null||o.addEventListener("input",()=>{se()})}),await Q()}async function Q(){const t=document.getElementById("task-items-container");if(t)try{Pe=(await L("GET","/tasks")).tasks||[],se()}catch(s){console.error(s),t.innerHTML=`<div style="padding: 24px; text-align: center; color: var(--status-danger);">Error fetching tasks: ${s.message}</div>`}}function se(){var c,n,v;const t=document.getElementById("task-items-container");if(!t)return;const s=((c=document.getElementById("task-search-input"))==null?void 0:c.value.toLowerCase())||"",i=((n=document.getElementById("task-status-filter"))==null?void 0:n.value)||"ALL",d=((v=document.getElementById("task-priority-filter"))==null?void 0:v.value)||"ALL",u=$.currentUser,e=Pe.filter(r=>{var b;let g=!0;if(u){const y=(b=r.assignments)==null?void 0:b.some(x=>x.userId===u.id),l=r.createdById===u.id&&!y;V==="assigned"?g=y:V==="delegated"&&(g=l)}const o=r.title.toLowerCase().includes(s)||r.description.toLowerCase().includes(s),p=i==="ALL"||r.status===i,a=d==="ALL"||r.priority===d;let m=!0;if(r.status==="Completed"&&i!=="Completed")if(ge)m=!0;else{const y=r.updatedAt?new Date(r.updatedAt):new Date(r.createdAt);m=(Date.now()-y.getTime())/(1e3*60*60)<=24}return g&&o&&p&&a&&m});if(e.sort((r,g)=>{const o=r.status==="Completed",p=g.status==="Completed";return o&&!p?1:!o&&p?-1:new Date(g.createdAt)-new Date(r.createdAt)}),e.length===0){t.innerHTML=`
      <div style="padding: 48px 24px; text-align: center; color: var(--text-secondary); display: flex; flex-direction: column; gap: 8px;">
        <p class="body-text" style="font-weight: 600;">No tasks found.</p>
        <p class="small-text">Clear filters or create a new task workspace.</p>
      </div>
    `;return}t.innerHTML=e.map(r=>{var S,M,P,H,j;const g=me&&me.id===r.id,o=g?"border: 2px solid var(--accent-navy-primary);":"border: 1px solid var(--border-neutral);",a={High:"#DC2626",Critical:"#DC2626",Medium:"#D97706",Low:"#10B981"}[r.priority]||"#3B82F6",b={Pending:"#3B82F6","In Progress":"#10B981",Blocked:"#EF4444","Under Review":"#F59E0B",Completed:"#16A34A"}[r.status]||"#3B82F6";let y=((S=r.assignments)==null?void 0:S.length)>0?`${r.assignments[0].user.firstName} ${r.assignments[0].user.lastName}`:"Unassigned",l=((M=r.assignments)==null?void 0:M.length)>0?r.assignments[0].userId:null,x=y!=="Unassigned"?r.assignments[0].user.firstName[0]:"?",k="";l===((P=$.currentUser)==null?void 0:P.id)&&(r.creator?(y=`${r.creator.firstName} ${r.creator.lastName}`,l=r.creator.id,x=r.creator.firstName[0],k="From: "):(y="System",l=null,x="S",k="From: "));const h=((H=r.subtasks)==null?void 0:H.length)||0,w=((j=r.subtasks)==null?void 0:j.filter(B=>B.status==="Completed").length)||0,f=h>0?Math.round(w/h*100):r.status==="Completed"?100:0,I=r.status==="Completed"?"opacity: 0.6;":"";return`
      <div class="task-list-item" data-id="${r.id}" style="background: var(--bg-primary); ${o} border-radius: 20px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); margin-bottom: 16px; cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease; ${g?"transform: translateY(-2px); box-shadow: 0 4px 12px rgba(37,99,235,0.15);":""} ${I}">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div style="display: flex; gap: 8px; align-items: center;">
            <span style="color: ${a}; background: ${a}15; padding: 4px 8px; border-radius: 8px; font-size: 10px; font-weight: 700;">${r.priority}</span>
            <span style="color: var(--text-secondary); font-size: 12px; font-weight: 500;">General</span>
          </div>
          <div style="background: var(--bg-secondary); padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; color: var(--text-secondary); display: flex; align-items: center; gap: 4px;">
            <span style="display: block; width: 6px; height: 6px; border-radius: 50%; background: ${b};"></span> ${r.status}
          </div>
        </div>
        <h4 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">${E(r.title)}</h4>
        <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 16px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${E(r.description)}</p>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${h>0?"8px":"0"};">
          ${h>0?`
          <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-secondary);">
            <input type="radio" checked style="accent-color: var(--text-primary); pointer-events: none;" /> ${w}/${h} subtasks
          </div>
          <span style="font-size: 11px; color: var(--text-secondary);">${f}%</span>
          `:"<div></div>"}
        </div>
        ${h>0?`
        <div style="width: 100%; height: 4px; background: var(--bg-secondary); border-radius: 2px; margin-bottom: 16px; overflow: hidden;">
          <div style="height: 100%; width: ${f}%; background: var(--text-primary); border-radius: 2px;"></div>
        </div>
        `:""}

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border-neutral); padding-top: 12px; margin-top: ${h>0?"0":"16px"};">
          <div style="display: flex; align-items: center; gap: 8px;">
            ${l?`<img src="/avatars/user-${l}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;" />`:""}
            <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--sidebar-bg); color: var(--text-primary); display: ${l?"none":"flex"}; align-items: center; justify-content: center; font-size: 10px; font-weight: 700;">${x}</div>
            <span style="font-size: 11px; color: var(--text-secondary); font-weight: 500;">${k}${E(y)}</span>
          </div>
          <span class="small-text" style="color: var(--text-secondary); font-size: 10px;">
            ${new Date(r.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    `}).join(""),t.querySelectorAll(".task-list-item").forEach(r=>{r.addEventListener("click",async()=>{const g=Number(r.dataset.id);await _(g);const o=document.getElementById("tasks-workspace-container");o&&o.classList.add("task-selected"),se()})})}async function _(t){var i,d,u,e,c,n,v,r,g,o;const s=document.getElementById("task-details-container");if(s){s.innerHTML='<div style="margin: auto; color: var(--text-secondary);">Loading task details...</div>';try{me=(await L("GET",`/tasks/${t}`)).task;const a=me,b={Pending:"status-info","In Progress":"status-info",Blocked:"status-danger","Under Review":"status-warning",Completed:"status-success"}[a.status]||"status-info",y=(i=a.assignments)==null?void 0:i.find(z=>z.isActive),l=y?`${y.user.firstName} ${y.user.lastName}`:"Unassigned",x=y?y.userId:null,k=y?y.user.firstName[0]:"?",h=$.isAdmin(),w=a.createdById===((d=$.currentUser)==null?void 0:d.id),f=y&&y.userId===((u=$.currentUser)==null?void 0:u.id),I=h||w,S=((e=a.subtasks)==null?void 0:e.length)>0?a.subtasks.map(z=>{const R=z.status==="Completed"?"checked":"";return`
            <label style="display: flex; align-items: center; gap: 10px; font-size: 13px; cursor: pointer; ${z.status==="Completed"?"text-decoration: line-through; color: var(--text-secondary);":""}">
              <input type="checkbox" class="subtask-chk" data-sid="${z.id}" ${R} style="accent-color: var(--accent-navy-primary);" />
              <span>${E(z.title)}</span>
            </label>
          `}).join(""):'<p class="small-text" style="color: var(--text-secondary);">No subtask checklist items defined.</p>',M=(c=a.blockers)==null?void 0:c.find(z=>!z.resolvedAt),P=a.status==="Completed",H=((n=$.currentUser)==null?void 0:n.rankLevel)<=4&&((v=$.currentUser)==null?void 0:v.rankLevel)>0,j=w||h||H;let B="";P||((f||j)&&(B+=`
          <div style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
            <label class="small-text" style="font-weight:600;">Update Task Status</label>
            <select id="task-status-update" style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-primary);">
              <option value="Pending" ${a.status==="Pending"?"selected":""}>Pending</option>
              <option value="In Progress" ${a.status==="In Progress"?"selected":""}>In Progress</option>
              <option value="Under Review" ${a.status==="Under Review"?"selected":""}>${j?"Under Review":"Request Completion (Under Review)"}</option>
              ${j?`<option value="Completed" ${a.status==="Completed"?"selected":""}>Completed (Close Task)</option>`:""}
            </select>
          </div>
        `),f&&!M&&(B+=`
          <button id="flag-blocker-btn" style="padding: 10px; background-color: transparent; border: 1px solid var(--status-danger); color: var(--status-danger); border-radius: var(--radius-md); font-weight: 600; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 6px;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:var(--status-danger);"></span> Flag Blocker
          </button>
        `),(w||h)&&(B+=`
          <button id="reassign-task-btn" style="padding: 10px; background-color: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-weight: 600; cursor: pointer; font-size: 13px;">
            Reassign Task
          </button>
          <button id="edit-task-btn" style="padding: 10px; background-color: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-weight: 600; cursor: pointer; font-size: 13px;">
            Edit Task
          </button>
        `),w&&(B+=`
          <button id="delete-task-btn" style="padding: 10px; background-color: transparent; border: 1px solid var(--status-danger); color: var(--status-danger); border-radius: var(--radius-md); font-weight: 600; cursor: pointer; font-size: 13px;">
            Delete Task
          </button>
        `)),s.innerHTML=`
      <!-- ================== DESKTOP ================== -->
      <div class="desktop-only" style="display:flex; flex-direction:column; height:100%; width: 100%;">
        <!-- Detail Header -->
      <div style="padding: 24px; border-bottom: 1px solid var(--border-neutral); display: flex; flex-direction: column; gap: 12px; flex-shrink: 0;">
        <button id="task-detail-back-btn" class="btn btn-secondary" style="display: none; align-items: center; gap: 6px; width: fit-content; margin-bottom: 8px; font-size: 12px; padding: 6px 12px; height: 32px; min-height: 32px;">
          &larr; Back to Tasks
        </button>
        <div style="display: flex; justify-content: flex-end; align-items: center;">
          <span class="pill-badge ${b}"><span class="badge-dot"></span>${E(a.status)}</span>
        </div>
        <h2 class="section-title" style="font-size: 20px; line-height: 1.3;">${E(a.title)}</h2>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px;">
          <div class="pill-badge status-info" style="font-size: 11px; display: flex; align-items: center; gap: 6px; padding-left: 6px;">
            ${x?`
              <img src="/avatars/user-${x}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width:16px;height:16px;border-radius:50%;object-fit:cover;" />
              <div style="width:16px;height:16px;border-radius:50%;background:var(--accent-navy-primary);color:#fff;display:none;align-items:center;justify-content:center;font-size:8px;font-weight:bold;margin-left:-2px;">${E(k)}</div>
            `:""}
            Assigned to: ${E(l)}
          </div>
          <div class="pill-badge" style="font-size: 11px; display: flex; align-items: center; gap: 6px; padding-left: 6px; background-color: var(--bg-secondary); border: 1px solid var(--border-neutral); color: var(--text-secondary);">
            Assigned by: ${a.creator?E(a.creator.firstName+" "+a.creator.lastName):"System"}
          </div>
          <div class="pill-badge status-danger" style="font-size: 11px;">${E(a.priority)} Priority</div>
          <div class="pill-badge status-warning" style="font-size: 11px;">Due: ${new Date(a.dueDate).toLocaleDateString()}</div>
        </div>
      </div>

      <!-- Detail Contents -->
      <div style="flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 24px;">
        <!-- Blocker warning banner -->
        ${M?`
          <div style="padding: 16px; background-color: rgba(220, 38, 38, 0.08); border-left: 4px solid var(--status-danger); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 8px;">
            <strong class="data-number" style="color: var(--status-danger);">Task is Blocked</strong>
            <p class="small-text" style="color: var(--text-primary); margin:0;">${E(M.description)}</p>
            ${I?`
              <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">
                <input type="text" id="blocker-resolution-text" placeholder="Mandatory resolution comment..." style="width: 100%; padding: 8px 10px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-size: 12px;" />
                <button id="resolve-blocker-btn" data-bid="${M.id}" style="padding: 6px 12px; background-color: var(--status-success); color:#fff; border:none; border-radius:var(--radius-md); font-weight:600; font-size:12px; cursor:pointer;">Resolve Blocker</button>
              </div>
            `:""}
          </div>
        `:""}

        <!-- Description -->
        <div>
          <h4 class="small-text" style="font-weight: 600; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.05em; color: var(--text-secondary);">Description</h4>
          <p class="body-text" style="color: var(--text-primary);">${E(a.description)}</p>
        </div>

        <!-- Subtasks Block -->
        <div>
          <h4 class="small-text" style="font-weight: 600; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.05em; color: var(--text-secondary);">Subtasks Checklist</h4>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${S}
          </div>
        </div>

        <!-- Blocker Reporting form (hidden by default) -->
        <div id="blocker-report-form" style="display: none; padding: 16px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); background-color: var(--bg-secondary); flex-direction: column; gap: 8px;">
          <h4 class="small-text" style="font-weight: 600;">Flag Operational Blocker</h4>
          <textarea id="blocker-desc" placeholder="Explain the dependency blocker clearly..." rows="3" style="width:100%; padding: 8px 10px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-size: 13px;"></textarea>
          <div style="display: flex; gap: 8px;">
            <button id="submit-blocker-btn" style="padding: 6px 12px; background-color: var(--status-danger); color:#fff; border:none; border-radius: var(--radius-md); font-weight:600; cursor:pointer;">Submit Report</button>
            <button id="cancel-blocker-btn" style="padding: 6px 12px; background-color: transparent; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); cursor:pointer;">Cancel</button>
          </div>
        </div>

        <!-- Reassignment form (hidden by default) -->
        <div id="reassignment-form" style="display: none; padding: 16px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); background-color: var(--bg-secondary); flex-direction: column; gap: 8px;">
          <h4 class="small-text" style="font-weight: 600;">Reassign Workforce Scope</h4>
          
          <select id="reassign-user" style="width:100%; padding: 8px 10px; border:1px solid var(--border-neutral); border-radius: var(--radius-md);">
            <option value="" disabled selected>Select new assignee...</option>
            ${je.map(z=>`<option value="${z.id}">${z.firstName} ${z.lastName}</option>`).join("")}
          </select>
          <input type="text" id="reassign-reason" placeholder="Mandatory reason..." style="width:100%; padding: 8px 10px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-size: 13px;" />
          <div style="display: flex; gap: 8px;">
            <button id="submit-reassign-btn" style="padding: 6px 12px; background-color: var(--accent-navy-primary); color:#fff; border:none; border-radius: var(--radius-md); font-weight:600; cursor:pointer;">Assign User</button>
            <button id="cancel-reassign-btn" style="padding: 6px 12px; background-color: transparent; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); cursor:pointer;">Cancel</button>
          </div>
        </div>

        <!-- Comments & Activity Threads -->
        <div style="border-top: 1px solid var(--border-neutral); padding-top: 16px;">
          <h4 class="small-text" style="font-weight: 600; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.05em; color: var(--text-secondary);">Operational Activity & Comments</h4>
          
          <!-- Comments List -->
          <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; max-height: 200px; overflow-y: auto;">
            ${((r=a.comments)==null?void 0:r.length)>0?a.comments.map(z=>`
                  <div style="background-color: var(--bg-secondary); padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border-neutral);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                      <span class="small-text" style="font-weight: 600; color: var(--text-primary);">${z.author?E(z.author.firstName+" "+z.author.lastName):"Unknown User"}</span>
                      <span class="small-text" style="font-size:10px;">${new Date(z.createdAt).toLocaleString()}</span>
                    </div>
                    <p class="body-text" style="font-size: 12px; color: var(--text-primary); margin:0;">${E(z.content)}</p>
                  </div>
                `).join(""):'<p class="small-text" style="color: var(--text-secondary); text-align: center; padding: 12px 0;">No logs or comments posted.</p>'}
          </div>

          <!-- Add comment input -->
          <div style="display: flex; gap: 8px;">
            <input type="text" id="new-comment-text" placeholder="Add detailed comment note..." style="flex:1; padding: 8px 12px; border:1px solid var(--border-neutral); border-radius: var(--radius-md); font-size:12px; outline:none;" />
            <button id="submit-comment-btn" style="padding: 8px 16px; background-color: var(--accent-navy-primary); color:#fff; border:none; border-radius: var(--radius-md); font-weight:600; font-size:12px; cursor:pointer;">Send</button>
          </div>
        </div>
      </div>

      <!-- Action Buttons Footer -->
      <div style="padding: 16px 24px; border-top: 1px solid var(--border-neutral); background-color: var(--bg-secondary); display: flex; gap: 12px; flex-shrink: 0; flex-wrap: wrap;">
        ${B}
      </div>
      </div>

      <!-- ================== MOBILE BOTTOM SHEET ================== -->
      <div class="mobile-only" style="display:flex; flex-direction:column; height:100%; width: 100%; background: inherit; position: relative; border-radius: 32px 32px 0 0; overflow: hidden;">
        
        <!-- Fixed Header Area -->
        <div style="padding: 24px 24px 16px 24px; flex-shrink: 0; border-bottom: 1px solid var(--border-neutral);">
          <!-- Drag Handle -->
          <div style="width: 48px; height: 5px; background: #E5E7EB; border-radius: 3px; margin: 0 auto 20px auto;"></div>
          
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div style="display: flex; gap: 8px;">
              <span style="padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: rgba(59,130,246,0.1); color: #3B82F6;">${((g=a.department)==null?void 0:g.name)||"General"}</span>
              <span class="${b}" style="padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">${a.status}</span>
            </div>
            <button id="mobile-task-detail-close" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary);">&times;</button>
          </div>
        </div>

        <!-- Scrollable Content Area -->
        <div style="flex: 1; overflow-y: auto; padding: 24px; padding-bottom: 100px;">
          <h2 style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; line-height: 1.2;">${E(a.title)}</h2>
          <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 24px;">${E(a.description)}</p>

          <!-- Cards Row -->
          <div style="display: flex; gap: 12px; margin-bottom: 24px;">
            <div style="flex: 1; background: var(--bg-secondary); border-radius: 16px; padding: 12px; display: flex; flex-direction: column; gap: 4px; border: 1px solid var(--border-neutral);">
              <span style="font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Due Date</span>
              <span style="font-size: 13px; font-weight: 600; color: var(--text-primary);">${new Date(a.dueDate).toLocaleDateString()}</span>
            </div>
            <div style="flex: 1; background: var(--bg-secondary); border-radius: 16px; padding: 12px; display: flex; flex-direction: column; gap: 4px; border: 1px solid var(--border-neutral);">
              <span style="font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Priority</span>
              <span style="font-size: 13px; font-weight: 600; color: var(--text-primary);">${a.priority}</span>
            </div>
          </div>

          <!-- Assigned To -->
          <div style="background: var(--bg-secondary); border-radius: 16px; padding: 12px; display: flex; align-items: center; gap: 12px; margin-bottom: 24px; border: 1px solid var(--border-neutral);">
            ${x?`<img src="/avatars/user-${x}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />`:""}
            <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--sidebar-bg); color: var(--text-primary); display: ${x?"none":"flex"}; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">${k}</div>
            <div style="display: flex; flex-direction: column;">
              <span style="font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Assigned To</span>
              <span style="font-size: 14px; font-weight: 600; color: var(--text-primary);">${E(l)}</span>
            </div>
          </div>

          <!-- Subtasks -->
          <div>
            <h3 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 16px;">Subtasks</h3>
            <div style="display: flex; flex-direction: column; gap: 16px;">
              ${((o=a.subtasks)==null?void 0:o.length)>0?a.subtasks.map(z=>{const R=z.status==="Completed";return`
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div class="mobile-subtask-toggle" data-sid="${z.id}" data-done="${R}" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid ${R?"#3B82F6":"#D1D5DB"}; background: ${R?"#3B82F6":"transparent"}; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;">
                      ${R?'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>':""}
                    </div>
                    <span style="font-size: 14px; color: ${R?"#9CA3AF":"var(--text-primary)"}; text-decoration: ${R?"line-through":"none"};">${E(z.title)}</span>
                  </div>
                `}).join(""):'<div style="font-size: 14px; color: var(--text-secondary);">No subtasks defined.</div>'}
            </div>
          </div>
        </div>

        <!-- Fixed Bottom Button -->
        ${!P||w?`
          <div style="position: absolute; bottom: 0; left: 0; width: 100%; padding: 16px 24px; background: var(--bg-primary); border-top: 1px solid var(--border-neutral); border-radius: 0 0 32px 32px; display: flex; gap: 12px; box-shadow: 0 -4px 12px rgba(0,0,0,0.05); z-index: 10;">
            ${P?"":`
              <button id="mobile-mark-complete-btn" style="flex: 1; background: #3B82F6; color: white; padding: 14px 20px; border: none; border-radius: 100px; font-size: 15px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(59,130,246,0.3);">
                Mark as Complete
              </button>
            `}
            ${w?`
              <button id="mobile-delete-task-btn" style="flex: 1; background: transparent; border: 2px solid var(--status-danger); color: var(--status-danger); padding: 14px 20px; border-radius: 100px; font-size: 15px; font-weight: 700; cursor: pointer;">
                Delete Task
              </button>
            `:""}
          </div>
        `:""}
      </div>
    `;const q=`
      <div id="edit-task-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); backdrop-filter:blur(4px); z-index:9999; align-items:center; justify-content:center;">
        <div class="widget-card" style="width:100%; max-width:500px; padding:24px; display:flex; flex-direction:column; gap:16px;">
          <h3 class="card-title">Edit Task</h3>
          <div class="form-group">
            <label class="small-text">Task Title</label>
            <input type="text" id="edit-task-title" value="${E(a.title)}" class="tascorr-input" />
          </div>
          <div class="form-group">
            <label class="small-text">Description</label>
            <textarea id="edit-task-desc" class="tascorr-input" rows="4">${E(a.description)}</textarea>
          </div>
          <div class="form-group" style="display:flex; gap:12px;">
            <div style="flex:1;">
              <label class="small-text">Due Date</label>
              <input type="date" id="edit-task-due" value="${new Date(a.dueDate).toISOString().split("T")[0]}" class="tascorr-input" />
            </div>
            <div style="flex:1;">
              <label class="small-text">Priority</label>
              <select id="edit-task-priority" class="tascorr-input">
                <option value="Low" ${a.priority==="Low"?"selected":""}>Low</option>
                <option value="Medium" ${a.priority==="Medium"?"selected":""}>Medium</option>
                <option value="High" ${a.priority==="High"?"selected":""}>High</option>
                <option value="Critical" ${a.priority==="Critical"?"selected":""}>Critical</option>
              </select>
            </div>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px;">
            <button id="cancel-edit-task" class="btn btn-secondary">Cancel</button>
            <button id="save-edit-task" class="btn btn-primary">Save Changes</button>
          </div>
        </div>
      </div>
    `;s.innerHTML+=q,setTimeout(()=>{const z=s.querySelector(".mobile-only");z&&(z.style.transform="translateY(100%)",z.offsetWidth,z.style.transition="transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",z.style.transform="translateY(0)")},10),Ke(a)}catch(p){console.error(p),s.innerHTML=`<div style="margin: auto; color: var(--status-danger);">Failed to fetch task details: ${p.message}</div>`}}}function Ke(t){var l,x,k,h,w;(l=document.getElementById("mobile-task-detail-close"))==null||l.addEventListener("click",()=>{const f=document.getElementById("tasks-workspace-container");f&&f.classList.remove("task-selected")}),(x=document.getElementById("task-detail-back-btn"))==null||x.addEventListener("click",()=>{const f=document.getElementById("tasks-workspace-container");f&&f.classList.remove("task-selected")}),(k=document.getElementById("mobile-mark-complete-btn"))==null||k.addEventListener("click",async()=>{try{if(await L("PATCH",`/tasks/${t.id}/status`,{status:"Completed"}),t.subtasks&&t.subtasks.length>0)for(const f of t.subtasks)f.status!=="Completed"&&await L("PATCH",`/tasks/${t.id}/subtasks/${f.id}`,{status:"Completed"});_(t.id),se()}catch(f){alert(f.message)}});const s=async()=>{var f;if(confirm("Are you sure you want to permanently delete this task? All dependencies, assignments, comments, and subtasks will be lost."))try{await L("DELETE",`/tasks/${t.id}`),T.success("Task Deleted","Task was deleted successfully.");const I=document.getElementById("task-details-container");I&&(I.innerHTML=`
          <div style="padding: 32px; text-align: center; color: var(--text-secondary); margin: auto;">
            Select a task item to view full operational details.
          </div>
        `),(f=document.getElementById("tasks-workspace-container"))==null||f.classList.remove("task-selected"),await Q()}catch(I){T.error("Deletion Failed",I.message)}};(h=document.getElementById("delete-task-btn"))==null||h.addEventListener("click",s),(w=document.getElementById("mobile-delete-task-btn"))==null||w.addEventListener("click",s);const i=document.getElementById("task-status-update");i==null||i.addEventListener("change",async()=>{const f=i.value;try{await L("PATCH",`/tasks/${t.id}/status`,{status:f}),T.success("Status Updated",`Task set to ${f}.`),await _(t.id),Q()}catch(I){T.error("Update Failed",I.message),i.value=t.status}}),document.querySelectorAll(".subtask-chk").forEach(f=>{f.addEventListener("change",async()=>{const I=Number(f.dataset.sid),S=f.checked,M=S?"Completed":"Pending";try{await L("PATCH",`/tasks/${t.id}/subtasks/${I}`,{status:M}),T.success("Subtask Updated",`Subtask marked as ${M}.`),await _(t.id)}catch(P){T.error("Update Failed",P.message),f.checked=!S}})}),document.querySelectorAll(".mobile-subtask-toggle").forEach(f=>{f.addEventListener("click",async()=>{const I=Number(f.dataset.sid),M=f.dataset.done==="true"?"Pending":"Completed";try{await L("PATCH",`/tasks/${t.id}/subtasks/${I}`,{status:M}),T.success("Subtask Updated",`Subtask marked as ${M}.`),await _(t.id)}catch(P){T.error("Update Failed",P.message)}})});const d=document.getElementById("flag-blocker-btn"),u=document.getElementById("blocker-report-form"),e=document.getElementById("submit-blocker-btn"),c=document.getElementById("cancel-blocker-btn");d==null||d.addEventListener("click",()=>{u.style.display="flex"}),c==null||c.addEventListener("click",()=>{u.style.display="none"}),e==null||e.addEventListener("click",async()=>{const f=document.getElementById("blocker-desc").value.trim();if(!f){T.warning("Validation Check","Blocker explanation content is mandatory.");return}try{await L("POST",`/tasks/${t.id}/blockers`,{description:f}),T.success("Blocker Logged","Task flagged as blocked."),await _(t.id),Q()}catch(I){T.error("Submission Failed",I.message)}});const n=document.getElementById("resolve-blocker-btn");n==null||n.addEventListener("click",async()=>{var S,M;const f=Number(n.dataset.bid),I=(M=(S=document.getElementById("blocker-resolution-text"))==null?void 0:S.value)==null?void 0:M.trim();if(!I){T.warning("Validation","Resolution comment is mandatory.");return}try{await L("PATCH",`/tasks/${t.id}/blockers/${f}/resolve`,{resolutionComment:I}),T.success("Blocker Resolved","Task is back in progress."),await _(t.id),Q()}catch(P){T.error("Resolution Failed",P.message)}});const v=document.getElementById("edit-task-btn"),r=document.getElementById("edit-task-modal"),g=document.getElementById("cancel-edit-task"),o=document.getElementById("save-edit-task");v==null||v.addEventListener("click",()=>{r.style.display="flex"}),g==null||g.addEventListener("click",()=>{r.style.display="none"}),o==null||o.addEventListener("click",async()=>{const f=document.getElementById("edit-task-title").value.trim(),I=document.getElementById("edit-task-desc").value.trim(),S=document.getElementById("edit-task-due").value,M=document.getElementById("edit-task-priority").value;if(!f||!I||!S){T.warning("Validation Check","Title, description, and due date are mandatory.");return}try{await L("PATCH",`/tasks/${t.id}`,{title:f,description:I,dueDate:S,priority:M}),T.success("Task Updated","Task details have been successfully modified."),r.style.display="none",await _(t.id),Q()}catch(P){T.error("Update Failed",P.message)}});const p=document.getElementById("reassign-task-btn"),a=document.getElementById("reassignment-form"),m=document.getElementById("submit-reassign-btn"),b=document.getElementById("cancel-reassign-btn");p==null||p.addEventListener("click",()=>{a.style.display="flex"}),b==null||b.addEventListener("click",()=>{a.style.display="none"}),m==null||m.addEventListener("click",async()=>{const f=document.getElementById("reassign-user").value,I=document.getElementById("reassign-reason").value.trim();if(!f||!I){T.warning("Validation Check","New assignee selection and reason parameters are mandatory.");return}try{await L("POST",`/tasks/${t.id}/reassign`,{targetAssigneeId:Number(f),reason:I}),T.success("Task Delegated","Assignee reassignment completed successfully."),await _(t.id),Q()}catch(S){T.error("Reassignment Failed",S.message)}});const y=document.getElementById("submit-comment-btn");y==null||y.addEventListener("click",async()=>{const f=document.getElementById("new-comment-text").value.trim();if(f)try{await L("POST",`/tasks/${t.id}/comments`,{content:f}),T.success("Comment Posted","Your message has been appended."),await _(t.id)}catch(I){T.error("Send Failed",I.message)}})}let ee=[],ne=[];function Xe(){const t=$.isAdmin();return`
    <div style="display: flex; flex-direction: column; gap: 32px; max-width: 1200px; margin: 0 auto;">
      <!-- Title & CTA -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 class="page-title">Departments</h1>
          <p class="body-text">Visualize structural department hierarchies, heads, and staff mappings.</p>
        </div>
        ${t?`
          <button id="add-dept-btn" class="btn btn-primary" style="padding: 10px 18px; border-radius: var(--radius-md); border: none; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 16px; height: 16px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Department
          </button>
        `:""}
      </div>

      <!-- Create Department Form (Admin only, hidden by default) -->
      ${t?`
        <div id="create-dept-card" class="widget-card" style="display: none; flex-direction: column; gap: 16px; max-width: 500px;">
          <h3 class="card-title">Create Department Node</h3>
          <div id="dept-error-alert" style="display: none; padding: 12px; background-color: rgba(220, 38, 38, 0.1); color: var(--status-danger); font-size: 13px; font-weight: 500; border-radius: var(--radius-md);"></div>
          
          <form id="create-dept-form" style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label for="dept-name" class="small-text" style="font-weight:600; display: flex; align-items: center;">
                Department Name
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">The official name of the operational department.</span>
                </div>
              </label>
              <input type="text" id="dept-name" required placeholder="Operations & Logistics" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md);" />
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label for="dept-head" class="small-text" style="font-weight:600; display: flex; align-items: center;">
                Department Head
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">The employee designated as the leader of this department.</span>
                </div>
              </label>
              <select id="dept-head" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md); background:var(--bg-secondary);">
                <option value="">No Head Assigned</option>
                <!-- Populated dynamically -->
              </select>
            </div>

            <div style="display: flex; gap: 8px; margin-top: 8px;">
              <button type="submit" class="btn btn-primary" style="padding: 8px 16px; border:none; font-weight:600;">Save Department</button>
              <button id="cancel-dept-btn" type="button" style="padding: 8px 16px; border:1px solid var(--border-neutral); border-radius:var(--radius-md); background:none; cursor:pointer;">Cancel</button>
            </div>
          </form>
        </div>
      `:""}

      <!-- Interactive Tree Section -->
      <div class="widget-card" style="padding: 32px; overflow-x: auto;">
        <div style="min-width: 800px; display: flex; flex-direction: column; align-items: center; gap: 40px;" id="hierarchy-tree-root">
          <!-- Hierarchy Tree will render dynamically here -->
        </div>
      </div>
    </div>

    <!-- Edit Department Modal (Admin only overlay) -->
    ${t?`
      <div id="edit-dept-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
        <div class="widget-card" style="width: 100%; max-width: 500px; padding: 24px; display: flex; flex-direction: column; gap: 20px; box-shadow: var(--shadow-lg);">
          <div>
            <h3 class="card-title" style="font-size: 18px;">Edit Department Node</h3>
            <p class="small-text">Modify department name and accountability head assignment.</p>
          </div>
          <div id="edit-dept-error-alert" style="display: none; padding: 12px; background-color: rgba(220, 38, 38, 0.1); color: var(--status-danger); font-size: 13px; font-weight: 500; border-radius: var(--radius-md);"></div>
          <form id="edit-dept-form" style="display: flex; flex-direction: column; gap: 16px;">
            <input type="hidden" id="edit-dept-id" />
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="edit-dept-name" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Department Name
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">The official name of the operational department.</span>
                </div>
              </label>
              <input type="text" id="edit-dept-name" required maxlength="100" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md); background: var(--bg-secondary); color: var(--text-primary);" />
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="edit-dept-head" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Department Head
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">The employee designated as the leader of this department.</span>
                </div>
              </label>
              <select id="edit-dept-head" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md); background:var(--bg-secondary); color: var(--text-primary);">
                <option value="">No Head Assigned</option>
                <!-- Dynamically populated -->
              </select>
            </div>
            <div style="display: flex; gap: 12px; margin-top: 8px;">
              <button type="submit" class="btn btn-primary" style="flex:1; justify-content:center; padding: 10px; border:none; font-weight:600;">Save Changes</button>
              <button id="close-edit-dept-modal-btn" type="button" style="flex:1; padding: 10px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); background: var(--bg-primary); color: var(--text-primary); cursor: pointer;">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `:""}
  `}async function Qe(){const t=document.getElementById("hierarchy-tree-root");if(!t)return;if($.isAdmin()){const i=document.getElementById("add-dept-btn"),d=document.getElementById("create-dept-card"),u=document.getElementById("cancel-dept-btn"),e=document.getElementById("create-dept-form"),c=document.getElementById("edit-dept-modal"),n=document.getElementById("close-edit-dept-modal-btn"),v=document.getElementById("edit-dept-form");i==null||i.addEventListener("click",()=>{d.style.display=d.style.display==="none"?"flex":"none"}),u==null||u.addEventListener("click",()=>{d.style.display="none"}),t.addEventListener("click",async r=>{const g=r.target.closest(".edit-dept-btn"),o=r.target.closest(".delete-dept-btn");if(g){const p=Number(g.dataset.id),a=ee.find(m=>m.id===p);if(a){document.getElementById("edit-dept-id").value=a.id,document.getElementById("edit-dept-name").value=a.name;const m=document.getElementById("edit-dept-head");m&&(m.innerHTML='<option value="">No Head Assigned</option>'+ne.map(b=>{var y;return`<option value="${b.id}">${E(b.firstName)} ${E(b.lastName)} (${E(((y=b.rank)==null?void 0:y.title)||"Employee")})</option>`}).join(""),m.value=a.headUserId||""),c&&(c.style.display="flex")}}if(o){const p=Number(o.dataset.id),a=ee.find(m=>m.id===p);if(a&&confirm(`Are you sure you want to delete the "${a.name}" department? All members will be unassigned.`))try{await L("DELETE",`/departments/${p}`),T.success("Department Deleted","Department node removed."),await de()}catch(m){console.error(m),T.error("Deletion Failed",m.message||"Could not delete department.")}}}),n==null||n.addEventListener("click",()=>{c&&(c.style.display="none")}),v==null||v.addEventListener("submit",async r=>{r.preventDefault();const g=Number(document.getElementById("edit-dept-id").value),o=document.getElementById("edit-dept-name").value.trim(),p=document.getElementById("edit-dept-head").value,a=document.getElementById("edit-dept-error-alert");if(a&&(a.style.display="none",a.innerText=""),!o||o.length<2){a&&(a.innerText="Department name must be at least 2 characters.",a.style.display="block");return}const m=v.querySelector('button[type="submit"]');try{m&&(m.disabled=!0,m.innerText="Saving..."),await L("PATCH",`/departments/${g}`,{name:o,headUserId:p?Number(p):null}),T.success("Department Updated","Department details saved successfully."),c&&(c.style.display="none"),await de()}catch(b){console.error(b),a&&(a.innerText=b.message||"Failed to update department.",a.style.display="block")}finally{m&&(m.disabled=!1,m.innerText="Save Changes")}}),e==null||e.addEventListener("submit",async r=>{r.preventDefault();const g=document.getElementById("dept-name").value.trim(),o=document.getElementById("dept-head").value,p=document.getElementById("dept-error-alert");if(p&&(p.style.display="none",p.innerText=""),!g||g.length<2){p&&(p.innerText="Department name must be at least 2 characters.",p.style.display="block");return}const a=e.querySelector('button[type="submit"]');try{a&&(a.disabled=!0,a.innerText="Saving..."),await L("POST","/departments",{name:g,headUserId:o?Number(o):null}),T.success("Department Created","Department node onboarded successfully."),d.style.display="none",e.reset(),await de()}catch(m){console.error(m),p&&(p.innerText=m.message||"Failed to create department node.",p.style.display="block")}finally{a&&(a.disabled=!1,a.innerText="Save Department")}})}await de()}async function de(){const t=document.getElementById("hierarchy-tree-root");if(!t)return;const s=$.isAdmin();try{const[i,d]=await Promise.all([L("GET","/departments"),L("GET","/users")]);if(ee=i.departments||[],ne=d.users||[],et(),s){const u=document.getElementById("dept-head");u&&(u.innerHTML='<option value="">No Head Assigned</option>'+ne.map(e=>{var c;return`<option value="${e.id}">${E(e.firstName)} ${E(e.lastName)} (${E(((c=e.rank)==null?void 0:c.title)||"Employee")})</option>`}).join(""))}}catch(i){console.error(i),t.innerHTML=`<div style="color:var(--status-danger)">Error loading structure: ${E(i.message)}</div>`}}function et(){var e;const t=document.getElementById("hierarchy-tree-root");if(!t)return;const s=$.isAdmin();let i="";const d=ne.filter(c=>{var n;return((n=c.rank)==null?void 0:n.level)===1&&c.status==="active"}),u=d.length>0?d[0]:null;if(u){const c=`/avatars/user-${u.id}.jpg?t=${Date.now()}`,n=`${u.firstName[0]}${u.lastName[0]}`;i+=`
      <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 32px;">
        <!-- Root Card -->
        <div class="org-node" style="position: relative; z-index: 2;">
          <div style="width: 48px; height: 48px; border-radius: 50%; overflow: hidden; margin: 0 auto 12px auto; background-color: var(--accent-navy-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <img src="${c}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 100%; height: 100%; object-fit: cover; display: none;" />
            <div style="display: flex;">${E(n)}</div>
          </div>
          <div style="font-weight: 600; font-size: 14px; text-align: center; color: var(--text-primary); margin-bottom: 4px;">
            ${E(u.firstName)} ${E(u.lastName)}
          </div>
          <div style="font-size: 12px; color: var(--text-secondary); text-align: center;">
            ${E(((e=u.rank)==null?void 0:e.title)||"Top Executive")}
          </div>
        </div>
        
        <!-- Stem down from Root -->
        ${ee.length>0?'<div style="width: 2px; height: 32px; background-color: var(--tree-line-color);"></div>':""}
      </div>
    `}ee.length>0?i+=`
      <div style="display: flex; gap: 32px; justify-content: center; align-items: flex-start; position: relative;">

        ${ee.map((c,n)=>{var p;const v=c.headUser,r=v?`${v.firstName} ${v.lastName}`:"Vacant",g=v?((p=v.rank)==null?void 0:p.title)||"VP / Department Head":"No Head Assigned",o=ne.filter(a=>a.departmentId===c.id&&a.id!==(v==null?void 0:v.id));return`
            <div style="display: flex; flex-direction: column; align-items: center; position: relative; min-width: 200px;">
              
              <!-- Horizontal connector line segments bridging the gap -->
              ${ee.length>1?`
                <div style="position: absolute; top: 0; height: 2px; background-color: var(--tree-line-color);
                  left: ${n===0?"50%":"-16px"};
                  right: ${n===ee.length-1?"50%":"-16px"};"></div>
              `:""}

              <!-- Vertical drop line from horizontal connector -->
              <div style="width: 2px; height: 16px; background-color: var(--tree-line-color); z-index: 2;"></div>
              
              <!-- Department Head Card -->
              <div class="widget-card" style="padding: 16px 20px; text-align: center; border: 1px solid var(--border-neutral); max-width: 240px; min-width: 180px; background-color: var(--bg-secondary); margin-top: -2px; position: relative; z-index: 3;">
                ${s?`
                  <div style="position: absolute; top: 6px; right: 8px; display: flex; gap: 6px; z-index: 5;">
                    <button class="edit-dept-btn" data-id="${c.id}" title="Edit Department" style="background: none; border: none; cursor: pointer; color: var(--text-secondary); padding: 2px; display: flex; align-items: center;">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 13px; height: 13px;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button class="delete-dept-btn" data-id="${c.id}" title="Delete Department" style="background: none; border: none; cursor: pointer; color: var(--status-danger); padding: 2px; display: flex; align-items: center;">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 13px; height: 13px;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                `:""}
                <span class="small-text" style="font-weight: 700; color: var(--accent-navy-primary); text-transform: uppercase; font-size: 10px; display:block; margin-bottom: 8px; padding-right: 28px; text-align: left;">${E(c.name)}</span>
                <div style="display:flex;align-items:center;gap:12px;text-align:left;">
                  <img src="/avatars/user-${v==null?void 0:v.id}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width:36px;height:36px;border-radius:50%;object-fit:cover;display:${v?"block":"none"};" />
                  <div style="width:36px;height:36px;border-radius:50%;background:var(--accent-navy-primary);color:#fff;display:${v?"none":"flex"};align-items:center;justify-content:center;font-weight:bold;font-size:14px;flex-shrink:0;">${E(r[0]||"?")}</div>
                  <div>
                    <h4 class="card-title" style="font-size: 13px; font-weight: 600; text-align: left;">${E(r)}</h4>
                    <p class="small-text" style="color: var(--text-secondary); font-size:11px; text-align: left;">${E(g)}</p>
                  </div>
                </div>
              </div>

              <!-- Connector Line to Department Members -->
              ${o.length>0?`
                <div style="width: 2px; height: 24px; background-color: var(--tree-line-color);"></div>
                
                <!-- Members vertical tree stack -->
                <div style="display: flex; flex-direction: column; gap: 12px; align-items: center; width: 100%;">
                  ${o.map(a=>{var m;return`
                    <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
                      <div style="width: 2px; height: 12px; background-color: var(--tree-line-color);"></div>
                      <div style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-sm); text-align: left; background-color: var(--bg-primary); min-width: 140px; max-width: 200px; display: flex; align-items: center; gap: 8px;">
                        <img src="/avatars/user-${a.id}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width:24px;height:24px;border-radius:50%;object-fit:cover;display:block;" />
                        <div style="width:24px;height:24px;border-radius:50%;background:var(--accent-navy-primary);color:#fff;display:none;align-items:center;justify-content:center;font-weight:bold;font-size:10px;flex-shrink:0;">${E(a.firstName[0]||"?")}</div>
                        <div>
                          <strong class="data-number" style="font-size: 12px; display:block;">${E(a.firstName)} ${E(a.lastName)}</strong>
                          <div class="small-text" style="font-size:10px; margin-top:2px;">${E(((m=a.rank)==null?void 0:m.title)||"Employee")}</div>
                        </div>
                      </div>
                    </div>
                  `}).join("")}
                </div>
              `:""}
            </div>
          `}).join("")}
      </div>
    `:i+='<p class="small-text" style="color:var(--text-secondary)">No departments configured.</p>',t.innerHTML=i}let ye=[],X=[],he=[];function tt(){const t=$.isAdmin();return`
    <div style="display: flex; flex-direction: column; gap: 24px; max-width: 1200px; margin: 0 auto;">
      <!-- Title & CTA -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 class="page-title">Employees</h1>
          <p class="body-text">Manage corporate employee profiles, ranks, and operational provisioning.</p>
        </div>
        ${t?`
          <button id="add-employee-btn" class="btn btn-primary" style="padding: 10px 18px; border-radius: var(--radius-md); border: none; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 16px; height: 16px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Employee
          </button>
        `:""}
      </div>

      <!-- Add Employee Drawer Form (Admin only, hidden by default) -->
      ${t?`
        <div id="add-employee-drawer" style="display: none; padding: 24px; background-color: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: var(--radius-lg); flex-direction: column; gap: 20px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
          <div>
            <h3 class="card-title" style="font-size: 18px;">Provision Employee Account</h3>
            <p class="small-text">Enforces corporate standard complexity checks and department scoping</p>
          </div>
          <div id="employee-error-alert" style="display: none; padding: 12px; background-color: rgba(220, 38, 38, 0.1); color: var(--status-danger); font-size: 13px; font-weight: 500; border-radius: var(--radius-md);"></div>
          
          <form id="create-employee-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="emp-first" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                First Name
                <span class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">The employee's given first name (1 to 50 characters).</span>
                </span>
              </label>
              <input type="text" id="emp-first" required maxlength="50" placeholder="Ahmed" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md);" />
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="emp-last" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Last Name
                <span class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">The employee's family name or surname (1 to 50 characters).</span>
                </span>
              </label>
              <input type="text" id="emp-last" required maxlength="50" placeholder="Shareef" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md);" />
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="emp-email" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Email Address
                <span class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">Official workspace email. Must be unique within the platform.</span>
                </span>
              </label>
              <input type="email" id="emp-email" required maxlength="254" placeholder="ahmed@company.com" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md);" />
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="emp-password" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Temp Password
                <span class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">Temporary login key. Minimum 12 characters, including upper/lower case letters, numbers, and symbols.</span>
                </span>
              </label>
              <input type="password" id="emp-password" required maxlength="128" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md);" />
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="emp-rank" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Rank Role
                <span class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">Determines numerical authority level (0 is root Administrator, higher numbers represent lower rank authority).</span>
                </span>
              </label>
              <select id="emp-rank" required style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md); background:var(--bg-secondary);">
                <!-- Populated dynamically -->
              </select>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="emp-dept" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Department
                <span class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">Optional scope. The primary operational department this user is assigned to.</span>
                </span>
              </label>
              <select id="emp-dept" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md); background:var(--bg-secondary);">
                <option value="">Unassigned</option>
                <!-- Populated dynamically -->
              </select>
            </div>

            <div style="grid-column: span 2; display: flex; gap: 12px; margin-top: 8px;">
              <button type="submit" class="btn btn-primary" style="flex:1; justify-content:center; padding: 10px; border:none; font-weight:600; font-size:13px;">Create User</button>
              <button id="cancel-employee-btn" type="button" style="flex:1; padding: 10px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); background: var(--bg-primary); cursor: pointer; text-align: center;">Cancel</button>
            </div>
          </form>
        </div>
      `:""}

      <!-- Search & Filters -->
      <div class="widget-card" style="padding: 16px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
        <input type="text" id="employee-search" placeholder="Search by name, email, rank..." style="flex: 1; padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary);" />
        <select id="employee-status" style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary);">
          <option value="ALL">All Statuses</option>
          <option value="active">Active</option>
          <option value="deactivated">Deactivated</option>
        </select>
      </div>

      <!-- Employees Directory Table Card -->
      <div class="widget-card" style="padding: 0; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
          <thead style="background-color: var(--bg-secondary); border-bottom: 1px solid var(--border-neutral); position: sticky; top: 0; z-index: 10;">
            <tr>
              <th style="padding: 16px; font-weight: 600; color: var(--text-secondary);">Full Name</th>
              <th style="padding: 16px; font-weight: 600; color: var(--text-secondary);">Email Address</th>
              <th style="padding: 16px; font-weight: 600; color: var(--text-secondary);">Rank Level</th>
              <th style="padding: 16px; font-weight: 600; color: var(--text-secondary);">Department</th>
              <th style="padding: 16px; font-weight: 600; color: var(--text-secondary);">Status</th>
              <th style="padding: 16px; font-weight: 600; color: var(--text-secondary); text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody id="employees-table-body">
            <tr>
              <td colspan="6" style="padding: 32px; text-align: center; color: var(--text-secondary);">Loading employees registry...</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add Corporate Rank Form (Admin only) -->
      ${t?`
        <div class="widget-card" style="padding: 24px; display: flex; flex-direction: column; gap: 16px; border: 1px solid var(--border-neutral); border-radius: var(--radius-lg); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);">
          <div>
            <h3 class="card-title" style="font-size: 16px;">Add Corporate Rank Role</h3>
            <p class="small-text">Define hierarchy authority levels. Lower levels represent higher authority (e.g., 0 = Administrator, 1 = Executive/Director, 2 = Dept Head, 3 = Manager, 4 = Employee).</p>
          </div>

          <!-- Current ranks summary -->
          <div id="rank-list-container" style="display: none; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); overflow: hidden;">
            <div style="padding: 10px 16px; background: var(--bg-secondary); border-bottom: 1px solid var(--border-neutral);">
              <span class="small-text" style="font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em;">Current Rank Roles</span>
            </div>
            <div id="rank-list-rows" style="display: flex; flex-direction: column;"></div>
          </div>

          <div id="rank-error-alert" style="display: none; padding: 12px; background-color: rgba(220, 38, 38, 0.1); color: var(--status-danger); font-size: 13px; font-weight: 500; border-radius: var(--radius-md);"></div>
          
          <form id="create-rank-form" style="display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap;">
            <div style="display: flex; flex-direction: column; gap: 6px; min-width: 240px; flex: 1;">
              <label for="rank-title-input" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Rank Title
                <span class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">The job title or delegation role description (e.g., Senior Consultant).</span>
                </span>
              </label>
              <input type="text" id="rank-title-input" required placeholder="VP / Director" style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md);" />
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px; width: 150px;">
              <label for="rank-level-input" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Authority Level
                <span class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">Hierarchy integer (lower numbers represent higher authority). Must be a positive integer.</span>
                </span>
              </label>
              <input type="number" id="rank-level-input" required min="1" max="99" placeholder="2" style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md);" />
            </div>
            <button type="submit" class="btn btn-primary" style="padding: 10px 20px; border: none; font-weight: 600; height: 38px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;">Add Rank Role</button>
          </form>
        </div>
      `:""}
    </div>

    <!-- Edit Employee Modal (Admin only overlay) -->
    ${t?`
      <div id="edit-employee-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
        <div class="widget-card" style="width: 100%; max-width: 500px; padding: 24px; display: flex; flex-direction: column; gap: 20px; box-shadow: var(--shadow-lg);">
          <div>
            <h3 class="card-title" style="font-size: 18px;">Edit Employee Profile</h3>
            <p class="small-text">Modify account level access, title role, status, and department scoping.</p>
          </div>
          <div id="edit-employee-error-alert" style="display: none; padding: 12px; background-color: rgba(220, 38, 38, 0.1); color: var(--status-danger); font-size: 13px; font-weight: 500; border-radius: var(--radius-md);"></div>
          <form id="edit-employee-form" style="display: flex; flex-direction: column; gap: 16px;">
            <input type="hidden" id="edit-emp-id" />
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label for="edit-emp-first" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                  First Name
                  <div class="tooltip-container">
                    <span class="help-icon">?</span>
                    <span class="tooltip-text">The employee's given first name.</span>
                  </div>
                </label>
                <input type="text" id="edit-emp-first" required maxlength="50" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md); background: var(--bg-secondary); color: var(--text-primary);" />
              </div>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label for="edit-emp-last" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                  Last Name
                  <div class="tooltip-container">
                    <span class="help-icon">?</span>
                    <span class="tooltip-text">The employee's family name or surname.</span>
                  </div>
                </label>
                <input type="text" id="edit-emp-last" required maxlength="50" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md); background: var(--bg-secondary); color: var(--text-primary);" />
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="edit-emp-rank" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Rank Role (Title & Access)
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">Determines numerical authority level and system access.</span>
                </div>
              </label>
              <select id="edit-emp-rank" required style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md); background:var(--bg-secondary); color: var(--text-primary);">
                <!-- Dynamically populated -->
              </select>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="edit-emp-dept" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Department
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">The primary operational department this user is assigned to.</span>
                </div>
              </label>
              <select id="edit-emp-dept" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md); background:var(--bg-secondary); color: var(--text-primary);">
                <option value="">Unassigned</option>
                <!-- Dynamically populated -->
              </select>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="edit-emp-status" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Status
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">Active users can log in; deactivated users are blocked.</span>
                </div>
              </label>
              <select id="edit-emp-status" required style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md); background:var(--bg-secondary); color: var(--text-primary);">
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="edit-emp-password" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Reset Password (leave blank to keep current)
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">Generate a new login key for the employee.</span>
                </div>
              </label>
              <input type="password" id="edit-emp-password" placeholder="New password (min 12 chars, letters, numbers, symbols)" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md); background: var(--bg-secondary); color: var(--text-primary);" />
            </div>
            <div style="display: flex; gap: 12px; margin-top: 8px;">
              <button type="submit" class="btn btn-primary" style="flex:1; justify-content:center; padding: 10px; border:none; font-weight:600;">Save Changes</button>
              <button id="close-edit-modal-btn" type="button" style="flex:1; padding: 10px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); background: var(--bg-primary); color: var(--text-primary); cursor: pointer;">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `:""}
  `}async function at(){var i,d,u;if(!document.getElementById("employees-table-body"))return;const s=$.isAdmin();if((i=document.getElementById("employee-search"))==null||i.addEventListener("input",we),(d=document.getElementById("employee-status"))==null||d.addEventListener("input",we),s){let m=function(y){const l=document.getElementById("employee-error-alert");l&&(l.innerText=y,l.style.display="block")},b=function(y){const l=document.getElementById("rank-error-alert");l&&(l.innerText=y,l.style.display="block")};const e=document.getElementById("add-employee-btn"),c=document.getElementById("add-employee-drawer"),n=document.getElementById("cancel-employee-btn"),v=document.getElementById("create-employee-form"),r=document.getElementById("create-rank-form"),g=document.getElementById("edit-employee-modal"),o=document.getElementById("close-edit-modal-btn"),p=document.getElementById("edit-employee-form");e==null||e.addEventListener("click",()=>{ye.filter(l=>l.status==="active").length>=10&&T.warning("Tier Limit Warning","Your workspace count is at 10 active users. Adding employees requires tier migration support."),c.style.display=c.style.display==="none"?"flex":"none"}),n==null||n.addEventListener("click",()=>{c.style.display="none"}),(u=document.getElementById("employees-table-body"))==null||u.addEventListener("click",async y=>{const l=y.target.closest(".edit-emp-btn");if(l){const k=Number(l.dataset.id),h=ye.find(w=>w.id===k);if(h){document.getElementById("edit-emp-id").value=h.id,document.getElementById("edit-emp-first").value=h.firstName,document.getElementById("edit-emp-last").value=h.lastName;const w=document.getElementById("edit-emp-rank");w&&(w.innerHTML=X.map(S=>`<option value="${S.id}">${E(S.title)} (Level ${S.level})</option>`).join(""),w.value=h.rankId);const f=document.getElementById("edit-emp-dept");f&&(f.innerHTML='<option value="">Unassigned</option>'+he.map(S=>`<option value="${S.id}">${E(S.name)}</option>`).join(""),f.value=h.departmentId||""),document.getElementById("edit-emp-status").value=h.status;const I=document.getElementById("edit-emp-password");I&&(I.value=""),g&&(g.style.display="flex")}}const x=y.target.closest(".delete-emp-btn");if(x){const k=Number(x.dataset.id),h=x.dataset.name||"this employee";if(!confirm(`Are you sure you want to delete "${h}"? This action will deactivate their account.`))return;try{x.disabled=!0,x.innerText="Deleting...",await L("DELETE",`/users/${k}`),T.success("Employee Deleted",`${h} has been removed from the directory.`),await te()}catch(w){console.error(w),T.error("Deletion Failed",w.message||"Could not delete employee.")}finally{x.disabled=!1,x.innerText="Delete"}}}),o==null||o.addEventListener("click",()=>{g&&(g.style.display="none")}),p==null||p.addEventListener("submit",async y=>{y.preventDefault();const l=Number(document.getElementById("edit-emp-id").value),x=document.getElementById("edit-emp-first").value.trim(),k=document.getElementById("edit-emp-last").value.trim(),h=Number(document.getElementById("edit-emp-rank").value),w=document.getElementById("edit-emp-dept").value,f=document.getElementById("edit-emp-status").value,I=document.getElementById("edit-emp-password").value;if(!x||!k){T.error("Validation Error","First name and Last name are required.");return}const S={firstName:x,lastName:k,rankId:h,departmentId:w?Number(w):null,status:f};if(I){if(I.length<12||!/[a-z]/.test(I)||!/[A-Z]/.test(I)||!/[0-9]/.test(I)||!/[^a-zA-Z0-9]/.test(I)){T.error("Validation Error","Passwords must be at least 12 characters and meet complexity requirements (mixed case, number, symbol).");return}S.password=I}const M=p.querySelector('button[type="submit"]');try{M&&(M.disabled=!0,M.innerText="Saving..."),await L("PATCH",`/users/${l}`,S),T.success("User Profile Updated","Employee details modified successfully."),g&&(g.style.display="none"),await te()}catch(P){console.error(P),T.error("Update Failed",P.message||"Check server constraints.")}finally{M&&(M.disabled=!1,M.innerText="Save Changes")}});const a=document.getElementById("rank-list-rows");a==null||a.addEventListener("input",y=>{if(y.target.classList.contains("rank-title-edit-input")){const l=y.target.closest("div"),x=l==null?void 0:l.querySelector(".save-rank-btn");x&&(x.style.display="inline-block")}}),a==null||a.addEventListener("click",async y=>{if(y.target.classList.contains("save-rank-btn")){const l=Number(y.target.dataset.id),x=y.target.closest("div"),k=x==null?void 0:x.querySelector(".rank-title-edit-input"),h=k==null?void 0:k.value.trim();if(!h){T.error("Validation Error","Rank title cannot be empty.");return}try{await L("PATCH",`/users/ranks/${l}`,{title:h}),T.success("Rank Updated","Corporate rank role updated."),await te()}catch(w){T.error("Update Failed",w.message||"Could not update rank.")}}else if(y.target.classList.contains("delete-rank-btn")){const l=Number(y.target.dataset.id);if(confirm("Are you sure you want to delete this Corporate Rank role?"))try{await L("DELETE",`/users/ranks/${l}`),T.success("Rank Deleted","Corporate rank role deleted successfully."),await te()}catch(x){T.error("Deletion Failed",x.message||"Could not delete rank.")}}}),v==null||v.addEventListener("submit",async y=>{y.preventDefault();const l=document.getElementById("emp-first").value.trim(),x=document.getElementById("emp-last").value.trim(),k=document.getElementById("emp-email").value.trim(),h=document.getElementById("emp-password").value,w=Number(document.getElementById("emp-rank").value),f=document.getElementById("emp-dept").value;if(!l||l.length<1||l.length>50){m("First name must be between 1 and 50 characters.");return}if(!x||x.length<1||x.length>50){m("Last name must be between 1 and 50 characters.");return}if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(k)){m("Please enter a valid email address format.");return}if(h.length<12||!/[a-z]/.test(h)||!/[A-Z]/.test(h)||!/[0-9]/.test(h)||!/[^a-zA-Z0-9]/.test(h)){m("Temporary passwords must be at least 12 characters long and meet complexity requirements (mixed case, number, symbol).");return}const S=v.querySelector('button[type="submit"]');try{S&&(S.disabled=!0,S.innerText="Creating Account..."),await L("POST","/users",{firstName:l,lastName:x,email:k,password:h,rankId:w,departmentId:f?Number(f):null}),T.success("User Created","Employee profile provisioned successfully."),c.style.display="none",v.reset(),await te()}catch(M){console.error(M),m(M.message||"Failed to create user account."),T.error("Provisioning Failed",M.message||"Check gate constraints.")}finally{S&&(S.disabled=!1,S.innerText="Create User")}}),r==null||r.addEventListener("submit",async y=>{y.preventDefault();const l=document.getElementById("rank-title-input").value.trim(),x=Number(document.getElementById("rank-level-input").value),k=document.getElementById("rank-error-alert");if(k&&(k.style.display="none",k.innerText=""),!l){b("Rank title is required.");return}if(isNaN(x)||x<0){b("Authority level must be a non-negative number.");return}const h=r.querySelector('button[type="submit"]');try{h&&(h.disabled=!0,h.innerText="Adding..."),await L("POST","/users/ranks",{title:l,level:x}),T.success("Rank Role Created",`Successfully added rank role: "${l}".`),r.reset(),await te()}catch(w){console.error(w),b(w.message||"Failed to create rank role."),T.error("Rank Creation Failed",w.message||"Verification failed.")}finally{h&&(h.disabled=!1,h.innerText="Add Rank Role")}})}await te()}async function te(){const t=document.getElementById("employees-table-body");if(!t)return;const s=$.isAdmin();try{const[i,d,u]=await Promise.all([L("GET","/users"),L("GET","/departments"),L("GET","/users/ranks")]);if(ye=i.users||[],he=d.departments||[],X=u.ranks||[],X.length===0&&(X=[{id:1,title:"Administrator",level:0},{id:2,title:"Chief Executive",level:1},{id:3,title:"Deputy Chief Executive",level:2},{id:4,title:"Executive / Director",level:3},{id:5,title:"Department Head",level:4},{id:6,title:"Manager",level:5},{id:7,title:"Employee",level:6}]),we(),s){const e=document.getElementById("emp-rank");e&&(e.innerHTML=X.map(r=>`<option value="${r.id}">${E(r.title)} (Level ${r.level})</option>`).join(""));const c=document.getElementById("emp-dept");c&&(c.innerHTML='<option value="">Unassigned</option>'+he.map(r=>`<option value="${r.id}">${E(r.name)}</option>`).join(""));const n=document.getElementById("rank-list-container"),v=document.getElementById("rank-list-rows");n&&v&&(X.length>0?(n.style.display="block",v.innerHTML=X.map((r,g)=>`
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; ${g<X.length-1?"border-bottom: 1px solid var(--border-neutral);":""}">
              <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                <span class="small-text" style="width: 80px; font-weight: 700; color: var(--accent-navy-primary);">Level ${r.level}</span>
                <input type="text" class="rank-title-edit-input" data-id="${r.id}" value="${E(r.title)}" style="border: 1px solid transparent; border-radius: var(--radius-sm); background: transparent; color: var(--text-primary); font-size: 13px; font-family: var(--font-text); width: 60%; max-width: 250px; padding: 4px;" />
              </div>
              <div style="display: flex; gap: 12px; align-items: center;">
                <button class="save-rank-btn small-text" data-id="${r.id}" style="background: none; border: none; color: var(--status-success); font-weight: 600; cursor: pointer; display: none; padding: 0;">Save</button>
                <button class="delete-rank-btn small-text" data-id="${r.id}" style="background: none; border: none; color: var(--status-danger); font-weight: 600; cursor: pointer; padding: 0;">Delete</button>
              </div>
            </div>
          `).join("")):n.style.display="none")}}catch(i){console.error(i),t.innerHTML=`<tr><td colspan="6" style="padding:32px; text-align:center; color:var(--status-danger);">Failed to load registry: ${E(i.message)}</td></tr>`}}function we(){var e,c;const t=document.getElementById("employees-table-body");if(!t)return;const s=((e=document.getElementById("employee-search"))==null?void 0:e.value.toLowerCase())||"",i=((c=document.getElementById("employee-status"))==null?void 0:c.value)||"ALL",d=$.isAdmin(),u=ye.filter(n=>{var o;const r=`${n.firstName} ${n.lastName}`.toLowerCase().includes(s)||n.email.toLowerCase().includes(s)||((o=n.rank)==null?void 0:o.title.toLowerCase().includes(s)),g=i==="ALL"||n.status===i;return r&&g});if(u.length===0){t.innerHTML=`
      <tr>
        <td colspan="6" style="padding: 32px; text-align: center; color: var(--text-secondary);">
          No employees matching filters found.
        </td>
      </tr>
    `;return}t.innerHTML=u.map(n=>{var m,b;const r=n.status!=="active"?'<span class="pill-badge status-danger"><span class="badge-dot"></span>Inactive</span>':'<span class="pill-badge status-success"><span class="badge-dot"></span>Active</span>',g=n.department?E(n.department.name):'<span style="color:var(--text-secondary)">General</span>',o=`${E(n.firstName)} ${E(n.lastName)}`,p=E(((m=n.rank)==null?void 0:m.title)||"Employee"),a=n.rank?n.rank.level:4;return`
      <tr style="border-bottom: 1px solid var(--border-neutral); hover: background-color var(--bg-secondary); transition: background-color 0.15s ease;">
        <td data-label="Full Name" style="padding: 16px; font-weight:600; color:var(--text-primary);">${o}</td>
        <td data-label="Email Address" style="padding: 16px; color:var(--text-secondary);">${E(n.email)}</td>
        <td data-label="Rank Level" style="padding: 16px; color:var(--text-primary); font-weight:500;">${p} <span class="small-text">(Lvl ${a})</span></td>
        <td data-label="Department" style="padding: 16px;">${g}</td>
        <td data-label="Status" style="padding: 16px;">${r}</td>
        <td data-label="Actions" style="padding: 16px; text-align: right;">
          <div style="display: inline-flex; justify-content: flex-end; align-items: center; gap: 12px;">
            <a href="#profile" class="small-text" style="color:var(--accent-navy-primary); font-weight:600; text-decoration:none;" onclick="localStorage.setItem('target_profile_id', ${n.id});">View Profile</a>
            ${d?`<button class="edit-emp-btn small-text" data-id="${n.id}" style="background: none; border: none; color: var(--accent-navy-primary); font-weight: 600; cursor: pointer; padding: 0;">Edit</button>`:""}
            ${d&&n.id!==((b=$.currentUser)==null?void 0:b.id)?`<button class="delete-emp-btn small-text" data-id="${n.id}" data-name="${E(n.firstName)} ${E(n.lastName)}" style="background: none; border: none; color: var(--status-danger); font-weight: 600; cursor: pointer; padding: 0;">Delete</button>`:""}
          </div>
        </td>
      </tr>
    `}).join("")}function rt(){const t=$.currentUser;return`
    <div style="display: flex; flex-direction: column; gap: 32px; max-width: 1200px; margin: 0 auto;">
      <!-- Title -->
      <div>
        <h1 class="page-title">SLA Analytics</h1>
        <p class="body-text">Assess workforce performance metrics, blocker delays, and operational closure indices.</p>
      </div>

      <!-- SLA Performance Grid -->
      <div id="reports-loading" style="padding: 48px; text-align: center; color: var(--text-secondary);">
        Calculating performance index statistics...
      </div>

      <div id="reports-content" style="display: none; flex-direction: column; gap: 32px;">
        <!-- KPI Cards Row -->
        <div class="dashboard-grid">
          <!-- Avg Completion Time -->
          <div class="grid-col-4 widget-card">
            <span class="small-text" style="font-weight: 600; text-transform: uppercase; color: var(--text-secondary); display: flex; align-items: center; justify-content: center;">
              Avg Task Closure Time
              <div class="tooltip-container" style="margin-left: 6px;">
                <span class="help-icon">?</span>
                <span class="tooltip-text" style="text-transform: none;">Average time taken from task creation to final completion.</span>
              </div>
            </span>
            <div id="kpi-closure-time" class="page-title" style="font-size: 32px; margin: 12px 0;">--</div>
            <p class="small-text">Average duration from creation to closure state</p>
          </div>

          <!-- Blocker Resolve Speed -->
          <div class="grid-col-4 widget-card">
            <span class="small-text" style="font-weight: 600; text-transform: uppercase; color: var(--text-secondary); display: flex; align-items: center; justify-content: center;">
              Avg Blocker Duration
              <div class="tooltip-container" style="margin-left: 6px;">
                <span class="help-icon">?</span>
                <span class="tooltip-text" style="text-transform: none;">Average time tasks spend in the Blocked state.</span>
              </div>
            </span>
            <div id="kpi-blocker-time" class="page-title" style="font-size: 32px; margin: 12px 0;">--</div>
            <p class="small-text">Average duration of suspended blockers</p>
          </div>

          <!-- Reassignment Frequency -->
          <div class="grid-col-4 widget-card">
            <span class="small-text" style="font-weight: 600; text-transform: uppercase; color: var(--text-secondary); display: flex; align-items: center; justify-content: center;">
              Reassignment Ratio
              <div class="tooltip-container" style="margin-left: 6px;">
                <span class="help-icon">?</span>
                <span class="tooltip-text" style="text-transform: none;">Percentage of tasks that were reassigned after initial assignment.</span>
              </div>
            </span>
            <div id="kpi-reassign-rate" class="page-title" style="font-size: 32px; margin: 12px 0;">--</div>
            <p class="small-text">Percentage of tasks requiring reassignment</p>
          </div>
        </div>

        <!-- Departmental Ranking Table & SLA Progress Chart -->
        <div class="dashboard-grid">
          <!-- Departmental SLA Completion Charts -->
          <div class="grid-col-6 widget-card" style="display: flex; flex-direction: column;">
            <h3 class="card-title" style="margin-bottom: 16px; display: flex; align-items: center;">
              SLA Met Percentage
              <div class="tooltip-container">
                <span class="help-icon">?</span>
                <span class="tooltip-text">Service Level Agreement - Percentage of tasks completed on or before their due dates.</span>
              </div>
            </h3>
            <div id="sla-chart-list" style="display: flex; flex-direction: column; gap: 20px; flex: 1; justify-content: center;">
              <!-- Populated dynamically -->
            </div>
          </div>

          <!-- Priority Allocation Index -->
          <div class="grid-col-6 widget-card">
            <h3 class="card-title" style="margin-bottom: 16px; display: flex; align-items: center;">
              Task Completion by Priority
              <div class="tooltip-container">
                <span class="help-icon">?</span>
                <span class="tooltip-text">Breakdown of tasks closed based on urgency levels.</span>
              </div>
            </h3>
            <div id="priority-list" style="display: flex; flex-direction: column; gap: 16px;">
              <!-- Populated dynamically -->
            </div>
          </div>
        </div>

        <!-- ══════════════════════════════════════════════════ -->
        <!-- STAFF PERFORMANCE TABLE (managers + above only)   -->
        <!-- ══════════════════════════════════════════════════ -->
        ${((t==null?void 0:t.rankLevel)??99)<=3?`
        <div class="widget-card" style="display: flex; flex-direction: column; gap: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
            <div>
              <h3 class="card-title" style="margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                Staff Performance
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">Individual staff performance based on task completion rate, on-time delivery, and active blockers. Score is 0–100.</span>
                </div>
              </h3>
              <p class="small-text" style="margin: 0;">Ranked by composite performance score. Scoped to your accessible team members.</p>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <select id="perf-dept-filter" style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-size: 13px; background: var(--bg-secondary); color: var(--text-primary); outline: none;">
                <option value="">All Departments</option>
              </select>
              <select id="perf-sort" style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-size: 13px; background: var(--bg-secondary); color: var(--text-primary); outline: none;">
                <option value="score">Sort: Score</option>
                <option value="completed">Sort: Completed</option>
                <option value="ontime">Sort: On-Time Rate</option>
                <option value="overdue">Sort: Overdue</option>
              </select>
            </div>
          </div>

          <!-- Score legend -->
          <div style="display: flex; gap: 16px; flex-wrap: wrap;">
            <span class="small-text" style="display: flex; align-items: center; gap: 5px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--status-success);"></span> 75–100: High Performer
            </span>
            <span class="small-text" style="display: flex; align-items: center; gap: 5px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--status-warning);"></span> 50–74: Needs Attention
            </span>
            <span class="small-text" style="display: flex; align-items: center; gap: 5px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--status-danger);"></span> 0–49: At Risk
            </span>
          </div>

          <!-- Table header (desktop only) -->
          <div class="desktop-only" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1.5fr; gap: 8px; padding: 8px 16px; background: var(--bg-secondary); border-radius: var(--radius-md);">
            <span class="small-text" style="font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Staff Member</span>
            <span class="small-text" style="font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; text-align: center;">Completed</span>
            <span class="small-text" style="font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; text-align: center;">On-Time %</span>
            <span class="small-text" style="font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; text-align: center;">Avg Days</span>
            <span class="small-text" style="font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; text-align: center;">Overdue</span>
            <span class="small-text" style="font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; text-align: right;">Score</span>
          </div>

          <!-- Table rows -->
          <div id="staff-performance-list" style="display: flex; flex-direction: column; gap: 8px;">
            <!-- Populated dynamically -->
          </div>
        </div>
        `:""}
      </div>
    </div>
  `}function st(t,s){const i=t.onTimeRate,d=s>0?t.completed/s*100:0,u=Math.min(t.blocked*10,30),e=Math.min(t.overdue*10,20),c=i*.5+d*.3-u-e;return Math.max(0,Math.min(100,Math.round(c)))}async function it(){var e,c;const t=document.getElementById("reports-loading"),s=document.getElementById("reports-content");if(!s)return;const i=$.currentUser,d=(i==null?void 0:i.rankLevel)??99,u=d<=3;try{const n=[L("GET","/tasks"),L("GET","/departments")];u&&n.push(L("GET","/users"));const v=await Promise.all(n),r=v[0].tasks||[],g=v[1].departments||[];let p=(u?v[2].users||[]:[]).filter(h=>{var w;return((w=h.rank)==null?void 0:w.level)!==0});d>=3&&d<=4&&(i!=null&&i.departmentId)&&(p=p.filter(h=>h.departmentId===i.departmentId));const a=r.filter(h=>h.status==="Completed");let m="N/A";if(a.length>0){const h=a.reduce((f,I)=>f+(new Date(I.updatedAt)-new Date(I.createdAt)),0),w=Math.round(h/a.length/(1e3*60*60));m=w<24?`${w} hrs`:`${Math.round(w/24)} days`}let b="N/A";const y=r.flatMap(h=>(h.blockers||[]).filter(w=>w.resolvedAt));if(y.length>0){const h=y.reduce((f,I)=>f+(new Date(I.resolvedAt)-new Date(I.createdAt)),0),w=Math.round(h/y.length/(1e3*60*60));b=w<24?`${w} hrs`:`${Math.round(w/24)} days`}let l="0%";if(r.length>0){const h=r.filter(w=>{var f;return(f=w.assignments)==null?void 0:f.some(I=>I.reassignedAt!==null)}).length;l=`${Math.round(h/r.length*100)}%`}document.getElementById("kpi-closure-time").innerText=m,document.getElementById("kpi-blocker-time").innerText=b,document.getElementById("kpi-reassign-rate").innerText=l;const x=document.getElementById("sla-chart-list");x&&(g.length===0?x.innerHTML='<p class="small-text" style="text-align: center;">No department data configured.</p>':x.innerHTML=g.map(h=>{const w=r.filter(P=>P.departmentId===h.id),f=w.filter(P=>P.status==="Completed").length,I=w.length>0?Math.round(f/w.length*100):100,S=Math.max(I,4),M=I>=80?"var(--status-success)":I>=60?"var(--status-warning)":"var(--status-danger)";return`
            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
                <span class="data-number">${E(h.name)}</span>
                <span class="small-text" style="font-weight: 600;">${I}% SLA met</span>
              </div>
              <div style="height: 8px; background-color: var(--bg-tertiary); border-radius: var(--radius-sm); overflow: hidden;">
                <div style="width: ${S}%; height: 100%; background-color: ${M}; border-radius: var(--radius-sm); transition: width 0.6s ease;"></div>
              </div>
            </div>
          `}).join(""));const k=document.getElementById("priority-list");if(k){const h=["Critical","High","Medium","Low"];k.innerHTML=h.map(w=>{const f=r.filter(P=>P.priority===w),I=f.filter(P=>P.status==="Completed").length,S=f.length>0?Math.round(I/f.length*100):0;return`
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-neutral);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${{Critical:"var(--status-danger)",High:"var(--status-warning)",Medium:"var(--status-info)",Low:"var(--status-success)"}[w]};"></span>
              <span class="data-number">${w} Priority</span>
            </div>
            <div style="text-align: right;">
              <span class="pill-badge status-info" style="font-size: 11px;">${S}% Rate</span>
              <div class="small-text" style="font-size: 10px; margin-top: 2px;">${I} / ${f.length} completed</div>
            </div>
          </div>
        `}).join("")}if(u&&p.length>0){let M=function(H){const j=document.getElementById("staff-performance-list");if(j){if(H.length===0){j.innerHTML='<p class="small-text" style="text-align: center; padding: 24px;">No staff members match the current filter.</p>';return}j.innerHTML=H.map((B,q)=>{var D,N;const z=B.score>=75?"var(--status-success)":B.score>=50?"var(--status-warning)":"var(--status-danger)",R=B.score>=75?"rgba(34,197,94,0.08)":B.score>=50?"rgba(234,179,8,0.08)":"rgba(239,68,68,0.08)",O=q===0?'<span style="font-size:14px;" title="Top performer">🥇</span>':q===1?'<span style="font-size:14px;" title="Second place">🥈</span>':q===2?'<span style="font-size:14px;" title="Third place">🥉</span>':"",Z=g.find(J=>J.id===B.user.departmentId),F=Z?E(Z.name):"Unassigned",C=`
            <div class="desktop-only" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1.5fr; gap: 8px; align-items: center; padding: 14px 16px; border-radius: var(--radius-md); background: var(--bg-primary); border: 1px solid var(--border-neutral); transition: box-shadow 0.15s;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="position: relative; width: 36px; height: 36px; flex-shrink: 0;">
                  <img src="/avatars/user-${B.user.id}.jpg" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" style="width:36px;height:36px;border-radius:50%;object-fit:cover;" />
                  <div style="width:36px;height:36px;border-radius:50%;background:var(--sidebar-bg);display:none;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:var(--text-primary);">${E(B.user.firstName[0])}${E(B.user.lastName[0]||"")}</div>
                </div>
                <div>
                  <div style="font-weight: 600; font-size: 14px; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                    ${E(B.user.firstName)} ${E(B.user.lastName)} ${O}
                  </div>
                  <div class="small-text" style="font-size: 11px;">${E(((D=B.user.rank)==null?void 0:D.title)||"Employee")} · ${F}</div>
                </div>
              </div>
              <div style="text-align: center; font-size: 15px; font-weight: 700; color: var(--text-primary);">${B.completed}<span class="small-text" style="font-size:11px; font-weight:400;"> / ${B.total}</span></div>
              <div style="text-align: center;">
                <span style="font-size: 15px; font-weight: 700; color: ${B.onTimeRate>=75?"var(--status-success)":B.onTimeRate>=50?"var(--status-warning)":"var(--status-danger)"};">${B.onTimeRate}%</span>
              </div>
              <div style="text-align: center; font-size: 14px; color: var(--text-secondary);">${B.avgDays==="--"?"--":B.avgDays+"d"}</div>
              <div style="text-align: center;">
                ${B.overdue>0?`<span style="font-size:14px;font-weight:700;color:var(--status-danger);">${B.overdue}</span>`:'<span style="font-size:14px;color:var(--text-secondary);">0</span>'}
              </div>
              <div style="display: flex; align-items: center; justify-content: flex-end; gap: 10px;">
                <div style="flex: 1; max-width: 80px; height: 6px; background: var(--bg-tertiary); border-radius: 3px; overflow: hidden;">
                  <div style="width: ${B.score}%; height: 100%; background: ${z}; border-radius: 3px; transition: width 0.6s ease;"></div>
                </div>
                <span style="font-size: 15px; font-weight: 800; color: ${z}; min-width: 32px; text-align: right;">${B.score}</span>
              </div>
            </div>
          `,A=`
            <div class="mobile-only" style="background: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div style="position: relative; width: 40px; height: 40px; flex-shrink: 0;">
                    <img src="/avatars/user-${B.user.id}.jpg" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" />
                    <div style="width:40px;height:40px;border-radius:50%;background:var(--sidebar-bg);display:none;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:var(--text-primary);">${E(B.user.firstName[0])}${E(B.user.lastName[0]||"")}</div>
                  </div>
                  <div>
                    <div style="font-weight: 700; font-size: 15px; color: var(--text-primary);">${E(B.user.firstName)} ${E(B.user.lastName)} ${O}</div>
                    <div class="small-text" style="font-size: 11px;">${E(((N=B.user.rank)==null?void 0:N.title)||"Employee")}</div>
                  </div>
                </div>
                <div style="background: ${R}; border: 1.5px solid ${z}; border-radius: 12px; padding: 6px 14px; text-align: center;">
                  <div style="font-size: 20px; font-weight: 800; color: ${z}; line-height: 1;">${B.score}</div>
                  <div style="font-size: 9px; color: ${z}; font-weight: 600; text-transform: uppercase;">Score</div>
                </div>
              </div>
              <div style="display: flex; height: 6px; background: var(--bg-tertiary); border-radius: 3px; overflow: hidden;">
                <div style="width: ${B.score}%; background: ${z}; border-radius: 3px; transition: width 0.6s ease;"></div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; text-align: center;">
                <div style="background: var(--bg-secondary); border-radius: 10px; padding: 10px 4px;">
                  <div style="font-size: 18px; font-weight: 700; color: var(--text-primary);">${B.completed}</div>
                  <div class="small-text" style="font-size: 10px;">Done</div>
                </div>
                <div style="background: var(--bg-secondary); border-radius: 10px; padding: 10px 4px;">
                  <div style="font-size: 18px; font-weight: 700; color: ${B.onTimeRate>=75?"var(--status-success)":B.onTimeRate>=50?"var(--status-warning)":"var(--status-danger)"};">${B.onTimeRate}%</div>
                  <div class="small-text" style="font-size: 10px;">On-time</div>
                </div>
                <div style="background: var(--bg-secondary); border-radius: 10px; padding: 10px 4px;">
                  <div style="font-size: 18px; font-weight: 700; color: var(--text-secondary);">${B.avgDays==="--"?"--":B.avgDays+"d"}</div>
                  <div class="small-text" style="font-size: 10px;">Avg</div>
                </div>
                <div style="background: var(--bg-secondary); border-radius: 10px; padding: 10px 4px;">
                  <div style="font-size: 18px; font-weight: 700; color: ${B.overdue>0?"var(--status-danger)":"var(--text-secondary)"};">${B.overdue}</div>
                  <div class="small-text" style="font-size: 10px;">Overdue</div>
                </div>
              </div>
            </div>
          `;return C+A}).join("")}},P=function(){var q,z;const H=parseInt((q=document.getElementById("perf-dept-filter"))==null?void 0:q.value)||null,j=((z=document.getElementById("perf-sort"))==null?void 0:z.value)||"score";let B=[...I];H&&(B=B.filter(R=>R.user.departmentId===H)),B.sort((R,O)=>j==="score"?O.score-R.score:j==="completed"?O.completed-R.completed:j==="ontime"?O.onTimeRate-R.onTimeRate:j==="overdue"?O.overdue-R.overdue:0),M(B)};const h=new Date;h.setHours(0,0,0,0);const w=p.map(H=>{const j=r.filter(F=>{var C;return(C=F.assignments)==null?void 0:C.some(A=>A.userId===H.id&&A.isActive)}),B=j.filter(F=>F.status==="Completed"),q=B.filter(F=>new Date(F.updatedAt)<=new Date(F.dueDate)),z=B.length>0?Math.round(q.length/B.length*100):0;let R="--";if(B.length>0){const F=B.reduce((C,A)=>C+(new Date(A.updatedAt)-new Date(A.createdAt)),0);R=Math.round(F/B.length/(1e3*60*60*24))}const O=j.filter(F=>F.status==="Blocked").length,Z=j.filter(F=>F.status!=="Completed"&&new Date(F.dueDate)<h).length;return{user:H,completed:B.length,total:j.length,onTimeRate:z,avgDays:R,blocked:O,overdue:Z}}),f=Math.max(...w.map(H=>H.completed),1),I=w.map(H=>({...H,score:st(H,f)})),S=document.getElementById("perf-dept-filter");S&&g.forEach(H=>{const j=document.createElement("option");j.value=H.id,j.textContent=H.name,S.appendChild(j)}),P(),(e=document.getElementById("perf-dept-filter"))==null||e.addEventListener("change",P),(c=document.getElementById("perf-sort"))==null||c.addEventListener("change",P)}t&&(t.style.display="none"),s.style.display="flex"}catch(n){console.error(n),t&&(t.innerHTML=`<span style="color:var(--status-danger)">Failed to compute reports: ${E(n.message)}</span>`)}}function nt(){const t=$.isAdmin();return`
    <div style="display: flex; flex-direction: column; gap: 32px; max-width: 1200px; margin: 0 auto;">
      <!-- Title -->
      <div>
        <h1 class="page-title">Settings</h1>
        <p class="body-text">Configure personal preferences, display themes, and corporate policies.</p>
      </div>

      <!-- Settings Grid with Tabs -->
      <div class="settings-grid" style="display: flex; gap: 32px; align-items: flex-start;">
        <!-- Left Side: Tab Buttons -->
        <div class="settings-sidebar widget-card" style="width: 240px; padding: 12px; display: flex; flex-direction: column; gap: 4px; flex-shrink: 0;">
          <button class="settings-tab-btn active" data-tab="tab-profile" style="text-align: left; padding: 10px 16px; background: none; border: none; border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; font-weight: 600; cursor: pointer; color: var(--accent-navy-primary); display: flex; align-items: center; gap: 8px;">
            User Profile
          </button>
          <button class="settings-tab-btn" data-tab="tab-display" style="text-align: left; padding: 10px 16px; background: none; border: none; border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; font-weight: 500; cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
            Display Settings
          </button>
          ${t?`
            <button class="settings-tab-btn" data-tab="tab-org" style="text-align: left; padding: 10px 16px; background: none; border: none; border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; font-weight: 500; cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
              Company & Policies
            </button>
          `:""}
        </div>

        <!-- Right Side: Content Panes -->
        <div style="flex: 1; display: flex; flex-direction: column; gap: 24px;">
          <!-- Tab 1: Profile Form -->
          <div id="tab-profile" class="settings-pane widget-card" style="display: flex; flex-direction: column; gap: 20px;">
            <h3 class="card-title">User Account Details</h3>
            <form id="profile-update-form" style="display: flex; flex-direction: column; gap: 16px; max-width: 500px;">
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <label class="small-text" style="font-weight:600;">Email Address</label>
                <input type="email" id="profile-email" disabled style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); background-color: var(--bg-tertiary);" />
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <label class="small-text" style="font-weight:600;">First Name</label>
                  <input type="text" id="profile-first" required style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md);" />
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <label class="small-text" style="font-weight:600;">Last Name</label>
                  <input type="text" id="profile-last" required style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md);" />
                </div>
              </div>
              <button type="submit" class="btn btn-primary" style="padding: 10px 16px; border:none; font-weight:600; width: fit-content;">Save Profile Details</button>
            </form>
          </div>

          <!-- Tab 2: Display theme selection -->
          <div id="tab-display" class="settings-pane widget-card" style="display: none; flex-direction: column; gap: 20px;">
            <h3 class="card-title">Theme Preferences</h3>
            <p class="body-text">Tascorr natively adapts color schemes to optimize contrast boundaries across interfaces. Select a theme below to instantly apply it.</p>
            
            <div id="theme-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 16px; margin-top: 8px;">
              <!-- Themes injected by JS -->
            </div>
          </div>

          <!-- Tab 3: Organization Policies (Admin only) -->
          ${t?`
            <div id="tab-org" class="settings-pane widget-card" style="display: none; flex-direction: column; gap: 20px;">
              <h3 class="card-title">Company Account Details</h3>
              <form id="company-update-form" style="display: flex; flex-direction: column; gap: 16px; max-width: 500px;">
                <div style="display: flex; gap: 16px; align-items: flex-end;">
                  <!-- Logo Upload -->
                  <div style="position: relative; width: 64px; height: 64px; flex-shrink: 0; background-color: var(--bg-tertiary); border: 1px solid var(--border-neutral); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;">
                    <img id="company-logo-img" style="width: 100%; height: 100%; object-fit: contain; border-radius: var(--radius-md); display: none;" />
                    <span id="company-logo-fallback" style="font-weight: 700; color: var(--text-secondary); font-size: 24px;">?</span>
                    <label id="upload-logo-btn" style="position: absolute; bottom: -8px; right: -8px; background: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" title="Upload Logo">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 12px; height: 12px; color: var(--text-secondary);">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <input type="file" id="logo-upload-input" accept="image/*" style="display: none;" />
                    </label>
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
                    <label class="small-text" style="font-weight:600;">Company / Tenant Name</label>
                    <input type="text" id="company-name" required style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md);" />
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                  <input type="checkbox" id="company-cross-dept-peer" style="width: 16px; height: 16px; cursor: pointer;" />
                  <label for="company-cross-dept-peer" class="small-text" style="font-weight: 500; cursor: pointer; display: flex; align-items: center;">
                    Allow cross-department peer task assignment
                    <div class="tooltip-container">
                      <span class="help-icon">?</span>
                      <span class="tooltip-text">If enabled, employees can assign tasks to peers outside their own department.</span>
                    </div>
                  </label>
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <label for="company-sla-access" class="small-text" style="font-weight:600; display: flex; align-items: center;">
                    SLA Analytics Access Level
                    <div class="tooltip-container">
                      <span class="help-icon">?</span>
                      <span class="tooltip-text">Minimum rank level required to view the SLA Analytics page (lower numbers mean higher authority).</span>
                    </div>
                  </label>
                  <select id="company-sla-access" style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); background-color: var(--bg-secondary);">
                    <option value="0">Level 0 (Root Admin Only)</option>
                    <option value="1">Level 1 and above</option>
                    <option value="2">Level 2 and above</option>
                    <option value="3">Level 3 and above</option>
                    <option value="4">Level 4 and above</option>
                    <option value="5">Level 5 and above</option>
                    <option value="6">Level 6 and above (Everyone)</option>
                  </select>
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <label class="small-text" style="font-weight:600;">Subscription Tier</label>
                  <input type="text" id="company-tier" disabled style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); background-color: var(--bg-tertiary);" />
                </div>
                <button type="submit" class="btn btn-primary" style="padding: 10px 16px; border:none; font-weight:600; width: fit-content;">Save Company Details</button>
              </form>

              <hr style="border: 0; border-top: 1px solid var(--border-neutral); margin: 8px 0;" />

              <h3 class="card-title">Corporate Approval Rules</h3>
              <div style="display: flex; align-items: center; justify-content: space-between; max-width: 500px; padding: 12px 16px; background-color: var(--bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--border-neutral);">
                <div>
                  <strong class="data-number">Enterprise Approval Mode</strong>
                  <p class="small-text">Enforces sequential rank-based approvals for cross-department resource changes.</p>
                </div>
                <label style="position: relative; display: inline-block; width: 44px; height: 24px; cursor: pointer;">
                  <input type="checkbox" id="approval-mode-chk" style="opacity: 0; width: 0; height: 0;" />
                  <span style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--border-neutral); border-radius: 24px; transition: 0.2s;" class="slider"></span>
                </label>
              </div>

              <hr style="border: 0; border-top: 1px solid var(--border-neutral); margin: 8px 0;" />

              <h3 class="card-title">Hierarchy Settings</h3>
              <form id="top-rank-form" style="display: flex; flex-direction: column; gap: 16px; max-width: 500px;">
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <label class="small-text" style="font-weight:600;">Top Level Executive Title</label>
                  <input type="text" id="top-rank-title" required placeholder="e.g. CEO, Chairman, President" style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); background-color: var(--bg-secondary); color: var(--text-primary);" />
                  <p class="small-text" style="color: var(--text-secondary); margin-top: 4px;">This title appears at the root of the organization chart. This position can assign tasks to anyone in the company.</p>
                </div>
                <button type="submit" class="btn btn-primary" style="padding: 10px 16px; border:none; font-weight:600; width: fit-content;">Save Hierarchy Setup</button>
              </form>
            </div>
          `:""}
        </div>
      </div>
    </div>
  `}function ot(){var n,v,r;const t=document.querySelectorAll(".settings-tab-btn"),s=document.querySelectorAll(".settings-pane");t.forEach(g=>{g.addEventListener("click",()=>{t.forEach(p=>{p.classList.remove("active"),p.style.color="var(--text-secondary)",p.style.fontWeight="500"}),g.classList.add("active"),g.style.color="var(--accent-navy-primary)",g.style.fontWeight="600";const o=g.dataset.tab;s.forEach(p=>{p.style.display=p.id===o?"flex":"none"})})});const i=document.getElementById("profile-first"),d=document.getElementById("profile-last"),u=document.getElementById("profile-email");if($.currentUser&&(i&&(i.value=$.currentUser.firstName||""),d&&(d.value=$.currentUser.lastName||""),u&&(u.value=$.currentUser.email||"")),(n=document.getElementById("profile-update-form"))==null||n.addEventListener("submit",async g=>{g.preventDefault();const o=i.value.trim(),p=d.value.trim();if(!o||!p){T.error("Validation Error","First name and Last name are required.");return}try{const a=await L("PATCH",`/users/${$.currentUser.id}`,{firstName:o,lastName:p});$.currentUser.firstName=a.user.firstName,$.currentUser.lastName=a.user.lastName,localStorage.setItem("tascorr_user",JSON.stringify($.currentUser));const m=document.getElementById("header-user-role");m&&(m.innerText=`${$.currentUser.tenantName||`${$.currentUser.firstName} ${$.currentUser.lastName}`} (${$.currentUser.rankTitle})`),T.success("Profile Saved","Account credentials updated successfully.")}catch(a){T.error("Save Failed",a.message||"An error occurred while saving profile.")}}),$.isAdmin()){L("GET","/users/tenant/details").then(p=>{if(p&&p.tenant){const a=document.getElementById("company-name"),m=document.getElementById("company-tier"),b=document.getElementById("company-cross-dept-peer"),y=document.getElementById("company-sla-access"),l=document.getElementById("company-logo-img"),x=document.getElementById("company-logo-fallback");a&&(a.value=p.tenant.name||""),b&&(b.checked=p.tenant.allowCrossDeptPeerAssignment!==!1),y&&(y.value=p.tenant.slaAccessLevel??3),m&&(m.value=`Tier ${p.tenant.subscriptionTier} Startup (Active)`),l&&x&&(l.src=`/avatars/tenant-${p.tenant.id}.jpg?t=${Date.now()}`,l.onload=()=>{l.style.display="block",x.style.display="none"},l.onerror=()=>{var k;l.style.display="none",x.style.display="block",x.innerText=((k=p.tenant.name)==null?void 0:k[0])||"?"})}}).catch(p=>console.error("Failed to load company details",p)),L("GET","/users/ranks").then(p=>{const m=(p.ranks||[]).find(b=>b.level===1);m&&document.getElementById("top-rank-title")&&(document.getElementById("top-rank-title").value=m.title,document.getElementById("top-rank-title").dataset.id=m.id)}).catch(p=>console.error("Failed to load ranks",p)),(v=document.getElementById("company-update-form"))==null||v.addEventListener("submit",async p=>{p.preventDefault();const a=document.getElementById("company-name"),m=document.getElementById("company-cross-dept-peer"),b=document.getElementById("company-sla-access"),y=a.value.trim(),l=m?m.checked:!0,x=b?Number(b.value):3;if(!y){T.error("Validation Error","Company name is required.");return}try{const k=await L("PATCH","/users/tenant/details",{name:y,allowCrossDeptPeerAssignment:l,slaAccessLevel:x});if($.currentUser){$.currentUser.tenantName=k.tenant.name,$.currentUser.tenant=k.tenant,localStorage.setItem("tascorr_user",JSON.stringify($.currentUser));const h=document.getElementById("header-user-role");h&&(h.innerText=`${k.tenant.name} (${$.currentUser.rankTitle})`);const w=document.getElementById("breadcrumbs");w&&(w.innerHTML=`
              <span class="body-text" style="font-weight: 500;">${k.tenant.name}</span>
              <span class="small-text" style="margin: 0 8px; color: var(--text-secondary);">&rarr;</span>
              <span class="body-text" style="font-weight: 600; color: var(--text-primary);">Settings</span>
            `)}T.success("Company Saved","Company details updated successfully.")}catch(k){T.error("Save Failed",k.message||"An error occurred.")}}),(r=document.getElementById("top-rank-form"))==null||r.addEventListener("submit",async p=>{p.preventDefault();const a=document.getElementById("top-rank-title"),m=a==null?void 0:a.dataset.id,b=a==null?void 0:a.value;if(!m){T.error("Update Failed","Top level rank could not be identified.");return}try{await L("PATCH",`/users/ranks/${m}`,{title:b}),T.success("Hierarchy Saved","Top level executive title updated successfully.")}catch(y){T.error("Update Failed",y.message||"Could not update hierarchy.")}});const g=document.getElementById("upload-logo-btn"),o=document.getElementById("logo-upload-input");o==null||o.addEventListener("change",async p=>{const a=p.target.files[0];if(!a)return;const m=new FileReader;m.onloadend=async()=>{const b=m.result;try{g&&(g.style.opacity="0.5");const y=await L("POST","/upload/tenant-logo",{imageBase64:b});T.success("Logo Updated","Company logo uploaded successfully.");const l=document.getElementById("company-logo-img"),x=document.getElementById("company-logo-fallback");l&&(l.src=y.logoUrl,l.style.display="block"),x&&(x.style.display="none");const k=document.getElementById("brand-logo");k&&(k.src=y.logoUrl)}catch(y){console.error(y),T.error("Upload Failed",y.message)}finally{g&&(g.style.opacity="1")}},m.readAsDataURL(a)})}const e=[{id:"light",name:"Light",color:"#EAEFF8",sidebar:"rgba(226, 232, 240, 0.9)"},{id:"dark",name:"Dark",color:"#0b0b0f",sidebar:"rgba(15, 15, 20, 0.9)"},{id:"corporate",name:"Corporate",color:"#F8FAFC",sidebar:"rgba(203, 213, 225, 0.9)"},{id:"ocean",name:"Ocean",color:"#F0F9FF",sidebar:"rgba(125, 211, 252, 0.9)"},{id:"forest",name:"Forest",color:"#F0FDF4",sidebar:"rgba(134, 239, 172, 0.9)"},{id:"sunset",name:"Sunset",color:"#FFF7ED",sidebar:"rgba(253, 186, 116, 0.9)"},{id:"lavender",name:"Lavender",color:"#FAF5FF",sidebar:"rgba(216, 180, 254, 0.9)"},{id:"midnight",name:"Midnight",color:"#05050A",sidebar:"rgba(5, 5, 10, 0.9)"}],c=()=>{const g=document.getElementById("theme-grid");if(!g)return;const o=document.documentElement.getAttribute("data-theme")||"light";g.innerHTML=e.map(p=>`
      <button class="theme-select-btn" data-theme-val="${p.id}" style="padding: 16px; border-radius: var(--radius-md); border: 2px solid ${o===p.id?"var(--accent-navy-primary)":"var(--border-neutral)"}; background-color: var(--bg-secondary); cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px; transition: all 0.2s ease;">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, ${p.sidebar} 50%, ${p.color} 50%); box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.1);"></div>
        <span style="font-weight: 600; color: var(--text-primary); font-size: 12px;">${p.name}</span>
      </button>
    `).join(""),g.querySelectorAll(".theme-select-btn").forEach(p=>{p.addEventListener("click",()=>{const a=p.dataset.themeVal;document.documentElement.setAttribute("data-theme",a),localStorage.setItem("tascorr_theme",a),window.dispatchEvent(new CustomEvent("themeChanged",{detail:a})),c(),T.info("Theme Applied",`${e.find(m=>m.id===a).name} theme activated.`)})})};c(),window.addEventListener("themeChanged",()=>{const g=document.getElementById("tab-display");g&&g.style.display!=="none"&&c()})}let U=null,He=[];function lt(){return`
    <div style="display: flex; flex-direction: column; gap: 32px; max-width: 1200px; margin: 0 auto;">
      <!-- Profile Header widget -->
      <div class="widget-card" style="display: flex; gap: 24px; align-items: center; flex-wrap: wrap;">
        <!-- Avatar Upload / Display -->
        <div style="position: relative; width: 80px; height: 80px; flex-shrink: 0;">
          <img id="profile-avatar-img" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: none;" />
          <div id="profile-avatar" style="width: 100%; height: 100%; border-radius: 50%; background-color: var(--accent-navy-light); color: var(--accent-navy-primary); display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; font-family: var(--font-display);">
            T
          </div>
          <label id="upload-avatar-btn" style="display: none; position: absolute; bottom: 0; right: 0; background: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: 50%; width: 24px; height: 24px; cursor: pointer; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" title="Upload Avatar">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 14px; height: 14px; color: var(--text-secondary);">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <input type="file" id="avatar-upload-input" accept="image/*" style="display: none;" />
          </label>
        </div>

        <div style="flex: 1; min-width: 200px;">
          <h1 id="profile-name" class="page-title" style="font-size: 28px;">--</h1>
          <p id="profile-rank" class="body-text" style="font-weight: 600; color: var(--accent-navy-primary); margin-top: 4px;">--</p>
          <div style="display: flex; gap: 12px; margin-top: 8px; flex-wrap: wrap;">
            <span id="profile-dept-badge" class="pill-badge status-info">--</span>
            <span id="profile-status-badge" class="pill-badge status-success">--</span>
          </div>
        </div>

        <!-- Organization details -->
        <div style="padding-left: 24px; border-left: 1px solid var(--border-neutral); display: flex; align-items: center; gap: 12px; min-width: 200px;">
          <div style="width: 48px; height: 48px; flex-shrink: 0; background-color: var(--bg-tertiary); border: 1px solid var(--border-neutral); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; position: relative;">
            <img id="profile-company-logo-img" style="width: 100%; height: 100%; object-fit: contain; border-radius: var(--radius-md); display: none;" />
            <span id="profile-company-logo-fallback" style="font-weight: 700; color: var(--text-secondary); font-size: 18px;">?</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <span class="small-text" style="color: var(--text-secondary); font-weight: 500;">Organization</span>
            <strong id="profile-company-name" style="color: var(--text-primary); font-size: 14px;">--</strong>
          </div>
        </div>

        <!-- Contact details -->
        <div style="padding-left: 24px; border-left: 1px solid var(--border-neutral); display: flex; flex-direction: column; gap: 6px; min-width: 220px;">
          <span class="small-text">Email Address: <strong id="profile-email-label" style="color: var(--text-primary);">--</strong></span>
          <span class="small-text">Member Since: <strong id="profile-joined-label" style="color: var(--text-primary);">--</strong></span>
        </div>
      </div>

      <!-- Password Reset (Only visible to self) -->
      <div id="profile-security-widget" class="widget-card" style="display: none; flex-direction: column; gap: 16px; max-width: 500px;">
        <h3 class="card-title">Security Settings</h3>
        <p class="body-text" style="font-size: 13px; margin-top: -8px;">Update your account password. Requires at least 8 characters.</p>
        <form id="profile-password-form" style="display: flex; flex-direction: column; gap: 12px;">
          <input type="password" id="profile-new-password" placeholder="New Password" required minlength="8" style="padding: 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); background: var(--bg-primary); color: var(--text-primary); outline: none;" />
          <input type="password" id="profile-confirm-password" placeholder="Confirm Password" required minlength="8" style="padding: 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); background: var(--bg-primary); color: var(--text-primary); outline: none;" />
          <button type="submit" class="btn btn-primary" style="align-self: flex-start; padding: 10px 24px;">Change Password</button>
        </form>
      </div>

      <!-- Task History and Performance Matrix -->
      <div class="widget-card" style="display: flex; flex-direction: column; gap: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <h3 class="card-title">Assigned Workforce History</h3>
          
          <!-- Interval filtering (Section 4 C5 requirement) -->
          <div style="display: flex; gap: 4px; background-color: var(--bg-secondary); padding: 4px; border-radius: var(--radius-md); border: 1px solid var(--border-neutral);">
            <button class="profile-filter-btn active" data-range="week" style="padding: 6px 12px; border:none; background:var(--bg-primary); border-radius:var(--radius-sm); font-size:11px; font-weight:600; cursor:pointer; color:var(--accent-navy-primary);">This Week</button>
            <button class="profile-filter-btn" data-range="month" style="padding: 6px 12px; border:none; background:none; border-radius:var(--radius-sm); font-size:11px; font-weight:500; cursor:pointer; color:var(--text-secondary);">This Month</button>
            <button class="profile-filter-btn" data-range="year" style="padding: 6px 12px; border:none; background:none; border-radius:var(--radius-sm); font-size:11px; font-weight:500; cursor:pointer; color:var(--text-secondary);">This Year</button>
          </div>
        </div>

        <!-- Task table -->
        <div style="overflow-x: auto;">
          <table style="width:100%; border-collapse: collapse; text-align: left; font-size: 13px;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border-neutral); background-color: var(--bg-secondary);">
                <th style="padding: 12px; font-weight:600; color:var(--text-secondary);">Task Details</th>
                <th style="padding: 12px; font-weight:600; color:var(--text-secondary);">Priority</th>
                <th style="padding: 12px; font-weight:600; color:var(--text-secondary);">Target Due Date</th>
                <th style="padding: 12px; font-weight:600; color:var(--text-secondary);">SLA Status</th>
              </tr>
            </thead>
            <tbody id="profile-tasks-body">
              <!-- Populated dynamically -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `}async function dt(){var d,u,e,c;const t=document.getElementById("profile-name");if(!t)return;const s=localStorage.getItem("target_profile_id"),i=s?Number(s):(d=$.currentUser)==null?void 0:d.id;localStorage.removeItem("target_profile_id");try{const[n,v]=await Promise.all([L("GET",`/users/${i}`),L("GET","/tasks")]);U=n.user,He=(v.tasks||[]).filter(l=>{var x;return(x=l.assignments)==null?void 0:x.some(k=>k.userId===i&&k.isActive)}),t.innerText=`${U.firstName} ${U.lastName}`;const g=document.getElementById("profile-avatar-img"),o=document.getElementById("profile-avatar");g.src=`/avatars/user-${U.id}.jpg?t=${Date.now()}`,g.onload=()=>{g.style.display="block",o.style.display="none"},g.onerror=()=>{g.style.display="none",o.style.display="flex",o.innerText=U.firstName[0]};const p=document.getElementById("profile-company-logo-img"),a=document.getElementById("profile-company-logo-fallback"),m=document.getElementById("profile-company-name");if(m&&(m.innerText=U.tenantName||"Tascorr Workspace"),p&&a&&(U.tenantLogoUrl?(p.src=`${U.tenantLogoUrl}?t=${Date.now()}`,p.onload=()=>{p.style.display="block",a.style.display="none"},p.onerror=()=>{var l;p.style.display="none",a.style.display="flex",a.innerText=((l=U.tenantName)==null?void 0:l[0])||"?"}):(p.style.display="none",a.style.display="flex",a.innerText=((u=U.tenantName)==null?void 0:u[0])||"?")),document.getElementById("profile-rank").innerText=`${U.rank} (Hierarchy level ${U.rankLevel})`,document.getElementById("profile-dept-badge").innerText=U.department||"General / Corporate",document.getElementById("profile-status-badge").innerText=U.status,document.getElementById("profile-email-label").innerText=U.email,document.getElementById("profile-joined-label").innerText=new Date(U.createdAt).toLocaleDateString(),i===((e=$.currentUser)==null?void 0:e.id)||$.isAdmin()){const l=document.getElementById("upload-avatar-btn"),x=document.getElementById("avatar-upload-input");l&&(l.style.display="flex"),x==null||x.addEventListener("change",async k=>{const h=k.target.files[0];if(!h)return;const w=new FileReader;w.onloadend=async()=>{const f=w.result;try{l.style.opacity="0.5";const I=await L("POST","/upload/avatar",{imageBase64:f,targetUserId:i});T.success("Avatar Updated","Profile picture updated successfully."),g.src=`${I.avatarUrl}?t=${Date.now()}`,g.style.display="block",o.style.display="none",document.dispatchEvent(new CustomEvent("tascorr_avatar_updated"))}catch(I){console.error(I),T.error("Upload Failed",I.message)}finally{l.style.opacity="1"}},w.readAsDataURL(h)})}const b=document.getElementById("profile-security-widget");if(i===((c=$.currentUser)==null?void 0:c.id)){b&&(b.style.display="flex");const l=document.getElementById("profile-password-form");l&&l.addEventListener("submit",async x=>{x.preventDefault();const k=document.getElementById("profile-new-password").value,h=document.getElementById("profile-confirm-password").value;if(k!==h)return T.error("Password Mismatch","The new passwords do not match.");if(k.length<8)return T.error("Invalid Password","Password must be at least 8 characters long.");const w=l.querySelector("button"),f=w.innerText;try{w.disabled=!0,w.innerText="Updating...",await L("PATCH",`/users/${i}`,{password:k}),T.success("Password Updated","Your password has been changed successfully."),l.reset()}catch(I){console.error(I),T.error("Update Failed",I.message)}finally{w.disabled=!1,w.innerText=f}})}ze("week");const y=document.querySelectorAll(".profile-filter-btn");y.forEach(l=>{l.addEventListener("click",()=>{y.forEach(x=>{x.classList.remove("active"),x.style.background="none",x.style.color="var(--text-secondary)",x.style.fontWeight="500"}),l.classList.add("active"),l.style.background="var(--bg-primary)",l.style.color="var(--accent-navy-primary)",l.style.fontWeight="600",ze(l.dataset.range)})})}catch(n){console.error(n),T.error("Profile Load Failed",n.message)}}function ze(t){const s=document.getElementById("profile-tasks-body");if(!s)return;const i=new Date,d=new Date;t==="week"?d.setDate(i.getDate()-7):t==="month"?d.setMonth(i.getMonth()-1):t==="year"&&d.setFullYear(i.getFullYear()-1);const u=He.filter(e=>new Date(e.createdAt)>=d);if(u.length===0){s.innerHTML='<tr><td colspan="4" style="padding: 24px; text-align: center; color: var(--text-secondary);">No workforce history found for this range.</td></tr>';return}s.innerHTML=u.map(e=>{const n={Pending:"status-info","In Progress":"status-info",Blocked:"status-danger","Under Review":"status-warning",Completed:"status-success"}[e.status]||"status-info";return`
      <tr style="border-bottom: 1px solid var(--border-neutral);">
        <td style="padding: 12px; font-weight:600;">
          <div style="font-size:13px; color:var(--text-primary);">${e.title}</div>
        </td>
        <td style="padding: 12px;">
          <span class="pill-badge status-info" style="font-size:10px; padding:2px 6px;">${e.priority}</span>
        </td>
        <td style="padding: 12px; color: var(--text-secondary);">${new Date(e.dueDate).toLocaleDateString()}</td>
        <td style="padding: 12px;">
          <span class="pill-badge ${n}"><span class="badge-dot"></span>${e.status}</span>
        </td>
      </tr>
    `}).join("")}function ct(){const t=[{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-check"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>',title:"Smart Task Assignment",description:"Assign work across your team with full visibility into who's available, who's overloaded, and who's the right fit — before you hit assign."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list-tree"><path d="M21 12h-8"/><path d="M21 6H8"/><path d="M21 18h-8"/><path d="M8 6v14"/><path d="M3 6v.01"/><path d="M3 12v.01"/><path d="M3 18v.01"/></svg>',title:"Subtasks & Dependencies",description:"Break large initiatives into trackable pieces, and set up tasks that automatically wait their turn — no more starting work out of order."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-globe"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',title:"Remote Delegation & Monitoring",description:"Manage your business and orchestrate workforce operations from anywhere. Delegate tasks, check progress, and coordinate with off-site subordinates asynchronously.",featured:!0},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wifi-off"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.5"/><path d="M5 12.5a10.94 10.94 0 0 1 5.83-2.84"/><path d="M12 12.5a15.66 15.66 0 0 1-5.83-2.84"/><path d="M18.83 9.66A15.66 15.66 0 0 1 20 10.5"/><path d="M7.76 4.7a18.3 18.3 0 0 1 8.24 0"/></svg>',title:"Offline-First Resilience",description:"Perform task updates, log blockers, and manage work without an internet connection. Changes sync automatically when you are back online."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>',title:"Cross-Department Collaboration",description:"Request access to assign work outside your department, with time-limited approvals and a full record of who authorized what."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-line-chart"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>',title:"Performance & SLA Analytics",description:"See how quickly blockers get resolved, how long approvals take, and where your organization needs attention — all in one view."}],s=[{number:"01",title:"Set Up Your Structure",description:"Define your departments, ranks, and people once."},{number:"02",title:"Assign & Track",description:"Delegate tasks across your organization with full context."},{number:"03",title:"See What's Happening",description:"Get a real-time picture of what's done, what's stuck, and why."}],i=[{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',name:"Employees",line:"A simple view of what's yours to do."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',name:"Managers",line:"Live visibility into your team's work."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',name:"Department Heads",line:"Full control across your department."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-briefcase"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',name:"Executives",line:"A real-time pulse on the whole organization."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings-2"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>',name:"Admins",line:"Configure your company without writing code."}],d=[{name:"Tier 1 (Startup)",price:"Lifetime Free",description:"For small organizations up to 10 employee accounts.",features:["Up to 10 employee accounts","Basic task assignment","Standard hierarchies"],featured:!1},{name:"Tier 2 (Small Biz)",price:"499 MVR/mo",description:"For small organizations up to 30 employee accounts.",features:["Up to 30 employee accounts","Cross-department delegation","Basic trace trails"],featured:!1},{name:"Tier 3 (Growth)",price:"999 MVR/mo",description:"For mid-scale organizations up to 100 employee accounts.",features:["Up to 100 employee accounts","Advanced trace trails","Priority support"],featured:!0},{name:"Tier 4 (Enterprise)",price:"5,000 MVR/mo",description:"For corporate networks up to 1000 employee accounts.",features:["Up to 1000 employee accounts","SLA & analytics dashboard","Dedicated account manager"],featured:!1}],u=[{name:"Companies Registered",value:"2+",icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>'},{name:"Active Employees",value:"10+",icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'},{name:"Tasks Delegated",value:"200+",icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle-2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>'},{name:"Blockers Resolved",value:"99%",icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>'}];return`
    <div id="v0-landing">
      
      <!-- HERO -->
      <section class="v0-hero">
        <div class="v0-hero-glow-1"></div>
        <div class="v0-hero-glow-2"></div>
        <div class="v0-container">
          <img src="/tassCorr_logo.png" class="v0-hero-logo" alt="Tascorr Logo" />
          <h1 class="v0-hero-title">Tascorr</h1>
          <p class="v0-hero-subtitle">Assign it. Track it. Own it.</p>
          <p class="v0-hero-desc">
            The workforce accountability layer that maps your company hierarchy,
            tracks assignments with absolute clarity, and flags blockers
            transparently.
          </p>
          <div class="v0-hero-actions">
            <a href="#login" class="v0-btn v0-btn-highlighted">Sign In</a>
            <a href="#signup" class="v0-btn v0-btn-outline">Register Company</a>
          </div>
        </div>
      </section>

      <!-- FEATURES -->
      <section class="v0-section">
        <div class="v0-container" style="max-width: 64rem;">
          <h2 class="v0-section-title">Operational Features & Trace Trails</h2>
          <div class="v0-grid-3">
            ${t.map(e=>`
              <div class="v0-card ${e.featured?"v0-pricing-featured":""}">
                <div class="v0-icon-wrapper">
                  ${e.icon}
                </div>
                <h3 class="v0-card-title">${e.title}</h3>
                <p class="v0-card-desc">${e.description}</p>
              </div>
            `).join("")}
          </div>
        </div>
      </section>

      <!-- HOW IT WORKS -->
      <section class="v0-section">
        <div class="v0-container" style="max-width: 64rem;">
          <h2 class="v0-section-title">How It Works</h2>
          <div class="v0-grid-3">
            ${s.map(e=>`
              <div class="v0-card">
                <span style="font-size: 1.875rem; font-weight: 700; color: #2d6cdf;">${e.number}</span>
                <h3 class="v0-card-title">${e.title}</h3>
                <p class="v0-card-desc">${e.description}</p>
              </div>
            `).join("")}
          </div>
        </div>
      </section>

      <!-- ROLES -->
      <section class="v0-section">
        <div class="v0-container" style="max-width: 72rem;">
          <h2 class="v0-section-title">Built For Every Role</h2>
          <div class="v0-grid-5">
            ${i.map(e=>`
              <div class="v0-card">
                <div class="v0-icon-wrapper small">
                  ${e.icon}
                </div>
                <h3 class="v0-card-title" style="font-size: 1.125rem;">${e.name}</h3>
                <p class="v0-card-desc" style="font-size: 0.875rem;">${e.line}</p>
              </div>
            `).join("")}
          </div>
        </div>
      </section>

      <!-- PRICING -->
      <section class="v0-section" style="position: relative;">
        <div style="position: absolute; left: 50%; top: 0; width: 820px; height: 520px; border-radius: 50%; opacity: 0.12; transform: translateX(-50%); background: radial-gradient(circle, #2d6cdf 0%, transparent 70%); pointer-events: none;"></div>
        <div class="v0-container" style="max-width: 64rem;">
          <div style="text-align: center;">
            <h2 class="v0-section-title">Find the <span style="color: #2d6cdf;">Perfect Plan</span> for Your Business</h2>
            <p class="v0-hero-desc" style="margin-top: 1rem;">Start for free, then grow with us. Flexible plans for organisations of all sizes.</p>
          </div>
          <div class="v0-grid-4">
            ${d.map(e=>`
              <div class="v0-card ${e.featured?"v0-pricing-featured":""}" style="display: flex; flex-direction: column;">
                <h3 style="font-weight: 600; color: var(--text-primary);">${e.name}</h3>
                <div class="v0-pricing-price">${e.price}</div>
                <p class="v0-card-desc" style="margin-top: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1.5rem;">${e.description}</p>
                <ul style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; list-style: none; padding: 0;">
                  ${e.features.map(c=>`
                    <li style="display: flex; gap: 0.75rem; color: var(--text-secondary); align-items: center;">
                      <svg class="size-5 text-primary" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2d6cdf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ${c}
                    </li>
                  `).join("")}
                </ul>
                <div style="margin-top: auto; padding-top: 2rem;">
                  <a href="#signup" class="v0-btn ${e.featured?"v0-btn-primary":"v0-btn-secondary"}">Get Started</a>
                </div>
              </div>
            `).join("")}
          </div>
          <div style="text-align: center; margin-top: 2rem; color: var(--text-secondary);">
            Have more than 1000 employees? Contact us for a custom enterprise package: <strong style="color: #2d6cdf;">+960 7451198 / +960 7793811</strong>
          </div>
        </div>
      </section>

      <!-- TRUST STRIP -->
      <section class="v0-section" style="padding: 4rem 1.5rem;">
        <div class="v0-container" style="max-width: 64rem;">
          <p style="text-align: center; margin-bottom: 2.5rem; color: #2d6cdf; font-size: 0.875rem;">
            Join us to raise these numbers.
          </p>
          <div class="trust-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; text-align: center;">
            ${u.map(e=>`
              <div style="display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
                <div style="color: #2d6cdf;">${e.icon}</div>
                <span style="font-size: 0.875rem; font-weight: 500; color: var(--text-secondary);">${e.name}</span>
                <span style="font-size: 1.5rem; font-weight: 700; color: var(--text-secondary);">${e.value}</span>
              </div>
            `).join("")}
          </div>
        </div>
      </section>
      <style>
        @media (min-width: 1024px) {
          .trust-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
      </style>

      <!-- FOOTER -->
      <footer class="v0-footer">
        <div class="v0-footer-content">
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 0.625rem;">
              <img src="/tassCorr_logo.png" style="height: 2.5rem; width: auto; object-fit: contain;" alt="Tascorr Logo" />
              <span style="font-size: 1.125rem; font-weight: 700; color: var(--text-secondary);">Tascorr</span>
            </div>
            <p style="max-width: 25rem; font-size: 0.875rem; line-height: 1.625; color: var(--text-secondary);">
              Assign it. Track it. Own it. The workforce accountability layer for modern organizations. A product by ThinkSAFE Maldives Pvt Ltd.
            </p>
          </div>
          <nav style="display: flex; gap: 1.5rem;">
            <a href="#login" style="font-size: 0.875rem; color: var(--text-secondary); text-decoration: none;">Sign In</a>
            <a href="#signup" style="font-size: 0.875rem; color: var(--text-secondary); text-decoration: none;">Register</a>
            <a href="#pricing" style="font-size: 0.875rem; color: var(--text-secondary); text-decoration: none;">Pricing</a>
          </nav>
        </div>
      </footer>

    </div>
  `}let be=[],G=1,pe=1;function pt(){return`
    <div style="display: flex; flex-direction: column; gap: 32px; max-width: 1200px; margin: 0 auto;">
      <!-- Title -->
      <div>
        <h1 class="page-title">Superadmin Console</h1>
        <p class="body-text">Manage tenant subscriptions, platform configurations, and global security audit trails.</p>
      </div>

      <!-- Unauthorized banner (fallback boundary safeguard check) -->
      <div id="superadmin-unauthorized" style="display: none; padding: 32px; text-align: center; background-color: rgba(220, 38, 38, 0.05); border: 1px dashed var(--status-danger); border-radius: var(--radius-lg);">
        <strong style="color: var(--status-danger); font-size: 16px;">Access Denied</strong>
        <p class="body-text" style="margin-top: 8px;">Global Superadmin authorization context is required to view these administrative endpoints.</p>
      </div>

      <!-- Content Grid -->
      <div id="superadmin-content" style="display: flex; flex-direction: column; gap: 32px;">
        <!-- Top: Tenant Provisioning Drawer Card -->
        <div class="widget-card" style="display: flex; flex-direction: column; gap: 20px;">
          <h3 class="card-title">Onboard New Organization Tenant</h3>
          <div id="tenant-error-alert" style="display: none; padding: 12px; background-color: rgba(220, 38, 38, 0.1); color: var(--status-danger); font-size: 13px; font-weight: 500; border-radius: var(--radius-md);"></div>
          
          <form id="onboard-tenant-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; max-width: 800px;">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label for="tenant-name" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Organization Name
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">The registered name of the client company.</span>
                </div>
              </label>
              <input type="text" id="tenant-name" required placeholder="Acme International" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md);" />
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label for="tenant-tier" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Subscription Level Tier
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">Determines the maximum number of active users allowed.</span>
                </div>
              </label>
              <select id="tenant-tier" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md); background:var(--bg-secondary);">
                <option value="1">Tier 1 (Startup: 10 user cap)</option>
                <option value="2">Tier 2 (Growth: 100 user cap)</option>
                <option value="3">Tier 3 (Enterprise: Unlimited)</option>
              </select>
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label for="tenant-email" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Admin User Email
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">The root administrator's login email.</span>
                </div>
              </label>
              <input type="email" id="tenant-email" required placeholder="admin@acme.com" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md);" />
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label for="tenant-password" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Admin User Password
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">The root administrator's initial login key.</span>
                </div>
              </label>
              <input type="password" id="tenant-password" required placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md);" />
            </div>

            <div style="grid-column: span 2; margin-top: 8px;">
              <button type="submit" class="btn btn-primary" style="padding: 10px 20px; border:none; font-weight:600; width:fit-content;">Onboard Organization</button>
            </div>
          </form>
        </div>

        <!-- Bottom: Platform Audit Logs and Tenants list -->
        <div style="display: grid; grid-template-columns: 1fr; gap: 32px;">
          <!-- Registered Organizations -->
          <div class="widget-card" style="display: flex; flex-direction: column; gap: 16px;">
            <h3 class="card-title">Registered Organizations</h3>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                <thead>
                  <tr style="border-bottom: 2px solid var(--border-neutral); background-color: var(--bg-secondary);">
                    <th style="padding: 12px; font-weight:600;">Company Name</th>
                    <th style="padding: 12px; font-weight:600;">Subscription Tier</th>
                    <th style="padding: 12px; font-weight:600;">Registered At</th>
                    <th style="padding: 12px; font-weight:600;">Staff Count</th>
                    <th style="padding: 12px; font-weight:600;">Tasks Created</th>
                  </tr>
                </thead>
                <tbody id="registered-companies-body">
                  <tr>
                    <td colspan="5" style="padding: 24px; text-align: center; color: var(--text-secondary);">Loading registered organizations...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Global Audit Trails -->
          <div class="widget-card" style="display: flex; flex-direction: column; gap: 16px;">
            <h3 class="card-title">Global Audit & Session Logs</h3>
            
            <!-- Advanced Filters -->
            <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; padding: 12px 16px; background-color: var(--bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--border-neutral);">
              <div style="display: flex; flex-direction: column; gap: 4px; min-width: 150px; flex: 1;">
                <label class="small-text" style="font-weight: 600;">Actor Email</label>
                <input type="text" id="log-actor-filter" placeholder="Filter by email..." style="padding: 6px 10px; border: 1px solid var(--border-neutral); border-radius: var(--radius-sm); font-size: 12px; background: var(--bg-primary); color: var(--text-primary); outline: none;" />
              </div>
              <div style="display: flex; flex-direction: column; gap: 4px; min-width: 150px; flex: 1;">
                <label class="small-text" style="font-weight: 600;">Company Name</label>
                <input type="text" id="log-company-filter" placeholder="Filter by company..." style="padding: 6px 10px; border: 1px solid var(--border-neutral); border-radius: var(--radius-sm); font-size: 12px; background: var(--bg-primary); color: var(--text-primary); outline: none;" />
              </div>
              <div style="display: flex; flex-direction: column; gap: 4px; min-width: 150px; flex: 1;">
                <label class="small-text" style="font-weight: 600;">Action Type</label>
                <input type="text" id="log-action-filter" placeholder="e.g. TASK_CREATE..." style="padding: 6px 10px; border: 1px solid var(--border-neutral); border-radius: var(--radius-sm); font-size: 12px; background: var(--bg-primary); color: var(--text-primary); outline: none;" />
              </div>
              <div style="display: flex; flex-direction: column; gap: 4px; min-width: 120px;">
                <label class="small-text" style="font-weight: 600;">Start Date</label>
                <input type="date" id="log-start-date" style="padding: 6px 10px; border: 1px solid var(--border-neutral); border-radius: var(--radius-sm); font-size: 12px; background: var(--bg-primary); color: var(--text-primary); outline: none;" />
              </div>
              <div style="display: flex; flex-direction: column; gap: 4px; min-width: 120px;">
                <label class="small-text" style="font-weight: 600;">End Date</label>
                <input type="date" id="log-end-date" style="padding: 6px 10px; border: 1px solid var(--border-neutral); border-radius: var(--radius-sm); font-size: 12px; background: var(--bg-primary); color: var(--text-primary); outline: none;" />
              </div>
              <div style="display: flex; flex-direction: column; gap: 4px; min-width: 120px;">
                <label class="small-text" style="font-weight: 600;">Sort Order</label>
                <select id="log-sort-order" style="padding: 6px 10px; border: 1px solid var(--border-neutral); border-radius: var(--radius-sm); font-size: 12px; background: var(--bg-primary); color: var(--text-primary); outline: none; height: 30px;">
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
              <button id="log-search-btn" class="btn btn-primary" style="height: 32px; min-height: 32px; padding: 0 16px; font-size: 12px; margin-top: 18px; border-radius: var(--radius-sm);">Search</button>
              <button id="log-clear-filters-btn" class="btn btn-secondary" style="height: 32px; min-height: 32px; padding: 0 12px; font-size: 12px; margin-top: 18px; border-radius: var(--radius-sm); margin-left: 8px;">Clear</button>
            </div>

            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                <thead>
                  <tr style="border-bottom: 2px solid var(--border-neutral); background-color: var(--bg-secondary);">
                    <th style="padding: 12px; font-weight:600;">Timestamp</th>
                    <th style="padding: 12px; font-weight:600;">Company</th>
                    <th style="padding: 12px; font-weight:600;">Actor</th>
                    <th style="padding: 12px; font-weight:600;">Action Type</th>
                    <th style="padding: 12px; font-weight:600;">Metadata Parameters</th>
                  </tr>
                </thead>
                <tbody id="global-audit-body">
                  <tr>
                    <td colspan="5" style="padding: 24px; text-align: center; color: var(--text-secondary);">No platform logs retrieved yet.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination Controls -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-top: 1px solid var(--border-neutral); background-color: var(--bg-secondary); border-radius: 0 0 var(--radius-lg) var(--radius-lg);">
              <button id="log-prev-page-btn" class="btn btn-secondary" style="height: 32px; min-height: 32px; padding: 0 12px; font-size: 12px; border-radius: var(--radius-sm);" disabled>Previous</button>
              <span id="log-page-info" class="small-text" style="font-weight: 600; color: var(--text-secondary);">Page 1 of 1 (0 logs)</span>
              <button id="log-next-page-btn" class="btn btn-secondary" style="height: 32px; min-height: 32px; padding: 0 12px; font-size: 12px; border-radius: var(--radius-sm);" disabled>Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `}async function ut(){const t=document.getElementById("superadmin-unauthorized"),s=document.getElementById("superadmin-content");if(!s)return;if(!$.isSuperadmin()){t.style.display="block",s.style.display="none";return}t.style.display="none",s.style.display="flex",await re(),await mt();const d=document.getElementById("log-actor-filter"),u=document.getElementById("log-company-filter"),e=document.getElementById("log-action-filter"),c=document.getElementById("log-start-date"),n=document.getElementById("log-end-date"),v=document.getElementById("log-sort-order"),r=document.getElementById("log-search-btn"),g=document.getElementById("log-clear-filters-btn"),o=document.getElementById("log-prev-page-btn"),p=document.getElementById("log-next-page-btn"),a=()=>{G=1,re()};r==null||r.addEventListener("click",a),[d,u,e,c,n].forEach(y=>{y==null||y.addEventListener("keydown",l=>{l.key==="Enter"&&a()})}),v==null||v.addEventListener("change",a),g==null||g.addEventListener("click",()=>{d&&(d.value=""),u&&(u.value=""),e&&(e.value=""),c&&(c.value=""),n&&(n.value=""),v&&(v.value="desc"),G=1,re()}),o==null||o.addEventListener("click",()=>{G>1&&(G--,re())}),p==null||p.addEventListener("click",()=>{G<pe&&(G++,re())});const m=document.getElementById("onboard-tenant-form");m==null||m.addEventListener("submit",async y=>{y.preventDefault();const l=document.getElementById("tenant-name").value.trim(),x=document.getElementById("tenant-email").value.trim(),k=document.getElementById("tenant-password").value,h=Number(document.getElementById("tenant-tier").value),w=document.getElementById("tenant-error-alert");if(w&&(w.style.display="none",w.innerText=""),k.length<12||!/[a-z]/.test(k)||!/[A-Z]/.test(k)||!/[0-9]/.test(k)||!/[^a-zA-Z0-9]/.test(k)){b("Administrator password must be at least 12 characters long and contain uppercase, lowercase, numbers, and symbols.");return}try{const f=m.querySelector('button[type="submit"]');f&&(f.disabled=!0,f.innerText="Creating Organization Workspace..."),await L("POST","/superadmin/tenants",{name:l,adminEmail:x,adminPassword:k,subscriptionTier:h}),T.success("Tenant Created","Company registered and admin account provisioned successfully."),m.reset(),await re()}catch(f){console.error(f),b(f.message||"Onboarding organization failed."),T.error("Onboarding Failed",f.message)}finally{const f=m==null?void 0:m.querySelector('button[type="submit"]');f&&(f.disabled=!1,f.innerText="Onboard Organization")}});function b(y){errorAlert&&(errorAlert.innerText=y,errorAlert.style.display="block")}}async function re(){var v,r,g,o,p,a;const t=document.getElementById("global-audit-body");if(!t)return;const s=((v=document.getElementById("log-actor-filter"))==null?void 0:v.value)||"",i=((r=document.getElementById("log-company-filter"))==null?void 0:r.value)||"",d=((g=document.getElementById("log-action-filter"))==null?void 0:g.value)||"",u=((o=document.getElementById("log-start-date"))==null?void 0:o.value)||"",e=((p=document.getElementById("log-end-date"))==null?void 0:p.value)||"",c=((a=document.getElementById("log-sort-order"))==null?void 0:a.value)||"desc",n=new URLSearchParams({page:G.toString(),limit:"100",actor:s,company:i,action:d,startDate:u,endDate:e,sortOrder:c});try{const m=await L("GET",`/superadmin/audit-logs?${n.toString()}`);be=m.logs||[],G=m.page||1,pe=m.totalPages||1;const b=document.getElementById("log-prev-page-btn"),y=document.getElementById("log-next-page-btn"),l=document.getElementById("log-page-info");if(b&&(b.disabled=G<=1),y&&(y.disabled=G>=pe),l&&(l.innerText=`Page ${G} of ${pe} (Total ${m.total||0} logs)`),be.length===0){t.innerHTML='<tr><td colspan="5" style="padding: 24px; text-align: center; color: var(--text-secondary);">No matching action history logged on the platform.</td></tr>';return}t.innerHTML=be.map(x=>{var k,h;return`
      <tr style="border-bottom: 1px solid var(--border-neutral);">
        <td style="padding: 12px; color: var(--text-secondary); font-size:12px;">${new Date(x.createdAt).toLocaleString()}</td>
        <td style="padding: 12px; font-weight:600; color: var(--text-primary);">${E(((k=x.tenant)==null?void 0:k.name)||"System")}</td>
        <td style="padding: 12px; font-weight:600;">${((h=x.actor)==null?void 0:h.email)||"System"}</td>
        <td style="padding: 12px;"><span class="pill-badge status-info" style="font-size:10px; padding:2px 6px;">${x.action}</span></td>
        <td style="padding: 12px; font-family: monospace; font-size: 11px; max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${x.metadata}">${x.metadata||"{}"}</td>
      </tr>
    `}).join("")}catch(m){console.error(m),t.innerHTML=`<tr><td colspan="5" style="padding: 24px; text-align: center; color: var(--status-danger);">Failed to load platform log: ${m.message}</td></tr>`}}async function mt(){const t=document.getElementById("registered-companies-body");if(t)try{const i=(await L("GET","/superadmin/tenants")).tenants||[];if(i.length===0){t.innerHTML='<tr><td colspan="5" style="padding: 24px; text-align: center; color: var(--text-secondary);">No organizations registered on the platform yet.</td></tr>';return}t.innerHTML=i.map(d=>{const u=new Date(d.createdAt).toLocaleString();return`
        <tr style="border-bottom: 1px solid var(--border-neutral);">
          <td style="padding: 12px; font-weight:600; color: var(--text-primary);">${E(d.name)}</td>
          <td style="padding: 12px;"><span class="pill-badge status-info" style="font-size:11px;">Tier ${d.subscriptionTier}</span></td>
          <td style="padding: 12px; color: var(--text-secondary);">${u}</td>
          <td style="padding: 12px; font-weight:600;">${d.staffCount}</td>
          <td style="padding: 12px; font-weight:600;">${d.tasksCount}</td>
        </tr>
      `}).join("")}catch(s){console.error(s),t.innerHTML=`<tr><td colspan="5" style="padding: 24px; text-align: center; color: var(--status-danger);">Failed to load organizations: ${s.message}</td></tr>`}}function gt(){return`
    <div style="max-width: 420px; margin: 80px auto; padding: 32px; background-color: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: var(--radius-lg); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); display: flex; flex-direction: column; gap: 24px;">
      
      <!-- Brand & Title -->
      <div style="text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px;">
        <img src="/tascorrLogo.png" alt="Tascorr Logo" style="width: 48px; height: 48px; object-fit: contain;" onerror="this.style.display='none'">
        <div>
          <h2 class="section-title" style="font-size: 24px; font-weight: 700;">Sign in to Tascorr</h2>
          <p class="small-text" style="margin-top: 4px;">Enter your credentials to access your company workspace.</p>
        </div>
      </div>

      <!-- Alert placeholder -->
      <div id="login-error-alert" style="display: none; padding: 12px; background-color: rgba(220, 38, 38, 0.1); color: var(--status-danger); font-size: 13px; font-weight: 500; border-radius: var(--radius-md); border-left: 3px solid var(--status-danger);">
      </div>

      <!-- Form Inputs -->
      <form id="login-form" style="display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label for="login-email" class="small-text" style="font-weight: 600; color: var(--text-primary);">Email Address</label>
          <input type="email" id="login-email" required maxlength="254" autocomplete="email" placeholder="name@company.com" style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none; transition: border-color 0.15s ease;" />
        </div>

        <div style="display: flex; flex-direction: column; gap: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label for="login-password" class="small-text" style="font-weight: 600; color: var(--text-primary);">Password</label>
            <a href="#landing" class="small-text" style="color: var(--accent-navy-primary); text-decoration: none;">Forgot password?</a>
          </div>
          <input type="password" id="login-password" required maxlength="128" autocomplete="current-password" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none; transition: border-color 0.15s ease;" />
        </div>

        <button type="submit" class="btn btn-primary" style="justify-content: center; padding: 12px; border: none; font-weight: 600; font-size: 14px; margin-top: 8px;">
          Sign In
        </button>
      </form>

      <div style="text-align: center; border-top: 1px solid var(--border-neutral); padding-top: 16px;">
        <span class="small-text">Don't have a workspace?</span>
        <a href="#signup" class="small-text" style="color: var(--accent-navy-primary); font-weight: 600; text-decoration: none; margin-left: 4px;">Register Company</a>
      </div>
    </div>
  `}function yt(){const t=document.getElementById("login-form");if(!t)return;const s=document.getElementById("login-email"),i=document.getElementById("login-password"),d=document.getElementById("login-error-alert");[s,i].forEach(e=>{e&&(e.addEventListener("focus",()=>{e.style.borderColor="var(--accent-navy-primary)"}),e.addEventListener("blur",()=>{e.style.borderColor="var(--border-neutral)"}))}),t.addEventListener("submit",async e=>{e.preventDefault();const c=s.value.trim(),n=i.value;if(d&&(d.style.display="none",d.innerText=""),!c||!n){u("Please fill out all credentials.");return}if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)){u("Please enter a valid email address.");return}if(c.length>254){u("Email address is too long.");return}if(n.length>128){u("Password exceeds maximum length.");return}try{const r=t.querySelector('button[type="submit"]');r&&(r.disabled=!0,r.innerText="Authenticating..."),await $.login(c,n),T.success("Access Granted","Signed in successfully."),window.location.hash="dashboard"}catch(r){console.error(r),u(r.message||"Authentication failed. Please check credentials."),T.error("Login Failed",r.message||"Check your credentials.");const g=t.querySelector('button[type="submit"]');g&&(g.disabled=!1,g.innerText="Sign In")}});function u(e){d&&(d.innerText=e,d.style.display="block")}}function xt(){return`
    <div style="max-width: 480px; margin: 40px auto; padding: 32px; background-color: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: var(--radius-lg); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); display: flex; flex-direction: column; gap: 24px;">
      
      <!-- Logo & Header -->
      <div style="text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px;">
        <img src="/tascorrLogo.png" alt="Tascorr Logo" style="width: 48px; height: 48px; object-fit: contain;" onerror="this.style.display='none'">
        <div>
          <h2 class="section-title" style="font-size: 24px; font-weight: 700;">Register your company</h2>
          <p class="small-text" style="margin-top: 4px;">Set up a new isolated organization tenant workspace.</p>
        </div>
      </div>

      <!-- Alert -->
      <div id="signup-error-alert" style="display: none; padding: 12px; background-color: rgba(220, 38, 38, 0.1); color: var(--status-danger); font-size: 13px; font-weight: 500; border-radius: var(--radius-md); border-left: 3px solid var(--status-danger);">
      </div>

      <!-- Signup Form -->
      <form id="signup-form" style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Company Name -->
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label for="signup-company" class="small-text" style="font-weight: 600; color: var(--text-primary);">Company / Organization Name</label>
          <input type="text" id="signup-company" required maxlength="100" placeholder="Acme Corporation" style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none; transition: border-color 0.15s ease;" />
        </div>

        <!-- Admin Email -->
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label for="signup-email" class="small-text" style="font-weight: 600; color: var(--text-primary);">Administrator Email Address</label>
          <input type="email" id="signup-email" required maxlength="254" autocomplete="email" placeholder="admin@company.com" style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none; transition: border-color 0.15s ease;" />
        </div>

        <!-- Admin Password -->
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label for="signup-password" class="small-text" style="font-weight: 600; color: var(--text-primary);">Administrator Password</label>
          <input type="password" id="signup-password" required maxlength="128" autocomplete="new-password" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none; transition: border-color 0.15s ease;" />
          
          <!-- Password Checklist -->
          <div style="margin-top: 6px; padding: 10px; background-color: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-neutral); display: flex; flex-direction: column; gap: 4px;">
            <div class="small-text" style="font-weight: 600; margin-bottom: 2px;">Complexity Requirements:</div>
            <div id="req-length" class="small-text" style="color: var(--status-danger); display: flex; align-items: center; gap: 6px;">&bull; At least 12 characters</div>
            <div id="req-case" class="small-text" style="color: var(--status-danger); display: flex; align-items: center; gap: 6px;">&bull; Mixed case (uppercase & lowercase)</div>
            <div id="req-number" class="small-text" style="color: var(--status-danger); display: flex; align-items: center; gap: 6px;">&bull; At least one number</div>
            <div id="req-symbol" class="small-text" style="color: var(--status-danger); display: flex; align-items: center; gap: 6px;">&bull; At least one special symbol</div>
          </div>
        </div>

        <!-- Confirm Password -->
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label for="signup-confirm-password" class="small-text" style="font-weight: 600; color: var(--text-primary);">Confirm Password</label>
          <input type="password" id="signup-confirm-password" required maxlength="128" autocomplete="new-password" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none; transition: border-color 0.15s ease;" />
        </div>

        <button type="submit" class="btn btn-primary" style="justify-content: center; padding: 12px; border: none; font-weight: 600; font-size: 14px; margin-top: 8px;">
          Register & Create Workspace
        </button>
      </form>

      <div style="text-align: center; border-top: 1px solid var(--border-neutral); padding-top: 16px;">
        <span class="small-text">Already registered?</span>
        <a href="#login" class="small-text" style="color: var(--accent-navy-primary); font-weight: 600; text-decoration: none; margin-left: 4px;">Sign In</a>
      </div>
    </div>
  `}function vt(){const t=document.getElementById("signup-form");if(!t)return;const s=document.getElementById("signup-company"),i=document.getElementById("signup-email"),d=document.getElementById("signup-password"),u=document.getElementById("signup-confirm-password"),e=document.getElementById("signup-error-alert"),c={length:r=>r.length>=12,case:r=>/[a-z]/.test(r)&&/[A-Z]/.test(r),number:r=>/[0-9]/.test(r),symbol:r=>/[^a-zA-Z0-9]/.test(r)};d.addEventListener("input",()=>{const r=d.value;n("req-length",c.length(r)),n("req-case",c.case(r)),n("req-number",c.number(r)),n("req-symbol",c.symbol(r))});function n(r,g){const o=document.getElementById(r);o&&(g?(o.style.color="var(--status-success)",o.innerHTML=`&#10003; ${o.innerText.replace("✓","").replace("•","").trim()}`):(o.style.color="var(--status-danger)",o.innerHTML=`&bull; ${o.innerText.replace("✓","").replace("•","").trim()}`))}t.addEventListener("submit",async r=>{r.preventDefault();const g=s.value.trim(),o=i.value.trim(),p=d.value,a=u.value;if(e&&(e.style.display="none",e.innerText=""),!g||!o||!p||!a){v("Please populate all required details.");return}if(g.length<2){v("Company name must be at least 2 characters.");return}if(g.length>100){v("Company name cannot exceed 100 characters.");return}if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o)){v("Please enter a valid email address.");return}if(p!==a){v("Passwords do not match.");return}if(!c.length(p)||!c.case(p)||!c.number(p)||!c.symbol(p)){v("Password does not meet all required complexity parameters.");return}try{const b=t.querySelector('button[type="submit"]');b&&(b.disabled=!0,b.innerText="Creating Workspace..."),await $.signup(g,o,p),T.success("Account Created","Company registered successfully. Please log in."),window.location.hash="login"}catch(b){console.error(b),v(b.message||"Workspace signup failed. Please try again."),T.error("Signup Failed",b.message||"Check submission details.");const y=t.querySelector('button[type="submit"]');y&&(y.disabled=!1,y.innerText="Register & Create Workspace")}});function v(r){e&&(e.innerText=r,e.style.display="block")}}const ae={landing:{title:"Marketing",render:ct,icon:"home",isPublic:!0},login:{title:"Sign In",render:gt,icon:"user",isPublic:!0},signup:{title:"Register",render:xt,icon:"users",isPublic:!0},dashboard:{title:"Dashboard",render:We,icon:"chart-pie"},tasks:{title:"Tasks",render:Ze,icon:"list-check"},departments:{title:"Departments",render:Xe,icon:"sitemap"},employees:{title:"Employees",render:tt,icon:"users"},reports:{title:"Reports",render:rt,icon:"chart-bar"},settings:{title:"Settings",render:nt,icon:"cog",isBottom:!0},profile:{title:"Profile",render:lt,icon:"user",isBottom:!0},superadmin:{title:"Superadmin",render:pt,icon:"key"}},ce={home:'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>',"chart-pie":'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></svg>',"list-check":'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 0A48.536 48.536 0 0112 3m0 0c2.917 0 5.747.294 8.5.862m-21 10.398c0-.552.448-1 1-1h6.25a1 1 0 011 1v3.875a1 1 0 01-1 1H2.5a1 1 0 01-1-1v-3.875z" /></svg>',sitemap:'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.75a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM12 6a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM21 10.5a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM9 18.75a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM9.75 10.5c0 .621-.504 1.125-1.125 1.125H6.75a2.25 2.25 0 01-2.25-2.25V6.75m11.25 3.75c0 .621-.504 1.125-1.125 1.125H12" /></svg>',users:'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766v-.109A12.318 12.318 0 019.374 15c2.24 0 4.332.596 6.136 1.631M19.5 9.75a3 3 0 11-6 0 3 3 0 016 0zM4 10.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>',"chart-bar":'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>',cog:'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.645-.869l.214-1.28z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>',user:'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg>',key:'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>',logout:'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>'};function De(){var n,v,r,g,o,p;const t=document.getElementById("desktop-nav"),s=document.getElementById("desktop-bottom-nav"),i=document.getElementById("mobile-nav");if(!t||!i||!s||(t.innerHTML="",s.innerHTML="",i.innerHTML="",!$.isAuthenticated))return;let d="",u="";const e=((n=$.currentUser)==null?void 0:n.rankLevel)??4,c=$.isSuperadmin();if(Object.keys(ae).forEach(a=>{var l,x;const m=ae[a];if(m.isPublic)return;if(c){if(a!=="superadmin"&&a!=="settings")return}else{if(a==="superadmin"||a==="employees"&&e>2)return;const k=((x=(l=$.currentUser)==null?void 0:l.tenant)==null?void 0:x.slaAccessLevel)??3;if(a==="reports"&&e>k)return}const b=ce[m.icon]||"",y=`
      <a href="#${a}" class="menu-item" id="nav-${a}">
        ${b}
        <span class="menu-item-text">${m.title}</span>
      </a>
    `;m.isBottom?u+=y:d+=y}),u+=`
    <a class="menu-item" id="nav-logout-action" style="color: var(--status-danger);">
      ${ce.logout}
      <span class="menu-item-text">Sign Out</span>
    </a>
  `,t.innerHTML=d,s.innerHTML=u,(v=document.getElementById("nav-logout-action"))==null||v.addEventListener("click",()=>{$.logout()}),!c){const a=((g=(r=$.currentUser)==null?void 0:r.tenant)==null?void 0:g.slaAccessLevel)??3,b=e<=a?["dashboard","tasks","quickAction","reports","settings"]:["dashboard","tasks","quickAction","settings","logout"];let y="";b.forEach(l=>{if(l==="quickAction")e<=3?y+=`
            <div class="mobile-quick-action" id="mobile-task-create" aria-label="Create Task">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
          `:y+='<div style="width: 56px; height: 56px;"></div>';else if(l==="logout")y+=`
          <a href="#" class="mobile-nav-item" id="mobile-nav-logout" style="color: var(--status-danger);">
            ${ce.logout}
            <span>Sign Out</span>
          </a>
        `;else{const x=ae[l],k=ce[x.icon]||"";y+=`
          <a href="#${l}" class="mobile-nav-item" id="mobile-nav-${l}">
            ${k}
            <span>${x.title}</span>
          </a>
        `}}),i.innerHTML=y,(o=document.getElementById("mobile-task-create"))==null||o.addEventListener("click",()=>{new Ne(()=>{window.location.hash==="#tasks"?window.location.reload():window.location.hash="tasks"}).open()}),(p=document.getElementById("mobile-nav-logout"))==null||p.addEventListener("click",l=>{l.preventDefault(),$.logout()})}}function ke(){const t=window.location.hash.substring(1)||"landing";let s=ae[t]||ae.landing;if(!s.isPublic&&!$.isAuthenticated){window.location.hash="login";return}if(s.isPublic&&$.isAuthenticated&&t!=="landing"){window.location.hash="dashboard";return}if(t==="superadmin"&&!$.isSuperadmin()){window.location.hash="dashboard";return}const i=document.getElementById("view-root");i&&(i.style.animation="none",i.offsetHeight,i.style.animation="",i.innerHTML=s.render());const d=document.getElementById("breadcrumbs");if(d){const r=$.currentUser&&$.currentUser.tenantName||"Workspace";d.innerHTML=`
      <span class="body-text" style="font-weight: 500;">${r}</span>
      <span class="small-text" style="margin: 0 8px; color: var(--text-secondary);">&rarr;</span>
      <span class="body-text" style="font-weight: 600; color: var(--text-primary);">${s.title}</span>
    `}document.querySelectorAll(".menu-item").forEach(r=>{r.classList.remove("active")});const u=document.getElementById(`nav-${t}`);u&&u.classList.add("active"),document.querySelectorAll(".mobile-nav-item").forEach(r=>{r.classList.remove("active")});const e=document.getElementById(`mobile-nav-${t}`);e&&e.classList.add("active");const c=document.getElementById("sidebar"),n=document.querySelector(".app-header"),v=document.getElementById("app-layout");s.isPublic?(document.body.classList.add("public-route"),c&&(c.style.display="none"),n&&(n.style.display="none"),v&&(v.style.backgroundColor="var(--bg-primary)")):(document.body.classList.remove("public-route"),c&&(c.style.display=window.innerWidth>768?"flex":"none"),n&&(n.style.display="flex"),v&&(v.style.backgroundColor="var(--bg-secondary)")),t==="login"&&yt(),t==="signup"&&vt(),t==="dashboard"&&_e(),t==="tasks"&&Je(),t==="employees"&&at(),t==="departments"&&Qe(),t==="reports"&&it(),t==="settings"&&ot(),t==="profile"&&dt(),t==="superadmin"&&ut()}function ft(){const t=document.getElementById("sidebar"),s=document.getElementById("sidebar-toggle"),i=document.getElementById("theme-toggle");s&&t&&s.addEventListener("click",()=>{t.classList.toggle("collapsed")});const d=localStorage.getItem("tascorr_theme")||"light";document.documentElement.setAttribute("data-theme",d);function u(n){const v=document.getElementById("theme-icon"),r=document.getElementById("mobile-theme-icon"),g=o=>{if(!o)return;["dark","midnight"].includes(n)?o.innerHTML='<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />':o.innerHTML='<path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />'};g(v),g(r)}u(d);const e=()=>{const n=document.documentElement.getAttribute("data-theme"),r=["dark","midnight"].includes(n)?"light":"dark";document.documentElement.setAttribute("data-theme",r),localStorage.setItem("tascorr_theme",r),u(r),window.dispatchEvent(new CustomEvent("themeChanged",{detail:r}))};i&&i.addEventListener("click",e);const c=document.getElementById("mobile-theme-toggle");c&&c.addEventListener("click",e),window.addEventListener("resize",()=>{const n=window.location.hash.substring(1)||"landing";!(ae[n]||ae.landing).isPublic&&t&&(t.style.display=window.innerWidth>768?"flex":"none")}),Ee()}function Ee(){const t=document.getElementById("header-user-role");if(t)if($.isAuthenticated&&$.currentUser){const o=$.currentUser,p=o.tenantName||`${o.firstName} ${o.lastName}`;t.innerText=`${p} (${o.rankTitle})`}else t.innerText="Guest";const s=document.getElementById("brand-logo"),i=document.querySelector(".sidebar-brand");if($.isAuthenticated&&$.currentUser){if(s){const o=$.currentUser.tenantLogoUrl;s.src=o?`${o}?t=${Date.now()}`:"/tascorrLogo.png",s.style.display="block"}i&&(i.innerText=$.currentUser.tenantName||"Tascorr")}else s&&(s.src="/tascorrLogo.png",s.style.display="block"),i&&(i.innerText="Tascorr");const d=document.getElementById("mobile-user-name"),u=document.getElementById("mobile-greeting"),e=document.getElementById("mobile-header-avatar");if(d&&$.isAuthenticated&&$.currentUser){const o=$.currentUser;d.innerText=o.firstName;const p=[{text:"Good morning,",hint:"en"},{text:"Buenos días,",hint:"es"},{text:"Bonjour,",hint:"fr"},{text:"Guten Morgen,",hint:"de"},{text:"Buongiorno,",hint:"it"},{text:"Ohayō,",hint:"jp"},{text:"Anyoung,",hint:"kr"},{text:"Zǎo ān,",hint:"cn"},{text:"Namaste,",hint:"in"},{text:"Bom dia,",hint:"pt"}],a=p[Math.floor(Math.random()*p.length)];if(u&&(u.innerHTML=`${a.text} <span style="font-size:10px; opacity:0.6; text-transform:uppercase; margin-left:4px;" title="Language: ${a.hint}">${a.hint}</span>`),e){const m=`${o.firstName?o.firstName.charAt(0):""}${o.lastName?o.lastName.charAt(0):""}`;e.innerHTML=`
        <img src="/avatars/user-${o.id}.jpg?t=${Date.now()}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" />
        <div style="width:40px;height:40px;border-radius:50%;background:var(--sidebar-bg);color:var(--text-primary);display:none;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:1px solid #E5E7EB;">${m||"?"}</div>
      `}}const c=document.getElementById("sidebar-user-card"),n=document.getElementById("sidebar-user-avatar"),v=document.getElementById("sidebar-user-avatar-img"),r=document.getElementById("sidebar-user-name"),g=document.getElementById("sidebar-user-role");if(c&&n&&r&&g)if($.isAuthenticated&&$.currentUser){const o=$.currentUser,p=`${o.firstName?o.firstName.charAt(0):""}${o.lastName?o.lastName.charAt(0):""}`;n.innerText=p||"??",v&&(v.src=`/avatars/user-${o.id}.jpg?t=${Date.now()}`,v.onload=()=>{v.style.display="block",n.style.display="none"},v.onerror=()=>{v.style.display="none",n.style.display="flex"}),r.innerText=`${o.firstName} ${o.lastName}`,g.innerText=o.rankTitle||"Employee",c.style.display="flex",e&&(e.onclick=()=>{var x,k,h,w,f;(x=document.getElementById("mobile-profile-sheet"))==null||x.remove(),(k=document.getElementById("mobile-profile-overlay"))==null||k.remove();const a=document.createElement("div");a.id="mobile-profile-overlay",a.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:1100;backdrop-filter:blur(2px);";const m=document.createElement("div");m.id="mobile-profile-sheet",m.style.cssText=`
            position:fixed; left:0; right:0; bottom:0; z-index:1101;
            background:var(--bg-primary); border-radius:28px 28px 0 0;
            padding:0 0 32px 0; box-shadow:0 -8px 40px rgba(0,0,0,0.15);
            transform:translateY(100%); transition:transform 0.3s cubic-bezier(0.4,0,0.2,1);
          `;const b=o.departmentName||((h=o.department)==null?void 0:h.name)||"Unassigned",y=`${((w=o.firstName)==null?void 0:w[0])||""}${((f=o.lastName)==null?void 0:f[0])||""}`;m.innerHTML=`
            <!-- Drag handle -->
            <div style="width:40px;height:4px;background:#E5E7EB;border-radius:2px;margin:12px auto 20px auto;"></div>

            <!-- User card -->
            <div style="display:flex;align-items:center;gap:16px;padding:0 24px 20px;border-bottom:1px solid var(--border-neutral);">
              <div style="position:relative;width:60px;height:60px;flex-shrink:0;">
                <img src="/avatars/user-${o.id}.jpg?t=${Date.now()}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" style="width:60px;height:60px;border-radius:50%;object-fit:cover;border:2px solid var(--border-neutral);" />
                <div style="width:60px;height:60px;border-radius:50%;background:var(--accent-navy-light);color:var(--accent-navy-primary);display:none;align-items:center;justify-content:center;font-weight:700;font-size:22px;">${y||"?"}</div>
              </div>
              <div>
                <div style="font-size:18px;font-weight:700;color:var(--text-primary);">${o.firstName} ${o.lastName}</div>
                <div style="font-size:13px;color:var(--accent-navy-primary);font-weight:600;margin-top:2px;">${o.rankTitle||"Employee"}</div>
                <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">${b}</div>
              </div>
            </div>

            <!-- Email row -->
            <div style="padding:16px 24px;border-bottom:1px solid var(--border-neutral);display:flex;align-items:center;gap:12px;">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px;height:18px;color:var(--text-secondary);flex-shrink:0;"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
              <span style="font-size:14px;color:var(--text-secondary);">${o.email||"--"}</span>
            </div>

            <!-- View full profile -->
            <div id="mobile-sheet-profile-link" style="padding:16px 24px;border-bottom:1px solid var(--border-neutral);display:flex;align-items:center;justify-content:space-between;cursor:pointer;">
              <div style="display:flex;align-items:center;gap:12px;">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px;height:18px;color:var(--text-secondary);"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                <span style="font-size:14px;font-weight:600;color:var(--text-primary);">View Full Profile</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px;color:var(--text-secondary);"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </div>

            <!-- Sign out -->
            <div id="mobile-sheet-signout" style="padding:16px 24px;display:flex;align-items:center;gap:12px;cursor:pointer;">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px;height:18px;color:var(--status-danger);"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
              <span style="font-size:14px;font-weight:600;color:var(--status-danger);">Sign Out</span>
            </div>
          `,document.body.appendChild(a),document.body.appendChild(m),requestAnimationFrame(()=>{m.style.transform="translateY(0)"});const l=()=>{m.style.transform="translateY(100%)",a.style.opacity="0",setTimeout(()=>{m.remove(),a.remove()},300)};a.addEventListener("click",l),m.querySelector("#mobile-sheet-profile-link").addEventListener("click",()=>{l(),setTimeout(()=>{window.location.hash="profile"},300)}),m.querySelector("#mobile-sheet-signout").addEventListener("click",()=>{l(),setTimeout(()=>$.logout(),300)})}),c.onclick=()=>{window.location.hash="profile";const a=document.getElementById("sidebar");a&&a.classList.contains("active")&&a.classList.remove("active")}}else c.style.display="none"}async function bt(){const t=await qe();if(t.length===0)return;console.log(`[Sync] Replaying ${t.length} queued operation(s)...`);const s=document.getElementById("offline-banner"),i=document.getElementById("offline-banner-text");s&&i&&(s.style.display="flex",s.style.background="#2563EB",i.textContent=`Syncing ${t.length} pending change${t.length>1?"s":""}...`,document.getElementById("app-layout").style.marginTop=s.offsetHeight+"px");let d=0;const u=[];for(const e of t)try{await L(e.method,e.path,e.body),await xe(e.id),d++}catch(c){const n=c==null?void 0:c.status;n===409?(console.warn(`[Sync] Conflict on op #${e.id} (${e.method} ${e.path}). Discarding local change.`),await xe(e.id),u.push({op:e,reason:"Conflict — a newer version exists on the server. Your local change was discarded."})):n===403||n===404?(console.warn(`[Sync] Permanent failure on op #${e.id} (${n}). Removing from queue.`),await xe(e.id),u.push({op:e,reason:n===403?"Permission denied — you may no longer have access.":"Resource not found — it may have been deleted."})):console.warn(`[Sync] Transient failure on op #${e.id} (${e.method} ${e.path}):`,c.message)}if(await ue(),s&&(s.style.display="none",document.getElementById("app-layout").style.marginTop="0"),d>0&&T.success("Changes Synced",`${d} offline change${d>1?"s":""} saved to the server successfully.`,5e3),u.length>0){const e=u.map(c=>`• ${c.op.method} ${c.op.path}: ${c.reason}`).join(`
`);T.error(`${u.length} Change${u.length>1?"s":""} Could Not Sync`,e,0)}if(d>0||u.length>0){const e=window.location.hash.substring(1);["dashboard","tasks"].includes(e)&&ke()}}window.addEventListener("error",t=>{console.error("Captured Global Frontend Error:",t.error),T.error("App Runtime Exception",t.message||"An unexpected client error occurred.")});window.addEventListener("unhandledrejection",t=>{var s;console.error("Captured Global Promise Rejection:",t.reason),T.error("API Error Response",((s=t.reason)==null?void 0:s.message)||"Server request returned error.")});document.addEventListener("DOMContentLoaded",async()=>{await $.checkSession();try{await oe(),await ue()}catch(t){console.warn("[OfflineDB] Could not initialize offline database:",t)}window.addEventListener("online",async()=>{$.isAuthenticated&&await bt()}),ft(),De(),document.addEventListener("tascorr_avatar_updated",()=>{Ee()}),window.addEventListener("hashchange",()=>{De(),Ee(),ke()}),ke()});
