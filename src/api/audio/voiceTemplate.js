import request from '@/utils/request'

export function listVoiceTemplates() {
  return request({
    url: '/audio/voice/template',
    method: 'get'
  })
}

export function listVoiceRoles() {
  return request({
    url: '/audio/voice/template/roles',
    method: 'get'
  })
}

export function saveVoiceTemplate(data) {
  return request({
    url: '/audio/voice/template/save',
    method: 'post',
    data: data
  })
}

export function deleteVoiceTemplate(templateId) {
  return request({
    url: '/audio/voice/template/del/' + templateId,
    method: 'post'
  })
}
