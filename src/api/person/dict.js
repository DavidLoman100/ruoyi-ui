import request from '@/utils/request'


export function pageQryDict(data) {
  return request({
    url: '/system/dict/page/list',
    method: 'post',
    data: data
  })
}

export function addDict(data) {
  return request({
    url: '/system/dict/add',
    method: 'post',
    data: data
  })
}

export function updDict(data) {
  return request({
    url: '/system/dict/edit',
    method: 'post',
    data: data
  })
}
