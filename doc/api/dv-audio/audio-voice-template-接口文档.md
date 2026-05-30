# 音色模板接口文档

> 文档来源：`VoiceTemplateController`
> 更新时间：2026-05-30
> 模块：`dv-audio`

## 1. 路由说明
- Controller 基础路径：`/voice/template`
- 网关已配置前缀：`/audio/**`
- 前端实际调用路径：`/audio/voice/template/**`

## 2. 接口总览
| 接口 | 方法 | 服务直连路径 | 网关路径 |
|---|---|---|---|
| 新增角色音色映射模板 | POST | `/voice/template/add` | `/audio/voice/template/add` |
| 编辑角色音色映射 | POST | `/voice/template/edit` | `/audio/voice/template/edit` |
| 获取可选AI音色列表 | GET | `/voice/template/roles` | `/audio/voice/template/roles` |
| 查询模板列表 | GET | `/voice/template` | `/audio/voice/template` |

## 3. 统一响应结构
所有接口返回：`Response<T>`

```json
{
  "isSuccess": true,
  "code": 200,
  "message": "success",
  "data": {}
}
```

## 4. 接口明细

### 4.1 新增角色音色映射模板
- 方法：`POST`
- 路径：`/voice/template/add`
- Body：`AddRoleVoiceMappingRequest`

```json
{
  "templateName": "默认模板",
  "templateDescription": "默认角色配置",
  "roleName": "刘飞",
  "speakerCode": "zh_male_liufei_uranus_bigtts",
  "contextText": "请以温和语气播报"
}
```

请求字段：
- `templateName` string 必填
- `templateDescription` string 选填
- `roleName` string 必填
- `speakerCode` string 必填（AUDIO_VOICE_CODE）
- `contextText` string 选填

成功响应：`Response<Long>`（映射ID）

说明：
- 该接口只做新增，不做更新。
- 若同模板下同角色已存在映射，返回业务错误。

### 4.2 编辑角色音色映射
- 方法：`POST`
- 路径：`/voice/template/edit`
- Body：`EditRoleVoiceMappingRequest`

```json
{
  "id": 1001,
  "roleName": "刘飞",
  "speakerCode": "zh_male_liufei_uranus_bigtts",
  "contextText": "请以标准新闻播报语气",
  "templateDescription": "模板描述更新"
}
```

请求字段：
- `id` long 必填
- `roleName` string 选填（非空时更新）
- `speakerCode` string 必填（AUDIO_VOICE_CODE）
- `contextText` string 选填
- `templateDescription` string 选填（非空时更新模板描述）

成功响应：`Response<Long>`（映射ID）

### 4.3 获取可选AI音色列表
- 方法：`GET`
- 路径：`/voice/template/roles`

成功响应：`Response<List<VoiceOptionResponse>>`

`VoiceOptionResponse` 字段：
- `code` string 音色编码
- `msg` string 音色名称

### 4.4 查询模板列表
- 方法：`GET`
- 路径：`/voice/template`

成功响应：`Response<List<VoiceTemplateResponse>>`

`VoiceTemplateResponse` 字段：
- `templateId` long 模板ID
- `templateName` string 模板名称
- `description` string 模板描述
- `mappings` `List<RoleVoiceMappingResponse>` 角色映射

`RoleVoiceMappingResponse` 字段：
- `id` long 映射ID
- `roleName` string 角色名
- `speakerCode` string 音色编码
- `contextText` string 上下文提示词

## 5. 业务错误码（AudioErrorEnum）
- `12001` 参数校验异常
- `12002` 角色音色映射已存在
- `12003` 角色音色映射不存在
- `12004` 模板下角色名已存在