(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))c(n);new MutationObserver(n=>{for(const e of n)if(e.type==="childList")for(const d of e.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&c(d)}).observe(document,{childList:!0,subtree:!0});function o(n){const e={};return n.integrity&&(e.integrity=n.integrity),n.referrerPolicy&&(e.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?e.credentials="include":n.crossOrigin==="anonymous"?e.credentials="omit":e.credentials="same-origin",e}function c(n){if(n.ep)return;n.ep=!0;const e=o(n);fetch(n.href,e)}})();const Ue="tascorr-offline",qe=1,Y="pending_ops";let le=null;function oe(){return le?Promise.resolve(le):new Promise((t,s)=>{const o=indexedDB.open(Ue,qe);o.onupgradeneeded=c=>{const n=c.target.result;n.objectStoreNames.contains(Y)||n.createObjectStore(Y,{keyPath:"id",autoIncrement:!0}).createIndex("timestamp","timestamp",{unique:!1})},o.onsuccess=c=>{le=c.target.result,t(le)},o.onerror=c=>{console.error("[OfflineDB] Failed to open IndexedDB:",c.target.error),s(c.target.error)}})}async function Ce(t){const s=await oe();return new Promise((o,c)=>{const e=s.transaction(Y,"readwrite").objectStore(Y),d={method:t.method,path:t.path,body:t.body,timestamp:Date.now(),retries:0},i=e.add(d);i.onsuccess=()=>o(i.result),i.onerror=()=>c(i.error)})}async function Oe(){const t=await oe();return new Promise((s,o)=>{const d=t.transaction(Y,"readonly").objectStore(Y).index("timestamp").getAll();d.onsuccess=()=>s(d.result),d.onerror=()=>o(d.error)})}async function Ge(){const t=await oe();return new Promise((s,o)=>{const e=t.transaction(Y,"readonly").objectStore(Y).count();e.onsuccess=()=>s(e.result),e.onerror=()=>o(e.error)})}async function xe(t){const s=await oe();return new Promise((o,c)=>{const d=s.transaction(Y,"readwrite").objectStore(Y).delete(t);d.onsuccess=()=>o(),d.onerror=()=>c(d.error)})}const Ve={};class ve extends Error{constructor(s,o,c=null){super(o),this.name="ApiError",this.status=s,this.details=c}}class fe extends Error{constructor(){super("You are currently offline. Showing cached data where available."),this.name="OfflineError"}}async function ue(){try{const t=await Ge(),s=document.getElementById("pending-sync-badge");if(!s)return;t>0?(s.textContent=`${t} pending`,s.style.display="inline-flex"):s.style.display="none"}catch{}}async function A(t,s,o=null){const c=typeof import.meta<"u"&&Ve?"/tascorr/".replace(/\/$/,""):"",n=s.startsWith("/api")?s:`/api${s}`,e=`${window.location.origin}${c}${n}`,d={Accept:"application/json"};o instanceof FormData||(d["Content-Type"]="application/json");const i=localStorage.getItem("tascorr_token");i&&(d.Authorization=`Bearer ${i}`);const h={method:t,headers:d};o&&(h.body=o instanceof FormData?o:JSON.stringify(o));const r=["POST","PATCH","PUT","DELETE"].includes(t.toUpperCase());if(r&&!navigator.onLine){try{await Ce({method:t,path:n,body:o}),await ue(),console.log(`[Offline Queue] Queued ${t} ${n}`)}catch(g){console.error("[Offline Queue] Failed to enqueue operation:",g)}return{queued:!0,message:"Saved locally. Will sync when back online."}}try{const g=await fetch(e,h);if(g.status===401){localStorage.removeItem("tascorr_token"),localStorage.removeItem("tascorr_user");const a=window.location.hash;a&&a!=="#landing"&&a!=="#login"&&a!=="#signup"&&(window.location.hash="login")}if(g.status===503&&t==="GET")throw new fe;let f;const x=g.headers.get("content-type");if(x&&x.includes("application/json")?f=await g.json():f={message:await g.text()},!g.ok)throw new ve(g.status,f.error||f.message||"API request failed.",f);return f}catch(g){if(g instanceof ve||g instanceof fe)throw g;if(r&&!navigator.onLine){try{await Ce({method:t,path:n,body:o}),await ue()}catch{}return{queued:!0,message:"Saved locally. Will sync when back online."}}throw navigator.onLine?new ve(500,g.message||"Network communication error. Please check your connection."):new fe}}class We{constructor(){this.currentUser=null,this.isAuthenticated=!1,this.initialized=!1;const s=localStorage.getItem("tascorr_user");if(s)try{this.currentUser=JSON.parse(s),this.isAuthenticated=!0}catch{localStorage.removeItem("tascorr_user")}}async login(s,o){const c=await A("POST","/auth/login",{email:s,password:o});return c.token&&localStorage.setItem("tascorr_token",c.token),this.currentUser=c.user,this.isAuthenticated=!0,localStorage.setItem("tascorr_user",JSON.stringify(c.user)),c}async signup(s,o,c){return await A("POST","/auth/signup",{name:s,adminEmail:o,adminPassword:c})}async logout(){try{await A("POST","/auth/logout")}catch(s){console.warn("Network error during logout",s)}this.currentUser=null,this.isAuthenticated=!1,localStorage.removeItem("tascorr_token"),localStorage.removeItem("tascorr_user"),window.location.hash="landing"}async checkSession(){if(!localStorage.getItem("tascorr_token"))return this.currentUser=null,this.isAuthenticated=!1,null;try{const s=await A("GET","/auth/session");return this.currentUser=s.user,this.isAuthenticated=!0,localStorage.setItem("tascorr_user",JSON.stringify(s.user)),s.user}catch{return this.currentUser=null,this.isAuthenticated=!1,localStorage.removeItem("tascorr_token"),localStorage.removeItem("tascorr_user"),null}finally{this.initialized=!0}}isAdmin(){return this.isAuthenticated&&this.currentUser&&this.currentUser.rankLevel===0}isExecutive(){return this.isAuthenticated&&this.currentUser&&this.currentUser.rankLevel<=1}isDeptHead(){return this.isAuthenticated&&this.currentUser&&this.currentUser.rankLevel<=2}isManager(){return this.isAuthenticated&&this.currentUser&&this.currentUser.rankLevel<=3}isSuperadmin(){return this.isAuthenticated&&this.currentUser&&this.currentUser.email==="superadmin@tascorr.com"}}const I=new We;function $(t){return typeof t!="string"?t==null?"":String(t):t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function _e(){return`
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
  `}async function Ne(){const t=document.getElementById("dashboard-loading"),s=document.getElementById("dashboard-content");if(s)try{const[o,c,n,e,d]=await Promise.all([A("GET","/tasks"),A("GET","/tasks/workload").catch(()=>({workload:{}})),A("GET","/users"),A("GET","/departments"),A("GET","/notifications").catch(()=>({notifications:[]}))]),i=o.tasks||[],h=c.workload||{},r=(n.users||[]).filter(S=>{var L;return((L=S.rank)==null?void 0:L.level)!==0}),g=e.departments||[],f=d.notifications||[],x=new Date;x.setHours(0,0,0,0);const a=i.filter(S=>S.status==="Blocked"||S.status==="Under Review"),y=i.filter(S=>S.status!=="Completed"&&new Date(S.dueDate)<x),p=i.filter(S=>S.status==="Under Review"),l=new Date;l.setDate(l.getDate()-7);const u=i.filter(S=>S.status==="Completed"&&new Date(S.updatedAt)>=l),m=document.getElementById("dashboard-metrics-grid");m&&(m.innerHTML=`
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
            <div class="pill-badge ${y.length>0?"status-danger":"status-success"}">
              <span class="badge-dot"></span>${y.length>0?"Overdue":"On Track"}
            </div>
          </div>
          <div class="page-title" style="font-size: 36px; line-height: 1.1;">${y.length}</div>
          <p class="small-text" style="margin-top: 8px;">Active tasks past target due dates</p>
        </div>

        <div class="grid-col-3 widget-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <span class="small-text" style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center;">Pending Approvals<div class="tooltip-container"><span class="help-icon">?</span><span class="tooltip-text">Tasks awaiting managerial authorization.</span></div></span>
            <div class="pill-badge ${p.length>0?"status-warning":"status-success"}">
              <span class="badge-dot"></span>${p.length>0?"Awaiting Action":"Clear"}
            </div>
          </div>
          <div class="page-title" style="font-size: 36px; line-height: 1.1;">${p.length}</div>
          <p class="small-text" style="margin-top: 8px;">Tasks awaiting manager authorization</p>
        </div>

        <div class="grid-col-3 widget-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <span class="small-text" style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center;">Completed (WTD)<div class="tooltip-container"><span class="help-icon">?</span><span class="tooltip-text">Tasks successfully closed within the last 7 days.</span></div></span>
            <div class="pill-badge status-success">
              <span class="badge-dot"></span>Completed
            </div>
          </div>
          <div class="page-title" style="font-size: 36px; line-height: 1.1;">${u.length}</div>
          <p class="small-text" style="margin-top: 8px;">Work closed within the last 7 days</p>
        </div>
      `);const w=document.getElementById("workload-list");if(w)if(r.length===0)w.innerHTML='<p class="small-text" style="padding: 16px 0; text-align: center;">No team members registered.</p>';else{const S={};r.forEach(D=>{const P=h[D.id]||{count:0,blocked:0};S[D.id]={user:D,count:P.count,blocked:P.blocked}});const L=Object.values(S);w.innerHTML=L.slice(0,5).map(D=>{var ne;const P=D.user,J=Math.min(D.count/10*100,100),K=D.count>=10,W=K?"var(--status-danger)":"var(--accent-navy-primary)";return`
            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span class="data-number" style="font-size: 13px;">${P.firstName} ${P.lastName} (${((ne=P.rank)==null?void 0:ne.title)||"Employee"})</span>
                <span class="small-text">${D.count} active, ${D.blocked} blocked ${K?'<span style="color: var(--status-danger); font-weight: 600;">(Overloaded)</span>':""}</span>
              </div>
              <div style="height: 6px; background-color: var(--bg-tertiary); border-radius: var(--radius-sm); overflow: hidden;">
                <div style="width: ${J}%; height: 100%; background-color: ${W}; border-radius: var(--radius-sm); transition: width 0.3s ease;"></div>
              </div>
            </div>
          `}).join("")}const b=document.getElementById("mobile-workload-list");if(b&&r.length>0){const S={};r.forEach(D=>{const P=h[D.id]||{count:0,blocked:0};S[D.id]={user:D,count:P.count,blocked:P.blocked}});const L=Object.values(S);b.innerHTML=L.slice(0,5).map(D=>{const P=D.user,J=Math.min(D.count/10*100,100),K=D.count>=10,W=K?"var(--status-danger)":"var(--accent-navy-primary)";return`
          <div style="background: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: 16px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span class="data-number" style="font-size: 14px; color: var(--text-primary); font-weight: 600;">${P.firstName} ${P.lastName}</span>
              <span class="small-text" style="font-size: 12px; color: var(--text-secondary);">${D.count} active, ${D.blocked} blocked ${K?'<span style="color: var(--status-danger); font-weight: 600;">(Overloaded)</span>':""}</span>
            </div>
            <div style="height: 8px; background-color: var(--bg-tertiary); border-radius: var(--radius-md); overflow: hidden;">
              <div style="width: ${J}%; height: 100%; background-color: ${W}; border-radius: var(--radius-md); transition: width 0.3s ease;"></div>
            </div>
          </div>
        `}).join("")}else b&&(b.innerHTML='<p class="small-text" style="padding: 16px 0; text-align: center;">No team members registered.</p>');const k=document.getElementById("departmental-list");k&&(g.length===0?k.innerHTML='<p class="small-text" style="padding: 16px 0; text-align: center;">No department nodes configured.</p>':k.innerHTML=g.map(S=>{const L=i.filter(W=>W.departmentId===S.id),D=L.filter(W=>W.status==="Completed").length,P=L.length>0?Math.round(D/L.length*100):100,K=P<80?"status-warning":"status-success";return`
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-neutral);">
              <span class="data-number" style="font-size: 13px;">${S.name}</span>
              <span class="pill-badge ${K}"><span class="badge-dot"></span>${P}% SLA score</span>
            </div>
          `}).join(""));const v=document.getElementById("activity-log-list");if(v){const S=[];i.forEach(L=>{var D;S.push({type:"INFO",label:"CREATION",text:`Task <strong>${$(L.title)}</strong> was created.`,time:new Date(L.createdAt),badge:"status-info"}),(D=L.blockers)==null||D.forEach(P=>{S.push({type:"DANGER",label:"BLOCK",text:`Task <strong>${$(L.title)}</strong> flagged as <strong>Blocked</strong>.`,time:new Date(P.createdAt),badge:"status-danger"}),P.resolvedAt&&S.push({type:"SUCCESS",label:"RESOLVED",text:`Blocker on Task <strong>${$(L.title)}</strong> resolved.`,time:new Date(P.resolvedAt),badge:"status-success"})})}),S.sort((L,D)=>D.time.getTime()-L.time.getTime()),S.length===0?v.innerHTML='<p class="small-text" style="padding: 16px 0; text-align: center;">No activity recorded yet.</p>':v.innerHTML=S.slice(0,10).map(L=>{const D=Math.round((new Date().getTime()-L.time.getTime())/6e4),P=D<60?`${D} mins ago`:`${Math.round(D/60)} hours ago`;return`
            <div style="display: flex; gap: 12px; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid var(--border-neutral);">
              <div class="pill-badge ${L.badge}" style="padding: 2px 6px; font-size: 10px;">${L.label}</div>
              <div>
                <p class="body-text" style="color: var(--text-primary); font-size: 13px;">${L.text}</p>
                <span class="small-text">${P}</span>
              </div>
            </div>
          `}).join("")}const T=document.getElementById("notifications-list");if(T){const S=f.filter(L=>!L.isRead);S.length===0?T.innerHTML=`
          <div style="padding: 16px; background-color: var(--bg-secondary); border-radius: var(--radius-md); text-align: center; border: 1px dashed var(--border-neutral);">
            <p class="small-text">No pending notifications in your queue.</p>
          </div>
        `:(T.innerHTML=S.slice(0,3).map(L=>`
          <div style="padding: 10px; background-color: var(--bg-tertiary); border-radius: var(--radius-md); border-left: 3px solid var(--status-info); position: relative;">
            <p class="small-text" style="font-weight: 600; color: var(--text-primary);">${L.title}</p>
            <p class="small-text" style="margin-top: 4px;">${L.message}</p>
            <button class="mark-read-btn" data-id="${L.id}" style="background: none; border: none; font-size: 10px; color: var(--accent-navy-primary); cursor: pointer; margin-top: 6px; padding: 0;">Mark as Read</button>
          </div>
        `).join(""),T.querySelectorAll(".mark-read-btn").forEach(L=>{L.addEventListener("click",async()=>{const D=Number(L.dataset.id);try{await A("PATCH",`/notifications/${D}/read`),Ne()}catch(P){console.error(P)}})}))}const C=i.filter(S=>S.status==="In Progress"||S.status==="Pending").length,M=y.length+i.filter(S=>new Date(S.dueDate).toDateString()===x.toDateString()).length,N=u.length,H=document.getElementById("mobile-hero-pct"),j=document.getElementById("mobile-hero-bar"),B=document.getElementById("mobile-hero-subtitle"),U=document.getElementById("mobile-hero-trend");if(H){const S=i.filter(P=>new Date(P.updatedAt)>=l||new Date(P.createdAt)>=l),L=S.filter(P=>P.status==="Completed").length,D=S.length>0?Math.round(L/S.length*100):0;H.innerText=`${D}%`,j&&(j.style.width=`${D}%`),B&&(B.innerText=`${L} of ${S.length} tasks completed this week`),U&&(U.innerText=`📈 +${Math.round(D/2+2)}%`)}const z=document.getElementById("mobile-stat-in-progress"),R=document.getElementById("mobile-stat-due-today"),O=document.getElementById("mobile-stat-completed");z&&(z.innerText=C),R&&(R.innerText=M),O&&(O.innerText=N);const Z=document.getElementById("mobile-due-today-list"),F=document.getElementById("mobile-due-today-count");if(Z){const S=i.filter(L=>L.status!=="Completed"&&new Date(L.dueDate).getTime()<=x.getTime()+864e5);F&&(F.innerText=`${S.length} tasks`),S.length===0?Z.innerHTML='<div style="text-align: center; color: var(--text-secondary); font-size: 13px; padding: 20px;">No tasks due today.</div>':Z.innerHTML=S.map(L=>{var Be,Ae,Le,Se;const D=((Be=L.assignments)==null?void 0:Be.length)>0?`${L.assignments[0].user.firstName} ${L.assignments[0].user.lastName}`:"Unassigned",P=((Ae=L.assignments)==null?void 0:Ae.length)>0?L.assignments[0].userId:null,J=D!=="Unassigned"?D[0]:"?",W={High:"#DC2626",Critical:"#DC2626",Medium:"#D97706",Low:"#10B981"}[L.priority]||"#3B82F6",ne=((Le=L.subtasks)==null?void 0:Le.length)||2,$e=((Se=L.subtasks)==null?void 0:Se.filter(Fe=>Fe.status==="Completed").length)||1,Ie=Math.round($e/Math.max(1,ne)*100);return`
            <div style="background: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: 20px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="display: flex; gap: 8px; align-items: center;">
                  <span style="color: ${W}; background: ${W}15; padding: 4px 8px; border-radius: 8px; font-size: 10px; font-weight: 700;">${L.priority}</span>
                  <span style="color: var(--text-secondary); font-size: 12px; font-weight: 500;">General</span>
                </div>
                <div style="background: #F3F4F6; padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; color: #4B5563; display: flex; align-items: center; gap: 4px;">
                  <span style="display: block; width: 6px; height: 6px; border-radius: 50%; background: #EF4444;"></span> ${L.status}
                </div>
              </div>
              <h4 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 16px;">${L.title}</h4>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-secondary);">
                  <input type="radio" checked style="accent-color: #111827; pointer-events: none;" /> ${$e}/${ne} subtasks
                </div>
                <span style="font-size: 11px; color: var(--text-secondary);">${Ie}%</span>
              </div>
              <div style="width: 100%; height: 4px; background: #E5E7EB; border-radius: 2px; margin-bottom: 16px; overflow: hidden;">
                <div style="height: 100%; width: ${Ie}%; background: #111827; border-radius: 2px;"></div>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  ${P?`<img src="/avatars/user-${P}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;" />`:""}
                  <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--sidebar-bg); color: var(--text-primary); display: ${P?"none":"flex"}; align-items: center; justify-content: center; font-size: 10px; font-weight: 700;">${J}</div>
                  <span style="font-size: 12px; font-weight: 500; color: var(--text-primary);">${D}</span>
                </div>
                <span style="font-size: 12px; font-weight: 600; color: var(--text-primary);">Today</span>
              </div>
            </div>
          `}).join("")}t&&(t.style.display="none"),s.style.display="flex"}catch(o){console.error(o),t&&(t.innerHTML=`
        <div style="padding: 32px; background-color: rgba(220, 38, 38, 0.05); border-radius: var(--radius-lg); text-align: center; border: 1px dashed var(--status-danger);">
          <p class="body-text" style="color: var(--status-danger); font-weight: 600;">Failed to load live dashboard statistics.</p>
          <p class="small-text" style="margin-top: 8px;">Error: ${o.message||"Server connection issue."}</p>
        </div>
      `)}}function Ye(){Ne()}class Ze{constructor(){this.container=null,this.initContainer()}initContainer(){this.container||(this.container=document.createElement("div"),this.container.id="toast-container",this.container.style.cssText=`
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
    `,document.body.appendChild(this.container))}show(s,o,c,n=4e3){this.initContainer();const e=document.createElement("div");e.className=`toast-item toast-${s}`,e.style.cssText=`
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
    `;const i={success:"var(--status-success)",warning:"var(--status-warning)",danger:"var(--status-danger)",info:"var(--status-info)"}[s]||"var(--text-secondary)",h=document.createElement("div");h.style.cssText=`
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background-color: ${i};
    `,e.appendChild(h);const r=document.createElement("button");r.innerHTML="&times;",r.style.cssText=`
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
    `,g.innerText=o,e.appendChild(g);const f=document.createElement("p");f.className="small-text",f.style.cssText=`
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.4;
    `,f.innerText=c,e.appendChild(f),this.container.appendChild(e),requestAnimationFrame(()=>{e.style.transform="translateX(0)"}),n>0&&setTimeout(()=>this.dismiss(e),n)}success(s,o,c){this.show("success",s,o,c)}warning(s,o,c){this.show("warning",s,o,c)}error(s,o,c){this.show("danger",s,o,c)}info(s,o,c){this.show("info",s,o,c)}dismiss(s){s.style.transform="translateX(120%)",s.style.opacity="0",setTimeout(()=>{s.parentNode&&s.parentNode.removeChild(s)},300)}}const E=new Ze;class Pe{constructor(s){this.onSuccess=s,this.drawerEl=null,this.overlayEl=null,this.users=[],this.departments=[],this.subtasks=[]}async render(){this.subtasks=[];try{const e=await A("GET","/users?assignableOnly=true");this.users=e.users||[];const d=new Map;this.users.forEach(i=>{i.departmentId&&i.department&&d.set(i.departmentId,i.department.name)}),this.departments=Array.from(d.entries()).map(([i,h])=>({id:i,name:h}))}catch(e){console.error(e),E.error("Data Loading Failed","Could not load assignees list.")}this.overlayEl||(this.overlayEl=document.createElement("div"),this.overlayEl.id="drawer-overlay",this.overlayEl.style.cssText=`
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
      `,this.overlayEl.addEventListener("click",()=>this.close()),document.body.appendChild(this.overlayEl)),this.drawerEl||(this.drawerEl=document.createElement("div"),this.drawerEl.id="task-create-drawer",document.body.appendChild(this.drawerEl));const s=this.users,o=s.map(e=>{var d;return`<option value="${e.id}">${$(e.firstName)} ${$(e.lastName)} (${$(((d=e.rank)==null?void 0:d.title)||"Employee")})</option>`}).join(""),c=this.departments.map(e=>`<option value="${e.id}">${$(e.name)}</option>`).join("");window.innerWidth<=768?this.drawerEl.innerHTML=`
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
              <textarea id="task-desc" maxlength="2000" placeholder="Add detailed notes..." style="padding: 12px 16px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-size: 14px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none; resize: none; height: 70px; box-sizing: border-box;"></textarea>
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
                        ${$(e.firstName[0])}
                      </div>
                    </div>
                    <span style="font-size: 12px; font-weight: 600; color: var(--text-primary);">${$(e.firstName)}</span>
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
              <textarea id="task-desc" maxlength="2000" placeholder="Provide clear contextual description parameters..." rows="4" style="padding: 10px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none; resize: vertical;"></textarea>
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
                ${c}
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
                ${o}
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
      `,this.initListeners()}initListeners(){const s=document.getElementById("drawer-task-form"),o=document.getElementById("close-drawer-btn"),c=document.getElementById("cancel-drawer-btn"),n=document.getElementById("submit-task-btn"),e=document.getElementById("task-assignee"),d=document.getElementById("workload-banner"),i=document.getElementById("task-recurring"),h=document.getElementById("recurring-interval-wrapper");o==null||o.addEventListener("click",()=>this.close()),c==null||c.addEventListener("click",()=>this.close()),i&&h&&i.addEventListener("change",()=>{h.style.display=i.checked?"flex":"none"}),e&&d&&e.addEventListener("change",()=>{var u;const p=Number(e.value),l=this.users.find(m=>m.id===p);if(l){const m=((u=l.rank)==null?void 0:u.title)||"Employee";d.style.display="block",d.style.backgroundColor="rgba(37, 99, 235, 0.05)",d.style.borderColor="rgba(37, 99, 235, 0.2)",d.innerHTML=`
            <strong style="color: var(--text-primary);">Workload awareness:</strong> 
            Assigned to <strong>${l.firstName}</strong> (${m}). 
            Verify availability before assigning critical operations.
          `}});const r=document.getElementById("task-due");r&&r.addEventListener("click",()=>{try{r.showPicker()}catch(p){console.warn("showPicker not supported",p)}});const g=window.innerWidth<=768;if(g){const p=document.getElementById("task-priority");document.querySelectorAll(".mobile-priority-opt").forEach(m=>{m.addEventListener("click",()=>{document.querySelectorAll(".mobile-priority-opt").forEach(w=>{w.classList.remove("active"),w.style.background="var(--sidebar-bg)",w.style.color="var(--text-secondary)"}),m.classList.add("active"),m.style.background="#E0E7FF",m.style.color="#4338CA",p&&(p.value=m.dataset.val)})});const l=document.getElementById("task-due");document.querySelectorAll(".mobile-due-opt").forEach(m=>{m.addEventListener("click",()=>{if(document.querySelectorAll(".mobile-due-opt").forEach(w=>{w.classList.remove("active"),w.style.background="var(--sidebar-bg)",w.style.color="var(--text-secondary)"}),m.classList.add("active"),m.style.background="#E0E7FF",m.style.color="#4338CA",l){const w=parseInt(m.dataset.offset,10),b=new Date;b.setDate(b.getDate()+w),l.value=b.toISOString().split("T")[0]}})}),l&&l.addEventListener("change",()=>{document.querySelectorAll(".mobile-due-opt").forEach(m=>{m.classList.remove("active"),m.style.background="var(--sidebar-bg)",m.style.color="var(--text-secondary)"})});const u=document.getElementById("task-assignee");document.querySelectorAll(".mobile-assignee-opt").forEach(m=>{m.addEventListener("click",()=>{document.querySelectorAll(".mobile-assignee-opt > div").forEach(w=>{w.style.border="2px solid transparent"}),m.firstElementChild.style.border="2px solid #3B82F6",u&&(u.value=m.dataset.id)})})}const f=()=>{const p=g?document.getElementById("mobile-subtasks-list"):document.getElementById("desktop-subtasks-list");p&&(p.innerHTML=this.subtasks.map((l,u)=>`
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: var(--radius-md);">
          <span style="font-size: 13px; color: var(--text-primary);">${$(l)}</span>
          <button type="button" data-index="${u}" class="remove-subtask-btn" style="background: none; border: none; color: var(--status-danger); cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">&times;</button>
        </div>
      `).join(""),p.querySelectorAll(".remove-subtask-btn").forEach(l=>{l.addEventListener("click",u=>{const m=Number(u.currentTarget.dataset.index);this.subtasks.splice(m,1),f()})}))},x=g?document.getElementById("mobile-add-subtask-btn"):document.getElementById("desktop-add-subtask-btn"),a=g?document.getElementById("mobile-new-subtask"):document.getElementById("desktop-new-subtask");x&&a&&(x.addEventListener("click",()=>{const p=a.value.trim();p&&(this.subtasks.push(p),a.value="",f())}),a.addEventListener("keypress",p=>{p.key==="Enter"&&(p.preventDefault(),x.click())})),f(),n==null||n.addEventListener("click",()=>{if(g){const p=document.getElementById("task-assignee");if(!p||!p.value){const l=document.getElementById("drawer-error-alert");l&&(l.innerText="Please assign someone by tapping an avatar.",l.style.display="block");return}}s==null||s.dispatchEvent(new Event("submit",{cancelable:!0}))}),s==null||s.addEventListener("submit",async p=>{p.preventDefault();const l=document.getElementById("task-title").value.trim(),u=document.getElementById("task-desc").value.trim(),m=document.getElementById("task-due").value,w=document.getElementById("task-priority").value,b=document.getElementById("task-dept").value,k=document.getElementById("task-assignee").value,v=i?i.checked:!1,T=v&&document.getElementById("task-interval")?document.getElementById("task-interval").value:null,M=window.innerWidth<=768?document.getElementById("mobile-new-subtask"):document.getElementById("desktop-new-subtask");M&&M.value.trim()&&(this.subtasks.push(M.value.trim()),M.value="");const N=document.getElementById("drawer-error-alert");if(N&&(N.style.display="none",N.innerText=""),!l||!m||!k){y("Please populate all mandatory fields.");return}if(l.length>100){y("Task title cannot exceed 100 characters.");return}if(u&&u.length>2e3){y("Description cannot exceed 2000 characters.");return}const H=new Date(m),j=new Date;if(j.setHours(0,0,0,0),H<j){y("Due date cannot be set in the past.");return}const B=new Date;if(B.setFullYear(j.getFullYear()+10),H>B){y("Due date cannot be set further than 10 years in the future.");return}try{n&&(n.disabled=!0,n.innerText="Creating..."),await A("POST","/tasks",{title:l,description:u,dueDate:m,priority:w,departmentId:b?Number(b):null,assigneeIds:[Number(k)],isRecurring:v,recurrenceInterval:T,subtasks:this.subtasks}),E.success("Task Created","Task assigned successfully."),this.close(),this.onSuccess&&this.onSuccess()}catch(U){console.error(U),y(U.message||"Task creation failed."),E.error("Task Creation Failed",U.message||"Check parameters."),n&&(n.disabled=!1,n.innerText="Create Task")}});function y(p){const l=document.getElementById("drawer-error-alert");l&&(l.innerText=p,l.style.display="block",l.scrollIntoView({behavior:"smooth",block:"start"}))}}open(){this.render().then(()=>{this.overlayEl.style.pointerEvents="auto",this.overlayEl.style.opacity="1",this.drawerEl.classList.add("open")})}close(){this.overlayEl&&(this.overlayEl.style.opacity="0",this.overlayEl.style.pointerEvents="none"),this.drawerEl&&this.drawerEl.classList.remove("open")}}let je=[],me=null,ze=null,He=[],G=localStorage.getItem("tascorr_task_tab")||"assigned",ge=localStorage.getItem("tascorr_show_completed")==="true";function Je(){return`
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
              <button id="tab-assigned" class="task-tab-btn ${G==="assigned"?"active":""}" style="flex: 1; padding: 10px; border: none; border-radius: var(--radius-md); font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s; background: ${G==="assigned"?"var(--bg-primary)":"transparent"}; color: ${G==="assigned"?"var(--text-primary)":"var(--text-secondary)"}; box-shadow: ${G==="assigned"?"0 2px 4px rgba(0,0,0,0.05)":"none"};">My Tasks</button>
              <button id="tab-delegated" class="task-tab-btn ${G==="delegated"?"active":""}" style="flex: 1; padding: 10px; border: none; border-radius: var(--radius-md); font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s; background: ${G==="delegated"?"var(--bg-primary)":"transparent"}; color: ${G==="delegated"?"var(--text-primary)":"var(--text-secondary)"}; box-shadow: ${G==="delegated"?"0 2px 4px rgba(0,0,0,0.05)":"none"};">Delegated</button>
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
  `}async function Ke(){if(!document.getElementById("task-items-container"))return;try{He=(await A("GET","/users")).users||[]}catch(f){console.error(f)}ze=new Pe(()=>{Q()});const s=document.getElementById("workspace-create-task-btn"),o=document.getElementById("workspace-toggle-filters-btn"),c=document.getElementById("tasks-filter-bar"),n=document.getElementById("tab-assigned"),e=document.getElementById("tab-delegated"),d=document.getElementById("task-show-completed"),i=f=>{G=f,localStorage.setItem("tascorr_task_tab",f),[n,e].forEach(a=>{a&&(a.style.background="transparent",a.style.color="var(--text-secondary)",a.style.boxShadow="none",a.classList.remove("active"))});const x=f==="assigned"?n:e;x&&(x.style.background="var(--bg-primary)",x.style.color="var(--text-primary)",x.style.boxShadow="0 2px 4px rgba(0,0,0,0.05)",x.classList.add("active")),se()};n==null||n.addEventListener("click",()=>i("assigned")),e==null||e.addEventListener("click",()=>i("delegated")),d==null||d.addEventListener("change",f=>{ge=f.target.checked,localStorage.setItem("tascorr_show_completed",ge),se()}),s==null||s.addEventListener("click",()=>{ze.open()}),o==null||o.addEventListener("click",()=>{c&&(c.style.display==="none"?(c.style.display="flex",o.classList.add("active"),o.style.color="var(--accent-navy-primary)"):(c.style.display="none",o.classList.remove("active"),o.style.color="var(--text-primary)"))});const h=document.getElementById("task-search-input"),r=document.getElementById("task-status-filter"),g=document.getElementById("task-priority-filter");[h,r,g].forEach(f=>{f==null||f.addEventListener("input",()=>{se()})}),await Q()}async function Q(){const t=document.getElementById("task-items-container");if(t)try{je=(await A("GET","/tasks")).tasks||[],se()}catch(s){console.error(s),t.innerHTML=`<div style="padding: 24px; text-align: center; color: var(--status-danger);">Error fetching tasks: ${s.message}</div>`}}function se(){var d,i,h;const t=document.getElementById("task-items-container");if(!t)return;const s=((d=document.getElementById("task-search-input"))==null?void 0:d.value.toLowerCase())||"",o=((i=document.getElementById("task-status-filter"))==null?void 0:i.value)||"ALL",c=((h=document.getElementById("task-priority-filter"))==null?void 0:h.value)||"ALL",n=I.currentUser,e=je.filter(r=>{var p;let g=!0;if(n){const l=(p=r.assignments)==null?void 0:p.some(m=>m.userId===n.id),u=r.createdById===n.id&&!l;G==="assigned"?g=l:G==="delegated"&&(g=u)}const f=r.title.toLowerCase().includes(s)||r.description.toLowerCase().includes(s),x=o==="ALL"||r.status===o,a=c==="ALL"||r.priority===c;let y=!0;if(r.status==="Completed"&&o!=="Completed")if(ge)y=!0;else{const l=r.updatedAt?new Date(r.updatedAt):new Date(r.createdAt);y=(Date.now()-l.getTime())/(1e3*60*60)<=24}return g&&f&&x&&a&&y});if(e.sort((r,g)=>{const f=r.status==="Completed",x=g.status==="Completed";return f&&!x?1:!f&&x?-1:new Date(g.createdAt)-new Date(r.createdAt)}),e.length===0){t.innerHTML=`
      <div style="padding: 48px 24px; text-align: center; color: var(--text-secondary); display: flex; flex-direction: column; gap: 8px;">
        <p class="body-text" style="font-weight: 600;">No tasks found.</p>
        <p class="small-text">Clear filters or create a new task workspace.</p>
      </div>
    `;return}t.innerHTML=e.map(r=>{var C,M,N,H,j;const g=me&&me.id===r.id,f=g?"border: 2px solid var(--accent-navy-primary);":"border: 1px solid var(--border-neutral);",a={High:"#DC2626",Critical:"#DC2626",Medium:"#D97706",Low:"#10B981"}[r.priority]||"#3B82F6",p={Pending:"#3B82F6","In Progress":"#10B981",Blocked:"#EF4444","Under Review":"#F59E0B",Completed:"#16A34A"}[r.status]||"#3B82F6";let l=((C=r.assignments)==null?void 0:C.length)>0?`${r.assignments[0].user.firstName} ${r.assignments[0].user.lastName}`:"Unassigned",u=((M=r.assignments)==null?void 0:M.length)>0?r.assignments[0].userId:null,m=l!=="Unassigned"?r.assignments[0].user.firstName[0]:"?",w="";u===((N=I.currentUser)==null?void 0:N.id)&&(r.creator?(l=`${r.creator.firstName} ${r.creator.lastName}`,u=r.creator.id,m=r.creator.firstName[0],w="From: "):(l="System",u=null,m="S",w="From: "));const b=((H=r.subtasks)==null?void 0:H.length)||0,k=((j=r.subtasks)==null?void 0:j.filter(B=>B.status==="Completed").length)||0,v=b>0?Math.round(k/b*100):r.status==="Completed"?100:0,T=r.status==="Completed"?"opacity: 0.6;":"";return`
      <div class="task-list-item" data-id="${r.id}" style="background: var(--bg-primary); ${f} border-radius: 20px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); margin-bottom: 16px; cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease; ${g?"transform: translateY(-2px); box-shadow: 0 4px 12px rgba(37,99,235,0.15);":""} ${T}">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div style="display: flex; gap: 8px; align-items: center;">
            <span style="color: ${a}; background: ${a}15; padding: 4px 8px; border-radius: 8px; font-size: 10px; font-weight: 700;">${r.priority}</span>
            <span style="color: var(--text-secondary); font-size: 12px; font-weight: 500;">General</span>
          </div>
          <div style="background: var(--bg-secondary); padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; color: var(--text-secondary); display: flex; align-items: center; gap: 4px;">
            <span style="display: block; width: 6px; height: 6px; border-radius: 50%; background: ${p};"></span> ${r.status}
          </div>
        </div>
        <h4 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">${$(r.title)}</h4>
        <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 16px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${$(r.description)}</p>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${b>0?"8px":"0"};">
          ${b>0?`
          <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-secondary);">
            <input type="radio" checked style="accent-color: var(--text-primary); pointer-events: none;" /> ${k}/${b} subtasks
          </div>
          <span style="font-size: 11px; color: var(--text-secondary);">${v}%</span>
          `:"<div></div>"}
        </div>
        ${b>0?`
        <div style="width: 100%; height: 4px; background: var(--bg-secondary); border-radius: 2px; margin-bottom: 16px; overflow: hidden;">
          <div style="height: 100%; width: ${v}%; background: var(--text-primary); border-radius: 2px;"></div>
        </div>
        `:""}

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border-neutral); padding-top: 12px; margin-top: ${b>0?"0":"16px"};">
          <div style="display: flex; align-items: center; gap: 8px;">
            ${u?`<img src="/avatars/user-${u}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;" />`:""}
            <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--sidebar-bg); color: var(--text-primary); display: ${u?"none":"flex"}; align-items: center; justify-content: center; font-size: 10px; font-weight: 700;">${m}</div>
            <span style="font-size: 11px; color: var(--text-secondary); font-weight: 500;">${w}${$(l)}</span>
          </div>
          <span class="small-text" style="color: var(--text-secondary); font-size: 10px;">
            ${new Date(r.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    `}).join(""),t.querySelectorAll(".task-list-item").forEach(r=>{r.addEventListener("click",async()=>{const g=Number(r.dataset.id);await _(g);const f=document.getElementById("tasks-workspace-container");f&&f.classList.add("task-selected"),se()})})}async function _(t){var o,c,n,e,d,i,h,r,g,f;const s=document.getElementById("task-details-container");if(s){s.innerHTML='<div style="margin: auto; color: var(--text-secondary);">Loading task details...</div>';try{me=(await A("GET",`/tasks/${t}`)).task;const a=me,p={Pending:"status-info","In Progress":"status-info",Blocked:"status-danger","Under Review":"status-warning",Completed:"status-success"}[a.status]||"status-info",l=(o=a.assignments)==null?void 0:o.find(z=>z.isActive),u=l?`${l.user.firstName} ${l.user.lastName}`:"Unassigned",m=l?l.userId:null,w=l?l.user.firstName[0]:"?",b=I.isAdmin(),k=a.createdById===((c=I.currentUser)==null?void 0:c.id),v=l&&l.userId===((n=I.currentUser)==null?void 0:n.id),T=b||k,C=((e=a.subtasks)==null?void 0:e.length)>0?a.subtasks.map(z=>{const R=z.status==="Completed"?"checked":"";return`
            <label style="display: flex; align-items: center; gap: 10px; font-size: 13px; cursor: pointer; ${z.status==="Completed"?"text-decoration: line-through; color: var(--text-secondary);":""}">
              <input type="checkbox" class="subtask-chk" data-sid="${z.id}" ${R} style="accent-color: var(--accent-navy-primary);" />
              <span>${$(z.title)}</span>
            </label>
          `}).join(""):'<p class="small-text" style="color: var(--text-secondary);">No subtask checklist items defined.</p>',M=(d=a.blockers)==null?void 0:d.find(z=>!z.resolvedAt),N=a.status==="Completed",H=((i=I.currentUser)==null?void 0:i.rankLevel)<=4&&((h=I.currentUser)==null?void 0:h.rankLevel)>0,j=k||b||H;let B="";N||((v||j)&&(B+=`
          <div style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
            <label class="small-text" style="font-weight:600;">Update Task Status</label>
            <select id="task-status-update" style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-primary);">
              <option value="Pending" ${a.status==="Pending"?"selected":""}>Pending</option>
              <option value="In Progress" ${a.status==="In Progress"?"selected":""}>In Progress</option>
              <option value="Under Review" ${a.status==="Under Review"?"selected":""}>${j?"Under Review":"Request Completion (Under Review)"}</option>
              ${j?`<option value="Completed" ${a.status==="Completed"?"selected":""}>Completed (Close Task)</option>`:""}
            </select>
          </div>
        `),v&&!M&&(B+=`
          <button id="flag-blocker-btn" style="padding: 10px; background-color: transparent; border: 1px solid var(--status-danger); color: var(--status-danger); border-radius: var(--radius-md); font-weight: 600; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 6px;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:var(--status-danger);"></span> Flag Blocker
          </button>
        `),(k||b)&&(B+=`
          <button id="reassign-task-btn" style="padding: 10px; background-color: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-weight: 600; cursor: pointer; font-size: 13px;">
            Reassign Task
          </button>
          <button id="edit-task-btn" style="padding: 10px; background-color: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-weight: 600; cursor: pointer; font-size: 13px;">
            Edit Task
          </button>
        `),k&&(B+=`
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
          <span class="pill-badge ${p}"><span class="badge-dot"></span>${$(a.status)}</span>
        </div>
        <h2 class="section-title" style="font-size: 20px; line-height: 1.3;">${$(a.title)}</h2>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px;">
          <div class="pill-badge status-info" style="font-size: 11px; display: flex; align-items: center; gap: 6px; padding-left: 6px;">
            ${m?`
              <img src="/avatars/user-${m}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width:16px;height:16px;border-radius:50%;object-fit:cover;" />
              <div style="width:16px;height:16px;border-radius:50%;background:var(--accent-navy-primary);color:#fff;display:none;align-items:center;justify-content:center;font-size:8px;font-weight:bold;margin-left:-2px;">${$(w)}</div>
            `:""}
            Assigned to: ${$(u)}
          </div>
          <div class="pill-badge" style="font-size: 11px; display: flex; align-items: center; gap: 6px; padding-left: 6px; background-color: var(--bg-secondary); border: 1px solid var(--border-neutral); color: var(--text-secondary);">
            Assigned by: ${a.creator?$(a.creator.firstName+" "+a.creator.lastName):"System"}
          </div>
          <div class="pill-badge status-danger" style="font-size: 11px;">${$(a.priority)} Priority</div>
          <div class="pill-badge status-warning" style="font-size: 11px;">Due: ${new Date(a.dueDate).toLocaleDateString()}</div>
        </div>
      </div>

      <!-- Detail Contents -->
      <div style="flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 24px;">
        <!-- Blocker warning banner -->
        ${M?`
          <div style="padding: 16px; background-color: rgba(220, 38, 38, 0.08); border-left: 4px solid var(--status-danger); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 8px;">
            <strong class="data-number" style="color: var(--status-danger);">Task is Blocked</strong>
            <p class="small-text" style="color: var(--text-primary); margin:0;">${$(M.description)}</p>
            ${T?`
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
          <p class="body-text" style="color: var(--text-primary);">${$(a.description)}</p>
        </div>

        <!-- Subtasks Block -->
        <div>
          <h4 class="small-text" style="font-weight: 600; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.05em; color: var(--text-secondary);">Subtasks Checklist</h4>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${C}
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
            ${He.map(z=>`<option value="${z.id}">${z.firstName} ${z.lastName}</option>`).join("")}
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
                      <span class="small-text" style="font-weight: 600; color: var(--text-primary);">${z.author?$(z.author.firstName+" "+z.author.lastName):"Unknown User"}</span>
                      <span class="small-text" style="font-size:10px;">${new Date(z.createdAt).toLocaleString()}</span>
                    </div>
                    <p class="body-text" style="font-size: 12px; color: var(--text-primary); margin:0;">${$(z.content)}</p>
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
              <span class="${p}" style="padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">${a.status}</span>
            </div>
            <button id="mobile-task-detail-close" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary);">&times;</button>
          </div>
        </div>

        <!-- Scrollable Content Area -->
        <div style="flex: 1; overflow-y: auto; padding: 24px; padding-bottom: 100px;">
          <h2 style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; line-height: 1.2;">${$(a.title)}</h2>
          <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 24px;">${$(a.description)}</p>

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
            ${m?`<img src="/avatars/user-${m}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />`:""}
            <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--sidebar-bg); color: var(--text-primary); display: ${m?"none":"flex"}; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">${w}</div>
            <div style="display: flex; flex-direction: column;">
              <span style="font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Assigned To</span>
              <span style="font-size: 14px; font-weight: 600; color: var(--text-primary);">${$(u)}</span>
            </div>
          </div>

          <!-- Subtasks -->
          <div>
            <h3 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 16px;">Subtasks</h3>
            <div style="display: flex; flex-direction: column; gap: 16px;">
              ${((f=a.subtasks)==null?void 0:f.length)>0?a.subtasks.map(z=>{const R=z.status==="Completed";return`
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div class="mobile-subtask-toggle" data-sid="${z.id}" data-done="${R}" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid ${R?"#3B82F6":"#D1D5DB"}; background: ${R?"#3B82F6":"transparent"}; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;">
                      ${R?'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>':""}
                    </div>
                    <span style="font-size: 14px; color: ${R?"#9CA3AF":"var(--text-primary)"}; text-decoration: ${R?"line-through":"none"};">${$(z.title)}</span>
                  </div>
                `}).join(""):'<div style="font-size: 14px; color: var(--text-secondary);">No subtasks defined.</div>'}
            </div>
          </div>
        </div>

        <!-- Fixed Bottom Button -->
        ${!N||k?`
          <div style="position: absolute; bottom: 0; left: 0; width: 100%; padding: 16px 24px; background: var(--bg-primary); border-top: 1px solid var(--border-neutral); border-radius: 0 0 32px 32px; display: flex; gap: 12px; box-shadow: 0 -4px 12px rgba(0,0,0,0.05); z-index: 10;">
            ${N?"":`
              <button id="mobile-mark-complete-btn" style="flex: 1; background: #3B82F6; color: white; padding: 14px 20px; border: none; border-radius: 100px; font-size: 15px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(59,130,246,0.3);">
                Mark as Complete
              </button>
            `}
            ${k?`
              <button id="mobile-delete-task-btn" style="flex: 1; background: transparent; border: 2px solid var(--status-danger); color: var(--status-danger); padding: 14px 20px; border-radius: 100px; font-size: 15px; font-weight: 700; cursor: pointer;">
                Delete Task
              </button>
            `:""}
          </div>
        `:""}
      </div>
    `;const U=`
      <div id="edit-task-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); backdrop-filter:blur(4px); z-index:9999; align-items:center; justify-content:center;">
        <div class="widget-card" style="width:100%; max-width:500px; padding:24px; display:flex; flex-direction:column; gap:16px;">
          <h3 class="card-title">Edit Task</h3>
          <div class="form-group">
            <label class="small-text">Task Title</label>
            <input type="text" id="edit-task-title" value="${$(a.title)}" class="tascorr-input" />
          </div>
          <div class="form-group">
            <label class="small-text">Description</label>
            <textarea id="edit-task-desc" class="tascorr-input" rows="4">${$(a.description)}</textarea>
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
    `;s.innerHTML+=U,setTimeout(()=>{const z=s.querySelector(".mobile-only");z&&(z.style.transform="translateY(100%)",z.offsetWidth,z.style.transition="transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",z.style.transform="translateY(0)")},10),Xe(a)}catch(x){console.error(x),s.innerHTML=`<div style="margin: auto; color: var(--status-danger);">Failed to fetch task details: ${x.message}</div>`}}}function Xe(t){var u,m,w,b,k;(u=document.getElementById("mobile-task-detail-close"))==null||u.addEventListener("click",()=>{const v=document.getElementById("tasks-workspace-container");v&&v.classList.remove("task-selected")}),(m=document.getElementById("task-detail-back-btn"))==null||m.addEventListener("click",()=>{const v=document.getElementById("tasks-workspace-container");v&&v.classList.remove("task-selected")}),(w=document.getElementById("mobile-mark-complete-btn"))==null||w.addEventListener("click",async()=>{try{if(await A("PATCH",`/tasks/${t.id}/status`,{status:"Completed"}),t.subtasks&&t.subtasks.length>0)for(const v of t.subtasks)v.status!=="Completed"&&await A("PATCH",`/tasks/${t.id}/subtasks/${v.id}`,{status:"Completed"});_(t.id),se()}catch(v){alert(v.message)}});const s=async()=>{var v;if(confirm("Are you sure you want to permanently delete this task? All dependencies, assignments, comments, and subtasks will be lost."))try{await A("DELETE",`/tasks/${t.id}`),E.success("Task Deleted","Task was deleted successfully.");const T=document.getElementById("task-details-container");T&&(T.innerHTML=`
          <div style="padding: 32px; text-align: center; color: var(--text-secondary); margin: auto;">
            Select a task item to view full operational details.
          </div>
        `),(v=document.getElementById("tasks-workspace-container"))==null||v.classList.remove("task-selected"),await Q()}catch(T){E.error("Deletion Failed",T.message)}};(b=document.getElementById("delete-task-btn"))==null||b.addEventListener("click",s),(k=document.getElementById("mobile-delete-task-btn"))==null||k.addEventListener("click",s);const o=document.getElementById("task-status-update");o==null||o.addEventListener("change",async()=>{const v=o.value;try{await A("PATCH",`/tasks/${t.id}/status`,{status:v}),E.success("Status Updated",`Task set to ${v}.`),await _(t.id),Q()}catch(T){E.error("Update Failed",T.message),o.value=t.status}}),document.querySelectorAll(".subtask-chk").forEach(v=>{v.addEventListener("change",async()=>{const T=Number(v.dataset.sid),C=v.checked,M=C?"Completed":"Pending";try{await A("PATCH",`/tasks/${t.id}/subtasks/${T}`,{status:M}),E.success("Subtask Updated",`Subtask marked as ${M}.`),await _(t.id)}catch(N){E.error("Update Failed",N.message),v.checked=!C}})}),document.querySelectorAll(".mobile-subtask-toggle").forEach(v=>{v.addEventListener("click",async()=>{const T=Number(v.dataset.sid),M=v.dataset.done==="true"?"Pending":"Completed";try{await A("PATCH",`/tasks/${t.id}/subtasks/${T}`,{status:M}),E.success("Subtask Updated",`Subtask marked as ${M}.`),await _(t.id)}catch(N){E.error("Update Failed",N.message)}})});const c=document.getElementById("flag-blocker-btn"),n=document.getElementById("blocker-report-form"),e=document.getElementById("submit-blocker-btn"),d=document.getElementById("cancel-blocker-btn");c==null||c.addEventListener("click",()=>{n.style.display="flex"}),d==null||d.addEventListener("click",()=>{n.style.display="none"}),e==null||e.addEventListener("click",async()=>{const v=document.getElementById("blocker-desc").value.trim();if(!v){E.warning("Validation Check","Blocker explanation content is mandatory.");return}try{await A("POST",`/tasks/${t.id}/blockers`,{description:v}),E.success("Blocker Logged","Task flagged as blocked."),await _(t.id),Q()}catch(T){E.error("Submission Failed",T.message)}});const i=document.getElementById("resolve-blocker-btn");i==null||i.addEventListener("click",async()=>{var C,M;const v=Number(i.dataset.bid),T=(M=(C=document.getElementById("blocker-resolution-text"))==null?void 0:C.value)==null?void 0:M.trim();if(!T){E.warning("Validation","Resolution comment is mandatory.");return}try{await A("PATCH",`/tasks/${t.id}/blockers/${v}/resolve`,{resolutionComment:T}),E.success("Blocker Resolved","Task is back in progress."),await _(t.id),Q()}catch(N){E.error("Resolution Failed",N.message)}});const h=document.getElementById("edit-task-btn"),r=document.getElementById("edit-task-modal"),g=document.getElementById("cancel-edit-task"),f=document.getElementById("save-edit-task");h==null||h.addEventListener("click",()=>{r.style.display="flex"}),g==null||g.addEventListener("click",()=>{r.style.display="none"}),f==null||f.addEventListener("click",async()=>{const v=document.getElementById("edit-task-title").value.trim(),T=document.getElementById("edit-task-desc").value.trim(),C=document.getElementById("edit-task-due").value,M=document.getElementById("edit-task-priority").value;if(!v||!T||!C){E.warning("Validation Check","Title, description, and due date are mandatory.");return}try{await A("PATCH",`/tasks/${t.id}`,{title:v,description:T,dueDate:C,priority:M}),E.success("Task Updated","Task details have been successfully modified."),r.style.display="none",await _(t.id),Q()}catch(N){E.error("Update Failed",N.message)}});const x=document.getElementById("reassign-task-btn"),a=document.getElementById("reassignment-form"),y=document.getElementById("submit-reassign-btn"),p=document.getElementById("cancel-reassign-btn");x==null||x.addEventListener("click",()=>{a.style.display="flex"}),p==null||p.addEventListener("click",()=>{a.style.display="none"}),y==null||y.addEventListener("click",async()=>{const v=document.getElementById("reassign-user").value,T=document.getElementById("reassign-reason").value.trim();if(!v||!T){E.warning("Validation Check","New assignee selection and reason parameters are mandatory.");return}try{await A("POST",`/tasks/${t.id}/reassign`,{targetAssigneeId:Number(v),reason:T}),E.success("Task Delegated","Assignee reassignment completed successfully."),await _(t.id),Q()}catch(C){E.error("Reassignment Failed",C.message)}});const l=document.getElementById("submit-comment-btn");l==null||l.addEventListener("click",async()=>{const v=document.getElementById("new-comment-text").value.trim();if(v)try{await A("POST",`/tasks/${t.id}/comments`,{content:v}),E.success("Comment Posted","Your message has been appended."),await _(t.id)}catch(T){E.error("Send Failed",T.message)}})}let ee=[],ie=[];function Qe(){const t=I.isAdmin();return`
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
  `}async function et(){const t=document.getElementById("hierarchy-tree-root");if(!t)return;if(I.isAdmin()){const o=document.getElementById("add-dept-btn"),c=document.getElementById("create-dept-card"),n=document.getElementById("cancel-dept-btn"),e=document.getElementById("create-dept-form"),d=document.getElementById("edit-dept-modal"),i=document.getElementById("close-edit-dept-modal-btn"),h=document.getElementById("edit-dept-form");o==null||o.addEventListener("click",()=>{c.style.display=c.style.display==="none"?"flex":"none"}),n==null||n.addEventListener("click",()=>{c.style.display="none"}),t.addEventListener("click",async r=>{const g=r.target.closest(".edit-dept-btn"),f=r.target.closest(".delete-dept-btn");if(g){const x=Number(g.dataset.id),a=ee.find(y=>y.id===x);if(a){document.getElementById("edit-dept-id").value=a.id,document.getElementById("edit-dept-name").value=a.name;const y=document.getElementById("edit-dept-head");y&&(y.innerHTML='<option value="">No Head Assigned</option>'+ie.map(p=>{var l;return`<option value="${p.id}">${$(p.firstName)} ${$(p.lastName)} (${$(((l=p.rank)==null?void 0:l.title)||"Employee")})</option>`}).join(""),y.value=a.headUserId||""),d&&(d.style.display="flex")}}if(f){const x=Number(f.dataset.id),a=ee.find(y=>y.id===x);if(a&&confirm(`Are you sure you want to delete the "${a.name}" department? All members will be unassigned.`))try{await A("DELETE",`/departments/${x}`),E.success("Department Deleted","Department node removed."),await de()}catch(y){console.error(y),E.error("Deletion Failed",y.message||"Could not delete department.")}}}),i==null||i.addEventListener("click",()=>{d&&(d.style.display="none")}),h==null||h.addEventListener("submit",async r=>{r.preventDefault();const g=Number(document.getElementById("edit-dept-id").value),f=document.getElementById("edit-dept-name").value.trim(),x=document.getElementById("edit-dept-head").value,a=document.getElementById("edit-dept-error-alert");if(a&&(a.style.display="none",a.innerText=""),!f||f.length<2){a&&(a.innerText="Department name must be at least 2 characters.",a.style.display="block");return}const y=h.querySelector('button[type="submit"]');try{y&&(y.disabled=!0,y.innerText="Saving..."),await A("PATCH",`/departments/${g}`,{name:f,headUserId:x?Number(x):null}),E.success("Department Updated","Department details saved successfully."),d&&(d.style.display="none"),await de()}catch(p){console.error(p),a&&(a.innerText=p.message||"Failed to update department.",a.style.display="block")}finally{y&&(y.disabled=!1,y.innerText="Save Changes")}}),e==null||e.addEventListener("submit",async r=>{r.preventDefault();const g=document.getElementById("dept-name").value.trim(),f=document.getElementById("dept-head").value,x=document.getElementById("dept-error-alert");if(x&&(x.style.display="none",x.innerText=""),!g||g.length<2){x&&(x.innerText="Department name must be at least 2 characters.",x.style.display="block");return}const a=e.querySelector('button[type="submit"]');try{a&&(a.disabled=!0,a.innerText="Saving..."),await A("POST","/departments",{name:g,headUserId:f?Number(f):null}),E.success("Department Created","Department node onboarded successfully."),c.style.display="none",e.reset(),await de()}catch(y){console.error(y),x&&(x.innerText=y.message||"Failed to create department node.",x.style.display="block")}finally{a&&(a.disabled=!1,a.innerText="Save Department")}})}await de()}async function de(){const t=document.getElementById("hierarchy-tree-root");if(!t)return;const s=I.isAdmin();try{const[o,c]=await Promise.all([A("GET","/departments"),A("GET","/users")]);if(ee=o.departments||[],ie=c.users||[],tt(),s){const n=document.getElementById("dept-head");n&&(n.innerHTML='<option value="">No Head Assigned</option>'+ie.map(e=>{var d;return`<option value="${e.id}">${$(e.firstName)} ${$(e.lastName)} (${$(((d=e.rank)==null?void 0:d.title)||"Employee")})</option>`}).join(""))}}catch(o){console.error(o),t.innerHTML=`<div style="color:var(--status-danger)">Error loading structure: ${$(o.message)}</div>`}}function tt(){var e;const t=document.getElementById("hierarchy-tree-root");if(!t)return;const s=I.isAdmin();let o="";const c=ie.filter(d=>{var i;return((i=d.rank)==null?void 0:i.level)===1&&d.status==="active"}),n=c.length>0?c[0]:null;if(n){const d=`/avatars/user-${n.id}.jpg?t=${Date.now()}`,i=`${n.firstName[0]}${n.lastName[0]}`;o+=`
      <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 32px;">
        <!-- Root Card -->
        <div class="org-node" style="position: relative; z-index: 2;">
          <div style="width: 48px; height: 48px; border-radius: 50%; overflow: hidden; margin: 0 auto 12px auto; background-color: var(--accent-navy-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <img src="${d}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 100%; height: 100%; object-fit: cover; display: none;" />
            <div style="display: flex;">${$(i)}</div>
          </div>
          <div style="font-weight: 600; font-size: 14px; text-align: center; color: var(--text-primary); margin-bottom: 4px;">
            ${$(n.firstName)} ${$(n.lastName)}
          </div>
          <div style="font-size: 12px; color: var(--text-secondary); text-align: center;">
            ${$(((e=n.rank)==null?void 0:e.title)||"Top Executive")}
          </div>
        </div>
        
        <!-- Stem down from Root -->
        ${ee.length>0?'<div style="width: 2px; height: 32px; background-color: var(--tree-line-color);"></div>':""}
      </div>
    `}ee.length>0?o+=`
      <div style="display: flex; gap: 32px; justify-content: center; align-items: flex-start; position: relative;">

        ${ee.map((d,i)=>{var x;const h=d.headUser,r=h?`${h.firstName} ${h.lastName}`:"Vacant",g=h?((x=h.rank)==null?void 0:x.title)||"VP / Department Head":"No Head Assigned",f=ie.filter(a=>a.departmentId===d.id&&a.id!==(h==null?void 0:h.id));return`
            <div style="display: flex; flex-direction: column; align-items: center; position: relative; min-width: 200px;">
              
              <!-- Horizontal connector line segments bridging the gap -->
              ${ee.length>1?`
                <div style="position: absolute; top: 0; height: 2px; background-color: var(--tree-line-color);
                  left: ${i===0?"50%":"-16px"};
                  right: ${i===ee.length-1?"50%":"-16px"};"></div>
              `:""}

              <!-- Vertical drop line from horizontal connector -->
              <div style="width: 2px; height: 16px; background-color: var(--tree-line-color); z-index: 2;"></div>
              
              <!-- Department Head Card -->
              <div class="widget-card" style="padding: 16px 20px; text-align: center; border: 1px solid var(--border-neutral); max-width: 240px; min-width: 180px; background-color: var(--bg-secondary); margin-top: -2px; position: relative; z-index: 3;">
                ${s?`
                  <div style="position: absolute; top: 6px; right: 8px; display: flex; gap: 6px; z-index: 5;">
                    <button class="edit-dept-btn" data-id="${d.id}" title="Edit Department" style="background: none; border: none; cursor: pointer; color: var(--text-secondary); padding: 2px; display: flex; align-items: center;">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 13px; height: 13px;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button class="delete-dept-btn" data-id="${d.id}" title="Delete Department" style="background: none; border: none; cursor: pointer; color: var(--status-danger); padding: 2px; display: flex; align-items: center;">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 13px; height: 13px;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                `:""}
                <span class="small-text" style="font-weight: 700; color: var(--accent-navy-primary); text-transform: uppercase; font-size: 10px; display:block; margin-bottom: 8px; padding-right: 28px; text-align: left;">${$(d.name)}</span>
                <div style="display:flex;align-items:center;gap:12px;text-align:left;">
                  <img src="/avatars/user-${h==null?void 0:h.id}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width:36px;height:36px;border-radius:50%;object-fit:cover;display:${h?"block":"none"};" />
                  <div style="width:36px;height:36px;border-radius:50%;background:var(--accent-navy-primary);color:#fff;display:${h?"none":"flex"};align-items:center;justify-content:center;font-weight:bold;font-size:14px;flex-shrink:0;">${$(r[0]||"?")}</div>
                  <div>
                    <h4 class="card-title" style="font-size: 13px; font-weight: 600; text-align: left;">${$(r)}</h4>
                    <p class="small-text" style="color: var(--text-secondary); font-size:11px; text-align: left;">${$(g)}</p>
                  </div>
                </div>
              </div>

              <!-- Connector Line to Department Members -->
              ${f.length>0?`
                <div style="width: 2px; height: 24px; background-color: var(--tree-line-color);"></div>
                
                <!-- Members vertical tree stack -->
                <div style="display: flex; flex-direction: column; gap: 12px; align-items: center; width: 100%;">
                  ${f.map(a=>{var y;return`
                    <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
                      <div style="width: 2px; height: 12px; background-color: var(--tree-line-color);"></div>
                      <div style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-sm); text-align: left; background-color: var(--bg-primary); min-width: 140px; max-width: 200px; display: flex; align-items: center; gap: 8px;">
                        <img src="/avatars/user-${a.id}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width:24px;height:24px;border-radius:50%;object-fit:cover;display:block;" />
                        <div style="width:24px;height:24px;border-radius:50%;background:var(--accent-navy-primary);color:#fff;display:none;align-items:center;justify-content:center;font-weight:bold;font-size:10px;flex-shrink:0;">${$(a.firstName[0]||"?")}</div>
                        <div>
                          <strong class="data-number" style="font-size: 12px; display:block;">${$(a.firstName)} ${$(a.lastName)}</strong>
                          <div class="small-text" style="font-size:10px; margin-top:2px;">${$(((y=a.rank)==null?void 0:y.title)||"Employee")}</div>
                        </div>
                      </div>
                    </div>
                  `}).join("")}
                </div>
              `:""}
            </div>
          `}).join("")}
      </div>
    `:o+='<p class="small-text" style="color:var(--text-secondary)">No departments configured.</p>',t.innerHTML=o}let ye=[],X=[],he=[];function at(){const t=I.isAdmin();return`
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
  `}async function rt(){var o,c,n;if(!document.getElementById("employees-table-body"))return;const s=I.isAdmin();if((o=document.getElementById("employee-search"))==null||o.addEventListener("input",we),(c=document.getElementById("employee-status"))==null||c.addEventListener("input",we),s){let y=function(l){const u=document.getElementById("employee-error-alert");u&&(u.innerText=l,u.style.display="block")},p=function(l){const u=document.getElementById("rank-error-alert");u&&(u.innerText=l,u.style.display="block")};const e=document.getElementById("add-employee-btn"),d=document.getElementById("add-employee-drawer"),i=document.getElementById("cancel-employee-btn"),h=document.getElementById("create-employee-form"),r=document.getElementById("create-rank-form"),g=document.getElementById("edit-employee-modal"),f=document.getElementById("close-edit-modal-btn"),x=document.getElementById("edit-employee-form");e==null||e.addEventListener("click",()=>{ye.filter(u=>u.status==="active").length>=10&&E.warning("Tier Limit Warning","Your workspace count is at 10 active users. Adding employees requires tier migration support."),d.style.display=d.style.display==="none"?"flex":"none"}),i==null||i.addEventListener("click",()=>{d.style.display="none"}),(n=document.getElementById("employees-table-body"))==null||n.addEventListener("click",async l=>{const u=l.target.closest(".edit-emp-btn");if(u){const w=Number(u.dataset.id),b=ye.find(k=>k.id===w);if(b){document.getElementById("edit-emp-id").value=b.id,document.getElementById("edit-emp-first").value=b.firstName,document.getElementById("edit-emp-last").value=b.lastName;const k=document.getElementById("edit-emp-rank");k&&(k.innerHTML=X.map(C=>`<option value="${C.id}">${$(C.title)} (Level ${C.level})</option>`).join(""),k.value=b.rankId);const v=document.getElementById("edit-emp-dept");v&&(v.innerHTML='<option value="">Unassigned</option>'+he.map(C=>`<option value="${C.id}">${$(C.name)}</option>`).join(""),v.value=b.departmentId||""),document.getElementById("edit-emp-status").value=b.status;const T=document.getElementById("edit-emp-password");T&&(T.value=""),g&&(g.style.display="flex")}}const m=l.target.closest(".delete-emp-btn");if(m){const w=Number(m.dataset.id),b=m.dataset.name||"this employee";if(!confirm(`Are you sure you want to delete "${b}"? This action will deactivate their account.`))return;try{m.disabled=!0,m.innerText="Deleting...",await A("DELETE",`/users/${w}`),E.success("Employee Deleted",`${b} has been removed from the directory.`),await te()}catch(k){console.error(k),E.error("Deletion Failed",k.message||"Could not delete employee.")}finally{m.disabled=!1,m.innerText="Delete"}}}),f==null||f.addEventListener("click",()=>{g&&(g.style.display="none")}),x==null||x.addEventListener("submit",async l=>{l.preventDefault();const u=Number(document.getElementById("edit-emp-id").value),m=document.getElementById("edit-emp-first").value.trim(),w=document.getElementById("edit-emp-last").value.trim(),b=Number(document.getElementById("edit-emp-rank").value),k=document.getElementById("edit-emp-dept").value,v=document.getElementById("edit-emp-status").value,T=document.getElementById("edit-emp-password").value;if(!m||!w){E.error("Validation Error","First name and Last name are required.");return}const C={firstName:m,lastName:w,rankId:b,departmentId:k?Number(k):null,status:v};if(T){if(T.length<12||!/[a-z]/.test(T)||!/[A-Z]/.test(T)||!/[0-9]/.test(T)||!/[^a-zA-Z0-9]/.test(T)){E.error("Validation Error","Passwords must be at least 12 characters and meet complexity requirements (mixed case, number, symbol).");return}C.password=T}const M=x.querySelector('button[type="submit"]');try{M&&(M.disabled=!0,M.innerText="Saving..."),await A("PATCH",`/users/${u}`,C),E.success("User Profile Updated","Employee details modified successfully."),g&&(g.style.display="none"),await te()}catch(N){console.error(N),E.error("Update Failed",N.message||"Check server constraints.")}finally{M&&(M.disabled=!1,M.innerText="Save Changes")}});const a=document.getElementById("rank-list-rows");a==null||a.addEventListener("input",l=>{if(l.target.classList.contains("rank-title-edit-input")){const u=l.target.closest("div"),m=u==null?void 0:u.querySelector(".save-rank-btn");m&&(m.style.display="inline-block")}}),a==null||a.addEventListener("click",async l=>{if(l.target.classList.contains("save-rank-btn")){const u=Number(l.target.dataset.id),m=l.target.closest("div"),w=m==null?void 0:m.querySelector(".rank-title-edit-input"),b=w==null?void 0:w.value.trim();if(!b){E.error("Validation Error","Rank title cannot be empty.");return}try{await A("PATCH",`/users/ranks/${u}`,{title:b}),E.success("Rank Updated","Corporate rank role updated."),await te()}catch(k){E.error("Update Failed",k.message||"Could not update rank.")}}else if(l.target.classList.contains("delete-rank-btn")){const u=Number(l.target.dataset.id);if(confirm("Are you sure you want to delete this Corporate Rank role?"))try{await A("DELETE",`/users/ranks/${u}`),E.success("Rank Deleted","Corporate rank role deleted successfully."),await te()}catch(m){E.error("Deletion Failed",m.message||"Could not delete rank.")}}}),h==null||h.addEventListener("submit",async l=>{l.preventDefault();const u=document.getElementById("emp-first").value.trim(),m=document.getElementById("emp-last").value.trim(),w=document.getElementById("emp-email").value.trim(),b=document.getElementById("emp-password").value,k=Number(document.getElementById("emp-rank").value),v=document.getElementById("emp-dept").value;if(!u||u.length<1||u.length>50){y("First name must be between 1 and 50 characters.");return}if(!m||m.length<1||m.length>50){y("Last name must be between 1 and 50 characters.");return}if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(w)){y("Please enter a valid email address format.");return}if(b.length<12||!/[a-z]/.test(b)||!/[A-Z]/.test(b)||!/[0-9]/.test(b)||!/[^a-zA-Z0-9]/.test(b)){y("Temporary passwords must be at least 12 characters long and meet complexity requirements (mixed case, number, symbol).");return}const C=h.querySelector('button[type="submit"]');try{C&&(C.disabled=!0,C.innerText="Creating Account..."),await A("POST","/users",{firstName:u,lastName:m,email:w,password:b,rankId:k,departmentId:v?Number(v):null}),E.success("User Created","Employee profile provisioned successfully."),d.style.display="none",h.reset(),await te()}catch(M){console.error(M),y(M.message||"Failed to create user account."),E.error("Provisioning Failed",M.message||"Check gate constraints.")}finally{C&&(C.disabled=!1,C.innerText="Create User")}}),r==null||r.addEventListener("submit",async l=>{l.preventDefault();const u=document.getElementById("rank-title-input").value.trim(),m=Number(document.getElementById("rank-level-input").value),w=document.getElementById("rank-error-alert");if(w&&(w.style.display="none",w.innerText=""),!u){p("Rank title is required.");return}if(isNaN(m)||m<0){p("Authority level must be a non-negative number.");return}const b=r.querySelector('button[type="submit"]');try{b&&(b.disabled=!0,b.innerText="Adding..."),await A("POST","/users/ranks",{title:u,level:m}),E.success("Rank Role Created",`Successfully added rank role: "${u}".`),r.reset(),await te()}catch(k){console.error(k),p(k.message||"Failed to create rank role."),E.error("Rank Creation Failed",k.message||"Verification failed.")}finally{b&&(b.disabled=!1,b.innerText="Add Rank Role")}})}await te()}async function te(){const t=document.getElementById("employees-table-body");if(!t)return;const s=I.isAdmin();try{const[o,c,n]=await Promise.all([A("GET","/users"),A("GET","/departments"),A("GET","/users/ranks")]);if(ye=o.users||[],he=c.departments||[],X=n.ranks||[],X.length===0&&(X=[{id:1,title:"Administrator",level:0},{id:2,title:"Chief Executive",level:1},{id:3,title:"Deputy Chief Executive",level:2},{id:4,title:"Executive / Director",level:3},{id:5,title:"Department Head",level:4},{id:6,title:"Manager",level:5},{id:7,title:"Employee",level:6}]),we(),s){const e=document.getElementById("emp-rank");e&&(e.innerHTML=X.map(r=>`<option value="${r.id}">${$(r.title)} (Level ${r.level})</option>`).join(""));const d=document.getElementById("emp-dept");d&&(d.innerHTML='<option value="">Unassigned</option>'+he.map(r=>`<option value="${r.id}">${$(r.name)}</option>`).join(""));const i=document.getElementById("rank-list-container"),h=document.getElementById("rank-list-rows");i&&h&&(X.length>0?(i.style.display="block",h.innerHTML=X.map((r,g)=>`
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; ${g<X.length-1?"border-bottom: 1px solid var(--border-neutral);":""}">
              <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                <span class="small-text" style="width: 80px; font-weight: 700; color: var(--accent-navy-primary);">Level ${r.level}</span>
                <input type="text" class="rank-title-edit-input" data-id="${r.id}" value="${$(r.title)}" style="border: 1px solid transparent; border-radius: var(--radius-sm); background: transparent; color: var(--text-primary); font-size: 13px; font-family: var(--font-text); width: 60%; max-width: 250px; padding: 4px;" />
              </div>
              <div style="display: flex; gap: 12px; align-items: center;">
                <button class="save-rank-btn small-text" data-id="${r.id}" style="background: none; border: none; color: var(--status-success); font-weight: 600; cursor: pointer; display: none; padding: 0;">Save</button>
                <button class="delete-rank-btn small-text" data-id="${r.id}" style="background: none; border: none; color: var(--status-danger); font-weight: 600; cursor: pointer; padding: 0;">Delete</button>
              </div>
            </div>
          `).join("")):i.style.display="none")}}catch(o){console.error(o),t.innerHTML=`<tr><td colspan="6" style="padding:32px; text-align:center; color:var(--status-danger);">Failed to load registry: ${$(o.message)}</td></tr>`}}function we(){var e,d;const t=document.getElementById("employees-table-body");if(!t)return;const s=((e=document.getElementById("employee-search"))==null?void 0:e.value.toLowerCase())||"",o=((d=document.getElementById("employee-status"))==null?void 0:d.value)||"ALL",c=I.isAdmin(),n=ye.filter(i=>{var f;const r=`${i.firstName} ${i.lastName}`.toLowerCase().includes(s)||i.email.toLowerCase().includes(s)||((f=i.rank)==null?void 0:f.title.toLowerCase().includes(s)),g=o==="ALL"||i.status===o;return r&&g});if(n.length===0){t.innerHTML=`
      <tr>
        <td colspan="6" style="padding: 32px; text-align: center; color: var(--text-secondary);">
          No employees matching filters found.
        </td>
      </tr>
    `;return}t.innerHTML=n.map(i=>{var y,p;const r=i.status!=="active"?'<span class="pill-badge status-danger"><span class="badge-dot"></span>Inactive</span>':'<span class="pill-badge status-success"><span class="badge-dot"></span>Active</span>',g=i.department?$(i.department.name):'<span style="color:var(--text-secondary)">General</span>',f=`${$(i.firstName)} ${$(i.lastName)}`,x=$(((y=i.rank)==null?void 0:y.title)||"Employee"),a=i.rank?i.rank.level:4;return`
      <tr style="border-bottom: 1px solid var(--border-neutral); hover: background-color var(--bg-secondary); transition: background-color 0.15s ease;">
        <td data-label="Full Name" style="padding: 16px; font-weight:600; color:var(--text-primary);">${f}</td>
        <td data-label="Email Address" style="padding: 16px; color:var(--text-secondary);">${$(i.email)}</td>
        <td data-label="Rank Level" style="padding: 16px; color:var(--text-primary); font-weight:500;">${x} <span class="small-text">(Lvl ${a})</span></td>
        <td data-label="Department" style="padding: 16px;">${g}</td>
        <td data-label="Status" style="padding: 16px;">${r}</td>
        <td data-label="Actions" style="padding: 16px; text-align: right;">
          <div style="display: inline-flex; justify-content: flex-end; align-items: center; gap: 12px;">
            <a href="#profile" class="small-text" style="color:var(--accent-navy-primary); font-weight:600; text-decoration:none;" onclick="localStorage.setItem('target_profile_id', ${i.id});">View Profile</a>
            ${c?`<button class="edit-emp-btn small-text" data-id="${i.id}" style="background: none; border: none; color: var(--accent-navy-primary); font-weight: 600; cursor: pointer; padding: 0;">Edit</button>`:""}
            ${c&&i.id!==((p=I.currentUser)==null?void 0:p.id)?`<button class="delete-emp-btn small-text" data-id="${i.id}" data-name="${$(i.firstName)} ${$(i.lastName)}" style="background: none; border: none; color: var(--status-danger); font-weight: 600; cursor: pointer; padding: 0;">Delete</button>`:""}
          </div>
        </td>
      </tr>
    `}).join("")}function st(){const t=I.currentUser;return`
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
  `}function nt(t,s){const o=t.onTimeRate,c=s>0?t.completed/s*100:0,n=Math.min(t.blocked*10,30),e=Math.min(t.overdue*10,20),d=o*.5+c*.3-n-e;return Math.max(0,Math.min(100,Math.round(d)))}async function it(){var e,d;const t=document.getElementById("reports-loading"),s=document.getElementById("reports-content");if(!s)return;const o=I.currentUser,c=(o==null?void 0:o.rankLevel)??99,n=c<=3;try{const i=[A("GET","/tasks"),A("GET","/departments")];n&&i.push(A("GET","/users"));const h=await Promise.all(i),r=h[0].tasks||[],g=h[1].departments||[];let x=(n?h[2].users||[]:[]).filter(b=>{var k;return((k=b.rank)==null?void 0:k.level)!==0});c>=3&&c<=4&&(o!=null&&o.departmentId)&&(x=x.filter(b=>b.departmentId===o.departmentId));const a=r.filter(b=>b.status==="Completed");let y="N/A";if(a.length>0){const b=a.reduce((v,T)=>v+(new Date(T.updatedAt)-new Date(T.createdAt)),0),k=Math.round(b/a.length/(1e3*60*60));y=k<24?`${k} hrs`:`${Math.round(k/24)} days`}let p="N/A";const l=r.flatMap(b=>(b.blockers||[]).filter(k=>k.resolvedAt));if(l.length>0){const b=l.reduce((v,T)=>v+(new Date(T.resolvedAt)-new Date(T.createdAt)),0),k=Math.round(b/l.length/(1e3*60*60));p=k<24?`${k} hrs`:`${Math.round(k/24)} days`}let u="0%";if(r.length>0){const b=r.filter(k=>{var v;return(v=k.assignments)==null?void 0:v.some(T=>T.reassignedAt!==null)}).length;u=`${Math.round(b/r.length*100)}%`}document.getElementById("kpi-closure-time").innerText=y,document.getElementById("kpi-blocker-time").innerText=p,document.getElementById("kpi-reassign-rate").innerText=u;const m=document.getElementById("sla-chart-list");m&&(g.length===0?m.innerHTML='<p class="small-text" style="text-align: center;">No department data configured.</p>':m.innerHTML=g.map(b=>{const k=r.filter(N=>N.departmentId===b.id),v=k.filter(N=>N.status==="Completed").length,T=k.length>0?Math.round(v/k.length*100):100,C=Math.max(T,4),M=T>=80?"var(--status-success)":T>=60?"var(--status-warning)":"var(--status-danger)";return`
            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
                <span class="data-number">${$(b.name)}</span>
                <span class="small-text" style="font-weight: 600;">${T}% SLA met</span>
              </div>
              <div style="height: 8px; background-color: var(--bg-tertiary); border-radius: var(--radius-sm); overflow: hidden;">
                <div style="width: ${C}%; height: 100%; background-color: ${M}; border-radius: var(--radius-sm); transition: width 0.6s ease;"></div>
              </div>
            </div>
          `}).join(""));const w=document.getElementById("priority-list");if(w){const b=["Critical","High","Medium","Low"];w.innerHTML=b.map(k=>{const v=r.filter(N=>N.priority===k),T=v.filter(N=>N.status==="Completed").length,C=v.length>0?Math.round(T/v.length*100):0;return`
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-neutral);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${{Critical:"var(--status-danger)",High:"var(--status-warning)",Medium:"var(--status-info)",Low:"var(--status-success)"}[k]};"></span>
              <span class="data-number">${k} Priority</span>
            </div>
            <div style="text-align: right;">
              <span class="pill-badge status-info" style="font-size: 11px;">${C}% Rate</span>
              <div class="small-text" style="font-size: 10px; margin-top: 2px;">${T} / ${v.length} completed</div>
            </div>
          </div>
        `}).join("")}if(n&&x.length>0){let M=function(H){const j=document.getElementById("staff-performance-list");if(j){if(H.length===0){j.innerHTML='<p class="small-text" style="text-align: center; padding: 24px;">No staff members match the current filter.</p>';return}j.innerHTML=H.map((B,U)=>{var D,P;const z=B.score>=75?"var(--status-success)":B.score>=50?"var(--status-warning)":"var(--status-danger)",R=B.score>=75?"rgba(34,197,94,0.08)":B.score>=50?"rgba(234,179,8,0.08)":"rgba(239,68,68,0.08)",O=U===0?'<span style="font-size:14px;" title="Top performer">🥇</span>':U===1?'<span style="font-size:14px;" title="Second place">🥈</span>':U===2?'<span style="font-size:14px;" title="Third place">🥉</span>':"",Z=g.find(J=>J.id===B.user.departmentId),F=Z?$(Z.name):"Unassigned",S=`
            <div class="desktop-only" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1.5fr; gap: 8px; align-items: center; padding: 14px 16px; border-radius: var(--radius-md); background: var(--bg-primary); border: 1px solid var(--border-neutral); transition: box-shadow 0.15s;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="position: relative; width: 36px; height: 36px; flex-shrink: 0;">
                  <img src="/avatars/user-${B.user.id}.jpg" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" style="width:36px;height:36px;border-radius:50%;object-fit:cover;" />
                  <div style="width:36px;height:36px;border-radius:50%;background:var(--sidebar-bg);display:none;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:var(--text-primary);">${$(B.user.firstName[0])}${$(B.user.lastName[0]||"")}</div>
                </div>
                <div>
                  <div style="font-weight: 600; font-size: 14px; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                    ${$(B.user.firstName)} ${$(B.user.lastName)} ${O}
                  </div>
                  <div class="small-text" style="font-size: 11px;">${$(((D=B.user.rank)==null?void 0:D.title)||"Employee")} · ${F}</div>
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
          `,L=`
            <div class="mobile-only" style="background: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div style="position: relative; width: 40px; height: 40px; flex-shrink: 0;">
                    <img src="/avatars/user-${B.user.id}.jpg" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" />
                    <div style="width:40px;height:40px;border-radius:50%;background:var(--sidebar-bg);display:none;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:var(--text-primary);">${$(B.user.firstName[0])}${$(B.user.lastName[0]||"")}</div>
                  </div>
                  <div>
                    <div style="font-weight: 700; font-size: 15px; color: var(--text-primary);">${$(B.user.firstName)} ${$(B.user.lastName)} ${O}</div>
                    <div class="small-text" style="font-size: 11px;">${$(((P=B.user.rank)==null?void 0:P.title)||"Employee")}</div>
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
          `;return S+L}).join("")}},N=function(){var U,z;const H=parseInt((U=document.getElementById("perf-dept-filter"))==null?void 0:U.value)||null,j=((z=document.getElementById("perf-sort"))==null?void 0:z.value)||"score";let B=[...T];H&&(B=B.filter(R=>R.user.departmentId===H)),B.sort((R,O)=>j==="score"?O.score-R.score:j==="completed"?O.completed-R.completed:j==="ontime"?O.onTimeRate-R.onTimeRate:j==="overdue"?O.overdue-R.overdue:0),M(B)};const b=new Date;b.setHours(0,0,0,0);const k=x.map(H=>{const j=r.filter(F=>{var S;return(S=F.assignments)==null?void 0:S.some(L=>L.userId===H.id&&L.isActive)}),B=j.filter(F=>F.status==="Completed"),U=B.filter(F=>new Date(F.updatedAt)<=new Date(F.dueDate)),z=B.length>0?Math.round(U.length/B.length*100):0;let R="--";if(B.length>0){const F=B.reduce((S,L)=>S+(new Date(L.updatedAt)-new Date(L.createdAt)),0);R=Math.round(F/B.length/(1e3*60*60*24))}const O=j.filter(F=>F.status==="Blocked").length,Z=j.filter(F=>F.status!=="Completed"&&new Date(F.dueDate)<b).length;return{user:H,completed:B.length,total:j.length,onTimeRate:z,avgDays:R,blocked:O,overdue:Z}}),v=Math.max(...k.map(H=>H.completed),1),T=k.map(H=>({...H,score:nt(H,v)})),C=document.getElementById("perf-dept-filter");C&&g.forEach(H=>{const j=document.createElement("option");j.value=H.id,j.textContent=H.name,C.appendChild(j)}),N(),(e=document.getElementById("perf-dept-filter"))==null||e.addEventListener("change",N),(d=document.getElementById("perf-sort"))==null||d.addEventListener("change",N)}t&&(t.style.display="none"),s.style.display="flex"}catch(i){console.error(i),t&&(t.innerHTML=`<span style="color:var(--status-danger)">Failed to compute reports: ${$(i.message)}</span>`)}}function ot(){const t=I.isAdmin();return`
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

              <h3 class="card-title">Global Support Access Consent</h3>
              <p class="body-text">Grant the platform superadmin temporary access to review organization audit trails or perform password resets for technical troubleshooting. This permission will automatically expire.</p>
              <div style="display: flex; gap: 16px; align-items: center; max-width: 500px; padding: 16px; background-color: var(--bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--border-neutral);">
                <div style="flex: 1;">
                  <strong id="support-status-label" style="font-size: 14px; font-weight: 600;">Status: Access Revoked</strong>
                  <p id="support-expiry-label" class="small-text" style="margin-top: 4px;">No active support grant</p>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <select id="support-duration-select" style="padding: 8px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); background: var(--bg-tertiary); color: var(--text-primary); font-size: 13px;">
                    <option value="1">1 Hour</option>
                    <option value="4">4 Hours</option>
                    <option value="24">24 Hours</option>
                  </select>
                  <button id="grant-support-btn" class="btn btn-primary" style="padding: 8px 12px; font-size: 13px;">Grant</button>
                  <button id="revoke-support-btn" class="btn btn-ghost" style="padding: 8px 12px; font-size: 13px; display: none;">Revoke</button>
                </div>
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
  `}function lt(){var i,h,r,g,f;const t=document.querySelectorAll(".settings-tab-btn"),s=document.querySelectorAll(".settings-pane");t.forEach(x=>{x.addEventListener("click",()=>{t.forEach(y=>{y.classList.remove("active"),y.style.color="var(--text-secondary)",y.style.fontWeight="500"}),x.classList.add("active"),x.style.color="var(--accent-navy-primary)",x.style.fontWeight="600";const a=x.dataset.tab;s.forEach(y=>{y.style.display=y.id===a?"flex":"none"})})});const o=document.getElementById("profile-first"),c=document.getElementById("profile-last"),n=document.getElementById("profile-email");if(I.currentUser&&(o&&(o.value=I.currentUser.firstName||""),c&&(c.value=I.currentUser.lastName||""),n&&(n.value=I.currentUser.email||"")),(i=document.getElementById("profile-update-form"))==null||i.addEventListener("submit",async x=>{x.preventDefault();const a=o.value.trim(),y=c.value.trim();if(!a||!y){E.error("Validation Error","First name and Last name are required.");return}try{const p=await A("PATCH",`/users/${I.currentUser.id}`,{firstName:a,lastName:y});I.currentUser.firstName=p.user.firstName,I.currentUser.lastName=p.user.lastName,localStorage.setItem("tascorr_user",JSON.stringify(I.currentUser));const l=document.getElementById("header-user-role");l&&(l.innerText=`${I.currentUser.tenantName||`${I.currentUser.firstName} ${I.currentUser.lastName}`} (${I.currentUser.rankTitle})`),E.success("Profile Saved","Account credentials updated successfully.")}catch(p){E.error("Save Failed",p.message||"An error occurred while saving profile.")}}),I.isAdmin()){let x=function(p){const l=document.getElementById("support-status-label"),u=document.getElementById("support-expiry-label"),m=document.getElementById("grant-support-btn"),w=document.getElementById("revoke-support-btn");if(!l||!u)return;const b=new Date;if(p&&new Date(p)>b){const k=new Date(p);l.innerText="Status: Support Access Active",l.style.color="#10B981",u.innerText=`Active until: ${k.toLocaleString()}`,m&&(m.style.display="none"),w&&(w.style.display="block")}else l.innerText="Status: Access Revoked",l.style.color="#EF4444",u.innerText="No active support grant",m&&(m.style.display="block"),w&&(w.style.display="none")};A("GET","/users/tenant/details").then(p=>{if(p&&p.tenant){const l=document.getElementById("company-name"),u=document.getElementById("company-tier"),m=document.getElementById("company-cross-dept-peer"),w=document.getElementById("company-sla-access"),b=document.getElementById("company-logo-img"),k=document.getElementById("company-logo-fallback");l&&(l.value=p.tenant.name||""),m&&(m.checked=p.tenant.allowCrossDeptPeerAssignment!==!1),w&&(w.value=p.tenant.slaAccessLevel??3),u&&(u.value=`Tier ${p.tenant.subscriptionTier} Startup (Active)`),b&&k&&(b.src=`/avatars/tenant-${p.tenant.id}.jpg?t=${Date.now()}`,b.onload=()=>{b.style.display="block",k.style.display="none"},b.onerror=()=>{var v;b.style.display="none",k.style.display="block",k.innerText=((v=p.tenant.name)==null?void 0:v[0])||"?"}),x(p.tenant.supportAccessGrantedUntil)}}).catch(p=>console.error("Failed to load company details",p)),A("GET","/users/ranks").then(p=>{const u=(p.ranks||[]).find(m=>m.level===1);u&&document.getElementById("top-rank-title")&&(document.getElementById("top-rank-title").value=u.title,document.getElementById("top-rank-title").dataset.id=u.id)}).catch(p=>console.error("Failed to load ranks",p)),(h=document.getElementById("company-update-form"))==null||h.addEventListener("submit",async p=>{p.preventDefault();const l=document.getElementById("company-name"),u=document.getElementById("company-cross-dept-peer"),m=document.getElementById("company-sla-access"),w=l.value.trim(),b=u?u.checked:!0,k=m?Number(m.value):3;if(!w){E.error("Validation Error","Company name is required.");return}try{const v=await A("PATCH","/users/tenant/details",{name:w,allowCrossDeptPeerAssignment:b,slaAccessLevel:k});if(I.currentUser){I.currentUser.tenantName=v.tenant.name,I.currentUser.tenant=v.tenant,localStorage.setItem("tascorr_user",JSON.stringify(I.currentUser));const T=document.getElementById("header-user-role");T&&(T.innerText=`${v.tenant.name} (${I.currentUser.rankTitle})`);const C=document.getElementById("breadcrumbs");C&&(C.innerHTML=`
              <span class="body-text" style="font-weight: 500;">${v.tenant.name}</span>
              <span class="small-text" style="margin: 0 8px; color: var(--text-secondary);">&rarr;</span>
              <span class="body-text" style="font-weight: 600; color: var(--text-primary);">Settings</span>
            `)}E.success("Company Saved","Company details updated successfully.")}catch(v){E.error("Save Failed",v.message||"An error occurred.")}}),(r=document.getElementById("top-rank-form"))==null||r.addEventListener("submit",async p=>{p.preventDefault();const l=document.getElementById("top-rank-title"),u=l==null?void 0:l.dataset.id,m=l==null?void 0:l.value;if(!u){E.error("Update Failed","Top level rank could not be identified.");return}try{await A("PATCH",`/users/ranks/${u}`,{title:m}),E.success("Hierarchy Saved","Top level executive title updated successfully.")}catch(w){E.error("Update Failed",w.message||"Could not update hierarchy.")}});const a=document.getElementById("upload-logo-btn"),y=document.getElementById("logo-upload-input");y==null||y.addEventListener("change",async p=>{const l=p.target.files[0];if(!l)return;const u=new FileReader;u.onloadend=async()=>{const m=u.result;try{a&&(a.style.opacity="0.5");const w=await A("POST","/upload/tenant-logo",{imageBase64:m});E.success("Logo Updated","Company logo uploaded successfully.");const b=document.getElementById("company-logo-img"),k=document.getElementById("company-logo-fallback");b&&(b.src=w.logoUrl,b.style.display="block"),k&&(k.style.display="none");const v=document.getElementById("header-company-logo-img"),T=document.getElementById("header-company-logo-container");v&&T&&(v.src=w.logoUrl,T.style.display="flex")}catch(w){console.error(w),E.error("Upload Failed",w.message)}finally{a&&(a.style.opacity="1")}},u.readAsDataURL(l)}),(g=document.getElementById("grant-support-btn"))==null||g.addEventListener("click",async()=>{const p=document.getElementById("support-duration-select"),l=p?Number(p.value):1;try{const u=await A("POST","/users/tenant/support-access",{hours:l});x(u.tenant.supportAccessGrantedUntil),E.success("Access Granted",u.message)}catch(u){E.error("Grant Failed",u.message||"Could not grant support access.")}}),(f=document.getElementById("revoke-support-btn"))==null||f.addEventListener("click",async()=>{try{const p=await A("POST","/users/tenant/support-access",{hours:0});x(null),E.success("Access Revoked",p.message)}catch(p){E.error("Revocation Failed",p.message||"Could not revoke support access.")}})}const e=[{id:"light",name:"Light",color:"#EAEFF8",sidebar:"rgba(226, 232, 240, 0.9)"},{id:"dark",name:"Dark",color:"#0b0b0f",sidebar:"rgba(15, 15, 20, 0.9)"},{id:"corporate",name:"Corporate",color:"#F8FAFC",sidebar:"rgba(203, 213, 225, 0.9)"},{id:"ocean",name:"Ocean",color:"#F0F9FF",sidebar:"rgba(125, 211, 252, 0.9)"},{id:"forest",name:"Forest",color:"#F0FDF4",sidebar:"rgba(134, 239, 172, 0.9)"},{id:"sunset",name:"Sunset",color:"#FFF7ED",sidebar:"rgba(253, 186, 116, 0.9)"},{id:"lavender",name:"Lavender",color:"#FAF5FF",sidebar:"rgba(216, 180, 254, 0.9)"},{id:"midnight",name:"Midnight",color:"#05050A",sidebar:"rgba(5, 5, 10, 0.9)"}],d=()=>{const x=document.getElementById("theme-grid");if(!x)return;const a=document.documentElement.getAttribute("data-theme")||"light";x.innerHTML=e.map(y=>`
      <button class="theme-select-btn" data-theme-val="${y.id}" style="padding: 16px; border-radius: var(--radius-md); border: 2px solid ${a===y.id?"var(--accent-navy-primary)":"var(--border-neutral)"}; background-color: var(--bg-secondary); cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px; transition: all 0.2s ease;">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, ${y.sidebar} 50%, ${y.color} 50%); box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.1);"></div>
        <span style="font-weight: 600; color: var(--text-primary); font-size: 12px;">${y.name}</span>
      </button>
    `).join(""),x.querySelectorAll(".theme-select-btn").forEach(y=>{y.addEventListener("click",()=>{const p=y.dataset.themeVal;document.documentElement.setAttribute("data-theme",p),localStorage.setItem("tascorr_theme",p),window.dispatchEvent(new CustomEvent("themeChanged",{detail:p})),d(),E.info("Theme Applied",`${e.find(l=>l.id===p).name} theme activated.`)})})};d(),window.addEventListener("themeChanged",()=>{const x=document.getElementById("tab-display");x&&x.style.display!=="none"&&d()})}let q=null,Re=[];function dt(){return`
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
  `}async function ct(){var c,n,e,d;const t=document.getElementById("profile-name");if(!t)return;const s=localStorage.getItem("target_profile_id"),o=s?Number(s):(c=I.currentUser)==null?void 0:c.id;localStorage.removeItem("target_profile_id");try{const[i,h]=await Promise.all([A("GET",`/users/${o}`),A("GET","/tasks")]);q=i.user,Re=(h.tasks||[]).filter(u=>{var m;return(m=u.assignments)==null?void 0:m.some(w=>w.userId===o&&w.isActive)}),t.innerText=`${q.firstName} ${q.lastName}`;const g=document.getElementById("profile-avatar-img"),f=document.getElementById("profile-avatar");g.src=`/avatars/user-${q.id}.jpg?t=${Date.now()}`,g.onload=()=>{g.style.display="block",f.style.display="none"},g.onerror=()=>{g.style.display="none",f.style.display="flex",f.innerText=q.firstName[0]};const x=document.getElementById("profile-company-logo-img"),a=document.getElementById("profile-company-logo-fallback"),y=document.getElementById("profile-company-name");if(y&&(y.innerText=q.tenantName||"Tascorr Workspace"),x&&a&&(q.tenantLogoUrl?(x.src=`${q.tenantLogoUrl}?t=${Date.now()}`,x.onload=()=>{x.style.display="block",a.style.display="none"},x.onerror=()=>{var u;x.style.display="none",a.style.display="flex",a.innerText=((u=q.tenantName)==null?void 0:u[0])||"?"}):(x.style.display="none",a.style.display="flex",a.innerText=((n=q.tenantName)==null?void 0:n[0])||"?")),document.getElementById("profile-rank").innerText=`${q.rank} (Hierarchy level ${q.rankLevel})`,document.getElementById("profile-dept-badge").innerText=q.department||"General / Corporate",document.getElementById("profile-status-badge").innerText=q.status,document.getElementById("profile-email-label").innerText=q.email,document.getElementById("profile-joined-label").innerText=new Date(q.createdAt).toLocaleDateString(),o===((e=I.currentUser)==null?void 0:e.id)||I.isAdmin()){const u=document.getElementById("upload-avatar-btn"),m=document.getElementById("avatar-upload-input");u&&(u.style.display="flex"),m==null||m.addEventListener("change",async w=>{const b=w.target.files[0];if(!b)return;const k=new FileReader;k.onloadend=async()=>{const v=k.result;try{u.style.opacity="0.5";const T=await A("POST","/upload/avatar",{imageBase64:v,targetUserId:o});E.success("Avatar Updated","Profile picture updated successfully."),g.src=`${T.avatarUrl}?t=${Date.now()}`,g.style.display="block",f.style.display="none",document.dispatchEvent(new CustomEvent("tascorr_avatar_updated"))}catch(T){console.error(T),E.error("Upload Failed",T.message)}finally{u.style.opacity="1"}},k.readAsDataURL(b)})}const p=document.getElementById("profile-security-widget");if(o===((d=I.currentUser)==null?void 0:d.id)){p&&(p.style.display="flex");const u=document.getElementById("profile-password-form");u&&u.addEventListener("submit",async m=>{m.preventDefault();const w=document.getElementById("profile-new-password").value,b=document.getElementById("profile-confirm-password").value;if(w!==b)return E.error("Password Mismatch","The new passwords do not match.");if(w.length<8)return E.error("Invalid Password","Password must be at least 8 characters long.");const k=u.querySelector("button"),v=k.innerText;try{k.disabled=!0,k.innerText="Updating...",await A("PATCH",`/users/${o}`,{password:w}),E.success("Password Updated","Your password has been changed successfully."),u.reset()}catch(T){console.error(T),E.error("Update Failed",T.message)}finally{k.disabled=!1,k.innerText=v}})}De("week");const l=document.querySelectorAll(".profile-filter-btn");l.forEach(u=>{u.addEventListener("click",()=>{l.forEach(m=>{m.classList.remove("active"),m.style.background="none",m.style.color="var(--text-secondary)",m.style.fontWeight="500"}),u.classList.add("active"),u.style.background="var(--bg-primary)",u.style.color="var(--accent-navy-primary)",u.style.fontWeight="600",De(u.dataset.range)})})}catch(i){console.error(i),E.error("Profile Load Failed",i.message)}}function De(t){const s=document.getElementById("profile-tasks-body");if(!s)return;const o=new Date,c=new Date;t==="week"?c.setDate(o.getDate()-7):t==="month"?c.setMonth(o.getMonth()-1):t==="year"&&c.setFullYear(o.getFullYear()-1);const n=Re.filter(e=>new Date(e.createdAt)>=c);if(n.length===0){s.innerHTML='<tr><td colspan="4" style="padding: 24px; text-align: center; color: var(--text-secondary);">No workforce history found for this range.</td></tr>';return}s.innerHTML=n.map(e=>{const i={Pending:"status-info","In Progress":"status-info",Blocked:"status-danger","Under Review":"status-warning",Completed:"status-success"}[e.status]||"status-info";return`
      <tr style="border-bottom: 1px solid var(--border-neutral);">
        <td style="padding: 12px; font-weight:600;">
          <div style="font-size:13px; color:var(--text-primary);">${e.title}</div>
        </td>
        <td style="padding: 12px;">
          <span class="pill-badge status-info" style="font-size:10px; padding:2px 6px;">${e.priority}</span>
        </td>
        <td style="padding: 12px; color: var(--text-secondary);">${new Date(e.dueDate).toLocaleDateString()}</td>
        <td style="padding: 12px;">
          <span class="pill-badge ${i}"><span class="badge-dot"></span>${e.status}</span>
        </td>
      </tr>
    `}).join("")}function pt(){const t=[{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-check"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>',title:"Smart Task Assignment",description:"Assign work across your team with full visibility into who's available, who's overloaded, and who's the right fit — before you hit assign."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list-tree"><path d="M21 12h-8"/><path d="M21 6H8"/><path d="M21 18h-8"/><path d="M8 6v14"/><path d="M3 6v.01"/><path d="M3 12v.01"/><path d="M3 18v.01"/></svg>',title:"Subtasks & Dependencies",description:"Break large initiatives into trackable pieces, and set up tasks that automatically wait their turn — no more starting work out of order."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-globe"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',title:"Remote Delegation & Monitoring",description:"Manage your business and orchestrate workforce operations from anywhere. Delegate tasks, check progress, and coordinate with off-site subordinates asynchronously.",featured:!0},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wifi-off"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.5"/><path d="M5 12.5a10.94 10.94 0 0 1 5.83-2.84"/><path d="M12 12.5a15.66 15.66 0 0 1-5.83-2.84"/><path d="M18.83 9.66A15.66 15.66 0 0 1 20 10.5"/><path d="M7.76 4.7a18.3 18.3 0 0 1 8.24 0"/></svg>',title:"Offline-First Resilience",description:"Perform task updates, log blockers, and manage work without an internet connection. Changes sync automatically when you are back online."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>',title:"Cross-Department Collaboration",description:"Request access to assign work outside your department, with time-limited approvals and a full record of who authorized what."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-line-chart"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>',title:"Performance & SLA Analytics",description:"See how quickly blockers get resolved, how long approvals take, and where your organization needs attention — all in one view."}],s=[{number:"01",title:"Set Up Your Structure",description:"Define your departments, ranks, and people once."},{number:"02",title:"Assign & Track",description:"Delegate tasks across your organization with full context."},{number:"03",title:"See What's Happening",description:"Get a real-time picture of what's done, what's stuck, and why."}],o=[{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',name:"Employees",line:"A simple view of what's yours to do."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',name:"Managers",line:"Live visibility into your team's work."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',name:"Department Heads",line:"Full control across your department."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-briefcase"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',name:"Executives",line:"A real-time pulse on the whole organization."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings-2"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>',name:"Admins",line:"Configure your company without writing code."}],c=[{name:"Tier 1 (Startup)",price:"Lifetime Free",description:"For small organizations up to 10 employee accounts.",features:["Up to 10 employee accounts","Basic task assignment","Standard hierarchies"],featured:!1},{name:"Tier 2 (Small Biz)",price:"499 MVR/mo",description:"For small organizations up to 30 employee accounts.",features:["Up to 30 employee accounts","Cross-department delegation","Basic trace trails"],featured:!1},{name:"Tier 3 (Growth)",price:"999 MVR/mo",description:"For mid-scale organizations up to 100 employee accounts.",features:["Up to 100 employee accounts","Advanced trace trails","Priority support"],featured:!0},{name:"Tier 4 (Enterprise)",price:"5,000 MVR/mo",description:"For corporate networks up to 1000 employee accounts.",features:["Up to 1000 employee accounts","SLA & analytics dashboard","Dedicated account manager"],featured:!1}],n=[{name:"Companies Registered",value:"2+",icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>'},{name:"Active Employees",value:"10+",icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'},{name:"Tasks Delegated",value:"200+",icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle-2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>'},{name:"Blockers Resolved",value:"99%",icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>'}];return`
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
            ${o.map(e=>`
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
            ${c.map(e=>`
              <div class="v0-card ${e.featured?"v0-pricing-featured":""}" style="display: flex; flex-direction: column;">
                <h3 style="font-weight: 600; color: var(--text-primary);">${e.name}</h3>
                <div class="v0-pricing-price">${e.price}</div>
                <p class="v0-card-desc" style="margin-top: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1.5rem;">${e.description}</p>
                <ul style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; list-style: none; padding: 0;">
                  ${e.features.map(d=>`
                    <li style="display: flex; gap: 0.75rem; color: var(--text-secondary); align-items: center;">
                      <svg class="size-5 text-primary" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2d6cdf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ${d}
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
            ${n.map(e=>`
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
  `}let be=[],V=1,pe=1;function ut(){return`
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
                    <th style="padding: 12px; font-weight:600;">Actions</th>
                  </tr>
                </thead>
                <tbody id="registered-companies-body">
                  <tr>
                    <td colspan="6" style="padding: 24px; text-align: center; color: var(--text-secondary);">Loading registered organizations...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Global Audit Trails -->
          <div class="widget-card" style="display: flex; flex-direction: column; gap: 16px;">
            <h3 class="card-title">Global Audit & Session Logs</h3>
            
            <!-- Active Support Access Grants Banner -->
            <div id="active-support-grants" style="display: none; flex-direction: column; gap: 8px; padding: 12px 16px; background-color: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: var(--radius-md); font-size: 13px;">
              <!-- Populated dynamically -->
            </div>

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
  `}async function mt(){const t=document.getElementById("superadmin-unauthorized"),s=document.getElementById("superadmin-content");if(!s)return;if(!I.isSuperadmin()){t.style.display="block",s.style.display="none";return}t.style.display="none",s.style.display="flex",await re(),await ke();const c=document.getElementById("log-actor-filter"),n=document.getElementById("log-company-filter"),e=document.getElementById("log-action-filter"),d=document.getElementById("log-start-date"),i=document.getElementById("log-end-date"),h=document.getElementById("log-sort-order"),r=document.getElementById("log-search-btn"),g=document.getElementById("log-clear-filters-btn"),f=document.getElementById("log-prev-page-btn"),x=document.getElementById("log-next-page-btn"),a=()=>{V=1,re()};r==null||r.addEventListener("click",a),[c,n,e,d,i].forEach(l=>{l==null||l.addEventListener("keydown",u=>{u.key==="Enter"&&a()})}),h==null||h.addEventListener("change",a),g==null||g.addEventListener("click",()=>{c&&(c.value=""),n&&(n.value=""),e&&(e.value=""),d&&(d.value=""),i&&(i.value=""),h&&(h.value="desc"),V=1,re()}),f==null||f.addEventListener("click",()=>{V>1&&(V--,re())}),x==null||x.addEventListener("click",()=>{V<pe&&(V++,re())});const y=document.getElementById("onboard-tenant-form");y==null||y.addEventListener("submit",async l=>{l.preventDefault();const u=document.getElementById("tenant-name").value.trim(),m=document.getElementById("tenant-email").value.trim(),w=document.getElementById("tenant-password").value,b=Number(document.getElementById("tenant-tier").value),k=document.getElementById("tenant-error-alert");if(k&&(k.style.display="none",k.innerText=""),w.length<12||!/[a-z]/.test(w)||!/[A-Z]/.test(w)||!/[0-9]/.test(w)||!/[^a-zA-Z0-9]/.test(w)){p("Administrator password must be at least 12 characters long and contain uppercase, lowercase, numbers, and symbols.");return}try{const v=y.querySelector('button[type="submit"]');v&&(v.disabled=!0,v.innerText="Creating Organization Workspace..."),await A("POST","/superadmin/tenants",{name:u,adminEmail:m,adminPassword:w,subscriptionTier:b}),E.success("Tenant Created","Company registered and admin account provisioned successfully."),y.reset(),await re()}catch(v){console.error(v),p(v.message||"Onboarding organization failed."),E.error("Onboarding Failed",v.message)}finally{const v=y==null?void 0:y.querySelector('button[type="submit"]');v&&(v.disabled=!1,v.innerText="Onboard Organization")}});function p(l){errorAlert&&(errorAlert.innerText=l,errorAlert.style.display="block")}}async function re(){var h,r,g,f,x,a;const t=document.getElementById("global-audit-body");if(!t)return;const s=((h=document.getElementById("log-actor-filter"))==null?void 0:h.value)||"",o=((r=document.getElementById("log-company-filter"))==null?void 0:r.value)||"",c=((g=document.getElementById("log-action-filter"))==null?void 0:g.value)||"",n=((f=document.getElementById("log-start-date"))==null?void 0:f.value)||"",e=((x=document.getElementById("log-end-date"))==null?void 0:x.value)||"",d=((a=document.getElementById("log-sort-order"))==null?void 0:a.value)||"desc",i=new URLSearchParams({page:V.toString(),limit:"100",actor:s,company:o,action:c,startDate:n,endDate:e,sortOrder:d});try{const y=await A("GET",`/superadmin/audit-logs?${i.toString()}`);be=y.logs||[],V=y.page||1,pe=y.totalPages||1;const p=document.getElementById("log-prev-page-btn"),l=document.getElementById("log-next-page-btn"),u=document.getElementById("log-page-info");if(p&&(p.disabled=V<=1),l&&(l.disabled=V>=pe),u&&(u.innerText=`Page ${V} of ${pe} (Total ${y.total||0} logs)`),be.length===0){t.innerHTML='<tr><td colspan="5" style="padding: 24px; text-align: center; color: var(--text-secondary);">No matching action history logged on the platform.</td></tr>';return}t.innerHTML=be.map(m=>{var w,b;return`
      <tr style="border-bottom: 1px solid var(--border-neutral);">
        <td style="padding: 12px; color: var(--text-secondary); font-size:12px;">${new Date(m.createdAt).toLocaleString()}</td>
        <td style="padding: 12px; font-weight:600; color: var(--text-primary);">${$(((w=m.tenant)==null?void 0:w.name)||"System")}</td>
        <td style="padding: 12px; font-weight:600;">${((b=m.actor)==null?void 0:b.email)||"System"}</td>
        <td style="padding: 12px;"><span class="pill-badge status-info" style="font-size:10px; padding:2px 6px;">${m.action}</span></td>
        <td style="padding: 12px; font-family: monospace; font-size: 11px; max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${m.metadata}">${m.metadata||"{}"}</td>
      </tr>
    `}).join("")}catch(y){console.error(y),t.innerHTML=`<tr><td colspan="5" style="padding: 24px; text-align: center; color: var(--status-danger);">Failed to load platform log: ${y.message}</td></tr>`}}async function ke(){const t=document.getElementById("registered-companies-body");if(t)try{const o=(await A("GET","/superadmin/tenants")).tenants||[],c=document.getElementById("active-support-grants");if(c){const n=o.filter(e=>e.supportAccessGrantedUntil&&new Date(e.supportAccessGrantedUntil)>new Date);n.length>0?(c.style.display="flex",c.innerHTML=`
          <strong style="color: #10B981; display: flex; align-items: center; gap: 6px;">
            <span class="badge-dot" style="background-color: #10B981;"></span>
            Active Support Grants:
          </strong>
          <ul style="margin: 4px 0 0 16px; padding: 0; display: flex; flex-direction: column; gap: 4px; color: var(--text-primary);">
            ${n.map(e=>`
              <li><strong>${$(e.name)}</strong> has granted access until <strong>${new Date(e.supportAccessGrantedUntil).toLocaleString()}</strong>.</li>
            `).join("")}
          </ul>
        `):c.style.display="none"}if(o.length===0){t.innerHTML='<tr><td colspan="6" style="padding: 24px; text-align: center; color: var(--text-secondary);">No organizations registered on the platform yet.</td></tr>';return}t.innerHTML=o.map(n=>{const e=new Date(n.createdAt).toLocaleString();return`
        <tr style="border-bottom: 1px solid var(--border-neutral);">
          <td style="padding: 12px; font-weight:600; color: var(--text-primary);">${$(n.name)}</td>
          <td style="padding: 12px;">
            <select class="tenant-tier-select" data-tenant-id="${n.id}" style="padding: 4px 8px; border:1px solid var(--border-neutral); border-radius:var(--radius-sm); background:var(--bg-secondary); color:var(--text-primary); font-size:11px;">
              <option value="1" ${n.subscriptionTier===1?"selected":""}>Tier 1 (Startup)</option>
              <option value="2" ${n.subscriptionTier===2?"selected":""}>Tier 2 (Growth)</option>
              <option value="3" ${n.subscriptionTier===3?"selected":""}>Tier 3 (Enterprise)</option>
            </select>
          </td>
          <td style="padding: 12px; color: var(--text-secondary);">${e}</td>
          <td style="padding: 12px; font-weight:600;">${n.staffCount}</td>
          <td style="padding: 12px; font-weight:600;">${n.tasksCount}</td>
          <td style="padding: 12px;">
            <button class="btn btn-secondary reset-admin-password-btn" data-tenant-id="${n.id}" data-tenant-name="${$(n.name)}" style="padding: 4px 8px; font-size: 11px; height: auto;">Reset Admin Pwd</button>
          </td>
        </tr>
      `}).join(""),t.querySelectorAll(".tenant-tier-select").forEach(n=>{n.addEventListener("change",async e=>{const d=Number(n.dataset.tenantId),i=Number(e.target.value);try{await A("PATCH",`/superadmin/tenants/${d}/subscription`,{subscriptionTier:i}),E.success("Tier Updated","Tenant subscription level updated successfully."),await ke()}catch(h){E.error("Update Failed",h.message),await ke()}})}),t.querySelectorAll(".reset-admin-password-btn").forEach(n=>{n.addEventListener("click",async()=>{const e=Number(n.dataset.tenantId),d=n.dataset.tenantName,i=prompt(`Enter new administrator password for "${d}" (minimum 12 characters, must include mixed cases, numbers, and symbols):`);if(i!==null){if(i.length<12||!/[a-z]/.test(i)||!/[A-Z]/.test(i)||!/[0-9]/.test(i)||!/[^a-zA-Z0-9]/.test(i)){E.error("Invalid Password","Password does not meet security requirements.");return}try{n.disabled=!0,await A("POST",`/superadmin/tenants/${e}/reset-admin-password`,{newPassword:i}),E.success("Password Updated",`Successfully updated administrator credentials for "${d}".`)}catch(h){E.error("Reset Failed",h.message)}finally{n.disabled=!1}}})})}catch(s){console.error(s),t.innerHTML=`<tr><td colspan="6" style="padding: 24px; text-align: center; color: var(--status-danger);">Failed to load organizations: ${s.message}</td></tr>`}}function gt(){return`
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
  `}function yt(){const t=document.getElementById("login-form");if(!t)return;const s=document.getElementById("login-email"),o=document.getElementById("login-password"),c=document.getElementById("login-error-alert");[s,o].forEach(e=>{e&&(e.addEventListener("focus",()=>{e.style.borderColor="var(--accent-navy-primary)"}),e.addEventListener("blur",()=>{e.style.borderColor="var(--border-neutral)"}))}),t.addEventListener("submit",async e=>{e.preventDefault();const d=s.value.trim(),i=o.value;if(c&&(c.style.display="none",c.innerText=""),!d||!i){n("Please fill out all credentials.");return}if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d)){n("Please enter a valid email address.");return}if(d.length>254){n("Email address is too long.");return}if(i.length>128){n("Password exceeds maximum length.");return}try{const r=t.querySelector('button[type="submit"]');r&&(r.disabled=!0,r.innerText="Authenticating..."),await I.login(d,i),E.success("Access Granted","Signed in successfully."),window.location.hash="dashboard"}catch(r){console.error(r),n(r.message||"Authentication failed. Please check credentials."),E.error("Login Failed",r.message||"Check your credentials.");const g=t.querySelector('button[type="submit"]');g&&(g.disabled=!1,g.innerText="Sign In")}});function n(e){c&&(c.innerText=e,c.style.display="block")}}function xt(){return`
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
  `}function vt(){const t=document.getElementById("signup-form");if(!t)return;const s=document.getElementById("signup-company"),o=document.getElementById("signup-email"),c=document.getElementById("signup-password"),n=document.getElementById("signup-confirm-password"),e=document.getElementById("signup-error-alert"),d={length:r=>r.length>=12,case:r=>/[a-z]/.test(r)&&/[A-Z]/.test(r),number:r=>/[0-9]/.test(r),symbol:r=>/[^a-zA-Z0-9]/.test(r)};c.addEventListener("input",()=>{const r=c.value;i("req-length",d.length(r)),i("req-case",d.case(r)),i("req-number",d.number(r)),i("req-symbol",d.symbol(r))});function i(r,g){const f=document.getElementById(r);f&&(g?(f.style.color="var(--status-success)",f.innerHTML=`&#10003; ${f.innerText.replace("✓","").replace("•","").trim()}`):(f.style.color="var(--status-danger)",f.innerHTML=`&bull; ${f.innerText.replace("✓","").replace("•","").trim()}`))}t.addEventListener("submit",async r=>{r.preventDefault();const g=s.value.trim(),f=o.value.trim(),x=c.value,a=n.value;if(e&&(e.style.display="none",e.innerText=""),!g||!f||!x||!a){h("Please populate all required details.");return}if(g.length<2){h("Company name must be at least 2 characters.");return}if(g.length>100){h("Company name cannot exceed 100 characters.");return}if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f)){h("Please enter a valid email address.");return}if(x!==a){h("Passwords do not match.");return}if(!d.length(x)||!d.case(x)||!d.number(x)||!d.symbol(x)){h("Password does not meet all required complexity parameters.");return}try{const p=t.querySelector('button[type="submit"]');p&&(p.disabled=!0,p.innerText="Creating Workspace..."),await I.signup(g,f,x),E.success("Account Created","Company registered successfully. Please log in."),window.location.hash="login"}catch(p){console.error(p),h(p.message||"Workspace signup failed. Please try again."),E.error("Signup Failed",p.message||"Check submission details.");const l=t.querySelector('button[type="submit"]');l&&(l.disabled=!1,l.innerText="Register & Create Workspace")}});function h(r){e&&(e.innerText=r,e.style.display="block")}}const ae={landing:{title:"Marketing",render:pt,icon:"home",isPublic:!0},login:{title:"Sign In",render:gt,icon:"user",isPublic:!0},signup:{title:"Register",render:xt,icon:"users",isPublic:!0},dashboard:{title:"Dashboard",render:_e,icon:"chart-pie"},tasks:{title:"Tasks",render:Je,icon:"list-check"},departments:{title:"Departments",render:Qe,icon:"sitemap"},employees:{title:"Employees",render:at,icon:"users"},reports:{title:"Reports",render:st,icon:"chart-bar"},settings:{title:"Settings",render:ot,icon:"cog",isBottom:!0},profile:{title:"Profile",render:dt,icon:"user",isBottom:!0},superadmin:{title:"Superadmin",render:ut,icon:"key"}},ce={home:'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>',"chart-pie":'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></svg>',"list-check":'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 0A48.536 48.536 0 0112 3m0 0c2.917 0 5.747.294 8.5.862m-21 10.398c0-.552.448-1 1-1h6.25a1 1 0 011 1v3.875a1 1 0 01-1 1H2.5a1 1 0 01-1-1v-3.875z" /></svg>',sitemap:'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.75a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM12 6a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM21 10.5a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM9 18.75a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM9.75 10.5c0 .621-.504 1.125-1.125 1.125H6.75a2.25 2.25 0 01-2.25-2.25V6.75m11.25 3.75c0 .621-.504 1.125-1.125 1.125H12" /></svg>',users:'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766v-.109A12.318 12.318 0 019.374 15c2.24 0 4.332.596 6.136 1.631M19.5 9.75a3 3 0 11-6 0 3 3 0 016 0zM4 10.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>',"chart-bar":'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>',cog:'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.645-.869l.214-1.28z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>',user:'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg>',key:'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>',logout:'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>'};function Me(){var i,h,r,g,f,x;const t=document.getElementById("desktop-nav"),s=document.getElementById("desktop-bottom-nav"),o=document.getElementById("mobile-nav");if(!t||!o||!s||(t.innerHTML="",s.innerHTML="",o.innerHTML="",!I.isAuthenticated))return;let c="",n="";const e=((i=I.currentUser)==null?void 0:i.rankLevel)??4,d=I.isSuperadmin();if(Object.keys(ae).forEach(a=>{var u,m;const y=ae[a];if(y.isPublic)return;if(d){if(a!=="superadmin"&&a!=="settings")return}else{if(a==="superadmin"||a==="employees"&&e>2)return;const w=((m=(u=I.currentUser)==null?void 0:u.tenant)==null?void 0:m.slaAccessLevel)??3;if(a==="reports"&&e>w)return}const p=ce[y.icon]||"",l=`
      <a href="#${a}" class="menu-item" id="nav-${a}">
        ${p}
        <span class="menu-item-text">${y.title}</span>
      </a>
    `;y.isBottom?n+=l:c+=l}),n+=`
    <a class="menu-item" id="nav-logout-action" style="color: var(--status-danger);">
      ${ce.logout}
      <span class="menu-item-text">Sign Out</span>
    </a>
  `,t.innerHTML=c,s.innerHTML=n,(h=document.getElementById("nav-logout-action"))==null||h.addEventListener("click",()=>{I.logout()}),!d){const a=((g=(r=I.currentUser)==null?void 0:r.tenant)==null?void 0:g.slaAccessLevel)??3,p=e<=a?["dashboard","tasks","quickAction","reports","settings"]:["dashboard","tasks","quickAction","settings","logout"];let l="";p.forEach(u=>{if(u==="quickAction")e<=3?l+=`
            <div class="mobile-quick-action" id="mobile-task-create" aria-label="Create Task">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
          `:l+='<div style="width: 56px; height: 56px;"></div>';else if(u==="logout")l+=`
          <a href="#" class="mobile-nav-item" id="mobile-nav-logout" style="color: var(--status-danger);">
            ${ce.logout}
            <span>Sign Out</span>
          </a>
        `;else{const m=ae[u],w=ce[m.icon]||"";l+=`
          <a href="#${u}" class="mobile-nav-item" id="mobile-nav-${u}">
            ${w}
            <span>${m.title}</span>
          </a>
        `}}),o.innerHTML=l,(f=document.getElementById("mobile-task-create"))==null||f.addEventListener("click",()=>{new Pe(()=>{window.location.hash==="#tasks"?window.location.reload():window.location.hash="tasks"}).open()}),(x=document.getElementById("mobile-nav-logout"))==null||x.addEventListener("click",u=>{u.preventDefault(),I.logout()})}}function Ee(){const t=window.location.hash.substring(1)||"landing";let s=ae[t]||ae.landing;if(!s.isPublic&&!I.isAuthenticated){window.location.hash="login";return}if(s.isPublic&&I.isAuthenticated&&t!=="landing"){window.location.hash="dashboard";return}if(t==="superadmin"&&!I.isSuperadmin()){window.location.hash="dashboard";return}const o=document.getElementById("view-root");o&&(o.style.animation="none",o.offsetHeight,o.style.animation="",o.innerHTML=s.render());const c=document.getElementById("breadcrumbs");if(c){const r=I.currentUser&&I.currentUser.tenantName||"Workspace";c.innerHTML=`
      <span class="body-text" style="font-weight: 500;">${r}</span>
      <span class="small-text" style="margin: 0 8px; color: var(--text-secondary);">&rarr;</span>
      <span class="body-text" style="font-weight: 600; color: var(--text-primary);">${s.title}</span>
    `}document.querySelectorAll(".menu-item").forEach(r=>{r.classList.remove("active")});const n=document.getElementById(`nav-${t}`);n&&n.classList.add("active"),document.querySelectorAll(".mobile-nav-item").forEach(r=>{r.classList.remove("active")});const e=document.getElementById(`mobile-nav-${t}`);e&&e.classList.add("active");const d=document.getElementById("sidebar"),i=document.querySelector(".app-header"),h=document.getElementById("app-layout");s.isPublic?(document.body.classList.add("public-route"),d&&(d.style.display="none"),i&&(i.style.display="none"),h&&(h.style.backgroundColor="var(--bg-primary)")):(document.body.classList.remove("public-route"),d&&(d.style.display=window.innerWidth>768?"flex":"none"),i&&(i.style.display="flex"),h&&(h.style.backgroundColor="var(--bg-secondary)")),t==="login"&&yt(),t==="signup"&&vt(),t==="dashboard"&&Ye(),t==="tasks"&&Ke(),t==="employees"&&rt(),t==="departments"&&et(),t==="reports"&&it(),t==="settings"&&lt(),t==="profile"&&ct(),t==="superadmin"&&mt()}function ft(){const t=document.getElementById("sidebar"),s=document.getElementById("sidebar-toggle"),o=document.getElementById("theme-toggle");s&&t&&s.addEventListener("click",()=>{t.classList.toggle("collapsed")});const c=localStorage.getItem("tascorr_theme")||"light";document.documentElement.setAttribute("data-theme",c);function n(i){const h=document.getElementById("theme-icon"),r=document.getElementById("mobile-theme-icon"),g=f=>{if(!f)return;["dark","midnight"].includes(i)?f.innerHTML='<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />':f.innerHTML='<path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />'};g(h),g(r)}n(c);const e=()=>{const i=document.documentElement.getAttribute("data-theme"),r=["dark","midnight"].includes(i)?"light":"dark";document.documentElement.setAttribute("data-theme",r),localStorage.setItem("tascorr_theme",r),n(r),window.dispatchEvent(new CustomEvent("themeChanged",{detail:r}))};o&&o.addEventListener("click",e);const d=document.getElementById("mobile-theme-toggle");d&&d.addEventListener("click",e),window.addEventListener("resize",()=>{const i=window.location.hash.substring(1)||"landing";!(ae[i]||ae.landing).isPublic&&t&&(t.style.display=window.innerWidth>768?"flex":"none")}),Te()}function Te(){const t=document.getElementById("header-user-role");if(t)if(I.isAuthenticated&&I.currentUser){const a=I.currentUser,y=a.tenantName||`${a.firstName} ${a.lastName}`;t.innerText=`${y} (${a.rankTitle})`}else t.innerText="Guest";const s=document.getElementById("brand-logo"),o=document.querySelector(".sidebar-brand");s&&(s.src="/tascorrLogo.png",s.style.display="block"),o&&(o.innerText="Tascorr");const c=document.getElementById("header-company-logo-container"),n=document.getElementById("header-company-logo-img");I.isAuthenticated&&I.currentUser&&I.currentUser.tenantLogoUrl?n&&c&&(n.src=`${I.currentUser.tenantLogoUrl}?t=${Date.now()}`,c.style.display="flex"):c&&(c.style.display="none");const e=document.getElementById("mobile-user-name"),d=document.getElementById("mobile-greeting"),i=document.getElementById("mobile-header-avatar");if(e&&I.isAuthenticated&&I.currentUser){const a=I.currentUser;e.innerText=a.firstName;const y=[{text:"Good morning,",hint:"en"},{text:"Buenos días,",hint:"es"},{text:"Bonjour,",hint:"fr"},{text:"Guten Morgen,",hint:"de"},{text:"Buongiorno,",hint:"it"},{text:"Ohayō,",hint:"jp"},{text:"Anyoung,",hint:"kr"},{text:"Zǎo ān,",hint:"cn"},{text:"Namaste,",hint:"in"},{text:"Bom dia,",hint:"pt"}],p=y[Math.floor(Math.random()*y.length)];if(d&&(d.innerHTML=`${p.text} <span style="font-size:10px; opacity:0.6; text-transform:uppercase; margin-left:4px;" title="Language: ${p.hint}">${p.hint}</span>`),i){const l=`${a.firstName?a.firstName.charAt(0):""}${a.lastName?a.lastName.charAt(0):""}`;i.innerHTML=`
        <img src="/avatars/user-${a.id}.jpg?t=${Date.now()}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" />
        <div style="width:40px;height:40px;border-radius:50%;background:var(--sidebar-bg);color:var(--text-primary);display:none;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:1px solid #E5E7EB;">${l||"?"}</div>
      `}}const h=document.getElementById("sidebar-user-card"),r=document.getElementById("sidebar-user-avatar"),g=document.getElementById("sidebar-user-avatar-img"),f=document.getElementById("sidebar-user-name"),x=document.getElementById("sidebar-user-role");if(h&&r&&f&&x)if(I.isAuthenticated&&I.currentUser){const a=I.currentUser,y=`${a.firstName?a.firstName.charAt(0):""}${a.lastName?a.lastName.charAt(0):""}`;r.innerText=y||"??",g&&(g.src=`/avatars/user-${a.id}.jpg?t=${Date.now()}`,g.onload=()=>{g.style.display="block",r.style.display="none"},g.onerror=()=>{g.style.display="none",r.style.display="flex"}),f.innerText=`${a.firstName} ${a.lastName}`,x.innerText=a.rankTitle||"Employee",h.style.display="flex",i&&(i.onclick=()=>{var b,k,v,T,C;(b=document.getElementById("mobile-profile-sheet"))==null||b.remove(),(k=document.getElementById("mobile-profile-overlay"))==null||k.remove();const p=document.createElement("div");p.id="mobile-profile-overlay",p.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:1100;backdrop-filter:blur(2px);";const l=document.createElement("div");l.id="mobile-profile-sheet",l.style.cssText=`
            position:fixed; left:0; right:0; bottom:0; z-index:1101;
            background:var(--bg-primary); border-radius:28px 28px 0 0;
            padding:0 0 32px 0; box-shadow:0 -8px 40px rgba(0,0,0,0.15);
            transform:translateY(100%); transition:transform 0.3s cubic-bezier(0.4,0,0.2,1);
          `;const u=a.departmentName||((v=a.department)==null?void 0:v.name)||"Unassigned",m=`${((T=a.firstName)==null?void 0:T[0])||""}${((C=a.lastName)==null?void 0:C[0])||""}`;l.innerHTML=`
            <!-- Drag handle -->
            <div style="width:40px;height:4px;background:#E5E7EB;border-radius:2px;margin:12px auto 20px auto;"></div>

            <!-- User card -->
            <div style="display:flex;align-items:center;gap:16px;padding:0 24px 20px;border-bottom:1px solid var(--border-neutral);">
              <div style="position:relative;width:60px;height:60px;flex-shrink:0;">
                <img src="/avatars/user-${a.id}.jpg?t=${Date.now()}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" style="width:60px;height:60px;border-radius:50%;object-fit:cover;border:2px solid var(--border-neutral);" />
                <div style="width:60px;height:60px;border-radius:50%;background:var(--accent-navy-light);color:var(--accent-navy-primary);display:none;align-items:center;justify-content:center;font-weight:700;font-size:22px;">${m||"?"}</div>
              </div>
              <div>
                <div style="font-size:18px;font-weight:700;color:var(--text-primary);">${a.firstName} ${a.lastName}</div>
                <div style="font-size:13px;color:var(--accent-navy-primary);font-weight:600;margin-top:2px;">${a.rankTitle||"Employee"}</div>
                <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">${u}</div>
              </div>
            </div>

            <!-- Email row -->
            <div style="padding:16px 24px;border-bottom:1px solid var(--border-neutral);display:flex;align-items:center;gap:12px;">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px;height:18px;color:var(--text-secondary);flex-shrink:0;"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
              <span style="font-size:14px;color:var(--text-secondary);">${a.email||"--"}</span>
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
          `,document.body.appendChild(p),document.body.appendChild(l),requestAnimationFrame(()=>{l.style.transform="translateY(0)"});const w=()=>{l.style.transform="translateY(100%)",p.style.opacity="0",setTimeout(()=>{l.remove(),p.remove()},300)};p.addEventListener("click",w),l.querySelector("#mobile-sheet-profile-link").addEventListener("click",()=>{w(),setTimeout(()=>{window.location.hash="profile"},300)}),l.querySelector("#mobile-sheet-signout").addEventListener("click",()=>{w(),setTimeout(()=>I.logout(),300)})}),h.onclick=()=>{window.location.hash="profile";const p=document.getElementById("sidebar");p&&p.classList.contains("active")&&p.classList.remove("active")}}else h.style.display="none"}async function bt(){const t=await Oe();if(t.length===0)return;console.log(`[Sync] Replaying ${t.length} queued operation(s)...`);const s=document.getElementById("offline-banner"),o=document.getElementById("offline-banner-text");s&&o&&(s.style.display="flex",s.style.background="#2563EB",o.textContent=`Syncing ${t.length} pending change${t.length>1?"s":""}...`,document.getElementById("app-layout").style.marginTop=s.offsetHeight+"px");let c=0;const n=[];for(const e of t)try{await A(e.method,e.path,e.body),await xe(e.id),c++}catch(d){const i=d==null?void 0:d.status;i===409?(console.warn(`[Sync] Conflict on op #${e.id} (${e.method} ${e.path}). Discarding local change.`),await xe(e.id),n.push({op:e,reason:"Conflict — a newer version exists on the server. Your local change was discarded."})):i===403||i===404?(console.warn(`[Sync] Permanent failure on op #${e.id} (${i}). Removing from queue.`),await xe(e.id),n.push({op:e,reason:i===403?"Permission denied — you may no longer have access.":"Resource not found — it may have been deleted."})):console.warn(`[Sync] Transient failure on op #${e.id} (${e.method} ${e.path}):`,d.message)}if(await ue(),s&&(s.style.display="none",document.getElementById("app-layout").style.marginTop="0"),c>0&&E.success("Changes Synced",`${c} offline change${c>1?"s":""} saved to the server successfully.`,5e3),n.length>0){const e=n.map(d=>`• ${d.op.method} ${d.op.path}: ${d.reason}`).join(`
`);E.error(`${n.length} Change${n.length>1?"s":""} Could Not Sync`,e,0)}if(c>0||n.length>0){const e=window.location.hash.substring(1);["dashboard","tasks"].includes(e)&&Ee()}}window.addEventListener("error",t=>{console.error("Captured Global Frontend Error:",t.error),E.error("App Runtime Exception",t.message||"An unexpected client error occurred.")});window.addEventListener("unhandledrejection",t=>{var s;console.error("Captured Global Promise Rejection:",t.reason),E.error("API Error Response",((s=t.reason)==null?void 0:s.message)||"Server request returned error.")});document.addEventListener("DOMContentLoaded",async()=>{await I.checkSession();try{await oe(),await ue()}catch(t){console.warn("[OfflineDB] Could not initialize offline database:",t)}window.addEventListener("online",async()=>{I.isAuthenticated&&await bt()}),ft(),Me(),document.addEventListener("tascorr_avatar_updated",()=>{Te()}),window.addEventListener("hashchange",()=>{Me(),Te(),Ee()}),Ee()});
