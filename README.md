# 乡村识字

一个无需后端的识字学习小程序原型，打开 `index.html` 即可运行。

## 已实现

- 一年级上册 24 个示例字卡，展示汉字、拼音和组词
- 浏览器语音发音；支持设备上使用语音识别跟读
- 笔顺演示、触屏/鼠标描红
- 今日任务、复习队列、学习进度和连续学习天数
- 使用 `localStorage` 保存进度，关闭页面后仍然保留
- 儿童端/长辈端切换、无广告和离线使用界面

## 使用

直接用浏览器打开 `index.html`。在移动端或支持触控的电脑上可直接描红；如果浏览器允许麦克风权限，跟读按钮会调用系统语音识别。

## 发布为微信可打开的网页

仓库已附带 GitHub Pages 自动发布工作流：`.github/workflows/pages.yml`。

1. 登录 GitHub，新建一个公开仓库，例如 `village-literacy`。
2. 将本项目的 `index.html`、`styles.css`、`app.js`、`README.md` 和 `.github/workflows/pages.yml` 上传到仓库，目录结构保持不变。
3. 在仓库的 **Settings → Pages → Build and deployment** 中，将 **Source** 设为 **GitHub Actions**。
4. 打开 **Actions**，等待 **Publish website** 运行成功。发布地址格式为 `https://你的GitHub用户名.github.io/village-literacy/`。
5. 用手机微信打开该 HTTPS 地址并转发给其他微信用户。

更新仓库文件后，GitHub Actions 会自动重新发布。GitHub Pages 域名在部分网络环境下可能较慢；如果目标用户无法访问，需要改用国内托管服务和已备案域名。
