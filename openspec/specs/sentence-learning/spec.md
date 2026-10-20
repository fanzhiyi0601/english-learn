# sentence-learning Specification

## Purpose
为 6 岁孩子提供常用英语句型的展示与整句发音，通过情景配图理解日常表达。

## Requirements

### Requirement: 句子主题浏览

系统 SHALL 将句子按主题分组（例如打招呼、日常用语），并允许用户在主题之间切换浏览。

#### Scenario: 展示句子主题
- **WHEN** 用户进入句子模块
- **THEN** 系统展示可选的句子主题列表

#### Scenario: 切换主题
- **WHEN** 用户选择某个句子主题
- **THEN** 系统展示该主题下的句子卡片

### Requirement: 句子卡片展示

系统 SHALL 以卡片形式展示句子，每个卡片包含情景配图与英文句子文本。

#### Scenario: 查看句子卡片
- **WHEN** 用户浏览某主题下的句子
- **THEN** 每个卡片展示情景配图与对应英文句子

### Requirement: 句子发音播放

系统 SHALL 在用户点击句子卡片时，通过浏览器内置语音合成（TTS）朗读整句。

#### Scenario: 点击句子播放发音
- **WHEN** 用户点击某个句子卡片
- **THEN** 系统通过浏览器 TTS 播放该句子的完整朗读

#### Scenario: 浏览器不支持语音合成
- **WHEN** 用户点击句子卡片但当前浏览器不支持语音合成
- **THEN** 系统不以错误提示打断使用，句子卡片内容仍正常展示
