# 音色模板模块设计文档

> 文档来源：`VoiceTemplateController` + `AudioVoiceTemplateService`
> 更新时间：2026-05-30
> 模块：`dv-audio`

## 1. 设计目标
提供“角色 -> AI音色编码”的模板化配置能力，支持新增、编辑、查询与音色列表下发。

## 2. 核心数据模型
- 主表：`audio_voice_template`
- 明细表：`audio_voice_template_item`
- 关联关系：主表 `id` 对应明细表 `template_id`

## 3. 接口职责划分
- `POST /voice/template/add`：仅新增映射
- `POST /voice/template/edit`：仅编辑映射
- `GET /voice/template/roles`：查询可选音色
- `GET /voice/template`：查询模板+映射明细

## 4. 关键业务规则
1. `speakerCode` 必须在 `DoubaoVoice20Enum` 支持范围内。
2. 新增接口不做更新：同 `templateName + roleName` 已存在时直接报错。
3. 编辑接口按 `id` 更新，`id` 不存在时报错。
4. 编辑角色名时，同模板下角色名不能重复。

## 5. 异常规范
模板服务统一抛出 `BizException(AudioErrorEnum)`：
- `12001` 参数校验异常
- `12002` 角色音色映射已存在
- `12003` 角色音色映射不存在
- `12004` 模板下角色名已存在

## 6. 网关接入
网关已新增 `dv-audio` 路由：

```yaml
- id: dv-audio
  uri: lb://dv-audio
  predicates:
    - Path=/audio/**
  filters:
    - StripPrefix=1
```

前端通过网关调用：`/audio/voice/template/**`。

## 7. 后续建议
1. 增加模板删除接口（含明细清理策略）。
2. 增加映射删除接口。
3. 在接口文档中补充完整错误响应示例。