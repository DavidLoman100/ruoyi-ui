import request from '@/utils/request'

export function createVoiceTask(data) {
  return request({
    url: '/audio/tasks',
    method: 'post',
    data: data
  })
}

export function getVoiceTask(taskId) {
  return request({
    url: '/audio/tasks/' + taskId,
    method: 'get'
  })
}

export function getVoiceTaskSegments(taskId) {
  return request({
    url: '/audio/tasks/' + taskId + '/segments',
    method: 'get'
  })
}

export function updateVoiceTaskSegmentText(taskId, segmentId, data) {
  return request({
    url: '/audio/tasks/' + taskId + '/segments/' + segmentId + '/text',
    method: 'post',
    data: data
  })
}

export function reorderVoiceTaskSegments(taskId, data) {
  return request({
    url: '/audio/tasks/' + taskId + '/segments/reorder',
    method: 'post',
    data: data
  })
}

export function deleteVoiceTaskSegment(taskId, segmentId) {
  return request({
    url: '/audio/tasks/' + taskId + '/segments/' + segmentId,
    method: 'delete'
  })
}

export function retryVoiceTaskSegment(taskId, segmentId) {
  return request({
    url: '/audio/tasks/' + taskId + '/segments/' + segmentId + '/retry',
    method: 'post'
  })
}

export function retryVoiceTask(taskId) {
  return request({
    url: '/audio/tasks/' + taskId + '/retry',
    method: 'post'
  })
}

export function retryAllVoiceTask(taskId) {
  return request({
    url: '/audio/tasks/' + taskId + '/retry-all',
    method: 'post'
  })
}

// Task-level audio resynthesis (retry all segments).
export function resynthesizeVoiceTask(taskId) {
  return request({
    url: '/audio/tasks/' + taskId + '/retry-all',
    method: 'post'
  })
}

export function cancelVoiceTask(taskId) {
  return request({
    url: '/audio/tasks/' + taskId + '/cancel',
    method: 'post'
  })
}

export function getVoiceTaskResult(taskId) {
  return request({
    url: '/audio/tasks/' + taskId + '/result',
    method: 'get'
  })
}

export function getVoiceTaskDownloadUrl(taskId) {
  return request({
    url: '/audio/tasks/' + taskId + '/download',
    method: 'get'
  })
}

export function pageVoiceTasks(params) {
  return request({
    url: '/audio/tasks/page',
    method: 'get',
    params: params
  })
}

export function deleteVoiceTask(taskId) {
  return request({
    url: '/audio/tasks/' + taskId,
    method: 'delete'
  })
}
