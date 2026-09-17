# 摸鱼 · 小游戏合集

浏览器里即开即玩的个人小游戏门户，类似迷你 4399：首页点卡片进游戏。

对应仓库：`https://github.com/Wonton99/moyu`（由原 `shudu` 顶替并改名）

## 游戏

| 游戏 | 版本 | 说明 |
|------|------|------|
| 死灵召唤师 | v0.5.9 | 动作 Roguelike，召唤亡灵清层 |
| 数独增量 | v0.9.0 | 休闲增量，解盘赚能量、挂机变强 |

## 本地运行

无需安装依赖。在**本仓库根目录**起一个静态服务即可（死灵召唤师用了 ES Module，需要 http，不能 `file://`）：

```powershell
cd "D:\MIMO work\游戏合集"
py -m http.server 8765
# 或
# npx --yes serve .
```

然后打开 `http://127.0.0.1:8765/`。

> 单独玩数独也可以直接双击 `games/sudoku/index.html`。

## 部署到 GitHub Pages

1. 在 GitHub 新建仓库（例如 `Wonton99/arcade` 或 `night-flight`）
2. 在本目录初始化并推送：

```powershell
cd "D:\MIMO work\游戏合集"
git init
git add .
git commit -m "feat: night flight game hub"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

3. 仓库 **Settings → Pages**：Source 选 `Deploy from a branch`，Branch 选 `main` / `/ (root)`
4. 等约 1 分钟，访问 `https://<用户名>.github.io/<仓库名>/`

### 用原数独仓库替代（已选此项）

本合集直接顶掉原 `shudu` 仓库：

```powershell
cd "D:\MIMO work\游戏合集"
git init
git add .
git commit -m "feat: moyu game hub replaces sudoku-only site"
git branch -M main
git remote add origin https://github.com/Wonton99/shudu.git
git push -u origin main --force
```

然后在 GitHub 网页 **Settings → Repository name** 改为 `moyu`（显示名「摸鱼」）。

> 原数独项目仍完整保留在 `D:\MIMO work\数独增量（小游戏）`。

## 目录结构

```
游戏合集/
  index.html          # 合集首页
  css/style.css
  js/portal.js
  assets/favicon.svg
  games/
    necromancer/      # 死灵召唤师
    sudoku/           # 数独增量
```

## 存档说明

两款游戏各自使用独立的 `localStorage` 键，互不覆盖。进度存在**本机浏览器**，换设备/清缓存会丢。

## License

各游戏保留其原有许可（数独增量为 MIT）。合集页 MIT。
