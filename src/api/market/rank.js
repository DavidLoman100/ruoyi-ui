import request from '@/utils/request'

// 分页查询场内基金交易排行
export function pageQueryFundExchangeRank(data) {
  return request({
    url: '/stock/fund/exchangeRank/page/list',
    method: 'post',
    data
  })
}

// 分页查询香港基金排行
export function pageQueryFundHkRank(data) {
  return request({
    url: '/stock/fund/hkRank/page/list',
    method: 'post',
    data
  })
}

// 分页查询货币基金排行
export function pageQueryFundMoneyRank(data) {
  return request({
    url: '/stock/fund/moneyRank/page/list',
    method: 'post',
    data
  })
}

// 分页查询理财基金排行
export function pageQueryFundFinancialRank(data) {
  return request({
    url: '/stock/fund/financialRank/page/list',
    method: 'post',
    data
  })
}
