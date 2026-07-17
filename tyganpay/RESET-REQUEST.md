# TyganPay invite reset request

Copy/paste to TyganPay admin or Sylvain:

---

Subject: Reset Nova Bank client onboarding invite (view limit exhausted)

Hello,

Please reset or re-issue the Nova Bank client onboarding invite. The link is blocked:

- Token: `nova-660c3e14ec7fbc9b7f57ed68a7046b0dd759d466b3a876f2`
- URLs:
  - https://api.tyganpay.com/client-onboarding/nova-660c3e14ec7fbc9b7f57ed68a7046b0dd759d466b3a876f2
  - https://test.tyganpay.com/client-onboarding/nova-660c3e14ec7fbc9b7f57ed68a7046b0dd759d466b3a876f2
- API error: `onboarding_link_view_limit_blocked` (HTTP 423)
- Reason: fixed 15-view client limit exhausted without a submitted change

Client entity for the pack (from Nova Bank live API):

- Legal name: **Nova Bank Malta Ltd**
- Platform operator: **Anakatech LLC**
- Product: Nova Bank Online
- EMI partner (API): OpenPayd
- Review email: novatrusty2@gmail.com
- Privacy: privacy@anakatech.llc

We will submit the completed pack in a single session after reset (company fields + mandatory uploads).

Thank you.

---

After they reply with a new or reset link, update `inviteToken` in:

- `tyganpay/form-payload.json`
- `tyganpay/nova-onboarding-pack.json`
- `ECOSYSTEM.json` → `tyganPay`
