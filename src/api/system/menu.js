import request from '@/utils/request'

// 查询菜单列表
export function qryMenu(data) {
  return request({
    url: '/system/menu/qry/list',
    method: 'post',
    data: data
  })
}

// 查询菜单详细
export function getMenu(menuId) {
  return request({
    url: '/system/menu/' + menuId,
    method: 'get'
  })
}

// 查询菜单树
export function getMenuTree(data) {
  return request({
    url: '/system/menu/tree/list',
    method: 'post',
    data: data
  })
}

// 菜单树 和 角色关联的菜单id
export function getMenuTreeByRole(roleId) {
  return request({
    url: '/system/menu/tree/' + roleId,
    method: 'get'
  })
}

// 新增菜单
export function addMenu(data) {
  return request({
    url: '/system/menu',
    method: 'post',
    data: data
  })
}

// 修改菜单
export function updateMenu(data) {
  return request({
    url: '/system/menu',
    method: 'put',
    data: data
  })
}

// 删除菜单
export function delMenu(menuId) {
  return request({
    url: '/system/menu/' + menuId,
    method: 'delete'
  })
}