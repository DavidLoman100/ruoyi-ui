import request from '@/utils/request'


export function pageQryLargeCost(data) {
  return request({
    url: '/system/largeCost/page/list',
    method: 'post',
    data: data
  })
}

export function addLargeCost(data) {
  return request({
    url: '/system/largeCost/add',
    method: 'post',
    data: data
  })
}

export function updLargeCost(data) {
  return request({
    url: '/system/largeCost/edit',
    method: 'post',
    data: data
  })
}

export function delLargeCost(id) {
  return request({
    url: '/system/largeCost/del/' + id,
    method: 'delete'
  })
}