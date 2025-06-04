import request from '@/utils/request'


// export function pageQryRole(query) {
//   return request({
//     url: '/system/role/list',
//     method: 'get',
//     params: query
//   })
// }

// 查询角色列表
export function pageQryRole(data) {
  return request({
    url: '/system/role/page/list',
    method: 'post',
    data: data
  })
}

// 查询角色详细
export function getRole(roleId) {
  return request({
    url: '/system/role/' + roleId,
    method: 'get'
  })
}

// 新增角色
export function addRole(data) {
  return request({
    url: '/system/role/add',
    method: 'post',
    data: data
  })
}

// 修改角色
export function updateRole(data) {
  return request({
    url: '/system/role/edit',
    method: 'put',
    data: data
  })
}

// 角色数据权限
export function dataScope(data) {
  return request({
    url: '/system/role/updDataScope',
    method: 'put',
    data: data
  })
}

// 角色状态修改
export function changeRoleStatus(roleId, status) {
  const data = {
    roleId,
    status
  }
  return request({
    url: '/system/role/changeStatus',
    method: 'put',
    data: data
  })
}

// 删除角色
export function delRole(roleId) {
  return request({
    url: '/system/role/del/' + roleId,
    method: 'delete'
  })
}

// 查询角色已授权用户列表
export function allocatedUserList(query) {
  return request({
    url: '/system/role/authUser/allocatedList',
    method: 'get',
    params: query
  })
}

// 查询角色的用户列表 (已授权/未授权)
export function pageQryUserRole(data) {
  return request({
    url: '/system/user/role/page/list',
    method: 'post',
    data: data
  })
}


// 角色取消授权用户
export function revokeAuthUser(data) {
  return request({
    url: '/system/role/revokeAuthUser',
    method: 'post',
    data: data
  })
}

// 角色授权用户
export function roleAuthUser(data) {
  return request({
    url: '/system/role/roleAuthUser',
    method: 'post',
    data: data
  })
}

// 根据角色ID查询部门树结构
export function deptTreeSelect(roleId) {
  return request({
    url: '/system/role/deptTree/' + roleId,
    method: 'get'
  })
}
