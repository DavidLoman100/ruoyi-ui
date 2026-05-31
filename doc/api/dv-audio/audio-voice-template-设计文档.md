# 音色模板设计文档

> 更新时间：2026-05-30  
> 模块：dv-audio

## 设计目标
支持“角色名 -> AI 音色编码”的模板化配置，并可一次性保存多角色映射。

## 分层结构（已落地）
- `interfaces/controller`：只承接 HTTP 请求，不写业务规则。
- `application/service`：编排流程，负责 DTO 与领域对象的衔接。
- `application/assembler`：DTO ↔ 领域实体转换。
- `domain/service`：核心业务规则校验（模板名唯一、角色名去重、音色合法性等）。
- `domain/template/repository`：领域仓储接口。
- `infrastructure/repository/impl`：仓储实现，负责 MyBatis-Plus 数据访问。

## 接口设计
1. `POST /voice/template/save`
- 新增或编辑模板。
- 保存模板与多角色映射（明细全量替换）。

2. `POST /voice/template/del/{templateId}`
- 删除模板及其映射明细。

3. `GET /voice/template/roles`
- 返回固定可选音色枚举（豆包语音合成模型2.0）。

4. `GET /voice/template`
- 返回模板列表及每个模板的映射明细。

## 关键规则
- `mappings` 不能为空。
- 同一模板内 `roleName` 不允许重复。
- `speakerCode` 必须在 `DoubaoVoice20Enum` 支持范围内。
- 模板名全局唯一；编辑时排除自身记录校验。
- 删除模板时先删明细再删主表。

## 异常规范
统一使用 `BizException(AudioErrorEnum)` 抛出业务异常，便于前端按错误码处理。

## 网关访问
统一通过网关路径：`/audio/voice/template/**`
