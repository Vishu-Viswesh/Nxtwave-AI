function showToast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1700)}
function scrollToId(id){document.getElementById(id).scrollIntoView({behavior:"smooth"})}
function copyCode(){navigator.clipboard?.writeText(document.getElementById("refCode").textContent);showToast("Referral code copied")}
function shareWhatsApp(){const text="I’m joining NxtWave’s FREE “Build Your First AI Project in 60 Minutes” workshop 🚀. Use my referral code VISWESH23 when you register.";window.open("https://wa.me/?text="+encodeURIComponent(text),"_blank")}
function generateMessage(){const a=document.getElementById("audience").value,t=document.getElementById("tone").value;let s=t==="Urgent"?`🚀 ${a}: NxtWave’s FREE AI Build Sprint is coming up. Build a real AI project in 60 minutes and get AI feedback after submission. Use VISWESH23 to register now.`:t==="Professional"?`NxtWave is hosting a free 60-minute AI project workshop for ${a}. Build a practical project and receive automated AI feedback. Register with VISWESH23.`:`Hey ${a}! 👋 NxtWave is hosting a FREE AI Build Sprint. Build a real project in 60 minutes, submit it and get AI feedback. Use VISWESH23 when you register!`;document.getElementById("aiMessage").textContent=s;showToast("AI message generated")}

function openModal(){document.getElementById("modal").classList.add("show");showRegistrationStep()}
function closeModal(){document.getElementById("modal").classList.remove("show")}
function showRegistrationStep(){document.getElementById("registrationStep").style.display="block";document.getElementById("otpStep").style.display="none";document.getElementById("successStep").style.display="none"}
function cleanDigits(v){return v.replace(/\D/g,"")}
function validEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)}
function clearErrors(){["firstName","lastName","college","email","phone"].forEach(id=>{const e=document.getElementById(id);e.classList.remove("invalid","valid")});["firstNameError","lastNameError","collegeError","emailError","phoneError"].forEach(id=>document.getElementById(id).textContent="")}
function sendOTP(resend=false){
  clearErrors();
  const first=document.getElementById("firstName"),last=document.getElementById("lastName"),college=document.getElementById("college"),email=document.getElementById("email"),phone=document.getElementById("phone"),country=document.getElementById("countryCode");
  let ok=true;
  if(first.value.trim().length<2){first.classList.add("invalid");document.getElementById("firstNameError").textContent="Enter a valid first name.";ok=false}else first.classList.add("valid");
  if(last.value.trim().length<2){last.classList.add("invalid");document.getElementById("lastNameError").textContent="Enter a valid last name.";ok=false}else last.classList.add("valid");
  if(college.value.trim().length<2){college.classList.add("invalid");document.getElementById("collegeError").textContent="Enter your college / university.";ok=false}else college.classList.add("valid");
  if(!validEmail(email.value.trim())){email.classList.add("invalid");document.getElementById("emailError").textContent="Enter a valid email, e.g. name@college.edu.";ok=false}else email.classList.add("valid");
  const digits=cleanDigits(phone.value);
  if(digits.length<7||digits.length>15){phone.classList.add("invalid");document.getElementById("phoneError").textContent="Enter a valid mobile number.";ok=false}else phone.classList.add("valid");
  if(!ok)return;
  window.generatedOTP=String(Math.floor(100000+Math.random()*900000));
  window.otpExpires=Date.now()+300000;
  document.getElementById("registrationStep").style.display="none";
  document.getElementById("otpStep").style.display="block";
  document.getElementById("maskedPhone").textContent=country.value+" "+digits.slice(0,-4).replace(/\d/g,"•")+digits.slice(-4);
  document.getElementById("demoOtpNotice").textContent="Demo mode OTP: "+window.generatedOTP+" • In production this is sent by SMS provider.";
  document.querySelectorAll(".otp-inputs input").forEach(x=>x.value="");
  document.getElementById("otp1").focus();
  startOtpTimer();
  showToast(resend?"New OTP generated":"OTP generated");
}
function startOtpTimer(){
  let left=30;const timer=document.getElementById("otpTimer"),btn=document.getElementById("resendOtp");btn.disabled=true;
  clearInterval(window.otpTimer);timer.textContent="Resend OTP in 30s";
  window.otpTimer=setInterval(()=>{left--;timer.textContent=left>0?`Resend OTP in ${left}s`:"You can resend now";if(left<=0){clearInterval(window.otpTimer);btn.disabled=false}},1000);
}
function verifyOTP(){
  const entered=[1,2,3,4,5,6].map(n=>document.getElementById("otp"+n).value).join("");
  const err=document.getElementById("otpError");
  if(!/^\d{6}$/.test(entered)){err.textContent="Enter the 6-digit OTP.";return}
  if(Date.now()>window.otpExpires){err.textContent="This OTP has expired. Please request a new one.";return}
  if(entered!==window.generatedOTP){err.textContent="Incorrect OTP. Please check the code and try again.";return}
  err.textContent="";
  let n=Number(localStorage.getItem("nxtwaveRegs")||287)+1;localStorage.setItem("nxtwaveRegs",n);document.getElementById("registered").textContent=n;
  document.getElementById("otpStep").style.display="none";document.getElementById("successStep").style.display="block";
  showToast("Mobile verified · registration complete");
}
function register(){sendOTP()}
document.querySelectorAll(".otp-inputs input").forEach((input,index,all)=>{
  input.addEventListener("input",()=>{input.value=input.value.replace(/\D/g,"").slice(-1);if(input.value&&all[index+1])all[index+1].focus()});
  input.addEventListener("keydown",e=>{if(e.key==="Backspace"&&!input.value&&all[index-1])all[index-1].focus()});
});
document.querySelector(".otp-inputs")?.addEventListener("paste",e=>{
  const data=(e.clipboardData||window.clipboardData).getData("text").replace(/\D/g,"").slice(0,6);
  if(data.length===6){e.preventDefault();[1,2,3,4,5,6].forEach((n,i)=>document.getElementById("otp"+n).value=data[i])}
});
["email","phone","firstName","lastName","college"].forEach(id=>{
  document.getElementById(id)?.addEventListener("input",()=>{
    const el=document.getElementById(id);el.classList.remove("invalid");
    const er=document.getElementById(id+"Error");if(er)er.textContent="";
  });
});
window.addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});

// ===== V11 Project Sources: Upload OR GitHub =====
let selectedProject=null;
let evaluationSource="upload";

// ===== V21 Account Gate =====
let accountMode="login";
function getAccount(){ try{return JSON.parse(localStorage.getItem("nxtwaveAccount")||"null")}catch(e){return null} }
function isSignedIn(){return !!getAccount()}
function refreshAccountUI(){
  const a=getAccount(), nav=document.getElementById("accountNav"), gate=document.getElementById("evaluationAuthGate"), btn=document.getElementById("evaluateBtn");
  if(nav){nav.textContent=a?`Hi, ${String(a.name||a.email.split("@")[0]).slice(0,16)} · Sign out`:"Sign in"; nav.classList.toggle("signed-in",!!a); nav.onclick=a?toggleAccount:openAccountModal;}
  if(gate)gate.style.display=a?"none":"flex";
  if(btn)btn.disabled=!a;
}
function openAccountModal(){document.getElementById("accountModal")?.classList.add("show");setAccountMode("login")}
function closeAccountModal(){document.getElementById("accountModal")?.classList.remove("show")}
function setAccountMode(mode){
  accountMode=mode;
  const signup=mode==="signup";
  document.getElementById("loginTab")?.classList.toggle("active",!signup);
  document.getElementById("signupTab")?.classList.toggle("active",signup);
  document.getElementById("accountNameField").style.display=signup?"block":"none";
  document.getElementById("accountTitle").textContent=signup?"Create your account":"Welcome back";
  document.getElementById("accountSubtitle").textContent=signup?"Create an account to evaluate projects and track your improvement history.":"Sign in to evaluate projects and access your saved history.";
  document.getElementById("accountSubmit").textContent=signup?"Create account →":"Sign in →";
  ["accountNameError","accountEmailError","accountPasswordError"].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=""});
}
function submitAccount(){
  const name=document.getElementById("accountName").value.trim(),email=document.getElementById("accountEmail").value.trim().toLowerCase(),pw=document.getElementById("accountPassword").value;
  ["accountNameError","accountEmailError","accountPasswordError"].forEach(id=>document.getElementById(id).textContent="");
  let ok=true;
  if(accountMode==="signup"&&name.length<2){document.getElementById("accountNameError").textContent="Enter your name.";ok=false}
  if(!validEmail(email)){document.getElementById("accountEmailError").textContent="Enter a valid email.";ok=false}
  if(pw.length<6){document.getElementById("accountPasswordError").textContent="Use at least 6 characters.";ok=false}
  if(!ok)return;
  const existing=getAccount();
  if(accountMode==="signup"){
    localStorage.setItem("nxtwaveAccount",JSON.stringify({name,email,password:pw,createdAt:new Date().toISOString()}));
    showToast("Account created · evaluation unlocked");
  }else{
    if(existing && existing.email===email && existing.password===pw){showToast("Signed in · evaluation unlocked");}
    else if(!existing){document.getElementById("accountEmailError").textContent="No account found. Create an account first.";return}
    else{document.getElementById("accountPasswordError").textContent="Incorrect email or password.";return}
  }
  closeAccountModal(); refreshAccountUI();
}
function toggleAccount(){
  if(isSignedIn()){localStorage.removeItem("nxtwaveAccount");showToast("Signed out");refreshAccountUI();}else openAccountModal();
}


function chooseSource(source){
  evaluationSource=source;
  const upload=document.getElementById("uploadSource");
  const github=document.getElementById("githubSource");
  const ut=document.getElementById("uploadTab");
  const gt=document.getElementById("githubTab");
  if(upload)upload.style.display=source==="upload"?"block":"none";
  if(github)github.style.display=source==="github"?"block":"none";
  if(ut)ut.classList.toggle("active",source==="upload");
  if(gt)gt.classList.toggle("active",source==="github");
  document.getElementById("evalStatus").textContent=source==="github"
    ?"Paste a public GitHub repository URL and click Analyze Actual Project."
    :"Upload your project ZIP and click Analyze Actual Project.";
}
const pf=document.getElementById("projectFile");
const dz=document.getElementById("dropZone");
if(pf)pf.addEventListener("change",e=>setProjectFile(e.target.files[0]));
if(dz){
  ["dragenter","dragover"].forEach(x=>dz.addEventListener(x,e=>{e.preventDefault();dz.classList.add("drag")}));
  ["dragleave","drop"].forEach(x=>dz.addEventListener(x,e=>{e.preventDefault();dz.classList.remove("drag")}));
  dz.addEventListener("drop",e=>setProjectFile(e.dataTransfer.files[0]));
}
function setProjectFile(f){
  if(!f)return;
  if(!f.name.toLowerCase().endsWith(".zip")){showToast("Please upload a ZIP project");return}
  selectedProject=f;
  document.getElementById("selectedFile").style.display="flex";
  document.getElementById("fileName").textContent=f.name+" · "+(f.size/1024/1024).toFixed(2)+" MB";
  document.getElementById("evalStatus").textContent="Project ZIP ready for evidence-based analysis.";
}
function clearProjectFile(){
  selectedProject=null;
  document.getElementById("selectedFile").style.display="none";
  if(pf)pf.value="";
}
function normalizeGithubUrl(v){
  let u=v.trim();
  if(!u)return "";
  if(!/^https?:\/\//i.test(u))u="https://"+u;
  try{
    const x=new URL(u);
    if(x.hostname.toLowerCase()!=="github.com" && x.hostname.toLowerCase()!=="www.github.com")return "";
    const parts=x.pathname.split("/").filter(Boolean);
    if(parts.length<2)return "";
    return "https://github.com/"+parts[0]+"/"+parts[1];
  }catch(e){return ""}
}
async function evaluateRealProject(){
  if(!isSignedIn()){showToast("Please sign in or create an account before evaluating.");openAccountModal();return}
  const b=document.getElementById("evaluateBtn"),status=document.getElementById("evalStatus");
  if(b.dataset.evaluating==="true")return;

  let githubUrl="";
  if(evaluationSource==="github"){
    githubUrl=normalizeGithubUrl(document.getElementById("githubUrlMain").value);
    if(!githubUrl){showToast("Enter a valid public GitHub repository URL");return}
  }else if(!selectedProject){
    showToast("Upload the project ZIP first");
    return;
  }

  b.dataset.evaluating="true";b.disabled=true;b.classList.add("evaluating");
  b.innerHTML='<span class="spinner"></span> Evaluating Project…';
  b.setAttribute("aria-busy","true");
  status.textContent=evaluationSource==="github"
    ?"Fetching the GitHub repository and inspecting its actual files…"
    :"Uploading and inspecting the actual project…";

  const fd=new FormData();
  if(evaluationSource==="upload")fd.append("project",selectedProject);
  if(githubUrl)fd.append("github_url",githubUrl);
  fd.append("demo_url",document.getElementById("demoUrl").value);

  try{
    const r=await fetch("/api/evaluate",{method:"POST",body:fd});
    const d=await r.json();
    if(!r.ok)throw new Error(d.error||"Evaluation failed");
    renderEvaluation(d);window.lastEvaluation=d;
    status.textContent=`✓ Evaluation complete · ${d.source_label||"Project inspected"} · ${d.files_inspected} files checked.`;
  }catch(e){
    status.textContent="Evaluation could not be completed. Check the repository URL or upload and try again.";
    showToast(e.message);
  }finally{
    b.dataset.evaluating="false";b.disabled=false;b.classList.remove("evaluating");
    b.innerHTML="Analyze Actual Project →";b.removeAttribute("aria-busy");
  }
}
function scoreRange(pct){
  pct=Number(pct)||0;
  if(pct<40)return "red";
  if(pct<60)return "orange";
  if(pct<80)return "yellow";
  return "green";
}
function scoreColor(pct){
  pct=Number(pct)||0;
  if(pct<40)return "#ef4444";
  if(pct<60)return "#f59e0b";
  if(pct<80)return "#d4a017";
  return "#16a34a";
}
function renderEvaluation(d){
  window.lastEvaluation=d;
  document.getElementById("realScore").textContent=d.score;
  document.getElementById("scoreConfidence").textContent=d.confidence+" confidence";
  const circle=document.querySelector(".score-circle");
  const totalPct=Math.max(0,Math.min(100,Number(d.score)||0));
  circle.style.setProperty("--score-pct",totalPct);
  circle.style.setProperty("--score-color",scoreColor(totalPct));

  const rows=[
    ["Problem definition","problem_definition"],
    ["AI implementation","ai_implementation"],
    ["Code quality","code_quality"],
    ["Documentation","documentation"],
    ["Reproducibility","reproducibility"],
    ["Results / validation","results_validation"]
  ];
  document.getElementById("evidenceRows").innerHTML=rows.map(([label,key])=>{
    const x=d.categories[key];
    const pct=x.max?Math.round((x.score/x.max)*100):0;
    const range=scoreRange(pct);
    return `<div class="score-row range-${range}">
      <div class="score-main"><span>${label}</span><span class="score-badge">${x.score}/${x.max} · ${pct}%</span></div>
      <div class="score-reason">${escapeHtml(x.reason||"Score is based on inspected evidence; missing evidence is not assumed.")}</div>
    </div>`;
  }).join("");
  document.getElementById("realFeedback").textContent=d.summary;
  document.getElementById("evidenceList").innerHTML=d.evidence.map(x=>`<div class="evidence-item ${x.level==="warning"?"warning":""}"><b>${x.type}:</b> ${x.text}</div>`).join("");
  renderEvidenceExplorer(d);
  renderArchitecture(d);
  renderSecurity(d);
  renderExecution(d);
  renderImprovementCopilot(d);
  saveSubmission(d);
  renderHistory();
  renderAnalytics();
}

function showIntelTab(name){
  const names=["evidence","architecture","security","execution"];
  names.forEach(n=>{
    const el=document.getElementById("intel"+n.charAt(0).toUpperCase()+n.slice(1));
    if(el)el.style.display=n===name?"block":"none";
  });
  document.querySelectorAll(".intel-tab").forEach((b,i)=>b.classList.toggle("active",names[i]===name));
}

function renderEvidenceExplorer(d){
  const box=document.getElementById("evidenceExplorer");
  if(!box)return;
  const maxBy={
    "Problem definition":d.categories.problem_definition,
    "AI implementation":d.categories.ai_implementation,
    "Code quality":d.categories.code_quality,
    "Documentation":d.categories.documentation,
    "Reproducibility":d.categories.reproducibility,
    "Results / validation":d.categories.results_validation
  };
  const details=d.evidence||[];
  box.innerHTML=Object.entries(maxBy).map(([name,v])=>{
    const related=details.filter(x=>x.type.toLowerCase().includes(name.split(" ")[0].toLowerCase()) || (name==="AI implementation" && /ai|model|training|metric/i.test(x.type)));
    const text=related.length?related.map(x=>x.text).join(" "):"No category-specific evidence was returned.";
    const cls=v.score/v.max>=.75?"ev-good":v.score===0?"ev-warning":"";
    return `<details class="evidence-card" open>
      <summary><span>${name}</span><span class="ev-score ${cls}">${v.score}/${v.max} · Why?</span></summary>
      <div class="ev-detail">${escapeHtml(text)}</div>
    </details>`;
  }).join("");
}
function renderArchitecture(d){
  const box=document.getElementById("architectureMap");
  box.innerHTML=(d.architecture||[]).map(x=>`<div class="arch-node"><b>${escapeHtml(x.name)}</b><small>${escapeHtml(x.status)} · ${escapeHtml(x.detail)}</small></div>`).join("");
}
function renderSecurity(d){
  const box=document.getElementById("securityScan");
  box.innerHTML=(d.security||[]).map(x=>`<div class="security-item ${x.level==="warn"?"security-warn":"security-ok"}"><b>${escapeHtml(x.name)} · ${escapeHtml(x.status)}</b><small>${escapeHtml(x.detail)}</small></div>`).join("");
}
function renderExecution(d){
  const e=d.execution||{};
  document.getElementById("executionReport").innerHTML=`
    <div class="exec-card"><b>${e.readiness}%</b><small>Execution readiness</small></div>
    <div class="exec-card"><b>${e.syntax_ok}/${e.python_files_checked}</b><small>Python syntax checks passed</small></div>
    <div class="exec-card"><b>${e.test_detected?"YES":"NO"}</b><small>Tests detected</small></div>
    <div class="exec-card"><b>${e.dependency_config?"YES":"NO"}</b><small>Dependency config</small></div>
    <div class="exec-card" style="grid-column:1/-1"><small>${escapeHtml(e.note||"")}</small></div>`;
}
function renderImprovementCopilot(d){
  const current=d.score,target=90,gap=Math.max(0,target-current);
  document.getElementById("copilotCurrent").textContent=current;
  document.getElementById("copilotGap").textContent=gap;
  const cats=d.categories;
  const candidates=[
    ["Documentation","Add a complete README with installation, architecture, methodology, dataset, results and limitations.",15-cats.documentation.score,15],
    ["Results & validation","Add documented validation metrics, test-set methodology and baseline/comparison evidence.",20-cats.results_validation.score,20],
    ["Reproducibility","Add dependency versions, setup commands, environment details and reproducibility controls.",15-cats.reproducibility.score,15],
    ["Code quality","Add modular functions, error handling, dependency configuration and tests.",20-cats.code_quality.score,20],
    ["AI implementation","Add actual model/algorithm logic, training/inference and dataset-backed evidence. Libraries alone do not count.",20-cats.ai_implementation.score,20],
    ["Problem definition","Document the problem, objective, inputs, outputs and target clearly.",10-cats.problem_definition.score,10]
  ].filter(x=>x[2]>0).sort((a,b)=>b[2]-a[2]).slice(0,4);
  document.getElementById("improvementRoadmap").innerHTML=candidates.length?candidates.map((x,i)=>`<div class="roadmap-item"><span class="priority">${i+1}</span><div><b>${x[0]}</b><small>${x[1]}</small></div><span class="impact">+${Math.min(x[2],gap||x[2])}</span></div>`).join(""):`<div class="empty-intel">Your project already meets the 90-point target based on current evidence.</div>`;
}
function generateImprovementChecklist(){
  if(!window.lastEvaluation){showToast("Evaluate a project first.");return}
  const d=window.lastEvaluation,c=d.categories;
  const items=[];
  if(c.results_validation.score<20)items.push("Add a documented validation/test methodology and at least two meaningful performance metrics.");
  if(c.ai_implementation.score<18)items.push("Document actual model/algorithm code, training/inference flow and dataset usage.");
  if(c.documentation.score<15)items.push("Expand README with installation, architecture, methodology, dataset, results and limitations.");
  if(c.reproducibility.score<15)items.push("Pin dependencies and add exact setup/run commands plus environment/version details.");
  if(c.code_quality.score<18)items.push("Improve modularity, error handling and automated tests.");
  if(c.problem_definition.score<10)items.push("Add a clear problem statement with objective, inputs, outputs and target.");
  const box=document.getElementById("improvementRoadmap");
  box.innerHTML=items.map((x,i)=>`<div class="roadmap-item"><span class="priority">✓</span><div><b>Priority ${i+1}</b><small>${escapeHtml(x)}</small></div><span class="impact">ACTION</span></div>`).join("")||'<div class="empty-intel">No missing rubric evidence detected.</div>';
  showToast("Improvement checklist generated");
}
function saveSubmission(d){
  const history=JSON.parse(localStorage.getItem("nxtwaveEvaluationHistory")||"[]");
  const item={date:new Date().toLocaleString(),score:d.score,source:d.source_label||"Project",files:d.files_inspected,confidence:d.confidence,categories:d.categories};
  history.push(item);
  localStorage.setItem("nxtwaveEvaluationHistory",JSON.stringify(history.slice(-10)));
}
function renderHistory(){
  const h=JSON.parse(localStorage.getItem("nxtwaveEvaluationHistory")||"[]");
  const chart=document.getElementById("historyChart"),table=document.getElementById("historyTable"),delta=document.getElementById("historyDelta");
  if(!h.length){chart.innerHTML='<div class="empty-intel">Your submission history will appear here after the first evaluation.</div>';return}
  chart.innerHTML=h.map((x,i)=>`<div class="history-bar"><b>${x.score}</b><i style="height:${Math.max(6,x.score)}%"></i><small>V${i+1}</small></div>`).join("");
  table.innerHTML=h.slice().reverse().map((x,i)=>`<div class="history-row"><span>V${h.length-i}</span><span>${x.source}</span><b>${x.score}/100</b><span>${x.date}</span></div>`).join("");
  if(h.length>1){const d=h[h.length-1].score-h[h.length-2].score;delta.textContent=(d>=0?"+":"")+d+" vs previous"}
  else delta.textContent="First submission";
}
function renderAnalytics(){
  const h=JSON.parse(localStorage.getItem("nxtwaveEvaluationHistory")||"[]");
  document.getElementById("analyticsEvaluations").textContent=96+h.length;
  if(!h.length)return;
  const avg=h.reduce((a,x)=>a+x.score,0)/h.length;
  document.getElementById("analyticsAverage").textContent=avg.toFixed(1);
  const imp=h.length>1?(h[h.length-1].score-h[0].score)/(h.length-1):0;
  document.getElementById("analyticsImprovement").textContent=(imp>=0?"+":"")+imp.toFixed(1);
  const tests=h.length;document.getElementById("analyticsTests").textContent="Tracked";
  const d=window.lastEvaluation;
  if(d){
    const weak=Object.entries(d.categories).sort((a,b)=>a[1].score/a[1].max-b[1].score/b[1].max)[0];
    document.getElementById("healthSummary").textContent=`Current project health: ${d.score}/100. Highest-priority gap: ${weak[0].replace(/_/g," ")}. ${d.files_inspected} files inspected with ${d.confidence.toLowerCase()} confidence.`;
  }
}
function escapeHtml(s){
  return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
function buildReportHtml(d){
  const rows=Object.entries(d.categories).map(([k,v])=>`<tr><td>${k.replace(/_/g," ")}</td><td>${v.score}/${v.max}</td></tr>`).join("");
  const ev=(d.evidence||[]).map(x=>`<li><b>${escapeHtml(x.type)}:</b> ${escapeHtml(x.text)}</li>`).join("");
  const sec=(d.security||[]).map(x=>`<li>${escapeHtml(x.name)} — ${escapeHtml(x.status)}: ${escapeHtml(x.detail)}</li>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>NxtWave Project Evaluation Report</title><style>body{font:14px Arial;max-width:900px;margin:40px auto;color:#153b63}h1{color:#1264e8}table{width:100%;border-collapse:collapse}td,th{padding:10px;border-bottom:1px solid #ddd;text-align:left}.score{font-size:42px;font-weight:800;color:#1264e8}.box{padding:16px;background:#f4f8fc;border-radius:10px;margin:15px 0}li{margin:8px 0}</style></head><body><h1>NxtWave AI Build Sprint</h1><p>Evidence-based Project Evaluation</p><div class="score">${d.score}/100</div><div class="box">${escapeHtml(d.summary)}</div><h2>Rubric</h2><table><tr><th>Category</th><th>Score</th></tr>${rows}</table><h2>Evidence</h2><ul>${ev}</ul><h2>Security Scan</h2><ul>${sec}</ul><h2>Architecture</h2><ul>${(d.architecture||[]).map(x=>`<li><b>${escapeHtml(x.name)}</b> — ${escapeHtml(x.detail)}</li>`).join("")}</ul><p>Generated by NxtWave AI Build Sprint.</p></body></html>`;
}
function downloadEvaluationReport(){
  if(!window.lastEvaluation){showToast("Evaluate a project first.");return}
  const blob=new Blob([buildReportHtml(window.lastEvaluation)],{type:"text/html"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="NxtWave_Project_Evaluation_Report.html";a.click();URL.revokeObjectURL(a.href);
}
function printEvaluationReport(){
  if(!window.lastEvaluation){showToast("Evaluate a project first.");return}
  const w=window.open("","_blank");w.document.write(buildReportHtml(window.lastEvaluation));w.document.close();w.focus();setTimeout(()=>w.print(),250);
}
renderHistory();
renderAnalytics();
refreshAccountUI();


// ===== V20 Premium NxtWave AI Assistant =====
function applyTheme(theme){
  document.body.classList.toggle("theme-dark",theme==="dark");
  const bright=document.getElementById("brightThemeBtn"),dark=document.getElementById("darkThemeBtn");
  if(bright)bright.classList.toggle("active",theme==="bright");
  if(dark)dark.classList.toggle("active",theme==="dark");
  localStorage.setItem("nxtwaveTheme",theme);
}
function setThemeChoice(theme){applyTheme(theme)}
(function(){applyTheme(localStorage.getItem("nxtwaveTheme")||"bright")})();

function toggleChat(){
  const c=document.getElementById("chat");
  if(!c)return;
  c.classList.toggle("show");
  if(c.classList.contains("show")){
    setTimeout(()=>document.getElementById("chatInput")?.focus(),180);
  }
}
function escapeChatHtml(value){
  return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function formatChatText(text){
  let s=escapeChatHtml(text);
  s=s.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>");
  s=s.replace(/`([^`]+)`/g,"<code>$1</code>");
  s=s.replace(/\n/g,"<br>");
  return s;
}
function addChatMessage(text,type){
  const body=document.getElementById("chatBody");if(!body)return;
  const d=document.createElement("div");d.className="msg "+type;
  d.innerHTML=formatChatText(text);
  body.appendChild(d);body.scrollTop=body.scrollHeight;
}
function showChatTyping(){
  const body=document.getElementById("chatBody");
  const d=document.createElement("div");d.className="msg bot chat-typing";d.id="chatTyping";
  d.innerHTML="<i></i><i></i><i></i>";body.appendChild(d);body.scrollTop=body.scrollHeight;
}
function hideChatTyping(){document.getElementById("chatTyping")?.remove()}

async function getChatAnswer(q){
  showChatTyping();
  try{
    const r=await fetch("/api/chat",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({message:q,evaluation:window.lastEvaluation||null})
    });
    const d=await r.json();
    if(!r.ok)throw new Error(d.error||"Assistant unavailable");
    await new Promise(resolve=>setTimeout(resolve,420));
    hideChatTyping();
    addChatMessage(d.answer||"I couldn't answer that right now.","bot");
    if(d.action){
      const body=document.getElementById("chatBody");
      const wrap=document.createElement("div");wrap.className="chat-action";
      const btn=document.createElement("button");btn.textContent=d.action.label;
      btn.onclick=()=>runChatAction(d.action.type);wrap.appendChild(btn);body.appendChild(wrap);body.scrollTop=body.scrollHeight;
    }
  }catch(e){
    hideChatTyping();
    addChatMessage("I couldn't connect to the assistant right now. Please try again in a moment.","bot");
  }
}
async function sendChat(){
  const input=document.getElementById("chatInput"),q=input?.value.trim();
  if(!q)return;
  input.value="";addChatMessage(q,"user");await getChatAnswer(q);
}
async function ask(q){
  addChatMessage(q,"user");await getChatAnswer(q);
}
function quickAction(type){
  if(type==="register"){addChatMessage("🚀 Register for the workshop","user");getChatAnswer("How do I register?");return}
  if(type==="evaluate"){addChatMessage("📊 Evaluate my project","user");getChatAnswer("How does project evaluation work?");return}
  if(type==="referral"){addChatMessage("🎁 Referral program","user");getChatAnswer("How do referrals work?");return}
  if(type==="workshop"){addChatMessage("⚡ Workshop details","user");getChatAnswer("What is the NxtWave workshop and what will I build?");return}
}
function runChatAction(type){
  if(type==="register"){toggleChat();openModal();return}
  if(type==="evaluate"){toggleChat();scrollToId("evaluation");return}
  if(type==="referral"){toggleChat();scrollToId("referrals");return}
  if(type==="workshop"){toggleChat();window.scrollTo({top:0,behavior:"smooth"});return}
}
