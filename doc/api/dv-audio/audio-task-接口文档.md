# 音频任务接口文档

> 文档来源：`dv-modules/dv-audio` 当前代码
> 更新时间：2026-06-01
> 模块基础路径：`/tasks`
> 网关前缀：`/audio`
> 前端实际请求路径：`/audio/tasks/**`
> Knife4j：`http://{host}:{port}/doc.html`（按部署环境替换）
> Swagger JSON：`http://{host}:{port}/v3/api-docs`（按部署环境替换）

## 变更说明

- 2026-05-31：补充任务级重合接口说明（`retry`/`retry-all`）、角色分段输入格式、音频任务错误码 `12008/12009/12010`。
- 2026-06-01：补充单片段重跑接口（`segments/{segmentId}/retry`）；片段编辑/重排/删除、单片段重跑成功后任务状态回 `CREATED`；合并前增加全片段成功校验。
- 2026-06-01：调整重合语义：`retry-all` 改为“重新合成音频（仅合并，不请求豆包）”；`retry` 说明为“重跑所有非 SUCCESS 片段”。
- 2026-06-08：新增任务名称 `taskName`，创建时可选；未传时服务端从原始文本生成默认名称。

## 通用响应结构

所有接口均返回统一结构 `Response<T>`：

```json
{
  "isSuccess": true,
  "code": 200,
  "message": "success",
  "data": {}
}
```

字段说明：
- `isSuccess`：是否成功
- `code`：业务状态码（`200` 成功，其他为失败）
- `message`：提示信息
- `data`：业务数据

## 接口总览

| 接口名称 | 方法 | 路径（模块） | 路径（网关） | 说明 |
|---|---|---|---|---|
| 创建任务 | POST | `/tasks` | `/audio/tasks` | 创建音频合成任务并异步执行 |
| 查询任务详情 | GET | `/tasks/{taskId}` | `/audio/tasks/{taskId}` | 查询进度与结果摘要 |
| 查询片段列表 | GET | `/tasks/{taskId}/segments` | `/audio/tasks/{taskId}/segments` | 查询每段文本与分段音频信息 |
| 修改片段文案 | POST | `/tasks/{taskId}/segments/{segmentId}/text` | `/audio/tasks/{taskId}/segments/{segmentId}/text` | 保存片段文案，等待手动重跑 |
| 调整片段顺序 | POST | `/tasks/{taskId}/segments/reorder` | `/audio/tasks/{taskId}/segments/reorder` | 保存片段顺序，等待手动重跑 |
| 删除片段 | DELETE | `/tasks/{taskId}/segments/{segmentId}` | `/audio/tasks/{taskId}/segments/{segmentId}` | 删除片段并重排，等待手动重跑 |
| 重跑单个片段 | POST | `/tasks/{taskId}/segments/{segmentId}/retry` | `/audio/tasks/{taskId}/segments/{segmentId}/retry` | 仅重跑该片段，成功后任务回 `CREATED`，不触发整任务合并 |
| 重试失败片段 | POST | `/tasks/{taskId}/retry` | `/audio/tasks/{taskId}/retry` | 重跑所有非 SUCCESS 片段（请求豆包） |
| 重新合成音频 | POST | `/tasks/{taskId}/retry-all` | `/audio/tasks/{taskId}/retry-all` | 仅合并已有片段并上传最终音频（不请求豆包） |
| 取消任务 | POST | `/tasks/{taskId}/cancel` | `/audio/tasks/{taskId}/cancel` | 将任务置为取消状态 |
| 获取任务结果 | GET | `/tasks/{taskId}/result` | `/audio/tasks/{taskId}/result` | 获取播放/下载地址、时长、大小 |
| 获取下载地址 | GET | `/tasks/{taskId}/download` | `/audio/tasks/{taskId}/download` | 返回最终音频下载地址 |
| 分页查询任务 | GET | `/tasks/page` | `/audio/tasks/page` | 按条件分页查询任务 |
| 删除任务 | DELETE | `/tasks/{taskId}` | `/audio/tasks/{taskId}` | 删除任务及关联数据 |

## 1. 创建任务

- 方法：`POST`
- 路径：`/audio/tasks`
- 请求体：`CreateTaskReqDTO`

```json
{
  "taskName": "播客开场",
  "rawText": "[甲]\n你好\n[乙]\n你好\n[甲]\n开始今天的播客",
  "templateId": 1
}
```

字段说明：
- `rawText` String，必填，待合成原始对话文本
- `templateId` Long，必填，音色模板 ID
- `taskName` String，选填，任务名称；为空时服务端自动生成

成功响应（示例）：

```json
{
  "isSuccess": true,
  "code": 200,
  "message": "success",
  "data": {
    "taskId": 1001,
    "taskNo": "AUDIO_1748650000000_ab12cd34",
    "taskName": "播客开场"
  }
}
```

## 2. 查询任务详情

- 方法：`GET`
- 路径：`/audio/tasks/{taskId}`

返回核心字段：
- `taskId` 任务ID
- `taskNo` 任务编号
- `taskName` 任务名称
- `templateId` 模板ID
- `status` 任务状态（`CREATED`/`SYNTHESIZING`/`MERGING`/`SUCCESS`/`FAILED`/`CANCELED`）
- `totalSegments` 总片段数
- `successSegments` 成功片段数
- `failedSegments` 失败片段数
- `progressPercent` 进度百分比
- `finalOssUrl` 最终音频地址
- `finalDurationMs` 最终音频时长
- `errorMsg` 错误信息

## 3. 查询片段列表

- 方法：`GET`
- 路径：`/audio/tasks/{taskId}/segments`

返回数组字段：
- `segmentId` 片段ID
- `segmentNo` 片段序号
- `roleName` 角色名
- `speakerCode` 音色编码
- `textContent` 片段文本
- `status` 片段状态
- `retryCount` 重试次数
- `errorMsg` 错误信息
- `requestId` 合成请求ID
- `ossUrl` 片段音频地址
- `durationMs` 片段时长

## 4. 重试失败片段

- 方法：`POST`
- 路径：`/audio/tasks/{taskId}/retry`
- 说明：处理当前状态非 `SUCCESS` 的片段（例如 `FAILED/PENDING`）；成功片段会复用并最终重新合并。
- 返回：`Response<String>`，`data` 示例：`"Failed segment retry submitted."`

## 5. 修改片段文案

- 方法：`POST`
- 路径：`/audio/tasks/{taskId}/segments/{segmentId}/text`
- 请求体：

```json
{
  "textContent": "更新后的片段文案"
}
```

- 说明：仅保存修改并将任务标记为待重跑，不自动触发合成。
- 返回：`Response<String>`，`data` 示例：`"Segment text saved. Trigger recomposition manually."`

## 6. 调整片段顺序

- 方法：`POST`
- 路径：`/audio/tasks/{taskId}/segments/reorder`
- 请求体：

```json
{
  "segmentIds": [3003, 3001, 3002]
}
```

- 说明：`segmentIds` 必须包含该任务全部片段且不重复，仅保存顺序，不自动触发合成。
- 返回：`Response<String>`，`data` 示例：`"Segment order saved. Trigger recomposition manually."`

## 7. 删除片段

- 方法：`DELETE`
- 路径：`/audio/tasks/{taskId}/segments/{segmentId}`
- 说明：删除后会自动重排片段序号，仅保存结果，不自动触发合成。
- 返回：`Response<String>`，`data` 示例：`"Segment deleted. Trigger recomposition manually."`

## 8. 重新合成音频

- 方法：`POST`
- 路径：`/audio/tasks/{taskId}/retry-all`
- 说明：
  - 不请求豆包，不重跑任何片段；
  - 仅基于 `audio_segment_file` 中已有的片段音频做最终合并并上传 OSS；
  - 前提：任务下所有片段状态必须为 `SUCCESS`，否则拒绝合并。
- 返回：`Response<String>`，`data` 示例：`"Audio recomposition submitted."`

## 9. 重跑单个片段

- 方法：`POST`
- 路径：`/audio/tasks/{taskId}/segments/{segmentId}/retry`
- 说明：仅请求该片段豆包重跑并更新该片段音频，不触发最终合并；成功后任务状态会置为待重新合成（`CREATED`）。
- 返回：`Response<String>`，`data` 示例：`"Single segment retry submitted."`

## 10. 取消任务

- 方法：`POST`
- 路径：`/audio/tasks/{taskId}/cancel`
- 说明：将任务状态置为 `CANCELED`；异步线程在关键节点检测并退出。

## 11. 获取任务结果

- 方法：`GET`
- 路径：`/audio/tasks/{taskId}/result`

返回字段：
- `taskId`
- `taskNo`
- `taskName`
- `templateId`
- `status`
- `playUrl` 播放地址
- `downloadUrl` 下载地址
- `durationMs` 时长
- `fileSize` 文件大小（bytes）

## 12. 获取下载地址

- 方法：`GET`
- 路径：`/audio/tasks/{taskId}/download`
- 返回：`Response<String>`，`data` 即最终音频地址。

## 13. 分页查询任务

- 方法：`GET`
- 路径：`/audio/tasks/page`
- Query 参数：
  - `pageNum` Long，页码，默认 1
  - `pageSize` Long，每页条数，默认 10
  - `status` String，任务状态（可选）
  - `templateId` Long，模板ID（可选）
  - `taskNo` String，任务编号（可选，模糊匹配）
  - `taskName` String，任务名称（可选，模糊匹配）

返回字段：
- `total` 总条数
- `records` 列表，元素包含：`taskId/taskNo/taskName/templateId/status/finalOssUrl/finalDurationMs/errorMsg/createTime`

## 14. 删除任务

- 方法：`DELETE`
- 路径：`/audio/tasks/{taskId}`
- 说明：删除任务主记录及关联分片、日志、任务产物记录。

## 错误码说明（与音频模块一致）

- `12001` 参数错误
- `12005` 模板不存在
- `12007` 模板映射不能为空
- `12008` 未匹配到模板角色（文本角色标记与模板 `roleName` 不一致）
- `12009` 任务正在处理中，请勿重复操作
- `12010` 当前任务状态不支持此操作
- 其他异常按通用错误码返回

## 对接注意事项

1. `createTask` 只需传 `rawText + templateId`，不需要前端传 `sectionId`。
2. 文本按模板角色标记直接分段，角色标记可单独一行，也可后面直接跟正文：
   ```text
   [甲] 第一段内容
   [乙]
   第二段内容
   [甲]
   第三段内容
   ```
3. 编辑/重排/删除片段后，任务状态会重置为 `CREATED`；前端可在完成片段重跑后调用一次 `retry-all` 进行任务级重新合成。
4. 合并前服务端会强校验所有片段状态必须为 `SUCCESS`，否则拒绝合并并返回未成功片段序号。
5. 最终音频可直接用 `playUrl` 在前端 `<audio>` 预览，无需强制下载。
6. 文件路径规则：`audio/yyyyMMdd/{sectionId}/...`（由服务端生成并上传）。
