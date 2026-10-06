import os,json,re,zipfile,tempfile,shutil
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from email.parser import BytesParser
from email.policy import default
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from urllib.parse import urlparse

ROOT=Path(__file__).parent.resolve()
TEXT={".py",".js",".ts",".jsx",".tsx",".java",".c",".cpp",".h",".hpp",".ipynb",".md",".txt",".html",".css",".json",".yaml",".yml",".toml",".ini",".sql",".r",".m"}
AI=["sklearn","scikit-learn","tensorflow","keras","torch","pytorch","transformers","xgboost","lightgbm","opencv","cv2","pandas","numpy","model.fit","predict(","train_test_split","classification","regression","neural network","cnn","lstm","bert","embedding","llm","langchain"]
MET=["accuracy","precision","recall","f1","auc","rmse","mae","mse","r2","roc_auc","classification_report"]
PROB=["problem statement","objective","motivation","use case","goal"]
SETUP=["installation","install","requirements","setup","usage","how to run","run locally"]
RESULT=["results","evaluation","experiment","performance","validation","findings"]

def txt(p):
    try:return p.read_text(encoding="utf-8",errors="ignore")[:250000]
    except:return ""


def github_repo_from_url(value):
    u=value.strip()
    if not u.startswith(("http://","https://")):
        u="https://"+u
    m=re.match(r'^https?://(?:www\.)?github\.com/([^/]+)/([^/#?]+)',u,re.I)
    if not m: raise ValueError("Enter a valid GitHub repository URL, for example https://github.com/user/project")
    owner=m.group(1); repo=m.group(2).removesuffix(".git")
    if not owner or not repo: raise ValueError("Invalid GitHub repository URL")
    return owner,repo

def download_github_zip(repo_url):
    owner,repo=github_repo_from_url(repo_url)
    # GitHub's codeload endpoint returns the repository source archive.
    urls=[
        f"https://codeload.github.com/{owner}/{repo}/zip/refs/heads/main",
        f"https://codeload.github.com/{owner}/{repo}/zip/refs/heads/master"
    ]
    last_error=None
    for u in urls:
        try:
            req=Request(u,headers={"User-Agent":"NxtWave-AI-Build-Sprint/11","Accept":"application/zip"})
            with urlopen(req,timeout=20) as response:
                data=response.read(50*1024*1024+1)
            if len(data)>50*1024*1024: raise ValueError("GitHub repository archive exceeds the 50 MB limit.")
            if not data.startswith(b"PK"): raise ValueError("GitHub did not return a valid ZIP archive.")
            fd,name=tempfile.mkstemp(suffix=".zip")
            os.close(fd)
            p=Path(name);p.write_bytes(data)
            return p,f"github.com/{owner}/{repo}"
        except (HTTPError,URLError,ValueError) as ex:
            last_error=ex
    raise ValueError(f"Could not download the public GitHub repository. Check that it is public and that the URL is correct. {last_error}")


STRICT_RUBRIC = {
    "problem_definition": {"max":10},
    "ai_implementation": {"max":20},
    "code_quality": {"max":20},
    "documentation": {"max":15},
    "reproducibility": {"max":15},
    "results_validation": {"max":20},
}

def has_any(corpus, terms):
    return any(t in corpus for t in terms)

def strict_scores(files, corpus, readme_text, dep, tests):
    """
    Strict evidence-first scoring:
    - Libraries alone NEVER prove an AI implementation.
    - A project can score 0 in AI implementation if actual model/training/inference
      evidence is absent.
    - Missing evidence is scored as missing, not inferred.
    """
    code_files=[p for p in files if p.suffix.lower() in TEXT]
    py_js_code="\n".join(txt(p).lower() for p in code_files)

    # Problem: requires an explicit, substantive statement.
    problem_terms=[
        "problem statement","problem definition","objective","project objective",
        "aim of the project","purpose of the project","proposed system",
        "this project aims","we propose","goal of this project"
    ]
    problem_hits=[t for t in problem_terms if t in corpus]
    problem=0
    if readme_text and len(readme_text.split())>=80 and problem_hits:
        problem=8
        if has_any(readme_text.lower(),["input","output","dataset","user","target","prediction","classification","regression"]):
            problem=10
    elif problem_hits:
        problem=5

    # AI: libraries do not count. Require genuine model/training/inference evidence.
    ai_library_hits=sorted(set(x for x in AI if x in corpus))
    model_terms=[
        "model.fit(","model.fit (","fit(","predict(","predict_proba(",
        "forward(","backward(","optimizer","loss.backward",
        "compile(","fit_generator(","trainer(","train_model(",
        "pipeline(","gridsearchcv(","randomizedsearchcv("
    ]
    algorithm_terms=[
        "randomforest","random_forest","decisiontree","decision_tree",
        "logisticregression","linearregression","svm(","svc(","xgbclassifier",
        "xgbregressor","lgbmclassifier","lgbmregressor","neuralnetwork",
        "sequential(","conv2d(","lstm(","gru(","transformer",
        "bert","resnet","unet","cnn","rnn","gan","autoencoder",
        "isolationforest","kmeans(","dbscan(","naive_bayes","bayesian"
    ]
    train_hits=[t for t in model_terms if t in py_js_code]
    algo_hits=[t for t in algorithm_terms if t in py_js_code]
    metric_hits=sorted(set(x for x in MET if x in corpus))
    dataset_hits=has_any(corpus,["dataset","dataframe","csv","json","parquet","dataloader"])
    actual_ai = bool(algo_hits) and (bool(train_hits) or has_any(py_js_code,["predict","inference","model("]))

    if not actual_ai:
        ai_score=0
    elif algo_hits and train_hits and metric_hits and dataset_hits:
        ai_score=18
        if len(set(algo_hits))>=2 and len(metric_hits)>=3:
            ai_score=20
    elif algo_hits and train_hits and dataset_hits:
        ai_score=13
    elif algo_hits and (train_hits or has_any(py_js_code,["predict","inference"])):
        ai_score=9
    else:
        ai_score=0

    # Code quality: evidence of structure, error handling, tests and dependency management.
    functions=len(re.findall(r'\b(def |function |class )', py_js_code))
    error_handling=has_any(py_js_code,["try:","except ","catch(","throw new error","raise "])
    modular=functions>=5
    if tests and dep and modular and error_handling:
        code=18
    elif dep and modular and error_handling:
        code=14
    elif modular and error_handling:
        code=10
    elif modular or error_handling:
        code=6
    else:
        code=2 if code_files else 0

    # Documentation: README must be meaningful, not merely present.
    words=len(readme_text.split()) if readme_text else 0
    sections=sum(1 for t in ["installation","usage","architecture","methodology","results","dataset","evaluation","limitations"] if t in readme_text.lower())
    docs=0
    if words>=500 and sections>=5: docs=15
    elif words>=300 and sections>=4: docs=12
    elif words>=150 and sections>=3: docs=8
    elif words>=80: docs=4

    # Reproducibility: dependencies + commands + data/model instructions.
    setup_hits=[t for t in SETUP if t in corpus]
    reproducibility=0
    if dep and len(setup_hits)>=2 and has_any(corpus,["python ","pip ","npm ","docker","conda","environment"]):
        reproducibility=12
        if has_any(corpus,["seed","random_state","reproducible","version"]): reproducibility=15
    elif dep and setup_hits: reproducibility=8
    elif dep: reproducibility=4

    # Results: metrics + explicit results + comparison/validation.
    result_terms=["results","experiments","findings","evaluation","performance","validation"]
    result_hits=[t for t in result_terms if t in corpus]
    validation_methods=["cross_val","cross-validation","train_test_split","confusion_matrix","classification_report","roc_auc","test set","validation set","baseline","ablation"]
    validation_hits=[t for t in validation_methods if t in corpus]
    results=0
    if len(metric_hits)>=3 and len(validation_hits)>=2 and result_hits:
        results=20
    elif len(metric_hits)>=2 and validation_hits and result_hits:
        results=14
    elif metric_hits and result_hits:
        results=8
    elif result_hits:
        results=4

    evidence=[
        ("AI evidence", f"AI/ML libraries detected: {', '.join(ai_library_hits[:10])}." if ai_library_hits else "No AI/ML libraries detected."),
        ("Model evidence", f"Model/algorithm implementations detected: {', '.join(sorted(set(algo_hits))[:10])}." if algo_hits else "No recognizable model/algorithm implementation detected."),
        ("Training/inference", f"Training/inference operations detected: {', '.join(sorted(set(train_hits))[:10])}." if train_hits else "No credible training/inference operation detected."),
        ("Metrics", f"Metrics detected: {', '.join(metric_hits)}." if metric_hits else "No standard model-performance metrics detected."),
        ("Strict rule", "AI libraries alone do NOT earn AI implementation points; actual model logic is required.")
    ]
    # Explain every score explicitly. The reason is derived from the same
    # evidence used for scoring; the UI never invents a reason after the fact.
    reasons = {
        "problem_definition": (
            f"{problem}/10 because an explicit problem/objective statement was "
            f"{'supported by the inspected README/source evidence' if problem >= 5 else 'not sufficiently supported by the inspected evidence'}. "
            f"Clear inputs/outputs and project context are required for full credit."
        ),
        "ai_implementation": (
            f"{ai_score}/20 because "
            f"{'actual model/algorithm plus training/inference evidence was found' if actual_ai else 'no credible model/algorithm training or inference evidence was found'}. "
            f"Detected AI libraries alone never count as proof; dataset-backed implementation and validation are required for high scores."
        ),
        "code_quality": (
            f"{code}/20 based on modular structure, error handling, dependency configuration and tests. "
            f"Detected {functions} function/class declarations, "
            f"{'error handling' if error_handling else 'no clear error handling'}, and "
            f"{'test evidence' if tests else 'no test evidence'}."
        ),
        "documentation": (
            f"{docs}/15 based on README depth: {words} words and {sections} relevant documentation sections were detected. "
            f"Full credit requires comprehensive setup, usage, architecture/methodology, dataset, results and limitations."
        ),
        "reproducibility": (
            f"{reproducibility}/15 based on dependency and setup evidence. "
            f"{'Dependency configuration was found' if dep else 'No standard dependency configuration was found'}, "
            f"with {len(setup_hits)} setup-related signals detected. "
            f"Environment/version and reproducibility controls are required for full credit."
        ),
        "results_validation": (
            f"{results}/20 based on {len(metric_hits)} metric signals, {len(validation_hits)} validation-method signals, "
            f"and {'explicit results/experiment evidence' if result_hits else 'no clear results/experiment section'}. "
            f"Full credit requires measurable results plus rigorous validation."
        )
    }
    cats={
        "problem_definition":{"score":problem,"max":10,"reason":reasons["problem_definition"]},
        "ai_implementation":{"score":ai_score,"max":20,"reason":reasons["ai_implementation"]},
        "code_quality":{"score":code,"max":20,"reason":reasons["code_quality"]},
        "documentation":{"score":docs,"max":15,"reason":reasons["documentation"]},
        "reproducibility":{"score":reproducibility,"max":15,"reason":reasons["reproducibility"]},
        "results_validation":{"score":results,"max":20,"reason":reasons["results_validation"]}
    }
    return cats,evidence


def architecture_analysis(files, corpus):
    names={p.name.lower() for p in files}
    suffixes={p.suffix.lower() for p in files}
    nodes=[]
    if any(s in suffixes for s in {".html",".css",".jsx",".tsx",".js"}):
        nodes.append({"name":"Frontend","status":"Detected","detail":"Web UI / client-side source found."})
    if any(s in suffixes for s in {".py",".java",".cpp",".c",".js",".ts"}):
        nodes.append({"name":"Application","status":"Detected","detail":"Application/backend source files found."})
    if any(x in corpus for x in ["sql","sqlite","postgres","mysql","mongodb","database"]):
        nodes.append({"name":"Data layer","status":"Detected","detail":"Database or persistence evidence found."})
    if any(x in corpus for x in AI):
        nodes.append({"name":"AI / ML","status":"Detected","detail":"AI/ML tooling or implementation evidence found."})
    if any("test" in p.name.lower() or "tests" in [x.lower() for x in p.parts] for p in files):
        nodes.append({"name":"Testing","status":"Detected","detail":"Test files/directories found."})
    if any(p.name.lower() in {"dockerfile","docker-compose.yml","vercel.json","render.yaml"} for p in files):
        nodes.append({"name":"Deployment","status":"Detected","detail":"Deployment configuration found."})
    return nodes or [{"name":"Repository","status":"Detected","detail":"Source repository inspected."}]

def security_scan(files, corpus):
    findings=[]
    secret_patterns=[
        ("Potential API key", r"api[_-]?key\s*[:=]\s*['\"][A-Za-z0-9_\-]{12,}"),
        ("Potential secret", r"secret\s*[:=]\s*['\"][^'\"]{8,}"),
        ("Private key","-----begin (rsa|ec|openssh) private key-----"),
        ("Password literal", r"password\s*[:=]\s*['\"][^'\"]{6,}"),
    ]
    suspicious=[]
    for p in files:
        if p.suffix.lower() not in TEXT or p.name.lower() in {"package-lock.json","yarn.lock"}:
            continue
        body=txt(p).lower()
        for label,pat in secret_patterns:
            if re.search(pat,body,re.I):
                suspicious.append((label,p.name))
    if suspicious:
        findings.append({"name":"Credential exposure","status":"Review","detail":"Potential hard-coded secret pattern found; inspect before publishing.","level":"warn"})
    else:
        findings.append({"name":"Credential exposure","status":"No obvious pattern","detail":"No common hard-coded secret pattern was detected by the static scan.","level":"ok"})
    if ".gitignore" not in {p.name.lower() for p in files}:
        findings.append({"name":".gitignore","status":"Missing","detail":"Add a .gitignore to reduce accidental secret/artifact commits.","level":"warn"})
    else:
        findings.append({"name":".gitignore","status":"Present","detail":"Repository includes a .gitignore file.","level":"ok"})
    if any("eval(" in txt(p).lower() or "exec(" in txt(p).lower() for p in files if p.suffix.lower() in {".py",".js",".ts"}):
        findings.append({"name":"Dynamic execution","status":"Review","detail":"eval/exec usage detected; review input flow carefully.","level":"warn"})
    else:
        findings.append({"name":"Dynamic execution","status":"No obvious usage","detail":"No eval/exec pattern detected in scanned source files.","level":"ok"})
    return findings

def safe_execution_preflight(files, dep, tests, corpus):
    py_files=[p for p in files if p.suffix.lower()==".py"][:100]
    syntax_ok=0
    syntax_fail=0
    for p in py_files:
        try:
            compile(txt(p),str(p),"exec")
            syntax_ok+=1
        except Exception:
            syntax_fail+=1
    commands=[]
    if any(p.name.lower()=="requirements.txt" for p in files): commands.append("pip install -r requirements.txt")
    if any(p.name.lower()=="package.json" for p in files): commands.append("npm install")
    if tests: commands.append("test suite detected")
    readiness=100
    if not dep: readiness-=25
    if not tests: readiness-=25
    if syntax_fail: readiness-=min(35,syntax_fail*10)
    return {
        "mode":"Static safe preflight",
        "python_files_checked":len(py_files),
        "syntax_ok":syntax_ok,
        "syntax_failed":syntax_fail,
        "test_detected":tests,
        "dependency_config":dep,
        "suggested_commands":commands,
        "readiness":max(0,readiness),
        "note":"Uploaded code is not executed directly on the host. This preflight checks syntax and execution readiness without running untrusted project code."
    }

def analyze(zpath):
    if zpath.stat().st_size>50*1024*1024:raise ValueError("ZIP exceeds 50 MB")
    tmp=Path(tempfile.mkdtemp())
    try:
        with zipfile.ZipFile(zpath) as z:z.extractall(tmp)
        items=list(tmp.iterdir());root=items[0] if len(items)==1 and items[0].is_dir() else tmp
        files=[p for p in root.rglob("*") if p.is_file() and ".git" not in p.parts and "__pycache__" not in p.parts]
        texts=[txt(p) for p in files if p.suffix.lower() in TEXT]
        corpus="\n".join(texts).lower()
        readme=next((p for p in files if p.name.lower() in ("readme.md","readme.txt","readme.rst")),None)
        dep=any(p.name.lower() in ("requirements.txt","pyproject.toml","package.json","pom.xml","build.gradle") for p in files)
        tests=any("test" in p.name.lower() or "tests" in [x.lower() for x in p.parts] for p in files)
        ai=sorted(set(x for x in AI if x in corpus));met=sorted(set(x for x in MET if x in corpus))
        evidence=[]
        def E(t,s,w=False):evidence.append({"type":t,"text":s,"level":"warning" if w else "ok"})
        E("Repository",f"{len(files)} files inspected.")
        E("README",f"README found ({len(txt(readme).split())} words)." if readme else "README not found.",not bool(readme))
        E("Dependencies","Dependency/configuration file detected." if dep else "No standard dependency file detected.",not dep)
        E("AI implementation",f"Detected: {', '.join(ai[:12])}." if ai else "No strong AI/ML implementation evidence detected.",not bool(ai))
        E("Validation",f"Detected metrics/evaluation evidence: {', '.join(met)}." if met else "No standard model-performance metrics detected.",not bool(met))
        E("Testing","Test files/directories detected." if tests else "No test files detected.",not tests)
        E("Problem","Problem/objective language found." if any(x in corpus for x in PROB) else "No clear problem statement detected.",not any(x in corpus for x in PROB))
        E("Reproducibility","Setup/run instructions detected." if any(x in corpus for x in SETUP) else "No clear setup/run instructions detected.",not any(x in corpus for x in SETUP))
        E("Results","Results/experiment/evaluation evidence detected." if any(x in corpus for x in RESULT) else "No clear results section detected.",not any(x in corpus for x in RESULT))
        readme_text=txt(readme) if readme else ""
        cats,strict_evidence=strict_scores(files,corpus,readme_text,dep,tests)
        for et,etxt in strict_evidence:
            E(et,etxt, et in ("Model evidence","Training/inference","Metrics") and ("No " in etxt or "not" in etxt.lower()))
        total=sum(x["score"] for x in cats.values())
        conf="High" if readme and any(x["score"]>=0.75*x["max"] for x in cats.values()) and cats["ai_implementation"]["score"]>=13 else "Medium" if readme else "Low"
        architecture=architecture_analysis(files,corpus)
        security=security_scan(files,corpus)
        execution=safe_execution_preflight(files,dep,tests,corpus)
        return {"score":total,"confidence":conf,"files_inspected":len(files),"evidence_count":len(evidence),"categories":cats,"evidence":evidence,"architecture":architecture,"security":security,"execution":execution,"summary":f"Final score {total}/100 from inspected evidence. Missing evidence is not assumed to exist."}
    finally:shutil.rmtree(tmp,ignore_errors=True)

def chat(q,e=None):
    q=q.lower()
    if e and any(k in q for k in ("score","why","evaluation","project","feedback")):
        cats=e["categories"];weak=sorted(cats.items(),key=lambda kv:kv[1]["score"]/kv[1]["max"])[:2]
        return f"Your project scored {e['score']}/100 with {e['confidence'].lower()} confidence. The two weakest evidence areas are {weak[0][0].replace('_',' ')} ({weak[0][1]['score']}/{weak[0][1]['max']}) and {weak[1][0].replace('_',' ')} ({weak[1][1]['score']}/{weak[1][1]['max']}). The score is based on files actually inspected."
    if "referral" in q or "code" in q:return "Your demo referral code is VISWESH23. Verified registrations increase the referral tracker and campus ranking."
    if "register" in q or "otp" in q:return "Register with your name, college, email and mobile number, then verify the 6-digit OTP."
    if "evaluat" in q:return "Upload the actual project ZIP. I inspect its source files, README, dependencies, tests, AI/ML evidence and validation metrics. I do not invent missing evidence."
    if "build" in q or "workshop" in q:return "The workshop is a 60-minute hands-on AI build followed by project submission and evidence-based feedback."
    return "I can help with registration, referrals, the workshop and your project evaluation."

class H(SimpleHTTPRequestHandler):
    def post(self,obj,status=200):
        raw=json.dumps(obj).encode();self.send_response(status);self.send_header("Content-Type","application/json");self.send_header("Content-Length",str(len(raw)));self.end_headers();self.wfile.write(raw)
    def do_POST(self):
        p=urlparse(self.path).path
        try:
            if p=="/api/evaluate":
                c=self.headers.get("Content-Type","")
                if "multipart/form-data" not in c:
                    raise ValueError("Expected multipart/form-data")
                length=int(self.headers.get("Content-Length","0"))
                body=self.rfile.read(length)
                raw=b"Content-Type: "+c.encode("utf-8")+b"\r\nMIME-Version: 1.0\r\n\r\n"+body
                msg=BytesParser(policy=default).parsebytes(raw)

                project_bytes=None
                github_url=""
                demo_url=""
                if msg.is_multipart():
                    for part in msg.iter_parts():
                        name=part.get_param("name",header="content-disposition")
                        value=part.get_payload(decode=True)
                        if name=="project":
                            project_bytes=value
                        elif name=="github_url":
                            github_url=(value or b"").decode("utf-8","ignore").strip()
                        elif name=="demo_url":
                            demo_url=(value or b"").decode("utf-8","ignore").strip()

                tmp=None
                source_label="Uploaded project"
                try:
                    if project_bytes:
                        if not project_bytes.startswith(b"PK"):
                            raise ValueError("The uploaded file is not a valid ZIP archive.")
                        fd,tmp_name=tempfile.mkstemp(suffix=".zip")
                        os.close(fd)
                        tmp=Path(tmp_name)
                        tmp.write_bytes(project_bytes)
                    elif github_url:
                        tmp,source_label=download_github_zip(github_url)
                    else:
                        raise ValueError("Choose a project ZIP or provide a public GitHub repository URL.")

                    result=analyze(tmp)
                    result["source_label"]=source_label
                    result["github_url"]=github_url
                    result["demo_url"]=demo_url
                    self.post(result)
                finally:
                    if tmp is not None:
                        try: tmp.unlink(missing_ok=True)
                        except PermissionError: pass

            elif p=="/api/chat":
                n=int(self.headers.get("Content-Length","0"));d=json.loads(self.rfile.read(n) or "{}");self.post({"answer":chat(d.get("message",""),d.get("evaluation"))})
            else:self.send_error(404)
        except Exception as ex:
            print("API ERROR:", repr(ex), flush=True)
            self.post({"error":str(ex)},400)

if __name__=="__main__":
    os.chdir(ROOT);print("NxtWave evaluator: http://localhost:8000");ThreadingHTTPServer(("0.0.0.0",8000),H).serve_forever()
