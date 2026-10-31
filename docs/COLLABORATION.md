# 协作规范 · Collaboration Guide

本仓库是 craftos.app（OneLaser Work OS）的前端。线上系统正在被公司员工使用，修改请遵循以下流程。

## 分支与合并

1. 不要直接向 main 推送。main 的 dist/ 或 test/ 一旦变化，会自动触发 GitHub Pages 发布。
2. 每项修改新建分支，命名建议：feature/简述、fix/简述、docs/简述。
3. 完成后开 Pull Request，至少由另一位成员（KC 或工程师）审核后再合并。

## 提交前检查

1. 安装依赖：npm ci
2. 运行测试：npm test（当前基线 147 项全部通过）
3. 在浏览器中手动检查中 / EN 双语、日间 / 夜间主题是否都正常。

## 不能改坏的部分

- 中英双语与日夜主题切换
- 钉钉登录与现有员工权限
- 演示模式（demo）与企业真实模式（live）的隔离：live 模式不得读取演示数据，也不得在后台不可用时退回虚构数据
- 写请求的 CSRF 校验与 401 / 409 处理
- 业务数据与人工验收流程

## 上线流程

前端合并到 main 之后，正式网站 craftos.app 不会自动更新。后台仓库 onelaser-workos-api 构建时固定引用前端版本，需要在后台同步更新版本引用，再通过 Render 发布。详见后台仓库的 README、Dockerfile 和 deploy 目录。

## 密钥

不要把任何令牌、密码或生产配置提交到仓库。生产密钥只在 Render 私有环境变量中管理。
