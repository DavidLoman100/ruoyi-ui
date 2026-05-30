# 音色模板设计文档

> 更新时间：2026-05-30
> 模块：dv-audio

## 设计结论
模板配置统一采用“多角色映射保存”模式：
- 一次提交一个模板的全部角色映射
- 单角色模板同样通过 `save` 提交（`mappings` 仅 1 条）

## 接口
1. `POST /voice/template/save`
- 新增/编辑模板
- 保存多角色映射（全量替换）

2. `POST /voice/template/del/{templateId}`
- 删除模板（级联删明细）

3. `GET /voice/template/roles`
- 查询可选音色

4. `GET /voice/template`
- 查询模板列表及映射明细

## 关键约束
- `mappings` 非空
- `speakerCode` 必须在 `DoubaoVoice20Enum` 支持范围
- 同模板内 `roleName` 不重复
- 模板名全局唯一（编辑时排除自身）

## 异常规范
统一抛 `BizException(AudioErrorEnum)`。

## 网关
前端统一走：`/audio/voice/template/**`