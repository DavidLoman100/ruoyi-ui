/**
 * 业务模块 API
 * 命名规范：listXxx, getXxx, addXxx, updateXxx, deleteXxx
 */
import request from '@/utils/request'

// ========== 主表 API ==========

/**
 * 分页查询列表
 * @param {Object} data - 查询参数 { pageNum, pageSize, ...业务参数 }
 * @returns {Promise}
 */
export function listXxx(data) {
  return request({
    url: '/xxx/xxx/page/list',
    method: 'post',
    data: data
  })
}

/**
 * 获取详情
 * @param {String|Number} id - 记录ID
 * @returns {Promise}
 */
export function getXxx(id) {
  return request({
    url: '/xxx/xxx/get/' + id,
    method: 'get'
  })
}

/**
 * 新增
 * @param {Object} data - 业务数据
 * @returns {Promise}
 */
export function addXxx(data) {
  return request({
    url: '/xxx/xxx/add',
    method: 'post',
    data: data
  })
}

/**
 * 修改
 * @param {Object} data - 业务数据
 * @returns {Promise}
 */
export function updateXxx(data) {
  return request({
    url: '/xxx/xxx/update',
    method: 'put',
    data: data
  })
}

/**
 * 删除
 * @param {String|Number} id - 记录ID
 * @returns {Promise}
 */
export function deleteXxx(id) {
  return request({
    url: '/xxx/xxx/delete/' + id,
    method: 'delete'
  })
}

// ========== 明细表 API ==========

/**
 * 分页查询明细列表
 * @param {Object} data - 查询参数 { id, pageNum, pageSize, ... }
 * @returns {Promise}
 */
export function listXxxDetail(data) {
  return request({
    url: '/xxx/xxx/detail/page/list',
    method: 'post',
    data: data
  })
}

/**
 * 获取明细详情
 * @param {String|Number} detailId - 明细ID
 * @returns {Promise}
 */
export function getXxxDetail(detailId) {
  return request({
    url: '/xxx/xxx/detail/get/' + detailId,
    method: 'get'
  })
}

// ========== OSS上传 API ==========

/**
 * OSS签名缓存Key
 */
const OSS_SIGN_CACHE_KEY = 'oss_sign_cache_xxx'
const OSS_SIGN_CACHE_TIME_KEY = 'oss_sign_cache_time_xxx'

/**
 * 从 localStorage 获取缓存
 */
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

/**
 * 存储缓存到 localStorage
 */
function setCacheToStorage(data, time) {
  try {
    localStorage.setItem(OSS_SIGN_CACHE_KEY, JSON.stringify(data))
    localStorage.setItem(OSS_SIGN_CACHE_TIME_KEY, time.toString())
  } catch (error) {
    console.warn('[OSS签名] 存储缓存失败:', error)
  }
}

/**
 * 清除 localStorage 缓存
 */
function clearCacheFromStorage() {
  try {
    localStorage.removeItem(OSS_SIGN_CACHE_KEY)
    localStorage.removeItem(OSS_SIGN_CACHE_TIME_KEY)
  } catch (error) {
    console.warn('[OSS签名] 清除缓存失败:', error)
  }
}

/**
 * 获取OSS上传签名（带缓存机制）
 * @param {String} moduleType - 模块类型
 * @param {Number} bufferMinutes - 缓冲时间（分钟），默认10分钟
 * @returns {Promise}
 */
export function getOssSignWithCache(moduleType, bufferMinutes = 10) {
  return new Promise((resolve, reject) => {
    const now = Date.now()
    
    // 1. 尝试从缓存获取
    const cached = getCacheFromStorage()
    if (cached && cached.data) {
      const expireTime = cached.data.expire * 1000
      const bufferTime = bufferMinutes * 60 * 1000
      
      if (now < (expireTime - bufferTime)) {
        console.log('[OSS签名] 使用缓存的签名')
        resolve(cached.data)
        return
      }
    }
    
    // 2. 缓存无效，重新获取签名
    getOssSign(moduleType).then(response => {
      if (response.code === 200 && response.data) {
        setCacheToStorage(response.data, now)
        resolve(response.data)
      } else {
        reject(new Error(response.msg || '获取上传签名失败'))
      }
    }).catch(error => {
      reject(error)
    })
  })
}

/**
 * 清除OSS签名缓存
 */
export function clearOssSignCache() {
  clearCacheFromStorage()
}

/**
 * 获取OSS上传签名（原始方法，无缓存）
 * @param {String} moduleType - 模块类型
 * @returns {Promise}
 */
export function getOssSign(moduleType) {
  return request({
    url: '/xxx/xxx/sign',
    method: 'get',
    params: { moduleType: moduleType }
  })
}

/**
 * 创建导入记录（前端直传OSS后）
 * @param {Object} data - { bizType, objectKey, fileName }
 * @returns {Promise}
 */
export function createXxxRecord(data) {
  return request({
    url: '/xxx/xxx/add',
    method: 'post',
    data: data
  })
}
