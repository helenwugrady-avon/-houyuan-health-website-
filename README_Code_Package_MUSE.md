# Houyuan Health Website — Code Package / 网站代码包

Prepared for Helen's team and partners, 2026-11-25.
公司：院后健康咨询（四川）有限公司 · Houyuan Health

## What this is / 这是什么

The complete code of the Houyuan Health platform prototype, built with Muse.
Your programmers can open it, run it, and build on it — no need to start from zero.

这是 Houyuan Health 平台原型的全部代码，由 Muse 搭建。技术团队可以直接打开、运行、在此基础上继续开发。

## What's inside / 里面有什么

- `client/` — the website pages people see and tap （页面： 今日、患者、员工录入、患者手机端、资源等）
- `server/` — the part behind the scenes that saves and checks the data （保存数据的部分）
- `drizzle/` — the database plan: how the tables are built （数据库建表计划）
- `DATA-PLAN.md` — the data plan: every table, where each piece of data comes from, and who may enter it
- `app.db` — the prototype's database as it stands now, with the 14 sample patients （示例数据，可查看结构）
- `package.json` + `bun.lock` — the setup list a programmer needs to run the project

## Notes / 说明

- The big library folder (node_modules) is not included — it is standard and can be installed again from `package.json`. （公共库未打包，按 package.json 重新安装即可。）
- This is a working prototype that runs as a Muse app. The real website is to be built and hosted in China by the China team, following the Technical Documentation (YH-TECH-001), which sits in the same Drive "Handover files" folder.
- All patient data in this package is sample data. Real patient data must stay in China, per the compliance notes in the technical documentation.
