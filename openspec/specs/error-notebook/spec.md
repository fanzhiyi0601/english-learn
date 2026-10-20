# error-notebook Specification

## Purpose

为 6 岁孩子记录所有回答失败的作答到一个错题本，并在顶部导航栏提供入口查看，仅作存储与展示而不提供改错重做。

## Requirements

### Requirement: 错题记录

系统 SHALL 在孩子每次回答失败时，将对应题目记录到错题本中。

#### Scenario: 答错被记录
- **WHEN** 孩子作答错误
- **THEN** 该题被记录到错题本

#### Scenario: 答对不被记录
- **WHEN** 孩子作答正确
- **THEN** 该题不进入错题本

### Requirement: 错题本入口

系统 SHALL 在顶部导航栏提供一个错题本入口，用户可进入查看错题列表。

#### Scenario: 顶部导航栏有入口
- **WHEN** 用户浏览页面
- **THEN** 顶部导航栏展示可点击的错题本入口

#### Scenario: 进入错题本
- **WHEN** 用户点击错题本入口
- **THEN** 系统展示已记录的错题列表

### Requirement: 错题展示

系统 SHALL 以列表形式展示错题本中的记录，便于孩子与家长查看。

#### Scenario: 展示错题内容
- **WHEN** 用户查看错题本
- **THEN** 每条错题展示题目内容与作答信息

### Requirement: 错题本地持久化

系统 SHALL 将错题记录保存到浏览器本地存储（localStorage），无需后端数据库。

#### Scenario: 刷新后错题保留
- **WHEN** 孩子答错后刷新或重开页面
- **THEN** 错题记录从本地恢复，不丢失
