# Spec Delta

## ADDED Requirements

### Requirement: 金币徽标正确显示

系统 SHALL 在金币徽标前显示一个可被当前系统正常渲染的金币/奖励符号，避免出现方框（tofu）。

#### Scenario: 徽标图标正常渲染
- **WHEN** 页面加载并展示金币徽标
- **THEN** 徽标前的奖励符号在常见浏览器/系统中正常显示，不出现方框占位

#### Scenario: 替代符号可展示
- **WHEN** 当前系统不支持个别特殊 emoji
- **THEN** 徽标采用广泛支持的符号或图形，保证可见
