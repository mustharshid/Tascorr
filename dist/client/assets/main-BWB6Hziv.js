(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const d of document.querySelectorAll('link[rel="modulepreload"]'))o(d);new MutationObserver(d=>{for(const t of d)if(t.type==="childList")for(const n of t.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&o(n)}).observe(document,{childList:!0,subtree:!0});function i(d){const t={};return d.integrity&&(t.integrity=d.integrity),d.referrerPolicy&&(t.referrerPolicy=d.referrerPolicy),d.crossOrigin==="use-credentials"?t.credentials="include":d.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function o(d){if(d.ep)return;d.ep=!0;const t=i(d);fetch(d.href,t)}})();const Fe="tascorr-offline",Ue=1,Y="pending_ops";let le=null;function oe(){return le?Promise.resolve(le):new Promise((a,s)=>{const i=indexedDB.open(Fe,Ue);i.onupgradeneeded=o=>{const d=o.target.result;d.objectStoreNames.contains(Y)||d.createObjectStore(Y,{keyPath:"id",autoIncrement:!0}).createIndex("timestamp","timestamp",{unique:!1})},i.onsuccess=o=>{le=o.target.result,a(le)},i.onerror=o=>{console.error("[OfflineDB] Failed to open IndexedDB:",o.target.error),s(o.target.error)}})}async function Ce(a){const s=await oe();return new Promise((i,o)=>{const t=s.transaction(Y,"readwrite").objectStore(Y),n={method:a.method,path:a.path,body:a.body,timestamp:Date.now(),retries:0},l=t.add(n);l.onsuccess=()=>i(l.result),l.onerror=()=>o(l.error)})}async function qe(){const a=await oe();return new Promise((s,i)=>{const n=a.transaction(Y,"readonly").objectStore(Y).index("timestamp").getAll();n.onsuccess=()=>s(n.result),n.onerror=()=>i(n.error)})}async function Oe(){const a=await oe();return new Promise((s,i)=>{const t=a.transaction(Y,"readonly").objectStore(Y).count();t.onsuccess=()=>s(t.result),t.onerror=()=>i(t.error)})}async function xe(a){const s=await oe();return new Promise((i,o)=>{const n=s.transaction(Y,"readwrite").objectStore(Y).delete(a);n.onsuccess=()=>i(),n.onerror=()=>o(n.error)})}const Ve={};class ve extends Error{constructor(s,i,o=null){super(i),this.name="ApiError",this.status=s,this.details=o}}class fe extends Error{constructor(){super("You are currently offline. Showing cached data where available."),this.name="OfflineError"}}async function ue(){try{const a=await Oe(),s=document.getElementById("pending-sync-badge");if(!s)return;a>0?(s.textContent=`${a} pending`,s.style.display="inline-flex"):s.style.display="none"}catch{}}async function L(a,s,i=null){const o=typeof import.meta<"u"&&Ve?"/tascorr/".replace(/\/$/,""):"",d=s.startsWith("/api")?s:`/api${s}`,t=`${window.location.origin}${o}${d}`,n={Accept:"application/json"};i instanceof FormData||(n["Content-Type"]="application/json");const l=localStorage.getItem("tascorr_token");l&&(n.Authorization=`Bearer ${l}`);const f={method:a,headers:n};i&&(f.body=i instanceof FormData?i:JSON.stringify(i));const e=["POST","PATCH","PUT","DELETE"].includes(a.toUpperCase());if(e&&!navigator.onLine){try{await Ce({method:a,path:d,body:i}),await ue(),console.log(`[Offline Queue] Queued ${a} ${d}`)}catch(u){console.error("[Offline Queue] Failed to enqueue operation:",u)}return{queued:!0,message:"Saved locally. Will sync when back online."}}try{const u=await fetch(t,f);if(u.status===401){localStorage.removeItem("tascorr_token"),localStorage.removeItem("tascorr_user");const r=window.location.hash;r&&r!=="#landing"&&r!=="#login"&&r!=="#signup"&&(window.location.hash="login")}if(u.status===503&&a==="GET")throw new fe;let g;const c=u.headers.get("content-type");if(c&&c.includes("application/json")?g=await u.json():g={message:await u.text()},!u.ok)throw new ve(u.status,g.error||g.message||"API request failed.",g);return g}catch(u){if(u instanceof ve||u instanceof fe)throw u;if(e&&!navigator.onLine){try{await Ce({method:a,path:d,body:i}),await ue()}catch{}return{queued:!0,message:"Saved locally. Will sync when back online."}}throw navigator.onLine?new ve(500,u.message||"Network communication error. Please check your connection."):new fe}}class Ge{constructor(){this.currentUser=null,this.isAuthenticated=!1,this.initialized=!1;const s=localStorage.getItem("tascorr_user");if(s)try{this.currentUser=JSON.parse(s),this.isAuthenticated=!0}catch{localStorage.removeItem("tascorr_user")}}async login(s,i){const o=await L("POST","/auth/login",{email:s,password:i});return o.token&&localStorage.setItem("tascorr_token",o.token),this.currentUser=o.user,this.isAuthenticated=!0,localStorage.setItem("tascorr_user",JSON.stringify(o.user)),o}async signup(s,i,o){return await L("POST","/auth/signup",{name:s,adminEmail:i,adminPassword:o})}async logout(){try{await L("POST","/auth/logout")}catch(s){console.warn("Network error during logout",s)}this.currentUser=null,this.isAuthenticated=!1,localStorage.removeItem("tascorr_token"),localStorage.removeItem("tascorr_user"),window.location.hash="landing"}async checkSession(){if(!localStorage.getItem("tascorr_token"))return this.currentUser=null,this.isAuthenticated=!1,null;try{const s=await L("GET","/auth/session");return this.currentUser=s.user,this.isAuthenticated=!0,localStorage.setItem("tascorr_user",JSON.stringify(s.user)),s.user}catch{return this.currentUser=null,this.isAuthenticated=!1,localStorage.removeItem("tascorr_token"),localStorage.removeItem("tascorr_user"),null}finally{this.initialized=!0}}isAdmin(){return this.isAuthenticated&&this.currentUser&&this.currentUser.rankLevel===0}isExecutive(){return this.isAuthenticated&&this.currentUser&&this.currentUser.rankLevel<=1}isDeptHead(){return this.isAuthenticated&&this.currentUser&&this.currentUser.rankLevel<=2}isManager(){return this.isAuthenticated&&this.currentUser&&this.currentUser.rankLevel<=3}isSuperadmin(){return this.isAuthenticated&&this.currentUser&&this.currentUser.email==="superadmin@tascorr.com"}}const $=new Ge;function k(a){return typeof a!="string"?a==null?"":String(a):a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function We(){return`
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
  `}async function Me(){const a=document.getElementById("dashboard-loading"),s=document.getElementById("dashboard-content");if(s)try{const[i,o,d,t,n]=await Promise.all([L("GET","/tasks"),L("GET","/tasks/workload").catch(()=>({workload:{}})),L("GET","/users"),L("GET","/departments"),L("GET","/notifications").catch(()=>({notifications:[]}))]),l=i.tasks||[],f=o.workload||{},e=(d.users||[]).filter(C=>{var A;return((A=C.rank)==null?void 0:A.level)!==0}),u=t.departments||[],g=n.notifications||[],c=new Date;c.setHours(0,0,0,0);const r=l.filter(C=>C.status==="Blocked"||C.status==="Under Review"),p=l.filter(C=>C.status!=="Completed"&&new Date(C.dueDate)<c),x=l.filter(C=>C.status==="Under Review"),y=new Date;y.setDate(y.getDate()-7);const m=l.filter(C=>C.status==="Completed"&&new Date(C.updatedAt)>=y),v=document.getElementById("dashboard-metrics-grid");v&&(v.innerHTML=`
        <div class="grid-col-3 widget-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <span class="small-text" style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center;">Attention Required<div class="tooltip-container"><span class="help-icon">?</span><span class="tooltip-text">Tasks that are blocked or under review.</span></div></span>
            <div class="pill-badge ${r.length>0?"status-danger":"status-success"}">
              <span class="badge-dot"></span>${r.length>0?"Action Needed":"Healthy"}
            </div>
          </div>
          <div class="page-title" style="font-size: 36px; line-height: 1.1;">${r.length}</div>
          <p class="small-text" style="margin-top: 8px;">Blocked or Under Review task items</p>
        </div>

        <div class="grid-col-3 widget-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <span class="small-text" style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center;">Overdue Tasks<div class="tooltip-container"><span class="help-icon">?</span><span class="tooltip-text">Active tasks that have passed their target due date.</span></div></span>
            <div class="pill-badge ${p.length>0?"status-danger":"status-success"}">
              <span class="badge-dot"></span>${p.length>0?"Overdue":"On Track"}
            </div>
          </div>
          <div class="page-title" style="font-size: 36px; line-height: 1.1;">${p.length}</div>
          <p class="small-text" style="margin-top: 8px;">Active tasks past target due dates</p>
        </div>

        <div class="grid-col-3 widget-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <span class="small-text" style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center;">Pending Approvals<div class="tooltip-container"><span class="help-icon">?</span><span class="tooltip-text">Tasks awaiting managerial authorization.</span></div></span>
            <div class="pill-badge ${x.length>0?"status-warning":"status-success"}">
              <span class="badge-dot"></span>${x.length>0?"Awaiting Action":"Clear"}
            </div>
          </div>
          <div class="page-title" style="font-size: 36px; line-height: 1.1;">${x.length}</div>
          <p class="small-text" style="margin-top: 8px;">Tasks awaiting manager authorization</p>
        </div>

        <div class="grid-col-3 widget-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <span class="small-text" style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center;">Completed (WTD)<div class="tooltip-container"><span class="help-icon">?</span><span class="tooltip-text">Tasks successfully closed within the last 7 days.</span></div></span>
            <div class="pill-badge status-success">
              <span class="badge-dot"></span>Completed
            </div>
          </div>
          <div class="page-title" style="font-size: 36px; line-height: 1.1;">${m.length}</div>
          <p class="small-text" style="margin-top: 8px;">Work closed within the last 7 days</p>
        </div>
      `);const w=document.getElementById("workload-list");if(w)if(e.length===0)w.innerHTML='<p class="small-text" style="padding: 16px 0; text-align: center;">No team members registered.</p>';else{const C={};e.forEach(D=>{const N=f[D.id]||{count:0,blocked:0};C[D.id]={user:D,count:N.count,blocked:N.blocked}});const A=Object.values(C);w.innerHTML=A.slice(0,5).map(D=>{var ie;const N=D.user,J=Math.min(D.count/10*100,100),K=D.count>=10,W=K?"var(--status-danger)":"var(--accent-navy-primary)";return`
            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span class="data-number" style="font-size: 13px;">${N.firstName} ${N.lastName} (${((ie=N.rank)==null?void 0:ie.title)||"Employee"})</span>
                <span class="small-text">${D.count} active, ${D.blocked} blocked ${K?'<span style="color: var(--status-danger); font-weight: 600;">(Overloaded)</span>':""}</span>
              </div>
              <div style="height: 6px; background-color: var(--bg-tertiary); border-radius: var(--radius-sm); overflow: hidden;">
                <div style="width: ${J}%; height: 100%; background-color: ${W}; border-radius: var(--radius-sm); transition: width 0.3s ease;"></div>
              </div>
            </div>
          `}).join("")}const h=document.getElementById("mobile-workload-list");if(h&&e.length>0){const C={};e.forEach(D=>{const N=f[D.id]||{count:0,blocked:0};C[D.id]={user:D,count:N.count,blocked:N.blocked}});const A=Object.values(C);h.innerHTML=A.slice(0,5).map(D=>{const N=D.user,J=Math.min(D.count/10*100,100),K=D.count>=10,W=K?"var(--status-danger)":"var(--accent-navy-primary)";return`
          <div style="background: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: 16px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span class="data-number" style="font-size: 14px; color: var(--text-primary); font-weight: 600;">${N.firstName} ${N.lastName}</span>
              <span class="small-text" style="font-size: 12px; color: var(--text-secondary);">${D.count} active, ${D.blocked} blocked ${K?'<span style="color: var(--status-danger); font-weight: 600;">(Overloaded)</span>':""}</span>
            </div>
            <div style="height: 8px; background-color: var(--bg-tertiary); border-radius: var(--radius-md); overflow: hidden;">
              <div style="width: ${J}%; height: 100%; background-color: ${W}; border-radius: var(--radius-md); transition: width 0.3s ease;"></div>
            </div>
          </div>
        `}).join("")}else h&&(h.innerHTML='<p class="small-text" style="padding: 16px 0; text-align: center;">No team members registered.</p>');const T=document.getElementById("departmental-list");T&&(u.length===0?T.innerHTML='<p class="small-text" style="padding: 16px 0; text-align: center;">No department nodes configured.</p>':T.innerHTML=u.map(C=>{const A=l.filter(W=>W.departmentId===C.id),D=A.filter(W=>W.status==="Completed").length,N=A.length>0?Math.round(D/A.length*100):100,K=N<80?"status-warning":"status-success";return`
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-neutral);">
              <span class="data-number" style="font-size: 13px;">${C.name}</span>
              <span class="pill-badge ${K}"><span class="badge-dot"></span>${N}% SLA score</span>
            </div>
          `}).join(""));const b=document.getElementById("activity-log-list");if(b){const C=[];l.forEach(A=>{var D;C.push({type:"INFO",label:"CREATION",text:`Task <strong>${k(A.title)}</strong> was created.`,time:new Date(A.createdAt),badge:"status-info"}),(D=A.blockers)==null||D.forEach(N=>{C.push({type:"DANGER",label:"BLOCK",text:`Task <strong>${k(A.title)}</strong> flagged as <strong>Blocked</strong>.`,time:new Date(N.createdAt),badge:"status-danger"}),N.resolvedAt&&C.push({type:"SUCCESS",label:"RESOLVED",text:`Blocker on Task <strong>${k(A.title)}</strong> resolved.`,time:new Date(N.resolvedAt),badge:"status-success"})})}),C.sort((A,D)=>D.time.getTime()-A.time.getTime()),C.length===0?b.innerHTML='<p class="small-text" style="padding: 16px 0; text-align: center;">No activity recorded yet.</p>':b.innerHTML=C.slice(0,10).map(A=>{const D=Math.round((new Date().getTime()-A.time.getTime())/6e4),N=D<60?`${D} mins ago`:`${Math.round(D/60)} hours ago`;return`
            <div style="display: flex; gap: 12px; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid var(--border-neutral);">
              <div class="pill-badge ${A.badge}" style="padding: 2px 6px; font-size: 10px;">${A.label}</div>
              <div>
                <p class="body-text" style="color: var(--text-primary); font-size: 13px;">${A.text}</p>
                <span class="small-text">${N}</span>
              </div>
            </div>
          `}).join("")}const B=document.getElementById("notifications-list");if(B){const C=g.filter(A=>!A.isRead);C.length===0?B.innerHTML=`
          <div style="padding: 16px; background-color: var(--bg-secondary); border-radius: var(--radius-md); text-align: center; border: 1px dashed var(--border-neutral);">
            <p class="small-text">No pending notifications in your queue.</p>
          </div>
        `:(B.innerHTML=C.slice(0,3).map(A=>`
          <div style="padding: 10px; background-color: var(--bg-tertiary); border-radius: var(--radius-md); border-left: 3px solid var(--status-info); position: relative;">
            <p class="small-text" style="font-weight: 600; color: var(--text-primary);">${A.title}</p>
            <p class="small-text" style="margin-top: 4px;">${A.message}</p>
            <button class="mark-read-btn" data-id="${A.id}" style="background: none; border: none; font-size: 10px; color: var(--accent-navy-primary); cursor: pointer; margin-top: 6px; padding: 0;">Mark as Read</button>
          </div>
        `).join(""),B.querySelectorAll(".mark-read-btn").forEach(A=>{A.addEventListener("click",async()=>{const D=Number(A.dataset.id);try{await L("PATCH",`/notifications/${D}/read`),Me()}catch(N){console.error(N)}})}))}const S=l.filter(C=>C.status==="In Progress"||C.status==="Pending").length,M=p.length+l.filter(C=>new Date(C.dueDate).toDateString()===c.toDateString()).length,P=m.length,H=document.getElementById("mobile-hero-pct"),j=document.getElementById("mobile-hero-bar"),I=document.getElementById("mobile-hero-subtitle"),U=document.getElementById("mobile-hero-trend");if(H){const C=l.filter(N=>new Date(N.updatedAt)>=y||new Date(N.createdAt)>=y),A=C.filter(N=>N.status==="Completed").length,D=C.length>0?Math.round(A/C.length*100):0;H.innerText=`${D}%`,j&&(j.style.width=`${D}%`),I&&(I.innerText=`${A} of ${C.length} tasks completed this week`),U&&(U.innerText=`📈 +${Math.round(D/2+2)}%`)}const z=document.getElementById("mobile-stat-in-progress"),R=document.getElementById("mobile-stat-due-today"),q=document.getElementById("mobile-stat-completed");z&&(z.innerText=S),R&&(R.innerText=M),q&&(q.innerText=P);const Z=document.getElementById("mobile-due-today-list"),F=document.getElementById("mobile-due-today-count");if(Z){const C=l.filter(A=>A.status!=="Completed"&&new Date(A.dueDate).getTime()<=c.getTime()+864e5);F&&(F.innerText=`${C.length} tasks`),C.length===0?Z.innerHTML='<div style="text-align: center; color: var(--text-secondary); font-size: 13px; padding: 20px;">No tasks due today.</div>':Z.innerHTML=C.map(A=>{var Ie,Be,Ae,Le;const D=((Ie=A.assignments)==null?void 0:Ie.length)>0?`${A.assignments[0].user.firstName} ${A.assignments[0].user.lastName}`:"Unassigned",N=((Be=A.assignments)==null?void 0:Be.length)>0?A.assignments[0].userId:null,J=D!=="Unassigned"?D[0]:"?",W={High:"#DC2626",Critical:"#DC2626",Medium:"#D97706",Low:"#10B981"}[A.priority]||"#3B82F6",ie=((Ae=A.subtasks)==null?void 0:Ae.length)||2,Te=((Le=A.subtasks)==null?void 0:Le.filter(Re=>Re.status==="Completed").length)||1,$e=Math.round(Te/Math.max(1,ie)*100);return`
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
          `}).join("")}a&&(a.style.display="none"),s.style.display="flex"}catch(i){console.error(i),a&&(a.innerHTML=`
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
    `,document.body.appendChild(this.container))}show(s,i,o,d=4e3){this.initContainer();const t=document.createElement("div");t.className=`toast-item toast-${s}`,t.style.cssText=`
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
    `;const l={success:"var(--status-success)",warning:"var(--status-warning)",danger:"var(--status-danger)",info:"var(--status-info)"}[s]||"var(--text-secondary)",f=document.createElement("div");f.style.cssText=`
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background-color: ${l};
    `,t.appendChild(f);const e=document.createElement("button");e.innerHTML="&times;",e.style.cssText=`
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
    `,e.addEventListener("click",()=>this.dismiss(t)),t.appendChild(e);const u=document.createElement("strong");u.className="data-number",u.style.cssText=`
      font-size: 14px;
      color: var(--text-primary);
      padding-right: 16px;
    `,u.innerText=i,t.appendChild(u);const g=document.createElement("p");g.className="small-text",g.style.cssText=`
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.4;
    `,g.innerText=o,t.appendChild(g),this.container.appendChild(t),requestAnimationFrame(()=>{t.style.transform="translateX(0)"}),d>0&&setTimeout(()=>this.dismiss(t),d)}success(s,i,o){this.show("success",s,i,o)}warning(s,i,o){this.show("warning",s,i,o)}error(s,i,o){this.show("danger",s,i,o)}info(s,i,o){this.show("info",s,i,o)}dismiss(s){s.style.transform="translateX(120%)",s.style.opacity="0",setTimeout(()=>{s.parentNode&&s.parentNode.removeChild(s)},300)}}const E=new Ye;class Ne{constructor(s){this.onSuccess=s,this.drawerEl=null,this.overlayEl=null,this.users=[],this.departments=[],this.subtasks=[]}async render(){this.subtasks=[];try{const t=await L("GET","/users?assignableOnly=true");this.users=t.users||[];const n=new Map;this.users.forEach(l=>{l.departmentId&&l.department&&n.set(l.departmentId,l.department.name)}),this.departments=Array.from(n.entries()).map(([l,f])=>({id:l,name:f}))}catch(t){console.error(t),E.error("Data Loading Failed","Could not load assignees list.")}this.overlayEl||(this.overlayEl=document.createElement("div"),this.overlayEl.id="drawer-overlay",this.overlayEl.style.cssText=`
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
      `,this.overlayEl.addEventListener("click",()=>this.close()),document.body.appendChild(this.overlayEl)),this.drawerEl||(this.drawerEl=document.createElement("div"),this.drawerEl.id="task-create-drawer",document.body.appendChild(this.drawerEl));const s=this.users,i=s.map(t=>{var n;return`<option value="${t.id}">${k(t.firstName)} ${k(t.lastName)} (${k(((n=t.rank)==null?void 0:n.title)||"Employee")})</option>`}).join(""),o=this.departments.map(t=>`<option value="${t.id}">${k(t.name)}</option>`).join("");window.innerWidth<=768?this.drawerEl.innerHTML=`
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
                ${s.map(t=>`
                  <div class="mobile-assignee-opt" data-id="${t.id}" style="display: flex; align-items: center; gap: 8px; cursor: pointer; flex-shrink: 0; padding: 6px 12px; background: var(--bg-secondary); border: 1px solid var(--border-neutral); border-radius: 20px; transition: all 0.2s;">
                    <div style="width: 26px; height: 26px; border-radius: 50%; border: 1.5px solid transparent; transition: all 0.2s; flex-shrink: 0;">
                      <img src="/avatars/user-${t.id}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block;" />
                      <div style="width: 100%; height: 100%; border-radius: 50%; background: var(--sidebar-bg); color: var(--text-primary); display: none; align-items: center; justify-content: center; font-size: 11px; font-weight: 700;">
                        ${k(t.firstName[0])}
                      </div>
                    </div>
                    <span style="font-size: 12px; font-weight: 600; color: var(--text-primary);">${k(t.firstName)}</span>
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
                ${o}
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
      `,this.initListeners()}initListeners(){const s=document.getElementById("drawer-task-form"),i=document.getElementById("close-drawer-btn"),o=document.getElementById("cancel-drawer-btn"),d=document.getElementById("submit-task-btn"),t=document.getElementById("task-assignee"),n=document.getElementById("workload-banner"),l=document.getElementById("task-recurring"),f=document.getElementById("recurring-interval-wrapper");i==null||i.addEventListener("click",()=>this.close()),o==null||o.addEventListener("click",()=>this.close()),l&&f&&l.addEventListener("change",()=>{f.style.display=l.checked?"flex":"none"}),t&&n&&t.addEventListener("change",()=>{var y;const p=Number(t.value),x=this.users.find(m=>m.id===p);if(x){const m=((y=x.rank)==null?void 0:y.title)||"Employee";n.style.display="block",n.style.backgroundColor="rgba(37, 99, 235, 0.05)",n.style.borderColor="rgba(37, 99, 235, 0.2)",n.innerHTML=`
            <strong style="color: var(--text-primary);">Workload awareness:</strong> 
            Assigned to <strong>${x.firstName}</strong> (${m}). 
            Verify availability before assigning critical operations.
          `}});const e=window.innerWidth<=768;if(e){const p=document.getElementById("task-priority");document.querySelectorAll(".mobile-priority-opt").forEach(m=>{m.addEventListener("click",()=>{document.querySelectorAll(".mobile-priority-opt").forEach(v=>{v.classList.remove("active"),v.style.background="var(--sidebar-bg)",v.style.color="var(--text-secondary)"}),m.classList.add("active"),m.style.background="#E0E7FF",m.style.color="#4338CA",p&&(p.value=m.dataset.val)})});const x=document.getElementById("task-due");document.querySelectorAll(".mobile-due-opt").forEach(m=>{m.addEventListener("click",()=>{if(document.querySelectorAll(".mobile-due-opt").forEach(v=>{v.classList.remove("active"),v.style.background="var(--sidebar-bg)",v.style.color="var(--text-secondary)"}),m.classList.add("active"),m.style.background="#E0E7FF",m.style.color="#4338CA",x){const v=parseInt(m.dataset.offset,10),w=new Date;w.setDate(w.getDate()+v),x.value=w.toISOString().split("T")[0]}})}),x&&x.addEventListener("change",()=>{document.querySelectorAll(".mobile-due-opt").forEach(m=>{m.classList.remove("active"),m.style.background="var(--sidebar-bg)",m.style.color="var(--text-secondary)"})});const y=document.getElementById("task-assignee");document.querySelectorAll(".mobile-assignee-opt").forEach(m=>{m.addEventListener("click",()=>{document.querySelectorAll(".mobile-assignee-opt > div").forEach(v=>{v.style.border="2px solid transparent"}),m.firstElementChild.style.border="2px solid #3B82F6",y&&(y.value=m.dataset.id)})})}const u=()=>{const p=e?document.getElementById("mobile-subtasks-list"):document.getElementById("desktop-subtasks-list");p&&(p.innerHTML=this.subtasks.map((x,y)=>`
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: var(--radius-md);">
          <span style="font-size: 13px; color: var(--text-primary);">${k(x)}</span>
          <button type="button" data-index="${y}" class="remove-subtask-btn" style="background: none; border: none; color: var(--status-danger); cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">&times;</button>
        </div>
      `).join(""),p.querySelectorAll(".remove-subtask-btn").forEach(x=>{x.addEventListener("click",y=>{const m=Number(y.currentTarget.dataset.index);this.subtasks.splice(m,1),u()})}))},g=e?document.getElementById("mobile-add-subtask-btn"):document.getElementById("desktop-add-subtask-btn"),c=e?document.getElementById("mobile-new-subtask"):document.getElementById("desktop-new-subtask");g&&c&&(g.addEventListener("click",()=>{const p=c.value.trim();p&&(this.subtasks.push(p),c.value="",u())}),c.addEventListener("keypress",p=>{p.key==="Enter"&&(p.preventDefault(),g.click())})),u(),d==null||d.addEventListener("click",()=>{if(e){const p=document.getElementById("task-assignee");if(!p||!p.value){const x=document.getElementById("drawer-error-alert");x&&(x.innerText="Please assign someone by tapping an avatar.",x.style.display="block");return}}s==null||s.dispatchEvent(new Event("submit",{cancelable:!0}))}),s==null||s.addEventListener("submit",async p=>{p.preventDefault();const x=document.getElementById("task-title").value.trim(),y=document.getElementById("task-desc").value.trim(),m=document.getElementById("task-due").value,v=document.getElementById("task-priority").value,w=document.getElementById("task-dept").value,h=document.getElementById("task-assignee").value,T=l?l.checked:!1,b=T&&document.getElementById("task-interval")?document.getElementById("task-interval").value:null,S=window.innerWidth<=768?document.getElementById("mobile-new-subtask"):document.getElementById("desktop-new-subtask");S&&S.value.trim()&&(this.subtasks.push(S.value.trim()),S.value="");const M=document.getElementById("drawer-error-alert");if(M&&(M.style.display="none",M.innerText=""),!x||!y||!m||!h){r("Please populate all mandatory fields.");return}if(x.length>100){r("Task title cannot exceed 100 characters.");return}if(y.length>2e3){r("Description cannot exceed 2000 characters.");return}const P=new Date(m),H=new Date;if(H.setHours(0,0,0,0),P<H){r("Due date cannot be set in the past.");return}const j=new Date;if(j.setFullYear(H.getFullYear()+10),P>j){r("Due date cannot be set further than 10 years in the future.");return}try{d&&(d.disabled=!0,d.innerText="Creating..."),await L("POST","/tasks",{title:x,description:y,dueDate:m,priority:v,departmentId:w?Number(w):null,assigneeIds:[Number(h)],isRecurring:T,recurrenceInterval:b,subtasks:this.subtasks}),E.success("Task Created","Task assigned successfully."),this.close(),this.onSuccess&&this.onSuccess()}catch(I){console.error(I),r(I.message||"Task creation failed."),E.error("Task Creation Failed",I.message||"Check parameters."),d&&(d.disabled=!1,d.innerText="Create Task")}});function r(p){const x=document.getElementById("drawer-error-alert");x&&(x.innerText=p,x.style.display="block",x.scrollIntoView({behavior:"smooth",block:"start"}))}}open(){this.render().then(()=>{this.overlayEl.style.pointerEvents="auto",this.overlayEl.style.opacity="1",this.drawerEl.classList.add("open")})}close(){this.overlayEl&&(this.overlayEl.style.opacity="0",this.overlayEl.style.pointerEvents="none"),this.drawerEl&&this.drawerEl.classList.remove("open")}}let Pe=[],me=null,Se=null,je=[],V=localStorage.getItem("tascorr_task_tab")||"assigned",ge=localStorage.getItem("tascorr_show_completed")==="true";function Ze(){return`
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
  `}async function Je(){if(!document.getElementById("task-items-container"))return;try{je=(await L("GET","/users")).users||[]}catch(g){console.error(g)}Se=new Ne(()=>{Q()});const s=document.getElementById("workspace-create-task-btn"),i=document.getElementById("workspace-toggle-filters-btn"),o=document.getElementById("tasks-filter-bar"),d=document.getElementById("tab-assigned"),t=document.getElementById("tab-delegated"),n=document.getElementById("task-show-completed"),l=g=>{V=g,localStorage.setItem("tascorr_task_tab",g),[d,t].forEach(r=>{r&&(r.style.background="transparent",r.style.color="var(--text-secondary)",r.style.boxShadow="none",r.classList.remove("active"))});const c=g==="assigned"?d:t;c&&(c.style.background="var(--bg-primary)",c.style.color="var(--text-primary)",c.style.boxShadow="0 2px 4px rgba(0,0,0,0.05)",c.classList.add("active")),se()};d==null||d.addEventListener("click",()=>l("assigned")),t==null||t.addEventListener("click",()=>l("delegated")),n==null||n.addEventListener("change",g=>{ge=g.target.checked,localStorage.setItem("tascorr_show_completed",ge),se()}),s==null||s.addEventListener("click",()=>{Se.open()}),i==null||i.addEventListener("click",()=>{o&&(o.style.display==="none"?(o.style.display="flex",i.classList.add("active"),i.style.color="var(--accent-navy-primary)"):(o.style.display="none",i.classList.remove("active"),i.style.color="var(--text-primary)"))});const f=document.getElementById("task-search-input"),e=document.getElementById("task-status-filter"),u=document.getElementById("task-priority-filter");[f,e,u].forEach(g=>{g==null||g.addEventListener("input",()=>{se()})}),await Q()}async function Q(){const a=document.getElementById("task-items-container");if(a)try{Pe=(await L("GET","/tasks")).tasks||[],se()}catch(s){console.error(s),a.innerHTML=`<div style="padding: 24px; text-align: center; color: var(--status-danger);">Error fetching tasks: ${s.message}</div>`}}function se(){var n,l,f;const a=document.getElementById("task-items-container");if(!a)return;const s=((n=document.getElementById("task-search-input"))==null?void 0:n.value.toLowerCase())||"",i=((l=document.getElementById("task-status-filter"))==null?void 0:l.value)||"ALL",o=((f=document.getElementById("task-priority-filter"))==null?void 0:f.value)||"ALL",d=$.currentUser,t=Pe.filter(e=>{var x;let u=!0;if(d){const y=(x=e.assignments)==null?void 0:x.some(v=>v.userId===d.id),m=e.createdById===d.id&&!y;V==="assigned"?u=y:V==="delegated"&&(u=m)}const g=e.title.toLowerCase().includes(s)||e.description.toLowerCase().includes(s),c=i==="ALL"||e.status===i,r=o==="ALL"||e.priority===o;let p=!0;if(e.status==="Completed"&&i!=="Completed")if(ge)p=!0;else{const y=e.updatedAt?new Date(e.updatedAt):new Date(e.createdAt);p=(Date.now()-y.getTime())/(1e3*60*60)<=24}return u&&g&&c&&r&&p});if(t.sort((e,u)=>{const g=e.status==="Completed",c=u.status==="Completed";return g&&!c?1:!g&&c?-1:new Date(u.createdAt)-new Date(e.createdAt)}),t.length===0){a.innerHTML=`
      <div style="padding: 48px 24px; text-align: center; color: var(--text-secondary); display: flex; flex-direction: column; gap: 8px;">
        <p class="body-text" style="font-weight: 600;">No tasks found.</p>
        <p class="small-text">Clear filters or create a new task workspace.</p>
      </div>
    `;return}a.innerHTML=t.map(e=>{var S,M,P,H,j;const u=me&&me.id===e.id,g=u?"border: 2px solid var(--accent-navy-primary);":"border: 1px solid var(--border-neutral);",r={High:"#DC2626",Critical:"#DC2626",Medium:"#D97706",Low:"#10B981"}[e.priority]||"#3B82F6",x={Pending:"#3B82F6","In Progress":"#10B981",Blocked:"#EF4444","Under Review":"#F59E0B",Completed:"#16A34A"}[e.status]||"#3B82F6";let y=((S=e.assignments)==null?void 0:S.length)>0?`${e.assignments[0].user.firstName} ${e.assignments[0].user.lastName}`:"Unassigned",m=((M=e.assignments)==null?void 0:M.length)>0?e.assignments[0].userId:null,v=y!=="Unassigned"?e.assignments[0].user.firstName[0]:"?",w="";m===((P=$.currentUser)==null?void 0:P.id)&&(e.creator?(y=`${e.creator.firstName} ${e.creator.lastName}`,m=e.creator.id,v=e.creator.firstName[0],w="From: "):(y="System",m=null,v="S",w="From: "));const h=((H=e.subtasks)==null?void 0:H.length)||0,T=((j=e.subtasks)==null?void 0:j.filter(I=>I.status==="Completed").length)||0,b=h>0?Math.round(T/h*100):e.status==="Completed"?100:0,B=e.status==="Completed"?"opacity: 0.6;":"";return`
      <div class="task-list-item" data-id="${e.id}" style="background: var(--bg-primary); ${g} border-radius: 20px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); margin-bottom: 16px; cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease; ${u?"transform: translateY(-2px); box-shadow: 0 4px 12px rgba(37,99,235,0.15);":""} ${B}">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div style="display: flex; gap: 8px; align-items: center;">
            <span style="color: ${r}; background: ${r}15; padding: 4px 8px; border-radius: 8px; font-size: 10px; font-weight: 700;">${e.priority}</span>
            <span style="color: var(--text-secondary); font-size: 12px; font-weight: 500;">General</span>
          </div>
          <div style="background: var(--bg-secondary); padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; color: var(--text-secondary); display: flex; align-items: center; gap: 4px;">
            <span style="display: block; width: 6px; height: 6px; border-radius: 50%; background: ${x};"></span> ${e.status}
          </div>
        </div>
        <h4 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">${k(e.title)}</h4>
        <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 16px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${k(e.description)}</p>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${h>0?"8px":"0"};">
          ${h>0?`
          <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-secondary);">
            <input type="radio" checked style="accent-color: var(--text-primary); pointer-events: none;" /> ${T}/${h} subtasks
          </div>
          <span style="font-size: 11px; color: var(--text-secondary);">${b}%</span>
          `:"<div></div>"}
        </div>
        ${h>0?`
        <div style="width: 100%; height: 4px; background: var(--bg-secondary); border-radius: 2px; margin-bottom: 16px; overflow: hidden;">
          <div style="height: 100%; width: ${b}%; background: var(--text-primary); border-radius: 2px;"></div>
        </div>
        `:""}

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border-neutral); padding-top: 12px; margin-top: ${h>0?"0":"16px"};">
          <div style="display: flex; align-items: center; gap: 8px;">
            ${m?`<img src="/avatars/user-${m}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;" />`:""}
            <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--sidebar-bg); color: var(--text-primary); display: ${m?"none":"flex"}; align-items: center; justify-content: center; font-size: 10px; font-weight: 700;">${v}</div>
            <span style="font-size: 11px; color: var(--text-secondary); font-weight: 500;">${w}${k(y)}</span>
          </div>
          <span class="small-text" style="color: var(--text-secondary); font-size: 10px;">
            ${new Date(e.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    `}).join(""),a.querySelectorAll(".task-list-item").forEach(e=>{e.addEventListener("click",async()=>{const u=Number(e.dataset.id);await _(u);const g=document.getElementById("tasks-workspace-container");g&&g.classList.add("task-selected"),se()})})}async function _(a){var i,o,d,t,n,l,f,e,u,g;const s=document.getElementById("task-details-container");if(s){s.innerHTML='<div style="margin: auto; color: var(--text-secondary);">Loading task details...</div>';try{me=(await L("GET",`/tasks/${a}`)).task;const r=me,x={Pending:"status-info","In Progress":"status-info",Blocked:"status-danger","Under Review":"status-warning",Completed:"status-success"}[r.status]||"status-info",y=(i=r.assignments)==null?void 0:i.find(z=>z.isActive),m=y?`${y.user.firstName} ${y.user.lastName}`:"Unassigned",v=y?y.userId:null,w=y?y.user.firstName[0]:"?",h=$.isAdmin(),T=r.createdById===((o=$.currentUser)==null?void 0:o.id),b=y&&y.userId===((d=$.currentUser)==null?void 0:d.id),B=h||T,S=((t=r.subtasks)==null?void 0:t.length)>0?r.subtasks.map(z=>{const R=z.status==="Completed"?"checked":"";return`
            <label style="display: flex; align-items: center; gap: 10px; font-size: 13px; cursor: pointer; ${z.status==="Completed"?"text-decoration: line-through; color: var(--text-secondary);":""}">
              <input type="checkbox" class="subtask-chk" data-sid="${z.id}" ${R} style="accent-color: var(--accent-navy-primary);" />
              <span>${k(z.title)}</span>
            </label>
          `}).join(""):'<p class="small-text" style="color: var(--text-secondary);">No subtask checklist items defined.</p>',M=(n=r.blockers)==null?void 0:n.find(z=>!z.resolvedAt),P=r.status==="Completed",H=((l=$.currentUser)==null?void 0:l.rankLevel)<=4&&((f=$.currentUser)==null?void 0:f.rankLevel)>0,j=T||h||H;let I="";P||((b||j)&&(I+=`
          <div style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
            <label class="small-text" style="font-weight:600;">Update Task Status</label>
            <select id="task-status-update" style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-primary);">
              <option value="Pending" ${r.status==="Pending"?"selected":""}>Pending</option>
              <option value="In Progress" ${r.status==="In Progress"?"selected":""}>In Progress</option>
              <option value="Under Review" ${r.status==="Under Review"?"selected":""}>${j?"Under Review":"Request Completion (Under Review)"}</option>
              ${j?`<option value="Completed" ${r.status==="Completed"?"selected":""}>Completed (Close Task)</option>`:""}
            </select>
          </div>
        `),b&&!M&&(I+=`
          <button id="flag-blocker-btn" style="padding: 10px; background-color: transparent; border: 1px solid var(--status-danger); color: var(--status-danger); border-radius: var(--radius-md); font-weight: 600; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 6px;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:var(--status-danger);"></span> Flag Blocker
          </button>
        `),(T||h)&&(I+=`
          <button id="reassign-task-btn" style="padding: 10px; background-color: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-weight: 600; cursor: pointer; font-size: 13px;">
            Reassign Task
          </button>
          <button id="edit-task-btn" style="padding: 10px; background-color: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-weight: 600; cursor: pointer; font-size: 13px;">
            Edit Task
          </button>
        `),T&&(I+=`
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
          <span class="pill-badge ${x}"><span class="badge-dot"></span>${k(r.status)}</span>
        </div>
        <h2 class="section-title" style="font-size: 20px; line-height: 1.3;">${k(r.title)}</h2>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px;">
          <div class="pill-badge status-info" style="font-size: 11px; display: flex; align-items: center; gap: 6px; padding-left: 6px;">
            ${v?`
              <img src="/avatars/user-${v}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width:16px;height:16px;border-radius:50%;object-fit:cover;" />
              <div style="width:16px;height:16px;border-radius:50%;background:var(--accent-navy-primary);color:#fff;display:none;align-items:center;justify-content:center;font-size:8px;font-weight:bold;margin-left:-2px;">${k(w)}</div>
            `:""}
            Assigned to: ${k(m)}
          </div>
          <div class="pill-badge" style="font-size: 11px; display: flex; align-items: center; gap: 6px; padding-left: 6px; background-color: var(--bg-secondary); border: 1px solid var(--border-neutral); color: var(--text-secondary);">
            Assigned by: ${r.creator?k(r.creator.firstName+" "+r.creator.lastName):"System"}
          </div>
          <div class="pill-badge status-danger" style="font-size: 11px;">${k(r.priority)} Priority</div>
          <div class="pill-badge status-warning" style="font-size: 11px;">Due: ${new Date(r.dueDate).toLocaleDateString()}</div>
        </div>
      </div>

      <!-- Detail Contents -->
      <div style="flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 24px;">
        <!-- Blocker warning banner -->
        ${M?`
          <div style="padding: 16px; background-color: rgba(220, 38, 38, 0.08); border-left: 4px solid var(--status-danger); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 8px;">
            <strong class="data-number" style="color: var(--status-danger);">Task is Blocked</strong>
            <p class="small-text" style="color: var(--text-primary); margin:0;">${k(M.description)}</p>
            ${B?`
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
          <p class="body-text" style="color: var(--text-primary);">${k(r.description)}</p>
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
            ${((e=r.comments)==null?void 0:e.length)>0?r.comments.map(z=>`
                  <div style="background-color: var(--bg-secondary); padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border-neutral);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                      <span class="small-text" style="font-weight: 600; color: var(--text-primary);">${z.author?k(z.author.firstName+" "+z.author.lastName):"Unknown User"}</span>
                      <span class="small-text" style="font-size:10px;">${new Date(z.createdAt).toLocaleString()}</span>
                    </div>
                    <p class="body-text" style="font-size: 12px; color: var(--text-primary); margin:0;">${k(z.content)}</p>
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
        ${I}
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
              <span style="padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: rgba(59,130,246,0.1); color: #3B82F6;">${((u=r.department)==null?void 0:u.name)||"General"}</span>
              <span class="${x}" style="padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">${r.status}</span>
            </div>
            <button id="mobile-task-detail-close" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary);">&times;</button>
          </div>
        </div>

        <!-- Scrollable Content Area -->
        <div style="flex: 1; overflow-y: auto; padding: 24px; padding-bottom: 100px;">
          <h2 style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; line-height: 1.2;">${k(r.title)}</h2>
          <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 24px;">${k(r.description)}</p>

          <!-- Cards Row -->
          <div style="display: flex; gap: 12px; margin-bottom: 24px;">
            <div style="flex: 1; background: var(--bg-secondary); border-radius: 16px; padding: 12px; display: flex; flex-direction: column; gap: 4px; border: 1px solid var(--border-neutral);">
              <span style="font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Due Date</span>
              <span style="font-size: 13px; font-weight: 600; color: var(--text-primary);">${new Date(r.dueDate).toLocaleDateString()}</span>
            </div>
            <div style="flex: 1; background: var(--bg-secondary); border-radius: 16px; padding: 12px; display: flex; flex-direction: column; gap: 4px; border: 1px solid var(--border-neutral);">
              <span style="font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Priority</span>
              <span style="font-size: 13px; font-weight: 600; color: var(--text-primary);">${r.priority}</span>
            </div>
          </div>

          <!-- Assigned To -->
          <div style="background: var(--bg-secondary); border-radius: 16px; padding: 12px; display: flex; align-items: center; gap: 12px; margin-bottom: 24px; border: 1px solid var(--border-neutral);">
            ${v?`<img src="/avatars/user-${v}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />`:""}
            <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--sidebar-bg); color: var(--text-primary); display: ${v?"none":"flex"}; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">${w}</div>
            <div style="display: flex; flex-direction: column;">
              <span style="font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Assigned To</span>
              <span style="font-size: 14px; font-weight: 600; color: var(--text-primary);">${k(m)}</span>
            </div>
          </div>

          <!-- Subtasks -->
          <div>
            <h3 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 16px;">Subtasks</h3>
            <div style="display: flex; flex-direction: column; gap: 16px;">
              ${((g=r.subtasks)==null?void 0:g.length)>0?r.subtasks.map(z=>{const R=z.status==="Completed";return`
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div class="mobile-subtask-toggle" data-sid="${z.id}" data-done="${R}" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid ${R?"#3B82F6":"#D1D5DB"}; background: ${R?"#3B82F6":"transparent"}; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;">
                      ${R?'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>':""}
                    </div>
                    <span style="font-size: 14px; color: ${R?"#9CA3AF":"var(--text-primary)"}; text-decoration: ${R?"line-through":"none"};">${k(z.title)}</span>
                  </div>
                `}).join(""):'<div style="font-size: 14px; color: var(--text-secondary);">No subtasks defined.</div>'}
            </div>
          </div>
        </div>

        <!-- Fixed Bottom Button -->
        ${!P||T?`
          <div style="position: absolute; bottom: 0; left: 0; width: 100%; padding: 16px 24px; background: var(--bg-primary); border-top: 1px solid var(--border-neutral); border-radius: 0 0 32px 32px; display: flex; gap: 12px; box-shadow: 0 -4px 12px rgba(0,0,0,0.05); z-index: 10;">
            ${P?"":`
              <button id="mobile-mark-complete-btn" style="flex: 1; background: #3B82F6; color: white; padding: 14px 20px; border: none; border-radius: 100px; font-size: 15px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(59,130,246,0.3);">
                Mark as Complete
              </button>
            `}
            ${T?`
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
            <input type="text" id="edit-task-title" value="${k(r.title)}" class="tascorr-input" />
          </div>
          <div class="form-group">
            <label class="small-text">Description</label>
            <textarea id="edit-task-desc" class="tascorr-input" rows="4">${k(r.description)}</textarea>
          </div>
          <div class="form-group" style="display:flex; gap:12px;">
            <div style="flex:1;">
              <label class="small-text">Due Date</label>
              <input type="date" id="edit-task-due" value="${new Date(r.dueDate).toISOString().split("T")[0]}" class="tascorr-input" />
            </div>
            <div style="flex:1;">
              <label class="small-text">Priority</label>
              <select id="edit-task-priority" class="tascorr-input">
                <option value="Low" ${r.priority==="Low"?"selected":""}>Low</option>
                <option value="Medium" ${r.priority==="Medium"?"selected":""}>Medium</option>
                <option value="High" ${r.priority==="High"?"selected":""}>High</option>
                <option value="Critical" ${r.priority==="Critical"?"selected":""}>Critical</option>
              </select>
            </div>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px;">
            <button id="cancel-edit-task" class="btn btn-secondary">Cancel</button>
            <button id="save-edit-task" class="btn btn-primary">Save Changes</button>
          </div>
        </div>
      </div>
    `;s.innerHTML+=U,setTimeout(()=>{const z=s.querySelector(".mobile-only");z&&(z.style.transform="translateY(100%)",z.offsetWidth,z.style.transition="transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",z.style.transform="translateY(0)")},10),Ke(r)}catch(c){console.error(c),s.innerHTML=`<div style="margin: auto; color: var(--status-danger);">Failed to fetch task details: ${c.message}</div>`}}}function Ke(a){var m,v,w,h,T;(m=document.getElementById("mobile-task-detail-close"))==null||m.addEventListener("click",()=>{const b=document.getElementById("tasks-workspace-container");b&&b.classList.remove("task-selected")}),(v=document.getElementById("task-detail-back-btn"))==null||v.addEventListener("click",()=>{const b=document.getElementById("tasks-workspace-container");b&&b.classList.remove("task-selected")}),(w=document.getElementById("mobile-mark-complete-btn"))==null||w.addEventListener("click",async()=>{try{if(await L("PATCH",`/tasks/${a.id}/status`,{status:"Completed"}),a.subtasks&&a.subtasks.length>0)for(const b of a.subtasks)b.status!=="Completed"&&await L("PATCH",`/tasks/${a.id}/subtasks/${b.id}`,{status:"Completed"});_(a.id),se()}catch(b){alert(b.message)}});const s=async()=>{var b;if(confirm("Are you sure you want to permanently delete this task? All dependencies, assignments, comments, and subtasks will be lost."))try{await L("DELETE",`/tasks/${a.id}`),E.success("Task Deleted","Task was deleted successfully.");const B=document.getElementById("task-details-container");B&&(B.innerHTML=`
          <div style="padding: 32px; text-align: center; color: var(--text-secondary); margin: auto;">
            Select a task item to view full operational details.
          </div>
        `),(b=document.getElementById("tasks-workspace-container"))==null||b.classList.remove("task-selected"),await Q()}catch(B){E.error("Deletion Failed",B.message)}};(h=document.getElementById("delete-task-btn"))==null||h.addEventListener("click",s),(T=document.getElementById("mobile-delete-task-btn"))==null||T.addEventListener("click",s);const i=document.getElementById("task-status-update");i==null||i.addEventListener("change",async()=>{const b=i.value;try{await L("PATCH",`/tasks/${a.id}/status`,{status:b}),E.success("Status Updated",`Task set to ${b}.`),await _(a.id),Q()}catch(B){E.error("Update Failed",B.message),i.value=a.status}}),document.querySelectorAll(".subtask-chk").forEach(b=>{b.addEventListener("change",async()=>{const B=Number(b.dataset.sid),S=b.checked,M=S?"Completed":"Pending";try{await L("PATCH",`/tasks/${a.id}/subtasks/${B}`,{status:M}),E.success("Subtask Updated",`Subtask marked as ${M}.`),await _(a.id)}catch(P){E.error("Update Failed",P.message),b.checked=!S}})}),document.querySelectorAll(".mobile-subtask-toggle").forEach(b=>{b.addEventListener("click",async()=>{const B=Number(b.dataset.sid),M=b.dataset.done==="true"?"Pending":"Completed";try{await L("PATCH",`/tasks/${a.id}/subtasks/${B}`,{status:M}),E.success("Subtask Updated",`Subtask marked as ${M}.`),await _(a.id)}catch(P){E.error("Update Failed",P.message)}})});const o=document.getElementById("flag-blocker-btn"),d=document.getElementById("blocker-report-form"),t=document.getElementById("submit-blocker-btn"),n=document.getElementById("cancel-blocker-btn");o==null||o.addEventListener("click",()=>{d.style.display="flex"}),n==null||n.addEventListener("click",()=>{d.style.display="none"}),t==null||t.addEventListener("click",async()=>{const b=document.getElementById("blocker-desc").value.trim();if(!b){E.warning("Validation Check","Blocker explanation content is mandatory.");return}try{await L("POST",`/tasks/${a.id}/blockers`,{description:b}),E.success("Blocker Logged","Task flagged as blocked."),await _(a.id),Q()}catch(B){E.error("Submission Failed",B.message)}});const l=document.getElementById("resolve-blocker-btn");l==null||l.addEventListener("click",async()=>{var S,M;const b=Number(l.dataset.bid),B=(M=(S=document.getElementById("blocker-resolution-text"))==null?void 0:S.value)==null?void 0:M.trim();if(!B){E.warning("Validation","Resolution comment is mandatory.");return}try{await L("PATCH",`/tasks/${a.id}/blockers/${b}/resolve`,{resolutionComment:B}),E.success("Blocker Resolved","Task is back in progress."),await _(a.id),Q()}catch(P){E.error("Resolution Failed",P.message)}});const f=document.getElementById("edit-task-btn"),e=document.getElementById("edit-task-modal"),u=document.getElementById("cancel-edit-task"),g=document.getElementById("save-edit-task");f==null||f.addEventListener("click",()=>{e.style.display="flex"}),u==null||u.addEventListener("click",()=>{e.style.display="none"}),g==null||g.addEventListener("click",async()=>{const b=document.getElementById("edit-task-title").value.trim(),B=document.getElementById("edit-task-desc").value.trim(),S=document.getElementById("edit-task-due").value,M=document.getElementById("edit-task-priority").value;if(!b||!B||!S){E.warning("Validation Check","Title, description, and due date are mandatory.");return}try{await L("PATCH",`/tasks/${a.id}`,{title:b,description:B,dueDate:S,priority:M}),E.success("Task Updated","Task details have been successfully modified."),e.style.display="none",await _(a.id),Q()}catch(P){E.error("Update Failed",P.message)}});const c=document.getElementById("reassign-task-btn"),r=document.getElementById("reassignment-form"),p=document.getElementById("submit-reassign-btn"),x=document.getElementById("cancel-reassign-btn");c==null||c.addEventListener("click",()=>{r.style.display="flex"}),x==null||x.addEventListener("click",()=>{r.style.display="none"}),p==null||p.addEventListener("click",async()=>{const b=document.getElementById("reassign-user").value,B=document.getElementById("reassign-reason").value.trim();if(!b||!B){E.warning("Validation Check","New assignee selection and reason parameters are mandatory.");return}try{await L("POST",`/tasks/${a.id}/reassign`,{targetAssigneeId:Number(b),reason:B}),E.success("Task Delegated","Assignee reassignment completed successfully."),await _(a.id),Q()}catch(S){E.error("Reassignment Failed",S.message)}});const y=document.getElementById("submit-comment-btn");y==null||y.addEventListener("click",async()=>{const b=document.getElementById("new-comment-text").value.trim();if(b)try{await L("POST",`/tasks/${a.id}/comments`,{content:b}),E.success("Comment Posted","Your message has been appended."),await _(a.id)}catch(B){E.error("Send Failed",B.message)}})}let ee=[],ne=[];function Xe(){const a=$.isAdmin();return`
    <div style="display: flex; flex-direction: column; gap: 32px; max-width: 1200px; margin: 0 auto;">
      <!-- Title & CTA -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 class="page-title">Departments</h1>
          <p class="body-text">Visualize structural department hierarchies, heads, and staff mappings.</p>
        </div>
        ${a?`
          <button id="add-dept-btn" class="btn btn-primary" style="padding: 10px 18px; border-radius: var(--radius-md); border: none; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 16px; height: 16px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Department
          </button>
        `:""}
      </div>

      <!-- Create Department Form (Admin only, hidden by default) -->
      ${a?`
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
    ${a?`
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
  `}async function Qe(){const a=document.getElementById("hierarchy-tree-root");if(!a)return;if($.isAdmin()){const i=document.getElementById("add-dept-btn"),o=document.getElementById("create-dept-card"),d=document.getElementById("cancel-dept-btn"),t=document.getElementById("create-dept-form"),n=document.getElementById("edit-dept-modal"),l=document.getElementById("close-edit-dept-modal-btn"),f=document.getElementById("edit-dept-form");i==null||i.addEventListener("click",()=>{o.style.display=o.style.display==="none"?"flex":"none"}),d==null||d.addEventListener("click",()=>{o.style.display="none"}),a.addEventListener("click",async e=>{const u=e.target.closest(".edit-dept-btn"),g=e.target.closest(".delete-dept-btn");if(u){const c=Number(u.dataset.id),r=ee.find(p=>p.id===c);if(r){document.getElementById("edit-dept-id").value=r.id,document.getElementById("edit-dept-name").value=r.name;const p=document.getElementById("edit-dept-head");p&&(p.innerHTML='<option value="">No Head Assigned</option>'+ne.map(x=>{var y;return`<option value="${x.id}">${k(x.firstName)} ${k(x.lastName)} (${k(((y=x.rank)==null?void 0:y.title)||"Employee")})</option>`}).join(""),p.value=r.headUserId||""),n&&(n.style.display="flex")}}if(g){const c=Number(g.dataset.id),r=ee.find(p=>p.id===c);if(r&&confirm(`Are you sure you want to delete the "${r.name}" department? All members will be unassigned.`))try{await L("DELETE",`/departments/${c}`),E.success("Department Deleted","Department node removed."),await de()}catch(p){console.error(p),E.error("Deletion Failed",p.message||"Could not delete department.")}}}),l==null||l.addEventListener("click",()=>{n&&(n.style.display="none")}),f==null||f.addEventListener("submit",async e=>{e.preventDefault();const u=Number(document.getElementById("edit-dept-id").value),g=document.getElementById("edit-dept-name").value.trim(),c=document.getElementById("edit-dept-head").value,r=document.getElementById("edit-dept-error-alert");if(r&&(r.style.display="none",r.innerText=""),!g||g.length<2){r&&(r.innerText="Department name must be at least 2 characters.",r.style.display="block");return}const p=f.querySelector('button[type="submit"]');try{p&&(p.disabled=!0,p.innerText="Saving..."),await L("PATCH",`/departments/${u}`,{name:g,headUserId:c?Number(c):null}),E.success("Department Updated","Department details saved successfully."),n&&(n.style.display="none"),await de()}catch(x){console.error(x),r&&(r.innerText=x.message||"Failed to update department.",r.style.display="block")}finally{p&&(p.disabled=!1,p.innerText="Save Changes")}}),t==null||t.addEventListener("submit",async e=>{e.preventDefault();const u=document.getElementById("dept-name").value.trim(),g=document.getElementById("dept-head").value,c=document.getElementById("dept-error-alert");if(c&&(c.style.display="none",c.innerText=""),!u||u.length<2){c&&(c.innerText="Department name must be at least 2 characters.",c.style.display="block");return}const r=t.querySelector('button[type="submit"]');try{r&&(r.disabled=!0,r.innerText="Saving..."),await L("POST","/departments",{name:u,headUserId:g?Number(g):null}),E.success("Department Created","Department node onboarded successfully."),o.style.display="none",t.reset(),await de()}catch(p){console.error(p),c&&(c.innerText=p.message||"Failed to create department node.",c.style.display="block")}finally{r&&(r.disabled=!1,r.innerText="Save Department")}})}await de()}async function de(){const a=document.getElementById("hierarchy-tree-root");if(!a)return;const s=$.isAdmin();try{const[i,o]=await Promise.all([L("GET","/departments"),L("GET","/users")]);if(ee=i.departments||[],ne=o.users||[],et(),s){const d=document.getElementById("dept-head");d&&(d.innerHTML='<option value="">No Head Assigned</option>'+ne.map(t=>{var n;return`<option value="${t.id}">${k(t.firstName)} ${k(t.lastName)} (${k(((n=t.rank)==null?void 0:n.title)||"Employee")})</option>`}).join(""))}}catch(i){console.error(i),a.innerHTML=`<div style="color:var(--status-danger)">Error loading structure: ${k(i.message)}</div>`}}function et(){var t;const a=document.getElementById("hierarchy-tree-root");if(!a)return;const s=$.isAdmin();let i="";const o=ne.filter(n=>{var l;return((l=n.rank)==null?void 0:l.level)===1&&n.status==="active"}),d=o.length>0?o[0]:null;if(d){const n=`/avatars/user-${d.id}.jpg?t=${Date.now()}`,l=`${d.firstName[0]}${d.lastName[0]}`;i+=`
      <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 32px;">
        <!-- Root Card -->
        <div class="org-node" style="position: relative; z-index: 2;">
          <div style="width: 48px; height: 48px; border-radius: 50%; overflow: hidden; margin: 0 auto 12px auto; background-color: var(--accent-navy-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <img src="${n}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 100%; height: 100%; object-fit: cover; display: none;" />
            <div style="display: flex;">${k(l)}</div>
          </div>
          <div style="font-weight: 600; font-size: 14px; text-align: center; color: var(--text-primary); margin-bottom: 4px;">
            ${k(d.firstName)} ${k(d.lastName)}
          </div>
          <div style="font-size: 12px; color: var(--text-secondary); text-align: center;">
            ${k(((t=d.rank)==null?void 0:t.title)||"Top Executive")}
          </div>
        </div>
        
        <!-- Stem down from Root -->
        ${ee.length>0?'<div style="width: 2px; height: 32px; background-color: var(--tree-line-color);"></div>':""}
      </div>
    `}ee.length>0?i+=`
      <div style="display: flex; gap: 32px; justify-content: center; align-items: flex-start; position: relative;">

        ${ee.map((n,l)=>{var c;const f=n.headUser,e=f?`${f.firstName} ${f.lastName}`:"Vacant",u=f?((c=f.rank)==null?void 0:c.title)||"VP / Department Head":"No Head Assigned",g=ne.filter(r=>r.departmentId===n.id&&r.id!==(f==null?void 0:f.id));return`
            <div style="display: flex; flex-direction: column; align-items: center; position: relative; min-width: 200px;">
              
              <!-- Horizontal connector line segments bridging the gap -->
              ${ee.length>1?`
                <div style="position: absolute; top: 0; height: 2px; background-color: var(--tree-line-color);
                  left: ${l===0?"50%":"-16px"};
                  right: ${l===ee.length-1?"50%":"-16px"};"></div>
              `:""}

              <!-- Vertical drop line from horizontal connector -->
              <div style="width: 2px; height: 16px; background-color: var(--tree-line-color); z-index: 2;"></div>
              
              <!-- Department Head Card -->
              <div class="widget-card" style="padding: 16px 20px; text-align: center; border: 1px solid var(--border-neutral); max-width: 240px; min-width: 180px; background-color: var(--bg-secondary); margin-top: -2px; position: relative; z-index: 3;">
                ${s?`
                  <div style="position: absolute; top: 6px; right: 8px; display: flex; gap: 6px; z-index: 5;">
                    <button class="edit-dept-btn" data-id="${n.id}" title="Edit Department" style="background: none; border: none; cursor: pointer; color: var(--text-secondary); padding: 2px; display: flex; align-items: center;">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 13px; height: 13px;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button class="delete-dept-btn" data-id="${n.id}" title="Delete Department" style="background: none; border: none; cursor: pointer; color: var(--status-danger); padding: 2px; display: flex; align-items: center;">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 13px; height: 13px;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                `:""}
                <span class="small-text" style="font-weight: 700; color: var(--accent-navy-primary); text-transform: uppercase; font-size: 10px; display:block; margin-bottom: 8px; padding-right: 28px; text-align: left;">${k(n.name)}</span>
                <div style="display:flex;align-items:center;gap:12px;text-align:left;">
                  <img src="/avatars/user-${f==null?void 0:f.id}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width:36px;height:36px;border-radius:50%;object-fit:cover;display:${f?"block":"none"};" />
                  <div style="width:36px;height:36px;border-radius:50%;background:var(--accent-navy-primary);color:#fff;display:${f?"none":"flex"};align-items:center;justify-content:center;font-weight:bold;font-size:14px;flex-shrink:0;">${k(e[0]||"?")}</div>
                  <div>
                    <h4 class="card-title" style="font-size: 13px; font-weight: 600; text-align: left;">${k(e)}</h4>
                    <p class="small-text" style="color: var(--text-secondary); font-size:11px; text-align: left;">${k(u)}</p>
                  </div>
                </div>
              </div>

              <!-- Connector Line to Department Members -->
              ${g.length>0?`
                <div style="width: 2px; height: 24px; background-color: var(--tree-line-color);"></div>
                
                <!-- Members vertical tree stack -->
                <div style="display: flex; flex-direction: column; gap: 12px; align-items: center; width: 100%;">
                  ${g.map(r=>{var p;return`
                    <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
                      <div style="width: 2px; height: 12px; background-color: var(--tree-line-color);"></div>
                      <div style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-sm); text-align: left; background-color: var(--bg-primary); min-width: 140px; max-width: 200px; display: flex; align-items: center; gap: 8px;">
                        <img src="/avatars/user-${r.id}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width:24px;height:24px;border-radius:50%;object-fit:cover;display:block;" />
                        <div style="width:24px;height:24px;border-radius:50%;background:var(--accent-navy-primary);color:#fff;display:none;align-items:center;justify-content:center;font-weight:bold;font-size:10px;flex-shrink:0;">${k(r.firstName[0]||"?")}</div>
                        <div>
                          <strong class="data-number" style="font-size: 12px; display:block;">${k(r.firstName)} ${k(r.lastName)}</strong>
                          <div class="small-text" style="font-size:10px; margin-top:2px;">${k(((p=r.rank)==null?void 0:p.title)||"Employee")}</div>
                        </div>
                      </div>
                    </div>
                  `}).join("")}
                </div>
              `:""}
            </div>
          `}).join("")}
      </div>
    `:i+='<p class="small-text" style="color:var(--text-secondary)">No departments configured.</p>',a.innerHTML=i}let ye=[],X=[],he=[];function tt(){const a=$.isAdmin();return`
    <div style="display: flex; flex-direction: column; gap: 24px; max-width: 1200px; margin: 0 auto;">
      <!-- Title & CTA -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 class="page-title">Employees</h1>
          <p class="body-text">Manage corporate employee profiles, ranks, and operational provisioning.</p>
        </div>
        ${a?`
          <button id="add-employee-btn" class="btn btn-primary" style="padding: 10px 18px; border-radius: var(--radius-md); border: none; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 16px; height: 16px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Employee
          </button>
        `:""}
      </div>

      <!-- Add Employee Drawer Form (Admin only, hidden by default) -->
      ${a?`
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
      ${a?`
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
    ${a?`
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
  `}async function at(){var i,o,d;if(!document.getElementById("employees-table-body"))return;const s=$.isAdmin();if((i=document.getElementById("employee-search"))==null||i.addEventListener("input",we),(o=document.getElementById("employee-status"))==null||o.addEventListener("input",we),s){let p=function(y){const m=document.getElementById("employee-error-alert");m&&(m.innerText=y,m.style.display="block")},x=function(y){const m=document.getElementById("rank-error-alert");m&&(m.innerText=y,m.style.display="block")};const t=document.getElementById("add-employee-btn"),n=document.getElementById("add-employee-drawer"),l=document.getElementById("cancel-employee-btn"),f=document.getElementById("create-employee-form"),e=document.getElementById("create-rank-form"),u=document.getElementById("edit-employee-modal"),g=document.getElementById("close-edit-modal-btn"),c=document.getElementById("edit-employee-form");t==null||t.addEventListener("click",()=>{ye.filter(m=>m.status==="active").length>=10&&E.warning("Tier Limit Warning","Your workspace count is at 10 active users. Adding employees requires tier migration support."),n.style.display=n.style.display==="none"?"flex":"none"}),l==null||l.addEventListener("click",()=>{n.style.display="none"}),(d=document.getElementById("employees-table-body"))==null||d.addEventListener("click",async y=>{const m=y.target.closest(".edit-emp-btn");if(m){const w=Number(m.dataset.id),h=ye.find(T=>T.id===w);if(h){document.getElementById("edit-emp-id").value=h.id,document.getElementById("edit-emp-first").value=h.firstName,document.getElementById("edit-emp-last").value=h.lastName;const T=document.getElementById("edit-emp-rank");T&&(T.innerHTML=X.map(S=>`<option value="${S.id}">${k(S.title)} (Level ${S.level})</option>`).join(""),T.value=h.rankId);const b=document.getElementById("edit-emp-dept");b&&(b.innerHTML='<option value="">Unassigned</option>'+he.map(S=>`<option value="${S.id}">${k(S.name)}</option>`).join(""),b.value=h.departmentId||""),document.getElementById("edit-emp-status").value=h.status;const B=document.getElementById("edit-emp-password");B&&(B.value=""),u&&(u.style.display="flex")}}const v=y.target.closest(".delete-emp-btn");if(v){const w=Number(v.dataset.id),h=v.dataset.name||"this employee";if(!confirm(`Are you sure you want to delete "${h}"? This action will deactivate their account.`))return;try{v.disabled=!0,v.innerText="Deleting...",await L("DELETE",`/users/${w}`),E.success("Employee Deleted",`${h} has been removed from the directory.`),await te()}catch(T){console.error(T),E.error("Deletion Failed",T.message||"Could not delete employee.")}finally{v.disabled=!1,v.innerText="Delete"}}}),g==null||g.addEventListener("click",()=>{u&&(u.style.display="none")}),c==null||c.addEventListener("submit",async y=>{y.preventDefault();const m=Number(document.getElementById("edit-emp-id").value),v=document.getElementById("edit-emp-first").value.trim(),w=document.getElementById("edit-emp-last").value.trim(),h=Number(document.getElementById("edit-emp-rank").value),T=document.getElementById("edit-emp-dept").value,b=document.getElementById("edit-emp-status").value,B=document.getElementById("edit-emp-password").value;if(!v||!w){E.error("Validation Error","First name and Last name are required.");return}const S={firstName:v,lastName:w,rankId:h,departmentId:T?Number(T):null,status:b};if(B){if(B.length<12||!/[a-z]/.test(B)||!/[A-Z]/.test(B)||!/[0-9]/.test(B)||!/[^a-zA-Z0-9]/.test(B)){E.error("Validation Error","Passwords must be at least 12 characters and meet complexity requirements (mixed case, number, symbol).");return}S.password=B}const M=c.querySelector('button[type="submit"]');try{M&&(M.disabled=!0,M.innerText="Saving..."),await L("PATCH",`/users/${m}`,S),E.success("User Profile Updated","Employee details modified successfully."),u&&(u.style.display="none"),await te()}catch(P){console.error(P),E.error("Update Failed",P.message||"Check server constraints.")}finally{M&&(M.disabled=!1,M.innerText="Save Changes")}});const r=document.getElementById("rank-list-rows");r==null||r.addEventListener("input",y=>{if(y.target.classList.contains("rank-title-edit-input")){const m=y.target.closest("div"),v=m==null?void 0:m.querySelector(".save-rank-btn");v&&(v.style.display="inline-block")}}),r==null||r.addEventListener("click",async y=>{if(y.target.classList.contains("save-rank-btn")){const m=Number(y.target.dataset.id),v=y.target.closest("div"),w=v==null?void 0:v.querySelector(".rank-title-edit-input"),h=w==null?void 0:w.value.trim();if(!h){E.error("Validation Error","Rank title cannot be empty.");return}try{await L("PATCH",`/users/ranks/${m}`,{title:h}),E.success("Rank Updated","Corporate rank role updated."),await te()}catch(T){E.error("Update Failed",T.message||"Could not update rank.")}}else if(y.target.classList.contains("delete-rank-btn")){const m=Number(y.target.dataset.id);if(confirm("Are you sure you want to delete this Corporate Rank role?"))try{await L("DELETE",`/users/ranks/${m}`),E.success("Rank Deleted","Corporate rank role deleted successfully."),await te()}catch(v){E.error("Deletion Failed",v.message||"Could not delete rank.")}}}),f==null||f.addEventListener("submit",async y=>{y.preventDefault();const m=document.getElementById("emp-first").value.trim(),v=document.getElementById("emp-last").value.trim(),w=document.getElementById("emp-email").value.trim(),h=document.getElementById("emp-password").value,T=Number(document.getElementById("emp-rank").value),b=document.getElementById("emp-dept").value;if(!m||m.length<1||m.length>50){p("First name must be between 1 and 50 characters.");return}if(!v||v.length<1||v.length>50){p("Last name must be between 1 and 50 characters.");return}if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(w)){p("Please enter a valid email address format.");return}if(h.length<12||!/[a-z]/.test(h)||!/[A-Z]/.test(h)||!/[0-9]/.test(h)||!/[^a-zA-Z0-9]/.test(h)){p("Temporary passwords must be at least 12 characters long and meet complexity requirements (mixed case, number, symbol).");return}const S=f.querySelector('button[type="submit"]');try{S&&(S.disabled=!0,S.innerText="Creating Account..."),await L("POST","/users",{firstName:m,lastName:v,email:w,password:h,rankId:T,departmentId:b?Number(b):null}),E.success("User Created","Employee profile provisioned successfully."),n.style.display="none",f.reset(),await te()}catch(M){console.error(M),p(M.message||"Failed to create user account."),E.error("Provisioning Failed",M.message||"Check gate constraints.")}finally{S&&(S.disabled=!1,S.innerText="Create User")}}),e==null||e.addEventListener("submit",async y=>{y.preventDefault();const m=document.getElementById("rank-title-input").value.trim(),v=Number(document.getElementById("rank-level-input").value),w=document.getElementById("rank-error-alert");if(w&&(w.style.display="none",w.innerText=""),!m){x("Rank title is required.");return}if(isNaN(v)||v<0){x("Authority level must be a non-negative number.");return}const h=e.querySelector('button[type="submit"]');try{h&&(h.disabled=!0,h.innerText="Adding..."),await L("POST","/users/ranks",{title:m,level:v}),E.success("Rank Role Created",`Successfully added rank role: "${m}".`),e.reset(),await te()}catch(T){console.error(T),x(T.message||"Failed to create rank role."),E.error("Rank Creation Failed",T.message||"Verification failed.")}finally{h&&(h.disabled=!1,h.innerText="Add Rank Role")}})}await te()}async function te(){const a=document.getElementById("employees-table-body");if(!a)return;const s=$.isAdmin();try{const[i,o,d]=await Promise.all([L("GET","/users"),L("GET","/departments"),L("GET","/users/ranks")]);if(ye=i.users||[],he=o.departments||[],X=d.ranks||[],X.length===0&&(X=[{id:1,title:"Administrator",level:0},{id:2,title:"Chief Executive",level:1},{id:3,title:"Deputy Chief Executive",level:2},{id:4,title:"Executive / Director",level:3},{id:5,title:"Department Head",level:4},{id:6,title:"Manager",level:5},{id:7,title:"Employee",level:6}]),we(),s){const t=document.getElementById("emp-rank");t&&(t.innerHTML=X.map(e=>`<option value="${e.id}">${k(e.title)} (Level ${e.level})</option>`).join(""));const n=document.getElementById("emp-dept");n&&(n.innerHTML='<option value="">Unassigned</option>'+he.map(e=>`<option value="${e.id}">${k(e.name)}</option>`).join(""));const l=document.getElementById("rank-list-container"),f=document.getElementById("rank-list-rows");l&&f&&(X.length>0?(l.style.display="block",f.innerHTML=X.map((e,u)=>`
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; ${u<X.length-1?"border-bottom: 1px solid var(--border-neutral);":""}">
              <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                <span class="small-text" style="width: 80px; font-weight: 700; color: var(--accent-navy-primary);">Level ${e.level}</span>
                <input type="text" class="rank-title-edit-input" data-id="${e.id}" value="${k(e.title)}" style="border: 1px solid transparent; border-radius: var(--radius-sm); background: transparent; color: var(--text-primary); font-size: 13px; font-family: var(--font-text); width: 60%; max-width: 250px; padding: 4px;" />
              </div>
              <div style="display: flex; gap: 12px; align-items: center;">
                <button class="save-rank-btn small-text" data-id="${e.id}" style="background: none; border: none; color: var(--status-success); font-weight: 600; cursor: pointer; display: none; padding: 0;">Save</button>
                <button class="delete-rank-btn small-text" data-id="${e.id}" style="background: none; border: none; color: var(--status-danger); font-weight: 600; cursor: pointer; padding: 0;">Delete</button>
              </div>
            </div>
          `).join("")):l.style.display="none")}}catch(i){console.error(i),a.innerHTML=`<tr><td colspan="6" style="padding:32px; text-align:center; color:var(--status-danger);">Failed to load registry: ${k(i.message)}</td></tr>`}}function we(){var t,n;const a=document.getElementById("employees-table-body");if(!a)return;const s=((t=document.getElementById("employee-search"))==null?void 0:t.value.toLowerCase())||"",i=((n=document.getElementById("employee-status"))==null?void 0:n.value)||"ALL",o=$.isAdmin(),d=ye.filter(l=>{var g;const e=`${l.firstName} ${l.lastName}`.toLowerCase().includes(s)||l.email.toLowerCase().includes(s)||((g=l.rank)==null?void 0:g.title.toLowerCase().includes(s)),u=i==="ALL"||l.status===i;return e&&u});if(d.length===0){a.innerHTML=`
      <tr>
        <td colspan="6" style="padding: 32px; text-align: center; color: var(--text-secondary);">
          No employees matching filters found.
        </td>
      </tr>
    `;return}a.innerHTML=d.map(l=>{var p,x;const e=l.status!=="active"?'<span class="pill-badge status-danger"><span class="badge-dot"></span>Inactive</span>':'<span class="pill-badge status-success"><span class="badge-dot"></span>Active</span>',u=l.department?k(l.department.name):'<span style="color:var(--text-secondary)">General</span>',g=`${k(l.firstName)} ${k(l.lastName)}`,c=k(((p=l.rank)==null?void 0:p.title)||"Employee"),r=l.rank?l.rank.level:4;return`
      <tr style="border-bottom: 1px solid var(--border-neutral); hover: background-color var(--bg-secondary); transition: background-color 0.15s ease;">
        <td data-label="Full Name" style="padding: 16px; font-weight:600; color:var(--text-primary);">${g}</td>
        <td data-label="Email Address" style="padding: 16px; color:var(--text-secondary);">${k(l.email)}</td>
        <td data-label="Rank Level" style="padding: 16px; color:var(--text-primary); font-weight:500;">${c} <span class="small-text">(Lvl ${r})</span></td>
        <td data-label="Department" style="padding: 16px;">${u}</td>
        <td data-label="Status" style="padding: 16px;">${e}</td>
        <td data-label="Actions" style="padding: 16px; text-align: right;">
          <div style="display: inline-flex; justify-content: flex-end; align-items: center; gap: 12px;">
            <a href="#profile" class="small-text" style="color:var(--accent-navy-primary); font-weight:600; text-decoration:none;" onclick="localStorage.setItem('target_profile_id', ${l.id});">View Profile</a>
            ${o?`<button class="edit-emp-btn small-text" data-id="${l.id}" style="background: none; border: none; color: var(--accent-navy-primary); font-weight: 600; cursor: pointer; padding: 0;">Edit</button>`:""}
            ${o&&l.id!==((x=$.currentUser)==null?void 0:x.id)?`<button class="delete-emp-btn small-text" data-id="${l.id}" data-name="${k(l.firstName)} ${k(l.lastName)}" style="background: none; border: none; color: var(--status-danger); font-weight: 600; cursor: pointer; padding: 0;">Delete</button>`:""}
          </div>
        </td>
      </tr>
    `}).join("")}function rt(){const a=$.currentUser;return`
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
        ${((a==null?void 0:a.rankLevel)??99)<=3?`
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
  `}function st(a,s){const i=a.onTimeRate,o=s>0?a.completed/s*100:0,d=Math.min(a.blocked*10,30),t=Math.min(a.overdue*10,20),n=i*.5+o*.3-d-t;return Math.max(0,Math.min(100,Math.round(n)))}async function it(){var t,n;const a=document.getElementById("reports-loading"),s=document.getElementById("reports-content");if(!s)return;const i=$.currentUser,o=(i==null?void 0:i.rankLevel)??99,d=o<=3;try{const l=[L("GET","/tasks"),L("GET","/departments")];d&&l.push(L("GET","/users"));const f=await Promise.all(l),e=f[0].tasks||[],u=f[1].departments||[];let c=(d?f[2].users||[]:[]).filter(h=>{var T;return((T=h.rank)==null?void 0:T.level)!==0});o>=3&&o<=4&&(i!=null&&i.departmentId)&&(c=c.filter(h=>h.departmentId===i.departmentId));const r=e.filter(h=>h.status==="Completed");let p="N/A";if(r.length>0){const h=r.reduce((b,B)=>b+(new Date(B.updatedAt)-new Date(B.createdAt)),0),T=Math.round(h/r.length/(1e3*60*60));p=T<24?`${T} hrs`:`${Math.round(T/24)} days`}let x="N/A";const y=e.flatMap(h=>(h.blockers||[]).filter(T=>T.resolvedAt));if(y.length>0){const h=y.reduce((b,B)=>b+(new Date(B.resolvedAt)-new Date(B.createdAt)),0),T=Math.round(h/y.length/(1e3*60*60));x=T<24?`${T} hrs`:`${Math.round(T/24)} days`}let m="0%";if(e.length>0){const h=e.filter(T=>{var b;return(b=T.assignments)==null?void 0:b.some(B=>B.reassignedAt!==null)}).length;m=`${Math.round(h/e.length*100)}%`}document.getElementById("kpi-closure-time").innerText=p,document.getElementById("kpi-blocker-time").innerText=x,document.getElementById("kpi-reassign-rate").innerText=m;const v=document.getElementById("sla-chart-list");v&&(u.length===0?v.innerHTML='<p class="small-text" style="text-align: center;">No department data configured.</p>':v.innerHTML=u.map(h=>{const T=e.filter(P=>P.departmentId===h.id),b=T.filter(P=>P.status==="Completed").length,B=T.length>0?Math.round(b/T.length*100):100,S=Math.max(B,4),M=B>=80?"var(--status-success)":B>=60?"var(--status-warning)":"var(--status-danger)";return`
            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
                <span class="data-number">${k(h.name)}</span>
                <span class="small-text" style="font-weight: 600;">${B}% SLA met</span>
              </div>
              <div style="height: 8px; background-color: var(--bg-tertiary); border-radius: var(--radius-sm); overflow: hidden;">
                <div style="width: ${S}%; height: 100%; background-color: ${M}; border-radius: var(--radius-sm); transition: width 0.6s ease;"></div>
              </div>
            </div>
          `}).join(""));const w=document.getElementById("priority-list");if(w){const h=["Critical","High","Medium","Low"];w.innerHTML=h.map(T=>{const b=e.filter(P=>P.priority===T),B=b.filter(P=>P.status==="Completed").length,S=b.length>0?Math.round(B/b.length*100):0;return`
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-neutral);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${{Critical:"var(--status-danger)",High:"var(--status-warning)",Medium:"var(--status-info)",Low:"var(--status-success)"}[T]};"></span>
              <span class="data-number">${T} Priority</span>
            </div>
            <div style="text-align: right;">
              <span class="pill-badge status-info" style="font-size: 11px;">${S}% Rate</span>
              <div class="small-text" style="font-size: 10px; margin-top: 2px;">${B} / ${b.length} completed</div>
            </div>
          </div>
        `}).join("")}if(d&&c.length>0){let M=function(H){const j=document.getElementById("staff-performance-list");if(j){if(H.length===0){j.innerHTML='<p class="small-text" style="text-align: center; padding: 24px;">No staff members match the current filter.</p>';return}j.innerHTML=H.map((I,U)=>{var D,N;const z=I.score>=75?"var(--status-success)":I.score>=50?"var(--status-warning)":"var(--status-danger)",R=I.score>=75?"rgba(34,197,94,0.08)":I.score>=50?"rgba(234,179,8,0.08)":"rgba(239,68,68,0.08)",q=U===0?'<span style="font-size:14px;" title="Top performer">🥇</span>':U===1?'<span style="font-size:14px;" title="Second place">🥈</span>':U===2?'<span style="font-size:14px;" title="Third place">🥉</span>':"",Z=u.find(J=>J.id===I.user.departmentId),F=Z?k(Z.name):"Unassigned",C=`
            <div class="desktop-only" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1.5fr; gap: 8px; align-items: center; padding: 14px 16px; border-radius: var(--radius-md); background: var(--bg-primary); border: 1px solid var(--border-neutral); transition: box-shadow 0.15s;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="position: relative; width: 36px; height: 36px; flex-shrink: 0;">
                  <img src="/avatars/user-${I.user.id}.jpg" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" style="width:36px;height:36px;border-radius:50%;object-fit:cover;" />
                  <div style="width:36px;height:36px;border-radius:50%;background:var(--sidebar-bg);display:none;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:var(--text-primary);">${k(I.user.firstName[0])}${k(I.user.lastName[0]||"")}</div>
                </div>
                <div>
                  <div style="font-weight: 600; font-size: 14px; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                    ${k(I.user.firstName)} ${k(I.user.lastName)} ${q}
                  </div>
                  <div class="small-text" style="font-size: 11px;">${k(((D=I.user.rank)==null?void 0:D.title)||"Employee")} · ${F}</div>
                </div>
              </div>
              <div style="text-align: center; font-size: 15px; font-weight: 700; color: var(--text-primary);">${I.completed}<span class="small-text" style="font-size:11px; font-weight:400;"> / ${I.total}</span></div>
              <div style="text-align: center;">
                <span style="font-size: 15px; font-weight: 700; color: ${I.onTimeRate>=75?"var(--status-success)":I.onTimeRate>=50?"var(--status-warning)":"var(--status-danger)"};">${I.onTimeRate}%</span>
              </div>
              <div style="text-align: center; font-size: 14px; color: var(--text-secondary);">${I.avgDays==="--"?"--":I.avgDays+"d"}</div>
              <div style="text-align: center;">
                ${I.overdue>0?`<span style="font-size:14px;font-weight:700;color:var(--status-danger);">${I.overdue}</span>`:'<span style="font-size:14px;color:var(--text-secondary);">0</span>'}
              </div>
              <div style="display: flex; align-items: center; justify-content: flex-end; gap: 10px;">
                <div style="flex: 1; max-width: 80px; height: 6px; background: var(--bg-tertiary); border-radius: 3px; overflow: hidden;">
                  <div style="width: ${I.score}%; height: 100%; background: ${z}; border-radius: 3px; transition: width 0.6s ease;"></div>
                </div>
                <span style="font-size: 15px; font-weight: 800; color: ${z}; min-width: 32px; text-align: right;">${I.score}</span>
              </div>
            </div>
          `,A=`
            <div class="mobile-only" style="background: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div style="position: relative; width: 40px; height: 40px; flex-shrink: 0;">
                    <img src="/avatars/user-${I.user.id}.jpg" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" />
                    <div style="width:40px;height:40px;border-radius:50%;background:var(--sidebar-bg);display:none;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:var(--text-primary);">${k(I.user.firstName[0])}${k(I.user.lastName[0]||"")}</div>
                  </div>
                  <div>
                    <div style="font-weight: 700; font-size: 15px; color: var(--text-primary);">${k(I.user.firstName)} ${k(I.user.lastName)} ${q}</div>
                    <div class="small-text" style="font-size: 11px;">${k(((N=I.user.rank)==null?void 0:N.title)||"Employee")}</div>
                  </div>
                </div>
                <div style="background: ${R}; border: 1.5px solid ${z}; border-radius: 12px; padding: 6px 14px; text-align: center;">
                  <div style="font-size: 20px; font-weight: 800; color: ${z}; line-height: 1;">${I.score}</div>
                  <div style="font-size: 9px; color: ${z}; font-weight: 600; text-transform: uppercase;">Score</div>
                </div>
              </div>
              <div style="display: flex; height: 6px; background: var(--bg-tertiary); border-radius: 3px; overflow: hidden;">
                <div style="width: ${I.score}%; background: ${z}; border-radius: 3px; transition: width 0.6s ease;"></div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; text-align: center;">
                <div style="background: var(--bg-secondary); border-radius: 10px; padding: 10px 4px;">
                  <div style="font-size: 18px; font-weight: 700; color: var(--text-primary);">${I.completed}</div>
                  <div class="small-text" style="font-size: 10px;">Done</div>
                </div>
                <div style="background: var(--bg-secondary); border-radius: 10px; padding: 10px 4px;">
                  <div style="font-size: 18px; font-weight: 700; color: ${I.onTimeRate>=75?"var(--status-success)":I.onTimeRate>=50?"var(--status-warning)":"var(--status-danger)"};">${I.onTimeRate}%</div>
                  <div class="small-text" style="font-size: 10px;">On-time</div>
                </div>
                <div style="background: var(--bg-secondary); border-radius: 10px; padding: 10px 4px;">
                  <div style="font-size: 18px; font-weight: 700; color: var(--text-secondary);">${I.avgDays==="--"?"--":I.avgDays+"d"}</div>
                  <div class="small-text" style="font-size: 10px;">Avg</div>
                </div>
                <div style="background: var(--bg-secondary); border-radius: 10px; padding: 10px 4px;">
                  <div style="font-size: 18px; font-weight: 700; color: ${I.overdue>0?"var(--status-danger)":"var(--text-secondary)"};">${I.overdue}</div>
                  <div class="small-text" style="font-size: 10px;">Overdue</div>
                </div>
              </div>
            </div>
          `;return C+A}).join("")}},P=function(){var U,z;const H=parseInt((U=document.getElementById("perf-dept-filter"))==null?void 0:U.value)||null,j=((z=document.getElementById("perf-sort"))==null?void 0:z.value)||"score";let I=[...B];H&&(I=I.filter(R=>R.user.departmentId===H)),I.sort((R,q)=>j==="score"?q.score-R.score:j==="completed"?q.completed-R.completed:j==="ontime"?q.onTimeRate-R.onTimeRate:j==="overdue"?q.overdue-R.overdue:0),M(I)};const h=new Date;h.setHours(0,0,0,0);const T=c.map(H=>{const j=e.filter(F=>{var C;return(C=F.assignments)==null?void 0:C.some(A=>A.userId===H.id&&A.isActive)}),I=j.filter(F=>F.status==="Completed"),U=I.filter(F=>new Date(F.updatedAt)<=new Date(F.dueDate)),z=I.length>0?Math.round(U.length/I.length*100):0;let R="--";if(I.length>0){const F=I.reduce((C,A)=>C+(new Date(A.updatedAt)-new Date(A.createdAt)),0);R=Math.round(F/I.length/(1e3*60*60*24))}const q=j.filter(F=>F.status==="Blocked").length,Z=j.filter(F=>F.status!=="Completed"&&new Date(F.dueDate)<h).length;return{user:H,completed:I.length,total:j.length,onTimeRate:z,avgDays:R,blocked:q,overdue:Z}}),b=Math.max(...T.map(H=>H.completed),1),B=T.map(H=>({...H,score:st(H,b)})),S=document.getElementById("perf-dept-filter");S&&u.forEach(H=>{const j=document.createElement("option");j.value=H.id,j.textContent=H.name,S.appendChild(j)}),P(),(t=document.getElementById("perf-dept-filter"))==null||t.addEventListener("change",P),(n=document.getElementById("perf-sort"))==null||n.addEventListener("change",P)}a&&(a.style.display="none"),s.style.display="flex"}catch(l){console.error(l),a&&(a.innerHTML=`<span style="color:var(--status-danger)">Failed to compute reports: ${k(l.message)}</span>`)}}function nt(){const a=$.isAdmin();return`
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
          ${a?`
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
          ${a?`
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
  `}function ot(){var l,f,e;const a=document.querySelectorAll(".settings-tab-btn"),s=document.querySelectorAll(".settings-pane");a.forEach(u=>{u.addEventListener("click",()=>{a.forEach(c=>{c.classList.remove("active"),c.style.color="var(--text-secondary)",c.style.fontWeight="500"}),u.classList.add("active"),u.style.color="var(--accent-navy-primary)",u.style.fontWeight="600";const g=u.dataset.tab;s.forEach(c=>{c.style.display=c.id===g?"flex":"none"})})});const i=document.getElementById("profile-first"),o=document.getElementById("profile-last"),d=document.getElementById("profile-email");if($.currentUser&&(i&&(i.value=$.currentUser.firstName||""),o&&(o.value=$.currentUser.lastName||""),d&&(d.value=$.currentUser.email||"")),(l=document.getElementById("profile-update-form"))==null||l.addEventListener("submit",async u=>{u.preventDefault();const g=i.value.trim(),c=o.value.trim();if(!g||!c){E.error("Validation Error","First name and Last name are required.");return}try{const r=await L("PATCH",`/users/${$.currentUser.id}`,{firstName:g,lastName:c});$.currentUser.firstName=r.user.firstName,$.currentUser.lastName=r.user.lastName,localStorage.setItem("tascorr_user",JSON.stringify($.currentUser));const p=document.getElementById("header-user-role");p&&(p.innerText=`${$.currentUser.tenantName||`${$.currentUser.firstName} ${$.currentUser.lastName}`} (${$.currentUser.rankTitle})`),E.success("Profile Saved","Account credentials updated successfully.")}catch(r){E.error("Save Failed",r.message||"An error occurred while saving profile.")}}),$.isAdmin()){L("GET","/users/tenant/details").then(c=>{if(c&&c.tenant){const r=document.getElementById("company-name"),p=document.getElementById("company-tier"),x=document.getElementById("company-cross-dept-peer"),y=document.getElementById("company-sla-access"),m=document.getElementById("company-logo-img"),v=document.getElementById("company-logo-fallback");r&&(r.value=c.tenant.name||""),x&&(x.checked=c.tenant.allowCrossDeptPeerAssignment!==!1),y&&(y.value=c.tenant.slaAccessLevel??3),p&&(p.value=`Tier ${c.tenant.subscriptionTier} Startup (Active)`),m&&v&&(m.src=`/avatars/tenant-${c.tenant.id}.jpg?t=${Date.now()}`,m.onload=()=>{m.style.display="block",v.style.display="none"},m.onerror=()=>{var w;m.style.display="none",v.style.display="block",v.innerText=((w=c.tenant.name)==null?void 0:w[0])||"?"})}}).catch(c=>console.error("Failed to load company details",c)),L("GET","/users/ranks").then(c=>{const p=(c.ranks||[]).find(x=>x.level===1);p&&document.getElementById("top-rank-title")&&(document.getElementById("top-rank-title").value=p.title,document.getElementById("top-rank-title").dataset.id=p.id)}).catch(c=>console.error("Failed to load ranks",c)),(f=document.getElementById("company-update-form"))==null||f.addEventListener("submit",async c=>{c.preventDefault();const r=document.getElementById("company-name"),p=document.getElementById("company-cross-dept-peer"),x=document.getElementById("company-sla-access"),y=r.value.trim(),m=p?p.checked:!0,v=x?Number(x.value):3;if(!y){E.error("Validation Error","Company name is required.");return}try{const w=await L("PATCH","/users/tenant/details",{name:y,allowCrossDeptPeerAssignment:m,slaAccessLevel:v});if($.currentUser){$.currentUser.tenantName=w.tenant.name,$.currentUser.tenant=w.tenant,localStorage.setItem("tascorr_user",JSON.stringify($.currentUser));const h=document.getElementById("header-user-role");h&&(h.innerText=`${w.tenant.name} (${$.currentUser.rankTitle})`);const T=document.getElementById("breadcrumbs");T&&(T.innerHTML=`
              <span class="body-text" style="font-weight: 500;">${w.tenant.name}</span>
              <span class="small-text" style="margin: 0 8px; color: var(--text-secondary);">&rarr;</span>
              <span class="body-text" style="font-weight: 600; color: var(--text-primary);">Settings</span>
            `)}E.success("Company Saved","Company details updated successfully.")}catch(w){E.error("Save Failed",w.message||"An error occurred.")}}),(e=document.getElementById("top-rank-form"))==null||e.addEventListener("submit",async c=>{c.preventDefault();const r=document.getElementById("top-rank-title"),p=r==null?void 0:r.dataset.id,x=r==null?void 0:r.value;if(!p){E.error("Update Failed","Top level rank could not be identified.");return}try{await L("PATCH",`/users/ranks/${p}`,{title:x}),E.success("Hierarchy Saved","Top level executive title updated successfully.")}catch(y){E.error("Update Failed",y.message||"Could not update hierarchy.")}});const u=document.getElementById("upload-logo-btn"),g=document.getElementById("logo-upload-input");g==null||g.addEventListener("change",async c=>{const r=c.target.files[0];if(!r)return;const p=new FileReader;p.onloadend=async()=>{const x=p.result;try{u&&(u.style.opacity="0.5");const y=await L("POST","/upload/tenant-logo",{imageBase64:x});E.success("Logo Updated","Company logo uploaded successfully.");const m=document.getElementById("company-logo-img"),v=document.getElementById("company-logo-fallback");m&&(m.src=y.logoUrl,m.style.display="block"),v&&(v.style.display="none");const w=document.getElementById("brand-logo");w&&(w.src=y.logoUrl)}catch(y){console.error(y),E.error("Upload Failed",y.message)}finally{u&&(u.style.opacity="1")}},p.readAsDataURL(r)})}const t=[{id:"light",name:"Light",color:"#EAEFF8",sidebar:"rgba(226, 232, 240, 0.9)"},{id:"dark",name:"Dark",color:"#0b0b0f",sidebar:"rgba(15, 15, 20, 0.9)"},{id:"corporate",name:"Corporate",color:"#F8FAFC",sidebar:"rgba(203, 213, 225, 0.9)"},{id:"ocean",name:"Ocean",color:"#F0F9FF",sidebar:"rgba(125, 211, 252, 0.9)"},{id:"forest",name:"Forest",color:"#F0FDF4",sidebar:"rgba(134, 239, 172, 0.9)"},{id:"sunset",name:"Sunset",color:"#FFF7ED",sidebar:"rgba(253, 186, 116, 0.9)"},{id:"lavender",name:"Lavender",color:"#FAF5FF",sidebar:"rgba(216, 180, 254, 0.9)"},{id:"midnight",name:"Midnight",color:"#05050A",sidebar:"rgba(5, 5, 10, 0.9)"}],n=()=>{const u=document.getElementById("theme-grid");if(!u)return;const g=document.documentElement.getAttribute("data-theme")||"light";u.innerHTML=t.map(c=>`
      <button class="theme-select-btn" data-theme-val="${c.id}" style="padding: 16px; border-radius: var(--radius-md); border: 2px solid ${g===c.id?"var(--accent-navy-primary)":"var(--border-neutral)"}; background-color: var(--bg-secondary); cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px; transition: all 0.2s ease;">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, ${c.sidebar} 50%, ${c.color} 50%); box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.1);"></div>
        <span style="font-weight: 600; color: var(--text-primary); font-size: 12px;">${c.name}</span>
      </button>
    `).join(""),u.querySelectorAll(".theme-select-btn").forEach(c=>{c.addEventListener("click",()=>{const r=c.dataset.themeVal;document.documentElement.setAttribute("data-theme",r),localStorage.setItem("tascorr_theme",r),window.dispatchEvent(new CustomEvent("themeChanged",{detail:r})),n(),E.info("Theme Applied",`${t.find(p=>p.id===r).name} theme activated.`)})})};n(),window.addEventListener("themeChanged",()=>{const u=document.getElementById("tab-display");u&&u.style.display!=="none"&&n()})}let O=null,He=[];function lt(){return`
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
  `}async function dt(){var o,d,t;const a=document.getElementById("profile-name");if(!a)return;const s=localStorage.getItem("target_profile_id"),i=s?Number(s):(o=$.currentUser)==null?void 0:o.id;localStorage.removeItem("target_profile_id");try{const[n,l]=await Promise.all([L("GET",`/users/${i}`),L("GET","/tasks")]);O=n.user,He=(l.tasks||[]).filter(r=>{var p;return(p=r.assignments)==null?void 0:p.some(x=>x.userId===i&&x.isActive)}),a.innerText=`${O.firstName} ${O.lastName}`;const e=document.getElementById("profile-avatar-img"),u=document.getElementById("profile-avatar");if(e.src=`/avatars/user-${O.id}.jpg?t=${Date.now()}`,e.onload=()=>{e.style.display="block",u.style.display="none"},e.onerror=()=>{e.style.display="none",u.style.display="flex",u.innerText=O.firstName[0]},document.getElementById("profile-rank").innerText=`${O.rank} (Hierarchy level ${O.rankLevel})`,document.getElementById("profile-dept-badge").innerText=O.department||"General / Corporate",document.getElementById("profile-status-badge").innerText=O.status,document.getElementById("profile-email-label").innerText=O.email,document.getElementById("profile-joined-label").innerText=new Date(O.createdAt).toLocaleDateString(),i===((d=$.currentUser)==null?void 0:d.id)||$.isAdmin()){const r=document.getElementById("upload-avatar-btn"),p=document.getElementById("avatar-upload-input");r&&(r.style.display="flex"),p==null||p.addEventListener("change",async x=>{const y=x.target.files[0];if(!y)return;const m=new FileReader;m.onloadend=async()=>{const v=m.result;try{r.style.opacity="0.5";const w=await L("POST","/upload/avatar",{imageBase64:v,targetUserId:i});E.success("Avatar Updated","Profile picture updated successfully."),e.src=`${w.avatarUrl}?t=${Date.now()}`,e.style.display="block",u.style.display="none",document.dispatchEvent(new CustomEvent("tascorr_avatar_updated"))}catch(w){console.error(w),E.error("Upload Failed",w.message)}finally{r.style.opacity="1"}},m.readAsDataURL(y)})}const g=document.getElementById("profile-security-widget");if(i===((t=$.currentUser)==null?void 0:t.id)){g&&(g.style.display="flex");const r=document.getElementById("profile-password-form");r&&r.addEventListener("submit",async p=>{p.preventDefault();const x=document.getElementById("profile-new-password").value,y=document.getElementById("profile-confirm-password").value;if(x!==y)return E.error("Password Mismatch","The new passwords do not match.");if(x.length<8)return E.error("Invalid Password","Password must be at least 8 characters long.");const m=r.querySelector("button"),v=m.innerText;try{m.disabled=!0,m.innerText="Updating...",await L("PATCH",`/users/${i}`,{password:x}),E.success("Password Updated","Your password has been changed successfully."),r.reset()}catch(w){console.error(w),E.error("Update Failed",w.message)}finally{m.disabled=!1,m.innerText=v}})}ze("week");const c=document.querySelectorAll(".profile-filter-btn");c.forEach(r=>{r.addEventListener("click",()=>{c.forEach(p=>{p.classList.remove("active"),p.style.background="none",p.style.color="var(--text-secondary)",p.style.fontWeight="500"}),r.classList.add("active"),r.style.background="var(--bg-primary)",r.style.color="var(--accent-navy-primary)",r.style.fontWeight="600",ze(r.dataset.range)})})}catch(n){console.error(n),E.error("Profile Load Failed",n.message)}}function ze(a){const s=document.getElementById("profile-tasks-body");if(!s)return;const i=new Date,o=new Date;a==="week"?o.setDate(i.getDate()-7):a==="month"?o.setMonth(i.getMonth()-1):a==="year"&&o.setFullYear(i.getFullYear()-1);const d=He.filter(t=>new Date(t.createdAt)>=o);if(d.length===0){s.innerHTML='<tr><td colspan="4" style="padding: 24px; text-align: center; color: var(--text-secondary);">No workforce history found for this range.</td></tr>';return}s.innerHTML=d.map(t=>{const l={Pending:"status-info","In Progress":"status-info",Blocked:"status-danger","Under Review":"status-warning",Completed:"status-success"}[t.status]||"status-info";return`
      <tr style="border-bottom: 1px solid var(--border-neutral);">
        <td style="padding: 12px; font-weight:600;">
          <div style="font-size:13px; color:var(--text-primary);">${t.title}</div>
        </td>
        <td style="padding: 12px;">
          <span class="pill-badge status-info" style="font-size:10px; padding:2px 6px;">${t.priority}</span>
        </td>
        <td style="padding: 12px; color: var(--text-secondary);">${new Date(t.dueDate).toLocaleDateString()}</td>
        <td style="padding: 12px;">
          <span class="pill-badge ${l}"><span class="badge-dot"></span>${t.status}</span>
        </td>
      </tr>
    `}).join("")}function ct(){const a=[{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-check"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>',title:"Smart Task Assignment",description:"Assign work across your team with full visibility into who's available, who's overloaded, and who's the right fit — before you hit assign."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list-tree"><path d="M21 12h-8"/><path d="M21 6H8"/><path d="M21 18h-8"/><path d="M8 6v14"/><path d="M3 6v.01"/><path d="M3 12v.01"/><path d="M3 18v.01"/></svg>',title:"Subtasks & Dependencies",description:"Break large initiatives into trackable pieces, and set up tasks that automatically wait their turn — no more starting work out of order."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-globe"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',title:"Remote Delegation & Monitoring",description:"Manage your business and orchestrate workforce operations from anywhere. Delegate tasks, check progress, and coordinate with off-site subordinates asynchronously.",featured:!0},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wifi-off"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.5"/><path d="M5 12.5a10.94 10.94 0 0 1 5.83-2.84"/><path d="M12 12.5a15.66 15.66 0 0 1-5.83-2.84"/><path d="M18.83 9.66A15.66 15.66 0 0 1 20 10.5"/><path d="M7.76 4.7a18.3 18.3 0 0 1 8.24 0"/></svg>',title:"Offline-First Resilience",description:"Perform task updates, log blockers, and manage work without an internet connection. Changes sync automatically when you are back online."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>',title:"Cross-Department Collaboration",description:"Request access to assign work outside your department, with time-limited approvals and a full record of who authorized what."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-line-chart"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>',title:"Performance & SLA Analytics",description:"See how quickly blockers get resolved, how long approvals take, and where your organization needs attention — all in one view."}],s=[{number:"01",title:"Set Up Your Structure",description:"Define your departments, ranks, and people once."},{number:"02",title:"Assign & Track",description:"Delegate tasks across your organization with full context."},{number:"03",title:"See What's Happening",description:"Get a real-time picture of what's done, what's stuck, and why."}],i=[{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',name:"Employees",line:"A simple view of what's yours to do."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',name:"Managers",line:"Live visibility into your team's work."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',name:"Department Heads",line:"Full control across your department."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-briefcase"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',name:"Executives",line:"A real-time pulse on the whole organization."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings-2"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>',name:"Admins",line:"Configure your company without writing code."}],o=[{name:"Tier 1 (Startup)",price:"Lifetime Free",description:"For small organizations up to 10 employee accounts.",features:["Up to 10 employee accounts","Basic task assignment","Standard hierarchies"],featured:!1},{name:"Tier 2 (Small Biz)",price:"499 MVR/mo",description:"For small organizations up to 30 employee accounts.",features:["Up to 30 employee accounts","Cross-department delegation","Basic trace trails"],featured:!1},{name:"Tier 3 (Growth)",price:"999 MVR/mo",description:"For mid-scale organizations up to 100 employee accounts.",features:["Up to 100 employee accounts","Advanced trace trails","Priority support"],featured:!0},{name:"Tier 4 (Enterprise)",price:"5,000 MVR/mo",description:"For corporate networks up to 1000 employee accounts.",features:["Up to 1000 employee accounts","SLA & analytics dashboard","Dedicated account manager"],featured:!1}],d=[{name:"Companies Registered",value:"2+",icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>'},{name:"Active Employees",value:"10+",icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'},{name:"Tasks Delegated",value:"200+",icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle-2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>'},{name:"Blockers Resolved",value:"99%",icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>'}];return`
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
            ${a.map(t=>`
              <div class="v0-card ${t.featured?"v0-pricing-featured":""}">
                <div class="v0-icon-wrapper">
                  ${t.icon}
                </div>
                <h3 class="v0-card-title">${t.title}</h3>
                <p class="v0-card-desc">${t.description}</p>
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
            ${s.map(t=>`
              <div class="v0-card">
                <span style="font-size: 1.875rem; font-weight: 700; color: #2d6cdf;">${t.number}</span>
                <h3 class="v0-card-title">${t.title}</h3>
                <p class="v0-card-desc">${t.description}</p>
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
            ${i.map(t=>`
              <div class="v0-card">
                <div class="v0-icon-wrapper small">
                  ${t.icon}
                </div>
                <h3 class="v0-card-title" style="font-size: 1.125rem;">${t.name}</h3>
                <p class="v0-card-desc" style="font-size: 0.875rem;">${t.line}</p>
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
            ${o.map(t=>`
              <div class="v0-card ${t.featured?"v0-pricing-featured":""}" style="display: flex; flex-direction: column;">
                <h3 style="font-weight: 600; color: var(--text-primary);">${t.name}</h3>
                <div class="v0-pricing-price">${t.price}</div>
                <p class="v0-card-desc" style="margin-top: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1.5rem;">${t.description}</p>
                <ul style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; list-style: none; padding: 0;">
                  ${t.features.map(n=>`
                    <li style="display: flex; gap: 0.75rem; color: var(--text-secondary); align-items: center;">
                      <svg class="size-5 text-primary" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2d6cdf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ${n}
                    </li>
                  `).join("")}
                </ul>
                <div style="margin-top: auto; padding-top: 2rem;">
                  <a href="#signup" class="v0-btn ${t.featured?"v0-btn-primary":"v0-btn-secondary"}">Get Started</a>
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
            ${d.map(t=>`
              <div style="display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
                <div style="color: #2d6cdf;">${t.icon}</div>
                <span style="font-size: 0.875rem; font-weight: 500; color: var(--text-secondary);">${t.name}</span>
                <span style="font-size: 1.5rem; font-weight: 700; color: var(--text-secondary);">${t.value}</span>
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
  `}async function ut(){const a=document.getElementById("superadmin-unauthorized"),s=document.getElementById("superadmin-content");if(!s)return;if(!$.isSuperadmin()){a.style.display="block",s.style.display="none";return}a.style.display="none",s.style.display="flex",await re(),await mt();const o=document.getElementById("log-actor-filter"),d=document.getElementById("log-company-filter"),t=document.getElementById("log-action-filter"),n=document.getElementById("log-start-date"),l=document.getElementById("log-end-date"),f=document.getElementById("log-sort-order"),e=document.getElementById("log-search-btn"),u=document.getElementById("log-clear-filters-btn"),g=document.getElementById("log-prev-page-btn"),c=document.getElementById("log-next-page-btn"),r=()=>{G=1,re()};e==null||e.addEventListener("click",r),[o,d,t,n,l].forEach(y=>{y==null||y.addEventListener("keydown",m=>{m.key==="Enter"&&r()})}),f==null||f.addEventListener("change",r),u==null||u.addEventListener("click",()=>{o&&(o.value=""),d&&(d.value=""),t&&(t.value=""),n&&(n.value=""),l&&(l.value=""),f&&(f.value="desc"),G=1,re()}),g==null||g.addEventListener("click",()=>{G>1&&(G--,re())}),c==null||c.addEventListener("click",()=>{G<pe&&(G++,re())});const p=document.getElementById("onboard-tenant-form");p==null||p.addEventListener("submit",async y=>{y.preventDefault();const m=document.getElementById("tenant-name").value.trim(),v=document.getElementById("tenant-email").value.trim(),w=document.getElementById("tenant-password").value,h=Number(document.getElementById("tenant-tier").value),T=document.getElementById("tenant-error-alert");if(T&&(T.style.display="none",T.innerText=""),w.length<12||!/[a-z]/.test(w)||!/[A-Z]/.test(w)||!/[0-9]/.test(w)||!/[^a-zA-Z0-9]/.test(w)){x("Administrator password must be at least 12 characters long and contain uppercase, lowercase, numbers, and symbols.");return}try{const b=p.querySelector('button[type="submit"]');b&&(b.disabled=!0,b.innerText="Creating Organization Workspace..."),await L("POST","/superadmin/tenants",{name:m,adminEmail:v,adminPassword:w,subscriptionTier:h}),E.success("Tenant Created","Company registered and admin account provisioned successfully."),p.reset(),await re()}catch(b){console.error(b),x(b.message||"Onboarding organization failed."),E.error("Onboarding Failed",b.message)}finally{const b=p==null?void 0:p.querySelector('button[type="submit"]');b&&(b.disabled=!1,b.innerText="Onboard Organization")}});function x(y){errorAlert&&(errorAlert.innerText=y,errorAlert.style.display="block")}}async function re(){var f,e,u,g,c,r;const a=document.getElementById("global-audit-body");if(!a)return;const s=((f=document.getElementById("log-actor-filter"))==null?void 0:f.value)||"",i=((e=document.getElementById("log-company-filter"))==null?void 0:e.value)||"",o=((u=document.getElementById("log-action-filter"))==null?void 0:u.value)||"",d=((g=document.getElementById("log-start-date"))==null?void 0:g.value)||"",t=((c=document.getElementById("log-end-date"))==null?void 0:c.value)||"",n=((r=document.getElementById("log-sort-order"))==null?void 0:r.value)||"desc",l=new URLSearchParams({page:G.toString(),limit:"100",actor:s,company:i,action:o,startDate:d,endDate:t,sortOrder:n});try{const p=await L("GET",`/superadmin/audit-logs?${l.toString()}`);be=p.logs||[],G=p.page||1,pe=p.totalPages||1;const x=document.getElementById("log-prev-page-btn"),y=document.getElementById("log-next-page-btn"),m=document.getElementById("log-page-info");if(x&&(x.disabled=G<=1),y&&(y.disabled=G>=pe),m&&(m.innerText=`Page ${G} of ${pe} (Total ${p.total||0} logs)`),be.length===0){a.innerHTML='<tr><td colspan="5" style="padding: 24px; text-align: center; color: var(--text-secondary);">No matching action history logged on the platform.</td></tr>';return}a.innerHTML=be.map(v=>{var w,h;return`
      <tr style="border-bottom: 1px solid var(--border-neutral);">
        <td style="padding: 12px; color: var(--text-secondary); font-size:12px;">${new Date(v.createdAt).toLocaleString()}</td>
        <td style="padding: 12px; font-weight:600; color: var(--text-primary);">${k(((w=v.tenant)==null?void 0:w.name)||"System")}</td>
        <td style="padding: 12px; font-weight:600;">${((h=v.actor)==null?void 0:h.email)||"System"}</td>
        <td style="padding: 12px;"><span class="pill-badge status-info" style="font-size:10px; padding:2px 6px;">${v.action}</span></td>
        <td style="padding: 12px; font-family: monospace; font-size: 11px; max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${v.metadata}">${v.metadata||"{}"}</td>
      </tr>
    `}).join("")}catch(p){console.error(p),a.innerHTML=`<tr><td colspan="5" style="padding: 24px; text-align: center; color: var(--status-danger);">Failed to load platform log: ${p.message}</td></tr>`}}async function mt(){const a=document.getElementById("registered-companies-body");if(a)try{const i=(await L("GET","/superadmin/tenants")).tenants||[];if(i.length===0){a.innerHTML='<tr><td colspan="5" style="padding: 24px; text-align: center; color: var(--text-secondary);">No organizations registered on the platform yet.</td></tr>';return}a.innerHTML=i.map(o=>{const d=new Date(o.createdAt).toLocaleString();return`
        <tr style="border-bottom: 1px solid var(--border-neutral);">
          <td style="padding: 12px; font-weight:600; color: var(--text-primary);">${k(o.name)}</td>
          <td style="padding: 12px;"><span class="pill-badge status-info" style="font-size:11px;">Tier ${o.subscriptionTier}</span></td>
          <td style="padding: 12px; color: var(--text-secondary);">${d}</td>
          <td style="padding: 12px; font-weight:600;">${o.staffCount}</td>
          <td style="padding: 12px; font-weight:600;">${o.tasksCount}</td>
        </tr>
      `}).join("")}catch(s){console.error(s),a.innerHTML=`<tr><td colspan="5" style="padding: 24px; text-align: center; color: var(--status-danger);">Failed to load organizations: ${s.message}</td></tr>`}}function gt(){return`
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
  `}function yt(){const a=document.getElementById("login-form");if(!a)return;const s=document.getElementById("login-email"),i=document.getElementById("login-password"),o=document.getElementById("login-error-alert");[s,i].forEach(t=>{t&&(t.addEventListener("focus",()=>{t.style.borderColor="var(--accent-navy-primary)"}),t.addEventListener("blur",()=>{t.style.borderColor="var(--border-neutral)"}))}),a.addEventListener("submit",async t=>{t.preventDefault();const n=s.value.trim(),l=i.value;if(o&&(o.style.display="none",o.innerText=""),!n||!l){d("Please fill out all credentials.");return}if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(n)){d("Please enter a valid email address.");return}if(n.length>254){d("Email address is too long.");return}if(l.length>128){d("Password exceeds maximum length.");return}try{const e=a.querySelector('button[type="submit"]');e&&(e.disabled=!0,e.innerText="Authenticating..."),await $.login(n,l),E.success("Access Granted","Signed in successfully."),window.location.hash="dashboard"}catch(e){console.error(e),d(e.message||"Authentication failed. Please check credentials."),E.error("Login Failed",e.message||"Check your credentials.");const u=a.querySelector('button[type="submit"]');u&&(u.disabled=!1,u.innerText="Sign In")}});function d(t){o&&(o.innerText=t,o.style.display="block")}}function xt(){return`
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
  `}function vt(){const a=document.getElementById("signup-form");if(!a)return;const s=document.getElementById("signup-company"),i=document.getElementById("signup-email"),o=document.getElementById("signup-password"),d=document.getElementById("signup-confirm-password"),t=document.getElementById("signup-error-alert"),n={length:e=>e.length>=12,case:e=>/[a-z]/.test(e)&&/[A-Z]/.test(e),number:e=>/[0-9]/.test(e),symbol:e=>/[^a-zA-Z0-9]/.test(e)};o.addEventListener("input",()=>{const e=o.value;l("req-length",n.length(e)),l("req-case",n.case(e)),l("req-number",n.number(e)),l("req-symbol",n.symbol(e))});function l(e,u){const g=document.getElementById(e);g&&(u?(g.style.color="var(--status-success)",g.innerHTML=`&#10003; ${g.innerText.replace("✓","").replace("•","").trim()}`):(g.style.color="var(--status-danger)",g.innerHTML=`&bull; ${g.innerText.replace("✓","").replace("•","").trim()}`))}a.addEventListener("submit",async e=>{e.preventDefault();const u=s.value.trim(),g=i.value.trim(),c=o.value,r=d.value;if(t&&(t.style.display="none",t.innerText=""),!u||!g||!c||!r){f("Please populate all required details.");return}if(u.length<2){f("Company name must be at least 2 characters.");return}if(u.length>100){f("Company name cannot exceed 100 characters.");return}if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g)){f("Please enter a valid email address.");return}if(c!==r){f("Passwords do not match.");return}if(!n.length(c)||!n.case(c)||!n.number(c)||!n.symbol(c)){f("Password does not meet all required complexity parameters.");return}try{const x=a.querySelector('button[type="submit"]');x&&(x.disabled=!0,x.innerText="Creating Workspace..."),await $.signup(u,g,c),E.success("Account Created","Company registered successfully. Please log in."),window.location.hash="login"}catch(x){console.error(x),f(x.message||"Workspace signup failed. Please try again."),E.error("Signup Failed",x.message||"Check submission details.");const y=a.querySelector('button[type="submit"]');y&&(y.disabled=!1,y.innerText="Register & Create Workspace")}});function f(e){t&&(t.innerText=e,t.style.display="block")}}const ae={landing:{title:"Marketing",render:ct,icon:"home",isPublic:!0},login:{title:"Sign In",render:gt,icon:"user",isPublic:!0},signup:{title:"Register",render:xt,icon:"users",isPublic:!0},dashboard:{title:"Dashboard",render:We,icon:"chart-pie"},tasks:{title:"Tasks",render:Ze,icon:"list-check"},departments:{title:"Departments",render:Xe,icon:"sitemap"},employees:{title:"Employees",render:tt,icon:"users"},reports:{title:"Reports",render:rt,icon:"chart-bar"},settings:{title:"Settings",render:nt,icon:"cog",isBottom:!0},profile:{title:"Profile",render:lt,icon:"user",isBottom:!0},superadmin:{title:"Superadmin",render:pt,icon:"key"}},ce={home:'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>',"chart-pie":'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></svg>',"list-check":'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 0A48.536 48.536 0 0112 3m0 0c2.917 0 5.747.294 8.5.862m-21 10.398c0-.552.448-1 1-1h6.25a1 1 0 011 1v3.875a1 1 0 01-1 1H2.5a1 1 0 01-1-1v-3.875z" /></svg>',sitemap:'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.75a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM12 6a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM21 10.5a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM9 18.75a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM9.75 10.5c0 .621-.504 1.125-1.125 1.125H6.75a2.25 2.25 0 01-2.25-2.25V6.75m11.25 3.75c0 .621-.504 1.125-1.125 1.125H12" /></svg>',users:'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766v-.109A12.318 12.318 0 019.374 15c2.24 0 4.332.596 6.136 1.631M19.5 9.75a3 3 0 11-6 0 3 3 0 016 0zM4 10.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>',"chart-bar":'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>',cog:'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.645-.869l.214-1.28z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>',user:'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg>',key:'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>',logout:'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>'};function De(){var l,f,e,u,g,c;const a=document.getElementById("desktop-nav"),s=document.getElementById("desktop-bottom-nav"),i=document.getElementById("mobile-nav");if(!a||!i||!s||(a.innerHTML="",s.innerHTML="",i.innerHTML="",!$.isAuthenticated))return;let o="",d="";const t=((l=$.currentUser)==null?void 0:l.rankLevel)??4,n=$.isSuperadmin();if(Object.keys(ae).forEach(r=>{var m,v;const p=ae[r];if(p.isPublic)return;if(n){if(r!=="superadmin"&&r!=="settings")return}else{if(r==="superadmin"||r==="employees"&&t>2)return;const w=((v=(m=$.currentUser)==null?void 0:m.tenant)==null?void 0:v.slaAccessLevel)??3;if(r==="reports"&&t>w)return}const x=ce[p.icon]||"",y=`
      <a href="#${r}" class="menu-item" id="nav-${r}">
        ${x}
        <span class="menu-item-text">${p.title}</span>
      </a>
    `;p.isBottom?d+=y:o+=y}),d+=`
    <a class="menu-item" id="nav-logout-action" style="color: var(--status-danger);">
      ${ce.logout}
      <span class="menu-item-text">Sign Out</span>
    </a>
  `,a.innerHTML=o,s.innerHTML=d,(f=document.getElementById("nav-logout-action"))==null||f.addEventListener("click",()=>{$.logout()}),!n){const r=((u=(e=$.currentUser)==null?void 0:e.tenant)==null?void 0:u.slaAccessLevel)??3,x=t<=r?["dashboard","tasks","quickAction","reports","settings"]:["dashboard","tasks","quickAction","settings","logout"];let y="";x.forEach(m=>{if(m==="quickAction")t<=3?y+=`
            <div class="mobile-quick-action" id="mobile-task-create" aria-label="Create Task">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
          `:y+='<div style="width: 56px; height: 56px;"></div>';else if(m==="logout")y+=`
          <a href="#" class="mobile-nav-item" id="mobile-nav-logout" style="color: var(--status-danger);">
            ${ce.logout}
            <span>Sign Out</span>
          </a>
        `;else{const v=ae[m],w=ce[v.icon]||"";y+=`
          <a href="#${m}" class="mobile-nav-item" id="mobile-nav-${m}">
            ${w}
            <span>${v.title}</span>
          </a>
        `}}),i.innerHTML=y,(g=document.getElementById("mobile-task-create"))==null||g.addEventListener("click",()=>{new Ne(()=>{window.location.hash==="#tasks"?window.location.reload():window.location.hash="tasks"}).open()}),(c=document.getElementById("mobile-nav-logout"))==null||c.addEventListener("click",m=>{m.preventDefault(),$.logout()})}}function ke(){const a=window.location.hash.substring(1)||"landing";let s=ae[a]||ae.landing;if(!s.isPublic&&!$.isAuthenticated){window.location.hash="login";return}if(s.isPublic&&$.isAuthenticated&&a!=="landing"){window.location.hash="dashboard";return}if(a==="superadmin"&&!$.isSuperadmin()){window.location.hash="dashboard";return}const i=document.getElementById("view-root");i&&(i.style.animation="none",i.offsetHeight,i.style.animation="",i.innerHTML=s.render());const o=document.getElementById("breadcrumbs");if(o){const e=$.currentUser&&$.currentUser.tenantName||"Workspace";o.innerHTML=`
      <span class="body-text" style="font-weight: 500;">${e}</span>
      <span class="small-text" style="margin: 0 8px; color: var(--text-secondary);">&rarr;</span>
      <span class="body-text" style="font-weight: 600; color: var(--text-primary);">${s.title}</span>
    `}document.querySelectorAll(".menu-item").forEach(e=>{e.classList.remove("active")});const d=document.getElementById(`nav-${a}`);d&&d.classList.add("active"),document.querySelectorAll(".mobile-nav-item").forEach(e=>{e.classList.remove("active")});const t=document.getElementById(`mobile-nav-${a}`);t&&t.classList.add("active");const n=document.getElementById("sidebar"),l=document.querySelector(".app-header"),f=document.getElementById("app-layout");s.isPublic?(document.body.classList.add("public-route"),n&&(n.style.display="none"),l&&(l.style.display="none"),f&&(f.style.backgroundColor="var(--bg-primary)")):(document.body.classList.remove("public-route"),n&&(n.style.display=window.innerWidth>768?"flex":"none"),l&&(l.style.display="flex"),f&&(f.style.backgroundColor="var(--bg-secondary)")),a==="login"&&yt(),a==="signup"&&vt(),a==="dashboard"&&_e(),a==="tasks"&&Je(),a==="employees"&&at(),a==="departments"&&Qe(),a==="reports"&&it(),a==="settings"&&ot(),a==="profile"&&dt(),a==="superadmin"&&ut()}function ft(){const a=document.getElementById("sidebar"),s=document.getElementById("sidebar-toggle"),i=document.getElementById("theme-toggle");s&&a&&s.addEventListener("click",()=>{a.classList.toggle("collapsed")});const o=localStorage.getItem("tascorr_theme")||"light";document.documentElement.setAttribute("data-theme",o);function d(l){const f=document.getElementById("theme-icon"),e=document.getElementById("mobile-theme-icon"),u=g=>{if(!g)return;["dark","midnight"].includes(l)?g.innerHTML='<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />':g.innerHTML='<path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />'};u(f),u(e)}d(o);const t=()=>{const l=document.documentElement.getAttribute("data-theme"),e=["dark","midnight"].includes(l)?"light":"dark";document.documentElement.setAttribute("data-theme",e),localStorage.setItem("tascorr_theme",e),d(e),window.dispatchEvent(new CustomEvent("themeChanged",{detail:e}))};i&&i.addEventListener("click",t);const n=document.getElementById("mobile-theme-toggle");n&&n.addEventListener("click",t),window.addEventListener("resize",()=>{const l=window.location.hash.substring(1)||"landing";!(ae[l]||ae.landing).isPublic&&a&&(a.style.display=window.innerWidth>768?"flex":"none")}),Ee()}function Ee(){const a=document.getElementById("header-user-role");if(a)if($.isAuthenticated&&$.currentUser){const e=$.currentUser,u=e.tenantName||`${e.firstName} ${e.lastName}`;a.innerText=`${u} (${e.rankTitle})`}else a.innerText="Guest";const s=document.getElementById("mobile-user-name"),i=document.getElementById("mobile-greeting"),o=document.getElementById("mobile-header-avatar");if(s&&$.isAuthenticated&&$.currentUser){const e=$.currentUser;s.innerText=e.firstName;const u=[{text:"Good morning,",hint:"en"},{text:"Buenos días,",hint:"es"},{text:"Bonjour,",hint:"fr"},{text:"Guten Morgen,",hint:"de"},{text:"Buongiorno,",hint:"it"},{text:"Ohayō,",hint:"jp"},{text:"Anyoung,",hint:"kr"},{text:"Zǎo ān,",hint:"cn"},{text:"Namaste,",hint:"in"},{text:"Bom dia,",hint:"pt"}],g=u[Math.floor(Math.random()*u.length)];if(i&&(i.innerHTML=`${g.text} <span style="font-size:10px; opacity:0.6; text-transform:uppercase; margin-left:4px;" title="Language: ${g.hint}">${g.hint}</span>`),o){const c=`${e.firstName?e.firstName.charAt(0):""}${e.lastName?e.lastName.charAt(0):""}`;o.innerHTML=`
        <img src="/avatars/user-${e.id}.jpg?t=${Date.now()}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" />
        <div style="width:40px;height:40px;border-radius:50%;background:var(--sidebar-bg);color:var(--text-primary);display:none;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:1px solid #E5E7EB;">${c||"?"}</div>
      `}}const d=document.getElementById("sidebar-user-card"),t=document.getElementById("sidebar-user-avatar"),n=document.getElementById("sidebar-user-avatar-img"),l=document.getElementById("sidebar-user-name"),f=document.getElementById("sidebar-user-role");if(d&&t&&l&&f)if($.isAuthenticated&&$.currentUser){const e=$.currentUser,u=`${e.firstName?e.firstName.charAt(0):""}${e.lastName?e.lastName.charAt(0):""}`;t.innerText=u||"??",n&&(n.src=`/avatars/user-${e.id}.jpg?t=${Date.now()}`,n.onload=()=>{n.style.display="block",t.style.display="none"},n.onerror=()=>{n.style.display="none",t.style.display="flex"}),l.innerText=`${e.firstName} ${e.lastName}`,f.innerText=e.rankTitle||"Employee",d.style.display="flex",o&&(o.onclick=()=>{var y,m,v,w,h;(y=document.getElementById("mobile-profile-sheet"))==null||y.remove(),(m=document.getElementById("mobile-profile-overlay"))==null||m.remove();const g=document.createElement("div");g.id="mobile-profile-overlay",g.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:1100;backdrop-filter:blur(2px);";const c=document.createElement("div");c.id="mobile-profile-sheet",c.style.cssText=`
            position:fixed; left:0; right:0; bottom:0; z-index:1101;
            background:var(--bg-primary); border-radius:28px 28px 0 0;
            padding:0 0 32px 0; box-shadow:0 -8px 40px rgba(0,0,0,0.15);
            transform:translateY(100%); transition:transform 0.3s cubic-bezier(0.4,0,0.2,1);
          `;const r=e.departmentName||((v=e.department)==null?void 0:v.name)||"Unassigned",p=`${((w=e.firstName)==null?void 0:w[0])||""}${((h=e.lastName)==null?void 0:h[0])||""}`;c.innerHTML=`
            <!-- Drag handle -->
            <div style="width:40px;height:4px;background:#E5E7EB;border-radius:2px;margin:12px auto 20px auto;"></div>

            <!-- User card -->
            <div style="display:flex;align-items:center;gap:16px;padding:0 24px 20px;border-bottom:1px solid var(--border-neutral);">
              <div style="position:relative;width:60px;height:60px;flex-shrink:0;">
                <img src="/avatars/user-${e.id}.jpg?t=${Date.now()}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" style="width:60px;height:60px;border-radius:50%;object-fit:cover;border:2px solid var(--border-neutral);" />
                <div style="width:60px;height:60px;border-radius:50%;background:var(--accent-navy-light);color:var(--accent-navy-primary);display:none;align-items:center;justify-content:center;font-weight:700;font-size:22px;">${p||"?"}</div>
              </div>
              <div>
                <div style="font-size:18px;font-weight:700;color:var(--text-primary);">${e.firstName} ${e.lastName}</div>
                <div style="font-size:13px;color:var(--accent-navy-primary);font-weight:600;margin-top:2px;">${e.rankTitle||"Employee"}</div>
                <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">${r}</div>
              </div>
            </div>

            <!-- Email row -->
            <div style="padding:16px 24px;border-bottom:1px solid var(--border-neutral);display:flex;align-items:center;gap:12px;">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px;height:18px;color:var(--text-secondary);flex-shrink:0;"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
              <span style="font-size:14px;color:var(--text-secondary);">${e.email||"--"}</span>
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
          `,document.body.appendChild(g),document.body.appendChild(c),requestAnimationFrame(()=>{c.style.transform="translateY(0)"});const x=()=>{c.style.transform="translateY(100%)",g.style.opacity="0",setTimeout(()=>{c.remove(),g.remove()},300)};g.addEventListener("click",x),c.querySelector("#mobile-sheet-profile-link").addEventListener("click",()=>{x(),setTimeout(()=>{window.location.hash="profile"},300)}),c.querySelector("#mobile-sheet-signout").addEventListener("click",()=>{x(),setTimeout(()=>$.logout(),300)})}),d.onclick=()=>{window.location.hash="profile";const g=document.getElementById("sidebar");g&&g.classList.contains("active")&&g.classList.remove("active")}}else d.style.display="none"}async function bt(){const a=await qe();if(a.length===0)return;console.log(`[Sync] Replaying ${a.length} queued operation(s)...`);const s=document.getElementById("offline-banner"),i=document.getElementById("offline-banner-text");s&&i&&(s.style.display="flex",s.style.background="#2563EB",i.textContent=`Syncing ${a.length} pending change${a.length>1?"s":""}...`,document.getElementById("app-layout").style.marginTop=s.offsetHeight+"px");let o=0;const d=[];for(const t of a)try{await L(t.method,t.path,t.body),await xe(t.id),o++}catch(n){const l=n==null?void 0:n.status;l===409?(console.warn(`[Sync] Conflict on op #${t.id} (${t.method} ${t.path}). Discarding local change.`),await xe(t.id),d.push({op:t,reason:"Conflict — a newer version exists on the server. Your local change was discarded."})):l===403||l===404?(console.warn(`[Sync] Permanent failure on op #${t.id} (${l}). Removing from queue.`),await xe(t.id),d.push({op:t,reason:l===403?"Permission denied — you may no longer have access.":"Resource not found — it may have been deleted."})):console.warn(`[Sync] Transient failure on op #${t.id} (${t.method} ${t.path}):`,n.message)}if(await ue(),s&&(s.style.display="none",document.getElementById("app-layout").style.marginTop="0"),o>0&&E.success("Changes Synced",`${o} offline change${o>1?"s":""} saved to the server successfully.`,5e3),d.length>0){const t=d.map(n=>`• ${n.op.method} ${n.op.path}: ${n.reason}`).join(`
`);E.error(`${d.length} Change${d.length>1?"s":""} Could Not Sync`,t,0)}if(o>0||d.length>0){const t=window.location.hash.substring(1);["dashboard","tasks"].includes(t)&&ke()}}window.addEventListener("error",a=>{console.error("Captured Global Frontend Error:",a.error),E.error("App Runtime Exception",a.message||"An unexpected client error occurred.")});window.addEventListener("unhandledrejection",a=>{var s;console.error("Captured Global Promise Rejection:",a.reason),E.error("API Error Response",((s=a.reason)==null?void 0:s.message)||"Server request returned error.")});document.addEventListener("DOMContentLoaded",async()=>{await $.checkSession();try{await oe(),await ue()}catch(a){console.warn("[OfflineDB] Could not initialize offline database:",a)}window.addEventListener("online",async()=>{$.isAuthenticated&&await bt()}),ft(),De(),document.addEventListener("tascorr_avatar_updated",()=>{Ee()}),window.addEventListener("hashchange",()=>{De(),Ee(),ke()}),ke()});
