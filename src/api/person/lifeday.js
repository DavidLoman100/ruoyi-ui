import request from '@/utils/request'


export function pageQryLifeDay(data) {
  return request({
    url: '/system/lifeDay/page/list',
    method: 'post',
    data: data
  })
}

export function addLifeDay(data) {
  return request({
    url: '/system/lifeDay/add',
    method: 'post',
    data: data
  })
}

export function updLifeDay(data) {
  return request({
    url: '/system/lifeDay/edit',
    method: 'post',
    data: data
  })
}