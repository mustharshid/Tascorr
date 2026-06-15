(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const d of document.querySelectorAll('link[rel="modulepreload"]'))n(d);new MutationObserver(d=>{for(const e of d)if(e.type==="childList")for(const o of e.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function i(d){const e={};return d.integrity&&(e.integrity=d.integrity),d.referrerPolicy&&(e.referrerPolicy=d.referrerPolicy),d.crossOrigin==="use-credentials"?e.credentials="include":d.crossOrigin==="anonymous"?e.credentials="omit":e.credentials="same-origin",e}function n(d){if(d.ep)return;d.ep=!0;const e=i(d);fetch(d.href,e)}})();const He="tascorr-offline",Re=1,_="pending_ops";let ne=null;function ie(){return ne?Promise.resolve(ne):new Promise((a,s)=>{const i=indexedDB.open(He,Re);i.onupgradeneeded=n=>{const d=n.target.result;d.objectStoreNames.contains(_)||d.createObjectStore(_,{keyPath:"id",autoIncrement:!0}).createIndex("timestamp","timestamp",{unique:!1})},i.onsuccess=n=>{ne=n.target.result,a(ne)},i.onerror=n=>{console.error("[OfflineDB] Failed to open IndexedDB:",n.target.error),s(n.target.error)}})}async function Be(a){const s=await ie();return new Promise((i,n)=>{const e=s.transaction(_,"readwrite").objectStore(_),o={method:a.method,path:a.path,body:a.body,timestamp:Date.now(),retries:0},l=e.add(o);l.onsuccess=()=>i(l.result),l.onerror=()=>n(l.error)})}async function Fe(){const a=await ie();return new Promise((s,i)=>{const o=a.transaction(_,"readonly").objectStore(_).index("timestamp").getAll();o.onsuccess=()=>s(o.result),o.onerror=()=>i(o.error)})}async function Ue(){const a=await ie();return new Promise((s,i)=>{const e=a.transaction(_,"readonly").objectStore(_).count();e.onsuccess=()=>s(e.result),e.onerror=()=>i(e.error)})}async function me(a){const s=await ie();return new Promise((i,n)=>{const o=s.transaction(_,"readwrite").objectStore(_).delete(a);o.onsuccess=()=>i(),o.onerror=()=>n(o.error)})}const qe={};class ge extends Error{constructor(s,i,n=null){super(i),this.name="ApiError",this.status=s,this.details=n}}class ye extends Error{constructor(){super("You are currently offline. Showing cached data where available."),this.name="OfflineError"}}async function de(){try{const a=await Ue(),s=document.getElementById("pending-sync-badge");if(!s)return;a>0?(s.textContent=`${a} pending`,s.style.display="inline-flex"):s.style.display="none"}catch{}}async function L(a,s,i=null){const n=typeof import.meta<"u"&&qe?"/tascorr/".replace(/\/$/,""):"",d=s.startsWith("/api")?s:`/api${s}`,e=`${window.location.origin}${n}${d}`,o={Accept:"application/json"};i instanceof FormData||(o["Content-Type"]="application/json");const l=localStorage.getItem("tascorr_token");l&&(o.Authorization=`Bearer ${l}`);const v={method:a,headers:o};i&&(v.body=i instanceof FormData?i:JSON.stringify(i));const t=["POST","PATCH","PUT","DELETE"].includes(a.toUpperCase());if(t&&!navigator.onLine){try{await Be({method:a,path:d,body:i}),await de(),console.log(`[Offline Queue] Queued ${a} ${d}`)}catch(u){console.error("[Offline Queue] Failed to enqueue operation:",u)}return{queued:!0,message:"Saved locally. Will sync when back online."}}try{const u=await fetch(e,v);if(u.status===401){localStorage.removeItem("tascorr_token"),localStorage.removeItem("tascorr_user");const r=window.location.hash;r&&r!=="#landing"&&r!=="#login"&&r!=="#signup"&&(window.location.hash="login")}if(u.status===503&&a==="GET")throw new ye;let p;const c=u.headers.get("content-type");if(c&&c.includes("application/json")?p=await u.json():p={message:await u.text()},!u.ok)throw new ge(u.status,p.error||p.message||"API request failed.",p);return p}catch(u){if(u instanceof ge||u instanceof ye)throw u;if(t&&!navigator.onLine){try{await Be({method:a,path:d,body:i}),await de()}catch{}return{queued:!0,message:"Saved locally. Will sync when back online."}}throw navigator.onLine?new ge(500,u.message||"Network communication error. Please check your connection."):new ye}}class Oe{constructor(){this.currentUser=null,this.isAuthenticated=!1,this.initialized=!1;const s=localStorage.getItem("tascorr_user");if(s)try{this.currentUser=JSON.parse(s),this.isAuthenticated=!0}catch{localStorage.removeItem("tascorr_user")}}async login(s,i){const n=await L("POST","/auth/login",{email:s,password:i});return n.token&&localStorage.setItem("tascorr_token",n.token),this.currentUser=n.user,this.isAuthenticated=!0,localStorage.setItem("tascorr_user",JSON.stringify(n.user)),n}async signup(s,i,n){return await L("POST","/auth/signup",{name:s,adminEmail:i,adminPassword:n})}async logout(){try{await L("POST","/auth/logout")}catch(s){console.warn("Network error during logout",s)}this.currentUser=null,this.isAuthenticated=!1,localStorage.removeItem("tascorr_token"),localStorage.removeItem("tascorr_user"),window.location.hash="landing"}async checkSession(){if(!localStorage.getItem("tascorr_token"))return this.currentUser=null,this.isAuthenticated=!1,null;try{const s=await L("GET","/auth/session");return this.currentUser=s.user,this.isAuthenticated=!0,localStorage.setItem("tascorr_user",JSON.stringify(s.user)),s.user}catch{return this.currentUser=null,this.isAuthenticated=!1,localStorage.removeItem("tascorr_token"),localStorage.removeItem("tascorr_user"),null}finally{this.initialized=!0}}isAdmin(){return this.isAuthenticated&&this.currentUser&&this.currentUser.rankLevel===0}isExecutive(){return this.isAuthenticated&&this.currentUser&&this.currentUser.rankLevel<=1}isDeptHead(){return this.isAuthenticated&&this.currentUser&&this.currentUser.rankLevel<=2}isManager(){return this.isAuthenticated&&this.currentUser&&this.currentUser.rankLevel<=3}isSuperadmin(){return this.isAuthenticated&&this.currentUser&&this.currentUser.email==="superadmin@tascorr.com"}}const $=new Oe;function w(a){return typeof a!="string"?a==null?"":String(a):a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function Ve(){return`
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
  `}async function ze(){const a=document.getElementById("dashboard-loading"),s=document.getElementById("dashboard-content");if(s)try{const[i,n,d,e,o]=await Promise.all([L("GET","/tasks"),L("GET","/tasks/workload").catch(()=>({workload:{}})),L("GET","/users"),L("GET","/departments"),L("GET","/notifications").catch(()=>({notifications:[]}))]),l=i.tasks||[],v=n.workload||{},t=(d.users||[]).filter(C=>{var A;return((A=C.rank)==null?void 0:A.level)!==0}),u=e.departments||[],p=o.notifications||[],c=new Date;c.setHours(0,0,0,0);const r=l.filter(C=>C.status==="Blocked"||C.status==="Under Review"),g=l.filter(C=>C.status!=="Completed"&&new Date(C.dueDate)<c),x=l.filter(C=>C.status==="Under Review"),y=new Date;y.setDate(y.getDate()-7);const m=l.filter(C=>C.status==="Completed"&&new Date(C.updatedAt)>=y),f=document.getElementById("dashboard-metrics-grid");f&&(f.innerHTML=`
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
            <div class="pill-badge ${g.length>0?"status-danger":"status-success"}">
              <span class="badge-dot"></span>${g.length>0?"Overdue":"On Track"}
            </div>
          </div>
          <div class="page-title" style="font-size: 36px; line-height: 1.1;">${g.length}</div>
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
      `);const E=document.getElementById("workload-list");if(E)if(t.length===0)E.innerHTML='<p class="small-text" style="padding: 16px 0; text-align: center;">No team members registered.</p>';else{const C={};t.forEach(D=>{const N=v[D.id]||{count:0,blocked:0};C[D.id]={user:D,count:N.count,blocked:N.blocked}});const A=Object.values(C);E.innerHTML=A.slice(0,5).map(D=>{var re;const N=D.user,Z=Math.min(D.count/10*100,100),J=D.count>=10,G=J?"var(--status-danger)":"var(--accent-navy-primary)";return`
            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span class="data-number" style="font-size: 13px;">${N.firstName} ${N.lastName} (${((re=N.rank)==null?void 0:re.title)||"Employee"})</span>
                <span class="small-text">${D.count} active, ${D.blocked} blocked ${J?'<span style="color: var(--status-danger); font-weight: 600;">(Overloaded)</span>':""}</span>
              </div>
              <div style="height: 6px; background-color: var(--bg-tertiary); border-radius: var(--radius-sm); overflow: hidden;">
                <div style="width: ${Z}%; height: 100%; background-color: ${G}; border-radius: var(--radius-sm); transition: width 0.3s ease;"></div>
              </div>
            </div>
          `}).join("")}const b=document.getElementById("mobile-workload-list");if(b&&t.length>0){const C={};t.forEach(D=>{const N=v[D.id]||{count:0,blocked:0};C[D.id]={user:D,count:N.count,blocked:N.blocked}});const A=Object.values(C);b.innerHTML=A.slice(0,5).map(D=>{const N=D.user,Z=Math.min(D.count/10*100,100),J=D.count>=10,G=J?"var(--status-danger)":"var(--accent-navy-primary)";return`
          <div style="background: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: 16px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span class="data-number" style="font-size: 14px; color: var(--text-primary); font-weight: 600;">${N.firstName} ${N.lastName}</span>
              <span class="small-text" style="font-size: 12px; color: var(--text-secondary);">${D.count} active, ${D.blocked} blocked ${J?'<span style="color: var(--status-danger); font-weight: 600;">(Overloaded)</span>':""}</span>
            </div>
            <div style="height: 8px; background-color: var(--bg-tertiary); border-radius: var(--radius-md); overflow: hidden;">
              <div style="width: ${Z}%; height: 100%; background-color: ${G}; border-radius: var(--radius-md); transition: width 0.3s ease;"></div>
            </div>
          </div>
        `}).join("")}else b&&(b.innerHTML='<p class="small-text" style="padding: 16px 0; text-align: center;">No team members registered.</p>');const T=document.getElementById("departmental-list");T&&(u.length===0?T.innerHTML='<p class="small-text" style="padding: 16px 0; text-align: center;">No department nodes configured.</p>':T.innerHTML=u.map(C=>{const A=l.filter(G=>G.departmentId===C.id),D=A.filter(G=>G.status==="Completed").length,N=A.length>0?Math.round(D/A.length*100):100,J=N<80?"status-warning":"status-success";return`
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-neutral);">
              <span class="data-number" style="font-size: 13px;">${C.name}</span>
              <span class="pill-badge ${J}"><span class="badge-dot"></span>${N}% SLA score</span>
            </div>
          `}).join(""));const h=document.getElementById("activity-log-list");if(h){const C=[];l.forEach(A=>{var D;C.push({type:"INFO",label:"CREATION",text:`Task <strong>${w(A.title)}</strong> was created.`,time:new Date(A.createdAt),badge:"status-info"}),(D=A.blockers)==null||D.forEach(N=>{C.push({type:"DANGER",label:"BLOCK",text:`Task <strong>${w(A.title)}</strong> flagged as <strong>Blocked</strong>.`,time:new Date(N.createdAt),badge:"status-danger"}),N.resolvedAt&&C.push({type:"SUCCESS",label:"RESOLVED",text:`Blocker on Task <strong>${w(A.title)}</strong> resolved.`,time:new Date(N.resolvedAt),badge:"status-success"})})}),C.sort((A,D)=>D.time.getTime()-A.time.getTime()),C.length===0?h.innerHTML='<p class="small-text" style="padding: 16px 0; text-align: center;">No activity recorded yet.</p>':h.innerHTML=C.slice(0,10).map(A=>{const D=Math.round((new Date().getTime()-A.time.getTime())/6e4),N=D<60?`${D} mins ago`:`${Math.round(D/60)} hours ago`;return`
            <div style="display: flex; gap: 12px; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid var(--border-neutral);">
              <div class="pill-badge ${A.badge}" style="padding: 2px 6px; font-size: 10px;">${A.label}</div>
              <div>
                <p class="body-text" style="color: var(--text-primary); font-size: 13px;">${A.text}</p>
                <span class="small-text">${N}</span>
              </div>
            </div>
          `}).join("")}const I=document.getElementById("notifications-list");if(I){const C=p.filter(A=>!A.isRead);C.length===0?I.innerHTML=`
          <div style="padding: 16px; background-color: var(--bg-secondary); border-radius: var(--radius-md); text-align: center; border: 1px dashed var(--border-neutral);">
            <p class="small-text">No pending notifications in your queue.</p>
          </div>
        `:(I.innerHTML=C.slice(0,3).map(A=>`
          <div style="padding: 10px; background-color: var(--bg-tertiary); border-radius: var(--radius-md); border-left: 3px solid var(--status-info); position: relative;">
            <p class="small-text" style="font-weight: 600; color: var(--text-primary);">${A.title}</p>
            <p class="small-text" style="margin-top: 4px;">${A.message}</p>
            <button class="mark-read-btn" data-id="${A.id}" style="background: none; border: none; font-size: 10px; color: var(--accent-navy-primary); cursor: pointer; margin-top: 6px; padding: 0;">Mark as Read</button>
          </div>
        `).join(""),I.querySelectorAll(".mark-read-btn").forEach(A=>{A.addEventListener("click",async()=>{const D=Number(A.dataset.id);try{await L("PATCH",`/notifications/${D}/read`),ze()}catch(N){console.error(N)}})}))}const S=l.filter(C=>C.status==="In Progress"||C.status==="Pending").length,M=g.length+l.filter(C=>new Date(C.dueDate).toDateString()===c.toDateString()).length,P=m.length,H=document.getElementById("mobile-hero-pct"),j=document.getElementById("mobile-hero-bar"),B=document.getElementById("mobile-hero-subtitle"),U=document.getElementById("mobile-hero-trend");if(H){const C=l.filter(N=>new Date(N.updatedAt)>=y||new Date(N.createdAt)>=y),A=C.filter(N=>N.status==="Completed").length,D=C.length>0?Math.round(A/C.length*100):0;H.innerText=`${D}%`,j&&(j.style.width=`${D}%`),B&&(B.innerText=`${A} of ${C.length} tasks completed this week`),U&&(U.innerText=`📈 +${Math.round(D/2+2)}%`)}const z=document.getElementById("mobile-stat-in-progress"),R=document.getElementById("mobile-stat-due-today"),q=document.getElementById("mobile-stat-completed");z&&(z.innerText=S),R&&(R.innerText=M),q&&(q.innerText=P);const Y=document.getElementById("mobile-due-today-list"),F=document.getElementById("mobile-due-today-count");if(Y){const C=l.filter(A=>A.status!=="Completed"&&new Date(A.dueDate).getTime()<=c.getTime()+864e5);F&&(F.innerText=`${C.length} tasks`),C.length===0?Y.innerHTML='<div style="text-align: center; color: var(--text-secondary); font-size: 13px; padding: 20px;">No tasks due today.</div>':Y.innerHTML=C.map(A=>{var Ee,Te,$e,Ie;const D=((Ee=A.assignments)==null?void 0:Ee.length)>0?`${A.assignments[0].user.firstName} ${A.assignments[0].user.lastName}`:"Unassigned",N=((Te=A.assignments)==null?void 0:Te.length)>0?A.assignments[0].userId:null,Z=D!=="Unassigned"?D[0]:"?",G={High:"#DC2626",Critical:"#DC2626",Medium:"#D97706",Low:"#10B981"}[A.priority]||"#3B82F6",re=(($e=A.subtasks)==null?void 0:$e.length)||2,we=((Ie=A.subtasks)==null?void 0:Ie.filter(je=>je.status==="Completed").length)||1,ke=Math.round(we/Math.max(1,re)*100);return`
            <div style="background: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: 20px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="display: flex; gap: 8px; align-items: center;">
                  <span style="color: ${G}; background: ${G}15; padding: 4px 8px; border-radius: 8px; font-size: 10px; font-weight: 700;">${A.priority}</span>
                  <span style="color: var(--text-secondary); font-size: 12px; font-weight: 500;">General</span>
                </div>
                <div style="background: #F3F4F6; padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; color: #4B5563; display: flex; align-items: center; gap: 4px;">
                  <span style="display: block; width: 6px; height: 6px; border-radius: 50%; background: #EF4444;"></span> ${A.status}
                </div>
              </div>
              <h4 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 16px;">${A.title}</h4>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-secondary);">
                  <input type="radio" checked style="accent-color: #111827; pointer-events: none;" /> ${we}/${re} subtasks
                </div>
                <span style="font-size: 11px; color: var(--text-secondary);">${ke}%</span>
              </div>
              <div style="width: 100%; height: 4px; background: #E5E7EB; border-radius: 2px; margin-bottom: 16px; overflow: hidden;">
                <div style="height: 100%; width: ${ke}%; background: #111827; border-radius: 2px;"></div>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  ${N?`<img src="/avatars/user-${N}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;" />`:""}
                  <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--sidebar-bg); color: var(--text-primary); display: ${N?"none":"flex"}; align-items: center; justify-content: center; font-size: 10px; font-weight: 700;">${Z}</div>
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
      `)}}function Ge(){ze()}class We{constructor(){this.container=null,this.initContainer()}initContainer(){this.container||(this.container=document.createElement("div"),this.container.id="toast-container",this.container.style.cssText=`
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
    `,document.body.appendChild(this.container))}show(s,i,n,d=4e3){this.initContainer();const e=document.createElement("div");e.className=`toast-item toast-${s}`,e.style.cssText=`
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
    `;const l={success:"var(--status-success)",warning:"var(--status-warning)",danger:"var(--status-danger)",info:"var(--status-info)"}[s]||"var(--text-secondary)",v=document.createElement("div");v.style.cssText=`
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background-color: ${l};
    `,e.appendChild(v);const t=document.createElement("button");t.innerHTML="&times;",t.style.cssText=`
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
    `,t.addEventListener("click",()=>this.dismiss(e)),e.appendChild(t);const u=document.createElement("strong");u.className="data-number",u.style.cssText=`
      font-size: 14px;
      color: var(--text-primary);
      padding-right: 16px;
    `,u.innerText=i,e.appendChild(u);const p=document.createElement("p");p.className="small-text",p.style.cssText=`
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.4;
    `,p.innerText=n,e.appendChild(p),this.container.appendChild(e),requestAnimationFrame(()=>{e.style.transform="translateX(0)"}),d>0&&setTimeout(()=>this.dismiss(e),d)}success(s,i,n){this.show("success",s,i,n)}warning(s,i,n){this.show("warning",s,i,n)}error(s,i,n){this.show("danger",s,i,n)}info(s,i,n){this.show("info",s,i,n)}dismiss(s){s.style.transform="translateX(120%)",s.style.opacity="0",setTimeout(()=>{s.parentNode&&s.parentNode.removeChild(s)},300)}}const k=new We;class De{constructor(s){this.onSuccess=s,this.drawerEl=null,this.overlayEl=null,this.users=[],this.departments=[],this.subtasks=[]}async render(){this.subtasks=[];try{const e=await L("GET","/users?assignableOnly=true");this.users=e.users||[];const o=new Map;this.users.forEach(l=>{l.departmentId&&l.department&&o.set(l.departmentId,l.department.name)}),this.departments=Array.from(o.entries()).map(([l,v])=>({id:l,name:v}))}catch(e){console.error(e),k.error("Data Loading Failed","Could not load assignees list.")}this.overlayEl||(this.overlayEl=document.createElement("div"),this.overlayEl.id="drawer-overlay",this.overlayEl.style.cssText=`
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
      `,this.overlayEl.addEventListener("click",()=>this.close()),document.body.appendChild(this.overlayEl)),this.drawerEl||(this.drawerEl=document.createElement("div"),this.drawerEl.id="task-create-drawer",document.body.appendChild(this.drawerEl));const s=this.users,i=s.map(e=>{var o;return`<option value="${e.id}">${w(e.firstName)} ${w(e.lastName)} (${w(((o=e.rank)==null?void 0:o.title)||"Employee")})</option>`}).join(""),n=this.departments.map(e=>`<option value="${e.id}">${w(e.name)}</option>`).join("");window.innerWidth<=768?this.drawerEl.innerHTML=`
        <div style="display:flex; flex-direction:column; height:100%; width: 100%; background: #fff; padding: 24px; padding-bottom: 0; position: relative;">
          <!-- Drag Handle -->
          <div style="width: 48px; height: 5px; background: #E5E7EB; border-radius: 3px; margin: 0 auto 20px auto; flex-shrink: 0;"></div>
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-shrink: 0;">
            <h2 style="font-size: 20px; font-weight: 700; color: var(--text-primary);">New Task</h2>
            <button id="close-drawer-btn" style="background: var(--sidebar-bg); border: none; width: 32px; height: 32px; min-width: 32px; min-height: 32px; padding: 0; aspect-ratio: 1; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-secondary); flex-shrink: 0; box-sizing: border-box;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div id="drawer-error-alert" style="display: none; padding: 12px; background-color: rgba(220, 38, 38, 0.1); color: var(--status-danger); font-size: 13px; font-weight: 500; border-radius: var(--radius-md); margin-bottom: 16px;"></div>

          <form id="drawer-task-form" style="display: flex; flex-direction: column; gap: 24px; flex: 1; overflow-y: auto; padding-bottom: 100px;">
            <!-- Task Title -->
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <label class="small-text" style="font-size: 10px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.05em; text-transform: uppercase;">Task Title</label>
              <input type="text" id="task-title" required maxlength="100" placeholder="What needs to be done?" style="padding: 16px; border: none; border-radius: 16px; font-size: 16px; background-color: var(--sidebar-bg); color: var(--text-primary); outline: none; font-weight: 500;" />
            </div>

            <!-- Description -->
            <textarea id="task-desc" required maxlength="2000" placeholder="Description (Optional)" style="padding: 16px; border: none; border-radius: 16px; font-size: 14px; background-color: var(--sidebar-bg); color: var(--text-primary); outline: none; resize: none; height: 80px;"></textarea>

            <!-- Subtasks Checklist -->
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <label class="small-text" style="font-size: 10px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.05em; text-transform: uppercase;">Subtasks Checklist</label>
              <div id="mobile-subtasks-list" style="display: flex; flex-direction: column; gap: 8px;"></div>
              <div style="display: flex; gap: 8px;">
                <input type="text" id="mobile-new-subtask" placeholder="Add a subtask..." style="flex: 1; padding: 12px; border: none; border-radius: 12px; font-size: 14px; background-color: var(--sidebar-bg); color: var(--text-primary); outline: none;" />
                <button type="button" id="mobile-add-subtask-btn" style="background: var(--bg-secondary); border: none; border-radius: 12px; padding: 0 16px; font-weight: 600; color: var(--text-primary); cursor: pointer;">Add</button>
              </div>
            </div>

            <!-- Assign To -->
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <label class="small-text" style="font-size: 10px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.05em; text-transform: uppercase;">Assign To</label>
              <div style="display: flex; gap: 16px; overflow-x: auto; padding-bottom: 8px; scrollbar-width: none;">
                ${s.map(e=>`
                  <div class="mobile-assignee-opt" data-id="${e.id}" style="display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; flex-shrink: 0;">
                    <div style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid transparent; padding: 2px; transition: all 0.2s;">
                      <img src="/avatars/user-${e.id}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block;" />
                      <div style="width: 100%; height: 100%; border-radius: 50%; background: var(--sidebar-bg); color: var(--text-primary); display: none; align-items: center; justify-content: center; font-size: 16px; font-weight: 700;">
                        ${w(e.firstName[0])}
                      </div>
                    </div>
                    <span style="font-size: 11px; font-weight: 500; color: var(--text-secondary);">${w(e.firstName)}</span>
                  </div>
                `).join("")}
              </div>
              <input type="hidden" id="task-assignee" required />
            </div>

            <!-- Priority -->
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <label class="small-text" style="font-size: 10px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.05em; text-transform: uppercase;">Priority</label>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <div class="mobile-priority-opt active" data-val="Medium" style="padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; background: #E0E7FF; color: #4338CA; cursor: pointer;">Medium</div>
                <div class="mobile-priority-opt" data-val="Low" style="padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; background: var(--sidebar-bg); color: var(--text-secondary); cursor: pointer;">Low</div>
                <div class="mobile-priority-opt" data-val="High" style="padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; background: var(--sidebar-bg); color: var(--text-secondary); cursor: pointer;">High</div>
                <div class="mobile-priority-opt" data-val="Critical" style="padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; background: var(--sidebar-bg); color: var(--text-secondary); cursor: pointer;">Critical</div>
              </div>
              <input type="hidden" id="task-priority" value="Medium" />
            </div>

            <!-- Due Date -->
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <label class="small-text" style="font-size: 10px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.05em; text-transform: uppercase;">Due</label>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <div class="mobile-due-opt active" data-offset="0" style="padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; background: #E0E7FF; color: #4338CA; cursor: pointer;">Today</div>
                <div class="mobile-due-opt" data-offset="1" style="padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; background: var(--sidebar-bg); color: var(--text-secondary); cursor: pointer;">Tomorrow</div>
                <div class="mobile-due-opt" data-offset="7" style="padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; background: var(--sidebar-bg); color: var(--text-secondary); cursor: pointer;">Next week</div>
              </div>
              <input type="date" id="task-due" value="${new Date().toISOString().split("T")[0]}" required style="margin-top: 8px; padding: 12px; border: none; border-radius: 12px; font-size: 14px; background-color: var(--sidebar-bg); color: var(--text-primary); outline: none; width: 100%; box-sizing: border-box;" />
            </div>

            <input type="hidden" id="task-dept" value="" />
            <input type="checkbox" id="task-recurring" style="display: none;" />
          </form>

          <!-- Fixed Bottom Button -->
          <div style="position: absolute; bottom: 0; left: 0; width: 100%; padding: 16px 24px; background: linear-gradient(to top, rgba(255,255,255,1) 80%, rgba(255,255,255,0)); border-radius: 0 0 32px 32px;">
            <button id="submit-task-btn" style="width: 100%; background: #3B82F6; color: white; padding: 16px; border: none; border-radius: 100px; font-size: 16px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(59,130,246,0.3);">
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
                ${n}
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
      `,this.initListeners()}initListeners(){const s=document.getElementById("drawer-task-form"),i=document.getElementById("close-drawer-btn"),n=document.getElementById("cancel-drawer-btn"),d=document.getElementById("submit-task-btn"),e=document.getElementById("task-assignee"),o=document.getElementById("workload-banner"),l=document.getElementById("task-recurring"),v=document.getElementById("recurring-interval-wrapper");i==null||i.addEventListener("click",()=>this.close()),n==null||n.addEventListener("click",()=>this.close()),l&&v&&l.addEventListener("change",()=>{v.style.display=l.checked?"flex":"none"}),e&&o&&e.addEventListener("change",()=>{var y;const g=Number(e.value),x=this.users.find(m=>m.id===g);if(x){const m=((y=x.rank)==null?void 0:y.title)||"Employee";o.style.display="block",o.style.backgroundColor="rgba(37, 99, 235, 0.05)",o.style.borderColor="rgba(37, 99, 235, 0.2)",o.innerHTML=`
            <strong style="color: var(--text-primary);">Workload awareness:</strong> 
            Assigned to <strong>${x.firstName}</strong> (${m}). 
            Verify availability before assigning critical operations.
          `}});const t=window.innerWidth<=768;if(t){const g=document.getElementById("task-priority");document.querySelectorAll(".mobile-priority-opt").forEach(m=>{m.addEventListener("click",()=>{document.querySelectorAll(".mobile-priority-opt").forEach(f=>{f.classList.remove("active"),f.style.background="var(--sidebar-bg)",f.style.color="var(--text-secondary)"}),m.classList.add("active"),m.style.background="#E0E7FF",m.style.color="#4338CA",g&&(g.value=m.dataset.val)})});const x=document.getElementById("task-due");document.querySelectorAll(".mobile-due-opt").forEach(m=>{m.addEventListener("click",()=>{if(document.querySelectorAll(".mobile-due-opt").forEach(f=>{f.classList.remove("active"),f.style.background="var(--sidebar-bg)",f.style.color="var(--text-secondary)"}),m.classList.add("active"),m.style.background="#E0E7FF",m.style.color="#4338CA",x){const f=parseInt(m.dataset.offset,10),E=new Date;E.setDate(E.getDate()+f),x.value=E.toISOString().split("T")[0]}})}),x&&x.addEventListener("change",()=>{document.querySelectorAll(".mobile-due-opt").forEach(m=>{m.classList.remove("active"),m.style.background="var(--sidebar-bg)",m.style.color="var(--text-secondary)"})});const y=document.getElementById("task-assignee");document.querySelectorAll(".mobile-assignee-opt").forEach(m=>{m.addEventListener("click",()=>{document.querySelectorAll(".mobile-assignee-opt > div").forEach(f=>{f.style.border="2px solid transparent"}),m.firstElementChild.style.border="2px solid #3B82F6",y&&(y.value=m.dataset.id)})})}const u=()=>{const g=t?document.getElementById("mobile-subtasks-list"):document.getElementById("desktop-subtasks-list");g&&(g.innerHTML=this.subtasks.map((x,y)=>`
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: var(--radius-md);">
          <span style="font-size: 13px; color: var(--text-primary);">${w(x)}</span>
          <button type="button" data-index="${y}" class="remove-subtask-btn" style="background: none; border: none; color: var(--status-danger); cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">&times;</button>
        </div>
      `).join(""),g.querySelectorAll(".remove-subtask-btn").forEach(x=>{x.addEventListener("click",y=>{const m=Number(y.currentTarget.dataset.index);this.subtasks.splice(m,1),u()})}))},p=t?document.getElementById("mobile-add-subtask-btn"):document.getElementById("desktop-add-subtask-btn"),c=t?document.getElementById("mobile-new-subtask"):document.getElementById("desktop-new-subtask");p&&c&&(p.addEventListener("click",()=>{const g=c.value.trim();g&&(this.subtasks.push(g),c.value="",u())}),c.addEventListener("keypress",g=>{g.key==="Enter"&&(g.preventDefault(),p.click())})),u(),d==null||d.addEventListener("click",()=>{if(t){const g=document.getElementById("task-assignee");if(!g||!g.value){const x=document.getElementById("drawer-error-alert");x&&(x.innerText="Please assign someone by tapping an avatar.",x.style.display="block");return}}s==null||s.dispatchEvent(new Event("submit",{cancelable:!0}))}),s==null||s.addEventListener("submit",async g=>{g.preventDefault();const x=document.getElementById("task-title").value.trim(),y=document.getElementById("task-desc").value.trim(),m=document.getElementById("task-due").value,f=document.getElementById("task-priority").value,E=document.getElementById("task-dept").value,b=document.getElementById("task-assignee").value,T=l?l.checked:!1,h=T&&document.getElementById("task-interval")?document.getElementById("task-interval").value:null,S=window.innerWidth<=768?document.getElementById("mobile-new-subtask"):document.getElementById("desktop-new-subtask");S&&S.value.trim()&&(this.subtasks.push(S.value.trim()),S.value="");const M=document.getElementById("drawer-error-alert");if(M&&(M.style.display="none",M.innerText=""),!x||!y||!m||!b){r("Please populate all mandatory fields.");return}if(x.length>100){r("Task title cannot exceed 100 characters.");return}if(y.length>2e3){r("Description cannot exceed 2000 characters.");return}const P=new Date(m),H=new Date;if(H.setHours(0,0,0,0),P<H){r("Due date cannot be set in the past.");return}const j=new Date;if(j.setFullYear(H.getFullYear()+10),P>j){r("Due date cannot be set further than 10 years in the future.");return}try{d&&(d.disabled=!0,d.innerText="Creating..."),await L("POST","/tasks",{title:x,description:y,dueDate:m,priority:f,departmentId:E?Number(E):null,assigneeIds:[Number(b)],isRecurring:T,recurrenceInterval:h,subtasks:this.subtasks}),k.success("Task Created","Task assigned successfully."),this.close(),this.onSuccess&&this.onSuccess()}catch(B){console.error(B),r(B.message||"Task creation failed."),k.error("Task Creation Failed",B.message||"Check parameters."),d&&(d.disabled=!1,d.innerText="Create Task")}});function r(g){const x=document.getElementById("drawer-error-alert");x&&(x.innerText=g,x.style.display="block",x.scrollIntoView({behavior:"smooth",block:"start"}))}}open(){this.render().then(()=>{this.overlayEl.style.pointerEvents="auto",this.overlayEl.style.opacity="1",this.drawerEl.classList.add("open")})}close(){this.overlayEl&&(this.overlayEl.style.opacity="0",this.overlayEl.style.pointerEvents="none"),this.drawerEl&&this.drawerEl.classList.remove("open")}}let Me=[],ce=null,Ae=null,Ne=[],V=localStorage.getItem("tascorr_task_tab")||"assigned",pe=localStorage.getItem("tascorr_show_completed")==="true";function _e(){return`
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
              <input type="checkbox" id="task-show-completed" ${pe?"checked":""} style="width: 16px; height: 16px; accent-color: var(--accent-navy-primary); cursor: pointer;" />
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
  `}async function Ye(){if(!document.getElementById("task-items-container"))return;try{Ne=(await L("GET","/users")).users||[]}catch(p){console.error(p)}Ae=new De(()=>{X()});const s=document.getElementById("workspace-create-task-btn"),i=document.getElementById("workspace-toggle-filters-btn"),n=document.getElementById("tasks-filter-bar"),d=document.getElementById("tab-assigned"),e=document.getElementById("tab-delegated"),o=document.getElementById("task-show-completed"),l=p=>{V=p,localStorage.setItem("tascorr_task_tab",p),[d,e].forEach(r=>{r&&(r.style.background="transparent",r.style.color="var(--text-secondary)",r.style.boxShadow="none",r.classList.remove("active"))});const c=p==="assigned"?d:e;c&&(c.style.background="var(--bg-primary)",c.style.color="var(--text-primary)",c.style.boxShadow="0 2px 4px rgba(0,0,0,0.05)",c.classList.add("active")),ae()};d==null||d.addEventListener("click",()=>l("assigned")),e==null||e.addEventListener("click",()=>l("delegated")),o==null||o.addEventListener("change",p=>{pe=p.target.checked,localStorage.setItem("tascorr_show_completed",pe),ae()}),s==null||s.addEventListener("click",()=>{Ae.open()}),i==null||i.addEventListener("click",()=>{n&&(n.style.display==="none"?(n.style.display="flex",i.classList.add("active"),i.style.color="var(--accent-navy-primary)"):(n.style.display="none",i.classList.remove("active"),i.style.color="var(--text-primary)"))});const v=document.getElementById("task-search-input"),t=document.getElementById("task-status-filter"),u=document.getElementById("task-priority-filter");[v,t,u].forEach(p=>{p==null||p.addEventListener("input",()=>{ae()})}),await X()}async function X(){const a=document.getElementById("task-items-container");if(a)try{Me=(await L("GET","/tasks")).tasks||[],ae()}catch(s){console.error(s),a.innerHTML=`<div style="padding: 24px; text-align: center; color: var(--status-danger);">Error fetching tasks: ${s.message}</div>`}}function ae(){var o,l,v;const a=document.getElementById("task-items-container");if(!a)return;const s=((o=document.getElementById("task-search-input"))==null?void 0:o.value.toLowerCase())||"",i=((l=document.getElementById("task-status-filter"))==null?void 0:l.value)||"ALL",n=((v=document.getElementById("task-priority-filter"))==null?void 0:v.value)||"ALL",d=$.currentUser,e=Me.filter(t=>{var x;let u=!0;if(d){const y=(x=t.assignments)==null?void 0:x.some(f=>f.userId===d.id),m=t.createdById===d.id&&!y;V==="assigned"?u=y:V==="delegated"&&(u=m)}const p=t.title.toLowerCase().includes(s)||t.description.toLowerCase().includes(s),c=i==="ALL"||t.status===i,r=n==="ALL"||t.priority===n;let g=!0;return t.status==="Completed"&&i!=="Completed"&&(g=pe),u&&p&&c&&r&&g});if(e.length===0){a.innerHTML=`
      <div style="padding: 48px 24px; text-align: center; color: var(--text-secondary); display: flex; flex-direction: column; gap: 8px;">
        <p class="body-text" style="font-weight: 600;">No tasks found.</p>
        <p class="small-text">Clear filters or create a new task workspace.</p>
      </div>
    `;return}a.innerHTML=e.map(t=>{var I,S,M,P,H;const u=ce&&ce.id===t.id,p=u?"border: 2px solid var(--accent-navy-primary);":"border: 1px solid var(--border-neutral);",r={High:"#DC2626",Critical:"#DC2626",Medium:"#D97706",Low:"#10B981"}[t.priority]||"#3B82F6",x={Pending:"#3B82F6","In Progress":"#10B981",Blocked:"#EF4444","Under Review":"#F59E0B",Completed:"#16A34A"}[t.status]||"#3B82F6";let y=((I=t.assignments)==null?void 0:I.length)>0?`${t.assignments[0].user.firstName} ${t.assignments[0].user.lastName}`:"Unassigned",m=((S=t.assignments)==null?void 0:S.length)>0?t.assignments[0].userId:null,f=y!=="Unassigned"?t.assignments[0].user.firstName[0]:"?",E="";m===((M=$.currentUser)==null?void 0:M.id)&&(t.creator?(y=`${t.creator.firstName} ${t.creator.lastName}`,m=t.creator.id,f=t.creator.firstName[0],E="From: "):(y="System",m=null,f="S",E="From: "));const b=((P=t.subtasks)==null?void 0:P.length)||0,T=((H=t.subtasks)==null?void 0:H.filter(j=>j.status==="Completed").length)||0,h=b>0?Math.round(T/b*100):t.status==="Completed"?100:0;return`
      <div class="task-list-item" data-id="${t.id}" style="background: var(--bg-primary); ${p} border-radius: 20px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); margin-bottom: 16px; cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease; ${u?"transform: translateY(-2px); box-shadow: 0 4px 12px rgba(37,99,235,0.15);":""}">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div style="display: flex; gap: 8px; align-items: center;">
            <span style="color: ${r}; background: ${r}15; padding: 4px 8px; border-radius: 8px; font-size: 10px; font-weight: 700;">${t.priority}</span>
            <span style="color: var(--text-secondary); font-size: 12px; font-weight: 500;">General</span>
          </div>
          <div style="background: var(--bg-secondary); padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; color: var(--text-secondary); display: flex; align-items: center; gap: 4px;">
            <span style="display: block; width: 6px; height: 6px; border-radius: 50%; background: ${x};"></span> ${t.status}
          </div>
        </div>
        <h4 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">${w(t.title)}</h4>
        <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 16px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${w(t.description)}</p>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${b>0?"8px":"0"};">
          ${b>0?`
          <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-secondary);">
            <input type="radio" checked style="accent-color: var(--text-primary); pointer-events: none;" /> ${T}/${b} subtasks
          </div>
          <span style="font-size: 11px; color: var(--text-secondary);">${h}%</span>
          `:"<div></div>"}
        </div>
        ${b>0?`
        <div style="width: 100%; height: 4px; background: var(--bg-secondary); border-radius: 2px; margin-bottom: 16px; overflow: hidden;">
          <div style="height: 100%; width: ${h}%; background: var(--text-primary); border-radius: 2px;"></div>
        </div>
        `:""}

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border-neutral); padding-top: 12px; margin-top: ${b>0?"0":"16px"};">
          <div style="display: flex; align-items: center; gap: 8px;">
            ${m?`<img src="/avatars/user-${m}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;" />`:""}
            <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--sidebar-bg); color: var(--text-primary); display: ${m?"none":"flex"}; align-items: center; justify-content: center; font-size: 10px; font-weight: 700;">${f}</div>
            <span style="font-size: 11px; color: var(--text-secondary); font-weight: 500;">${E}${w(y)}</span>
          </div>
          <span class="small-text" style="color: var(--text-secondary); font-size: 10px;">
            ${new Date(t.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    `}).join(""),a.querySelectorAll(".task-list-item").forEach(t=>{t.addEventListener("click",async()=>{const u=Number(t.dataset.id);await W(u);const p=document.getElementById("tasks-workspace-container");p&&p.classList.add("task-selected"),ae()})})}async function W(a){var i,n,d,e,o,l,v,t,u,p;const s=document.getElementById("task-details-container");if(s){s.innerHTML='<div style="margin: auto; color: var(--text-secondary);">Loading task details...</div>';try{ce=(await L("GET",`/tasks/${a}`)).task;const r=ce,x={Pending:"status-info","In Progress":"status-info",Blocked:"status-danger","Under Review":"status-warning",Completed:"status-success"}[r.status]||"status-info",y=(i=r.assignments)==null?void 0:i.find(z=>z.isActive),m=y?`${y.user.firstName} ${y.user.lastName}`:"Unassigned",f=y?y.userId:null,E=y?y.user.firstName[0]:"?",b=$.isAdmin(),T=r.createdById===((n=$.currentUser)==null?void 0:n.id),h=y&&y.userId===((d=$.currentUser)==null?void 0:d.id),I=b||T,S=((e=r.subtasks)==null?void 0:e.length)>0?r.subtasks.map(z=>{const R=z.status==="Completed"?"checked":"";return`
            <label style="display: flex; align-items: center; gap: 10px; font-size: 13px; cursor: pointer; ${z.status==="Completed"?"text-decoration: line-through; color: var(--text-secondary);":""}">
              <input type="checkbox" class="subtask-chk" data-sid="${z.id}" ${R} style="accent-color: var(--accent-navy-primary);" />
              <span>${w(z.title)}</span>
            </label>
          `}).join(""):'<p class="small-text" style="color: var(--text-secondary);">No subtask checklist items defined.</p>',M=(o=r.blockers)==null?void 0:o.find(z=>!z.resolvedAt),P=r.status==="Completed",H=((l=$.currentUser)==null?void 0:l.rankLevel)<=4&&((v=$.currentUser)==null?void 0:v.rankLevel)>0,j=T||b||H;let B="";P||((h||j)&&(B+=`
          <div style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
            <label class="small-text" style="font-weight:600;">Update Task Status</label>
            <select id="task-status-update" style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-primary);">
              <option value="Pending" ${r.status==="Pending"?"selected":""}>Pending</option>
              <option value="In Progress" ${r.status==="In Progress"?"selected":""}>In Progress</option>
              <option value="Under Review" ${r.status==="Under Review"?"selected":""}>${j?"Under Review":"Request Completion (Under Review)"}</option>
              ${j?`<option value="Completed" ${r.status==="Completed"?"selected":""}>Completed (Close Task)</option>`:""}
            </select>
          </div>
        `),h&&!M&&(B+=`
          <button id="flag-blocker-btn" style="padding: 10px; background-color: transparent; border: 1px solid var(--status-danger); color: var(--status-danger); border-radius: var(--radius-md); font-weight: 600; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 6px;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:var(--status-danger);"></span> Flag Blocker
          </button>
        `),(T||b)&&(B+=`
          <button id="reassign-task-btn" style="padding: 10px; background-color: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-weight: 600; cursor: pointer; font-size: 13px;">
            Reassign Task
          </button>
          <button id="edit-task-btn" style="padding: 10px; background-color: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-weight: 600; cursor: pointer; font-size: 13px;">
            Edit Task
          </button>
        `),T&&(B+=`
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
          <span class="pill-badge ${x}"><span class="badge-dot"></span>${w(r.status)}</span>
        </div>
        <h2 class="section-title" style="font-size: 20px; line-height: 1.3;">${w(r.title)}</h2>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px;">
          <div class="pill-badge status-info" style="font-size: 11px; display: flex; align-items: center; gap: 6px; padding-left: 6px;">
            ${f?`
              <img src="/avatars/user-${f}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width:16px;height:16px;border-radius:50%;object-fit:cover;" />
              <div style="width:16px;height:16px;border-radius:50%;background:var(--accent-navy-primary);color:#fff;display:none;align-items:center;justify-content:center;font-size:8px;font-weight:bold;margin-left:-2px;">${w(E)}</div>
            `:""}
            Assigned to: ${w(m)}
          </div>
          <div class="pill-badge" style="font-size: 11px; display: flex; align-items: center; gap: 6px; padding-left: 6px; background-color: var(--bg-secondary); border: 1px solid var(--border-neutral); color: var(--text-secondary);">
            Assigned by: ${r.creator?w(r.creator.firstName+" "+r.creator.lastName):"System"}
          </div>
          <div class="pill-badge status-danger" style="font-size: 11px;">${w(r.priority)} Priority</div>
          <div class="pill-badge status-warning" style="font-size: 11px;">Due: ${new Date(r.dueDate).toLocaleDateString()}</div>
        </div>
      </div>

      <!-- Detail Contents -->
      <div style="flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 24px;">
        <!-- Blocker warning banner -->
        ${M?`
          <div style="padding: 16px; background-color: rgba(220, 38, 38, 0.08); border-left: 4px solid var(--status-danger); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 8px;">
            <strong class="data-number" style="color: var(--status-danger);">Task is Blocked</strong>
            <p class="small-text" style="color: var(--text-primary); margin:0;">${w(M.description)}</p>
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
          <p class="body-text" style="color: var(--text-primary);">${w(r.description)}</p>
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
            ${Ne.map(z=>`<option value="${z.id}">${z.firstName} ${z.lastName}</option>`).join("")}
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
            ${((t=r.comments)==null?void 0:t.length)>0?r.comments.map(z=>`
                  <div style="background-color: var(--bg-secondary); padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border-neutral);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                      <span class="small-text" style="font-weight: 600; color: var(--text-primary);">${z.author?w(z.author.firstName+" "+z.author.lastName):"Unknown User"}</span>
                      <span class="small-text" style="font-size:10px;">${new Date(z.createdAt).toLocaleString()}</span>
                    </div>
                    <p class="body-text" style="font-size: 12px; color: var(--text-primary); margin:0;">${w(z.content)}</p>
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
      <div class="mobile-only" style="display:flex; flex-direction:column; height:100%; width: 100%; background: #fff; position: relative; border-radius: 32px 32px 0 0; overflow: hidden;">
        
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
          <h2 style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; line-height: 1.2;">${w(r.title)}</h2>
          <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 24px;">${w(r.description)}</p>

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
          <div style="background: #F9FAFB; border-radius: 16px; padding: 12px; display: flex; align-items: center; gap: 12px; margin-bottom: 24px; border: 1px solid var(--border-neutral);">
            ${f?`<img src="/avatars/user-${f}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />`:""}
            <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--sidebar-bg); color: var(--text-primary); display: ${f?"none":"flex"}; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">${E}</div>
            <div style="display: flex; flex-direction: column;">
              <span style="font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Assigned To</span>
              <span style="font-size: 14px; font-weight: 600; color: var(--text-primary);">${w(m)}</span>
            </div>
          </div>

          <!-- Subtasks -->
          <div>
            <h3 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 16px;">Subtasks</h3>
            <div style="display: flex; flex-direction: column; gap: 16px;">
              ${((p=r.subtasks)==null?void 0:p.length)>0?r.subtasks.map(z=>{const R=z.status==="Completed";return`
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div class="mobile-subtask-toggle" data-sid="${z.id}" data-done="${R}" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid ${R?"#3B82F6":"#D1D5DB"}; background: ${R?"#3B82F6":"transparent"}; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;">
                      ${R?'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>':""}
                    </div>
                    <span style="font-size: 14px; color: ${R?"#9CA3AF":"var(--text-primary)"}; text-decoration: ${R?"line-through":"none"};">${w(z.title)}</span>
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
            <input type="text" id="edit-task-title" value="${w(r.title)}" class="tascorr-input" />
          </div>
          <div class="form-group">
            <label class="small-text">Description</label>
            <textarea id="edit-task-desc" class="tascorr-input" rows="4">${w(r.description)}</textarea>
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
    `;s.innerHTML+=U,setTimeout(()=>{const z=s.querySelector(".mobile-only");z&&(z.style.transform="translateY(100%)",z.offsetWidth,z.style.transition="transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",z.style.transform="translateY(0)")},10),Ze(r)}catch(c){console.error(c),s.innerHTML=`<div style="margin: auto; color: var(--status-danger);">Failed to fetch task details: ${c.message}</div>`}}}function Ze(a){var m,f,E,b,T;(m=document.getElementById("mobile-task-detail-close"))==null||m.addEventListener("click",()=>{const h=document.getElementById("tasks-workspace-container");h&&h.classList.remove("task-selected")}),(f=document.getElementById("task-detail-back-btn"))==null||f.addEventListener("click",()=>{const h=document.getElementById("tasks-workspace-container");h&&h.classList.remove("task-selected")}),(E=document.getElementById("mobile-mark-complete-btn"))==null||E.addEventListener("click",async()=>{try{if(await L("PATCH",`/tasks/${a.id}/status`,{status:"Completed"}),a.subtasks&&a.subtasks.length>0)for(const h of a.subtasks)h.status!=="Completed"&&await L("PATCH",`/tasks/${a.id}/subtasks/${h.id}`,{status:"Completed"});W(a.id),ae()}catch(h){alert(h.message)}});const s=async()=>{var h;if(confirm("Are you sure you want to permanently delete this task? All dependencies, assignments, comments, and subtasks will be lost."))try{await L("DELETE",`/tasks/${a.id}`),k.success("Task Deleted","Task was deleted successfully.");const I=document.getElementById("task-details-container");I&&(I.innerHTML=`
          <div style="padding: 32px; text-align: center; color: var(--text-secondary); margin: auto;">
            Select a task item to view full operational details.
          </div>
        `),(h=document.getElementById("tasks-workspace-container"))==null||h.classList.remove("task-selected"),await X()}catch(I){k.error("Deletion Failed",I.message)}};(b=document.getElementById("delete-task-btn"))==null||b.addEventListener("click",s),(T=document.getElementById("mobile-delete-task-btn"))==null||T.addEventListener("click",s);const i=document.getElementById("task-status-update");i==null||i.addEventListener("change",async()=>{const h=i.value;try{await L("PATCH",`/tasks/${a.id}/status`,{status:h}),k.success("Status Updated",`Task set to ${h}.`),await W(a.id),X()}catch(I){k.error("Update Failed",I.message),i.value=a.status}}),document.querySelectorAll(".subtask-chk").forEach(h=>{h.addEventListener("change",async()=>{const I=Number(h.dataset.sid),S=h.checked,M=S?"Completed":"Pending";try{await L("PATCH",`/tasks/${a.id}/subtasks/${I}`,{status:M}),k.success("Subtask Updated",`Subtask marked as ${M}.`),await W(a.id)}catch(P){k.error("Update Failed",P.message),h.checked=!S}})}),document.querySelectorAll(".mobile-subtask-toggle").forEach(h=>{h.addEventListener("click",async()=>{const I=Number(h.dataset.sid),M=h.dataset.done==="true"?"Pending":"Completed";try{await L("PATCH",`/tasks/${a.id}/subtasks/${I}`,{status:M}),k.success("Subtask Updated",`Subtask marked as ${M}.`),await W(a.id)}catch(P){k.error("Update Failed",P.message)}})});const n=document.getElementById("flag-blocker-btn"),d=document.getElementById("blocker-report-form"),e=document.getElementById("submit-blocker-btn"),o=document.getElementById("cancel-blocker-btn");n==null||n.addEventListener("click",()=>{d.style.display="flex"}),o==null||o.addEventListener("click",()=>{d.style.display="none"}),e==null||e.addEventListener("click",async()=>{const h=document.getElementById("blocker-desc").value.trim();if(!h){k.warning("Validation Check","Blocker explanation content is mandatory.");return}try{await L("POST",`/tasks/${a.id}/blockers`,{description:h}),k.success("Blocker Logged","Task flagged as blocked."),await W(a.id),X()}catch(I){k.error("Submission Failed",I.message)}});const l=document.getElementById("resolve-blocker-btn");l==null||l.addEventListener("click",async()=>{var S,M;const h=Number(l.dataset.bid),I=(M=(S=document.getElementById("blocker-resolution-text"))==null?void 0:S.value)==null?void 0:M.trim();if(!I){k.warning("Validation","Resolution comment is mandatory.");return}try{await L("PATCH",`/tasks/${a.id}/blockers/${h}/resolve`,{resolutionComment:I}),k.success("Blocker Resolved","Task is back in progress."),await W(a.id),X()}catch(P){k.error("Resolution Failed",P.message)}});const v=document.getElementById("edit-task-btn"),t=document.getElementById("edit-task-modal"),u=document.getElementById("cancel-edit-task"),p=document.getElementById("save-edit-task");v==null||v.addEventListener("click",()=>{t.style.display="flex"}),u==null||u.addEventListener("click",()=>{t.style.display="none"}),p==null||p.addEventListener("click",async()=>{const h=document.getElementById("edit-task-title").value.trim(),I=document.getElementById("edit-task-desc").value.trim(),S=document.getElementById("edit-task-due").value,M=document.getElementById("edit-task-priority").value;if(!h||!I||!S){k.warning("Validation Check","Title, description, and due date are mandatory.");return}try{await L("PATCH",`/tasks/${a.id}`,{title:h,description:I,dueDate:S,priority:M}),k.success("Task Updated","Task details have been successfully modified."),t.style.display="none",await W(a.id),X()}catch(P){k.error("Update Failed",P.message)}});const c=document.getElementById("reassign-task-btn"),r=document.getElementById("reassignment-form"),g=document.getElementById("submit-reassign-btn"),x=document.getElementById("cancel-reassign-btn");c==null||c.addEventListener("click",()=>{r.style.display="flex"}),x==null||x.addEventListener("click",()=>{r.style.display="none"}),g==null||g.addEventListener("click",async()=>{const h=document.getElementById("reassign-user").value,I=document.getElementById("reassign-reason").value.trim();if(!h||!I){k.warning("Validation Check","New assignee selection and reason parameters are mandatory.");return}try{await L("POST",`/tasks/${a.id}/reassign`,{targetAssigneeId:Number(h),reason:I}),k.success("Task Delegated","Assignee reassignment completed successfully."),await W(a.id),X()}catch(S){k.error("Reassignment Failed",S.message)}});const y=document.getElementById("submit-comment-btn");y==null||y.addEventListener("click",async()=>{const h=document.getElementById("new-comment-text").value.trim();if(h)try{await L("POST",`/tasks/${a.id}/comments`,{content:h}),k.success("Comment Posted","Your message has been appended."),await W(a.id)}catch(I){k.error("Send Failed",I.message)}})}let Q=[],se=[];function Je(){const a=$.isAdmin();return`
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
  `}async function Ke(){const a=document.getElementById("hierarchy-tree-root");if(!a)return;if($.isAdmin()){const i=document.getElementById("add-dept-btn"),n=document.getElementById("create-dept-card"),d=document.getElementById("cancel-dept-btn"),e=document.getElementById("create-dept-form"),o=document.getElementById("edit-dept-modal"),l=document.getElementById("close-edit-dept-modal-btn"),v=document.getElementById("edit-dept-form");i==null||i.addEventListener("click",()=>{n.style.display=n.style.display==="none"?"flex":"none"}),d==null||d.addEventListener("click",()=>{n.style.display="none"}),a.addEventListener("click",async t=>{const u=t.target.closest(".edit-dept-btn"),p=t.target.closest(".delete-dept-btn");if(u){const c=Number(u.dataset.id),r=Q.find(g=>g.id===c);if(r){document.getElementById("edit-dept-id").value=r.id,document.getElementById("edit-dept-name").value=r.name;const g=document.getElementById("edit-dept-head");g&&(g.innerHTML='<option value="">No Head Assigned</option>'+se.map(x=>{var y;return`<option value="${x.id}">${w(x.firstName)} ${w(x.lastName)} (${w(((y=x.rank)==null?void 0:y.title)||"Employee")})</option>`}).join(""),g.value=r.headUserId||""),o&&(o.style.display="flex")}}if(p){const c=Number(p.dataset.id),r=Q.find(g=>g.id===c);if(r&&confirm(`Are you sure you want to delete the "${r.name}" department? All members will be unassigned.`))try{await L("DELETE",`/departments/${c}`),k.success("Department Deleted","Department node removed."),await oe()}catch(g){console.error(g),k.error("Deletion Failed",g.message||"Could not delete department.")}}}),l==null||l.addEventListener("click",()=>{o&&(o.style.display="none")}),v==null||v.addEventListener("submit",async t=>{t.preventDefault();const u=Number(document.getElementById("edit-dept-id").value),p=document.getElementById("edit-dept-name").value.trim(),c=document.getElementById("edit-dept-head").value,r=document.getElementById("edit-dept-error-alert");if(r&&(r.style.display="none",r.innerText=""),!p||p.length<2){r&&(r.innerText="Department name must be at least 2 characters.",r.style.display="block");return}const g=v.querySelector('button[type="submit"]');try{g&&(g.disabled=!0,g.innerText="Saving..."),await L("PATCH",`/departments/${u}`,{name:p,headUserId:c?Number(c):null}),k.success("Department Updated","Department details saved successfully."),o&&(o.style.display="none"),await oe()}catch(x){console.error(x),r&&(r.innerText=x.message||"Failed to update department.",r.style.display="block")}finally{g&&(g.disabled=!1,g.innerText="Save Changes")}}),e==null||e.addEventListener("submit",async t=>{t.preventDefault();const u=document.getElementById("dept-name").value.trim(),p=document.getElementById("dept-head").value,c=document.getElementById("dept-error-alert");if(c&&(c.style.display="none",c.innerText=""),!u||u.length<2){c&&(c.innerText="Department name must be at least 2 characters.",c.style.display="block");return}const r=e.querySelector('button[type="submit"]');try{r&&(r.disabled=!0,r.innerText="Saving..."),await L("POST","/departments",{name:u,headUserId:p?Number(p):null}),k.success("Department Created","Department node onboarded successfully."),n.style.display="none",e.reset(),await oe()}catch(g){console.error(g),c&&(c.innerText=g.message||"Failed to create department node.",c.style.display="block")}finally{r&&(r.disabled=!1,r.innerText="Save Department")}})}await oe()}async function oe(){const a=document.getElementById("hierarchy-tree-root");if(!a)return;const s=$.isAdmin();try{const[i,n]=await Promise.all([L("GET","/departments"),L("GET","/users")]);if(Q=i.departments||[],se=n.users||[],Xe(),s){const d=document.getElementById("dept-head");d&&(d.innerHTML='<option value="">No Head Assigned</option>'+se.map(e=>{var o;return`<option value="${e.id}">${w(e.firstName)} ${w(e.lastName)} (${w(((o=e.rank)==null?void 0:o.title)||"Employee")})</option>`}).join(""))}}catch(i){console.error(i),a.innerHTML=`<div style="color:var(--status-danger)">Error loading structure: ${w(i.message)}</div>`}}function Xe(){var e;const a=document.getElementById("hierarchy-tree-root");if(!a)return;const s=$.isAdmin();let i="";const n=se.filter(o=>{var l;return((l=o.rank)==null?void 0:l.level)===1&&o.status==="active"}),d=n.length>0?n[0]:null;if(d){const o=`/avatars/user-${d.id}.jpg?t=${Date.now()}`,l=`${d.firstName[0]}${d.lastName[0]}`;i+=`
      <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 32px;">
        <!-- Root Card -->
        <div class="org-node" style="position: relative; z-index: 2;">
          <div style="width: 48px; height: 48px; border-radius: 50%; overflow: hidden; margin: 0 auto 12px auto; background-color: var(--accent-navy-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <img src="${o}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 100%; height: 100%; object-fit: cover; display: none;" />
            <div style="display: flex;">${w(l)}</div>
          </div>
          <div style="font-weight: 600; font-size: 14px; text-align: center; color: var(--text-primary); margin-bottom: 4px;">
            ${w(d.firstName)} ${w(d.lastName)}
          </div>
          <div style="font-size: 12px; color: var(--text-secondary); text-align: center;">
            ${w(((e=d.rank)==null?void 0:e.title)||"Top Executive")}
          </div>
        </div>
        
        <!-- Stem down from Root -->
        ${Q.length>0?'<div style="width: 2px; height: 32px; background-color: var(--tree-line-color);"></div>':""}
      </div>
    `}Q.length>0?i+=`
      <div style="display: flex; gap: 32px; justify-content: center; align-items: flex-start; position: relative;">

        ${Q.map((o,l)=>{var c;const v=o.headUser,t=v?`${v.firstName} ${v.lastName}`:"Vacant",u=v?((c=v.rank)==null?void 0:c.title)||"VP / Department Head":"No Head Assigned",p=se.filter(r=>r.departmentId===o.id&&r.id!==(v==null?void 0:v.id));return`
            <div style="display: flex; flex-direction: column; align-items: center; position: relative; min-width: 200px;">
              
              <!-- Horizontal connector line segments bridging the gap -->
              ${Q.length>1?`
                <div style="position: absolute; top: 0; height: 2px; background-color: var(--tree-line-color);
                  left: ${l===0?"50%":"-16px"};
                  right: ${l===Q.length-1?"50%":"-16px"};"></div>
              `:""}

              <!-- Vertical drop line from horizontal connector -->
              <div style="width: 2px; height: 16px; background-color: var(--tree-line-color); z-index: 2;"></div>
              
              <!-- Department Head Card -->
              <div class="widget-card" style="padding: 16px 20px; text-align: center; border: 1px solid var(--border-neutral); max-width: 240px; min-width: 180px; background-color: var(--bg-secondary); margin-top: -2px; position: relative; z-index: 3;">
                ${s?`
                  <div style="position: absolute; top: 6px; right: 8px; display: flex; gap: 6px; z-index: 5;">
                    <button class="edit-dept-btn" data-id="${o.id}" title="Edit Department" style="background: none; border: none; cursor: pointer; color: var(--text-secondary); padding: 2px; display: flex; align-items: center;">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 13px; height: 13px;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button class="delete-dept-btn" data-id="${o.id}" title="Delete Department" style="background: none; border: none; cursor: pointer; color: var(--status-danger); padding: 2px; display: flex; align-items: center;">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 13px; height: 13px;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                `:""}
                <span class="small-text" style="font-weight: 700; color: var(--accent-navy-primary); text-transform: uppercase; font-size: 10px; display:block; margin-bottom: 8px; padding-right: 28px; text-align: left;">${w(o.name)}</span>
                <div style="display:flex;align-items:center;gap:12px;text-align:left;">
                  <img src="/avatars/user-${v==null?void 0:v.id}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width:36px;height:36px;border-radius:50%;object-fit:cover;display:${v?"block":"none"};" />
                  <div style="width:36px;height:36px;border-radius:50%;background:var(--accent-navy-primary);color:#fff;display:${v?"none":"flex"};align-items:center;justify-content:center;font-weight:bold;font-size:14px;flex-shrink:0;">${w(t[0]||"?")}</div>
                  <div>
                    <h4 class="card-title" style="font-size: 13px; font-weight: 600; text-align: left;">${w(t)}</h4>
                    <p class="small-text" style="color: var(--text-secondary); font-size:11px; text-align: left;">${w(u)}</p>
                  </div>
                </div>
              </div>

              <!-- Connector Line to Department Members -->
              ${p.length>0?`
                <div style="width: 2px; height: 24px; background-color: var(--tree-line-color);"></div>
                
                <!-- Members vertical tree stack -->
                <div style="display: flex; flex-direction: column; gap: 12px; align-items: center; width: 100%;">
                  ${p.map(r=>{var g;return`
                    <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
                      <div style="width: 2px; height: 12px; background-color: var(--tree-line-color);"></div>
                      <div style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-sm); text-align: left; background-color: var(--bg-primary); min-width: 140px; max-width: 200px; display: flex; align-items: center; gap: 8px;">
                        <img src="/avatars/user-${r.id}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width:24px;height:24px;border-radius:50%;object-fit:cover;display:block;" />
                        <div style="width:24px;height:24px;border-radius:50%;background:var(--accent-navy-primary);color:#fff;display:none;align-items:center;justify-content:center;font-weight:bold;font-size:10px;flex-shrink:0;">${w(r.firstName[0]||"?")}</div>
                        <div>
                          <strong class="data-number" style="font-size: 12px; display:block;">${w(r.firstName)} ${w(r.lastName)}</strong>
                          <div class="small-text" style="font-size:10px; margin-top:2px;">${w(((g=r.rank)==null?void 0:g.title)||"Employee")}</div>
                        </div>
                      </div>
                    </div>
                  `}).join("")}
                </div>
              `:""}
            </div>
          `}).join("")}
      </div>
    `:i+='<p class="small-text" style="color:var(--text-secondary)">No departments configured.</p>',a.innerHTML=i}let ue=[],K=[],ve=[];function Qe(){const a=$.isAdmin();return`
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
  `}async function et(){var i,n,d;if(!document.getElementById("employees-table-body"))return;const s=$.isAdmin();if((i=document.getElementById("employee-search"))==null||i.addEventListener("input",fe),(n=document.getElementById("employee-status"))==null||n.addEventListener("input",fe),s){let g=function(y){const m=document.getElementById("employee-error-alert");m&&(m.innerText=y,m.style.display="block")},x=function(y){const m=document.getElementById("rank-error-alert");m&&(m.innerText=y,m.style.display="block")};const e=document.getElementById("add-employee-btn"),o=document.getElementById("add-employee-drawer"),l=document.getElementById("cancel-employee-btn"),v=document.getElementById("create-employee-form"),t=document.getElementById("create-rank-form"),u=document.getElementById("edit-employee-modal"),p=document.getElementById("close-edit-modal-btn"),c=document.getElementById("edit-employee-form");e==null||e.addEventListener("click",()=>{ue.filter(m=>m.status==="active").length>=10&&k.warning("Tier Limit Warning","Your workspace count is at 10 active users. Adding employees requires tier migration support."),o.style.display=o.style.display==="none"?"flex":"none"}),l==null||l.addEventListener("click",()=>{o.style.display="none"}),(d=document.getElementById("employees-table-body"))==null||d.addEventListener("click",async y=>{const m=y.target.closest(".edit-emp-btn");if(m){const E=Number(m.dataset.id),b=ue.find(T=>T.id===E);if(b){document.getElementById("edit-emp-id").value=b.id,document.getElementById("edit-emp-first").value=b.firstName,document.getElementById("edit-emp-last").value=b.lastName;const T=document.getElementById("edit-emp-rank");T&&(T.innerHTML=K.map(S=>`<option value="${S.id}">${w(S.title)} (Level ${S.level})</option>`).join(""),T.value=b.rankId);const h=document.getElementById("edit-emp-dept");h&&(h.innerHTML='<option value="">Unassigned</option>'+ve.map(S=>`<option value="${S.id}">${w(S.name)}</option>`).join(""),h.value=b.departmentId||""),document.getElementById("edit-emp-status").value=b.status;const I=document.getElementById("edit-emp-password");I&&(I.value=""),u&&(u.style.display="flex")}}const f=y.target.closest(".delete-emp-btn");if(f){const E=Number(f.dataset.id),b=f.dataset.name||"this employee";if(!confirm(`Are you sure you want to delete "${b}"? This action will deactivate their account.`))return;try{f.disabled=!0,f.innerText="Deleting...",await L("DELETE",`/users/${E}`),k.success("Employee Deleted",`${b} has been removed from the directory.`),await ee()}catch(T){console.error(T),k.error("Deletion Failed",T.message||"Could not delete employee.")}finally{f.disabled=!1,f.innerText="Delete"}}}),p==null||p.addEventListener("click",()=>{u&&(u.style.display="none")}),c==null||c.addEventListener("submit",async y=>{y.preventDefault();const m=Number(document.getElementById("edit-emp-id").value),f=document.getElementById("edit-emp-first").value.trim(),E=document.getElementById("edit-emp-last").value.trim(),b=Number(document.getElementById("edit-emp-rank").value),T=document.getElementById("edit-emp-dept").value,h=document.getElementById("edit-emp-status").value,I=document.getElementById("edit-emp-password").value;if(!f||!E){k.error("Validation Error","First name and Last name are required.");return}const S={firstName:f,lastName:E,rankId:b,departmentId:T?Number(T):null,status:h};if(I){if(I.length<12||!/[a-z]/.test(I)||!/[A-Z]/.test(I)||!/[0-9]/.test(I)||!/[^a-zA-Z0-9]/.test(I)){k.error("Validation Error","Passwords must be at least 12 characters and meet complexity requirements (mixed case, number, symbol).");return}S.password=I}const M=c.querySelector('button[type="submit"]');try{M&&(M.disabled=!0,M.innerText="Saving..."),await L("PATCH",`/users/${m}`,S),k.success("User Profile Updated","Employee details modified successfully."),u&&(u.style.display="none"),await ee()}catch(P){console.error(P),k.error("Update Failed",P.message||"Check server constraints.")}finally{M&&(M.disabled=!1,M.innerText="Save Changes")}});const r=document.getElementById("rank-list-rows");r==null||r.addEventListener("input",y=>{if(y.target.classList.contains("rank-title-edit-input")){const m=y.target.closest("div"),f=m==null?void 0:m.querySelector(".save-rank-btn");f&&(f.style.display="inline-block")}}),r==null||r.addEventListener("click",async y=>{if(y.target.classList.contains("save-rank-btn")){const m=Number(y.target.dataset.id),f=y.target.closest("div"),E=f==null?void 0:f.querySelector(".rank-title-edit-input"),b=E==null?void 0:E.value.trim();if(!b){k.error("Validation Error","Rank title cannot be empty.");return}try{await L("PATCH",`/users/ranks/${m}`,{title:b}),k.success("Rank Updated","Corporate rank role updated."),await ee()}catch(T){k.error("Update Failed",T.message||"Could not update rank.")}}else if(y.target.classList.contains("delete-rank-btn")){const m=Number(y.target.dataset.id);if(confirm("Are you sure you want to delete this Corporate Rank role?"))try{await L("DELETE",`/users/ranks/${m}`),k.success("Rank Deleted","Corporate rank role deleted successfully."),await ee()}catch(f){k.error("Deletion Failed",f.message||"Could not delete rank.")}}}),v==null||v.addEventListener("submit",async y=>{y.preventDefault();const m=document.getElementById("emp-first").value.trim(),f=document.getElementById("emp-last").value.trim(),E=document.getElementById("emp-email").value.trim(),b=document.getElementById("emp-password").value,T=Number(document.getElementById("emp-rank").value),h=document.getElementById("emp-dept").value;if(!m||m.length<1||m.length>50){g("First name must be between 1 and 50 characters.");return}if(!f||f.length<1||f.length>50){g("Last name must be between 1 and 50 characters.");return}if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(E)){g("Please enter a valid email address format.");return}if(b.length<12||!/[a-z]/.test(b)||!/[A-Z]/.test(b)||!/[0-9]/.test(b)||!/[^a-zA-Z0-9]/.test(b)){g("Temporary passwords must be at least 12 characters long and meet complexity requirements (mixed case, number, symbol).");return}const S=v.querySelector('button[type="submit"]');try{S&&(S.disabled=!0,S.innerText="Creating Account..."),await L("POST","/users",{firstName:m,lastName:f,email:E,password:b,rankId:T,departmentId:h?Number(h):null}),k.success("User Created","Employee profile provisioned successfully."),o.style.display="none",v.reset(),await ee()}catch(M){console.error(M),g(M.message||"Failed to create user account."),k.error("Provisioning Failed",M.message||"Check gate constraints.")}finally{S&&(S.disabled=!1,S.innerText="Create User")}}),t==null||t.addEventListener("submit",async y=>{y.preventDefault();const m=document.getElementById("rank-title-input").value.trim(),f=Number(document.getElementById("rank-level-input").value),E=document.getElementById("rank-error-alert");if(E&&(E.style.display="none",E.innerText=""),!m){x("Rank title is required.");return}if(isNaN(f)||f<0){x("Authority level must be a non-negative number.");return}const b=t.querySelector('button[type="submit"]');try{b&&(b.disabled=!0,b.innerText="Adding..."),await L("POST","/users/ranks",{title:m,level:f}),k.success("Rank Role Created",`Successfully added rank role: "${m}".`),t.reset(),await ee()}catch(T){console.error(T),x(T.message||"Failed to create rank role."),k.error("Rank Creation Failed",T.message||"Verification failed.")}finally{b&&(b.disabled=!1,b.innerText="Add Rank Role")}})}await ee()}async function ee(){const a=document.getElementById("employees-table-body");if(!a)return;const s=$.isAdmin();try{const[i,n,d]=await Promise.all([L("GET","/users"),L("GET","/departments"),L("GET","/users/ranks")]);if(ue=i.users||[],ve=n.departments||[],K=d.ranks||[],K.length===0&&(K=[{id:1,title:"Administrator",level:0},{id:2,title:"Chief Executive",level:1},{id:3,title:"Deputy Chief Executive",level:2},{id:4,title:"Executive / Director",level:3},{id:5,title:"Department Head",level:4},{id:6,title:"Manager",level:5},{id:7,title:"Employee",level:6}]),fe(),s){const e=document.getElementById("emp-rank");e&&(e.innerHTML=K.map(t=>`<option value="${t.id}">${w(t.title)} (Level ${t.level})</option>`).join(""));const o=document.getElementById("emp-dept");o&&(o.innerHTML='<option value="">Unassigned</option>'+ve.map(t=>`<option value="${t.id}">${w(t.name)}</option>`).join(""));const l=document.getElementById("rank-list-container"),v=document.getElementById("rank-list-rows");l&&v&&(K.length>0?(l.style.display="block",v.innerHTML=K.map((t,u)=>`
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; ${u<K.length-1?"border-bottom: 1px solid var(--border-neutral);":""}">
              <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                <span class="small-text" style="width: 80px; font-weight: 700; color: var(--accent-navy-primary);">Level ${t.level}</span>
                <input type="text" class="rank-title-edit-input" data-id="${t.id}" value="${w(t.title)}" style="border: 1px solid transparent; border-radius: var(--radius-sm); background: transparent; color: var(--text-primary); font-size: 13px; font-family: var(--font-text); width: 60%; max-width: 250px; padding: 4px;" />
              </div>
              <div style="display: flex; gap: 12px; align-items: center;">
                <button class="save-rank-btn small-text" data-id="${t.id}" style="background: none; border: none; color: var(--status-success); font-weight: 600; cursor: pointer; display: none; padding: 0;">Save</button>
                <button class="delete-rank-btn small-text" data-id="${t.id}" style="background: none; border: none; color: var(--status-danger); font-weight: 600; cursor: pointer; padding: 0;">Delete</button>
              </div>
            </div>
          `).join("")):l.style.display="none")}}catch(i){console.error(i),a.innerHTML=`<tr><td colspan="6" style="padding:32px; text-align:center; color:var(--status-danger);">Failed to load registry: ${w(i.message)}</td></tr>`}}function fe(){var e,o;const a=document.getElementById("employees-table-body");if(!a)return;const s=((e=document.getElementById("employee-search"))==null?void 0:e.value.toLowerCase())||"",i=((o=document.getElementById("employee-status"))==null?void 0:o.value)||"ALL",n=$.isAdmin(),d=ue.filter(l=>{var p;const t=`${l.firstName} ${l.lastName}`.toLowerCase().includes(s)||l.email.toLowerCase().includes(s)||((p=l.rank)==null?void 0:p.title.toLowerCase().includes(s)),u=i==="ALL"||l.status===i;return t&&u});if(d.length===0){a.innerHTML=`
      <tr>
        <td colspan="6" style="padding: 32px; text-align: center; color: var(--text-secondary);">
          No employees matching filters found.
        </td>
      </tr>
    `;return}a.innerHTML=d.map(l=>{var g,x;const t=l.status!=="active"?'<span class="pill-badge status-danger"><span class="badge-dot"></span>Inactive</span>':'<span class="pill-badge status-success"><span class="badge-dot"></span>Active</span>',u=l.department?w(l.department.name):'<span style="color:var(--text-secondary)">General</span>',p=`${w(l.firstName)} ${w(l.lastName)}`,c=w(((g=l.rank)==null?void 0:g.title)||"Employee"),r=l.rank?l.rank.level:4;return`
      <tr style="border-bottom: 1px solid var(--border-neutral); hover: background-color var(--bg-secondary); transition: background-color 0.15s ease;">
        <td data-label="Full Name" style="padding: 16px; font-weight:600; color:var(--text-primary);">${p}</td>
        <td data-label="Email Address" style="padding: 16px; color:var(--text-secondary);">${w(l.email)}</td>
        <td data-label="Rank Level" style="padding: 16px; color:var(--text-primary); font-weight:500;">${c} <span class="small-text">(Lvl ${r})</span></td>
        <td data-label="Department" style="padding: 16px;">${u}</td>
        <td data-label="Status" style="padding: 16px;">${t}</td>
        <td data-label="Actions" style="padding: 16px; text-align: right;">
          <div style="display: inline-flex; justify-content: flex-end; align-items: center; gap: 12px;">
            <a href="#profile" class="small-text" style="color:var(--accent-navy-primary); font-weight:600; text-decoration:none;" onclick="localStorage.setItem('target_profile_id', ${l.id});">View Profile</a>
            ${n?`<button class="edit-emp-btn small-text" data-id="${l.id}" style="background: none; border: none; color: var(--accent-navy-primary); font-weight: 600; cursor: pointer; padding: 0;">Edit</button>`:""}
            ${n&&l.id!==((x=$.currentUser)==null?void 0:x.id)?`<button class="delete-emp-btn small-text" data-id="${l.id}" data-name="${w(l.firstName)} ${w(l.lastName)}" style="background: none; border: none; color: var(--status-danger); font-weight: 600; cursor: pointer; padding: 0;">Delete</button>`:""}
          </div>
        </td>
      </tr>
    `}).join("")}function tt(){const a=$.currentUser;return`
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
  `}function at(a,s){const i=a.onTimeRate,n=s>0?a.completed/s*100:0,d=Math.min(a.blocked*10,30),e=Math.min(a.overdue*10,20),o=i*.5+n*.3-d-e;return Math.max(0,Math.min(100,Math.round(o)))}async function rt(){var e,o;const a=document.getElementById("reports-loading"),s=document.getElementById("reports-content");if(!s)return;const i=$.currentUser,n=(i==null?void 0:i.rankLevel)??99,d=n<=3;try{const l=[L("GET","/tasks"),L("GET","/departments")];d&&l.push(L("GET","/users"));const v=await Promise.all(l),t=v[0].tasks||[],u=v[1].departments||[];let c=(d?v[2].users||[]:[]).filter(b=>{var T;return((T=b.rank)==null?void 0:T.level)!==0});n>=3&&n<=4&&(i!=null&&i.departmentId)&&(c=c.filter(b=>b.departmentId===i.departmentId));const r=t.filter(b=>b.status==="Completed");let g="N/A";if(r.length>0){const b=r.reduce((h,I)=>h+(new Date(I.updatedAt)-new Date(I.createdAt)),0),T=Math.round(b/r.length/(1e3*60*60));g=T<24?`${T} hrs`:`${Math.round(T/24)} days`}let x="N/A";const y=t.flatMap(b=>(b.blockers||[]).filter(T=>T.resolvedAt));if(y.length>0){const b=y.reduce((h,I)=>h+(new Date(I.resolvedAt)-new Date(I.createdAt)),0),T=Math.round(b/y.length/(1e3*60*60));x=T<24?`${T} hrs`:`${Math.round(T/24)} days`}let m="0%";if(t.length>0){const b=t.filter(T=>{var h;return(h=T.assignments)==null?void 0:h.some(I=>I.reassignedAt!==null)}).length;m=`${Math.round(b/t.length*100)}%`}document.getElementById("kpi-closure-time").innerText=g,document.getElementById("kpi-blocker-time").innerText=x,document.getElementById("kpi-reassign-rate").innerText=m;const f=document.getElementById("sla-chart-list");f&&(u.length===0?f.innerHTML='<p class="small-text" style="text-align: center;">No department data configured.</p>':f.innerHTML=u.map(b=>{const T=t.filter(P=>P.departmentId===b.id),h=T.filter(P=>P.status==="Completed").length,I=T.length>0?Math.round(h/T.length*100):100,S=Math.max(I,4),M=I>=80?"var(--status-success)":I>=60?"var(--status-warning)":"var(--status-danger)";return`
            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
                <span class="data-number">${w(b.name)}</span>
                <span class="small-text" style="font-weight: 600;">${I}% SLA met</span>
              </div>
              <div style="height: 8px; background-color: var(--bg-tertiary); border-radius: var(--radius-sm); overflow: hidden;">
                <div style="width: ${S}%; height: 100%; background-color: ${M}; border-radius: var(--radius-sm); transition: width 0.6s ease;"></div>
              </div>
            </div>
          `}).join(""));const E=document.getElementById("priority-list");if(E){const b=["Critical","High","Medium","Low"];E.innerHTML=b.map(T=>{const h=t.filter(P=>P.priority===T),I=h.filter(P=>P.status==="Completed").length,S=h.length>0?Math.round(I/h.length*100):0;return`
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-neutral);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${{Critical:"var(--status-danger)",High:"var(--status-warning)",Medium:"var(--status-info)",Low:"var(--status-success)"}[T]};"></span>
              <span class="data-number">${T} Priority</span>
            </div>
            <div style="text-align: right;">
              <span class="pill-badge status-info" style="font-size: 11px;">${S}% Rate</span>
              <div class="small-text" style="font-size: 10px; margin-top: 2px;">${I} / ${h.length} completed</div>
            </div>
          </div>
        `}).join("")}if(d&&c.length>0){let M=function(H){const j=document.getElementById("staff-performance-list");if(j){if(H.length===0){j.innerHTML='<p class="small-text" style="text-align: center; padding: 24px;">No staff members match the current filter.</p>';return}j.innerHTML=H.map((B,U)=>{var D,N;const z=B.score>=75?"var(--status-success)":B.score>=50?"var(--status-warning)":"var(--status-danger)",R=B.score>=75?"rgba(34,197,94,0.08)":B.score>=50?"rgba(234,179,8,0.08)":"rgba(239,68,68,0.08)",q=U===0?'<span style="font-size:14px;" title="Top performer">🥇</span>':U===1?'<span style="font-size:14px;" title="Second place">🥈</span>':U===2?'<span style="font-size:14px;" title="Third place">🥉</span>':"",Y=u.find(Z=>Z.id===B.user.departmentId),F=Y?w(Y.name):"Unassigned",C=`
            <div class="desktop-only" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1.5fr; gap: 8px; align-items: center; padding: 14px 16px; border-radius: var(--radius-md); background: var(--bg-primary); border: 1px solid var(--border-neutral); transition: box-shadow 0.15s;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="position: relative; width: 36px; height: 36px; flex-shrink: 0;">
                  <img src="/avatars/user-${B.user.id}.jpg" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" style="width:36px;height:36px;border-radius:50%;object-fit:cover;" />
                  <div style="width:36px;height:36px;border-radius:50%;background:var(--sidebar-bg);display:none;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:var(--text-primary);">${w(B.user.firstName[0])}${w(B.user.lastName[0]||"")}</div>
                </div>
                <div>
                  <div style="font-weight: 600; font-size: 14px; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                    ${w(B.user.firstName)} ${w(B.user.lastName)} ${q}
                  </div>
                  <div class="small-text" style="font-size: 11px;">${w(((D=B.user.rank)==null?void 0:D.title)||"Employee")} · ${F}</div>
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
                    <div style="width:40px;height:40px;border-radius:50%;background:var(--sidebar-bg);display:none;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:var(--text-primary);">${w(B.user.firstName[0])}${w(B.user.lastName[0]||"")}</div>
                  </div>
                  <div>
                    <div style="font-weight: 700; font-size: 15px; color: var(--text-primary);">${w(B.user.firstName)} ${w(B.user.lastName)} ${q}</div>
                    <div class="small-text" style="font-size: 11px;">${w(((N=B.user.rank)==null?void 0:N.title)||"Employee")}</div>
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
          `;return C+A}).join("")}},P=function(){var U,z;const H=parseInt((U=document.getElementById("perf-dept-filter"))==null?void 0:U.value)||null,j=((z=document.getElementById("perf-sort"))==null?void 0:z.value)||"score";let B=[...I];H&&(B=B.filter(R=>R.user.departmentId===H)),B.sort((R,q)=>j==="score"?q.score-R.score:j==="completed"?q.completed-R.completed:j==="ontime"?q.onTimeRate-R.onTimeRate:j==="overdue"?q.overdue-R.overdue:0),M(B)};const b=new Date;b.setHours(0,0,0,0);const T=c.map(H=>{const j=t.filter(F=>{var C;return(C=F.assignments)==null?void 0:C.some(A=>A.userId===H.id&&A.isActive)}),B=j.filter(F=>F.status==="Completed"),U=B.filter(F=>new Date(F.updatedAt)<=new Date(F.dueDate)),z=B.length>0?Math.round(U.length/B.length*100):0;let R="--";if(B.length>0){const F=B.reduce((C,A)=>C+(new Date(A.updatedAt)-new Date(A.createdAt)),0);R=Math.round(F/B.length/(1e3*60*60*24))}const q=j.filter(F=>F.status==="Blocked").length,Y=j.filter(F=>F.status!=="Completed"&&new Date(F.dueDate)<b).length;return{user:H,completed:B.length,total:j.length,onTimeRate:z,avgDays:R,blocked:q,overdue:Y}}),h=Math.max(...T.map(H=>H.completed),1),I=T.map(H=>({...H,score:at(H,h)})),S=document.getElementById("perf-dept-filter");S&&u.forEach(H=>{const j=document.createElement("option");j.value=H.id,j.textContent=H.name,S.appendChild(j)}),P(),(e=document.getElementById("perf-dept-filter"))==null||e.addEventListener("change",P),(o=document.getElementById("perf-sort"))==null||o.addEventListener("change",P)}a&&(a.style.display="none"),s.style.display="flex"}catch(l){console.error(l),a&&(a.innerHTML=`<span style="color:var(--status-danger)">Failed to compute reports: ${w(l.message)}</span>`)}}function st(){const a=$.isAdmin();return`
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
  `}function it(){var l,v,t;const a=document.querySelectorAll(".settings-tab-btn"),s=document.querySelectorAll(".settings-pane");a.forEach(u=>{u.addEventListener("click",()=>{a.forEach(c=>{c.classList.remove("active"),c.style.color="var(--text-secondary)",c.style.fontWeight="500"}),u.classList.add("active"),u.style.color="var(--accent-navy-primary)",u.style.fontWeight="600";const p=u.dataset.tab;s.forEach(c=>{c.style.display=c.id===p?"flex":"none"})})});const i=document.getElementById("profile-first"),n=document.getElementById("profile-last"),d=document.getElementById("profile-email");if($.currentUser&&(i&&(i.value=$.currentUser.firstName||""),n&&(n.value=$.currentUser.lastName||""),d&&(d.value=$.currentUser.email||"")),(l=document.getElementById("profile-update-form"))==null||l.addEventListener("submit",async u=>{u.preventDefault();const p=i.value.trim(),c=n.value.trim();if(!p||!c){k.error("Validation Error","First name and Last name are required.");return}try{const r=await L("PATCH",`/users/${$.currentUser.id}`,{firstName:p,lastName:c});$.currentUser.firstName=r.user.firstName,$.currentUser.lastName=r.user.lastName,localStorage.setItem("tascorr_user",JSON.stringify($.currentUser));const g=document.getElementById("header-user-role");g&&(g.innerText=`${$.currentUser.tenantName||`${$.currentUser.firstName} ${$.currentUser.lastName}`} (${$.currentUser.rankTitle})`),k.success("Profile Saved","Account credentials updated successfully.")}catch(r){k.error("Save Failed",r.message||"An error occurred while saving profile.")}}),$.isAdmin()){L("GET","/users/tenant/details").then(c=>{if(c&&c.tenant){const r=document.getElementById("company-name"),g=document.getElementById("company-tier"),x=document.getElementById("company-cross-dept-peer"),y=document.getElementById("company-sla-access"),m=document.getElementById("company-logo-img"),f=document.getElementById("company-logo-fallback");r&&(r.value=c.tenant.name||""),x&&(x.checked=c.tenant.allowCrossDeptPeerAssignment!==!1),y&&(y.value=c.tenant.slaAccessLevel??3),g&&(g.value=`Tier ${c.tenant.subscriptionTier} Startup (Active)`),m&&f&&(m.src=`/avatars/tenant-${c.tenant.id}.jpg?t=${Date.now()}`,m.onload=()=>{m.style.display="block",f.style.display="none"},m.onerror=()=>{var E;m.style.display="none",f.style.display="block",f.innerText=((E=c.tenant.name)==null?void 0:E[0])||"?"})}}).catch(c=>console.error("Failed to load company details",c)),L("GET","/users/ranks").then(c=>{const g=(c.ranks||[]).find(x=>x.level===1);g&&document.getElementById("top-rank-title")&&(document.getElementById("top-rank-title").value=g.title,document.getElementById("top-rank-title").dataset.id=g.id)}).catch(c=>console.error("Failed to load ranks",c)),(v=document.getElementById("company-update-form"))==null||v.addEventListener("submit",async c=>{c.preventDefault();const r=document.getElementById("company-name"),g=document.getElementById("company-cross-dept-peer"),x=document.getElementById("company-sla-access"),y=r.value.trim(),m=g?g.checked:!0,f=x?Number(x.value):3;if(!y){k.error("Validation Error","Company name is required.");return}try{const E=await L("PATCH","/users/tenant/details",{name:y,allowCrossDeptPeerAssignment:m,slaAccessLevel:f});if($.currentUser){$.currentUser.tenantName=E.tenant.name,$.currentUser.tenant=E.tenant,localStorage.setItem("tascorr_user",JSON.stringify($.currentUser));const b=document.getElementById("header-user-role");b&&(b.innerText=`${E.tenant.name} (${$.currentUser.rankTitle})`);const T=document.getElementById("breadcrumbs");T&&(T.innerHTML=`
              <span class="body-text" style="font-weight: 500;">${E.tenant.name}</span>
              <span class="small-text" style="margin: 0 8px; color: var(--text-secondary);">&rarr;</span>
              <span class="body-text" style="font-weight: 600; color: var(--text-primary);">Settings</span>
            `)}k.success("Company Saved","Company details updated successfully.")}catch(E){k.error("Save Failed",E.message||"An error occurred.")}}),(t=document.getElementById("top-rank-form"))==null||t.addEventListener("submit",async c=>{c.preventDefault();const r=document.getElementById("top-rank-title"),g=r==null?void 0:r.dataset.id,x=r==null?void 0:r.value;if(!g){k.error("Update Failed","Top level rank could not be identified.");return}try{await L("PATCH",`/users/ranks/${g}`,{title:x}),k.success("Hierarchy Saved","Top level executive title updated successfully.")}catch(y){k.error("Update Failed",y.message||"Could not update hierarchy.")}});const u=document.getElementById("upload-logo-btn"),p=document.getElementById("logo-upload-input");p==null||p.addEventListener("change",async c=>{const r=c.target.files[0];if(!r)return;const g=new FileReader;g.onloadend=async()=>{const x=g.result;try{u&&(u.style.opacity="0.5");const y=await L("POST","/upload/tenant-logo",{imageBase64:x});k.success("Logo Updated","Company logo uploaded successfully.");const m=document.getElementById("company-logo-img"),f=document.getElementById("company-logo-fallback");m&&(m.src=y.logoUrl,m.style.display="block"),f&&(f.style.display="none");const E=document.getElementById("brand-logo");E&&(E.src=y.logoUrl)}catch(y){console.error(y),k.error("Upload Failed",y.message)}finally{u&&(u.style.opacity="1")}},g.readAsDataURL(r)})}const e=[{id:"light",name:"Light",color:"#EAEFF8",sidebar:"rgba(226, 232, 240, 0.9)"},{id:"dark",name:"Dark",color:"#0b0b0f",sidebar:"rgba(15, 15, 20, 0.9)"},{id:"corporate",name:"Corporate",color:"#F8FAFC",sidebar:"rgba(203, 213, 225, 0.9)"},{id:"ocean",name:"Ocean",color:"#F0F9FF",sidebar:"rgba(125, 211, 252, 0.9)"},{id:"forest",name:"Forest",color:"#F0FDF4",sidebar:"rgba(134, 239, 172, 0.9)"},{id:"sunset",name:"Sunset",color:"#FFF7ED",sidebar:"rgba(253, 186, 116, 0.9)"},{id:"lavender",name:"Lavender",color:"#FAF5FF",sidebar:"rgba(216, 180, 254, 0.9)"},{id:"midnight",name:"Midnight",color:"#05050A",sidebar:"rgba(5, 5, 10, 0.9)"}],o=()=>{const u=document.getElementById("theme-grid");if(!u)return;const p=document.documentElement.getAttribute("data-theme")||"light";u.innerHTML=e.map(c=>`
      <button class="theme-select-btn" data-theme-val="${c.id}" style="padding: 16px; border-radius: var(--radius-md); border: 2px solid ${p===c.id?"var(--accent-navy-primary)":"var(--border-neutral)"}; background-color: var(--bg-secondary); cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px; transition: all 0.2s ease;">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, ${c.sidebar} 50%, ${c.color} 50%); box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.1);"></div>
        <span style="font-weight: 600; color: var(--text-primary); font-size: 12px;">${c.name}</span>
      </button>
    `).join(""),u.querySelectorAll(".theme-select-btn").forEach(c=>{c.addEventListener("click",()=>{const r=c.dataset.themeVal;document.documentElement.setAttribute("data-theme",r),localStorage.setItem("tascorr_theme",r),window.dispatchEvent(new CustomEvent("themeChanged",{detail:r})),o(),k.info("Theme Applied",`${e.find(g=>g.id===r).name} theme activated.`)})})};o(),window.addEventListener("themeChanged",()=>{const u=document.getElementById("tab-display");u&&u.style.display!=="none"&&o()})}let O=null,Pe=[];function nt(){return`
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
  `}async function ot(){var n,d,e;const a=document.getElementById("profile-name");if(!a)return;const s=localStorage.getItem("target_profile_id"),i=s?Number(s):(n=$.currentUser)==null?void 0:n.id;localStorage.removeItem("target_profile_id");try{const[o,l]=await Promise.all([L("GET",`/users/${i}`),L("GET","/tasks")]);O=o.user,Pe=(l.tasks||[]).filter(r=>{var g;return(g=r.assignments)==null?void 0:g.some(x=>x.userId===i&&x.isActive)}),a.innerText=`${O.firstName} ${O.lastName}`;const t=document.getElementById("profile-avatar-img"),u=document.getElementById("profile-avatar");if(t.src=`/avatars/user-${O.id}.jpg?t=${Date.now()}`,t.onload=()=>{t.style.display="block",u.style.display="none"},t.onerror=()=>{t.style.display="none",u.style.display="flex",u.innerText=O.firstName[0]},document.getElementById("profile-rank").innerText=`${O.rank} (Hierarchy level ${O.rankLevel})`,document.getElementById("profile-dept-badge").innerText=O.department||"General / Corporate",document.getElementById("profile-status-badge").innerText=O.status,document.getElementById("profile-email-label").innerText=O.email,document.getElementById("profile-joined-label").innerText=new Date(O.createdAt).toLocaleDateString(),i===((d=$.currentUser)==null?void 0:d.id)||$.isAdmin()){const r=document.getElementById("upload-avatar-btn"),g=document.getElementById("avatar-upload-input");r&&(r.style.display="flex"),g==null||g.addEventListener("change",async x=>{const y=x.target.files[0];if(!y)return;const m=new FileReader;m.onloadend=async()=>{const f=m.result;try{r.style.opacity="0.5";const E=await L("POST","/upload/avatar",{imageBase64:f,targetUserId:i});k.success("Avatar Updated","Profile picture updated successfully."),t.src=`${E.avatarUrl}?t=${Date.now()}`,t.style.display="block",u.style.display="none",document.dispatchEvent(new CustomEvent("tascorr_avatar_updated"))}catch(E){console.error(E),k.error("Upload Failed",E.message)}finally{r.style.opacity="1"}},m.readAsDataURL(y)})}const p=document.getElementById("profile-security-widget");if(i===((e=$.currentUser)==null?void 0:e.id)){p&&(p.style.display="flex");const r=document.getElementById("profile-password-form");r&&r.addEventListener("submit",async g=>{g.preventDefault();const x=document.getElementById("profile-new-password").value,y=document.getElementById("profile-confirm-password").value;if(x!==y)return k.error("Password Mismatch","The new passwords do not match.");if(x.length<8)return k.error("Invalid Password","Password must be at least 8 characters long.");const m=r.querySelector("button"),f=m.innerText;try{m.disabled=!0,m.innerText="Updating...",await L("PATCH",`/users/${i}`,{password:x}),k.success("Password Updated","Your password has been changed successfully."),r.reset()}catch(E){console.error(E),k.error("Update Failed",E.message)}finally{m.disabled=!1,m.innerText=f}})}Le("week");const c=document.querySelectorAll(".profile-filter-btn");c.forEach(r=>{r.addEventListener("click",()=>{c.forEach(g=>{g.classList.remove("active"),g.style.background="none",g.style.color="var(--text-secondary)",g.style.fontWeight="500"}),r.classList.add("active"),r.style.background="var(--bg-primary)",r.style.color="var(--accent-navy-primary)",r.style.fontWeight="600",Le(r.dataset.range)})})}catch(o){console.error(o),k.error("Profile Load Failed",o.message)}}function Le(a){const s=document.getElementById("profile-tasks-body");if(!s)return;const i=new Date,n=new Date;a==="week"?n.setDate(i.getDate()-7):a==="month"?n.setMonth(i.getMonth()-1):a==="year"&&n.setFullYear(i.getFullYear()-1);const d=Pe.filter(e=>new Date(e.createdAt)>=n);if(d.length===0){s.innerHTML='<tr><td colspan="4" style="padding: 24px; text-align: center; color: var(--text-secondary);">No workforce history found for this range.</td></tr>';return}s.innerHTML=d.map(e=>{const l={Pending:"status-info","In Progress":"status-info",Blocked:"status-danger","Under Review":"status-warning",Completed:"status-success"}[e.status]||"status-info";return`
      <tr style="border-bottom: 1px solid var(--border-neutral);">
        <td style="padding: 12px; font-weight:600;">
          <div style="font-size:13px; color:var(--text-primary);">${e.title}</div>
        </td>
        <td style="padding: 12px;">
          <span class="pill-badge status-info" style="font-size:10px; padding:2px 6px;">${e.priority}</span>
        </td>
        <td style="padding: 12px; color: var(--text-secondary);">${new Date(e.dueDate).toLocaleDateString()}</td>
        <td style="padding: 12px;">
          <span class="pill-badge ${l}"><span class="badge-dot"></span>${e.status}</span>
        </td>
      </tr>
    `}).join("")}function lt(){const a=[{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-check"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>',title:"Smart Task Assignment",description:"Assign work across your team with full visibility into who's available, who's overloaded, and who's the right fit — before you hit assign."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list-tree"><path d="M21 12h-8"/><path d="M21 6H8"/><path d="M21 18h-8"/><path d="M8 6v14"/><path d="M3 6v.01"/><path d="M3 12v.01"/><path d="M3 18v.01"/></svg>',title:"Subtasks & Dependencies",description:"Break large initiatives into trackable pieces, and set up tasks that automatically wait their turn — no more starting work out of order."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-globe"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',title:"Remote Delegation & Monitoring",description:"Manage your business and orchestrate workforce operations from anywhere. Delegate tasks, check progress, and coordinate with off-site subordinates asynchronously.",featured:!0},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wifi-off"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.5"/><path d="M5 12.5a10.94 10.94 0 0 1 5.83-2.84"/><path d="M12 12.5a15.66 15.66 0 0 1-5.83-2.84"/><path d="M18.83 9.66A15.66 15.66 0 0 1 20 10.5"/><path d="M7.76 4.7a18.3 18.3 0 0 1 8.24 0"/></svg>',title:"Offline-First Resilience",description:"Perform task updates, log blockers, and manage work without an internet connection. Changes sync automatically when you are back online."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>',title:"Cross-Department Collaboration",description:"Request access to assign work outside your department, with time-limited approvals and a full record of who authorized what."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-line-chart"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>',title:"Performance & SLA Analytics",description:"See how quickly blockers get resolved, how long approvals take, and where your organization needs attention — all in one view."}],s=[{number:"01",title:"Set Up Your Structure",description:"Define your departments, ranks, and people once."},{number:"02",title:"Assign & Track",description:"Delegate tasks across your organization with full context."},{number:"03",title:"See What's Happening",description:"Get a real-time picture of what's done, what's stuck, and why."}],i=[{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',name:"Employees",line:"A simple view of what's yours to do."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',name:"Managers",line:"Live visibility into your team's work."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',name:"Department Heads",line:"Full control across your department."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-briefcase"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',name:"Executives",line:"A real-time pulse on the whole organization."},{icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings-2"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>',name:"Admins",line:"Configure your company without writing code."}],n=[{name:"Tier 1 (Startup)",price:"Lifetime Free",description:"For small organizations up to 10 employee accounts.",features:["Up to 10 employee accounts","Basic task assignment","Standard hierarchies"],featured:!1},{name:"Tier 2 (Small Biz)",price:"499 MVR/mo",description:"For small organizations up to 30 employee accounts.",features:["Up to 30 employee accounts","Cross-department delegation","Basic trace trails"],featured:!1},{name:"Tier 3 (Growth)",price:"999 MVR/mo",description:"For mid-scale organizations up to 100 employee accounts.",features:["Up to 100 employee accounts","Advanced trace trails","Priority support"],featured:!0},{name:"Tier 4 (Enterprise)",price:"5,000 MVR/mo",description:"For corporate networks up to 1000 employee accounts.",features:["Up to 1000 employee accounts","SLA & analytics dashboard","Dedicated account manager"],featured:!1}],d=[{name:"Companies Registered",value:"2+",icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>'},{name:"Active Employees",value:"10+",icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'},{name:"Tasks Delegated",value:"200+",icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle-2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>'},{name:"Blockers Resolved",value:"99%",icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>'}];return`
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
            ${a.map(e=>`
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
            ${n.map(e=>`
              <div class="v0-card ${e.featured?"v0-pricing-featured":""}" style="display: flex; flex-direction: column;">
                <h3 style="font-weight: 600; color: var(--text-primary);">${e.name}</h3>
                <div class="v0-pricing-price">${e.price}</div>
                <p class="v0-card-desc" style="margin-top: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1.5rem;">${e.description}</p>
                <ul style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; list-style: none; padding: 0;">
                  ${e.features.map(o=>`
                    <li style="display: flex; gap: 0.75rem; color: var(--text-secondary); align-items: center;">
                      <svg class="size-5 text-primary" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2d6cdf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ${o}
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
            ${d.map(e=>`
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
  `}let xe=[];function dt(){return`
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
          <!-- Global Audit Trails -->
          <div class="widget-card" style="display: flex; flex-direction: column; gap: 16px;">
            <h3 class="card-title">Global Audit & Session Logs</h3>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                <thead>
                  <tr style="border-bottom: 2px solid var(--border-neutral); background-color: var(--bg-secondary);">
                    <th style="padding: 12px; font-weight:600;">Timestamp</th>
                    <th style="padding: 12px; font-weight:600;">Actor</th>
                    <th style="padding: 12px; font-weight:600;">Action Type</th>
                    <th style="padding: 12px; font-weight:600;">Metadata Parameters</th>
                  </tr>
                </thead>
                <tbody id="global-audit-body">
                  <tr>
                    <td colspan="4" style="padding: 24px; text-align: center; color: var(--text-secondary);">No platform logs retrieved yet.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `}async function ct(){const a=document.getElementById("superadmin-unauthorized"),s=document.getElementById("superadmin-content");if(!s)return;if(!$.isSuperadmin()){a.style.display="block",s.style.display="none";return}a.style.display="none",s.style.display="flex",await Ce();const n=document.getElementById("onboard-tenant-form");n==null||n.addEventListener("submit",async e=>{e.preventDefault();const o=document.getElementById("tenant-name").value.trim(),l=document.getElementById("tenant-email").value.trim(),v=document.getElementById("tenant-password").value,t=Number(document.getElementById("tenant-tier").value),u=document.getElementById("tenant-error-alert");if(u&&(u.style.display="none",u.innerText=""),v.length<12||!/[a-z]/.test(v)||!/[A-Z]/.test(v)||!/[0-9]/.test(v)||!/[^a-zA-Z0-9]/.test(v)){d("Administrator password must be at least 12 characters long and contain uppercase, lowercase, numbers, and symbols.");return}try{const p=n.querySelector('button[type="submit"]');p&&(p.disabled=!0,p.innerText="Creating Organization Workspace..."),await L("POST","/superadmin/tenants",{name:o,adminEmail:l,adminPassword:v,subscriptionTier:t}),k.success("Tenant Created","Company registered and admin account provisioned successfully."),n.reset(),await Ce()}catch(p){console.error(p),d(p.message||"Onboarding organization failed."),k.error("Onboarding Failed",p.message)}finally{const p=n==null?void 0:n.querySelector('button[type="submit"]');p&&(p.disabled=!1,p.innerText="Onboard Organization")}});function d(e){errorAlert&&(errorAlert.innerText=e,errorAlert.style.display="block")}}async function Ce(){const a=document.getElementById("global-audit-body");if(a)try{if(xe=(await L("GET","/superadmin/audit-logs")).logs||[],xe.length===0){a.innerHTML='<tr><td colspan="4" style="padding: 24px; text-align: center; color: var(--text-secondary);">No action history logged on the platform yet.</td></tr>';return}a.innerHTML=xe.map(i=>{var n;return`
      <tr style="border-bottom: 1px solid var(--border-neutral);">
        <td style="padding: 12px; color: var(--text-secondary); font-size:12px;">${new Date(i.createdAt).toLocaleString()}</td>
        <td style="padding: 12px; font-weight:600;">${((n=i.actor)==null?void 0:n.email)||"System"}</td>
        <td style="padding: 12px;"><span class="pill-badge status-info" style="font-size:10px; padding:2px 6px;">${i.action}</span></td>
        <td style="padding: 12px; font-family: monospace; font-size: 11px; max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${i.metadata}">${i.metadata||"{}"}</td>
      </tr>
    `}).join("")}catch(s){console.error(s),a.innerHTML=`<tr><td colspan="4" style="padding: 24px; text-align: center; color: var(--status-danger);">Failed to load platform log: ${s.message}</td></tr>`}}function pt(){return`
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
  `}function ut(){const a=document.getElementById("login-form");if(!a)return;const s=document.getElementById("login-email"),i=document.getElementById("login-password"),n=document.getElementById("login-error-alert");[s,i].forEach(e=>{e&&(e.addEventListener("focus",()=>{e.style.borderColor="var(--accent-navy-primary)"}),e.addEventListener("blur",()=>{e.style.borderColor="var(--border-neutral)"}))}),a.addEventListener("submit",async e=>{e.preventDefault();const o=s.value.trim(),l=i.value;if(n&&(n.style.display="none",n.innerText=""),!o||!l){d("Please fill out all credentials.");return}if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o)){d("Please enter a valid email address.");return}if(o.length>254){d("Email address is too long.");return}if(l.length>128){d("Password exceeds maximum length.");return}try{const t=a.querySelector('button[type="submit"]');t&&(t.disabled=!0,t.innerText="Authenticating..."),await $.login(o,l),k.success("Access Granted","Signed in successfully."),window.location.hash="dashboard"}catch(t){console.error(t),d(t.message||"Authentication failed. Please check credentials."),k.error("Login Failed",t.message||"Check your credentials.");const u=a.querySelector('button[type="submit"]');u&&(u.disabled=!1,u.innerText="Sign In")}});function d(e){n&&(n.innerText=e,n.style.display="block")}}function mt(){return`
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
  `}function gt(){const a=document.getElementById("signup-form");if(!a)return;const s=document.getElementById("signup-company"),i=document.getElementById("signup-email"),n=document.getElementById("signup-password"),d=document.getElementById("signup-confirm-password"),e=document.getElementById("signup-error-alert"),o={length:t=>t.length>=12,case:t=>/[a-z]/.test(t)&&/[A-Z]/.test(t),number:t=>/[0-9]/.test(t),symbol:t=>/[^a-zA-Z0-9]/.test(t)};n.addEventListener("input",()=>{const t=n.value;l("req-length",o.length(t)),l("req-case",o.case(t)),l("req-number",o.number(t)),l("req-symbol",o.symbol(t))});function l(t,u){const p=document.getElementById(t);p&&(u?(p.style.color="var(--status-success)",p.innerHTML=`&#10003; ${p.innerText.replace("✓","").replace("•","").trim()}`):(p.style.color="var(--status-danger)",p.innerHTML=`&bull; ${p.innerText.replace("✓","").replace("•","").trim()}`))}a.addEventListener("submit",async t=>{t.preventDefault();const u=s.value.trim(),p=i.value.trim(),c=n.value,r=d.value;if(e&&(e.style.display="none",e.innerText=""),!u||!p||!c||!r){v("Please populate all required details.");return}if(u.length<2){v("Company name must be at least 2 characters.");return}if(u.length>100){v("Company name cannot exceed 100 characters.");return}if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p)){v("Please enter a valid email address.");return}if(c!==r){v("Passwords do not match.");return}if(!o.length(c)||!o.case(c)||!o.number(c)||!o.symbol(c)){v("Password does not meet all required complexity parameters.");return}try{const x=a.querySelector('button[type="submit"]');x&&(x.disabled=!0,x.innerText="Creating Workspace..."),await $.signup(u,p,c),k.success("Account Created","Company registered successfully. Please log in."),window.location.hash="login"}catch(x){console.error(x),v(x.message||"Workspace signup failed. Please try again."),k.error("Signup Failed",x.message||"Check submission details.");const y=a.querySelector('button[type="submit"]');y&&(y.disabled=!1,y.innerText="Register & Create Workspace")}});function v(t){e&&(e.innerText=t,e.style.display="block")}}const te={landing:{title:"Marketing",render:lt,icon:"home",isPublic:!0},login:{title:"Sign In",render:pt,icon:"user",isPublic:!0},signup:{title:"Register",render:mt,icon:"users",isPublic:!0},dashboard:{title:"Dashboard",render:Ve,icon:"chart-pie"},tasks:{title:"Tasks",render:_e,icon:"list-check"},departments:{title:"Departments",render:Je,icon:"sitemap"},employees:{title:"Employees",render:Qe,icon:"users"},reports:{title:"Reports",render:tt,icon:"chart-bar"},settings:{title:"Settings",render:st,icon:"cog",isBottom:!0},profile:{title:"Profile",render:nt,icon:"user",isBottom:!0},superadmin:{title:"Superadmin",render:dt,icon:"key"}},le={home:'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>',"chart-pie":'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></svg>',"list-check":'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 0A48.536 48.536 0 0112 3m0 0c2.917 0 5.747.294 8.5.862m-21 10.398c0-.552.448-1 1-1h6.25a1 1 0 011 1v3.875a1 1 0 01-1 1H2.5a1 1 0 01-1-1v-3.875z" /></svg>',sitemap:'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.75a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM12 6a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM21 10.5a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM9 18.75a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM9.75 10.5c0 .621-.504 1.125-1.125 1.125H6.75a2.25 2.25 0 01-2.25-2.25V6.75m11.25 3.75c0 .621-.504 1.125-1.125 1.125H12" /></svg>',users:'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766v-.109A12.318 12.318 0 019.374 15c2.24 0 4.332.596 6.136 1.631M19.5 9.75a3 3 0 11-6 0 3 3 0 016 0zM4 10.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>',"chart-bar":'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>',cog:'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.645-.869l.214-1.28z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>',user:'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg>',key:'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>',logout:'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>'};function Se(){var l,v,t,u,p,c;const a=document.getElementById("desktop-nav"),s=document.getElementById("desktop-bottom-nav"),i=document.getElementById("mobile-nav");if(!a||!i||!s||(a.innerHTML="",s.innerHTML="",i.innerHTML="",!$.isAuthenticated))return;let n="",d="";const e=((l=$.currentUser)==null?void 0:l.rankLevel)??4,o=$.isSuperadmin();if(Object.keys(te).forEach(r=>{var m,f;const g=te[r];if(g.isPublic)return;if(o){if(r!=="superadmin"&&r!=="settings")return}else{if(r==="superadmin"||r==="employees"&&e>2)return;const E=((f=(m=$.currentUser)==null?void 0:m.tenant)==null?void 0:f.slaAccessLevel)??3;if(r==="reports"&&e>E)return}const x=le[g.icon]||"",y=`
      <a href="#${r}" class="menu-item" id="nav-${r}">
        ${x}
        <span class="menu-item-text">${g.title}</span>
      </a>
    `;g.isBottom?d+=y:n+=y}),d+=`
    <a class="menu-item" id="nav-logout-action" style="color: var(--status-danger);">
      ${le.logout}
      <span class="menu-item-text">Sign Out</span>
    </a>
  `,a.innerHTML=n,s.innerHTML=d,(v=document.getElementById("nav-logout-action"))==null||v.addEventListener("click",()=>{$.logout()}),!o){const r=((u=(t=$.currentUser)==null?void 0:t.tenant)==null?void 0:u.slaAccessLevel)??3,x=e<=r?["dashboard","tasks","quickAction","reports","settings"]:["dashboard","tasks","quickAction","settings","logout"];let y="";x.forEach(m=>{if(m==="quickAction")e<=3?y+=`
            <div class="mobile-quick-action" id="mobile-task-create" aria-label="Create Task">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
          `:y+='<div style="width: 56px; height: 56px;"></div>';else if(m==="logout")y+=`
          <a href="#" class="mobile-nav-item" id="mobile-nav-logout" style="color: var(--status-danger);">
            ${le.logout}
            <span>Sign Out</span>
          </a>
        `;else{const f=te[m],E=le[f.icon]||"";y+=`
          <a href="#${m}" class="mobile-nav-item" id="mobile-nav-${m}">
            ${E}
            <span>${f.title}</span>
          </a>
        `}}),i.innerHTML=y,(p=document.getElementById("mobile-task-create"))==null||p.addEventListener("click",()=>{new De(()=>{window.location.hash==="#tasks"?window.location.reload():window.location.hash="tasks"}).open()}),(c=document.getElementById("mobile-nav-logout"))==null||c.addEventListener("click",m=>{m.preventDefault(),$.logout()})}}function be(){const a=window.location.hash.substring(1)||"landing";let s=te[a]||te.landing;if(!s.isPublic&&!$.isAuthenticated){window.location.hash="login";return}if(s.isPublic&&$.isAuthenticated&&a!=="landing"){window.location.hash="dashboard";return}if(a==="superadmin"&&!$.isSuperadmin()){window.location.hash="dashboard";return}const i=document.getElementById("view-root");i&&(i.style.animation="none",i.offsetHeight,i.style.animation="",i.innerHTML=s.render());const n=document.getElementById("breadcrumbs");if(n){const t=$.currentUser&&$.currentUser.tenantName||"Workspace";n.innerHTML=`
      <span class="body-text" style="font-weight: 500;">${t}</span>
      <span class="small-text" style="margin: 0 8px; color: var(--text-secondary);">&rarr;</span>
      <span class="body-text" style="font-weight: 600; color: var(--text-primary);">${s.title}</span>
    `}document.querySelectorAll(".menu-item").forEach(t=>{t.classList.remove("active")});const d=document.getElementById(`nav-${a}`);d&&d.classList.add("active"),document.querySelectorAll(".mobile-nav-item").forEach(t=>{t.classList.remove("active")});const e=document.getElementById(`mobile-nav-${a}`);e&&e.classList.add("active");const o=document.getElementById("sidebar"),l=document.querySelector(".app-header"),v=document.getElementById("app-layout");s.isPublic?(document.body.classList.add("public-route"),o&&(o.style.display="none"),l&&(l.style.display="none"),v&&(v.style.backgroundColor="var(--bg-primary)")):(document.body.classList.remove("public-route"),o&&(o.style.display=window.innerWidth>768?"flex":"none"),l&&(l.style.display="flex"),v&&(v.style.backgroundColor="var(--bg-secondary)")),a==="login"&&ut(),a==="signup"&&gt(),a==="dashboard"&&Ge(),a==="tasks"&&Ye(),a==="employees"&&et(),a==="departments"&&Ke(),a==="reports"&&rt(),a==="settings"&&it(),a==="profile"&&ot(),a==="superadmin"&&ct()}function yt(){const a=document.getElementById("sidebar"),s=document.getElementById("sidebar-toggle"),i=document.getElementById("theme-toggle");s&&a&&s.addEventListener("click",()=>{a.classList.toggle("collapsed")});const n=localStorage.getItem("tascorr_theme")||"light";document.documentElement.setAttribute("data-theme",n);function d(l){const v=document.getElementById("theme-icon"),t=document.getElementById("mobile-theme-icon"),u=p=>{if(!p)return;["dark","midnight"].includes(l)?p.innerHTML='<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />':p.innerHTML='<path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />'};u(v),u(t)}d(n);const e=()=>{const l=document.documentElement.getAttribute("data-theme"),t=["dark","midnight"].includes(l)?"light":"dark";document.documentElement.setAttribute("data-theme",t),localStorage.setItem("tascorr_theme",t),d(t),window.dispatchEvent(new CustomEvent("themeChanged",{detail:t}))};i&&i.addEventListener("click",e);const o=document.getElementById("mobile-theme-toggle");o&&o.addEventListener("click",e),window.addEventListener("resize",()=>{const l=window.location.hash.substring(1)||"landing";!(te[l]||te.landing).isPublic&&a&&(a.style.display=window.innerWidth>768?"flex":"none")}),he()}function he(){const a=document.getElementById("header-user-role");if(a)if($.isAuthenticated&&$.currentUser){const t=$.currentUser,u=t.tenantName||`${t.firstName} ${t.lastName}`;a.innerText=`${u} (${t.rankTitle})`}else a.innerText="Guest";const s=document.getElementById("mobile-user-name"),i=document.getElementById("mobile-greeting"),n=document.getElementById("mobile-header-avatar");if(s&&$.isAuthenticated&&$.currentUser){const t=$.currentUser;s.innerText=t.firstName;const u=[{text:"Good morning,",hint:"en"},{text:"Buenos días,",hint:"es"},{text:"Bonjour,",hint:"fr"},{text:"Guten Morgen,",hint:"de"},{text:"Buongiorno,",hint:"it"},{text:"Ohayō,",hint:"jp"},{text:"Anyoung,",hint:"kr"},{text:"Zǎo ān,",hint:"cn"},{text:"Namaste,",hint:"in"},{text:"Bom dia,",hint:"pt"}],p=u[Math.floor(Math.random()*u.length)];if(i&&(i.innerHTML=`${p.text} <span style="font-size:10px; opacity:0.6; text-transform:uppercase; margin-left:4px;" title="Language: ${p.hint}">${p.hint}</span>`),n){const c=`${t.firstName?t.firstName.charAt(0):""}${t.lastName?t.lastName.charAt(0):""}`;n.innerHTML=`
        <img src="/avatars/user-${t.id}.jpg?t=${Date.now()}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" />
        <div style="width:40px;height:40px;border-radius:50%;background:var(--sidebar-bg);color:var(--text-primary);display:none;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:1px solid #E5E7EB;">${c||"?"}</div>
      `}}const d=document.getElementById("sidebar-user-card"),e=document.getElementById("sidebar-user-avatar"),o=document.getElementById("sidebar-user-avatar-img"),l=document.getElementById("sidebar-user-name"),v=document.getElementById("sidebar-user-role");if(d&&e&&l&&v)if($.isAuthenticated&&$.currentUser){const t=$.currentUser,u=`${t.firstName?t.firstName.charAt(0):""}${t.lastName?t.lastName.charAt(0):""}`;e.innerText=u||"??",o&&(o.src=`/avatars/user-${t.id}.jpg?t=${Date.now()}`,o.onload=()=>{o.style.display="block",e.style.display="none"},o.onerror=()=>{o.style.display="none",e.style.display="flex"}),l.innerText=`${t.firstName} ${t.lastName}`,v.innerText=t.rankTitle||"Employee",d.style.display="flex",n&&(n.onclick=()=>{var y,m,f,E,b;(y=document.getElementById("mobile-profile-sheet"))==null||y.remove(),(m=document.getElementById("mobile-profile-overlay"))==null||m.remove();const p=document.createElement("div");p.id="mobile-profile-overlay",p.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:1100;backdrop-filter:blur(2px);";const c=document.createElement("div");c.id="mobile-profile-sheet",c.style.cssText=`
            position:fixed; left:0; right:0; bottom:0; z-index:1101;
            background:var(--bg-primary); border-radius:28px 28px 0 0;
            padding:0 0 32px 0; box-shadow:0 -8px 40px rgba(0,0,0,0.15);
            transform:translateY(100%); transition:transform 0.3s cubic-bezier(0.4,0,0.2,1);
          `;const r=t.departmentName||((f=t.department)==null?void 0:f.name)||"Unassigned",g=`${((E=t.firstName)==null?void 0:E[0])||""}${((b=t.lastName)==null?void 0:b[0])||""}`;c.innerHTML=`
            <!-- Drag handle -->
            <div style="width:40px;height:4px;background:#E5E7EB;border-radius:2px;margin:12px auto 20px auto;"></div>

            <!-- User card -->
            <div style="display:flex;align-items:center;gap:16px;padding:0 24px 20px;border-bottom:1px solid var(--border-neutral);">
              <div style="position:relative;width:60px;height:60px;flex-shrink:0;">
                <img src="/avatars/user-${t.id}.jpg?t=${Date.now()}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" style="width:60px;height:60px;border-radius:50%;object-fit:cover;border:2px solid var(--border-neutral);" />
                <div style="width:60px;height:60px;border-radius:50%;background:var(--accent-navy-light);color:var(--accent-navy-primary);display:none;align-items:center;justify-content:center;font-weight:700;font-size:22px;">${g||"?"}</div>
              </div>
              <div>
                <div style="font-size:18px;font-weight:700;color:var(--text-primary);">${t.firstName} ${t.lastName}</div>
                <div style="font-size:13px;color:var(--accent-navy-primary);font-weight:600;margin-top:2px;">${t.rankTitle||"Employee"}</div>
                <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">${r}</div>
              </div>
            </div>

            <!-- Email row -->
            <div style="padding:16px 24px;border-bottom:1px solid var(--border-neutral);display:flex;align-items:center;gap:12px;">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px;height:18px;color:var(--text-secondary);flex-shrink:0;"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
              <span style="font-size:14px;color:var(--text-secondary);">${t.email||"--"}</span>
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
          `,document.body.appendChild(p),document.body.appendChild(c),requestAnimationFrame(()=>{c.style.transform="translateY(0)"});const x=()=>{c.style.transform="translateY(100%)",p.style.opacity="0",setTimeout(()=>{c.remove(),p.remove()},300)};p.addEventListener("click",x),c.querySelector("#mobile-sheet-profile-link").addEventListener("click",()=>{x(),setTimeout(()=>{window.location.hash="profile"},300)}),c.querySelector("#mobile-sheet-signout").addEventListener("click",()=>{x(),setTimeout(()=>$.logout(),300)})}),d.onclick=()=>{window.location.hash="profile";const p=document.getElementById("sidebar");p&&p.classList.contains("active")&&p.classList.remove("active")}}else d.style.display="none"}async function xt(){const a=await Fe();if(a.length===0)return;console.log(`[Sync] Replaying ${a.length} queued operation(s)...`);const s=document.getElementById("offline-banner"),i=document.getElementById("offline-banner-text");s&&i&&(s.style.display="flex",s.style.background="#2563EB",i.textContent=`Syncing ${a.length} pending change${a.length>1?"s":""}...`,document.getElementById("app-layout").style.marginTop=s.offsetHeight+"px");let n=0;const d=[];for(const e of a)try{await L(e.method,e.path,e.body),await me(e.id),n++}catch(o){const l=o==null?void 0:o.status;l===409?(console.warn(`[Sync] Conflict on op #${e.id} (${e.method} ${e.path}). Discarding local change.`),await me(e.id),d.push({op:e,reason:"Conflict — a newer version exists on the server. Your local change was discarded."})):l===403||l===404?(console.warn(`[Sync] Permanent failure on op #${e.id} (${l}). Removing from queue.`),await me(e.id),d.push({op:e,reason:l===403?"Permission denied — you may no longer have access.":"Resource not found — it may have been deleted."})):console.warn(`[Sync] Transient failure on op #${e.id} (${e.method} ${e.path}):`,o.message)}if(await de(),s&&(s.style.display="none",document.getElementById("app-layout").style.marginTop="0"),n>0&&k.success("Changes Synced",`${n} offline change${n>1?"s":""} saved to the server successfully.`,5e3),d.length>0){const e=d.map(o=>`• ${o.op.method} ${o.op.path}: ${o.reason}`).join(`
`);k.error(`${d.length} Change${d.length>1?"s":""} Could Not Sync`,e,0)}if(n>0||d.length>0){const e=window.location.hash.substring(1);["dashboard","tasks"].includes(e)&&be()}}window.addEventListener("error",a=>{console.error("Captured Global Frontend Error:",a.error),k.error("App Runtime Exception",a.message||"An unexpected client error occurred.")});window.addEventListener("unhandledrejection",a=>{var s;console.error("Captured Global Promise Rejection:",a.reason),k.error("API Error Response",((s=a.reason)==null?void 0:s.message)||"Server request returned error.")});document.addEventListener("DOMContentLoaded",async()=>{await $.checkSession();try{await ie(),await de()}catch(a){console.warn("[OfflineDB] Could not initialize offline database:",a)}window.addEventListener("online",async()=>{$.isAuthenticated&&await xt()}),yt(),Se(),document.addEventListener("tascorr_avatar_updated",()=>{he()}),window.addEventListener("hashchange",()=>{Se(),he(),be()}),be()});
