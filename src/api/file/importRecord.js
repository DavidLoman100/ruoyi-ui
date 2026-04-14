import request from '@/utils/request'

// 查询导入记录
export function listImportRecord(data) {
  return request({
    url: '/file/fileImport/page/list',
    method: 'post',
    data: data
  })
}

// 获取导入记录详情
export function getImportRecord(importId) {
  return request({
    url: '/file/fileImport/get/' + importId,
    method: 'get'
  })
}

// 查询导入详情
export function listImportDetail(data) {
  return request({
    url: '/file/fileImport/detail/page/list',
    method: 'post',
    data: data
  })
}

// OSS签名缓存配置
const OSS_SIGN_CACHE_KEY = 'oss_sign_cache'
const OSS_SIGN_CACHE_TIME_KEY = 'oss_sign_cache_time'

// 从 localStorage 获取缓存
function getCacheFromStorage() {
  try {
    const cache = localStorage.getItem(OSS_SIGN_CACHE_KEY)
    const cacheTime = localStorage.getItem(OSS_SIGN_CACHE_TIME_KEY)
    if (cache && cacheTime) {
      return {
        data: JSON.parse(cache),
        time: parseInt(cacheTime)
      }
    }
  } catch (error) {
    console.warn('[OSS签名] 读取缓存失败:', error)
  }
  return null
}

// 存储缓存到 localStorage
function setCacheToStorage(data, time) {
  try {
    localStorage.setItem(OSS_SIGN_CACHE_KEY, JSON.stringify(data))
    localStorage.setItem(OSS_SIGN_CACHE_TIME_KEY, time.toString())
  } catch (error) {
    console.warn('[OSS签名] 存储缓存失败:', error)
  }
}

// 清除 localStorage 缓存
function clearCacheFromStorage() {
  try {
    localStorage.removeItem(OSS_SIGN_CACHE_KEY)
    localStorage.removeItem(OSS_SIGN_CACHE_TIME_KEY)
  } catch (error) {
    console.warn('[OSS签名] 清除缓存失败:', error)
  }
}

// 获取OSS上传签名（带缓存机制，优先使用后端返回的过期时间）
export function getOssSignWithCache(moduleType, bufferMinutes = 10) {
  return new Promise((resolve, reject) => {
    const now = Date.now()
    
    // 1. 尝试从缓存获取
    const cached = getCacheFromStorage()
    if (cached && cached.data) {
      // 优先使用后端返回的过期时间（秒级时间戳）
      const expireTime = cached.data.expire * 1000  // 转为毫秒
      const bufferTime = bufferMinutes * 60 * 1000  // 缓冲时间（默认10分钟）
      
      // 判断缓存是否有效（当前时间 < 过期时间 - 缓冲时间）
      if (now < (expireTime - bufferTime)) {
        console.log('[OSS签名] 使用缓存的签名（过期时间:', new Date(expireTime).toLocaleString(), ')')
        resolve(cached.data)
        return
      } else {
        console.log('[OSS签名] 缓存已过期（过期时间:', new Date(expireTime).toLocaleString(), ')')
      }
    }
    
    // 2. 缓存无效，重新获取签名
    console.log('[OSS签名] 从后端获取新签名')
    getOssSign(moduleType).then(response => {
      if (response.code === 200 && response.data) {
        // 存储到 localStorage
        setCacheToStorage(response.data, now)
        console.log('[OSS签名] 新签名已缓存，过期时间:', new Date(response.data.expire * 1000).toLocaleString())
        resolve(response.data)
      } else {
        reject(new Error(response.msg || '获取上传签名失败'))
      }
    }).catch(error => {
      reject(error)
    })
  })
}

// 清除OSS签名缓存
export function clearOssSignCache() {
  clearCacheFromStorage()
}

// 获取OSS上传签名（原始方法，无缓存）
export function getOssSign(moduleType) {
  return request({
    url: '/file/fileImport/sign',
    method: 'get',
    params: { moduleType: moduleType }
  })
}

// 创建导入记录(前端直传OSS后)
// 请求参数: { bizType, objectKey, fileName }
//   - bizType: 业务类型（如：stock、electricity）
//   - objectKey: OSS上的完整路径（含UUID文件名），如：uploads/stock/20260413/a1b2c3d4.xlsx
//   - fileName: 用户选择的原始文件名，如：电量表7-8月部分.xlsx
export function createImportRecord(data) {
  return request({
    url: '/file/fileImport/add',
    method: 'post',
    data: data
  })
}

// 上传导入文件(服务端代理)
export function uploadImportFile(bizType, file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/file/fileImport/upload',
    method: 'post',
    params: { bizType: bizType },
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
