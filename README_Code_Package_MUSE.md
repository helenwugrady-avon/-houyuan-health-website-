# Houyuan Health Website — Code Package / 院后健康平台网站代码包

Updated 2026-11-27. This package holds the current prototype code, matching the checked live website.

2026-11-26 updates: 中文 | English language switch (Chinese default, one language at a time); new 补录中心 Catch-up entries page (missed entries filed centrally — patient, type, belongs-to date, linked service, one file, entered-by — and shown in their proper place as one record); roles aligned to the MDT structure (YH-PLAT-ORG-001/002) with per-role page access; roles, duties, services and clients linked both ways; red status carries the 48-hour MDT-review rule; Work Progress notes closable; welcome-box wording tidied.

2026-11-27 update: the two handover downloads on the team page (technical-documentation summary and handover checklist) were corrected to match the current documents — technical documentation YH-TECH-001 v1.3, 44 pages, 17 entities, MDT role list, sitemap 8 pages, handover set in Google Drive "Jiang → Handover files".

Contents: client/ (pages), server/ (actions + schema), drizzle/ (database migrations), app.db (sample database, 14 sample patients), package.json / bun.lock (Bun 1.3.10, React 19, drizzle-orm).

Note: the prototype runs on the Muse-internal @hatch/space-sdk, so this package is a blueprint/reference for the China team's rebuild rather than a standalone runnable site. Real patient data must stay in China (PIPL/DSL/CSL, MLPS 2.0 Level 3); this package contains sample data only.
