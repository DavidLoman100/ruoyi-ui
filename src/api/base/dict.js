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

export function delDict(dictId) {
  return request({
    url: '/system/dict/del/' + dictId,
    method: 'delete'
  })
}

export function pageQryDictDetail(data) {
  return request({
    url: '/system/dict/detail/page/list',
    method: 'post',
    data: data
  })
}

export function getDictDetail(dictCode) {
  return request({
    url: '/system/dict/detail/list/' + dictCode,
    method: 'get'
  })
}

export function addDictDetail(data) {
  return request({
    url: '/system/dict/detail/add',
    method: 'post',
    data: data
  })
}

export function updDictDetail(data) {
  return request({
    url: '/system/dict/detail/edit',
    method: 'post',
    data: data
  })
}

export function delDictDetail(dictId) {
  return request({
    url: '/system/dict/detail/del/' + dictId,
    method: 'delete'
  })
}

