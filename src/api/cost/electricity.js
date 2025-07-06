import request from '@/utils/request'

export function pageQryElectricityCost(data) {
  return request({
    url: '/system/electricityCost/page/list',
    method: 'post',
    data: data
  })
}

export function addElectricityCost(data) {
  return request({
    url: '/system/electricityCost/add',
    method: 'post',
    data: data
  })
}

export function updElectricityCost(data) {
  return request({
    url: '/system/electricityCost/edit',
    method: 'post',
    data: data
  })
}

export function uploadElectricityCost(data) {
  return request({
    url: '/system/electricityCost/upload',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'multipart/form-data'  // 声明为多部分表单
    },
    transformRequest: [(data) => data]  //
  })
  
}