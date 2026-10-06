# Real Project Evaluation

Run:
```bash
python server.py
```
Then open http://localhost:8000.

Upload an actual project ZIP. The backend inspects the ZIP and produces an evidence-based score from a transparent rubric. It checks README, source files, dependency files, tests, AI/ML implementation evidence, validation metrics, setup instructions and results evidence.

The chatbot is backend-connected and can explain the score after an evaluation.

This is a genuine evidence-based prototype, not a random score generator. A production-grade evaluator should additionally sandbox-run code, execute tests, inspect a live demo/Git history, and optionally use a secure LLM to interpret the collected evidence. Missing evidence must remain unverified rather than invented.


## Python 3.14 / Windows
This version removes the deprecated/removed `cgi` module and is compatible with Python 3.14.
For Windows, double-click `START_SERVER.bat`, or run:
```powershell
py server.py
```
Then open `http://localhost:8000`.


## V6 upload fix
The `/api/evaluate` endpoint now uses Python's `email` multipart parser, which is available in Python 3.14 and preserves ZIP binary data. The previous hand-written multipart parser could return HTTP 400 when receiving the browser upload.

## V7 UI improvement
During project evaluation, the Analyze button is disabled, shows a spinner and 'Evaluating Project…', prevents duplicate submissions, and is re-enabled only after the request completes.


## V8 Windows file-lock fix
The temporary ZIP file descriptor returned by `tempfile.mkstemp()` is explicitly closed before the file is opened by the evaluator. This fixes Windows `PermissionError(13)` caused by the temporary ZIP being locked by the same Python process.


## V9 UI
- Added Bright/Dark theme switch with localStorage persistence.
- Added a prominent NxtWave AI Assistant chatbot launcher.
- Chatbot can answer workshop, registration and referral questions and can explain the latest project evaluation when an evaluation is available.


## V11 project sources
The evaluator now accepts either:
1. A project ZIP upload.
2. A public GitHub repository URL.

For GitHub, the backend downloads the public repository archive from GitHub's codeload service and runs the same evidence-based inspection on the actual repository files. Private repositories are not supported by this prototype.


## V13 strict scoring
The evaluator is intentionally conservative. Importing pandas, NumPy, sklearn, TensorFlow or similar libraries does not itself prove an AI implementation. AI implementation points require recognizable model/algorithm logic plus training/inference evidence; higher scores additionally require dataset and validation evidence. Missing evidence receives zero for the relevant criterion rather than an assumed score.


## V15 Project Intelligence Suite
The platform now adds an explainable Evidence Explorer, repository architecture detection, static security checks, a safe non-executing execution preflight, an Improvement Copilot, resubmission history, a professional downloadable report, and aggregate workshop analytics. Uploaded project code is not directly executed on the host.
