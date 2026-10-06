NxtWave AI Build Sprint — Premium Growth OS v3

Registration upgrade:
- Separate first and last name
- College / university
- Validated email with inline error
- Country-code selector
- Validated mobile number
- 6-digit OTP generation
- OTP auto-advance and paste
- OTP expiry
- Resend countdown
- Incorrect OTP handling
- Verified registration success state

IMPORTANT:
This assessment prototype generates the OTP locally and explicitly shows it in Demo Mode so the flow can be demonstrated without a server. In a real deployment, the browser must NOT generate or expose OTPs. Replace sendOTP() with a secure backend/SMS provider and store only the verification result.

Existing V2 features are retained: referral tracker, AI project evaluation prototype, AI message studio, chatbot and NxtWave-themed UI.


V20 UPDATE — PREMIUM AI ASSISTANT
- Redesigned chatbot with premium responsive UI, welcome experience, quick actions, suggested prompts and typing indicator.
- Added contextual assistant responses for registration, referrals, workshop guidance and evidence-based project evaluation.
- Evaluation-aware chat explains the actual inspected score and weakest rubric areas.
- Added action buttons from chat to registration, evaluation and referral sections.
- Added /health endpoint and PORT environment support for Render deployments.
