# 音色模板接口文档

> 更新时间：2026-05-30
> 模块：dv-audio

## 路由
- 基础路径：`/voice/template`
- 网关路径：`/audio/voice/template/**`

## 接口总览
- `POST /voice/template/save` 保存音色模板（多角色映射）
- `POST /voice/template/del/{templateId}` 删除音色模板
- `GET /voice/template/roles` 获取可选AI音色列表
- `GET /voice/template` 查询模板列表

## 1. 保存音色模板（主流程）
- 路径：`POST /voice/template/save`
- 请求类型：`SaveTemplateReq`

```json
{
  "templateId": null,
  "templateName": "对话模板A",
  "templateDescription": "角色配置",
  "mappings": [
    {"roleName":"甲","speakerCode":"zh_male_liufei_uranus_bigtts","contextText":"稳重"},
    {"roleName":"乙","speakerCode":"zh_female_xiaohe_uranus_bigtts","contextText":"活泼"}
  ]
}
```

说明：
- `templateId` 为空=新增，非空=编辑
- `mappings` 支持 1~N 条（单角色也走该接口）
- 明细保存策略：全量替换

### SaveTemplateReq 字段
- `templateId` Long，模板ID
- `templateName` String，模板名称（必填）
- `templateDescription` String，模板描述
- `mappings` `List<TemplateRoleMappingReq>`（必填）

### TemplateRoleMappingReq 字段
- `roleName` String，角色名（必填）
- `speakerCode` String，音色编码（必填）
- `contextText` String，上下文提示词

## 2. 删除音色模板
- 路径：`POST /voice/template/del/{templateId}`
- 说明：先删明细后删模板主表

## 3. 获取可选AI音色列表
- 路径：`GET /voice/template/roles`
- 返回：`Response<List<VoiceOptionResponse>>`

## 4. 查询模板列表
- 路径：`GET /voice/template`
- 返回：`Response<List<VoiceTemplateResponse>>`

## 错误码（AudioErrorEnum）
- `12001` 参数校验异常
- `12002` 角色音色映射已存在
- `12003` 角色音色映射不存在
- `12004` 模板下角色名已存在
- `12005` 音色模板不存在
- `12006` 音色模板名称已存在
- `12007` 模板映射不能为空