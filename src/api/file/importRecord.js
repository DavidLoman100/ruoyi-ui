import request from '@/utils/request'

// 查询导入记录
export function listImportRecord(data) {
  return request({
    url: '/file/fileImport/records/query',
    method: 'post',
    data: data
  })
}

// 获取导入记录详情
export function getImportRecord(importId) {
  return request({
    url: '/file/fileImport/' + importId,
    method: 'get'
  })
}

// 查询导入详情
export function listImportDetail(importId, data) {
  return request({
    url: '/file/fileImport/' + importId + '/details/query',
    method: 'post',
    data: data
  })
}

// 获取OSS上传签名
export function getOssSign(moduleType) {
  return request({
    url: '/file/fileImport/sign',
    method: 'get',
    params: { moduleType: moduleType }
  })
}

// 创建导入记录(前端直传OSS后)
export function createImportRecord(data) {
  return request({
    url: '/file/fileImport/record',
    method: 'post',
    data: data
  })
}

// 上传导入文件(服务端代理)
export function uploadImportFile(dataType, file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/file/fileImport/upload',
    method: 'post',
    params: { dataType: dataType },
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
