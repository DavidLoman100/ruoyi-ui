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