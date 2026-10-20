# 动画资源目录

将你选定的英文动画视频文件命名为 `english-demo.mp4` 放到本目录即可。

当前 `assets/english-demo.mp4` 为占位路径:若文件缺失或无法加载,
页面会显示"🎬 暂无可播放动画"的占位提示(优雅降级),不影响其他功能。

后续接入后端内容库时,替换 `src/data.js` 中 `ANIMATIONS` 的 `src` 指向即可,
无需改动播放逻辑(src/render.js)。
