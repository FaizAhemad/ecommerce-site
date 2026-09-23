# Seller onboarding (MP-02)

Source implementation only; migration, deferred checks and production/device acceptance remain pending.

`/seller` requires login and shows the current account's application. Verified account email is required to submit a UUID-bound shop name, city and product description. No arbitrary email, account ID, banking information or document upload is accepted. One application per account is the bounded initial workflow; multiple shops/staff management remain undecided. Repeating the same saved submission reconciles it; rejected applicants can revise using the current version.

`/admin/sellers` is administrator-only with paginated application review. Decisions require a bounded reason shown to the applicant and the expected version. Pending applications can be approved/rejected; approved shops suspended; suspended shops restored. Approval creates Shop and active ShopMembership in the same serializable transaction as the decision/audit record. Suspension revokes memberships. Restoration reactivates only the applicant's membership. No customer gains User.role ADMIN and no seller product/payout capability is enabled here.

POST seller/application and PATCH admin/sellers retain central CSRF and rate limiting. Seller writes use a dedicated quota; private client requests use session-generation cancellation. Application data is stored under reserved seller-application keys, excluded from generic Settings. Review audit keys retain actor, reason, decision and version. Ordinary seller reads expose only their own application; customer identity/contact data is not published publicly. Missing migrations/provider/database errors never imply approval.

Apply MP-01 ownership migration under MARKETPLACE_MIGRATION.md before approving shops. No additional migration is required for this step. No approval email is sent; application status is visible in the account. Retention, seller agreements and provider onboarding requirements remain owner decisions.

Synthetic tests cover input limits, verified account/derived identity, duplicate submissions, stale review versions and membership binding. Tests have not been run. Database rollback/concurrency, authorization/CSRF, rejected resubmission, suspension/restoration, private cache switching, failed drafts, dialog keyboard/mobile states and production acceptance remain deferred.
